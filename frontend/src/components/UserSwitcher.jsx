import React from 'react';
import { UserCheck } from 'lucide-react';

export default function UserSwitcher({ users, activeUser, onSwitchUser }) {
  if (!users || users.length === 0) return null;

  const current = users.find(u => u.id === activeUser) || users[0];

  return (
    <div className="user-switcher" title="Switch active simulated user for testing sharing permissions">
      <img src={current.avatar} alt={current.name} className="user-avatar" />
      <select
        value={activeUser}
        onChange={(e) => onSwitchUser(e.target.value)}
        className="user-select"
      >
        {users.map(u => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.id === 'user_alice' ? 'Owner' : u.id === 'user_bob' ? 'Editor' : 'Viewer'})
          </option>
        ))}
      </select>
    </div>
  );
}
