"use client";
import { useRef, useState } from "react";

export default function UploadZone({ docs, onUpload }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files) {
    if (!files) return;
    Array.from(files).forEach(onUpload);
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className="flex flex-col items-center justify-center gap-2 rounded-xl p-5 cursor-pointer transition-all duration-200 select-none"
        style={{
          border: `2px dashed ${dragging ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.12)'}`,
          background: dragging ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
        }}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-transform duration-200"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)',
            transform: dragging ? 'scale(1.1)' : 'scale(1)'
          }}>
          +
        </div>
        <div className="text-center">
          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {dragging ? "Drop to upload" : "Click or drag to upload"}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>PDF · TXT · DOCX</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Document list */}
      {docs.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {docs.map((doc, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                background:
                  doc.status === "uploading" ? '#fbbf24' :
                  doc.status === "done"      ? '#34d399' : '#f87171',
                boxShadow:
                  doc.status === "uploading" ? '0 0 6px #fbbf24' :
                  doc.status === "done"      ? '0 0 6px #34d399' : '0 0 6px #f87171'
              }} />
              <span className="flex-1 text-xs truncate" style={{ color: 'rgba(255,255,255,0.7)' }} title={doc.name}>
                {doc.name}
              </span>
              <span className="text-[10px] font-medium shrink-0" style={{
                color:
                  doc.status === "uploading" ? '#fcd34d' :
                  doc.status === "done"      ? '#6ee7b7' : '#fca5a5'
              }}>
                {doc.status === "uploading" ? "Indexing" : doc.status === "done" ? "Ready" : "Failed"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
