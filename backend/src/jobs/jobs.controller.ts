import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ForbiddenException,
  Req,
  UseGuards,
  Post,
  Body,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Roles } from '../auth/roles.decorator';
import { FamiliaGuard } from '../auth/familia.guard';
import { toAdminDetails, toFamilySummary } from './job.serializers';
import { CreateJobDto } from './dto/create-job.dto';
import { JobProgressDto } from './dto/job-progress.dto';
import { MicroserviceGuard } from '../auth/microservice.guard';
import { Public } from '../auth/public.decorator';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @Roles('ADMIN', 'FAMILIA')
  create(
    @Body() dto: CreateJobDto,
    @Req() req: any,
  ) {
    return this.jobsService.createJob(dto, req.user);
  }

  @Post(':id/progress')
  // El microservicio reporta con API key; es público pero protegido por MicroserviceGuard
  @Public()
  @UseGuards(MicroserviceGuard)
  async reportProgress(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: JobProgressDto,
  ) {
    return this.jobsService.recordProgress(id, dto);
  }

  @Get(':id/summary')
  @Roles('ADMIN', 'FAMILIA')
  async getSummary(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const job = await this.jobsService.findOneWithRelations(id);
    if (req.user?.role === 'FAMILIA' && job.familiaId !== req.user?.familiaId) {
      throw new ForbiddenException('Solo tu familia');
    }
    return req.user?.role === 'ADMIN'
      ? toAdminDetails(job)
      : toFamilySummary(job);
  }

  @Get(':id/details')
  @Roles('ADMIN')
  async getDetails(@Param('id', ParseIntPipe) id: number) {
    const job = await this.jobsService.findOneWithRelations(id);
    return toAdminDetails(job);
  }
}
