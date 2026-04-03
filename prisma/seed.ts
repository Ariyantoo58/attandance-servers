import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // 1. Departments & Positions
  const itDept = await prisma.department.upsert({
    where: { name: 'IT Department' },
    update: {},
    create: {
      name: 'IT Department',
      description: 'Handling all technical and infrastructure needs',
    },
  });

  const hrDept = await prisma.department.upsert({
    where: { name: 'Human Resources' },
    update: {},
    create: {
      name: 'Human Resources',
      description: 'Managing employee relations and payroll',
    },
  });

  const softwareEngPos = await prisma.position.upsert({
    where: { title: 'Software Engineer' },
    update: {},
    create: {
      title: 'Software Engineer',
      description: 'Building and maintaining software systems',
    },
  });

  const hrSpecialistPos = await prisma.position.upsert({
    where: { title: 'HR Specialist' },
    update: {},
    create: {
      title: 'HR Specialist',
      description: 'Managing recruitment and employee relations',
    },
  });

  // 2. Employee Profile
  const vishal = await prisma.employee.upsert({
    where: { employeeNumber: 'EMP001' },
    update: {},
    create: {
      name: 'Vishal Rawat',
      employeeNumber: 'EMP001',
      gender: 'MALE',
      dateOfBirth: new Date('1995-05-15'),
      phoneNumber: '+628123456789',
      address: 'Central Jakarta, Indonesia',
      avatarUrl: 'https://img.freepik.com/free-photo/front-view-man-posing_23-2148364843.jpg?t=st=1717328137~exp=1717331737~hmac=6c62d659733e221d1e95715bd236563bea66bccef2e710377b3e11597780177b&w=360',
      study: 'B.Tech Computer Science',
      experience: '4 years',
      achievement: 'Top Performer Q1 2024',
      salary: 5000,
      departmentId: itDept.id,
      positionId: softwareEngPos.id,
    },
  });

  const adminEmp = await prisma.employee.upsert({
      where: { employeeNumber: 'ADM001' },
      update: {},
      create: {
        name: 'Admin Manager',
        employeeNumber: 'ADM001',
        gender: 'FEMALE',
        departmentId: hrDept.id,
        positionId: hrSpecialistPos.id,
      },
    });

  // 3. User Credentials
  await prisma.user.upsert({
    where: { username: 'ari123' },
    update: {},
    create: {
      username: 'ari123',
      password: '123456', // Simple password for testing
      email: 'vishal@company.com',
      role: 'EMPLOYEE',
      employeeId: vishal.id,
    },
  });

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'adminpassword',
      email: 'admin@company.com',
      role: 'ADMIN',
      employeeId: adminEmp.id,
    },
  });

  // 4. Tasks for Vishal
  await prisma.task.createMany({
    data: [
      {
        employeeId: vishal.id,
        title: 'Fix UI Alignment in Mobile App',
        description: 'Need to fix symmetry issues in the dashboard icons',
        date: new Date(),
        status: 'PENDING',
        priority: 'HIGH',
      },
      {
          employeeId: vishal.id,
          title: 'Integrate Face Recognition gRPC',
          description: 'Establish connection between NestJS and Python server',
          date: new Date(),
          status: 'COMPLETE',
          priority: 'MEDIUM',
      }
    ],
  });

  // 5. Notifications for Vishal
  await prisma.notification.createMany({
    data: [
      {
        employeeId: vishal.id,
        title: 'Welcome to HRMS',
        message: 'Your profile has been successfully set up.',
        type: 'INFO',
      },
      {
        employeeId: vishal.id,
        title: 'Task Assigned',
        message: 'A new high priority task has been assigned to you.',
        type: 'WARNING',
      },
    ],
  });

  // 6. Attendance for Vishal (Yesterday)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0,0,0,0);

  await prisma.attendance.create({
    data: {
      employeeId: vishal.id,
      date: yesterday,
      clockIn: new Date(yesterday.getTime() + 8 * 60 * 60 * 1000), // 08:00 AM
      clockOut: new Date(yesterday.getTime() + 17 * 60 * 60 * 1000), // 17:00 PM
      status: 'PRESENT',
      location: 'Office - 1st Floor',
    }
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
