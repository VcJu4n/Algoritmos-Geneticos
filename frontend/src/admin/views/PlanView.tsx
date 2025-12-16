import React from 'react';
import type { AyudaAsignada, PlanResponse } from '../../types';

interface Props {
  ayudas: AyudaAsignada[];
  plan: PlanResponse | null;
  planSeleccionado: PlanResponse['comunidades'][number] | null;
  comunidadName: string;
  busy: boolean;
  onRefresh: () => void;
  onGenerate: () => void;
  onSimulate: () => void;
  formatDate: (value: string | Date) => string;
}

const PlanView: React.FC<Props> = ({
  ayudas,
  plan,
  planSeleccionado,
  comunidadName,
  busy,
  onRefresh,
  onGenerate,
  onSimulate,
  formatDate,
}) => (
  <section>
    <div className="content-header">
      <div className="content-header-title">
        Plan de ayuda generado
        <span className="chip">Solución propuesta por el AG</span>
      </div>
      <div className="content-header-note">Distribución de ayudas generadas automáticamente.</div>
    </div>

    <div className="flex-between mt-md">
      <div className="section-title">
        <span className="icon-dot" /> Detalle de intercambios {comunidadName ? `· ${comunidadName}` : ''}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-outline" onClick={onRefresh}>
          Refrescar
        </button>
        <button className="btn btn-outline" onClick={onSimulate} disabled={busy}>
          {busy ? 'Procesando…' : 'Completar programadas'}
        </button>
        <button className="btn btn-primary" onClick={onGenerate} disabled={busy}>
          {busy ? 'Generando…' : 'Generar plan'}
        </button>
      </div>
    </div>

    <table className="table mt-sm">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Quien ayuda</th>
          <th>A quién</th>
          <th>Tarea</th>
          <th>Horas</th>
        </tr>
      </thead>
      <tbody>
        {ayudas.map((a) => (
          <tr key={a.id}>
            <td>{formatDate(a.fecha)}</td>
            <td>{a.origen?.nombre ?? `Familia ${a.origenId}`}</td>
            <td>{a.destino?.nombre ?? `Familia ${a.destinoId}`}</td>
            <td>
              <span className="badge tipo-trabajo">{a.tipo}</span>
            </td>
            <td>{a.horas} h</td>
          </tr>
        ))}
        {!ayudas.length && (
          <tr>
            <td colSpan={5} className="note-muted">
              No hay ayudas asignadas todavía.
            </td>
          </tr>
        )}
      </tbody>
    </table>

    {plan && (
      <div className="cards-grid mt-md">
        <div className="card">
          <h3>Ayudas creadas</h3>
          <div className="card-main">{planSeleccionado ? planSeleccionado.totalAyudas : plan.totalAyudas}</div>
          <div className="card-sub">
            {planSeleccionado ? 'Cantidad en esta comunidad.' : 'Cantidad en el último plan generado.'}
          </div>
        </div>
        {planSeleccionado && (
          <div className="card">
            <h3>{comunidadName}</h3>
            <div className="card-main">{planSeleccionado.totalAyudas} ayudas</div>
            <div className="card-sub">
              Fitness: {typeof planSeleccionado.fitness === 'number' ? planSeleccionado.fitness.toFixed(3) : 'N/D'}
            </div>
          </div>
        )}
      </div>
    )}
  </section>
);

export default PlanView;
