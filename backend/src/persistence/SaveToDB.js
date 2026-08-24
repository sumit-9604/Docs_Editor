import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AbstractPersistentSaveFunctions } from './AbstractPersistentSaveFunctions.js';
import { Document } from '../models/Document.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'documents_db.json');

/**
 * Concrete implementation of AbstractPersistentSaveFunctions for DB persistence.
 * Corresponds to 'save to db' box in architecture diagram.
 */
export class SaveToDB extends AbstractPersistentSaveFunctions {
  constructor(customDbPath = null) {
    super();
    this.dbPath = customDbPath || DB_FILE;
    this.ensureDbExists();
  }

  ensureDbExists() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.dbPath)) {
      const initialData = {
        documents: {},
        users: {
          "user_alice": { id: "user_alice", name: "Alice Smith", email: "alice@ajaia.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice" },
          "user_bob": { id: "user_bob", name: "Bob Johnson", email: "bob@ajaia.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob" },
          "user_charlie": { id: "user_charlie", name: "Charlie Lee", email: "charlie@ajaia.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie" }
        }
      };
      fs.writeFileSync(this.dbPath, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  }

  readData() {
    this.ensureDbExists();
    try {
      const raw = fs.readFileSync(this.dbPath, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error("Error reading DB file, returning empty store:", err);
      return { documents: {}, users: {} };
    }
  }

  writeData(data) {
    fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf-8');
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
    return Object.values(data.users || {});
  }
}
