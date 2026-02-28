import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { EncountersService } from './encounters.service';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { UpdateEncounterDto } from './dto/update-encounter.dto';
import { ConditionDto, MedicationRequestDto, ObservationDto, ProcedureDto } from './dto/clinical-sub-resources.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Encounters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('encounters')
export class EncountersController {
    constructor(private readonly encountersService: EncountersService) { }

    @Post()
    @Roles('DOCTOR')
    @ApiOperation({ summary: 'Initiate a new clinical Encounter session' })
    @ApiResponse({ status: 201, description: 'Clinical encounter instantiated successfully.' })
    create(@Body() createEncounterDto: CreateEncounterDto) {
        return this.encountersService.create(createEncounterDto);
    }

    @Get(':id')
    @Roles('ADMIN', 'DOCTOR', 'NURSE', 'AUDITOR', 'PATIENT')
    @ApiOperation({ summary: 'Fetch fully populated clinical event history including diagnosis and procedures' })
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.encountersService.findOne(id, user);
    }

    @Patch(':id')
    @Roles('DOCTOR')
    @ApiOperation({ summary: 'Update primary encounter profile details (Notes, complaints, End Dates)' })
    update(
        @Param('id') id: string,
        @Body() updateEncounterDto: UpdateEncounterDto,
        @CurrentUser() user: any
    ) {
        // Only the owning practitioner can mutate active sessions
        return this.encountersService.update(id, updateEncounterDto, user.sub); // Keycloak 'sub' matches Practitioner 'userId' ideally
    }

    @Patch(':id/finish')
    @Roles('DOCTOR')
    @ApiOperation({ summary: 'Lock the Encounter explicitly marking all nested dependencies READ-ONLY' })
    finish(@Param('id') id: string, @CurrentUser() user: any) {
        return this.encountersService.finish(id, user.sub);
    }

    // --- NESTED CLINICAL OPERATIONS --- //

    @Post(':id/conditions')
    @Roles('DOCTOR')
    @ApiOperation({ summary: 'Attach a diagnosis condition (ICD-10) to the encounter session' })
    addCondition(@Param('id') id: string, @Body() dto: ConditionDto, @CurrentUser() user: any) {
        return this.encountersService.addCondition(id, dto, user);
    }

    @Post(':id/observations')
    @Roles('DOCTOR', 'NURSE')
    @ApiOperation({ summary: 'Log vital sign observation metrics (LOINC)' })
    addObservation(@Param('id') id: string, @Body() dto: ObservationDto, @CurrentUser() user: any) {
        return this.encountersService.addObservation(id, dto, user);
    }

    @Post(':id/procedures')
    @Roles('DOCTOR', 'NURSE')
    @ApiOperation({ summary: 'Record clinical procedure completion state (SNOMED)' })
    addProcedure(@Param('id') id: string, @Body() dto: ProcedureDto, @CurrentUser() user: any) {
        return this.encountersService.addProcedure(id, dto, user);
    }

    @Post(':id/medications')
    @Roles('DOCTOR')
    @ApiOperation({ summary: 'Issue a prescription implicitly verifying mapped Patient Allergies against constraints' })
    addMedicationRequest(@Param('id') id: string, @Body() dto: MedicationRequestDto, @CurrentUser() user: any) {
        return this.encountersService.addMedicationRequest(id, dto, user);
    }
}
