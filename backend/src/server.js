import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

import { SaveToDB } from './persistence/SaveToDB.js';
import { SaveToFile } from './persistence/SaveToFile.js';
import { DocumentCRUD } from './services/DocumentCRUD.js';
import { DocumentEditor } from './services/DocumentEditor.js';
import { parseFileToElements } from './utils/fileParser.js';

const safeDirname = () => {
  try {
    if (import.meta && import.meta.url && import.meta.url.startsWith('file:')) {
      return path.dirname(fileURLToPath(import.meta.url));
    }
  } catch (e) {}
  return process.cwd();
};
const __dirname = safeDirname();

const app = express();
const PORT = process.env.PORT || 5001;

// Setup directories safely for serverless
const UPLOADS_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(__dirname, '../uploads');

try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (err) {
  console.warn("Uploads directory fallback:", err.message);
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure multer for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Initialize Backend Architecture Components per Diagram
const saveToDB = new SaveToDB();
const saveToFile = new SaveToFile();
const documentCRUD = new DocumentCRUD(saveToDB);

/**
 * API Routes
 */

// 1. Get Seeded Users
app.get('/api/users', (req, res) => {
  try {
    const users = saveToDB.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. List Documents for Active User
app.get('/api/documents', async (req, res) => {
  try {
    const userId = req.query.userId || 'user_alice';
    const documents = await documentCRUD.listDocuments(userId);
    res.json(documents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create Document
app.post('/api/documents', async (req, res) => {
  try {
    const body = req.body || {};
    const { title, ownerId, initialElements } = body;
    const userId = ownerId || 'user_alice';
    const doc = await documentCRUD.createDocument({
      title: title || 'Untitled Document',
      ownerId: userId,
      initialElements: initialElements || []
    });
    
    // Wrap with DocumentEditor controller matching diagram
    const editor = new DocumentEditor(doc, saveToDB);
    const rendered = editor.renderDoc();
    
    res.status(201).json({
      document: doc.toJSON(),
      rendered,
      canEdit: true,
      userRole: 'owner'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get Document by ID (with DocumentEditor renderDoc)
app.get('/api/documents/:id', async (req, res) => {
  try {
    const userId = req.query.userId || 'user_alice';
    const result = await documentCRUD.getDocument(req.params.id, userId);
    if (!result) {
      return res.status(404).json({ error: "Document not found" });
    }

    const { doc, userRole, canEdit } = result;
    const editor = new DocumentEditor(doc, saveToDB);
    const rendered = editor.renderDoc();

    res.json({
      document: doc.toJSON(),
      rendered,
      userRole,
      canEdit
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

// 5. Update Document (Save title, elements via DocumentEditor)
app.put('/api/documents/:id', async (req, res) => {
  try {
    const userId = req.query.userId || 'user_alice';
    const body = req.body || {};
    const { title, elements } = body;

    const updatedDoc = await documentCRUD.updateDocument(
      req.params.id,
      { title, elements },
      userId
    );

    const editor = new DocumentEditor(updatedDoc, saveToDB);
    await editor.save();
    const rendered = editor.renderDoc();

    res.json({
      document: updatedDoc.toJSON(),
      rendered,
      canEdit: true
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

// 6. Delete Document
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const userId = req.query.userId || 'user_alice';
    const success = await documentCRUD.deleteDocument(req.params.id, userId);
    if (!success) {
      return res.status(404).json({ error: "Document not found or delete failed" });
    }
    res.json({ success: true, message: "Document deleted successfully" });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

// 7. Share Document
app.post('/api/documents/:id/share', async (req, res) => {
  try {
    const userId = req.query.userId || 'user_alice';
    const body = req.body || {};
    const { targetUserId, role } = body;

    if (!targetUserId) {
      return res.status(400).json({ error: "targetUserId is required for sharing." });
    }

    const updatedDoc = await documentCRUD.shareDocument(
      req.params.id,
      targetUserId,
      role || 'editor',
      userId
    );

    res.json({
      success: true,
      document: updatedDoc.toJSON(),
      message: `Document shared with ${targetUserId} as ${role || 'editor'}`
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

// 8. Export Document to File (SaveToFile persistence strategy)
app.post('/api/documents/:id/export', async (req, res) => {
  try {
    const userId = req.query.userId || 'user_alice';
    const body = req.body || {};
    const { format = 'md' } = body; // 'md' | 'txt' | 'json' | 'html'
    
    const { doc } = await documentCRUD.getDocument(req.params.id, userId);
    const editor = new DocumentEditor(doc, saveToFile);
    
    const exportResult = await editor.save(saveToFile, format);
    
    res.json({
      success: true,
      export: exportResult
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

// 9. Upload Image File into Document
app.post('/api/upload/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded." });
    }
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({
      url: imageUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. File Import Endpoint (.txt, .md, .docx)
app.post('/api/upload/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded for import." });
    }

    const userId = req.body.userId || 'user_alice';
    const filename = req.file.originalname;
    const title = filename.substring(0, filename.lastIndexOf('.')) || filename;

    // Parse file into vector<DocumentElement>
    const elements = await parseFileToElements(
      req.file.buffer || fs.readFileSync(req.file.path),
      req.file.mimetype,
      filename
    );

    // Clean temp file
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const doc = await documentCRUD.createDocument({
      title: `Imported: ${title}`,
      ownerId: userId,
      initialElements: elements
    });

    const editor = new DocumentEditor(doc, saveToDB);
    const rendered = editor.renderDoc();

    res.status(201).json({
      document: doc.toJSON(),
      rendered,
      canEdit: true,
      userRole: 'owner',
      importedElementsCount: elements.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server if run directly
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Docs Editor Backend running on http://localhost:${PORT}`);
  });
}

export default app;
