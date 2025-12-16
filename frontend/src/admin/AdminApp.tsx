import { useEffect, useMemo, useState } from 'react';
import { api, API_URL } from '../api';
import './admin.css';
import AdminTopbar from './components/AdminTopbar';
import AdminSidebar, { type View } from './components/AdminSidebar';
import ResumenView, { type CardItem } from './views/ResumenView';
import PlanView from './views/PlanView';
import ComunidadView, { type ComunidadStats } from './views/ComunidadView';
import type { AyudaAsignada, Comunidad, Familia, PlanResponse, SolicitudAyuda } from '../types';
import type { Session } from '../auth';

function formatDate(value: string | Date) {
  const date = new Date(value);
  return date.toLocaleDateString('es-BO', { weekday: 'short', day: '2-digit', month: 'short' });
}

function AdminApp({ onLogout }: { onLogout?: () => void; session?: Session }) {
  const [view, setView] = useState<View>('resumen');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [comunidades, setComunidades] = useState<Comunidad[]>([]);
  const [comunidadId, setComunidadId] = useState<number | null>(null);
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [familiaId, setFamiliaId] = useState<number | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudAyuda[]>([]);
  const [ayudas, setAyudas] = useState<AyudaAsignada[]>([]);
  const [plan, setPlan] = useState<PlanResponse | null>(null);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 3500);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadComunidades = async () => {
    try {
      const data = await api<Comunidad[]>('/comunidades');
      setComunidades(data);
      if (!comunidadId && data.length) {
        setComunidadId(data[0].id);
      }
    } catch (err) {
      showError((err as Error).message);
    }
  };

  const loadFamilias = async (comId?: number | null) => {
    try {
      const url = comId ? `/familias?comunidadId=${comId}` : '/familias';
      const data = await api<Familia[]>(url);
      setFamilias(data);
    } catch (err) {
      showError((err as Error).message);
    }
  };

  const loadSolicitudes = async (comId?: number | null) => {
    try {
      setBusy(true);
      const data = comId
        ? await api<SolicitudAyuda[]>(`/solicitudes/comunidad/${comId}`)
        : await api<SolicitudAyuda[]>('/solicitudes');
      setSolicitudes(data);
    } catch (err) {
      showError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const loadAyudas = async (comId?: number | null) => {
    try {
      setBusy(true);
      const url = comId ? `/ayudas?comunidadId=${comId}` : '/ayudas';
      const data = await api<AyudaAsignada[]>(url);
      setAyudas(data);
    } catch (err) {
      showError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void loadComunidades();
  }, []);

  useEffect(() => {
    if (comunidadId !== null) {
      void loadFamilias(comunidadId);
      void loadSolicitudes(comunidadId);
      void loadAyudas(comunidadId);
    }
  }, [comunidadId]);

  useEffect(() => {
    if (!familiaId && familias.length) {
      setFamiliaId(familias[0].id);
    } else if (familiaId && !familias.find((f) => f.id === familiaId) && familias.length) {
      setFamiliaId(familias[0].id);
    }
  }, [familiaId, familias]);

  const comunidadName = useMemo(
    () => Object.fromEntries(comunidades.map((c) => [c.id, c.nombre])),
    [comunidades],
  );

  const familiaSeleccionada = useMemo(
    () => familias.find((f) => f.id === familiaId) ?? familias[0] ?? null,
    [familias, familiaId],
  );

  const ayudasPorFamilia = useMemo(() => {
    if (!familiaSeleccionada) return { doy: [] as AyudaAsignada[], recibo: [] as AyudaAsignada[] };
    return {
      doy: ayudas.filter((a) => a.origenId === familiaSeleccionada.id),
      recibo: ayudas.filter((a) => a.destinoId === familiaSeleccionada.id),
    };
  }, [ayudas, familiaSeleccionada]);

  const statsComunidad: ComunidadStats = useMemo(() => {
    const totalFamilias = familias.length;
    const totalSolicitudes = solicitudes.length;
    const pendientes = solicitudes.filter((s) => s.estado === 'PENDIENTE').length;
    const totalAyudas = ayudas.length;
    const horasDadas = familias.reduce((acc, f) => acc + (f.horasDadas ?? 0), 0);
    const horasRecibidas = familias.reduce((acc, f) => acc + (f.horasRecibidas ?? 0), 0);
    return { totalFamilias, totalSolicitudes, pendientes, totalAyudas, horasDadas, horasRecibidas };
  }, [familias, solicitudes, ayudas]);

  const generarPlan = async () => {
    try {
      setBusy(true);
      const res = await api<PlanResponse>('/plan-ayni/generar', { method: 'POST' });
      setPlan(res);
      showToast('Plan generado');
      await Promise.all([loadAyudas(comunidadId), loadSolicitudes(comunidadId), loadFamilias(comunidadId)]);
    } catch (err) {
      showError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const completarProgramadas = async () => {
    try {
      setBusy(true);
      await api<{ completadas: number }>('/ayudas/simulacion/completar-programadas', { method: 'POST' });
      showToast('Ayudas programadas marcadas como realizadas');
      await Promise.all([loadAyudas(comunidadId), loadFamilias(comunidadId)]);
    } catch (err) {
      showError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const crearComunidad = async (payload: { nombre: string; region: string }) => {
    try {
      setBusy(true);
      await api('/comunidades', { method: 'POST', json: payload });
      showToast('Comunidad creada');
      await loadComunidades();
    } catch (err) {
      showError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const cardsResumen = (): CardItem[] => {
    const horasDadas = familiaSeleccionada?.horasDadas ?? 0;
    const horasRecibidas = familiaSeleccionada?.horasRecibidas ?? 0;
    const balance = horasDadas - horasRecibidas;
    const balanceTexto =
      balance > 0
        ? `Ha dado ${balance}h más de lo que ha recibido.`
        : balance < 0
          ? `Ha recibido ${Math.abs(balance)}h más de lo que ha dado.`
          : 'Equilibrio perfecto de ayni.';

    return [
      { title: 'Horas de ayuda dadas', main: `${horasDadas} h`, sub: 'Trabajo ofrecido a otras familias.' },
      { title: 'Horas de ayuda recibidas', main: `${horasRecibidas} h`, sub: 'Apoyo que la comunidad le ha devuelto.' },
      { title: 'Balance de ayni', main: `${balance > 0 ? `+${balance}` : balance} h`, sub: balanceTexto },
      {
        title: 'Recursos compartidos',
        main: `${familiaSeleccionada?.miembros ?? 0} miembros`,
        sub: `Comunidad: ${familiaSeleccionada?.comunidad?.nombre ?? comunidadName[familiaSeleccionada?.comunidadId ?? 0] ?? '—'}`,
      },
    ];
  };

  const solicitudesPendientes = solicitudes.filter((s) => s.estado === 'PENDIENTE');

  return (
    <div className="app-shell">
      <AdminTopbar
        apiUrl={API_URL}
        familyName={familiaSeleccionada ? familiaSeleccionada.nombre : 'Familia no seleccionada'}
        onLogout={onLogout}
      />

      {toast && <div className="toast success" style={{ margin: '8px 16px' }}>{toast}</div>}
      {error && <div className="toast error" style={{ margin: '8px 16px' }}>{error}</div>}

      <div className="main-layout">
        <AdminSidebar
          familias={familias}
          selectedId={familiaSeleccionada?.id ?? null}
          comunidades={comunidades}
          selectedComunidadId={comunidadId}
          comunidadName={comunidadName}
          view={view}
          onChangeView={setView}
          onSelectComunidad={(id) => {
            setComunidadId(id);
            setPlan(null);
          }}
          onSelectFamilia={setFamiliaId}
        />

        <main className="content">
          {view === 'resumen' && (
            <ResumenView cards={cardsResumen()} ayudasOrigen={ayudasPorFamilia.doy} formatDate={formatDate} />
          )}

          {view === 'plan' && (
            <PlanView
              ayudas={ayudas}
              plan={plan}
              comunidadName={comunidadName[comunidadId ?? 0] ?? 'Todas'}
              planSeleccionado={
                comunidadId && plan ? plan.comunidades.find((c) => c.comunidadId === comunidadId) ?? null : null
              }
              busy={busy}
              onRefresh={() => void loadAyudas(comunidadId)}
              onGenerate={() => void generarPlan()}
              onSimulate={() => void completarProgramadas()}
              formatDate={formatDate}
            />
          )}

          {view === 'comunidad' && (
            <ComunidadView
              stats={statsComunidad}
              solicitudesPendientes={solicitudesPendientes}
              onCreateComunidad={(data) => void crearComunidad(data)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminApp;
