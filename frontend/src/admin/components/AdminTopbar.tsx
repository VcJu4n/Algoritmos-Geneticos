import React from 'react';

interface Props {
  apiUrl: string;
  familyName: string;
  onLogout?: () => void;
}

const AdminTopbar: React.FC<Props> = ({ apiUrl, familyName, onLogout }) => (
  <header className="topbar">
    <div className="topbar-title">
      <div className="topbar-logo">A+</div>
      <div>AYNI-PLUS-AG</div>
    </div>
    <div className="topbar-user">
      <span>{familyName}</span>
      <span className="pill">Modo admin · API {apiUrl}</span>
      {onLogout && (
        <button className="pill btn-logout" onClick={onLogout} type="button">
          Salir
        </button>
      )}
    </div>
  </header>
);

export default AdminTopbar;
