import { faker } from '@faker-js/faker';
import { prisma } from '../../prisma/client';
import { TaskStatus } from '../../prisma/generated/enums';

export function createTasks(count: number, ownerId: string) {
  return prisma.task.createManyAndReturn({
    data: Array.from({ length: count }, () => ({
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      status: faker.helpers.arrayElement(Object.values(TaskStatus)),
      completedAt: faker.date.past(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.past(),
      ownerId: ownerId,
    })),
  });
}
