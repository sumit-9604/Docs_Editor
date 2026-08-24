import { TextElement, ImageElement } from '../models/DocumentElement.js';

/**
 * DocumentEditor Class
 * Corresponds to central 'document editor' box in architecture diagram:
 *  - document doc
 *  - addtext
 *  - addimage
 *  - save
 *  - render doc
 */
export class DocumentEditor {
  /**
   * @param {Document} document 
   * @param {AbstractPersistentSaveFunctions} persistenceStrategy 
   */
  constructor(document, persistenceStrategy) {
    this.doc = document;
    this.persistenceStrategy = persistenceStrategy;
  }

  /**
   * Add a TextElement to doc's vector<DocumentElement>.
   * Corresponds to 'addtext' in diagram.
   */
  addText(content, options = {}) {
    const textEl = new TextElement({
      content,
      heading: options.heading || 'normal',
      bold: options.bold || false,
      italic: options.italic || false,
      underline: options.underline || false,
      listType: options.listType || 'none',
      align: options.align || 'left'
    });
    this.doc.addElement(textEl);
    return textEl;
  }

  /**
   * Add an ImageElement to doc's vector<DocumentElement>.
   * Corresponds to 'addimage' in diagram.
   */
  addImage(url, caption = "", alt = "Image", width = "100%") {
    const imgEl = new ImageElement({
      url,
      caption,
      alt,
      width
    });
    this.doc.addElement(imgEl);
    return imgEl;
  }

  /**
   * Save document using persistence strategy.
   * Corresponds to 'save' in diagram.
   */
  async save(customStrategy = null) {
    const strategy = customStrategy || this.persistenceStrategy;
    if (!strategy) {
      throw new Error("No persistence strategy configured for DocumentEditor.save()");
    }
    return await strategy.save(this.doc);
  }

  /**
   * Render document elements.
   * Corresponds to 'render doc' in diagram.
   * Calls render() on every DocumentElement in the vector.
   */
  renderDoc() {
    const renderedElements = (this.doc.elements || []).map(el => {
      if (typeof el.render === 'function') {
        return el.render();
      }
      return el;
    });

    const fullHtml = renderedElements.map(re => re.html || `<p>${re.content || ''}</p>`).join('\n');

    return {
      id: this.doc.id,
      title: this.doc.title,
      ownerId: this.doc.ownerId,
      sharedWith: this.doc.sharedWith,
      elements: renderedElements,
      html: fullHtml,
      updatedAt: this.doc.updatedAt
    };
  }
}
