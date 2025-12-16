import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import type { AyudaAsignada, Familia, TipoAyuda, Urgencia } from '../types';
import ClientHeader from './components/ClientHeader';
import HelpList, { type HelpItem } from './components/HelpList';
import RequestHelpSheet, { type HelpRequestValues } from './components/RequestHelpSheet';
import SummaryCards from './components/SummaryCards';
import TabSwitcher from './components/TabSwitcher';
import { estadoAyudaLabels, tipoAyudaLabels } from './constants';
import './client.css';
import type { Session } from '../auth';

type Tab = 'doy' | 'recibo';

function mapAyudaToItem(ayuda: AyudaAsignada, tab: Tab): HelpItem {
  const isDoy = tab === 'doy';
  const otherFamily = isDoy
    ? ayuda.destino?.nombre ?? `Familia ${ayuda.destinoId}`
    : ayuda.origen?.nombre ?? `Familia ${ayuda.origenId}`;
  const badge = estadoAyudaLabels[ayuda.estado] ?? ayuda.estado;

  return {
    id: ayuda.id,
    title: tipoAyudaLabels[ayuda.tipo] ?? ayuda.tipo,
    subtitle: `${isDoy ? 'Para' : 'De'}: ${otherFamily} · Estado: ${badge}`,
    meta: `${ayuda.horas}h`,
    badge,
    tone: isDoy ? 'estado' : 'recibir',
  };
}

const ClientApp: React.FC<{ onLogout?: () => void; session?: Session }> = ({ onLogout, session }) => {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialFamiliaId = useMemo(() => {
    const raw = params.get('familiaId');
    if (raw) {
      const parsed = Number(raw);
      if (!Number.isNaN(parsed)) return parsed;
    }
    if (session?.familiaId) return session.familiaId;
    return undefined;
  }, [params, session]);

  const [familias, setFamilias] = useState<Familia[]>([]);
  const [familiaId, setFamiliaId] = useState<number | null>(initialFamiliaId ?? null);
  const [ayudasDoy, setAyudasDoy] = useState<AyudaAsignada[]>([]);
  const [ayudasRecibo, setAyudasRecibo] = useState<AyudaAsignada[]>([]);
  const [tab, setTab] = useState<Tab>('doy');
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'error'; message: string } | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const familiaSeleccionada = useMemo(
    () => familias.find((f) => f.id === familiaId) ?? familias[0] ?? null,
    [familias, familiaId],
  );

  const showBanner = (kind: 'ok' | 'error', message: string) => {
    setBanner({ kind, message });
    setTimeout(() => setBanner(null), 3000);
  };

  const loadFamilias = async () => {
    try {
      if (session?.role === 'ADMIN') {
        const data = await api<Familia[]>('/familias');
        setFamilias(data);
        if (!familiaId && data.length) {
          setFamiliaId(data[0].id);
        }
        return;
      }
      if (!session?.familiaId) {
        showBanner('error', 'No se pudo determinar la familia del usuario.');
        return;
      }
      const data = await api<Familia>(`/familias/${session.familiaId}`);
      setFamilias([data]);
      setFamiliaId(session.familiaId);
    } catch (err) {
      showBanner('error', (err as Error).message);
    }
  };

  const loadAyudas = async (id: number) => {
    try {
      setLoading(true);
      const [doy, recibo] = await Promise.all([
        api<AyudaAsignada[]>(`/ayudas?familiaId=${id}&rol=origen`),
        api<AyudaAsignada[]>(`/ayudas?familiaId=${id}&rol=destino`),
      ]);
      setAyudasDoy(doy);
      setAyudasRecibo(recibo);
    } catch (err) {
      showBanner('error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFamilias();
  }, []);

  useEffect(() => {
    if (familiaId) {
      void loadAyudas(familiaId);
    }
  }, [familiaId]);

  const handleSubmitRequest = async (values: HelpRequestValues) => {
    if (!familiaSeleccionada) {
      showBanner('error', 'Elige una familia para crear la solicitud.');
      return;
    }

    if (!values.tipo || !values.descripcion) {
      showBanner('error', 'Completa tipo y descripción.');
      return;
    }

    const horas = Number(values.horasEstimadas);
    if (!horas || Number.isNaN(horas)) {
      showBanner('error', 'Ingresa la cantidad de horas estimadas.');
      return;
    }

    try {
      setCreating(true);
      await api('/solicitudes', {
        method: 'POST',
        json: {
          familiaId: familiaSeleccionada.id,
          tipo: values.tipo as TipoAyuda,
          descripcion: values.descripcion,
          horasEstimadas: horas,
          urgencia: (values.urgencia || 'MEDIA') as Urgencia,
        },
      });
      setRequestOpen(false);
      showBanner('ok', 'Solicitud enviada. El comité evaluará y agendará la ayuda.');
      if (familiaId) {
        await loadAyudas(familiaId);
      }
    } catch (err) {
      showBanner('error', (err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const ayudasFiltradas = tab === 'doy' ? ayudasDoy : ayudasRecibo;
  const items: HelpItem[] = ayudasFiltradas.map((a) => mapAyudaToItem(a, tab));

  return (
    <div className="client-shell">
      <div className="client-app">
        <ClientHeader
          familia={familiaSeleccionada}
          familias={familias}
          onChangeFamilia={(id) => setFamiliaId(id)}
          onLogout={onLogout}
        />

        <main className="client-main">
          <div className="client-section-title">
            <span role="img" aria-label="resumen">
              
            </span>
            Mi resumen de ayni
          </div>
          <SummaryCards
            horasDadas={familiaSeleccionada?.horasDadas}
            horasRecibidas={familiaSeleccionada?.horasRecibidas}
          />

          <button className="client-btn-primary" onClick={() => setRequestOpen(true)}>
            SOS Pedir ayuda para una tarea
          </button>

          <div className="client-section-title" style={{ marginTop: '8px' }}>
            <span role="img" aria-label="ayni">
              
            </span>
            Mi ayni en este ciclo
          </div>

          <TabSwitcher<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: 'doy', label: 'Ayudas que doy' },
              { value: 'recibo', label: 'Ayudas que recibo' },
            ]}
          />

          {banner && <div className={`client-banner ${banner.kind}`}>{banner.message}</div>}
          {loading && <div className="client-loading">Cargando datos…</div>}

          <HelpList
            items={items}
            emptyText={
              tab === 'doy'
                ? 'No tienes ayudas programadas para brindar todavía.'
                : 'No tienes ayudas recibidas por ahora.'
            }
          />
        </main>

        <footer className="client-footer">
          Datos en vivo desde el backend NestJS. El Algoritmo Genético asignará las ayudas automáticamente.
        </footer>
      </div>

      <RequestHelpSheet
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        onSubmit={handleSubmitRequest}
        busy={creating}
        familiaNombre={familiaSeleccionada?.nombre}
      />
    </div>
  );
};

export default ClientApp;
