const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { employee: true } });
  const employees = await prisma.employee.findMany();
  
  console.log('--- USERS ---');
  users.forEach(u => console.log(`User: ${u.username}, ID: ${u.id}, EmployeeID: ${u.employeeId}`));
  
  console.log('\n--- EMPLOYEES ---');
  employees.forEach(e => console.log(`Employee: ${e.name}, ID: ${e.id}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
