import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { UpdateEstadoSolicitudDto } from './dto/update-estado-solicitud.dto';
import { Roles } from '../auth/roles.decorator';
import { FamiliaGuard } from '../auth/familia.guard';

@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Post()
  @Roles('FAMILIA', 'ADMIN')
  @UseGuards(FamiliaGuard)
  create(@Body() dto: CreateSolicitudDto) {
    return this.solicitudesService.create(dto);
  }

  // GET /solicitudes
  // GET /solicitudes?familiaId=1
  // GET /solicitudes?estado=PENDIENTE
  // GET /solicitudes?familiaId=1&estado=PENDIENTE
  @Get()
  findAll(
    @Query('familiaId') familiaId?: string,
    @Query('estado') estado?: string,
    @Query('urgencia') urgencia?: string,
  ) {
    return this.solicitudesService.findAll({
      familiaId: familiaId ? Number(familiaId) : undefined,
      estado,
      urgencia,
    });
  }

  @Get('comunidad/:comunidadId')
  findByComunidad(@Param('comunidadId', ParseIntPipe) comunidadId: number) {
    return this.solicitudesService.findByComunidad(comunidadId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.solicitudesService.findOne(id);
  }

  // PATCH /solicitudes/5/estado
  @Patch(':id/estado')
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoSolicitudDto,
  ) {
    return this.solicitudesService.updateEstado(id, dto);
  }
}
