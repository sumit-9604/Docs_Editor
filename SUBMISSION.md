# Submission Manifest - Ajaia Docs

## Overview
This submission contains the full-stack codebase, architecture documentation, AI workflow notes, and automated test suite for **Ajaia Docs**—a lightweight collaborative document editor inspired by Google Docs, built with **React** and **Express / Node.js**.

---

## 📦 What Is Included

| Deliverable File | Description | Status |
|---|---|---|
| **[README.md](file:///c:/Users/Sumit/OneDrive/Desktop/dummy%20dashboards/Docs_editor/README.md)** | Local setup, run scripts, test instructions, and API overview. | ✅ Complete |
| **[ARCHITECTURE.md](file:///c:/Users/Sumit/OneDrive/Desktop/dummy%20dashboards/Docs_editor/ARCHITECTURE.md)** | System architecture note mapping code directly to visual UML diagram. | ✅ Complete |
| **[AI_WORKFLOW.md](file:///c:/Users/Sumit/OneDrive/Desktop/dummy%20dashboards/Docs_editor/AI_WORKFLOW.md)** | AI instruction log detailing diagram-to-code translation, speed-ups, & verification. | ✅ Complete |
| **[SUBMISSION.md](file:///c:/Users/Sumit/OneDrive/Desktop/dummy%20dashboards/Docs_editor/SUBMISSION.md)** | Submission manifest and feature status. | ✅ Complete |
| **`LIVE_URL.txt`** | Public live deployment URL (Vercel). | ✅ Complete (`https://docs-editor-vert.vercel.app/`) |
| **`WALKTHROUGH_URL.txt`** | Text file template for walkthrough video link. | 📝 Template Provided |
| **`backend/`** | Express backend, models, services, persistence layers, file parsers, & tests. | ✅ Complete |
| **`frontend/`** | React + Vite frontend, toolbar, editor canvas, user switcher, & modals. | ✅ Complete |

---

## ✅ What Is Working & Completed

1. **Document Creation & Editing**:
   - Create, title rename, auto-save to DB, reopen documents.
   - Rich text formatting: Bold, Italic, Underline, Headings (H1/H2/H3), Bulleted & Numbered lists, Alignments, and Image insertions.
   - Automatic Multi-Page Pagination Engine partitioning long documents across distinct 11" paper sheets.

2. **File Upload & Import**:
   - Upload `.txt`, `.md`, or `.docx` files via **Import File** to generate structured editable documents.
   - Image file uploads via `POST /api/upload/image`.

3. **Sharing & Access Control**:
   - Owner context (`ownerId`), access sharing modal (`editor` vs `viewer`), and User Switcher to toggle between seeded accounts:
     - **Alice Smith** (`user_alice`): Owner
     - **Bob Johnson** (`user_bob`): Editor
     - **Charlie Lee** (`user_charlie`): Viewer (Read-only banner, 403 edit protection)

4. **Persistence & Export**:
   - DB persistence across browser refreshes via `SaveToDB`.
   - File exports in `.md`, `.txt`, `.json`, or `.html` formats via `SaveToFile`.

5. **Automated Testing & Engineering Quality**:
   - **4/4 passing automated Jest test suites** (`npm test`).
   - Clean Vite production compilation (`npm run build`).

---

## ⚡ Quick Start & Run Instructions

```bash
# 1. Install all dependencies (root, backend, frontend)
npm run install:all

# 2. Run backend (port 5001) and frontend (port 3000) concurrently
npm start

# 3. Run backend unit test suite
npm test
```

---

## 🔮 What We Would Build Next (With 2–4 Additional Hours)

1. **Real-time WebSockets / CRDT Synchronization**: Integrate Socket.io or Yjs for live multiplayer cursor position and character-by-character operational transform.
2. **Comment & Suggestion Threads**: Add inline element commenting threads for team review.
3. **Version History & Restore Points**: Allow users to inspect past auto-save snapshots and revert changes.
