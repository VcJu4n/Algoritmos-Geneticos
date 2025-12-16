import logging
import traceback
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import OptimizarAyniRequest, OptimizarAyniResponse, ParametrosAG
from .ag_engine import optimizar_ayni

app = FastAPI(
    title="AYNI-PLUS-AG - Servicio de Algoritmo Genetico",
    version="0.2.0",
    description="Microservicio para optimizar planes de ayni usando Algoritmos Geneticos.",
)

logger = logging.getLogger("ag-service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/optimizar-ayni", response_model=OptimizarAyniResponse)
def optimizar_ayni_endpoint(payload: OptimizarAyniRequest):
    if not payload.familias:
        raise HTTPException(status_code=400, detail="No hay familias en la peticion.")
    if not payload.solicitudes:
        raise HTTPException(status_code=400, detail="No hay solicitudes en la peticion.")

    params = payload.parametros or ParametrosAG()

    try:
        ayudas, fitness, detalle = optimizar_ayni(
            familias=payload.familias,
            solicitudes=payload.solicitudes,
            parametros=params,
        )
    except Exception as exc:  # pragma: no cover
        logger.exception("Error optimizando plan AG")
        raise HTTPException(status_code=500, detail=f"AG error: {exc}") from exc

    return OptimizarAyniResponse(
        ayudas=ayudas,
        fitness=fitness,
        detalleFitness=detalle,
    )
