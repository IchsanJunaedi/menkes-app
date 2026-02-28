import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
    constructor(private readonly organizationsService: OrganizationsService) { }

    @Post()
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Create a new healthcare Organization' })
    @ApiResponse({ status: 201, description: 'Organization successfully created.' })
    create(@Body() createOrganizationDto: CreateOrganizationDto) {
        return this.organizationsService.create(createOrganizationDto);
    }

    @Get()
    @Roles('ADMIN', 'DOCTOR', 'NURSE', 'AUDITOR')
    @ApiOperation({ summary: 'List all root-level Organizations with nested hierarchy' })
    findAll() {
        return this.organizationsService.findAll();
    }

    @Get(':id')
    @Roles('ADMIN', 'DOCTOR', 'NURSE', 'AUDITOR')
    @ApiOperation({ summary: 'Fetch extensive details of a single Organization and its Practitioners' })
    findOne(@Param('id') id: string) {
        return this.organizationsService.findOne(id);
    }

    @Patch(':id')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Update Organization properties' })
    update(@Param('id') id: string, @Body() updateOrganizationDto: UpdateOrganizationDto) {
        return this.organizationsService.update(id, updateOrganizationDto);
    }
}
