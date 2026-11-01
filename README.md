# readr 📖

> A deterministic, non-AI document ingestion & extractive search engine powered by the **Model Context Protocol (MCP)** and **BM25 ranking**.

`readr` ingests real documents (`.pdf`, `.docx`, `.csv`, `.txt`, `.md`, `.json`), extracts and tokenizes them into structured semantic chunks, stores them in memory with disk persistence, and answers queries strictly from source material. If a query does not have verifiable backing in the documents, the system deterministically responds with `"nothing found"`.

---

## 🌟 Key Features

* **Zero AI / Zero LLM / Zero DB:** Pure deterministic mathematics and algorithms. 100% predictable, zero hallucination risk, zero API token costs.
* **Multi-Format Parsing:** Ingests raw binary files (`.pdf`, `.docx`, `.csv`, `.txt`, `.md`, `.json`) directly via multipart uploads.
* **Semantic Paragraph & Sentence Chunking:** Chops documents along natural reading boundaries while filtering noise and orphan punctuation.
* **Pre-Computed Tokenization:** Normalizes text, strips punctuation, and removes stopwords during ingestion for sub-millisecond retrieval.
* **BM25 Search Algorithm:** Uses the industry-standard Best Matching 25 relevance algorithm (the math powering Elasticsearch and SQLite FTS5) with strict confidence thresholding.
* **MCP Streamable HTTP Transport:** Full support for Model Context Protocol over modern Streamable HTTP (`/mcp`), enabling real-time streaming progress notifications.
* **Memory Page & Chat History Ready:** Built-in persistence for document metadata (for frontend dashboard cards) and query history.

---

## 🏗️ Architecture

```text
[ Client / Frontend / Inspector ]
         │                  │
         │ POST /upload     │ POST /mcp (JSON-RPC)
         ▼                  ▼
┌───────────────────┐  ┌───────────────────────────────────┐
│ Express Server    │  │ MCP Protocol Layer                │
│ (Multer Uploads)  │  │ (StreamableHTTPServerTransport)   │
└────────┬──────────┘  └─────────────────┬─────────────────┘
         │                               │
         ▼                               ▼
┌───────────────────┐  ┌───────────────────────────────────┐
│ File Parsers      │  │ MCP Tools                         │
│ (pdf, docx, csv)  │  │ (ask_document, document_stats)    │
└────────┬──────────┘  └─────────────────┬─────────────────┘
         │                               │
         ▼                               ▼
┌──────────────────────────────────────────────────────────┐
│ Search & Storage Engine                                  │
│  ├─ Chunker & Tokenizer (Semantic sentence splitting)   │
│  ├─ BM25 Search Engine  (IDF calculation & ranking)      │
│  └─ In-Memory Store     (Auto-persisted to store.json)   │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```text
readr/
├── backend/                       # Node.js + Express + MCP TypeScript Server
│   ├── src/
│   │   ├── parsers/               # File extraction layer
│   │   │   └── index.ts           # PDFParse, Mammoth, PapaParse dispatcher
│   │   │
│   │   ├── engine/                # Core search & storage logic
│   │   │   ├── types.ts           # Shared interfaces (DocumentChunk, DocumentMeta)
│   │   │   ├── chunker.ts         # Tokenizer and paragraph/sentence chunker
│   │   │   ├── store.ts           # RAM storage + disk persistence
│   │   │   └── search.ts          # BM25 deterministic ranking algorithm
│   │   │
│   │   ├── mcp/                   # Model Context Protocol layer
│   │   │   └── mcp.ts             # McpServer instance & tool definitions
│   │   │
│   │   └── index.ts               # Express entrypoint & HTTP routes
│   │
│   ├── data/
│   │   └── store.json             # Auto-saved chunks, doc metadata & history
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                      # Standalone client application
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v20+ (recommended v22+)
* **npm**: v10+

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/readr.git
   cd readr/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server (with hot reload):
   ```bash
   npm run dev
   ```

The server will be active at `http://localhost:3030`.

---

## 📡 API & MCP Specifications

### HTTP Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check and total chunk count. |
| `POST` | `/upload` | Multipart file upload (`key: file`). Parses and indexes documents. |
| `GET` | `/documents` | Returns all uploaded document metadata (powers the **Memory Page**). |
| `GET` | `/history` | Returns query history (powers the **Chat History**). |
| `ALL` | `/mcp` | MCP Streamable HTTP transport endpoint. |

### MCP Tools

* **`ask_document`**: Searches indexed chunks for the exact source excerpt that answers the user question. Returns `{ status: "found", sourceText: "...", confidenceScore: ... }` or `"nothing found"`.
* **`document_stats`**: Returns statistics on total chunks, document count, and file lists.
* **`ping`**: Health and readiness check.

---

## 🔍 Testing with MCP Inspector

You can test and inspect the MCP server in isolation using the official MCP Inspector:

```bash
npx @modelcontextprotocol/inspector
```

1. Open the inspector in your browser (defaults to `http://localhost:5173`).
2. Set transport type to **Streamable HTTP**.
3. Point to `http://localhost:3030/mcp`.
4. Run `document_stats` or execute `ask_document` with questions against your uploaded documents.

---

## 📄 License
MIT

