import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AllergiesService } from './allergies.service';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { UpdateAllergyDto } from './dto/update-allergy.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Allergies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
// NOTE: For clean REST mapping, we group the domain logically but accept the specific Patient ID
@Controller('patients/:patientId/allergies')
export class AllergiesController {
    constructor(private readonly allergiesService: AllergiesService) { }

    @Post()
    @Roles('DOCTOR', 'NURSE')
    @ApiOperation({ summary: 'Register a new Clinical Allergy or Intolerance to a specific Patient profile' })
    @ApiResponse({ status: 201, description: 'Allergy successfully recorded.' })
    create(@Param('patientId') patientId: string, @Body() createAllergyDto: CreateAllergyDto) {
        return this.allergiesService.create(patientId, createAllergyDto);
    }

    @Get()
    @Roles('ADMIN', 'DOCTOR', 'NURSE', 'AUDITOR', 'PATIENT')
    @ApiOperation({ summary: 'List all documented Allergies active for the specific Patient ID' })
    findAll(@Param('patientId') patientId: string) {
        // Controller routes explicitly through the nested patientId param
        return this.allergiesService.findAllByPatient(patientId);
    }

    @Get(':allergyId')
    @Roles('ADMIN', 'DOCTOR', 'NURSE')
    @ApiOperation({ summary: 'Retrieve specific details of an individual Allergy record' })
    findOne(@Param('allergyId') allergyId: string) {
        return this.allergiesService.findOne(allergyId);
    }

    @Patch(':allergyId')
    @Roles('DOCTOR', 'NURSE')
    @ApiOperation({ summary: 'Modify an Allergy profile (e.g. marking it inactive or amending symptoms)' })
    update(@Param('allergyId') allergyId: string, @Body() updateAllergyDto: UpdateAllergyDto) {
        return this.allergiesService.update(allergyId, updateAllergyDto);
    }

    @Delete(':allergyId')
    @Roles('DOCTOR', 'ADMIN')
    @ApiOperation({ summary: 'Delete a documented Allergy. Use cautiously, preferring status Updates internally.' })
    remove(@Param('allergyId') allergyId: string) {
        return this.allergiesService.remove(allergyId);
    }
}
