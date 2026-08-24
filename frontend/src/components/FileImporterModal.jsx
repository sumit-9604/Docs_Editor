import React, { useState } from 'react';
import { X, Upload, FileText, FileCheck } from 'lucide-react';

export default function FileImporterModal({
  activeUserId,
  onImportFile,
  onClose
}) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      const ext = selected.name.split('.').pop().toLowerCase();
      if (!['txt', 'md', 'docx'].includes(ext)) {
        setError('Only .txt, .md, and .docx files are supported.');
        setFile(null);
        return;
      }
      setError(null);
      setFile(selected);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      await onImportFile(file);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={20} color="#1a73e8" />
            <h3 className="modal-title">Import Document File</h3>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Upload a file from your computer to convert it into a new collaborative editable document.
        </p>

        {error && (
          <div style={{ padding: '0.6rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', background: '#ffebee', color: '#c62828' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              background: '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => document.getElementById('file-import-input').click()}
          >
            <input
              id="file-import-input"
              type="file"
              accept=".txt,.md,.docx"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <FileCheck size={36} color="#2e7d32" />
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{file.name}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={36} color="#94a3b8" />
                <span style={{ fontWeight: 600, color: '#475569' }}>Click to select a file</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Supported formats: .txt, .md, .docx</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn-export" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="btn-create"
              style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem' }}
            >
              {loading ? 'Converting...' : 'Import Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
