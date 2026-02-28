import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) { }

    @Post()
    @Roles('ADMIN', 'NURSE')
    @ApiOperation({ summary: 'Register a new Patient and link to Master Patient Index' })
    @ApiResponse({ status: 201, description: 'Patient registered successfully.' })
    create(@Body() createPatientDto: CreatePatientDto) {
        return this.patientsService.create(createPatientDto);
    }

    @Get()
    @Roles('ADMIN', 'DOCTOR', 'NURSE')
    @ApiOperation({ summary: 'List all patients (paginated, searchable by NIK/Name)' })
    @ApiQuery({ name: 'skip', required: false, type: Number })
    @ApiQuery({ name: 'take', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    findAll(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('search') search?: string,
    ) {
        return this.patientsService.findAll(skip ? +skip : 0, take ? +take : 20, search);
    }

    @Get(':id')
    @Roles('ADMIN', 'DOCTOR', 'NURSE', 'PATIENT')
    @ApiOperation({ summary: 'Get complete Patient medical profile including allergies' })
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.patientsService.findOne(id, user);
    }

    @Patch(':id')
    @Roles('ADMIN', 'NURSE')
    @ApiOperation({ summary: 'Update patient demographic MPI properties' })
    update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
        return this.patientsService.update(id, updatePatientDto);
    }

    @Get(':id/timeline')
    @Roles('ADMIN', 'DOCTOR', 'NURSE', 'PATIENT')
    @ApiOperation({ summary: 'Get full chronologically ordered medical history' })
    getTimeline(@Param('id') id: string, @CurrentUser() user: any) {
        return this.patientsService.getTimeline(id, user);
    }
}
