import React, { useEffect, useState } from 'react';
import { api } from './api';
import type { Comunidad, LoginResponse } from './types';
import { saveSession } from './auth';

interface Props {
  onSuccess: (session: LoginResponse) => void;
}

const Login: React.FC<Props> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreFamilia, setNombreFamilia] = useState('');
  const [miembros, setMiembros] = useState('');
  const [comunidadId, setComunidadId] = useState('');
  const [comunidades, setComunidades] = useState<Comunidad[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'register') {
      void api<Comunidad[]>('/comunidades')
        .then((data) => {
          setComunidades(data);
          if (!comunidadId && data[0]?.id) setComunidadId(String(data[0].id));
        })
        .catch((err) => setError((err as Error).message));
    }
  }, [mode, comunidadId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Ingresa email y contraseña.');
      return;
    }
    if (mode === 'register') {
      const miembrosNum = Number(miembros);
      if (!nombreFamilia || !miembros || Number.isNaN(miembrosNum) || miembrosNum < 1) {
        setError('Completa nombre de familia y número de miembros.');
        return;
      }
      if (!comunidadId || Number.isNaN(Number(comunidadId))) {
        setError('Selecciona una comunidad existente (solo admin puede crear comunidades).');
        return;
      }
    }
    try {
      setBusy(true);
      const res =
        mode === 'login'
          ? await api<LoginResponse>('/auth/login', { method: 'POST', json: { email, password } })
          : await api<LoginResponse>('/auth/register/family', {
              method: 'POST',
              json: {
                email,
                password,
                nombreFamilia,
                miembros: Number(miembros),
                comunidadId: Number(comunidadId),
              },
            });
      saveSession({ token: res.token, role: res.role, familiaId: res.familiaId ?? null });
      onSuccess(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-tabs">
          {[
            ['login', 'Ingresar'],
            ['register', 'Crear cuenta familia'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`login-tab ${mode === id ? 'active' : ''}`}
              onClick={() => setMode(id as 'login' | 'register')}
            >
              {label}
            </button>
          ))}
        </div>
        <h1>{mode === 'login' ? 'Ingresar a AYNI-PLUS-AG' : 'Registro de familia'}</h1>
        <p className="login-subtitle">
          {mode === 'login'
            ? 'Usa tus credenciales (ADMIN o FAMILIA).'
            : 'Crea la cuenta de tu familia en una comunidad existente.'}
        </p>
        <form onSubmit={submit} className="login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ayni.com"
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
          </label>
          {mode === 'register' && (
            <>
              <label>
                Comunidad (elige una existente)
                <select value={comunidadId} onChange={(e) => setComunidadId(e.target.value)}>
                  <option value="">Selecciona</option>
                  {comunidades.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.region})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Nombre de la familia
                <input
                  type="text"
                  value={nombreFamilia}
                  onChange={(e) => setNombreFamilia(e.target.value)}
                  placeholder="Familia Quispe"
                />
              </label>
              <label>
                Número de miembros
                <input
                  type="number"
                  value={miembros}
                  onChange={(e) => setMiembros(e.target.value)}
                  placeholder="Ej: 4"
                  min={1}
                />
              </label>
            </>
          )}
          {error && <div className="login-error">{error}</div>}
          <button type="submit" disabled={busy} className="login-btn">
            {busy ? (mode === 'login' ? 'Accediendo…' : 'Creando cuenta…') : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
