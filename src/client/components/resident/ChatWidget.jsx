import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';
import { COLORS } from '../../../utils/constants';
import { useChat } from '../../../context/ChatContext';

const SEEDED_PROMPTS = [
    'When is the next pickup in Labangon?',
    'Asa nga bin para sa baterya?',
    'How do I report a missed collection?',
    'What waste do you collect?',
];

function TypingDots() {
    return (
        <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }} aria-label="Assistant is typing">
            <span style={dotStyle(0)} />
            <span style={dotStyle(1)} />
            <span style={dotStyle(2)} />
            <style>{`
                @keyframes scChatDot {
                    0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
                    40% { opacity: 1; transform: translateY(-3px); }
                }
            `}</style>
        </span>
    );
}

function dotStyle(i) {
    return {
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: COLORS.text.muted,
        animation: `scChatDot 1.2s ${i * 0.15}s infinite ease-in-out`,
        display: 'inline-block',
    };
}

export default function ChatWidget() {
    const { open, setOpen, messages, input, setInput, sending, send, reset } = useChat();
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );
    const navigate = useNavigate();
    const listRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        if (!listRef.current) return;
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages, sending, open]);

    useEffect(() => {
        if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    const showSeeded = messages.length === 1;

    return (
        <>
            {!open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label="Open SugboClean assistant"
                    style={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: COLORS.primary,
                        color: '#fff',
                        border: 'none',
                        boxShadow: '0 6px 20px rgba(22,163,74,0.35)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 50,
                    }}
                >
                    <MessageCircle size={24} />
                </button>
            )}

            {open && (
                <div
                    role="dialog"
                    aria-label="SugboClean assistant"
                    style={isMobile ? mobilePanelStyle : desktopPanelStyle}
                >
                    <header style={headerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Sparkles size={18} />
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 15 }}>Ask SugboClean</div>
                                <div style={{ fontSize: 11, opacity: 0.85 }}>Schedules, sorting, and app help</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                                type="button"
                                onClick={reset}
                                aria-label="Reset conversation"
                                title="Reset conversation"
                                style={iconBtnStyle}
                            >
                                <RotateCcw size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label="Close assistant"
                                style={iconBtnStyle}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </header>

                    <div ref={listRef} style={listStyle}>
                        {messages.map((m, i) => (
                            <div key={i} style={m.role === 'user' ? userRowStyle : botRowStyle}>
                                <div style={m.role === 'user' ? userBubbleStyle : botBubbleStyle(m.error)}>
                                    {m.text}
                                </div>
                                {m.role === 'bot' && m.action && (
                                    <button
                                        type="button"
                                        onClick={() => { navigate(m.action.to); setOpen(false); }}
                                        style={actionBtnStyle}
                                    >
                                        {m.action.label} <ArrowRight size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {sending && (
                            <div style={botRowStyle}>
                                <div style={botBubbleStyle(false)}>
                                    <TypingDots />
                                </div>
                            </div>
                        )}
                    </div>

                    {showSeeded && !sending && (
                        <div style={seededWrapStyle}>
                            {SEEDED_PROMPTS.map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => send(p)}
                                    style={chipStyle}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}

                    <div style={inputRowStyle}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder="Ask a question…"
                            rows={1}
                            maxLength={500}
                            style={inputStyle}
                        />
                        <button
                            type="button"
                            onClick={() => send()}
                            disabled={!input.trim() || sending}
                            aria-label="Send message"
                            style={{
                                ...sendBtnStyle,
                                opacity: !input.trim() || sending ? 0.5 : 1,
                                cursor: !input.trim() || sending ? 'not-allowed' : 'pointer',
                            }}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

const desktopPanelStyle = {
    position: 'fixed',
    bottom: 24,
    right: 24,
    width: 360,
    maxHeight: 'min(560px, calc(100vh - 48px))',
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 12px 40px rgba(15,23,42,0.22)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 50,
    border: `1px solid ${COLORS.border || '#E2E8F0'}`,
};

const mobilePanelStyle = {
    position: 'fixed',
    bottom: 16,
    left: 16,
    right: 16,
    maxHeight: 'calc(100vh - 120px)',
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 12px 40px rgba(15,23,42,0.28)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 50,
    border: `1px solid ${COLORS.border || '#E2E8F0'}`,
};

const headerStyle = {
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
    color: '#fff',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: '0 0 auto',
};

const iconBtnStyle = {
    background: 'rgba(255,255,255,0.18)',
    color: '#fff',
    border: 'none',
    width: 32,
    height: 32,
    borderRadius: 8,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const listStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    background: COLORS.bg?.page || '#F8FAFC',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
};

const userRowStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
};

const botRowStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
};

const userBubbleStyle = {
    background: COLORS.primary,
    color: '#fff',
    padding: '10px 14px',
    borderRadius: '14px 14px 4px 14px',
    fontSize: 14,
    maxWidth: '85%',
    lineHeight: 1.45,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
};

const botBubbleStyle = (error) => ({
    background: '#fff',
    color: error ? COLORS.error : COLORS.text.primary,
    padding: '10px 14px',
    borderRadius: '14px 14px 14px 4px',
    fontSize: 14,
    maxWidth: '85%',
    lineHeight: 1.45,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    border: `1px solid ${COLORS.border || '#E2E8F0'}`,
});

const actionBtnStyle = {
    background: `${COLORS.secondary}1A`,
    color: COLORS.secondaryDark,
    border: 'none',
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
};

const seededWrapStyle = {
    padding: '0 12px 10px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    background: COLORS.bg?.page || '#F8FAFC',
    borderTop: `1px solid ${COLORS.border || '#E2E8F0'}`,
};

const chipStyle = {
    background: '#fff',
    border: `1px solid ${COLORS.border || '#E2E8F0'}`,
    color: COLORS.text.secondary,
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 12,
    cursor: 'pointer',
    lineHeight: 1.3,
};

const inputRowStyle = {
    display: 'flex',
    gap: 8,
    padding: 12,
    borderTop: `1px solid ${COLORS.border || '#E2E8F0'}`,
    background: '#fff',
    flex: '0 0 auto',
    alignItems: 'flex-end',
};

const inputStyle = {
    flex: 1,
    border: `1px solid ${COLORS.border || '#E2E8F0'}`,
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 14,
    resize: 'none',
    maxHeight: 100,
    fontFamily: 'inherit',
    color: COLORS.text.primary,
    outline: 'none',
};

const sendBtnStyle = {
    background: COLORS.primary,
    color: '#fff',
    border: 'none',
    width: 40,
    height: 40,
    borderRadius: 10,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
};
