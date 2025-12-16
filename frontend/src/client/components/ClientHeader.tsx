import React from 'react';
import type { Familia } from '../../types';

interface Props {
  familia?: Familia | null;
  familias: Familia[];
  onChangeFamilia: (id: number) => void;
  onLogout?: () => void;
}

const ClientHeader: React.FC<Props> = ({ familia, familias, onChangeFamilia, onLogout }) => {
  const comunidadLabel = familia?.comunidad?.nombre ?? 'Sin comunidad';
  const regionLabel = familia?.comunidad?.region ? ` · Región ${familia.comunidad.region}` : '';

  return (
    <header className="client-header">
      <div>
        <h1>{familia ? `Hola, Familia ${familia.nombre} ` : 'Hola '}</h1>
        <p className="client-subtitle">
          Comunidad: {comunidadLabel}
          {regionLabel}
        </p>
        <div className="client-chip-row">
          <span className="client-chip">Vista cliente · AYNI-PLUS-AG</span>
          {onLogout && (
            <button type="button" className="client-btn-secondary" onClick={onLogout}>
              Salir
            </button>
          )}
        </div>
      </div>

      {familias.length > 1 && (
        <label className="client-selector">
          <span className="client-muted">Cambiar familia</span>
          <select
            value={familia?.id ?? familias[0]?.id ?? ''}
            onChange={(e) => onChangeFamilia(Number(e.target.value))}
          >
            {familias.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
          </select>
        </label>
      )}
    </header>
  );
};

export default ClientHeader;
