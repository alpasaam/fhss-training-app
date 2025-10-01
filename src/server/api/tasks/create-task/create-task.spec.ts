import { generateDummyUserData } from '../../../dummy/helpers/dummy-user';
import { appRouter } from '../../api.routes';
import { vi, describe, expect, it, beforeAll, afterAll } from 'vitest';
import { faker } from '@faker-js/faker';
import { prisma, User } from '../../../../../prisma/client';
import { createTasks } from '../../../../../utils/task/create-tasks';
import { error } from 'console';

describe('Create task', () => {
  let requestingUser: User;
  let createTask: ReturnType<
    typeof appRouter.createCaller
  >['tasks']['createTask'];

  beforeAll(async () => {
    requestingUser = await prisma.user.create({
      data: generateDummyUserData({
        permissions: ['manage-tasks'],
      }),
    });
    createTask = appRouter.createCaller({ userId: requestingUser.id }).tasks
      .createTask;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: requestingUser.id } });
  });

  it('creates the task', async () => {
    try {
      const title = faker.lorem.words(3);
      const description = faker.lorem.sentence();

      await createTask({ title, description });

      const createdTask = await prisma.task.findFirst({
        where: { title, description, ownerId: requestingUser.id },
      });

      expect(createdTask?.id).toBeDefined();
    } finally {
      await prisma.task.deleteMany({
        where: { ownerId: requestingUser.id },
      });
    }
  });

  it('creates the task with minimal data', async () => {
    try {
      const title = faker.lorem.words(3);

      await createTask({ title });

      const createdTask = await prisma.task.findFirst({
        where: { title, ownerId: requestingUser.id },
      });

      expect(createdTask?.id).toBeDefined();
    } finally {
      await prisma.task.deleteMany({
        where: { ownerId: requestingUser.id },
      });
    }
  });

  it('errors on missing title', async () => {
    let error;
    try {
      // @ts-ignore
      await createTask({ description: 'no title' });
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
  });
});
