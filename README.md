# readr 📖

> A pure, deterministic document ingestion & search engine powered by the **Model Context Protocol (MCP)** and **BM25 ranking**.

`readr` is a **100% Pure MCP Server**. It exposes tools and resources for ingesting real files (`.pdf`, `.docx`, `.csv`, `.txt`, `.md`, `.json`), chunking them along semantic boundaries, and performing deterministic passage retrieval.

Zero AI. Zero LLM hallucination risk. Zero database overhead.

---

## 🌟 MCP Architecture Overview

All interactions flow exclusively through the Model Context Protocol:

### 🛠️ Tools

- **`ingest_document`**: Parses and indexes documents from a **Base64 string** (web clients) or **local file path** (desktop/CLI).
- **`ask_document`**: Searches indexed chunks using the BM25 algorithm. Streams progress notifications and returns the exact matching source sentence, or `"nothing found"`.
- **`delete_document`**: Purges a document and all its chunks from memory and disk.
- **`document_stats`**: Returns real-time counts of indexed documents, chunks, and history records.
- **`ping`**: Protocol health and responsiveness check.

### 📚 Resources (State & Memory)

- **`readr://documents`**: Live list of all indexed documents (powers the frontend **Memory Page**).
- **`readr://history`**: Rolling log of all past questions, answers, and confidence scores (powers the **Chat History**).

---

## 📁 Clean Modular Structure

```text
readr/
├── backend/
│   ├── src/
│   │   ├── mcp/
│   │   │   ├── server.ts             # Central MCP server initializer
│   │   │   ├── tools/                # Isolated tool handlers
│   │   │   │   ├── ingest.ts         # Ingestion (PDF, DOCX, CSV, TXT)
│   │   │   │   ├── search.ts         # BM25 Q&A search
│   │   │   │   ├── delete.ts         # Document deletion
│   │   │   │   └── stats.ts          # System stats & ping
│   │   │   └── resources/            # Native MCP resources
│   │   │       ├── documents.ts      # readr://documents (Memory Page)
│   │   │       └── history.ts        # readr://history (Chat History)
│   │   │
│   │   ├── parsers/                  # Format extraction layer
│   │   │   └── index.ts              # PDFParse, Mammoth, PapaParse
│   │   │
│   │   ├── engine/                   # Core search & memory logic
│   │   │   ├── types.ts              # Data contracts
│   │   │   ├── chunker.ts            # Semantic chunking & tokenization
│   │   │   ├── store.ts              # RAM store with auto-disk persistence
│   │   │   └── search.ts             # Deterministic BM25 ranking algorithm
│   │   │
│   │   └── index.ts                  # Pure MCP transport runner (~40 lines)
│   │
│   ├── data/
│   │   └── store.json                # Auto-saved state
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                         # Standalone MCP Client UI
```

---

## 🚀 Getting Started

### 1. Install & Run

```bash
cd backend
npm install
npm run dev
```

The server starts at `http://localhost:3030/mcp`.

### 2. Inspect with MCP Inspector

```bash
npx @modelcontextprotocol/inspector
```

- **Transport:** Streamable HTTP
- **URL:** `http://localhost:3030/mcp`

You will see all tools and resources populated in the inspector UI!

---

## 📄 License

MIT
