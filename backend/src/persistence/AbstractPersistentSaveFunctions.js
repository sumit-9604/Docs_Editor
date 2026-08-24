/**
 * Abstract Persistent Save Functions
 * Corresponds to 'abstract persistent save functions' box in architecture diagram.
 */
export class AbstractPersistentSaveFunctions {
  constructor() {
    if (new.target === AbstractPersistentSaveFunctions) {
      throw new TypeError("Cannot instantiate abstract class AbstractPersistentSaveFunctions directly.");
    }
  }

  /**
   * Save a Document instance to storage.
   * @param {Document} document 
   */
  async save(document) {
    throw new Error("Abstract method save() must be implemented by subclass.");
  }

  /**
   * Load a document by ID.
   * @param {string} id 
   */
  async load(id) {
    throw new Error("Abstract method load() must be implemented by subclass.");
  }

  /**
   * Delete a document by ID.
   * @param {string} id 
   */
  async delete(id) {
    throw new Error("Abstract method delete() must be implemented by subclass.");
  }

  /**
   * List all documents accessible to a user.
   * @param {string} userId 
   */
  async list(userId) {
    throw new Error("Abstract method list() must be implemented by subclass.");
  }
}
