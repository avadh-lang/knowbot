"use client";
import React from "react";

function formatContent(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[Source \d+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', fontSize: 12, fontFamily: 'monospace' }}>{part.slice(1, -1)}</code>;
    if (/^\[Source \d+\]$/.test(part))
      return <span key={i} className="source-chip">{part}</span>;
    return (
      <React.Fragment key={i}>
        {part.split("\n").map((line, j, arr) => (
          <React.Fragment key={j}>{line}{j < arr.length - 1 && <br />}</React.Fragment>
        ))}
      </React.Fragment>
    );
  });
}

export default function MessageBubble({ msg }) {
  const isUser = msg.role === "user";

  return (
    <div className={`msg-enter flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold mt-0.5"
        style={isUser
          ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }
          : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }
        }>
        {isUser ? "U" : "K"}
      </div>

      <div className={`flex flex-col gap-1.5 max-w-[76%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Bubble */}
        <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
          style={
            isUser
              ? {
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.85), rgba(79,70,229,0.85))',
                  color: 'rgba(255,255,255,0.95)',
                  borderRadius: '16px 4px 16px 16px',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(139,92,246,0.4)'
                }
              : msg.error
                ? {
                    background: 'rgba(239,68,68,0.1)',
                    color: '#fca5a5',
                    borderRadius: '4px 16px 16px 16px',
                    border: '1px solid rgba(239,68,68,0.2)'
                  }
                : {
                    background: 'rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(20px)',
                    color: 'rgba(255,255,255,0.85)',
                    borderRadius: '4px 16px 16px 16px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }
          }>
          {formatContent(msg.content)}
        </div>

        {/* Sources */}
        {msg.sources && msg.sources.length > 0 && (
          <div className="w-full rounded-xl p-3" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(196,181,253,0.6)' }}>
              Sources
            </p>
            <div className="flex flex-col gap-1.5">
              {msg.sources.map(s => (
                <div key={s.index} className="flex items-center gap-2 text-xs">
                  <span className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold shrink-0"
                    style={{ background: 'rgba(124,58,237,0.3)', color: '#c4b5fd' }}>
                    {s.index}
                  </span>
                  <span className="truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.document}</span>
                  {s.similarity != null && (
                    <span className="ml-auto text-[10px] shrink-0" style={{ color: 'rgba(196,181,253,0.5)' }}>
                      {Math.round(s.similarity * 100)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
