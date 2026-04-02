const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = [
    { name: 'Ari', username: 'ari123', password: '123456', email: 'ari@mail.co', role: 'EMPLOYEE' },
    { name: 'Icha', username: 'icha123', password: '123456', email: 'icha@mail.co', role: 'EMPLOYEE' },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: user,
    });
    
    // Also create employee for them
    await prisma.employee.upsert({
      where: { name: user.name },
      update: {},
      create: {
        name: user.name,
        role: user.role,
        email: user.email,
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
