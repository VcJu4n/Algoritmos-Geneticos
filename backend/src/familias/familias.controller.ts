import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FamiliasService } from './familias.service';
import { CreateFamiliaDto } from './dto/create-familia.dto';
import { Roles } from '../auth/roles.decorator';
import { FamiliaGuard } from '../auth/familia.guard';

@Controller('familias')
export class FamiliasController {
  constructor(private readonly familiasService: FamiliasService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateFamiliaDto) {
    return this.familiasService.create(dto);
  }

  // GET /familias  o  GET /familias?comunidadId=1
  @Get()
  @Roles('ADMIN')
  findAll(@Query('comunidadId') comunidadId?: string) {
    if (comunidadId) {
      return this.familiasService.findByComunidad(Number(comunidadId));
    }
    return this.familiasService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'FAMILIA')
  @UseGuards(FamiliaGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.familiasService.findOne(id);
  }
}
