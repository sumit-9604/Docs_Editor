import mammoth from 'mammoth';
import { TextElement } from '../models/DocumentElement.js';

/**
 * Parses uploaded .txt, .md, or .docx files into structured DocumentElements.
 * @param {Buffer} buffer 
 * @param {string} mimetype 
 * @param {string} originalname 
 * @returns {Array<DocumentElement>}
 */
export async function parseFileToElements(buffer, mimetype, originalname) {
  const ext = originalname.split('.').pop().toLowerCase();
  const elements = [];

  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value || '';
    const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
    
    if (paragraphs.length === 0) {
      elements.push(new TextElement({ content: "Imported blank Word document.", heading: "normal" }));
    } else {
      paragraphs.forEach((p, index) => {
        const trimmed = p.trim();
        if (index === 0 && trimmed.length < 80) {
          elements.push(new TextElement({ content: trimmed, heading: "h1" }));
        } else {
          elements.push(new TextElement({ content: trimmed, heading: "normal" }));
        }
      });
    }
  } else {
    // .txt or .md or fallback text
    const text = buffer.toString('utf-8');
    const lines = text.split(/\r?\n/);
    let currentParagraph = "";

    for (let line of lines) {
      const trimmed = line.trim();
      
      // Markdown header detection
      if (trimmed.startsWith('# ')) {
        if (currentParagraph) {
          elements.push(new TextElement({ content: currentParagraph.trim(), heading: 'normal' }));
          currentParagraph = "";
        }
        elements.push(new TextElement({ content: trimmed.replace(/^#\s+/, ''), heading: 'h1' }));
      } else if (trimmed.startsWith('## ')) {
        if (currentParagraph) {
          elements.push(new TextElement({ content: currentParagraph.trim(), heading: 'normal' }));
          currentParagraph = "";
        }
        elements.push(new TextElement({ content: trimmed.replace(/^##\s+/, ''), heading: 'h2' }));
      } else if (trimmed.startsWith('### ')) {
        if (currentParagraph) {
          elements.push(new TextElement({ content: currentParagraph.trim(), heading: 'normal' }));
          currentParagraph = "";
        }
        elements.push(new TextElement({ content: trimmed.replace(/^###\s+/, ''), heading: 'h3' }));
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (currentParagraph) {
          elements.push(new TextElement({ content: currentParagraph.trim(), heading: 'normal' }));
          currentParagraph = "";
        }
        elements.push(new TextElement({ content: trimmed.replace(/^[-*]\s+/, ''), listType: 'bullet' }));
      } else if (trimmed === '') {
        if (currentParagraph) {
          elements.push(new TextElement({ content: currentParagraph.trim(), heading: 'normal' }));
          currentParagraph = "";
        }
      } else {
        currentParagraph += (currentParagraph ? " " : "") + trimmed;
      }
    }

    if (currentParagraph) {
      elements.push(new TextElement({ content: currentParagraph.trim(), heading: 'normal' }));
    }
  }

  if (elements.length === 0) {
    elements.push(new TextElement({ content: "Imported document content.", heading: "normal" }));
  }

  return elements;
}
