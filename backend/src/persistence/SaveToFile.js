import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AbstractPersistentSaveFunctions } from './AbstractPersistentSaveFunctions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXPORTS_DIR = path.join(__dirname, '../../exports');

/**
 * Concrete implementation of AbstractPersistentSaveFunctions for exporting to file system.
 * Corresponds to 'save to file' box in architecture diagram.
 */
export class SaveToFile extends AbstractPersistentSaveFunctions {
  constructor(exportDir = null) {
    super();
    this.exportDir = exportDir || EXPORTS_DIR;
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  /**
   * Save/Export document to disk file in requested format ('md' | 'txt' | 'json' | 'html').
   * @param {Document} document 
   * @param {string} format 
   */
  async save(document, format = 'md') {
    if (!document) throw new Error("No document provided to SaveToFile.save()");

    const sanitizedTitle = (document.title || 'Untitled').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    const filename = `${sanitizedTitle}_${document.id.slice(0, 8)}.${format}`;
    const filePath = path.join(this.exportDir, filename);

    let content = "";
    if (format === 'json') {
      content = JSON.stringify(document.toJSON(), null, 2);
    } else if (format === 'md') {
      content = this.convertToMarkdown(document);
    } else if (format === 'html') {
      content = this.convertToHtml(document);
    } else {
      content = this.convertToPlainText(document);
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    return {
      filename,
      filePath,
      format,
      size: content.length,
      content
    };
  }

  convertToMarkdown(doc) {
    let md = `# ${doc.title}\n\n`;
    for (const el of doc.elements) {
      if (el.type === 'text') {
        let text = el.content || "";
        if (el.bold) text = `**${text}**`;
        if (el.italic) text = `*${text}*`;
        if (el.underline) text = `<u>${text}</u>`;

        if (el.heading === 'h1') md += `# ${text}\n\n`;
        else if (el.heading === 'h2') md += `## ${text}\n\n`;
        else if (el.heading === 'h3') md += `### ${text}\n\n`;
        else if (el.listType === 'bullet') md += `- ${text}\n`;
        else if (el.listType === 'numbered') md += `1. ${text}\n`;
        else md += `${text}\n\n`;
      } else if (el.type === 'image') {
        md += `![${el.alt || 'Image'}](${el.url})\n`;
        if (el.caption) md += `*${el.caption}*\n`;
        md += `\n`;
      } else if (el.type === 'pagebreak') {
        md += `---\n\n`;
      }
    }
    return md;
  }

  convertToPlainText(doc) {
    let txt = `${doc.title.toUpperCase()}\n${'='.repeat(doc.title.length)}\n\n`;
    for (const el of doc.elements) {
      if (el.type === 'text') {
        txt += `${el.content}\n\n`;
      } else if (el.type === 'image') {
        txt += `[Image: ${el.caption || el.url}]\n\n`;
      } else if (el.type === 'pagebreak') {
        txt += `--- PAGE BREAK ---\n\n`;
      }
    }
    return txt;
  }

  convertToHtml(doc) {
    let html = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>${doc.title}</title>\n</head>\n<body style="font-family: sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem;">\n<h1>${doc.title}</h1>\n<hr/>\n`;
    for (const el of doc.elements) {
      if (el.type === 'pagebreak') {
        html += `<hr style="margin: 2rem 0; border: none; border-top: 2px dashed #ccc;" />\n`;
      } else {
        const rendered = typeof el.render === 'function' ? el.render() : el;
        html += (rendered.html || `<p>${el.content}</p>`) + "\n";
      }
    }
    html += `</body>\n</html>`;
    return html;
  }

  async load(id) {
    throw new Error("SaveToFile load() not supported for direct file export. Use SaveToDB for document loading.");
  }

  async delete(id) {
    return true;
  }

  async list(userId) {
    const files = fs.readdirSync(this.exportDir);
    return files.map(f => ({ name: f, path: path.join(this.exportDir, f) }));
  }
}
