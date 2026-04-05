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

  // 6. Bulk Attendance for last 2 months (60 days)
  console.log('Generating bulk attendance data...');
  const employees = await prisma.employee.findMany();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 60);

  for (let i = 0; i < 60; i++) {
    const currentDay = new Date(startDate);
    currentDay.setDate(startDate.getDate() + i);
    currentDay.setHours(0, 0, 0, 0);

    // Skip weekends
    const dayOfWeek = currentDay.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    for (const emp of employees) {
      // Randomize times
      const inHour = 7 + Math.floor(Math.random() * 2); // 7 or 8 AM
      const inMin = Math.floor(Math.random() * 60);
      const outHour = 17 + Math.floor(Math.random() * 3); // 17, 18, or 19 PM
      const outMin = Math.floor(Math.random() * 60);

      const clockIn = new Date(currentDay);
      clockIn.setHours(inHour, inMin, 0);
      
      const clockOut = new Date(currentDay);
      clockOut.setHours(outHour, outMin, 0);

      // Random coordinates around Jakarta (-6.2088, 106.8456)
      const lat = -6.2088 + (Math.random() - 0.5) * 0.02;
      const lng = 106.8456 + (Math.random() - 0.5) * 0.02;

      await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId: emp.id,
            date: currentDay,
          },
        },
        update: {},
        create: {
          employeeId: emp.id,
          date: currentDay,
          clockIn,
          clockOut,
          status: 'PRESENT',
          clockInLocation: 'Jakarta Headquarters',
          clockInLat: lat,
          clockInLng: lng,
          clockOutLocation: 'Jakarta Headquarters',
          clockOutLat: lat + (Math.random() - 0.5) * 0.001,
          clockOutLng: lng + (Math.random() - 0.5) * 0.001,
        },
      });
    }
  }

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
