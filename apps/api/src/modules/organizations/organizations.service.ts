import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
    constructor(private prisma: PrismaService) { }

    async create(createOrganizationDto: CreateOrganizationDto) {
        return this.prisma.organization.create({
            data: createOrganizationDto,
        });
    }

    async findAll() {
        // Return all organizations structurally including their nested child clinics
        return this.prisma.organization.findMany({
            where: { parentId: null }, // Only fetch root nodes explicitly, allowing clients to traverse via children
            include: {
                children: {
                    include: { children: true }
                }
            },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const organization = await this.prisma.organization.findUnique({
            where: { id },
            include: {
                parent: true,
                children: true,
                practitioners: {
                    include: { user: true }
                }
            },
        });

        if (!organization) {
            throw new NotFoundException(`Organization with ID ${id} not found`);
        }

        return organization;
    }

    async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
        await this.findOne(id); // Asserts existence
        return this.prisma.organization.update({
            where: { id },
            data: updateOrganizationDto,
        });
    }
}
