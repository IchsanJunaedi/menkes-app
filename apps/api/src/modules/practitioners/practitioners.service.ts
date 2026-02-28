import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePractitionerDto } from './dto/create-practitioner.dto';
import { UpdatePractitionerDto } from './dto/update-practitioner.dto';

@Injectable()
export class PractitionersService {
    constructor(private prisma: PrismaService) { }

    async create(createPractitionerDto: CreatePractitionerDto) {
        return this.prisma.practitioner.create({
            data: createPractitionerDto,
            include: {
                organization: true,
                user: true,
            },
        });
    }

    async findOne(id: string) {
        const practitioner = await this.prisma.practitioner.findUnique({
            where: { id },
            include: {
                organization: true,
                user: true,
                encounters: {
                    take: 10,
                    orderBy: { startDate: 'desc' }
                }
            },
        });

        if (!practitioner) {
            throw new NotFoundException(`Practitioner with ID ${id} not found`);
        }

        return practitioner;
    }

    async update(id: string, updatePractitionerDto: UpdatePractitionerDto) {
        await this.findOne(id); // Ensures entity exists
        return this.prisma.practitioner.update({
            where: { id },
            data: updatePractitionerDto,
            include: { organization: true },
        });
    }

    async verifyStr(id: string) {
        await this.findOne(id);
        return this.prisma.practitioner.update({
            where: { id },
            data: { isVerified: true },
        });
    }
}
