import React from 'react';

export interface HelpItem {
  id: number;
  title: string;
  subtitle: string;
  meta: string;
  badge: string;
  tone: 'estado' | 'recibir';
}

interface Props {
  items: HelpItem[];
  emptyText?: string;
}

const HelpList: React.FC<Props> = ({ items, emptyText }) => {
  if (!items.length) {
    return <div className="client-empty">{emptyText ?? 'Sin registros por ahora.'}</div>;
  }

  return (
    <div className="client-list">
      {items.map((item) => (
        <div key={item.id} className="client-list-item">
          <div className="client-item-main">
            <div className="client-item-title">{item.title}</div>
            <div className="client-item-sub">{item.subtitle}</div>
          </div>
          <div className="client-item-meta">
            <span>{item.meta}</span>
            <span className={`client-badge ${item.tone}`}>{item.badge}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HelpList;
