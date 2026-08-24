import { v4 as uuidv4 } from 'uuid';
import { createElementFromJSON } from './DocumentElement.js';

/**
 * Document aggregate model
 * Contains metadata and vector<DocumentElement> elements.
 */
export class Document {
  constructor({
    id = null,
    title = "Untitled Document",
    ownerId = "user_alice",
    sharedWith = [], // Array of { userId: string, role: 'editor' | 'viewer' }
    elements = [],  // vector<DocumentElement>
    createdAt = null,
    updatedAt = null
  } = {}) {
    this.id = id || uuidv4();
    this.title = title;
    this.ownerId = ownerId;
    this.sharedWith = Array.isArray(sharedWith) ? sharedWith : [];
    
    // Ensure all elements are instances of DocumentElement (TextElement or ImageElement)
    this.elements = (elements || []).map(el => {
      if (typeof el.render === 'function') return el;
      return createElementFromJSON(el);
    }).filter(Boolean);

    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  addElement(element) {
    this.elements.push(element);
    this.updatedAt = new Date().toISOString();
    return element;
  }

  removeElement(elementId) {
    const initialLen = this.elements.length;
    this.elements = this.elements.filter(el => el.id !== elementId);
    if (this.elements.length !== initialLen) {
      this.updatedAt = new Date().toISOString();
    }
  }

  updateElement(elementId, updatedProps) {
    const el = this.elements.find(e => e.id === elementId);
    if (el) {
      Object.assign(el, updatedProps);
      this.updatedAt = new Date().toISOString();
    }
    return el;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      ownerId: this.ownerId,
      sharedWith: this.sharedWith,
      elements: this.elements.map(el => el.toJSON ? el.toJSON() : el),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
