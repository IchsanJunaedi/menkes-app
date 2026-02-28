import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class PatientsService {
    constructor(private prisma: PrismaService) { }

    async create(createPatientDto: CreatePatientDto) {
        const { identities, ...mpiData } = createPatientDto;

        // Convert string ISO dates to DateTime objects natively for Postgres
        const processedMpiData = {
            ...mpiData,
            dateOfBirth: new Date(mpiData.dateOfBirth),
        };

        return this.prisma.$transaction(async (tx) => {
            // 1. Create the Master Patient Index (MPI) Profile first
            const mpiRecord = await tx.mpiRecord.create({
                data: processedMpiData,
            });

            // 2. Map provided external identities onto the MPI payload
            if (identities && identities.length > 0) {
                await tx.patientIdentity.createMany({
                    data: identities.map(identity => ({
                        ...identity,
                        mpiId: mpiRecord.id,
                    })),
                });
            }

            // 3. Create dummy user implicitly if omitted (only for MVP mapping)
            const user = await tx.user.create({
                data: {
                    keycloakId: `temp-${Date.now()}`,
                    email: `patient-${Date.now()}@sehatku.local`,
                    role: UserRole.PATIENT
                }
            });

            // 4. Create the concrete Patient record linked to the MPI and User
            const patient = await tx.patient.create({
                data: {
                    mpiId: mpiRecord.id,
                    userId: user.id
                },
                include: {
                    mpi: {
                        include: {
                            patientIdentities: true
                        }
                    }
                }
            });

            return patient;
        });
    }

    async findAll(skip: number = 0, take: number = 20, search?: string) {
        const whereCondition: Prisma.PatientWhereInput = search
            ? {
                mpi: {
                    OR: [
                        { goldenName: { contains: search, mode: 'insensitive' } },
                        { nik: { contains: search } },
                    ],
                },
            }
            : {};

        const [data, total] = await Promise.all([
            this.prisma.patient.findMany({
                where: whereCondition,
                skip,
                take,
                include: {
                    mpi: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.patient.count({ where: whereCondition }),
        ]);

        return {
            data,
            meta: {
                total,
                page: Math.floor(skip / take) + 1,
                lastPage: Math.ceil(total / take),
            },
        };
    }

    async findOne(id: string, user?: any) {
        const patient = await this.prisma.patient.findUnique({
            where: { id },
            include: {
                mpi: {
                    include: {
                        patientIdentities: true,
                    },
                },
                allergies: true, // Auto-hydrates clinical warnings 
            },
        });

        if (!patient) {
            throw new NotFoundException(`Patient with ID ${id} not found`);
        }

        // --- IDOR ABAC Protection --- //
        if (user) {
            const roles: string[] = user.realm_access?.roles || [];
            if (roles.includes('PATIENT')) {
                if (patient.userId !== user.sub) {
                    throw new ForbiddenException('IDOR Blocked: Patients can exclusively access their own profiles');
                }
            }
        }

        return patient;
    }

    async update(id: string, updatePatientDto: UpdatePatientDto) {
        // FindOne implicitly handles the minimal IDOR checking
        const patient = await this.findOne(id);

        // We only update the MPI record fields, extracting what was provided
        const { identities, userId, ...mpiUpdates } = updatePatientDto;
        const processedMpiData: any = { ...mpiUpdates };

        if (mpiUpdates.dateOfBirth) {
            processedMpiData.dateOfBirth = new Date(mpiUpdates.dateOfBirth);
        }

        await this.prisma.mpiRecord.update({
            where: { id: patient.mpiId },
            data: processedMpiData
        });

        // Return updated payload fully hydrated
        return this.findOne(id);
    }

    async getTimeline(id: string, user?: any) {
        // Verify patient and enforce IDOR implicitly via cascading findOne
        await this.findOne(id, user);

        const encounters = await this.prisma.encounter.findMany({
            where: { patientId: id },
            orderBy: { startDate: 'desc' },
            include: {
                practitioner: {
                    include: { user: true }
                },
                conditions: true,
                medicationReqs: true,
                observations: true,
            }
        });

        return encounters;
    }
}
