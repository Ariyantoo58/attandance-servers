const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = [
    { name: 'Admin System', username: 'admin', password: 'password123', email: 'admin@mail.co', role: 'ADMIN', position: 'HR Manager', department: 'HR', salary: 15000000, phoneNumber: '08123456789' },
    { name: 'Ari User', username: 'ari123', password: '123456', email: 'ari@mail.co', role: 'EMPLOYEE', position: 'Software Engineer', department: 'Engineering', salary: 12000000, phoneNumber: '08123456780' },
    { name: 'Icha User', username: 'icha123', password: '123456', email: 'icha@mail.co', role: 'EMPLOYEE', position: 'Product Designer', department: 'Product', salary: 11000000, phoneNumber: '08123456781' },
    { name: 'Budi Santoso', username: 'budi', password: 'password123', email: 'budi@mail.co', role: 'EMPLOYEE', position: 'Accountant', department: 'Finance', salary: 9000000, phoneNumber: '08123456782' },
    { name: 'Siti Aminah', username: 'siti', password: 'password123', email: 'siti@mail.co', role: 'EMPLOYEE', position: 'Frontend Developer', department: 'Engineering', salary: 10500000, phoneNumber: '08123456783' },
    { name: 'Joko Widodo', username: 'jowo', password: 'password123', email: 'jowo@mail.co', role: 'EMPLOYEE', position: 'DevOps Engineer', department: 'Engineering', salary: 13000000, phoneNumber: '08123456784' },
    { name: 'Ani Lestari', username: 'ani', password: 'password123', email: 'ani@mail.co', role: 'EMPLOYEE', position: 'Marketing Lead', department: 'Marketing', salary: 14000000, phoneNumber: '08123456785' },
    { name: 'Rudi Tabuti', username: 'rudi', password: 'password123', email: 'rudi@mail.co', role: 'EMPLOYEE', position: 'HR Specialist', department: 'HR', salary: 8500000, phoneNumber: '08123456786' },
    { name: 'Dewi Sartika', username: 'dewi', password: 'password123', email: 'dewi@mail.co', role: 'EMPLOYEE', position: 'QA Engineer', department: 'Engineering', salary: 9500000, phoneNumber: '08123456787' },
    { name: 'Prabowo Subianto', username: 'prabowo', password: 'password123', email: 'prabowo@mail.co', role: 'EMPLOYEE', position: 'Backend Developer', department: 'Engineering', salary: 11500000, phoneNumber: '08123456788' },
  ];

  for (const user of users) {
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&size=256`;
    
    // Create/Upsert employee
    const employee = await prisma.employee.upsert({
      where: { name: user.name },
      update: {
        role: user.role,
        email: user.email,
        position: user.position,
        department: user.department,
        salary: user.salary,
        phoneNumber: user.phoneNumber,
        avatarUrl: avatarUrl,
      },
      create: {
        name: user.name,
        role: user.role,
        email: user.email,
        position: user.position,
        department: user.department,
        salary: user.salary,
        phoneNumber: user.phoneNumber,
        avatarUrl: avatarUrl,
      },
    });

    // Create/Upsert user
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        employeeId: employee.id,
      },
      create: {
        username: user.username,
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        employeeId: employee.id,
      },
    });
  }

  console.log('Seed data for 10 employees added successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
