"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import UploadZone from "@/components/UploadZone";
import MessageBubble from "@/components/MessageBubble";

function genId() { return Math.random().toString(36).slice(2); }

const SUGGESTIONS = [
  "What is this document about?",
  "Summarise the key points",
  "What are the main topics covered?",
  "Explain the most important concept",
];

export default function Home() {
  const [docs, setDocs]         = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [sessionId]             = useState(() => "s-" + genId());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cooldown, setCooldown]       = useState(0);

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);
  const cooldownRef = useRef(null);

  function startCooldown(seconds = 10) {
    setCooldown(seconds);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function resize(el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }

  const handleUpload = useCallback(async (file) => {
    setDocs(prev => [...prev, { name: file.name, status: "uploading" }]);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      setDocs(prev =>
        prev.map(d => d.name === file.name ? { ...d, status: res.ok ? "done" : "error" } : d)
      );
      if (!res.ok) console.error("Upload failed:", json.error);
    } catch {
      setDocs(prev => prev.map(d => d.name === file.name ? { ...d, status: "error" } : d));
    }
  }, []);

  const isBlocked = loading || cooldown > 0;

  const sendMessage = useCallback(async (text) => {
    const question = (text ?? input).trim();
    if (!question || isBlocked) return;

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setMessages(prev => [...prev, { id: genId(), role: "user", content: question }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, session_id: sessionId }),
      });
      const json = await res.json();
      setMessages(prev => [...prev, {
        id:      genId(),
        role:    "bot",
        content: res.ok ? (json.answer ?? "No answer returned.") : (json.error ?? "Something went wrong."),
        sources: res.ok ? json.sources : [],
        error:   !res.ok,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: genId(), role: "bot",
        content: "Network error — please check your connection.",
        error: true,
      }]);
    } finally {
      setLoading(false);
      startCooldown(10);
    }
  }, [input, isBlocked, sessionId]);

  const hasDocs    = docs.some(d => d.status === "done");
  const hasChats   = messages.length > 0;
  const readyCount = docs.filter(d => d.status === "done").length;

  return (
    <div className="flex h-full">

      {/* ── LEFT: Chat panel ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full">

        {/* Header */}
        <header className="glass flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              K
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-none">KnowBot</h1>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>AI Document Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #34d399' }} />
              <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Online</span>
            </div>
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              title={sidebarOpen ? "Hide panel" : "Show panel"}
            >
              {sidebarOpen ? "›" : "‹"}
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {!hasChats ? (
            <div className="flex flex-col items-center justify-center h-full gap-8 text-center px-6">
              {/* Logo */}
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    boxShadow: '0 0 40px rgba(124,58,237,0.4)'
                  }}>
                  K
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white">Welcome to KnowBot</h2>
                <p className="text-sm mt-2 max-w-xs mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Upload a document and ask anything. Every answer comes directly from your files, with source citations.
                </p>
              </div>

              {/* Feature pills */}
              <div className="flex flex-wrap justify-center gap-2">
                {["Semantic search", "Source citations", "Conversation memory", "Multi-document"].map(label => (
                  <span key={label}
                    className="px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.55)'
                    }}>
                    {label}
                  </span>
                ))}
              </div>

              {hasDocs && (
                <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Try asking:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => sendMessage(s)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                        style={{
                          background: 'rgba(124,58,237,0.15)',
                          border: '1px solid rgba(124,58,237,0.3)',
                          color: '#c4b5fd'
                        }}
                        onMouseEnter={e => e.target.style.background = 'rgba(124,58,237,0.25)'}
                        onMouseLeave={e => e.target.style.background = 'rgba(124,58,237,0.15)'}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              {loading && (
                <div className="msg-enter flex items-start gap-3">
                  <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                    K
                  </div>
                  <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1.5 items-center h-4">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Suggestion chips */}
        {hasChats && hasDocs && (
          <div className="px-6 pb-2 flex flex-wrap gap-1.5 shrink-0">
            {SUGGESTIONS.slice(0, 3).map(s => (
              <button key={s} onClick={() => sendMessage(s)} disabled={isBlocked}
                className="px-3 py-1 rounded-full text-[11px] font-medium transition-all disabled:opacity-30"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.55)'
                }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="px-6 pb-6 shrink-0">
          <div className="glass-strong flex items-end gap-3 rounded-2xl px-4 py-3 transition-all"
            style={{ boxShadow: '0 0 0 1px rgba(124,58,237,0)' }}
            onFocus={() => {}}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); resize(e.target); }}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder={
                cooldown > 0
                  ? `Please wait ${cooldown}s…`
                  : hasDocs
                    ? "Ask anything about your documents…"
                    : "Upload a document to get started"
              }
              rows={1}
              disabled={isBlocked}
              className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed disabled:opacity-40"
              style={{ color: 'rgba(255,255,255,0.9)', caretColor: '#a78bfa' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isBlocked}
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              →
            </button>
          </div>
          <p className="text-[10px] text-center mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {cooldown > 0 ? `Next question available in ${cooldown}s` : "Shift+Enter for new line"}
          </p>
        </div>
      </div>

      {/* ── RIGHT: Document panel ── */}
      {sidebarOpen && (
        <aside className="shrink-0 flex flex-col h-full" style={{ width: '272px', borderLeft: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>

          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold text-white">Knowledge Base</h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {readyCount} document{readyCount !== 1 ? "s" : ""} indexed
            </p>
          </div>

          <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <UploadZone docs={docs} onUpload={handleUpload} />
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

            <div className="rounded-xl p-4 text-xs leading-relaxed" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-semibold mb-2 text-white">How it works</p>
              <ol className="space-y-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <li>1. Upload a PDF, TXT, or DOCX file</li>
                <li>2. It is split into chunks and indexed</li>
                <li>3. Ask any question in the chat</li>
                <li>4. Get answers with source citations</li>
              </ol>
            </div>

            {hasDocs && (
              <div className="rounded-xl p-3 text-xs font-medium" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#6ee7b7' }}>
                {readyCount} document{readyCount !== 1 ? "s" : ""} ready and searchable
              </div>
            )}

            <div className="rounded-xl p-3.5 text-xs leading-relaxed" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="font-semibold mb-2 text-white/70">Tips</p>
              <ul className="space-y-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <li>Ask follow-up questions — context is remembered</li>
                <li>Upload multiple files to search across all of them</li>
                <li>Every answer includes the source it came from</li>
              </ul>
            </div>
          </div>

          <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>KnowBot — AI Document Assistant</span>
          </div>

        </aside>
      )}
    </div>
  );
}
