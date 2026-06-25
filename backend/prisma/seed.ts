import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const username = process.env.SUPERADMIN_USERNAME ?? 'superadmin';
  const password = process.env.SUPERADMIN_PASSWORD ?? 'superadmin123';

  const existing = await prisma.user.findFirst({
    where: { role: 'SUPERADMIN', username },
  });
  if (existing) {
    console.log(`SUPERADMIN "${username}" ya existe, no se crea de nuevo.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      username,
      name: 'Super Admin',
      role: 'SUPERADMIN',
      passwordHash,
      companyId: null,
    },
  });
  console.log(`SUPERADMIN creado: ${username}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
