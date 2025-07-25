// Seed data for the database

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.character.upsert({
    where: {
      name: 'Gui',
    },
    update: {},
    create: {
      name: 'Gui',
      level: 1000,
      experience: 10000000000,
      world: 'Descubra',
      dailyExperience: {
        create: [
          {
            level: 1000,
            value: 190131293,
            date: new Date().toISOString().split('T')[0],
          },
          {
            level: 1000,
            value: 190131293,
            date: new Date().toISOString().split('T')[0],
          },
          {
            level: 1000,
            value: 190131293,
            date: new Date().toISOString().split('T')[0],
          },
          {
            level: 1000,
            value: 190131293,
            date: new Date().toISOString().split('T')[0],
          },
          {
            level: 1000,
            value: 190131293,
            date: new Date().toISOString().split('T')[0],
          },
          {
            level: 1000,
            value: 190131293,
            date: new Date(new Date().setDate(new Date().getDate() - 10))
              .toISOString()
              .split('T')[0],
          },
          {
            level: 1000,
            value: 190131293,

            date: new Date(new Date().setDate(new Date().getDate() - 30))
              .toISOString()
              .split('T')[0],
          },
          {
            level: 1000,
            value: 190131293,
            date: new Date(new Date().setDate(new Date().getDate() - 40))
              .toISOString()
              .split('T')[0],
          },
          {
            level: 1000,
            value: 190131293,
            date: new Date(new Date().setDate(new Date().getDate() - 50))
              .toISOString()
              .split('T')[0],
          },
          {
            level: 1000,
            value: 190131293,
            date: new Date(new Date().setDate(new Date().getDate() - 43))
              .toISOString()
              .split('T')[0],
          },
        ],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
