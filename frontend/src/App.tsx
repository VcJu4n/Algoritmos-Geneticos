import { useState } from 'react';
import AdminApp from './admin/AdminApp';
import ClientApp from './client/ClientApp';
import Login from './Login';
import { clearSession, getSession, type Session } from './auth';

function App() {
  const [session, setSession] = useState(getSession());

  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  const isClient = view === 'cliente' || view === 'client' || session?.role === 'FAMILIA';
  const Selected = isClient ? ClientApp : AdminApp;

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  if (!session) {
    return <Login onSuccess={(s) => setSession({ token: s.token, role: s.role, familiaId: s.familiaId })} />;
  }

  return <Selected onLogout={handleLogout} session={session as Session} />;
}

export default App;
