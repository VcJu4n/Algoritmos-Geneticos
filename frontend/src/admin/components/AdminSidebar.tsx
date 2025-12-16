import React from 'react';
import type { Familia } from '../../types';

type View = 'resumen' | 'plan' | 'comunidad';

interface Props {
  familias: Familia[];
  selectedId: number | null;
  comunidades: { id: number; nombre: string }[];
  selectedComunidadId: number | null;
  comunidadName: Record<number, string>;
  view: View;
  onChangeView: (v: View) => void;
  onSelectComunidad: (id: number | null) => void;
  onSelectFamilia: (id: number | null) => void;
}

const AdminSidebar: React.FC<Props> = ({
  familias,
  selectedId,
   comunidades,
   selectedComunidadId,
  comunidadName,
  view,
  onChangeView,
   onSelectComunidad,
  onSelectFamilia,
}) => (
  <aside className="sidebar">
    <div>
      <h2>Comunidad</h2>
      <select
        className="family-select"
        value={selectedComunidadId ?? ''}
        onChange={(e) => onSelectComunidad(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">Todas</option>
        {comunidades.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>
    </div>

    <div>
      <h2>Familia actual</h2>
      <select
        className="family-select"
        value={selectedId ?? ''}
        onChange={(e) => onSelectFamilia(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">Selecciona una familia…</option>
        {familias.map((f) => (
          <option key={f.id} value={f.id}>
            {f.nombre} ({f.comunidad?.nombre ?? comunidadName[f.comunidadId] ?? '—'})
          </option>
        ))}
      </select>
    </div>

    <div>
      <h2>Menú</h2>
      <div className="menu">
        {(
          [
            ['resumen', 'Resumen de ayni'],
            ['plan', 'Plan de ayuda'],
            ['comunidad', 'Comunidad'],
          ] as [View, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            className={`menu-btn ${view === id ? 'active' : ''}`}
            onClick={() => onChangeView(id)}
            type="button"
          >
            <span className="icon-dot" />
            {label}
          </button>
        ))}
      </div>
    </div>


  </aside>
);

export type { View };
export default AdminSidebar;
