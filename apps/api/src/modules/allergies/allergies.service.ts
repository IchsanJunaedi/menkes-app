import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { UpdateAllergyDto } from './dto/update-allergy.dto';

@Injectable()
export class AllergiesService {
    constructor(private prisma: PrismaService) { }

    async create(patientId: string, createAllergyDto: CreateAllergyDto) {
        // Assert patient exists prior to mapping the ID internally
        const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient) throw new NotFoundException('Patient not found');

        return this.prisma.allergyIntolerance.create({
            data: {
                ...createAllergyDto,
                patientId,
                category: 'MEDICATION' // Provide sensible default based on current cross-check design
            },
        });
    }

    async findAllByPatient(patientId: string) {
        return this.prisma.allergyIntolerance.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const allergy = await this.prisma.allergyIntolerance.findUnique({
            where: { id },
        });

        if (!allergy) throw new NotFoundException(`Allergy ${id} not found`);
        return allergy;
    }

    async update(id: string, updateAllergyDto: UpdateAllergyDto) {
        await this.findOne(id); // Check exists
        return this.prisma.allergyIntolerance.update({
            where: { id },
            data: updateAllergyDto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.allergyIntolerance.delete({
            where: { id },
        });
    }
}
