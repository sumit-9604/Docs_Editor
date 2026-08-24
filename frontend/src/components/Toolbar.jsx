import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Plus,
  Save,
  Download,
  Scissors
} from 'lucide-react';

export default function Toolbar({
  activeElement,
  onApplyFormat,
  onAddTextBlock,
  onAddImageBlock,
  onAddPageBreak,
  canEdit,
  onSave,
  onOpenExport
}) {
  if (!canEdit) {
    return (
      <div className="toolbar-container">
        <span style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
          🔒 Read-only view. You do not have edit permission for this document.
        </span>
      </div>
    );
  }

  const currentHeading = activeElement?.heading || 'normal';
  const isBold = Boolean(activeElement?.bold);
  const isItalic = Boolean(activeElement?.italic);
  const isUnderline = Boolean(activeElement?.underline);
  const listType = activeElement?.listType || 'none';
  const align = activeElement?.align || 'left';

  return (
    <div className="toolbar-container">
      {/* Headings */}
      <div className="toolbar-group">
        <select
          value={currentHeading}
          onChange={(e) => onApplyFormat('heading', e.target.value)}
          className="toolbar-select"
          title="Text style"
        >
          <option value="normal">Normal Text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
      </div>

      {/* Formatting Toggles */}
      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${isBold ? 'active' : ''}`}
          onClick={() => onApplyFormat('bold', !isBold)}
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} />
        </button>

        <button
          className={`toolbar-btn ${isItalic ? 'active' : ''}`}
          onClick={() => onApplyFormat('italic', !isItalic)}
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} />
        </button>

        <button
          className={`toolbar-btn ${isUnderline ? 'active' : ''}`}
          onClick={() => onApplyFormat('underline', !isUnderline)}
          title="Underline (Ctrl+U)"
        >
          <Underline size={16} />
        </button>
      </div>

      {/* Alignments */}
      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${align === 'left' ? 'active' : ''}`}
          onClick={() => onApplyFormat('align', 'left')}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          className={`toolbar-btn ${align === 'center' ? 'active' : ''}`}
          onClick={() => onApplyFormat('align', 'center')}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          className={`toolbar-btn ${align === 'right' ? 'active' : ''}`}
          onClick={() => onApplyFormat('align', 'right')}
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
      </div>

      {/* Lists */}
      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${listType === 'bullet' ? 'active' : ''}`}
          onClick={() => onApplyFormat('listType', listType === 'bullet' ? 'none' : 'bullet')}
          title="Bulleted List"
        >
          <List size={16} />
        </button>
        <button
          className={`toolbar-btn ${listType === 'numbered' ? 'active' : ''}`}
          onClick={() => onApplyFormat('listType', listType === 'numbered' ? 'none' : 'numbered')}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
      </div>

      {/* Insert Elements */}
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={onAddTextBlock}
          title="Add Text Block"
        >
          <Plus size={16} />
        </button>
        <button
          className="toolbar-btn"
          onClick={onAddImageBlock}
          title="Insert Image"
        >
          <ImageIcon size={16} />
        </button>
        <button
          className="toolbar-btn"
          onClick={onAddPageBreak}
          title="Insert Page Break"
        >
          <Scissors size={16} />
        </button>
      </div>

      {/* Save & Export */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
        <button className="toolbar-btn" onClick={onSave} title="Save to Database">
          <Save size={16} />
        </button>
        <button className="toolbar-btn" onClick={onOpenExport} title="Export Document">
          <Download size={16} />
        </button>
      </div>
    </div>
  );
}
