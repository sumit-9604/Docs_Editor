import React, { useState } from 'react';
import { X, Download, FileText, Code, FileCode } from 'lucide-react';

export default function ExportModal({
  document,
  onExport,
  onClose
}) {
  const [format, setFormat] = useState('md');
  const [loading, setLoading] = useState(false);

  if (!document) return null;

  const handleExportSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onExport(document.id, format);
      onClose();
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={20} color="#1a73e8" />
            <h3 className="modal-title">Export Document</h3>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Select format to export "{document.title}" using backend's <strong>SaveToFile</strong> strategy.
        </p>

        <form onSubmit={handleExportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <label
              style={{
                border: format === 'md' ? '2px solid #1a73e8' : '1px solid #e0e0e0',
                background: format === 'md' ? '#e8f0fe' : 'white',
                padding: '1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <input type="radio" name="fmt" value="md" checked={format === 'md'} onChange={() => setFormat('md')} style={{ display: 'none' }} />
              <FileCode size={20} color="#1a73e8" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Markdown (.md)</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Formatted text & headings</div>
              </div>
            </label>

            <label
              style={{
                border: format === 'txt' ? '2px solid #1a73e8' : '1px solid #e0e0e0',
                background: format === 'txt' ? '#e8f0fe' : 'white',
                padding: '1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <input type="radio" name="fmt" value="txt" checked={format === 'txt'} onChange={() => setFormat('txt')} style={{ display: 'none' }} />
              <FileText size={20} color="#1a73e8" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Plain Text (.txt)</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Unformatted plain text</div>
              </div>
            </label>

            <label
              style={{
                border: format === 'json' ? '2px solid #1a73e8' : '1px solid #e0e0e0',
                background: format === 'json' ? '#e8f0fe' : 'white',
                padding: '1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <input type="radio" name="fmt" value="json" checked={format === 'json'} onChange={() => setFormat('json')} style={{ display: 'none' }} />
              <Code size={20} color="#1a73e8" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>JSON (.json)</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Raw Element Tree vector</div>
              </div>
            </label>

            <label
              style={{
                border: format === 'html' ? '2px solid #1a73e8' : '1px solid #e0e0e0',
                background: format === 'html' ? '#e8f0fe' : 'white',
                padding: '1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <input type="radio" name="fmt" value="html" checked={format === 'html'} onChange={() => setFormat('html')} style={{ display: 'none' }} />
              <FileCode size={20} color="#1a73e8" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>HTML (.html)</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Web rendered document</div>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn-export" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-create"
              style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem' }}
            >
              {loading ? 'Exporting...' : 'Download File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
