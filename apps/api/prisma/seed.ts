import {
  PrismaClient,
  Gender,
  OrganizationType,
  UserRole,
  EncounterClass,
  EncounterStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create System Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sehatku.go.id' },
    update: {},
    create: {
      keycloakId: 'admin-keycloak-id-placeholder',
      email: 'admin@sehatku.go.id',
      role: UserRole.ADMIN,
    },
  });

  // 2. Create Root Organization (Kemenkes)
  const kemenkes = await prisma.organization.create({
    data: {
      name: 'Kementerian Kesehatan RI',
      type: OrganizationType.HOSPITAL, // Usually Ministry, using HOSPITAL as placeholder
      province: 'DKI Jakarta',
      city: 'Jakarta Selatan',
    },
  });

  // 3. Create a Hospital
  const rscm = await prisma.organization.create({
    data: {
      name: 'RSUP Nasional Dr. Cipto Mangunkusumo',
      type: OrganizationType.HOSPITAL,
      parentId: kemenkes.id,
      province: 'DKI Jakarta',
      city: 'Jakarta Pusat',
    },
  });

  // 4. Create a Practitioner (Doctor)
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@rscm.example.com' },
    update: {},
    create: {
      keycloakId: 'doctor-keycloak-id',
      email: 'doctor@rscm.example.com',
      role: UserRole.DOCTOR,
    },
  });

  const doctor = await prisma.practitioner.create({
    data: {
      userId: doctorUser.id,
      strNumber: '3111100222000001',
      specialization: 'Spesialis Penyakit Dalam',
      organizationId: rscm.id,
      isVerified: true,
    },
  });

  // 5. Create MPI Record (Master Patient Index)
  const mpiRecord = await prisma.mpiRecord.create({
    data: {
      nik: '3171234567890001',
      goldenName: 'Budi Santoso',
      dateOfBirth: new Date('1980-05-15'),
      gender: Gender.MALE,
      addressProvince: 'DKI Jakarta',
      addressCity: 'Jakarta Selatan',
    },
  });

  // 6. Create Patient Identity
  await prisma.patientIdentity.create({
    data: {
      mpiId: mpiRecord.id,
      system: 'nik',
      value: '3171234567890001',
    },
  });

  // 7. Create Patient Profile
  const patientUser = await prisma.user.upsert({
    where: { email: 'budi.santoso@example.com' },
    update: {},
    create: {
      keycloakId: 'patient-keycloak-id',
      email: 'budi.santoso@example.com',
      role: UserRole.PATIENT,
    },
  });

  const patient = await prisma.patient.create({
    data: {
      userId: patientUser.id,
      mpiId: mpiRecord.id,
    },
  });

  // 8. Create an Encounter
  const encounter = await prisma.encounter.create({
    data: {
      patientId: patient.id,
      practitionerId: doctor.id,
      organizationId: rscm.id,
      status: EncounterStatus.FINISHED,
      class: EncounterClass.AMBULATORY,
      startDate: new Date('2023-10-01T09:00:00Z'),
      endDate: new Date('2023-10-01T09:30:00Z'),
      notes: 'Pasien datang dengan keluhan demam 3 hari.',
    },
  });

  console.log('Database seeded successfully!', {
    admin: admin.id,
    doctor: doctor.id,
    patient: patient.id,
    encounter: encounter.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
