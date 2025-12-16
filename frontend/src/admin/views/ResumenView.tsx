import React from 'react';
import type { AyudaAsignada } from '../../types';

interface CardItem {
  title: string;
  main: string;
  sub: string;
}

interface Props {
  cards: CardItem[];
  ayudasOrigen: AyudaAsignada[];
  formatDate: (value: string | Date) => string;
}

const ResumenView: React.FC<Props> = ({ cards, ayudasOrigen, formatDate }) => (
  <section>
    <div className="content-header">
      <div className="content-header-title">
        Resumen de ayni
        <span className="chip">Equilibrio y justicia comunitaria</span>
      </div>
      <div className="content-header-note">Ayudas dadas, recibidas y balance de la familia.</div>
    </div>

    <div className="cards-grid">
      {cards.map((c) => (
        <div className="card" key={c.title}>
          <h3>{c.title}</h3>
          <div className="card-main">{c.main}</div>
          <div className="card-sub">{c.sub}</div>
        </div>
      ))}
    </div>

    <div className="flex-between mt-md">
      <div className="section-title">
        <span className="icon-dot" /> Próximas ayudas de tu familia
      </div>
    </div>

    <table className="table mt-sm">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Destinatario</th>
          <th>Tarea</th>
          <th>Horas</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {ayudasOrigen.map((a) => (
          <tr key={a.id}>
            <td>{formatDate(a.fecha)}</td>
            <td>{a.destino?.nombre ?? `Familia ${a.destinoId}`}</td>
            <td>
              <span className="badge tipo-trabajo">{a.tipo}</span>
            </td>
            <td>{a.horas}</td>
            <td>
              <span className="badge estado">{a.estado}</span>
            </td>
          </tr>
        ))}
        {!ayudasOrigen.length && (
          <tr>
            <td colSpan={5} className="note-muted">
              No hay ayudas programadas como origen.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </section>
);

export type { CardItem };
export default ResumenView;
