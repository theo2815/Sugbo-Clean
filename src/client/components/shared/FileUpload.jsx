import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { UploadCloud, X, Image as ImageIcon, FileText } from 'lucide-react';
import { COLORS } from '../../../utils/constants';

const STYLE_ID = 'sugbo-fileupload-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const tag = document.createElement('style');
  tag.id = STYLE_ID;
  tag.textContent = `
    @keyframes sugboFileUploadPop {
      from { opacity: 0; transform: scale(0.96); }
      to   { opacity: 1; transform: scale(1); }
    }
    .sugbo-fu-zone {
      transition: border-color 140ms ease, background-color 140ms ease, box-shadow 140ms ease;
    }
    .sugbo-fu-zone:hover:not([data-disabled="true"]) {
      border-color: ${COLORS.primary};
      background-color: ${COLORS.primaryLight}33;
    }
    .sugbo-fu-zone:focus-visible {
      outline: 2px solid ${COLORS.primary};
      outline-offset: 2px;
    }
    .sugbo-fu-zone[data-dragging="true"] {
      border-color: ${COLORS.primary};
      background-color: ${COLORS.primaryLight}66;
      box-shadow: 0 0 0 4px ${COLORS.primaryLight};
    }
    .sugbo-fu-preview {
      animation: sugboFileUploadPop 160ms cubic-bezier(0.16, 1, 0.3, 1);
    }
    .sugbo-fu-remove:hover {
      background-color: ${COLORS.error}1A;
      color: ${COLORS.error};
    }
  `;
  document.head.appendChild(tag);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Loose `accept` matcher — handles "image/*", explicit MIME, or .ext suffixes.
function matchesAccept(file, accept) {
  if (!accept) return true;
  const tokens = accept.split(',').map((s) => s.trim()).filter(Boolean);
  return tokens.some((token) => {
    if (token.endsWith('/*')) {
      const prefix = token.slice(0, -1);
      return file.type.startsWith(prefix);
    }
    if (token.startsWith('.')) {
      return file.name.toLowerCase().endsWith(token.toLowerCase());
    }
    return file.type === token;
  });
}

export default function FileUpload({
  value = null,
  onChange,
  accept,
  maxSizeMB,
  label,
  name,
  helperText,
  disabled = false,
  error,
  required = false,
  style,
}) {
  const reactId = useId();
  const inputId = `${reactId}-input`;
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Generate / revoke a preview URL for image files. Without revoke we leak a
  // blob handle each time the user re-picks.
  useEffect(() => {
    if (value && value.type && value.type.startsWith('image/')) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
    return undefined;
  }, [value]);

  const validateAndSet = useCallback((file) => {
    if (!file) {
      setLocalError(null);
      onChange?.(null);
      return;
    }
    if (accept && !matchesAccept(file, accept)) {
      setLocalError(
        accept === 'image/*'
          ? 'Please select an image file.'
          : `File type not allowed. Accepted: ${accept}.`
      );
      return;
    }
    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`File must be ${maxSizeMB} MB or smaller.`);
      return;
    }
    setLocalError(null);
    onChange?.(file);
  }, [accept, maxSizeMB, onChange]);

  function onInputChange(e) {
    validateAndSet(e.target.files?.[0] ?? null);
  }

  function openPicker() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function onZoneKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  }

  // ── Drag and drop ────────────────────────────────────────────────────
  function onDragOver(e) {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!dragging) setDragging(true);
  }
  function onDragLeave(e) {
    // Only clear when leaving the dropzone itself, not its children.
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragging(false);
  }
  function onDrop(e) {
    if (disabled) return;
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSet(file);
  }

  function clear(e) {
    e?.stopPropagation();
    setLocalError(null);
    onChange?.(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const displayError = localError || error;
  const hasFile = Boolean(value);
  const isImage = value && value.type && value.type.startsWith('image/');

  return (
    <div style={{ marginBottom: label || displayError ? 16 : 0, ...style }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            marginBottom: 6,
            fontSize: 14,
            fontWeight: 500,
            color: COLORS.text.primary,
          }}
        >
          {label}{required ? ' *' : ''}
        </label>
      )}

      {/* Hidden native input — owns the file selection + form name. */}
      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="file"
        accept={accept}
        disabled={disabled}
        required={required && !hasFile}
        onChange={onInputChange}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          border: 0,
        }}
      />

      {!hasFile && (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={label ? `Upload ${label.toLowerCase()}` : 'Upload file'}
          aria-invalid={Boolean(displayError) || undefined}
          data-disabled={disabled}
          data-dragging={dragging}
          className="sugbo-fu-zone"
          onClick={openPicker}
          onKeyDown={onZoneKeyDown}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '20px 16px',
            border: `1.5px dashed ${displayError ? COLORS.error : COLORS.border}`,
            borderRadius: 12,
            background: disabled ? COLORS.bg.muted : COLORS.bg.card,
            color: COLORS.text.secondary,
            cursor: disabled ? 'not-allowed' : 'pointer',
            textAlign: 'center',
          }}
        >
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: COLORS.primaryLight,
            color: COLORS.primary,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <UploadCloud size={20} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text.primary }}>
              <span style={{ color: COLORS.primary }}>Click to upload</span>
              <span style={{ color: COLORS.text.muted, fontWeight: 500 }}> or drag and drop</span>
            </div>
            {helperText && (
              <div style={{ fontSize: 12, color: COLORS.text.muted, marginTop: 2 }}>
                {helperText}
              </div>
            )}
          </div>
        </div>
      )}

      {hasFile && (
        <div
          className="sugbo-fu-preview"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 10,
            border: `1px solid ${displayError ? COLORS.error : COLORS.border}`,
            borderRadius: 12,
            background: COLORS.bg.card,
          }}
        >
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 10,
            overflow: 'hidden',
            flexShrink: 0,
            background: COLORS.bg.muted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.text.muted,
          }}>
            {isImage && previewUrl ? (
              <img
                src={previewUrl}
                alt={value.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : isImage ? (
              <ImageIcon size={22} />
            ) : (
              <FileText size={22} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: COLORS.text.primary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {value.name}
            </div>
            <div style={{ fontSize: 12, color: COLORS.text.muted, marginTop: 2 }}>
              {formatBytes(value.size)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openPicker(); }}
              disabled={disabled}
              style={{
                background: 'transparent',
                border: `1px solid ${COLORS.border}`,
                color: COLORS.text.secondary,
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              Replace
            </button>
            <button
              type="button"
              className="sugbo-fu-remove"
              onClick={clear}
              disabled={disabled}
              aria-label="Remove file"
              style={{
                background: 'transparent',
                border: 'none',
                color: COLORS.text.muted,
                padding: 6,
                borderRadius: 8,
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {displayError && (
        <p role="alert" style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.error }}>
          {displayError}
        </p>
      )}
    </div>
  );
}
