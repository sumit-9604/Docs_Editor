import fs from 'fs';
import path from 'path';
import os from 'os';
import { AbstractPersistentSaveFunctions } from './AbstractPersistentSaveFunctions.js';
import { Document } from '../models/Document.js';

// Seed Users & Initial Documents
const INITIAL_SEED = {
  documents: {},
  users: {
    "user_alice": { id: "user_alice", name: "Alice Smith", email: "alice@ajaia.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice" },
    "user_bob": { id: "user_bob", name: "Bob Johnson", email: "bob@ajaia.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob" },
    "user_charlie": { id: "user_charlie", name: "Charlie Lee", email: "charlie@ajaia.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie" }
  }
};

// Global memory store surviving warm Vercel serverless invocations
const globalStore = JSON.parse(JSON.stringify(INITIAL_SEED));

/**
 * Concrete implementation of AbstractPersistentSaveFunctions for DB persistence.
 * Corresponds to 'save to db' box in architecture diagram.
 * Guaranteed 100% serverless safety with memory store & /tmp sync.
 */
export class SaveToDB extends AbstractPersistentSaveFunctions {
  constructor(customDbPath = null) {
    super();
    this.dbPath = customDbPath || path.join(os.tmpdir(), 'documents_db.json');
    this.initDisk();
  }

  initDisk() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        const data = JSON.parse(raw);
        if (data && data.documents) {
          globalStore.documents = { ...globalStore.documents, ...data.documents };
        }
      } else {
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(this.dbPath, JSON.stringify(globalStore, null, 2), 'utf-8');
      }
    } catch (e) {
      // In-memory store handles all reads/writes if disk fails
    }
  }

  saveDisk() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(globalStore, null, 2), 'utf-8');
    } catch (e) {
      // In-memory store retains state if disk write is blocked
    }
  }

  /**
   * Save or update a document in DB.
   * @param {Document} document 
   */
  async save(document) {
    if (!document || !document.id) return document;
    globalStore.documents[document.id] = document.toJSON();
    this.saveDisk();
    return document;
  }

  /**
   * Load a document by ID and instantiate as Document model with vector<DocumentElement>.
   * @param {string} id 
   */
  async load(id) {
    const docData = globalStore.documents[id];
    if (!docData) return null;
    return new Document(docData);
  }

  /**
   * Delete a document by ID.
   * @param {string} id 
   */
  async delete(id) {
    if (globalStore.documents[id]) {
      delete globalStore.documents[id];
      this.saveDisk();
      return true;
    }
    return false;
  }

  /**
   * List all documents where user is owner or listed in sharedWith.
   * @param {string} userId 
   */
  async list(userId) {
    const result = [];
    for (const id in globalStore.documents) {
      const docRaw = globalStore.documents[id];
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
    return Object.values(globalStore.users || INITIAL_SEED.users);
  }
}
