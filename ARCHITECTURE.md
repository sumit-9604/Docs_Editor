# Architecture & System Design Note - Ajaia Docs

## Overview

Ajaia Docs is a lightweight collaborative document editor built with **React** (frontend) and **Express / Node.js** (backend). The system architecture strictly implements the Object-Oriented design diagram provided in the assignment specifications.

---

## 🏛️ UML Architecture Diagram Mapping

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
|             |        |              |   | + render(): string | JSON          |
+-------------+        +--------------+   +------------------------------------+
                                                     ^              ^              ^
                                                     | (is-a)       | (is-a)       | (is-a)
                                           +---------------+  +---------------+  +------------------+
                                           |  TextElement  |  | ImageElement  |  | PageBreakElement |
                                           +---------------+  +---------------+  +------------------+
```

### Component Roles & Responsibilities

1. **`DocumentElement` (Abstract Base Class)**:
   - File: `backend/src/models/DocumentElement.js`
   - Defines the core contract `render()` for all document node types.
   - **`TextElement`**: Overrides `render()` to handle rich formatting, heading levels (H1, H2, H3), lists (bulleted, numbered), and inline text alignment.
   - **`ImageElement`**: Overrides `render()` to render image figures with captions, alt text, and dynamic sizing.
   - **`PageBreakElement`**: Overrides `render()` to handle multi-page sheet pagination breaks.

2. **`Document` Aggregate**:
   - File: `backend/src/models/Document.js`
   - Holds metadata (`id`, `title`, `ownerId`, `sharedWith`) and a `vector<DocumentElement>` elements list.

3. **`DocumentCRUD` Service**:
   - File: `backend/src/services/DocumentCRUD.js`
   - Manages document CRUD operations, user authorization, permissions checks (`owner` vs `editor` vs `viewer`), and deserializes elements via `createElementFromJSON()`.

4. **`AbstractPersistentSaveFunctions` (Strategy Pattern)**:
   - File: `backend/src/persistence/AbstractPersistentSaveFunctions.js`
   - **`SaveToDB`**: Concrete strategy persisting documents, element vectors, and access control lists to disk store (`documents_db.json`).
   - **`SaveToFile`**: Concrete strategy exporting documents directly into Markdown (`.md`), Plain Text (`.txt`), JSON (`.json`), or HTML (`.html`).

5. **`DocumentEditor` (Central Controller)**:
   - File: `backend/src/services/DocumentEditor.js`
   - Encapsulates `doc` reference, providing `addText()`, `addImage()`, `save()`, and composite document rendering via `renderDoc()`.

6. **Client Layer (React)**:
   - Files: `frontend/src/App.jsx`, `Toolbar.jsx`, `EditorCanvas.jsx`, `Sidebar.jsx`, `ShareModal.jsx`, `FileImporterModal.jsx`, `ExportModal.jsx`
   - Renders a multi-page paper sheet document canvas and handles real-time debounced auto-saves to the Express backend.

---

## ⚖️ Technical Trade-offs & Priorities

1. **Custom Canvas vs Third-Party Editor Wrapper**:
   - *Prioritized*: Custom contenteditable paper sheet canvas mapped directly to `vector<DocumentElement>`.
   - *Why*: Maintained strict 1:1 alignment with the provided UML backend architecture, avoided heavy dependencies, and guaranteed 100% deterministic serialization.

2. **Simulated User Switcher vs Full Auth Overhead**:
   - *Prioritized*: A seeded user switcher (Alice [Owner], Bob [Editor], Charlie [Viewer]).
   - *Why*: Kept scope focused on document editing and access control logic without forcing reviewers to deal with login/registration friction.

3. **Automatic Multi-Page Pagination Engine**:
   - *Prioritized*: Dynamic 11" paper sheet partitioning (`.doc-page-sheet`).
   - *Why*: Solved text spilling/overflow bugs for large documents (e.g. 34 elements) and provided a realistic Google Docs paper layout experience.
