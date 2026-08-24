import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar.jsx';
import Toolbar from './components/Toolbar.jsx';
import EditorCanvas from './components/EditorCanvas.jsx';
import UserSwitcher from './components/UserSwitcher.jsx';
import ShareModal from './components/ShareModal.jsx';
import FileImporterModal from './components/FileImporterModal.jsx';
import ExportModal from './components/ExportModal.jsx';
import { Share2, Download, Check, Cloud, RefreshCw } from 'lucide-react';

const API_BASE = '/api';

export default function App() {
  const [users, setUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState('user_alice');
  const [documents, setDocuments] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [elements, setElements] = useState([]);
  const [activeElementId, setActiveElementId] = useState(null);
  const [canEdit, setCanEdit] = useState(true);
  const [userRole, setUserRole] = useState('owner');
  
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [activeModal, setActiveModal] = useState(null); // 'share' | 'import' | 'export' | null
  
  const autoSaveTimerRef = useRef(null);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch documents whenever active user changes
  useEffect(() => {
    fetchDocuments(activeUserId);
  }, [activeUserId]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/users`);
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const fetchDocuments = async (userId) => {
    try {
      const res = await axios.get(`${API_BASE}/documents?userId=${userId}`);
      setDocuments(res.data);

      if (res.data.length > 0) {
        // Load first document if no document selected or if switching user
        loadDocument(res.data[0].id, userId);
      } else {
        // Create initial default document if empty
        createInitialDoc(userId);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  };

  const createInitialDoc = async (userId) => {
    try {
      const res = await axios.post(`${API_BASE}/documents`, {
        title: "Welcome to Ajaia Docs",
        ownerId: userId
      });
      fetchDocuments(userId);
    } catch (err) {
      console.error("Failed to create initial document:", err);
    }
  };

  const loadDocument = async (docId, userId = activeUserId) => {
    try {
      const res = await axios.get(`${API_BASE}/documents/${docId}?userId=${userId}`);
      const { document, userRole, canEdit } = res.data;
      setCurrentDoc(document);
      setElements(document.elements || []);
      setUserRole(userRole);
      setCanEdit(canEdit);
      if (document.elements && document.elements.length > 0) {
        setActiveElementId(document.elements[0].id);
      }
    } catch (err) {
      console.error("Error loading document:", err);
    }
  };

  const handleCreateNewDoc = async () => {
    try {
      const res = await axios.post(`${API_BASE}/documents`, {
        title: "Untitled Document",
        ownerId: activeUserId
      });
      const newDoc = res.data.document;
      fetchDocuments(activeUserId);
      setCurrentDoc(newDoc);
      setElements(newDoc.elements);
      setCanEdit(true);
      setUserRole('owner');
    } catch (err) {
      alert(`Error creating document: ${err.message}`);
    }
  };

  const handleTitleChange = (newTitle) => {
    if (!currentDoc || !canEdit) return;
    const updated = { ...currentDoc, title: newTitle };
    setCurrentDoc(updated);
    setDocuments(prevDocs => prevDocs.map(d => d.id === updated.id ? { ...d, title: newTitle } : d));
    triggerAutoSave(updated.id, newTitle, elements);
  };

  const handleSelectElement = (id) => {
    setActiveElementId(id);
  };

  const handleUpdateElement = (id, props) => {
    if (!canEdit) return;
    const updatedElements = elements.map(el => {
      if (el.id === id) return { ...el, ...props };
      return el;
    });
    setElements(updatedElements);
    triggerAutoSave(currentDoc.id, currentDoc.title, updatedElements);
  };

  const handleApplyFormat = (key, value) => {
    if (!canEdit || !activeElementId) return;
    handleUpdateElement(activeElementId, { [key]: value });
  };

  const handleAddTextBlock = (insertIndex = null) => {
    if (!canEdit) return;
    const newEl = {
      id: 'el_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: 'text',
      content: '',
      heading: 'normal',
      bold: false,
      italic: false,
      underline: false,
      listType: 'none',
      align: 'left'
    };

    let newElements;
    if (insertIndex !== null && insertIndex >= 0) {
      newElements = [...elements];
      newElements.splice(insertIndex, 0, newEl);
    } else {
      newElements = [...elements, newEl];
    }

    setElements(newElements);
    setActiveElementId(newEl.id);
    triggerAutoSave(currentDoc.id, currentDoc.title, newElements);
  };

  const handleAddImageBlock = async () => {
    if (!canEdit) return;
    const choice = confirm("Click OK to upload an Image File from your computer, or Cancel to enter an Image URL.");
    if (choice) {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        try {
          const res = await axios.post(`${API_BASE}/upload/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          const newEl = {
            id: 'img_' + Date.now(),
            type: 'image',
            url: res.data.url,
            caption: file.name,
            alt: file.name,
            width: "100%"
          };
          const newElements = [...elements, newEl];
          setElements(newElements);
          setActiveElementId(newEl.id);
          triggerAutoSave(currentDoc.id, currentDoc.title, newElements);
        } catch (err) {
          alert(`Image upload failed: ${err.message}`);
        }
      };
      fileInput.click();
    } else {
      const url = prompt("Enter Image URL:", "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80");
      if (!url) return;
      const newEl = {
        id: 'img_' + Date.now(),
        type: 'image',
        url: url,
        caption: "Sample document image",
        alt: "Image",
        width: "100%"
      };
      const newElements = [...elements, newEl];
      setElements(newElements);
      setActiveElementId(newEl.id);
      triggerAutoSave(currentDoc.id, currentDoc.title, newElements);
    }
  };

  const handleAddPageBreak = () => {
    if (!canEdit) return;
    const newEl = {
      id: 'pb_' + Date.now(),
      type: 'pagebreak'
    };
    const newElements = [...elements, newEl];
    setElements(newElements);
    triggerAutoSave(currentDoc.id, currentDoc.title, newElements);
  };

  const handleRemoveElement = (id) => {
    if (!canEdit || elements.length <= 1) return;
    const filtered = elements.filter(e => e.id !== id);
    setElements(filtered);
    if (activeElementId === id) {
      setActiveElementId(filtered[0]?.id || null);
    }
    triggerAutoSave(currentDoc.id, currentDoc.title, filtered);
  };

  const triggerAutoSave = (docId, title, els) => {
    setSaveStatus('saving');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await axios.put(`${API_BASE}/documents/${docId}?userId=${activeUserId}`, {
          title,
          elements: els
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error("Auto-save failed:", err);
        setSaveStatus('error');
      }
    }, 800);
  };

  const handleDeleteDoc = async (docId) => {
    try {
      await axios.delete(`${API_BASE}/documents/${docId}?userId=${activeUserId}`);
      const res = await axios.get(`${API_BASE}/documents?userId=${activeUserId}`);
      setDocuments(res.data);
      if (docId === currentDoc?.id) {
        if (res.data.length > 0) {
          loadDocument(res.data[0].id, activeUserId);
        } else {
          createInitialDoc(activeUserId);
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleShareDoc = async (docId, targetUserId, role) => {
    const res = await axios.post(`${API_BASE}/documents/${docId}/share?userId=${activeUserId}`, {
      targetUserId,
      role
    });
    // Refresh doc metadata
    loadDocument(docId, activeUserId);
    return res.data;
  };

  const handleImportFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', activeUserId);

    const res = await axios.post(`${API_BASE}/upload/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    fetchDocuments(activeUserId);
    const newDoc = res.data.document;
    setCurrentDoc(newDoc);
    setElements(newDoc.elements);
    setCanEdit(true);
    setUserRole('owner');
  };

  const handleExportDoc = async (docId, format) => {
    const res = await axios.post(`${API_BASE}/documents/${docId}/export?userId=${activeUserId}`, {
      format
    });

    const exportData = res.data.export;
    // Download directly in browser
    const blob = new Blob([exportData.content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = exportData.filename;
    link.click();
  };

  const activeElement = elements.find(e => e.id === activeElementId);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        documents={documents}
        activeDocId={currentDoc?.id}
        activeUserId={activeUserId}
        onSelectDoc={(id) => loadDocument(id, activeUserId)}
        onCreateDoc={handleCreateNewDoc}
        onOpenImportModal={() => setActiveModal('import')}
        onDeleteDoc={handleDeleteDoc}
      />

      {/* Main Workspace */}
      <main className="main-content">
        {/* Header */}
        <header className="app-header">
          <div className="header-left">
            <input
              type="text"
              value={currentDoc?.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={!canEdit}
              className="doc-title-input"
              placeholder="Untitled document"
            />
            <div className="save-status">
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Saving to DB...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Cloud size={14} color="#10b981" />
                  <span>Saved to DB</span>
                </>
              ) : (
                <span style={{ color: '#ef4444' }}>Save error</span>
              )}
            </div>
          </div>

          <div className="header-right">
            {/* User Switcher */}
            <UserSwitcher
              users={users}
              activeUser={activeUserId}
              onSwitchUser={(newUserId) => setActiveUserId(newUserId)}
            />

            <button
              className="btn-share"
              onClick={() => setActiveModal('share')}
              disabled={!currentDoc}
            >
              <Share2 size={16} />
              <span>Share</span>
            </button>

            <button
              className="btn-export"
              onClick={() => setActiveModal('export')}
              disabled={!currentDoc}
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </header>

        {/* Rich-Text Formatting Toolbar */}
        <Toolbar
          activeElement={activeElement}
          onApplyFormat={handleApplyFormat}
          onAddTextBlock={() => handleAddTextBlock()}
          onAddImageBlock={handleAddImageBlock}
          onAddPageBreak={handleAddPageBreak}
          canEdit={canEdit}
          onSave={() => triggerAutoSave(currentDoc.id, currentDoc.title, elements)}
          onOpenExport={() => setActiveModal('export')}
        />

        {/* Paper Canvas Document Editor */}
        <EditorCanvas
          document={currentDoc}
          elements={elements}
          activeElementId={activeElementId}
          onSelectElement={handleSelectElement}
          onUpdateElement={handleUpdateElement}
          onRemoveElement={handleRemoveElement}
          onAddTextBlock={handleAddTextBlock}
          canEdit={canEdit}
          userRole={userRole}
        />
      </main>

      {/* Modals */}
      {activeModal === 'share' && (
        <ShareModal
          document={currentDoc}
          users={users}
          activeUserId={activeUserId}
          onShare={handleShareDoc}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'import' && (
        <FileImporterModal
          activeUserId={activeUserId}
          onImportFile={handleImportFile}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'export' && (
        <ExportModal
          document={currentDoc}
          onExport={handleExportDoc}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
