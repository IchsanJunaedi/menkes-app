import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { PractitionersService } from './practitioners.service';
import { CreatePractitionerDto } from './dto/create-practitioner.dto';
import { UpdatePractitionerDto } from './dto/update-practitioner.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Practitioners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('practitioners')
export class PractitionersController {
    constructor(private readonly practitionersService: PractitionersService) { }

    @Post()
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Register a new Practitioner mapped to an existing System User and Organization' })
    @ApiResponse({ status: 201, description: 'Practitioner entity established.' })
    create(@Body() createPractitionerDto: CreatePractitionerDto) {
        return this.practitionersService.create(createPractitionerDto);
    }

    @Get(':id')
    @Roles('ADMIN', 'DOCTOR', 'NURSE', 'AUDITOR', 'PATIENT')
    @ApiOperation({ summary: 'Retrieve public/internal profiles of Practitioners and basic clinical footprint' })
    findOne(@Param('id') id: string) {
        return this.practitionersService.findOne(id);
    }

    @Patch(':id')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Update practitioner data (e.g., Organization transfers, specializations)' })
    update(@Param('id') id: string, @Body() updatePractitionerDto: UpdatePractitionerDto) {
        return this.practitionersService.update(id, updatePractitionerDto);
    }

    @Patch(':id/verify')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Verify practitioner identity/certificate explicitly enabling active clinical workflows' })
    verifyStr(@Param('id') id: string) {
        return this.practitionersService.verifyStr(id);
    }
}
