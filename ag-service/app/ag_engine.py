import math
import random
from datetime import datetime, timedelta
from typing import Dict, List, Sequence, Tuple

from .schemas import AyudaOut, DetalleFitness, FamiliaIn, SolicitudIn, ParametrosAG


def _clamp(val: float, min_v: float, max_v: float) -> float:
    return max(min_v, min(val, max_v))


def _random_date(start: datetime, end: datetime) -> datetime:
    if end <= start:
        return start
    delta = end - start
    offset = random.random() * delta.total_seconds()
    return start + timedelta(seconds=offset)


def _candidatos_para_solicitud(solicitud: SolicitudIn, familias: Sequence[FamiliaIn]) -> List[FamiliaIn]:
    destino_id = solicitud.familiaId
    destino = next((f for f in familias if f.id == destino_id), None)
    mismas = [f for f in familias if f.id != destino_id and (destino and f.comunidadId == destino.comunidadId)]
    otras = [f for f in familias if f.id != destino_id and (not destino or f.comunidadId != destino.comunidadId)]
    return mismas or otras


def _construir_individuo(
    familias: Sequence[FamiliaIn],
    solicitudes: Sequence[SolicitudIn],
    max_horas_por_familia: float | None,
) -> List[AyudaOut]:
    horas_asignadas: Dict[int, float] = {}
    balance_actual: Dict[int, float] = {f.id: float(f.horasDadas - f.horasRecibidas) for f in familias}
    ayudas: List[AyudaOut] = []

    # Si no llega límite desde el backend, estimar uno suave (promedio * 1.1) para evitar acaparamiento.
    if max_horas_por_familia is None and familias:
        total_horas = sum(sol.horasEstimadas for sol in solicitudes) if solicitudes else 0
        max_horas_por_familia = (total_horas / len(familias)) * 1.1 if total_horas > 0 else None

    for sol in solicitudes:
        candidatos = _candidatos_para_solicitud(sol, familias)
        if not candidatos:
            continue

        # Ordenar por quien más debe “devolver” (balance más negativo) y con menos horas asignadas.
        candidatos = sorted(
            candidatos,
            key=lambda c: (balance_actual.get(c.id, 0), horas_asignadas.get(c.id, 0)),
        )

        elegido = None
        for cand in candidatos:
            horas_actuales = horas_asignadas.get(cand.id, 0)
            if max_horas_por_familia is not None and horas_actuales + sol.horasEstimadas > max_horas_por_familia:
                continue
            elegido = cand
            break

        # Si nadie cumple el límite, tomar al primero ordenado (al menos respeta balance).
        if elegido is None:
            elegido = candidatos[0]

        fecha = _random_date(sol.fechaInicio, sol.fechaFin)
        ayudas.append(
            AyudaOut(
                origenId=elegido.id,
                destinoId=sol.familiaId,
                solicitudId=sol.id,
                tipo=sol.tipo,
                fecha=fecha,
                horas=sol.horasEstimadas,
            )
        )
        horas_asignadas[elegido.id] = horas_asignadas.get(elegido.id, 0) + sol.horasEstimadas
        balance_actual[elegido.id] = balance_actual.get(elegido.id, 0) + sol.horasEstimadas

    return ayudas


def _fitness(
    familias: Sequence[FamiliaIn],
    solicitudes: Sequence[SolicitudIn],
    individuo: Sequence[AyudaOut],
    pesos: Tuple[float, float, float],
    max_horas_por_familia: float | None,
) -> Tuple[float, DetalleFitness]:
    # Peso de equilibrio priorizado para castigar concentración.
    peso_eq, peso_cov, peso_carga = pesos
    horas_dadas: Dict[int, float] = {f.id: float(f.horasDadas) for f in familias}
    horas_recibidas: Dict[int, float] = {f.id: float(f.horasRecibidas) for f in familias}

    penalizacion = 0.0

    for ayuda in individuo:
        horas_dadas[ayuda.origenId] = horas_dadas.get(ayuda.origenId, 0) + ayuda.horas
        horas_recibidas[ayuda.destinoId] = horas_recibidas.get(ayuda.destinoId, 0) + ayuda.horas
        sol = next((s for s in solicitudes if s.id == ayuda.solicitudId), None)
        if sol:
            if ayuda.fecha < sol.fechaInicio or ayuda.fecha > sol.fechaFin:
                penalizacion += 0.05
        if max_horas_por_familia is not None and horas_dadas.get(ayuda.origenId, 0) > max_horas_por_familia:
            # Penalización más fuerte por romper el límite duro de horas.
            penalizacion += 0.15

    balances = []
    for f in familias:
        bal = horas_dadas.get(f.id, 0) - horas_recibidas.get(f.id, 0)
        balances.append(bal)

    if balances:
        promedio = sum(balances) / len(balances)
        varianza = sum((b - promedio) ** 2 for b in balances) / len(balances)
        std_dev = math.sqrt(varianza)
        max_desbalance = max(abs(b - promedio) for b in balances)
        score_eq = 1.0 / (1.0 + std_dev)
    else:
        std_dev = 0.0
        max_desbalance = 0.0
        score_eq = 1.0

    total_solicitudes = len(solicitudes)
    solicitudes_cubiertas = len({a.solicitudId for a in individuo})
    score_cov = solicitudes_cubiertas / total_solicitudes if total_solicitudes else 0.0

    horas_por_familia = list(horas_dadas.values())
    total_horas = sum(horas_por_familia)
    if total_horas > 0:
        max_horas = max(horas_por_familia)
        score_carga = _clamp(1.0 - (max_horas / total_horas), 0.0, 1.0)
    else:
        max_horas = 0.0
        score_carga = 1.0

    # Penalización dura si una familia concentra demasiadas horas o ayudas.
    umbral_share_horas = 0.3  # 30% del total de horas permitido.
    if total_horas > 0 and (max_horas / total_horas) > umbral_share_horas:
        penalizacion += 0.25

    ayudas_por_familia: Dict[int, int] = {}
    for ayuda in individuo:
        ayudas_por_familia[ayuda.origenId] = ayudas_por_familia.get(ayuda.origenId, 0) + 1

    total_ayudas = sum(ayudas_por_familia.values())
    if total_ayudas > 0:
        max_ayudas = max(ayudas_por_familia.values())
        if (max_ayudas / total_ayudas) > 0.35:  # 35% de las ayudas
            penalizacion += 0.2

    denominador = max(peso_eq + peso_cov + peso_carga, 1e-6)
    fitness = (peso_eq * score_eq + peso_cov * score_cov + peso_carga * score_carga) / denominador
    fitness = max(fitness - penalizacion, 0.0)

    detalle = DetalleFitness(
        equilibrioAyni=score_eq,
        coberturaSolicitudes=score_cov,
        cargaMaximaPorFamilia=score_carga,
        maxDesbalance=max_desbalance,
        stdDevBalance=std_dev,
        generaciones=0,
    )
    return fitness, detalle


def _seleccionar_padre(poblacion: Sequence[Tuple[List[AyudaOut], float]]) -> List[AyudaOut]:
    torneo = random.sample(poblacion, k=min(3, len(poblacion)))
    torneo_ordenado = sorted(torneo, key=lambda x: x[1], reverse=True)
    return torneo_ordenado[0][0]


def _crossover(p1: Sequence[AyudaOut], p2: Sequence[AyudaOut]) -> List[AyudaOut]:
    hijo = []
    max_len = max(len(p1), len(p2))
    for i in range(max_len):
        if i < len(p1) and i < len(p2):
            gene = p1[i] if random.random() < 0.5 else p2[i]
        elif i < len(p1):
            gene = p1[i]
        else:
            gene = p2[i]
        hijo.append(gene)
    return hijo


def _mutar(
    individuo: List[AyudaOut],
    familias: Sequence[FamiliaIn],
    solicitudes: Sequence[SolicitudIn],
    prob_mutacion: float,
) -> List[AyudaOut]:
    nuevo = []
    for gene in individuo:
        if random.random() < prob_mutacion:
            sol = next((s for s in solicitudes if s.id == gene.solicitudId), None)
            if sol:
                candidatos = _candidatos_para_solicitud(sol, familias)
                if candidatos:
                    nuevo_origen = random.choice(candidatos)
                    gene = AyudaOut(
                        origenId=nuevo_origen.id,
                        destinoId=gene.destinoId,
                        solicitudId=gene.solicitudId,
                        tipo=gene.tipo,
                        fecha=_random_date(sol.fechaInicio, sol.fechaFin),
                        horas=gene.horas,
                    )
        nuevo.append(gene)
    return nuevo


def optimizar_ayni(
    familias: List[FamiliaIn],
    solicitudes: List[SolicitudIn],
    parametros: ParametrosAG,
) -> Tuple[List[AyudaOut], float, DetalleFitness]:
    if parametros.seed is not None:
        random.seed(parametros.seed)

    if not familias:
        return [], 0.0, DetalleFitness(
            equilibrioAyni=0.0,
            coberturaSolicitudes=0.0,
            cargaMaximaPorFamilia=0.0,
            maxDesbalance=0.0,
            stdDevBalance=0.0,
            generaciones=0,
        )

    poblacion: List[List[AyudaOut]] = [
        _construir_individuo(familias, solicitudes, parametros.maxHorasPorFamilia)
        for _ in range(parametros.tamanoPoblacion)
    ]

    poblacion_eval: List[Tuple[List[AyudaOut], float, DetalleFitness]] = []

    mejor_individuo: List[AyudaOut] = []
    mejor_fit = -1.0
    mejor_detalle = None

    pesos = (
        parametros.pesoEquilibrio,
        parametros.pesoCobertura,
        parametros.pesoCarga,
    )

    for gen in range(parametros.maxGeneraciones):
        poblacion_eval = []
        for ind in poblacion:
            fit, det = _fitness(familias, solicitudes, ind, pesos, parametros.maxHorasPorFamilia)
            poblacion_eval.append((ind, fit, det))
            if fit > mejor_fit:
                mejor_fit = fit
                mejor_individuo = ind
                # det ya trae generaciones; evitamos pasarla dos veces.
                mejor_detalle = DetalleFitness(
                    **det.dict(exclude={"generaciones"}),
                    generaciones=gen + 1,
                )

        poblacion_eval.sort(key=lambda x: x[1], reverse=True)
        elite = poblacion_eval[0][0]
        nueva_pob: List[List[AyudaOut]] = [elite]

        while len(nueva_pob) < parametros.tamanoPoblacion:
            padre1 = _seleccionar_padre([(i, f) for i, f, _ in poblacion_eval])
            padre2 = _seleccionar_padre([(i, f) for i, f, _ in poblacion_eval])

            if random.random() < parametros.probCruzamiento:
                hijo = _crossover(padre1, padre2)
            else:
                hijo = list(padre1)

            hijo = _mutar(hijo, familias, solicitudes, parametros.probMutacion)
            nueva_pob.append(hijo)

        poblacion = nueva_pob

    if mejor_detalle is None:
        mejor_detalle = DetalleFitness(
            equilibrioAyni=0.0,
            coberturaSolicitudes=0.0,
            cargaMaximaPorFamilia=0.0,
            maxDesbalance=0.0,
            stdDevBalance=0.0,
            generaciones=parametros.maxGeneraciones,
        )

    return mejor_individuo, mejor_fit, mejor_detalle
