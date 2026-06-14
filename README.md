# KnowBot — AI Knowledge Assistant

A no-code AI-powered Knowledge Assistant built with **n8n**, **Groq**, **Pinecone**, and **Cohere**. Upload any document and have an intelligent conversation with it. Every answer is retrieved directly from your files and cited back to the source.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                           │
│                    KnowBot — Next.js Frontend                   │
└────────────┬────────────────────────────────┬───────────────────┘
             │ Upload document                │ Ask question
             ▼                               ▼
┌────────────────────────┐     ┌─────────────────────────────────┐
│   Next.js API Route    │     │      Next.js API Route          │
│   /api/upload          │     │      /api/chat                  │
│   (server-side proxy)  │     │      (server-side proxy)        │
└────────────┬───────────┘     └──────────────┬──────────────────┘
             │                                │
             ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         n8n (No-Code Automation)                │
│                                                                 │
│  ┌─────────────────────────┐  ┌────────────────────────────┐   │
│  │  Workflow 1: Ingestion  │  │  Workflow 2: RAG Chat      │   │
│  │                         │  │                            │   │
│  │  Webhook Trigger        │  │  Chat Message Trigger      │   │
│  │       ↓                 │  │         ↓                  │   │
│  │  Pinecone Vector Store  │  │     AI Agent (Groq)        │   │
│  │  (upsert mode)          │  │         ↓                  │   │
│  │       ↓                 │  │  search_knowledge_base     │   │
│  │  Cohere Embeddings      │  │  (Pinecone retrieve)       │   │
│  │  embed-english-v3.0     │  │         ↓                  │   │
│  │  (1024-dim vectors)     │  │  Cohere Embeddings         │   │
│  └─────────────────────────┘  │         ↓                  │   │
│                               │  Simple Memory             │   │
│                               │  (conversation context)    │   │
│                               └────────────────────────────┘   │
└──────────────────────────┬──────────────────┬───────────────────┘
                           │                  │
                           ▼                  ▼
              ┌────────────────┐   ┌──────────────────────┐
              │   Pinecone     │   │    Groq (LLM)        │
              │  Vector DB     │   │  llama-3.3-70b       │
              │  (knowledge    │   │  -versatile          │
              │   store)       │   │                      │
              └────────────────┘   └──────────────────────┘
```

### Data Flow

**Document Upload:**
Browser → `/api/upload` → n8n Webhook → Cohere (embed) → Pinecone (store vectors)

**Chat Query:**
Browser → `/api/chat` → n8n Chat Webhook → AI Agent → Pinecone (retrieve top-k chunks) → Groq (generate answer with context) → Response with source citations

THANK YOU!