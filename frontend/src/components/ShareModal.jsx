import React, { useState } from 'react';
import { X, Users, Share2, Shield, Check } from 'lucide-react';

export default function ShareModal({
  document,
  users,
  activeUserId,
  onShare,
  onClose
}) {
  const [selectedUser, setSelectedUser] = useState('');
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [sharedList, setSharedList] = useState(document?.sharedWith || []);

  if (!document) return null;

  const isOwner = document.ownerId === activeUserId;
  const ownerUser = users.find(u => u.id === document.ownerId) || { name: document.ownerId, avatar: '' };

  const availableUsers = users.filter(u => u.id !== document.ownerId);

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await onShare(document.id, selectedUser, role);
      if (res && res.document && res.document.sharedWith) {
        setSharedList(res.document.sharedWith);
      } else {
        setSharedList(prev => [...prev.filter(s => s.userId !== selectedUser), { userId: selectedUser, role }]);
      }
      const targetName = users.find(u => u.id === selectedUser)?.name || selectedUser;
      setMessage({ type: 'success', text: `Access granted to ${targetName} as ${role}.` });
      setSelectedUser('');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Share2 size={20} color="#1a73e8" />
            <h3 className="modal-title">Share "{document.title}"</h3>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {message && (
          <div style={{
            padding: '0.6rem 0.85rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            background: message.type === 'success' ? '#e8f5e9' : '#ffebee',
            color: message.type === 'success' ? '#2e7d32' : '#c62828',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            {message.type === 'success' && <Check size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        {isOwner ? (
          <form onSubmit={handleShareSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid #e0e0e0', outline: 'none' }}
                required
              >
                <option value="">Select a team member...</option>
                {availableUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: '110px', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e0e0e0', outline: 'none' }}
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>

              <button
                type="submit"
                disabled={loading || !selectedUser}
                className="btn-create"
                style={{ padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                {loading ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </form>
        ) : (
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Only the document owner can invite new members.
          </p>
        )}

        <div style={{ marginTop: '0.5rem' }}>
          <h4 style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>People with access</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {/* Owner */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src={ownerUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Owner'} alt="Owner" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{ownerUser.name || document.ownerId}</div>
                  <div style={{ fontSize: '0.75rem', color: '#80868b' }}>Owner</div>
                </div>
              </div>
              <span className="badge-role role-owner">Owner</span>
            </div>

            {/* Shared users */}
            {sharedList.map(s => {
              const uObj = users.find(u => u.id === s.userId) || { name: s.userId, avatar: '' };
              return (
                <div key={s.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img src={uObj.avatar} alt={uObj.name} style={{ width: 28, height: 28, borderRadius: '50%' }} />
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{uObj.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#80868b' }}>{uObj.email}</div>
                    </div>
                  </div>
                  <span className={`badge-role role-${s.role}`}>
                    {s.role}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
