import React from 'react';
import { FileText, Plus, Upload, Users, Trash2, Folder, ShieldAlert } from 'lucide-react';

export default function Sidebar({
  documents,
  activeDocId,
  activeUserId,
  onSelectDoc,
  onCreateDoc,
  onOpenImportModal,
  onDeleteDoc
}) {
  const myDocs = documents.filter(d => d.isOwner || d.ownerId === activeUserId);
  const sharedDocs = documents.filter(d => !d.isOwner && d.ownerId !== activeUserId);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-logo">
          <div className="brand-icon">
            <FileText size={20} />
          </div>
          <span>Ajaia Docs</span>
        </div>
      </div>

      <div className="sidebar-actions">
        <button className="btn-create" onClick={onCreateDoc}>
          <Plus size={18} />
          <span>New Document</span>
        </button>
        
        <button className="btn-import" onClick={onOpenImportModal}>
          <Upload size={16} />
          <span>Import File (.txt, .md, .docx)</span>
        </button>
      </div>

      <div className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">
            <Folder size={12} style={{ display: 'inline', marginRight: '4px' }} />
            My Documents ({myDocs.length})
          </div>
          <ul className="doc-list">
            {myDocs.length === 0 ? (
              <li style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                No owned documents. Click + New Document.
              </li>
            ) : (
              myDocs.map(doc => (
                <li
                  key={doc.id}
                  className={`doc-item ${doc.id === activeDocId ? 'active' : ''}`}
                  onClick={() => onSelectDoc(doc.id)}
                >
                  <div className="doc-item-title">
                    <FileText size={16} color="#1a73e8" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</span>
                  </div>
                  <button
                    className="btn-element-action"
                    style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${doc.title}"?`)) onDeleteDoc(doc.id);
                    }}
                    title="Delete document"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="nav-section" style={{ marginTop: '1.5rem' }}>
          <div className="nav-section-title">
            <Users size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Shared with Me ({sharedDocs.length})
          </div>
          <ul className="doc-list">
            {sharedDocs.length === 0 ? (
              <li style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                No shared documents.
              </li>
            ) : (
              sharedDocs.map(doc => (
                <li
                  key={doc.id}
                  className={`doc-item ${doc.id === activeDocId ? 'active' : ''}`}
                  onClick={() => onSelectDoc(doc.id)}
                >
                  <div className="doc-item-title">
                    <FileText size={16} color="#0288d1" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</span>
                  </div>
                  <span className={`badge-role role-${doc.userRole || 'viewer'}`}>
                    {doc.userRole || 'viewer'}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}
