import { v4 as uuidv4 } from 'uuid';

/**
 * Abstract Class DocumentElement
 * Corresponds to 'abstract class document element render();' in architecture diagram.
 */
export class DocumentElement {
  constructor(type, id = null) {
    if (new.target === DocumentElement) {
      throw new TypeError("Cannot instantiate abstract class DocumentElement directly.");
    }
    this.id = id || uuidv4();
    this.type = type; // 'text' | 'image' | 'pagebreak'
    this.createdAt = new Date().toISOString();
  }

  /**
   * Abstract render() method.
   * Subclasses MUST override this method.
   */
  render() {
    throw new Error("Abstract method render() must be implemented by subclass.");
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      createdAt: this.createdAt
    };
  }
}

/**
 * TextElement Class (Subclass of DocumentElement)
 * Corresponds to 'text element render() [overridden]' in architecture diagram.
 */
export class TextElement extends DocumentElement {
  constructor({
    id = null,
    content = "",
    heading = "normal", // 'normal' | 'h1' | 'h2' | 'h3'
    bold = false,
    italic = false,
    underline = false,
    listType = "none", // 'none' | 'bullet' | 'numbered'
    align = "left"
  } = {}) {
    super("text", id);
    this.content = content;
    this.heading = heading;
    this.bold = Boolean(bold);
    this.italic = Boolean(italic);
    this.underline = Boolean(underline);
    this.listType = listType;
    this.align = align;
  }

  render() {
    let text = this.escapeHtml(this.content);
    if (this.bold) text = `<strong>${text}</strong>`;
    if (this.italic) text = `<em>${text}</em>`;
    if (this.underline) text = `<u>${text}</u>`;

    let html = "";
    if (this.heading === "h1") html = `<h1 style="text-align: ${this.align}">${text}</h1>`;
    else if (this.heading === "h2") html = `<h2 style="text-align: ${this.align}">${text}</h2>`;
    else if (this.heading === "h3") html = `<h3 style="text-align: ${this.align}">${text}</h3>`;
    else if (this.listType === "bullet") html = `<li style="text-align: ${this.align}">${text}</li>`;
    else if (this.listType === "numbered") html = `<li style="text-align: ${this.align}">${text}</li>`;
    else html = `<p style="text-align: ${this.align}">${text || "&nbsp;"}</p>`;

    return {
      id: this.id,
      type: "text",
      content: this.content,
      heading: this.heading,
      bold: this.bold,
      italic: this.italic,
      underline: this.underline,
      listType: this.listType,
      align: this.align,
      html
    };
  }

  escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  toJSON() {
    return {
      ...super.toJSON(),
      content: this.content,
      heading: this.heading,
      bold: this.bold,
      italic: this.italic,
      underline: this.underline,
      listType: this.listType,
      align: this.align
    };
  }
}

/**
 * ImageElement Class (Subclass of DocumentElement)
 * Corresponds to 'image element render() [overridden]' in architecture diagram.
 */
export class ImageElement extends DocumentElement {
  constructor({
    id = null,
    url = "",
    caption = "",
    alt = "Uploaded image",
    width = "100%"
  } = {}) {
    super("image", id);
    this.url = url;
    this.caption = caption;
    this.alt = alt;
    this.width = width;
  }

  render() {
    const html = `
      <figure class="doc-image-figure" style="text-align: center; margin: 1.5rem 0;">
        <img src="${this.url}" alt="${this.escapeHtml(this.alt)}" style="max-width: ${this.width}; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
        ${this.caption ? `<figcaption style="font-size: 0.875rem; color: #64748b; margin-top: 0.5rem;">${this.escapeHtml(this.caption)}</figcaption>` : ""}
      </figure>
    `.trim();

    return {
      id: this.id,
      type: "image",
      url: this.url,
      caption: this.caption,
      alt: this.alt,
      width: this.width,
      html
    };
  }

  escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  toJSON() {
    return {
      ...super.toJSON(),
      url: this.url,
      caption: this.caption,
      alt: this.alt,
      width: this.width
    };
  }
}

/**
 * PageBreakElement Class (Subclass of DocumentElement)
 * Represents a document page break separator.
 */
export class PageBreakElement extends DocumentElement {
  constructor({ id = null } = {}) {
    super("pagebreak", id);
  }

  render() {
    return {
      id: this.id,
      type: "pagebreak",
      html: `<div className="page-break-divider"><span className="page-break-label">--- Page Break ---</span></div>`
    };
  }
}

/**
 * Factory helper to instantiate correct DocumentElement subclass from JSON object.
 */
export function createElementFromJSON(json) {
  if (!json || !json.type) return null;
  if (json.type === "text") {
    return new TextElement(json);
  } else if (json.type === "image") {
    return new ImageElement(json);
  } else if (json.type === "pagebreak") {
    return new PageBreakElement(json);
  }
  throw new Error(`Unknown DocumentElement type: ${json.type}`);
}
