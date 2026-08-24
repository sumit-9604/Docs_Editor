import { Document } from '../models/Document.js';
import { TextElement, ImageElement, createElementFromJSON } from '../models/DocumentElement.js';

/**
 * Document CRUD Operations Class
 * Corresponds to 'document CRUD operations vector<element>' box in architecture diagram.
 * Manages document lifecycle, user access permissions, and vector<DocumentElement> elements.
 */
export class DocumentCRUD {
  /**
   * @param {SaveToDB} dbStore 
   */
  constructor(dbStore) {
    this.dbStore = dbStore;
  }

  /**
   * Create a new document.
   */
  async createDocument({ title = "Untitled Document", ownerId, initialElements = [] }) {
    if (!ownerId) throw new Error("ownerId is required to create a document.");

    // Default initial text element if empty
    let elements = initialElements;
    if (!elements || elements.length === 0) {
      elements = [
        new TextElement({
          content: "Welcome to your new document! Start editing here...",
          heading: "normal"
        })
      ];
    }

    const doc = new Document({
      title,
      ownerId,
      sharedWith: [],
      elements
    });

    await this.dbStore.save(doc);
    return doc;
  }

  /**
   * Get a document by ID with permission check.
   */
  async getDocument(id, requestingUserId) {
    const doc = await this.dbStore.load(id);
    if (!doc) return null;

    const access = this.checkAccess(doc, requestingUserId);
    if (!access.canRead) {
      const err = new Error("Access Denied: You do not have permission to view this document.");
      err.status = 403;
      throw err;
    }

    return {
      doc,
      userRole: access.role,
      canEdit: access.canEdit
    };
  }

  /**
   * Update a document (title, vector elements).
   */
  async updateDocument(id, { title, elements, sharedWith }, requestingUserId) {
    const { doc, canEdit } = await this.getDocument(id, requestingUserId);
    if (!canEdit) {
      const err = new Error("Access Denied: You have read-only access to this document.");
      err.status = 403;
      throw err;
    }

    if (title !== undefined) doc.title = title;
    if (elements !== undefined) {
      doc.elements = elements.map(el => {
        if (typeof el.render === 'function') return el;
        return createElementFromJSON(el);
      }).filter(Boolean);
    }
    if (sharedWith !== undefined && doc.ownerId === requestingUserId) {
      doc.sharedWith = sharedWith;
    }

    doc.updatedAt = new Date().toISOString();
    await this.dbStore.save(doc);
    return doc;
  }

  /**
   * Delete a document. Only owner can delete.
   */
  async deleteDocument(id, requestingUserId) {
    const doc = await this.dbStore.load(id);
    if (!doc) return false;

    if (doc.ownerId !== requestingUserId) {
      const err = new Error("Access Denied: Only the owner can delete this document.");
      err.status = 403;
      throw err;
    }

    return await this.dbStore.delete(id);
  }

  /**
   * Share document with another user.
   */
  async shareDocument(id, targetUserId, role = 'editor', requestingUserId) {
    const doc = await this.dbStore.load(id);
    if (!doc) throw new Error("Document not found.");

    if (doc.ownerId !== requestingUserId) {
      const err = new Error("Access Denied: Only the owner can share this document.");
      err.status = 403;
      throw err;
    }

    if (targetUserId === doc.ownerId) {
      throw new Error("Cannot share document with yourself (you are the owner).");
    }

    // Remove existing entry if present
    doc.sharedWith = (doc.sharedWith || []).filter(s => s.userId !== targetUserId);
    // Add new role
    doc.sharedWith.push({ userId: targetUserId, role });

    doc.updatedAt = new Date().toISOString();
    await this.dbStore.save(doc);
    return doc;
  }

  /**
   * List all documents accessible to user.
   */
  async listDocuments(userId) {
    return await this.dbStore.list(userId);
  }

  /**
   * Permission helper.
   */
  checkAccess(doc, userId) {
    if (!userId) return { canRead: false, canEdit: false, role: 'none' };
    if (doc.ownerId === userId) return { canRead: true, canEdit: true, role: 'owner' };

    const shared = (doc.sharedWith || []).find(s => s.userId === userId);
    if (shared) {
      return {
        canRead: true,
        canEdit: shared.role === 'editor',
        role: shared.role
      };
    }

    return { canRead: false, canEdit: false, role: 'none' };
  }
}
