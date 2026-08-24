const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SDJM High School Database Clean Reset & Initialization...');

  // 1. Core School Profile
  const schoolProfile = await prisma.schoolProfile.upsert({
    where: { id: 'sdjmhs_main_profile' },
    update: {},
    create: {
      id: 'sdjmhs_main_profile',
      schoolName: 'Shree Dhaneshkumar Jasvantlal Maheta High School',
      shortName: 'DJMHS',
      trustName: 'Bhavnagar Kelavani Mandal',
      address: 'Near Water Tank, Crescent Circle, Bhavnagar, Gujarat - 364001',
      phone: '+91 278 242 5900',
      email: 'principal@sdjmt.edu.in',
      website: 'https://djmhs.edu.in',
      principalName: 'Shri Arvindbhai Mehta',
      primaryColor: '#123E97',
      secondaryColor: '#0B2D78',
      accentColor: '#F2B233',
    },
  });
  console.log('✓ School Profile created/verified.');

  // 2. Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Principal & Head Administrator' },
  });

  const teacherRole = await prisma.role.upsert({
    where: { name: 'TEACHER' },
    update: {},
    create: { name: 'TEACHER', description: 'Faculty Member' },
  });

  const studentRole = await prisma.role.upsert({
    where: { name: 'STUDENT' },
    update: {},
    create: { name: 'STUDENT', description: 'Enrolled Pupil' },
  });

  const parentRole = await prisma.role.upsert({
    where: { name: 'PARENT' },
    update: {},
    create: { name: 'PARENT', description: 'Guardian' },
  });
  console.log('✓ System Roles initialized.');

  // Password Hash for admin: "Password@123"
  const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

  // 3. Principal Admin Users (admin@sdjmt.edu.in & principal@sdjmt.edu.in)
  const adminUser = await prisma.user.upsert({
    where: { identifier: 'admin@sdjmt.edu.in' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      identifier: 'admin@sdjmt.edu.in',
      email: 'admin@sdjmt.edu.in',
      passwordHash: defaultPasswordHash,
      roleId: adminRole.id,
      isActive: true,
      isFirstLogin: false,
    },
  });

  const principalUser = await prisma.user.upsert({
    where: { identifier: 'principal@sdjmt.edu.in' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      identifier: 'principal@sdjmt.edu.in',
      email: 'principal@sdjmt.edu.in',
      passwordHash: defaultPasswordHash,
      roleId: adminRole.id,
      isActive: true,
      isFirstLogin: false,
    },
  });
  console.log('✓ Principal Admin Accounts verified (admin@sdjmt.edu.in & principal@sdjmt.edu.in).');

  // 4. Academic Departments (Commerce High School Specialist)
  await prisma.department.upsert({
    where: { name: 'Commerce & Accounts' },
    update: { description: 'Accountancy, Elements of Accounts, Business Administration & Economics' },
    create: { name: 'Commerce & Accounts', description: 'Accountancy, Elements of Accounts, Business Administration & Economics' },
  });
  await prisma.department.upsert({
    where: { name: 'Languages & Humanities' },
    update: { description: 'Gujarati, Hindi, English, Social Sciences' },
    create: { name: 'Languages & Humanities', description: 'Gujarati, Hindi, English, Social Sciences' },
  });
  await prisma.department.upsert({
    where: { name: 'Administration & Secretarial' },
    update: { description: 'School Operations, Secretarial Practice & Finance' },
    create: { name: 'Administration & Secretarial', description: 'School Operations, Secretarial Practice & Finance' },
  });
  await prisma.department.upsert({
    where: { name: 'Physical Education & Sports' },
    update: { description: 'Sports, Fitness & Physical Training' },
    create: { name: 'Physical Education & Sports', description: 'Sports, Fitness & Physical Training' },
  });
  console.log('✓ Academic Departments verified (Commerce High School stream).');

  // 5. Standards & Divisions (Standards 9 to 12 - High School & Higher Secondary Commerce)
  const std9 = await prisma.standard.upsert({
    where: { name: 'Standard 09' },
    update: { level: 9 },
    create: { level: 9, name: 'Standard 09' },
  });
  const std10 = await prisma.standard.upsert({
    where: { name: 'Standard 10' },
    update: { level: 10 },
    create: { level: 10, name: 'Standard 10' },
  });
  const std11Comm = await prisma.standard.upsert({
    where: { name: 'Standard 11 Commerce' },
    update: { level: 11 },
    create: { level: 11, name: 'Standard 11 Commerce' },
  });
  const std12Comm = await prisma.standard.upsert({
    where: { name: 'Standard 12 Commerce' },
    update: { level: 12 },
    create: { level: 12, name: 'Standard 12 Commerce' },
  });

  await prisma.division.upsert({
    where: { standardId_name: { standardId: std9.id, name: 'A' } },
    update: {},
    create: { standardId: std9.id, name: 'A', roomNumber: 'Room 201-East' },
  });
  await prisma.division.upsert({
    where: { standardId_name: { standardId: std10.id, name: 'A' } },
    update: {},
    create: { standardId: std10.id, name: 'A', roomNumber: 'Room 101-North' },
  });
  await prisma.division.upsert({
    where: { standardId_name: { standardId: std11Comm.id, name: 'A' } },
    update: {},
    create: { standardId: std11Comm.id, name: 'A', roomNumber: 'Room 301-South' },
  });
  await prisma.division.upsert({
    where: { standardId_name: { standardId: std12Comm.id, name: 'A' } },
    update: {},
    create: { standardId: std12Comm.id, name: 'A', roomNumber: 'Room 302-South' },
  });
  console.log('✓ Standards & Divisions verified (Standards 9 to 12 Commerce).');

  // 6. Current Academic Year
  await prisma.academicYear.upsert({
    where: { name: '2026-2027' },
    update: { isCurrent: true },
    create: {
      name: '2026-2027',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-04-30'),
      isCurrent: true,
    },
  });
  console.log('✓ Academic Year 2026-2027 active.');
  console.log('🚀 Database core structural configuration initialized successfully without modifying any existing student or staff data.');
}

main()
  .catch((e) => {
    console.error('❌ Seeder Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
