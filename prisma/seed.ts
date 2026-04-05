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
      salary: 12000000,
      ptkpStatus: 'TK0',
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
        salary: 15000000,
        ptkpStatus: 'K1',
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

  // 3.5 Generate 10 Random Employees for Payroll testing
  console.log('Generating 10 test employees...');
  const nameGenerator = (i: number) => [
    'Budi Santoso', 'Siti Aminah', 'Agus Prayitno', 'Dewi Lestari', 
    'Bambang Wijaya', 'Eka Putri', 'Fajar Ramadhan', 'Gita Permata', 
    'Hendra Kurniawan', 'Indah Sari'
  ][i];

  const ptkpOptions = ['TK0', 'TK1', 'TK2', 'K0', 'K1', 'K2', 'K3'];

  for (let i = 0; i < 10; i++) {
    const empNum = `EMP_TEST_${i + 1}`;
    const name = nameGenerator(i);
    const salary = 5000000 + Math.floor(Math.random() * 10000000); // 5M - 15M
    const ptkp = ptkpOptions[Math.floor(Math.random() * ptkpOptions.length)];
    
    // Create Employee
    const testEmp = await prisma.employee.upsert({
      where: { employeeNumber: empNum },
      update: {},
      create: {
        name,
        employeeNumber: empNum,
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        dateOfBirth: new Date(1985 + i, Math.floor(Math.random() * 12), 10),
        phoneNumber: `+62888000${i}`,
        address: `Test Street No. ${i + 1}, Jakarta`,
        salary,
        ptkpStatus: ptkp,
        departmentId: i % 2 === 0 ? itDept.id : hrDept.id,
        positionId: i % 2 === 0 ? softwareEngPos.id : hrSpecialistPos.id,
        avatarUrl: `https://avatar.iran.liara.run/public/${i % 2 === 0 ? 'boy' : 'girl'}?username=${empNum}`
      }
    });

    // Create User account
    const username = `emp${i + 1}`;
    await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        password: 'password123',
        email: `${username}@test.com`,
        role: 'EMPLOYEE',
        employeeId: testEmp.id
      }
    });
  }

  // 3.6 Generate 5 Low-Income Employees for Tax Bracket testing (3M - 6M)
  console.log('Generating 5 low-income test employees...');
  const lowIncomeNames = ['Joko Susilo', 'Rina Wulandari', 'Slamet Riadi', 'Yanti Sari', 'Dedi Kurnia'];

  for (let i = 0; i < 5; i++) {
    const empNum = `EMP_LOW_${i + 1}`;
    const name = lowIncomeNames[i];
    const salary = 3000000 + Math.floor(Math.random() * 3000000); // 3M - 6M
    const ptkp = ptkpOptions[Math.floor(Math.random() * ptkpOptions.length)];
    
    const testEmp = await prisma.employee.upsert({
      where: { employeeNumber: empNum },
      update: {},
      create: {
        name,
        employeeNumber: empNum,
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        dateOfBirth: new Date(1990 + i, Math.floor(Math.random() * 12), 15),
        phoneNumber: `+62888111${i}`,
        address: `Low Income Test Street No. ${i + 1}, Jakarta`,
        salary,
        ptkpStatus: ptkp,
        departmentId: i % 2 === 0 ? itDept.id : hrDept.id,
        positionId: i % 2 === 0 ? softwareEngPos.id : hrSpecialistPos.id,
        avatarUrl: `https://avatar.iran.liara.run/public/${i % 2 === 0 ? 'boy' : 'girl'}?username=${empNum}`
      }
    });

    const username = `emp${i + 11}`; // Continues from emp10
    await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        password: 'password123',
        email: `${username}@test.com`,
        role: 'EMPLOYEE',
        employeeId: testEmp.id
      }
    });
  }

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
  const employeesList = await prisma.employee.findMany();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 60);

  for (let i = 0; i < 60; i++) {
    const currentDay = new Date(startDate);
    currentDay.setDate(startDate.getDate() + i);
    currentDay.setHours(0, 0, 0, 0);

    // Skip weekends
    const dayOfWeek = currentDay.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    for (const emp of employeesList) {
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

  // 7. Payroll History (Last 3 Months)
  console.log('Generating payroll history...');
  
  const TAX_STATUS_MAP: Record<string, string> = {
    TK0: 'A', TK1: 'A', K0: 'A',
    TK2: 'B', TK3: 'B', K1: 'B', K2: 'B',
    K3: 'C'
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  for (const emp of employeesList) {
    const baseSalary = emp.salary || 5000000;
    const ptkp = emp.ptkpStatus || 'TK0';
    const category = TAX_STATUS_MAP[ptkp] || 'A';
    
    for (let m = 1; m <= 3; m++) {
        let month = currentMonth - m;
        let year = currentYear;
        if (month <= 0) {
            month += 12;
            year -= 1;
        }

        const overtime = 200000 + Math.floor(Math.random() * 500000);
        const bonuses = Math.random() > 0.5 ? 500000 : 0;
        const gross = baseSalary + overtime + bonuses;

        // Simplified TER calc for seed (matching taxCalculator.js logic)
        let rate = 0;
        if (category === 'A') {
            if (gross <= 10650000) rate = 2; // Approximated
            else if (gross <= 14600000) rate = 5;
            else rate = 10;
        } else if (category === 'B') {
            if (gross <= 12300000) rate = 2;
            else if (gross <= 15150000) rate = 5;
            else rate = 10;
        } else {
            if (gross <= 12800000) rate = 2;
            else rate = 10;
        }

        const pph21 = Math.floor(gross * (rate / 100));
        const bpjsKs = Math.floor(Math.min(gross, 12000000) * 0.01);
        const bpjsKt = Math.floor(gross * 0.02) + Math.floor(Math.min(gross, 10042300) * 0.01);
        const netSalary = gross - (pph21 + bpjsKs + bpjsKt);

        await prisma.payroll.upsert({
            where: {
                employeeId_month_year: {
                    employeeId: emp.id,
                    month,
                    year
                }
            },
            update: {},
            create: {
                employeeId: emp.id,
                month,
                year,
                basicSalary: baseSalary,
                overtime,
                bonuses,
                pph21,
                bpjsKetenagakerjaan: bpjsKt,
                bpjsKesehatan: bpjsKs,
                netSalary,
                status: 'PAID',
                paymentDate: new Date(year, month - 1, 28)
            }
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
