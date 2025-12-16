-- CreateEnum
CREATE TYPE "TipoAyuda" AS ENUM ('SIEMBRA', 'COSECHA', 'RIEGO', 'LIMPIEZA_CANAL', 'CONSTRUCCION', 'PRESTAMO_HERRAMIENTA', 'PRESTAMO_ANIMAL', 'OTRA');

-- CreateEnum
CREATE TYPE "Urgencia" AS ENUM ('BAJA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('PENDIENTE', 'PLANIFICADA', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoAyuda" AS ENUM ('PROGRAMADO', 'REALIZADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Comunidad" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comunidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Familia" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "comunidadId" INTEGER NOT NULL,
    "miembros" INTEGER NOT NULL,
    "horasDadas" INTEGER NOT NULL DEFAULT 0,
    "horasRecibidas" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Familia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudAyuda" (
    "id" SERIAL NOT NULL,
    "familiaId" INTEGER NOT NULL,
    "tipo" "TipoAyuda" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "horasEstimadas" INTEGER NOT NULL,
    "urgencia" "Urgencia" NOT NULL DEFAULT 'MEDIA',
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolicitudAyuda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AyudaAsignada" (
    "id" SERIAL NOT NULL,
    "origenId" INTEGER NOT NULL,
    "destinoId" INTEGER NOT NULL,
    "solicitudId" INTEGER,
    "tipo" "TipoAyuda" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horas" INTEGER NOT NULL,
    "estado" "EstadoAyuda" NOT NULL DEFAULT 'PROGRAMADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AyudaAsignada_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Familia" ADD CONSTRAINT "Familia_comunidadId_fkey" FOREIGN KEY ("comunidadId") REFERENCES "Comunidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudAyuda" ADD CONSTRAINT "SolicitudAyuda_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AyudaAsignada" ADD CONSTRAINT "AyudaAsignada_origenId_fkey" FOREIGN KEY ("origenId") REFERENCES "Familia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AyudaAsignada" ADD CONSTRAINT "AyudaAsignada_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "Familia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AyudaAsignada" ADD CONSTRAINT "AyudaAsignada_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "SolicitudAyuda"("id") ON DELETE SET NULL ON UPDATE CASCADE;
