const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = [
    { name: 'Admin System', username: 'admin', password: 'password123', email: 'admin@mail.co', role: 'ADMIN' },
    { name: 'Ari User', username: 'ari123', password: '123456', email: 'ari@mail.co', role: 'EMPLOYEE' },
    { name: 'Icha User', username: 'icha123', password: '123456', email: 'icha@mail.co', role: 'EMPLOYEE' },
  ];

  for (const user of users) {
    // 1. Create/Upsert corresponding employee entry FIRST to get its ID
    const employee = await prisma.employee.upsert({
      where: { name: user.name },
      update: {},
      create: {
        name: user.name,
        role: user.role, // 'ADMIN' or 'EMPLOYEE' role for profile
        email: user.email,
      },
    });

    // 2. Create user entry with employeeId link
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        employeeId: employee.id
      },
      create: {
        ...user,
        employeeId: employee.id
      },
    });
  }

  console.log('Seed data added successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
