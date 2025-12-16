import React from 'react';

interface Props {
  horasDadas?: number;
  horasRecibidas?: number;
}

const SummaryCards: React.FC<Props> = ({ horasDadas = 0, horasRecibidas = 0 }) => {
  const balance = horasDadas - horasRecibidas;
  const balanceLabel = `${balance > 0 ? '+' : ''}${balance}h`;

  return (
    <div className="client-cards">
      <div className="client-card">
        <div className="label">Horas dadas</div>
        <div className="value" id="h-dadas">
          {horasDadas}h
        </div>
        <div className="sub">En este ciclo</div>
      </div>
      <div className="client-card">
        <div className="label">Horas recibidas</div>
        <div className="value" id="h-recibidas">
          {horasRecibidas}h
        </div>
        <div className="sub">Apoyo de la comunidad</div>
      </div>
      <div className="client-card">
        <div className="label">Balance</div>
        <div className="value" id="balance">
          {balanceLabel}
        </div>
        <div className="sub">{balance >= 0 ? 'La comunidad te debe ' : 'Debes horas a la comunidad'}</div>
      </div>
    </div>
  );
};

export default SummaryCards;
