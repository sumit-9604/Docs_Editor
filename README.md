# Ajaia Docs - Collaborative Document Editor Inspired by Google Docs

A lightweight, full-stack collaborative document editor built with **React** and **Express / Node.js**, structured strictly around the provided Object-Oriented Architecture Diagram.

---

## 🏛️ Architecture & Design System

The application's backend and data flow directly mirror the object-oriented system design diagram:

```
+-------------------------------------------------------------------------------+
|                                  Client (React)                               |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
|                               DocumentEditor                                  |
|   - doc: Document                                                             |
|   - addText(content, options)                                                 |
|   - addImage(url, caption)                                                    |
|   - save(customStrategy)                                                      |
|   - renderDoc()                                                               |
+-------------------------------------------------------------------------------+
           |                                                       |
           v (1..*)                                                v (1..*)
+------------------------------------+          +-------------------------------+
|  AbstractPersistentSaveFunctions   |          |    Document CRUD Operations   |
|  + save(doc)                       |          |   - vector<DocumentElement>   |
|  + load(id)                        |          |   - create, read, update,     |
|  + delete(id)                      |          |     delete, list, share       |
+------------------------------------+          +-------------------------------+
           |                  |                        |
           v                  v                        v (1..*)
+-------------+        +--------------+   +------------------------------------+
|  SaveToDB   |        |  SaveToFile  |   | Abstract Class DocumentElement     |
+-------------+        +--------------+   | + render(): string | JSON          |
                                          +------------------------------------+
                                                     ^              ^
                                                     | (is-a)       | (is-a)
                                           +---------------+  +---------------+
                                           |  TextElement  |  | ImageElement  |
                                           +---------------+  +---------------+
```

### Key Components

1. **`DocumentElement` (Abstract Base Class)**: Defines the common interface for document nodes with abstract `render()`.
   - **`TextElement`**: Renders rich formatted text (Headings H1-H3, Bold, Italic, Underline, Bullet/Numbered Lists, Alignments).
   - **`ImageElement`**: Renders images with captions, alt text, and custom dimensions.
2. **`Document` Aggregate**: Holds document metadata (`id`, `title`, `ownerId`, `sharedWith`) and a `vector<DocumentElement>` element tree.
3. **`DocumentCRUD`**: Manages CRUD operations, user authorization, and element list operations.
4. **`AbstractPersistentSaveFunctions` (Strategy Pattern)**:
   - **`SaveToDB`**: Concrete strategy persisting documents, permissions, and element trees to disk store with atomic writes.
   - **`SaveToFile`**: Concrete strategy exporting documents directly into Markdown (`.md`), Plain Text (`.txt`), JSON (`.json`), or HTML (`.html`).
5. **`DocumentEditor` (Central Controller)**: Holds reference to `Document doc`, exposing `addText()`, `addImage()`, `save()`, and composite document rendering via `renderDoc()`.

---

## ⚡ Features

1. **Document Creation & Editing**:
   - Create, title rename, auto-save to DB, reopen documents.
   - Rich text formatting: Bold, Italic, Underline, Headings (H1, H2, H3), Bulleted & Numbered Lists, Alignments.
   - Image block insertion with captions.
2. **File Upload & Import**:
   - Upload and parse `.txt`, `.md`, and `.docx` files to automatically generate structured editable documents.
   - Image file upload support.
3. **Sharing & Access Control**:
   - Document Owner context (`ownerId`).
   - Share access with role levels (`editor` vs `viewer`).
   - Built-in **Simulated User Switcher** in header to test permissions seamlessly between:
     - **Alice Smith** (Default Owner)
     - **Bob Johnson** (Collaborator / Editor)
     - **Charlie Lee** (Viewer - Restricted Read-Only Mode)
4. **Persistence & Export**:
   - Persistent DB storage across browser refreshes.
   - Download document exports in `.md`, `.txt`, `.json`, or `.html` formats.
5. **Engineering Quality**:
   - Automated Jest unit & integration tests verifying diagram models, controller operations, permissions, and API endpoints.

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Option 1: Run Full App (Backend + Frontend)

From the project root:

```bash
# Install all dependencies (root, backend, frontend)
npm run install:all

# Run backend (port 5001) and frontend (port 3000) concurrently
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Option 2: Run Services Separately

#### Run Backend Server:
```bash
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:5001`.*

#### Run Frontend App:
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 🧪 Running Automated Tests

Run the unit and integration test suite verifying backend models, `DocumentEditor` controller, `SaveToDB` persistence, and API endpoint permissions:

```bash
cd backend
npm test
```

### Test Coverage:
- `DocumentElement` polymorphic subclass rendering (`TextElement` and `ImageElement`).
- `DocumentEditor` controller managing `vector<DocumentElement>`, saving to DB, and rendering composite document HTML.
- `GET /api/users` endpoint returning seeded users.
- API Document lifecycle, sharing authorization, and viewer 403 access restriction.

---

## 👥 Seeded Users for Testing Sharing Flows

Use the **User Switcher** dropdown in the top right of the application header to switch active user contexts instantly:

| User | ID | Role in Default Docs |
|---|---|---|
| **Alice Smith** | `user_alice` | Owner |
| **Bob Johnson** | `user_bob` | Shared Editor |
| **Charlie Lee** | `user_charlie` | Shared Viewer (Read-only banner active) |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Lucide Icons, Axios, Vanilla CSS (Design Tokens & Glassmorphism).
- **Backend**: Node.js, Express, Mammoth (.docx parser), Multer (File uploads), UUID, Jest, Supertest.
- **Persistence**: File-backed JSON DB (SQLite equivalent) for DB store; SaveToFile strategy for file exports.
