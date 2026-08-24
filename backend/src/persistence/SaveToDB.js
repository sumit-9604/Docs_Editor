import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { AbstractPersistentSaveFunctions } from './AbstractPersistentSaveFunctions.js';
import { Document } from '../models/Document.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initial Seed Users Data
const INITIAL_SEED = {
  documents: {},
  users: {
    "user_alice": { id: "user_alice", name: "Alice Smith", email: "alice@ajaia.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice" },
    "user_bob": { id: "user_bob", name: "Bob Johnson", email: "bob@ajaia.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob" },
    "user_charlie": { id: "user_charlie", name: "Charlie Lee", email: "charlie@ajaia.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie" }
  }
};

/**
 * Concrete implementation of AbstractPersistentSaveFunctions for DB persistence.
 * Corresponds to 'save to db' box in architecture diagram.
 * Supports Vercel Serverless environment (/tmp fallback & memory cache).
 */
export class SaveToDB extends AbstractPersistentSaveFunctions {
  constructor(customDbPath = null) {
    super();
    this.memoryCache = JSON.parse(JSON.stringify(INITIAL_SEED));
    this.dbPath = customDbPath || this.resolveDbPath();
    this.ensureDbExists();
  }

  resolveDbPath() {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      return path.join(os.tmpdir(), 'documents_db.json');
    }
    return path.join(__dirname, '../../data/documents_db.json');
  }

  ensureDbExists() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(this.dbPath)) {
        fs.writeFileSync(this.dbPath, JSON.stringify(INITIAL_SEED, null, 2), 'utf-8');
      }
    } catch (err) {
      // Fallback to /tmp if primary directory is read-only (EROFS)
      try {
        this.dbPath = path.join(os.tmpdir(), 'documents_db.json');
        if (!fs.existsSync(this.dbPath)) {
          fs.writeFileSync(this.dbPath, JSON.stringify(INITIAL_SEED, null, 2), 'utf-8');
        }
      } catch (e) {
        console.warn("Using in-memory DB cache due to serverless read-only filesystem.");
      }
    }
  }

  readData() {
    try {
      this.ensureDbExists();
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.memoryCache = parsed;
        return parsed;
      }
    } catch (err) {
      console.warn("Read error from disk, serving memory cache:", err.message);
    }
    return this.memoryCache;
  }

  writeData(data) {
    this.memoryCache = data;
    try {
      this.ensureDbExists();
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.warn("Write error to disk, maintained in-memory:", err.message);
    }
  }

  /**
   * Save or update a document in DB.
   * @param {Document} document 
   */
  async save(document) {
    if (!document || !document.id) {
      throw new Error("Invalid document object provided to SaveToDB.save()");
    }
    const data = this.readData();
    data.documents[document.id] = document.toJSON();
    this.writeData(data);
    return document;
  }

  /**
   * Load a document by ID and instantiate as Document model with vector<DocumentElement>.
   * @param {string} id 
   */
  async load(id) {
    const data = this.readData();
    const docData = data.documents[id];
    if (!docData) return null;
    return new Document(docData);
  }

  /**
   * Delete a document by ID.
   * @param {string} id 
   */
  async delete(id) {
    const data = this.readData();
    if (data.documents[id]) {
      delete data.documents[id];
      this.writeData(data);
      return true;
    }
    return false;
  }

  /**
   * List all documents where user is owner or listed in sharedWith.
   * @param {string} userId 
   */
  async list(userId) {
    const data = this.readData();
    const result = [];
    for (const id in data.documents) {
      const docRaw = data.documents[id];
      const isOwner = docRaw.ownerId === userId;
      const sharedEntry = (docRaw.sharedWith || []).find(s => s.userId === userId);
      if (isOwner || sharedEntry) {
        result.push({
          ...docRaw,
          isOwner,
          userRole: isOwner ? 'owner' : (sharedEntry ? sharedEntry.role : 'none')
        });
      }
    }
    // Sort by updatedAt descending
    return result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  /**
   * Retrieve list of seeded users.
   */
  getUsers() {
    const data = this.readData();
    return Object.values(data.users || INITIAL_SEED.users);
  }
}
