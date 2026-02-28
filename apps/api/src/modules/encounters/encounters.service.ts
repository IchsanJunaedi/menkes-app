import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { UpdateEncounterDto } from './dto/update-encounter.dto';
import { ConditionDto, MedicationRequestDto, ObservationDto, ProcedureDto } from './dto/clinical-sub-resources.dto';
import { EncounterStatus } from '@prisma/client';

@Injectable()
export class EncountersService {
    constructor(private prisma: PrismaService) { }

    async create(createEncounterDto: CreateEncounterDto) {
        return this.prisma.encounter.create({
            data: createEncounterDto,
            include: {
                patient: { include: { mpi: true } },
                practitioner: true,
            },
        });
    }

    async findOne(id: string, user: any) {
        const encounter = await this.prisma.encounter.findUnique({
            where: { id },
            include: {
                patient: { include: { mpi: true, allergies: true, user: true } },
                practitioner: { include: { user: true } },
                conditions: true,
                observations: { orderBy: { effectiveAt: 'desc' } },
                medicationReqs: true,
                procedures: true,
            },
        });

        if (!encounter) throw new NotFoundException(`Encounter ${id} not found`);

        // --- IDOR ABAC Protection --- //
        const roles: string[] = user.realm_access?.roles || [];

        if (roles.includes('PATIENT')) {
            if (encounter.patient.userId !== user.sub) {
                throw new ForbiddenException('IDOR Blocked: Patients can only view their own encounters');
            }
        } else if (roles.includes('DOCTOR') || roles.includes('NURSE')) {
            if (encounter.practitioner.userId !== user.sub && !roles.includes('ADMIN') && !roles.includes('AUDITOR')) {
                const reqPractitioner = await this.prisma.practitioner.findUnique({ where: { userId: user.sub } });
                if (!reqPractitioner || reqPractitioner.organizationId !== encounter.organizationId) {
                    throw new ForbiddenException('IDOR Blocked: Practitioner does not have authorization for this organization');
                }
            }
        }

        return encounter;
    }

    async update(id: string, updateEncounterDto: UpdateEncounterDto, practitionerId: string) {
        // FindOne implicitly validates the IDOR via the pseudo user block
        const encounter = await this.findOne(id, { sub: practitionerId, realm_access: { roles: ['DOCTOR'] } });

        if (encounter.practitionerId !== practitionerId && encounter.practitioner.userId !== practitionerId) {
            throw new ForbiddenException('Only the assigned practitioner can modify this encounter');
        }
        if (encounter.status === EncounterStatus.FINISHED) {
            throw new ForbiddenException('Cannot modify a finished encounter');
        }

        return this.prisma.encounter.update({
            where: { id },
            data: updateEncounterDto,
        });
    }

    async finish(id: string, practitionerId: string) {
        const encounter = await this.findOne(id, { sub: practitionerId, realm_access: { roles: ['DOCTOR'] } });
        if (encounter.practitioner.userId !== practitionerId && encounter.practitionerId !== practitionerId) throw new ForbiddenException();

        return this.prisma.encounter.update({
            where: { id },
            data: {
                status: EncounterStatus.FINISHED,
                endDate: new Date(),
            },
        });
    }

    // --- SUB-RESOURCES ---

    async addCondition(encounterId: string, dto: ConditionDto, user: any) {
        const encounter = await this.findOne(encounterId, user);
        if (encounter.status === EncounterStatus.FINISHED) throw new ForbiddenException();

        return this.prisma.condition.create({
            data: { ...dto, encounterId },
        });
    }

    async addObservation(encounterId: string, dto: ObservationDto, user: any) {
        const encounter = await this.findOne(encounterId, user);
        if (encounter.status === EncounterStatus.FINISHED) throw new ForbiddenException();

        return this.prisma.observation.create({
            data: { ...dto, encounterId },
        });
    }

    async addProcedure(encounterId: string, dto: ProcedureDto, user: any) {
        const encounter = await this.findOne(encounterId, user);
        if (encounter.status === EncounterStatus.FINISHED) throw new ForbiddenException();

        return this.prisma.procedure.create({
            data: { ...dto, encounterId },
        });
    }

    async addMedicationRequest(encounterId: string, dto: MedicationRequestDto, user: any) {
        const encounter = await this.findOne(encounterId, user);
        if (encounter.status === EncounterStatus.FINISHED) throw new ForbiddenException('Encounter locked');

        // ALLERGY CROSS-CHECK ALGORITHM
        // For a fully robust allergy check we need to evaluate the patient model manually
        const patientData = await this.prisma.patient.findUnique({
            where: { id: encounter.patientId },
            include: { allergies: true }
        });

        if (!patientData) throw new NotFoundException('Patient record lost');
        const activeAllergies = patientData.allergies;

        // Very basic risk parsing for the Mock MVP implementation
        const hasConflict = activeAllergies.some((allergy: any) =>
            allergy.substance.toLowerCase().includes(dto.medicationName.toLowerCase()) ||
            dto.medicationName.toLowerCase().includes(allergy.substance.toLowerCase())
        );

        if (hasConflict) {
            throw new ConflictException(`CRITICAL ALLERGY ALERT: Patient has a documented allergy matching or relating to '${dto.medicationName}'. Override protocol not yet implemented.`);
        }

        return this.prisma.medicationRequest.create({
            data: { ...dto, encounterId },
        });
    }
}
