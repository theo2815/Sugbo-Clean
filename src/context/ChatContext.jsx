import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { askChatbot } from '../services/api';

const STORAGE_KEY = 'sc_chat_v1';
const MAX_PERSISTED_MESSAGES = 40;

export const GREETING = "Hi! I'm SugboClean's resident assistant. Ask about pickup schedules, waste sorting, or how to use the app. I reply in English, Cebuano, or Tagalog.";

export function detectAction(text) {
    const lower = text.toLowerCase();
    if (lower.includes('subscribe') || lower.includes('reminder')) {
        return { label: 'Subscribe to reminders', to: '/schedule' };
    }
    if (lower.includes('report') && (lower.includes('missed') || lower.includes('file'))) {
        return { label: 'File a missed-pickup report', to: '/report' };
    }
    if (lower.includes('sorting guide') || lower.includes('waste guide') || lower.includes('bin')) {
        return { label: 'Open the waste sorting guide', to: '/waste-guide' };
    }
    if (lower.includes('track') && lower.includes('report')) {
        return { label: 'Track a report', to: '/track' };
    }
    return null;
}

function loadInitial() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.messages)) return null;
        return parsed;
    } catch {
        return null;
    }
}

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
    const initial = loadInitial();
    const [open, setOpen] = useState(initial?.open ?? false);
    const [messages, setMessages] = useState(initial?.messages?.length ? initial.messages : [{ role: 'bot', text: GREETING }]);
    const [input, setInput] = useState(initial?.input ?? '');
    const [sending, setSending] = useState(false);
    const sendingRef = useRef(false);

    useEffect(() => {
        try {
            const trimmed = messages.length > MAX_PERSISTED_MESSAGES
                ? messages.slice(-MAX_PERSISTED_MESSAGES)
                : messages;
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ open, messages: trimmed, input }));
        } catch {
            /* quota or disabled storage — not fatal */
        }
    }, [open, messages, input]);

    const send = useCallback(async (questionRaw) => {
        const question = (questionRaw ?? input).trim();
        if (!question || sendingRef.current) return;

        sendingRef.current = true;
        setMessages((prev) => [...prev, { role: 'user', text: question }]);
        setInput('');
        setSending(true);

        try {
            const { result } = await askChatbot(question);
            const answer = result?.answer || "I'm not sure how to help with that right now.";
            setMessages((prev) => [...prev, { role: 'bot', text: answer, action: detectAction(answer) }]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { role: 'bot', text: err?.message || 'The assistant is unavailable right now. Please try again shortly.', error: true },
            ]);
        } finally {
            sendingRef.current = false;
            setSending(false);
        }
    }, [input]);

    const reset = useCallback(() => {
        setMessages([{ role: 'bot', text: GREETING }]);
        setInput('');
        try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }, []);

    const value = { open, setOpen, messages, input, setInput, sending, send, reset };
    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error('useChat must be used within a ChatProvider');
    return ctx;
}
