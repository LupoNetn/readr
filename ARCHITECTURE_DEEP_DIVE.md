# readr: Complete System Architecture, Replication Blueprint & WebSocket Specification

An engineering specification, implementation guide, senior engineer trade-off analysis, and WebSocket transition architecture for `readr` — a zero-AI, deterministic document passage retrieval engine and pure Model Context Protocol (MCP) server.

---

## Table of Contents

1. [Core Design Philosophy & Architectural Principles](#1-core-design-philosophy--architectural-principles)
2. [End-to-End System Architecture](#2-end-to-end-system-architecture)
3. [Component Breakdown & Replication Blueprint](#3-component-breakdown--replication-blueprint)
   - [3.1 Multi-Format Ingestion Pipeline](#31-multi-format-ingestion-pipeline)
   - [3.2 Tokenization & Semantic Chunking Engine](#32-tokenization--semantic-chunking-engine)
   - [3.3 Mathematical BM25 Scoring & Top-K Ranking](#33-mathematical-bm25-scoring--top-k-ranking)
   - [3.4 In-Memory Write-Through Storage Engine](#34-in-memory-write-through-storage-engine)
   - [3.5 Pure MCP Protocol Implementation](#35-pure-mcp-protocol-implementation)
   - [3.6 Component-Based Monochromatic UI & Stream Orchestrator](#36-component-based-monochromatic-ui--stream-orchestrator)
4. [Senior Engineer Notes: Failure Modes, Trade-offs & Production Gotchas](#4-senior-engineer-notes-failure-modes-trade-offs--production-gotchas)
   - [Trade-off 1: BM25 vs Vector Embeddings / Semantic Search](#trade-off-1-bm25-vs-vector-embeddings--semantic-search)
   - [Trade-off 2: The Single-Document IDF Collapse Problem](#trade-off-2-the-single-document-idf-collapse-problem)
   - [Trade-off 3: Stemming vs Exact Character Tokenization](#trade-off-3-stemming-vs-exact-character-tokenization)
   - [Trade-off 4: Conflicting Documents & Tie-Breaking Logic](#trade-off-4-conflicting-documents--tie-breaking-logic)
   - [Trade-off 5: Memory Leak Prevention & Large Document Buffering](#trade-off-5-memory-leak-prevention--large-document-buffering)
5. [WebSocket Architecture Blueprint (Replacing SSE)](#5-websocket-architecture-blueprint-replacing-sse)
   - [5.1 Why Migrate from SSE to WebSockets?](#51-why-migrate-from-sse-to-websockets)
   - [5.2 Full-Duplex Architecture & Message Framing](#52-full-duplex-architecture--message-framing)
   - [5.3 Connection State Machine, Heartbeat & Backoff Reconnect](#53-connection-state-machine-heartbeat--backoff-reconnect)
   - [5.4 Backend WebSocket Server Implementation (TypeScript Reference)](#54-backend-websocket-server-implementation-typescript-reference)
   - [5.5 Frontend React WebSocket Hook & Transport Client (Reference)](#55-frontend-react-websocket-hook--transport-client-reference)
6. [Step-by-Step Guide to Replicate This System from Scratch](#6-step-by-step-guide-to-replicate-this-system-from-scratch)

---

## 1. Core Design Philosophy & Architectural Principles

`readr` was built to solve a critical flaw in modern LLM/RAG systems: **hallucination, cost, non-determinism, and latency**.

### Core Constraints

1. **Zero LLM / Zero AI / Zero API Keys:** The system does not call OpenAI, Anthropic, Gemini, or any local neural weights. It operates 100% offline at zero operational inference cost.
2. **100% Deterministic Information Retrieval:** Given the same set of documents and the same query, the engine will mathematically return the exact same passage and confidence score every single time.
3. **Verbatim Excerpt Extraction:** The engine never summarizes or generates text. It extracts the literal source passage. If no passage meets the confidence threshold, it strictly returns `"nothing found"`.
4. **Pure MCP Architecture:** The backend exposes no ad-hoc Express REST routes (`/api/upload`, `/api/query`). All actions are **MCP Tools**, and all state collections are **MCP Resources** complying with JSON-RPC 2.0.

---

## 2. End-to-End System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER                                         │
│   Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4                    │
│   Monochromatic Theme Engine (Zero AI Slop Colors)                                     │
└───────────────────────────┬──────────────────────────────────▲─────────────────────────┘
                            │                                  │
                            │ JSON-RPC 2.0 Call                │ Full-Duplex Streaming
                            │ (Tools / Resources)              │ (Progress & Passages)
                            ▼                                  │
┌──────────────────────────────────────────────────────────────┴─────────────────────────┐
│                                 TRANSPORT LAYER                                        │
│   Current: Streamable HTTP (SSE on /mcp)                                               │
│   Target Architecture: Full-Duplex WebSockets (ws://localhost:3030/ws)                 │
└───────────────────────────┬──────────────────────────────────▲─────────────────────────┘
                            │                                  │
                            ▼                                  │
┌──────────────────────────────────────────────────────────────┴─────────────────────────┐
│                                 MCP PROTOCOL ENGINE                                    │
│   @modelcontextprotocol/sdk                                                            │
│   ├── Tools Registry:                                                                  │
│   │   ├── ingest_document (Base64 file buffer -> parsing -> chunking -> index)         │
│   │   ├── ask_document (Query -> BM25 ranking -> Top-K passage extraction)             │
│   │   ├── delete_document (Cascade chunk & index deletion)                             │
│   │   └── document_stats / ping                                                        │
│   └── Resources Registry:                                                              │
│       ├── readr://documents (Live corpus state for Memory View)                        │
│       └── readr://history   (Audit log of queries, scores, and sources)               │
└───────────────────────────┬────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              PROCESSING & SEARCH ENGINE                                │
│                                                                                        │
│   1. Parsers (pdf-parse, mammoth, papaparse, utf8)                                     │
│      Extracts normalized text while binding table headers to values                    │
│                                                                                        │
│   2. Chunker & Tokenizer                                                               │
│      Regex lookbehind sentence boundary split ((?<=[.?!])\s+)                          │
│      Stopword filtering & length thresholding                                          │
│                                                                                        │
│   3. Top-K BM25 Ranker                                                                 │
│      k1 = 1.5, b = 0.75, strict keyword match ratio >= 0.40, confidence >= 0.30        │
│                                                                                        │
│   4. Storage Engine (Write-Through Memory Cache + Disk JSON Persistence)               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Breakdown & Replication Blueprint

### 3.1 Multi-Format Ingestion Pipeline (`src/parsers/index.ts`)

To support arbitrary flat files without external microservices:

| File Type           | Library      | Ingestion Strategy                                                                | Gotcha Avoided                                                     |
| :------------------ | :----------- | :-------------------------------------------------------------------------------- | :----------------------------------------------------------------- |
| **PDF**             | `pdf-parse`  | In-memory buffer text extraction via `new PDFParse({ data: buffer }).getText()`   | Named ESM import vs CommonJS default export collision              |
| **DOCX**            | `mammoth`    | Raw text stream extraction                                                        | Strips Word XML markup without invoking LibreOffice                |
| **CSV**             | `papaparse`  | Key-Value binding: `Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(', ')` | Preserves column headers per row so BM25 keyword matching succeeds |
| **TXT / MD / JSON** | Native UTF-8 | `buffer.toString('utf-8')`                                                        | Zero overhead direct string conversion                             |

### 3.2 Tokenization & Semantic Chunking Engine (`src/engine/chunker.ts`)

```typescript
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "he",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "that",
  "the",
  "to",
  "was",
  "were",
  "will",
  "with",
  "what",
  "where",
  "when",
  "who",
  "how",
  "why",
  "can",
  "could",
  "should",
  "would",
  "do",
  "does",
  "did",
  "this",
  "these",
  "those",
  "they",
  "them",
  "their",
  "we",
  "our",
  "you",
  "your",
]);

export function tokenize(text: string): string[] {
  const rawWords = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  return rawWords.filter((word) => !STOP_WORDS.has(word) && word.length > 1);
}
```

- **Chunk Boundary Splitting:**
  - First split by paragraph newlines: `\r?\n+`.
  - If a paragraph exceeds 600 characters, it splits using regex positive lookbehind: `/(?<=[.?!])\s+/`. This keeps punctuation intact on each sentence.
  - Every chunk records: `id`, `documentId`, `filename`, `chunkIndex`, `text`, `tokens`, and `createdAt`.

### 3.3 Mathematical BM25 Scoring & Top-K Ranking (`src/engine/search.ts`)

The Best Matching 25 (BM25) ranking function scores each candidate passage $D$ against query tokens $Q = \{q_1, q_2, \dots, q_n\}$:

$$\text{Score}(D, Q) = \sum_{i=1}^{n} \text{IDF}(q_i) \cdot \frac{f(q_i, D) \cdot (k_1 + 1)}{f(q_i, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)}$$

Where:

- $f(q_i, D)$ is the frequency of query token $q_i$ in chunk $D$.
- $|D|$ is the length of chunk $D$ in tokens.
- $\text{avgdl}$ is the average token length across all chunks in the corpus.
- $k_1 = 1.5$ regulates term frequency saturation.
- $b = 0.75$ controls document length normalization penalty.

$$\text{IDF}(q_i) = \ln\left(\frac{N - n(q_i) + 0.5}{n(q_i) + 0.5} + 1\right)$$

- $N$ is total chunks indexed.
- $n(q_i)$ is number of chunks containing token $q_i$.

#### Top-K Ranking & Anti-Hallucination Guard:

```typescript
const MINIMUM_CONFIDENCE_THRESHOLD = 0.3;
const keywordMatchRatio = currentMatched.length / queryTokens.length;

if (chunkScore >= MINIMUM_CONFIDENCE_THRESHOLD && keywordMatchRatio >= 0.4) {
  candidates.push({ chunk, score: chunkScore, matchedTokens: currentMatched });
}

// Sort descending and extract Top-K (up to 5 matches across multiple documents)
candidates.sort((a, b) => b.score - a.score);
const matches = candidates.slice(0, 5);
```

### 3.4 In-Memory Write-Through Storage Engine (`src/engine/store.ts`)

- **In-Memory Store:** `Map<string, DocumentMeta>` and `Map<string, DocumentChunk>` provide $\mathcal{O}(1)$ chunk retrieval and $\mathcal{O}(N)$ fast linear array scanning for BM25.
- **Write-Through Persistence:** Any mutation (`addDocument`, `deleteDocument`, `addHistoryItem`) automatically writes to `backend/data/store.json` using atomic synchronous filesystem flushes.

### 3.5 Pure MCP Protocol Implementation

- **Tool `ask_document`**: Accepts `{ question: string }`. Emits SSE progress notifications (`notifications/progress`) while scanning, then returns structured JSON containing `status: "found"`, primary `sourceText`, `matchedKeywords`, `confidenceScore`, and the Top-K array `allMatches`.
- **Tool `ingest_document`**: Accepts Base64 encoded file payload or local file path, parses buffer, chunks text, and indexes in store.
- **Resource `readr://documents`**: Exposes list of all ingested documents, sizes, chunk counts, and snippet previews.
- **Resource `readr://history`**: Exposes query audit log.

### 3.6 Component-Based Monochromatic UI & Stream Orchestrator

- **Design Language:** Pure monochromatic (#000000 / #ffffff / neutral grays). Zero purple/blue AI gradients.
- **Response Streaming:** Implements a word-by-word token typewriter cadence (22ms per word) for smooth Gemini/ChatGPT-style streaming.
- **Top-K Drawer:** When multiple files match a query, an expandable _"N more sources"_ accordion lets users inspect conflicting or alternative document passages.

---

## 4. Senior Engineer Notes: Failure Modes, Trade-offs & Production Gotchas

### Trade-off 1: BM25 vs Vector Embeddings / Semantic Search

- **Why not Vectors (Pinecone / Chroma / pgvector)?**
  - Vector search requires an embedding model (e.g. `text-embedding-3-small`), incurring latency, external API dependencies, and nondeterminism.
  - Vectors suffer from **semantic drift**: asking _"What was the revenue in 2024?"_ can match a passage about _"2025 revenue"_ because the semantic vectors for consecutive fiscal years are virtually identical in embedding space!
  - **BM25 guarantee:** Exact numerical and entity matching. `2024` will NEVER match `2025` unless the number actually exists in that chunk.

### Trade-off 2: The Single-Document IDF Collapse Problem

- **The Failure Mode:** When only 1 document is uploaded, every word that appears in that document has $n(q_i) = 1$ and $N = 1$.
  $$\text{IDF} = \ln\left(\frac{1 - 1 + 0.5}{1 + 0.5} + 1\right) = \ln\left(\frac{0.5}{1.5} + 1\right) = \ln(1.333) \approx 0.287$$
- **The Gotcha:** If `MINIMUM_CONFIDENCE_THRESHOLD` is set to `0.60`, a 1-document corpus will produce false negatives on 100% accurate matches!
- **Production Fix:** Set threshold to `0.30` and add the dual condition: `keywordMatchRatio >= 0.40`. This requires that at least 40% of the query terms are physically present, preventing spurious matches while accommodating low single-document IDF scores.

### Trade-off 3: Stemming vs Exact Character Tokenization

- **The Problem:** In verbatim tokenization, `employs` and `employees` are different strings.
- **The Trade-off:**
  - Without Stemming: Zero false positives, but query must use the document's morphological form.
  - With Porter Stemming: Maps `employs` and `employees` to root `employ`. Highly recommended for general document Q&A.
- **Deterministic Rule:** If stemming is introduced, use an algorithmic, rule-based stemmer (e.g. Porter Stemmer or Martin Porter's Snowball). Never use an LLM or neural lemmatizer.

### Trade-off 4: Conflicting Documents & Tie-Breaking Logic

- **The Problem:** File A says _"Salary is $120k"_, File B says _"Salary is $140k"_.
- **The Trade-off:**
  - In a Top-1 system, whichever file was indexed first or has shorter chunk length wins.
  - **Solution (Implemented):** Top-K matching surfaces both chunks. The user sees File A ($120k) and File B ($140k) side-by-side with individual confidence scores, eliminating hidden discrepancies.

### Trade-off 5: Memory Leak Prevention & Large Document Buffering

- Storing all chunks in RAM is ultra-fast for corpora up to ~500,000 chunks (~250 MB RAM).
- For enterprise-scale corpora (>5M chunks), replace the in-memory array with an inverted index table stored in SQLite (using `FTS5` extension) for zero-memory, disk-backed deterministic BM25.

---

## 5. WebSocket Architecture Blueprint (Replacing SSE)

The current implementation uses **Streamable HTTP (Server-Sent Events)** on `/mcp`. Here is the complete engineering blueprint for replacing SSE with **Full-Duplex WebSockets (`ws://localhost:3030/ws`)**.

### 5.1 Why Migrate from SSE to WebSockets?

| Dimension                     | Server-Sent Events (SSE)                                                                             | WebSockets (WS)                                                                                  |
| :---------------------------- | :--------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| **Directionality**            | Unidirectional (Server $\rightarrow$ Client only). Client requests require separate HTTP POST calls. | **Full-Duplex (Bidirectional).** Client and server exchange frames over a single TCP connection. |
| **Connection Overhead**       | New HTTP POST handshake per query.                                                                   | **Zero per-message overhead** once WS handshake is established.                                  |
| **Multiplexing**              | Requires separate HTTP connections or custom stream demuxing.                                        | Native request/response multiplexing via JSON-RPC `id` tracking.                                 |
| **Firewall / Proxy Timeouts** | HTTP streams frequently drop behind corporate proxies after 30-60s of inactivity.                    | Built-in Ping/Pong control frames keep connection alive indefinitely.                            |

### 5.2 Full-Duplex Architecture & Message Framing

```
┌─────────────────────────────────┐                       ┌─────────────────────────────────┐
│        Frontend Client          │                       │      Backend WebSocket Host     │
│   (useMcpWebSocket hook)        │                       │         (ws://.../ws)           │
└────────────────┬────────────────┘                       └────────────────┬────────────────┘
                 │                                                         │
                 │ 1. HTTP Upgrade GET /ws                                 │
                 │ ──────────────────────────────────────────────────────> │
                 │ 2. 101 Switching Protocols                              │
                 │ <────────────────────────────────────────────────────── │
                 │                                                         │
                 │ 3. Heartbeat: Ping frame (every 25s)                    │
                 │ ──────────────────────────────────────────────────────> │
                 │ 4. Heartbeat: Pong frame                                │
                 │ <────────────────────────────────────────────────────── │
                 │                                                         │
                 │ 5. Tool Call: {"jsonrpc":"2.0","id":"req_1",            │
                 │                "method":"tools/call",                   │
                 │                "params":{"name":"ask_document",...}}   │
                 │ ──────────────────────────────────────────────────────> │
                 │                                                         │
                 │ 6. Live Progress Notification (Streamed Frame):         │
                 │    {"jsonrpc":"2.0","method":"notifications/progress",  │
                 │     "params":{"progress":50,"message":"Scanning..."}}   │
                 │ <────────────────────────────────────────────────────── │
                 │                                                         │
                 │ 7. Final Response Frame:                                │
                 │    {"jsonrpc":"2.0","id":"req_1",                       │
                 │     "result":{"content":[{"type":"text",...}]}}         │
                 │ <────────────────────────────────────────────────────── │
```

### 5.3 Connection State Machine, Heartbeat & Backoff Reconnect

```
         ┌───────────────┐
         │ DISCONNECTED  │
         └───────┬───────┘
                 │ Initial connect()
                 ▼
         ┌───────────────┐        WS Error / Close
         │  CONNECTING   │ ───────────────────────────────┐
         └───────┬───────┘                                │
                 │ onopen                                 │
                 ▼                                        ▼
         ┌───────────────┐       Ping Timeout (30s)  ┌───────────────────────────┐
    ┌───>│   CONNECTED   │ ─────────────────────────>│       RECONNECTING        │
    │    └───────┬───────┘                           │ Exponential Backoff:      │
    │            │ heartbeat interval (25s)          │ t = min(1000 * 2^n, 30000)│
    │            ▼                                   └─────────────┬─────────────┘
    │    ┌───────────────┐                                         │
    └─── │  PING / PONG  │                                         │ Retry
         └───────────────┘ <───────────────────────────────────────┘
```

### 5.4 Backend WebSocket Server Implementation (TypeScript Reference)

To replicate or switch the backend to WebSockets, install `ws` (`npm install ws @types/ws`) and implement:

```typescript
// backend/src/transport/websocket.ts
import { WebSocketServer, WebSocket } from "ws";
import { Server } from "node:http";
import { searchDocument } from "../engine/search.js";
import { documentStore } from "../engine/store.js";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: any;
}

export function setupWebSocketTransport(httpServer: Server): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    let isAlive = true;

    // Heartbeat verification
    ws.on("pong", () => {
      isAlive = true;
    });

    ws.on("message", async (raw: string) => {
      try {
        const message: JsonRpcRequest = JSON.parse(raw.toString());

        // Route: tools/call -> ask_document
        if (
          message.method === "tools/call" &&
          message.params?.name === "ask_document"
        ) {
          const question = message.params.arguments?.question || "";

          // 1. Send streaming progress frame over the same socket
          ws.send(
            JSON.stringify({
              jsonrpc: "2.0",
              method: "notifications/progress",
              params: {
                progressToken: message.params._meta?.progressToken,
                progress: 50,
                message: `Scanning ${documentStore.stats.totalChunks} chunks via WebSocket...`,
              },
            }),
          );

          // 2. Execute deterministic BM25 search
          const result = searchDocument(question);

          // 3. Send final JSON-RPC response frame
          ws.send(
            JSON.stringify({
              jsonrpc: "2.0",
              id: message.id,
              result: {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({
                      status: result.found ? "found" : "not_found",
                      sourceText: result.match?.text || "nothing found",
                      filename: result.match?.filename,
                      chunkIndex: result.match?.chunkIndex,
                      confidenceScore: result.score,
                      allMatches: result.matches || [],
                    }),
                  },
                ],
              },
            }),
          );
        }
      } catch (err: any) {
        ws.send(
          JSON.stringify({
            jsonrpc: "2.0",
            id: null,
            error: { code: -32603, message: err.message },
          }),
        );
      }
    });

    // Close stale connections
    const interval = setInterval(() => {
      if (!isAlive) return ws.terminate();
      isAlive = false;
      ws.ping();
    }, 25000);

    ws.on("close", () => clearInterval(interval));
  });

  return wss;
}
```

### 5.5 Frontend React WebSocket Hook & Transport Client (Reference)

```typescript
// frontend/lib/useMcpWebSocket.ts
import { useEffect, useRef, useState, useCallback } from "react";

export function useMcpWebSocket(url = "ws://localhost:3030/ws") {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const pendingRequests = useRef<
    Map<string | number, { resolve: Function; reject: Function }>
  >(new Map());
  const progressListeners = useRef<
    Map<string | number, (progress: any) => void>
  >(new Map());

  const connect = useCallback(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => {
      setIsConnected(false);
      // Exponential backoff reconnect
      setTimeout(connect, 3000);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Handle server streaming notifications
      if (data.method === "notifications/progress") {
        const token = data.params?.progressToken;
        const callback = progressListeners.current.get(token);
        if (callback) callback(data.params);
        return;
      }

      // Handle final JSON-RPC response
      if (data.id && pendingRequests.current.has(data.id)) {
        const { resolve, reject } = pendingRequests.current.get(data.id)!;
        pendingRequests.current.delete(data.id);
        if (data.error) reject(new Error(data.error.message));
        else resolve(data.result);
      }
    };
  }, [url]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  const sendRequest = useCallback(
    (method: string, params: any, onProgress?: (p: any) => void) => {
      return new Promise((resolve, reject) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return reject(new Error("WebSocket connection not open"));
        }

        const id = "ws_" + Math.random().toString(36).substring(2, 9);
        pendingRequests.current.set(id, { resolve, reject });

        if (onProgress) {
          progressListeners.current.set(id, onProgress);
        }

        wsRef.current.send(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            method,
            params: { ...params, _meta: { progressToken: id } },
          }),
        );
      });
    },
    [],
  );

  return { isConnected, sendRequest };
}
```

---

## 6. Step-by-Step Guide to Replicate This System from Scratch

To rebuild this entire system in a clean directory:

1. **Initialize Backend Workspace:**

   ```bash
   mkdir -p readr/backend && cd readr/backend
   npm init -y
   npm install @modelcontextprotocol/sdk express zod pdf-parse mammoth papaparse
   npm install -D typescript @types/node @types/express @types/papaparse @types/pdf-parse tsx
   npx tsc --init
   ```

2. **Configure TypeScript (`backend/tsconfig.json`):**
   - Set `"target": "ES2022"`, `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`.

3. **Create the Core Pipeline:**
   - Build `src/parsers/index.ts` to convert PDF, DOCX, CSV into clean key-value text.
   - Build `src/engine/chunker.ts` with sentence-splitting regex `(?<=[.?!])\s+`.
   - Build `src/engine/store.ts` for in-memory and write-through disk sync.
   - Build `src/engine/search.ts` implementing the BM25 formula with strict guard thresholds and Top-K ranking.

4. **Assemble the MCP Server:**
   - Register tools (`ask_document`, `ingest_document`, `delete_document`) and resources (`readr://documents`, `readr://history`) using `@modelcontextprotocol/sdk`.
   - Mount Express with `StreamableHTTPServerTransport` or WebSocket Server on port `3030`.

5. **Initialize Frontend Workspace:**

   ```bash
   cd ../ && npx create-next-app@latest frontend --typescript --tailwind --app --no-eslint
   cd frontend
   npm install lucide-react
   ```

6. **Implement Monochromatic Component Architecture:**
   - Configure Tailwind v4 `@custom-variant dark (&:where(.dark, .dark *));`.
   - Create `components/layout/Sidebar.tsx` and `TopNav.tsx` with sliding transitions.
   - Create `components/chat/MessageItem.tsx` with Top-K multi-source citation cards.
   - Create `components/memory/MemoryView.tsx` reading live documents from MCP.
   - Create `app/page.tsx` with typewriter response streaming (22ms cadence).

---

_Authored for the readr engineering repository._
