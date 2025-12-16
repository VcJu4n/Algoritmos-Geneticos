from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class FamiliaIn(BaseModel):
    id: int
    nombre: str
    comunidadId: int
    miembros: int
    horasDadas: int
    horasRecibidas: int


class SolicitudIn(BaseModel):
    id: int
    familiaId: int
    tipo: str  # "SIEMBRA", "COSECHA", etc.
    horasEstimadas: int
    urgencia: str  # "BAJA", "MEDIA", "ALTA"
    fechaInicio: datetime
    fechaFin: datetime


class ParametrosAG(BaseModel):
    tamanoPoblacion: int = Field(30, ge=2)
    maxGeneraciones: int = Field(50, ge=1)
    probCruzamiento: float = Field(0.7, ge=0.0, le=1.0)
    probMutacion: float = Field(0.1, ge=0.0, le=1.0)
    # Se prioriza el equilibrio/carga para evitar concentración de ayudas.
    pesoEquilibrio: float = Field(0.65, ge=0.0)
    pesoCobertura: float = Field(0.15, ge=0.0)
    pesoCarga: float = Field(0.2, ge=0.0)
    maxHorasPorFamilia: Optional[float] = Field(None, ge=0.0)
    seed: Optional[int] = None


class OptimizarAyniRequest(BaseModel):
    familias: List[FamiliaIn]
    solicitudes: List[SolicitudIn]
    parametros: Optional[ParametrosAG] = None


class AyudaOut(BaseModel):
    origenId: int
    destinoId: int
    solicitudId: int
    tipo: str
    fecha: datetime
    horas: int


class DetalleFitness(BaseModel):
    equilibrioAyni: float
    coberturaSolicitudes: float
    cargaMaximaPorFamilia: float
    maxDesbalance: float
    stdDevBalance: float
    generaciones: int


class OptimizarAyniResponse(BaseModel):
    ayudas: List[AyudaOut]
    fitness: float
    detalleFitness: DetalleFitness
