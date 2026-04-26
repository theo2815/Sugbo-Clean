import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const SCALE_STEP = 0.25;

export default function ImageViewer({ images, initialIndex = 0, onClose }) {
  const open = Array.isArray(images) && images.length > 0;
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const panStartRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => { setScale(1); setTranslate({ x: 0, y: 0 }); }, [index]);
  useEffect(() => { if (scale === 1) setTranslate({ x: 0, y: 0 }); }, [scale]);
  useEffect(() => { if (open) setIndex(initialIndex); }, [open, initialIndex]);

  const handleClose = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    onClose?.();
  }, [onClose]);

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)));
  }, []);
  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)));
  }, []);
  const handleReset = useCallback(() => setScale(1), []);

  const hasMany = open && images.length > 1;
  const handlePrev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images]);
  const handleNext = useCallback(() => setIndex((i) => (i + 1) % images.length), [images]);

  const handleToggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  }, []);

  useEffect(() => {
    function onFsChange() { setIsFullscreen(!!document.fullscreenElement); }
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape' && !document.fullscreenElement) handleClose();
      else if (e.key === '+' || e.key === '=') handleZoomIn();
      else if (e.key === '-') handleZoomOut();
      else if (e.key === '0') handleReset();
      else if (e.key === 'ArrowLeft' && hasMany) handlePrev();
      else if (e.key === 'ArrowRight' && hasMany) handleNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, hasMany, handleClose, handleZoomIn, handleZoomOut, handleReset, handlePrev, handleNext]);

  // Lock body scroll while open so wheel-zoom can't scroll the page behind.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Wheel zoom needs passive:false to call preventDefault — React's onWheel is passive.
  useEffect(() => {
    if (!open) return;
    const stage = stageRef.current;
    if (!stage) return;
    function onWheel(e) {
      e.preventDefault();
      if (e.deltaY < 0) handleZoomIn();
      else handleZoomOut();
    }
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [open, handleZoomIn, handleZoomOut]);

  // Pan via window-level mousemove/up so the drag survives the cursor leaving the image.
  useEffect(() => {
    if (!isPanning) return;
    function onMove(e) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setTranslate({ x: panStartRef.current.tx + dx, y: panStartRef.current.ty + dy });
    }
    function onUp() { setIsPanning(false); }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isPanning]);

  function handlePanStart(e) {
    if (scale <= 1) return;
    e.preventDefault();
    panStartRef.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
    setIsPanning(true);
  }

  if (!open) return null;
  const current = images[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current?.name || 'Image preview'}
      style={styles.backdrop}
      onClick={handleClose}
    >
      <div ref={containerRef} style={styles.container} onClick={(e) => e.stopPropagation()}>
        <header style={styles.header}>
          <div style={styles.title}>
            <span style={styles.fileName}>{current?.name || ''}</span>
            {hasMany && (
              <span style={styles.counter}>{index + 1} / {images.length}</span>
            )}
          </div>
          <div style={styles.toolbar}>
            <ToolBtn onClick={handleZoomOut} title="Zoom out (−)" disabled={scale <= MIN_SCALE}>
              <ZoomOut size={16} />
            </ToolBtn>
            <span style={styles.zoomLabel}>{Math.round(scale * 100)}%</span>
            <ToolBtn onClick={handleZoomIn} title="Zoom in (+)" disabled={scale >= MAX_SCALE}>
              <ZoomIn size={16} />
            </ToolBtn>
            <ToolBtn onClick={handleReset} title="Reset zoom (0)" disabled={scale === 1}>
              <RotateCcw size={16} />
            </ToolBtn>
            <ToolBtn onClick={handleToggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </ToolBtn>
            <ToolBtn onClick={handleClose} title="Close (Esc)">
              <X size={16} />
            </ToolBtn>
          </div>
        </header>

        <div ref={stageRef} style={styles.stage}>
          {hasMany && (
            <button
              type="button"
              onClick={handlePrev}
              style={{ ...styles.navBtn, left: 12 }}
              aria-label="Previous image"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          <img
            src={current.url}
            alt={current.name || ''}
            draggable={false}
            onMouseDown={handlePanStart}
            style={{
              ...styles.image,
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              transition: isPanning ? 'none' : 'transform 120ms ease',
              cursor: scale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in',
            }}
            onDoubleClick={scale === 1 ? handleZoomIn : handleReset}
          />
          {hasMany && (
            <button
              type="button"
              onClick={handleNext}
              style={{ ...styles.navBtn, right: 12 }}
              aria-label="Next image"
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ children, onClick, title, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        ...styles.toolBtn,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}

const styles = {
  backdrop: {
    // 1210 to sit above the ReportDetailDrawer (1200) when opened from inside it.
    position: 'fixed', inset: 0, zIndex: 1210,
    background: 'rgba(2, 6, 23, 0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
  },
  container: {
    background: '#0F172A',
    borderRadius: 12,
    width: 'min(1200px, 100%)',
    height: 'min(90vh, 900px)',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.45)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px',
    background: 'rgba(15, 23, 42, 0.95)',
    borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
    gap: 12, flexWrap: 'wrap',
  },
  title: { display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 },
  fileName: {
    color: '#F8FAFC', fontSize: 13, fontWeight: 600,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    maxWidth: 360,
  },
  counter: { color: '#94A3B8', fontSize: 12, fontVariantNumeric: 'tabular-nums' },
  toolbar: { display: 'inline-flex', alignItems: 'center', gap: 4 },
  toolBtn: {
    background: 'transparent',
    border: '1px solid rgba(148, 163, 184, 0.25)',
    color: '#E2E8F0',
    padding: 6,
    borderRadius: 8,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  zoomLabel: {
    color: '#CBD5E1', fontSize: 12, padding: '0 6px',
    minWidth: 44, textAlign: 'center', fontVariantNumeric: 'tabular-nums',
  },
  stage: {
    position: 'relative',
    flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    background: '#020617',
  },
  image: {
    maxWidth: '100%', maxHeight: '100%',
    objectFit: 'contain',
    userSelect: 'none',
  },
  navBtn: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    background: 'rgba(15, 23, 42, 0.7)',
    color: '#F8FAFC',
    border: '1px solid rgba(148, 163, 184, 0.25)',
    width: 40, height: 40, borderRadius: '50%',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
};
