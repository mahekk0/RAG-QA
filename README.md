# 🤖 RAG Document Intelligence

## 🌐 Live Demo - [Insert Live Demo URL]

RAG Document Intelligence is a powerful, AI-driven question-answering platform designed to interact intelligently with your PDF documents. By combining the latest advancements in Large Language Models (LLMs) with high-performance vector databases, the platform turns static documents into dynamic, queryable knowledge bases. 

This is a comprehensive full-stack intelligence tool built on the Retrieval-Augmented Generation (RAG) architecture. It enables accurate, context-aware information extraction without hallucinations, bridging the gap between raw unstructured document data and advanced semantic reasoning.

---

## 🚀 Key Features

### 📄 Intelligent Document Ingestion
A seamless pipeline for bringing unstructured data into the system.
- **PDF Parsing**: Robust extraction of text contents from uploaded PDF documents.
- **Semantic Chunking**: Intelligently splits massive documents into optimized, context-preserving segments.

### 🧠 Semantic Search & Retrieval
Deep understanding of the uploaded context.
- **High-Dimensional Embeddings**: Converts human-readable text into vector representations.
- **Vector Similarity Search**: Locates the most relevant document chunks based on user query intent, not just keyword matching.

### 💬 Conversational QA
Real-time, interactive querying.
- **Context-Aware Responses**: Formulates precise answers using exclusively the context retrieved from the source document.
- **Hallucination Prevention**: Strictly grounds the LLM’s responses in the uploaded data to ensure factual accuracy.

---

## ⚙️ RAG Architecture

The foundation of the platform relies on **Retrieval-Augmented Generation (RAG)**.

**Representation:**
- **Node / Chunk** = A semantically distinct segment of the document
- **Embedding** = The mathematical vector representation of that chunk in hyperspace

The semantic network is modeled via a Vector Database, storing chunks in a high-dimensional space for instant traversal and similarity matching.

### Core RAG Components Implemented

The Node.js backend natively implements a complete RAG pipeline directly on the uploaded documents:

1. **Document Parsing** (`pdf-parse`)
   - **What it does**: Reads binary PDF streams and extracts raw text.
   - **RAG use**: Provides the foundational text corpus for downstream processing.

2. **Text Splitting** (`@langchain/textsplitters`)
   - **What it does**: Breaks down monolithic text into manageable chunks with controlled overlap.
   - **RAG use**: Ensures context isn't lost at the boundaries of text segments while keeping payload sizes within embedding limits.

3. **Embedding Generation** (`@google/generative-ai`)
   - **What it does**: Transforms text chunks into mathematical vectors.
   - **RAG use**: Allows the system to map spatial relationships between the document's content and the user's questions.

4. **Vector Storage & Indexing** (`chromadb`)
   - **What it does**: Stores high-dimensional vectors and performs ultra-fast nearest-neighbor search.
   - **RAG use**: Acts as the intelligent memory bank, pulling the most relevant chunks in milliseconds when a user asks a question.

5. **LLM Generation** (`@langchain/google-genai`)
   - **What it does**: Processes the user query alongside the retrieved context.
   - **RAG use**: Synthesizes a natural language answer based solely on the provided factual context.

---

## 🛠️ Technology Stack

**Frontend**
- **Framework**: Express.js (with EJS Views)
- **Styling**: Vanilla CSS / JavaScript
- **Static Delivery**: Node.js static serving

**Backend**
- **Runtime**: Node.js
- **Framework**: Express
- **AI / Embeddings**: Google Gemini API
- **Vector Database**: ChromaDB
- **File Handling**: Multer
- **PDF Processing**: PDF-Parse
- **Orchestration**: LangChain JS

### Why these technologies?
- **Express + EJS**: Provides a fast, server-side rendered approach allowing for instant initial loads and robust form handling.
- **Gemini AI**: Google's frontier model provides state-of-the-art context windows and high-quality embeddings.
- **ChromaDB**: An AI-native open-source embedding database designed for developer simplicity and rapid prototyping of vector search applications.

---

## 🏗️ Project Architecture

```text
Browser Client (EJS Views / Vanilla JS)
       │
       ▼ (HTTP POST / Multipart Form)
       │
Express Application Layer (app.js)
       │
       ├──► 1. Upload Route (Multer)
       │       └──► PDF Parser (Raw Text)
       │       └──► Chunker (Text Segments)
       │       └──► Embedder (Gemini API)
       │       └──► Vector Store (ChromaDB)
       │
       ├──► 2. Query Route (JSON API)
               └──► Retriever (Similarity Search)
               └──► LLM Generation (Gemini API)
               └──► Context-Aware Answer
