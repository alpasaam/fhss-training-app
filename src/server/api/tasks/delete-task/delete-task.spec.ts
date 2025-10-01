import { generateDummyUserData } from '../../../dummy/helpers/dummy-user';
import { appRouter } from '../../api.routes';
import { vi, describe, expect, it, beforeAll, afterAll } from 'vitest';
import { faker } from '@faker-js/faker';
import { prisma, User } from '../../../../../prisma/client';
import { createTasks } from '../../../../../utils/task/create-tasks';

describe('Delete task', () => {
  let creatingUser: User;
  let deleteingUser: User;
  let deleteTask: ReturnType<
    typeof appRouter.createCaller
  >['tasks']['deleteTask'];

  beforeAll(async () => {
    creatingUser = await prisma.user.create({
      data: generateDummyUserData({
        permissions: ['manage-tasks'],
      }),
    });
    deleteingUser = await prisma.user.create({
      data: generateDummyUserData({
        permissions: ['manage-tasks'],
      }),
    });
    deleteTask = appRouter.createCaller({ userId: deleteingUser.id }).tasks
      .deleteTask;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: creatingUser.id } });
    await prisma.user.delete({ where: { id: deleteingUser.id } });
  });

  it('deletes the task', async () => {
    const task = await createTasks(1, deleteingUser.id);

    try {
      await deleteTask({ id: task[0].id });

      const found = await prisma.task.findUnique({ where: { id: task[0].id } });
      expect(found).toBeNull();
    } finally {
      await prisma.task.deleteMany({
        where: { id: task[0].id },
      });
    }
  });

  it('wrong user does not delete the task', async () => {
    const task = await createTasks(1, creatingUser.id);
    let error;

    try {
      await deleteTask({ id: task[0].id });
    } catch (err) {
      error = err;
    } finally {
      await prisma.task.deleteMany({
        where: { id: task[0].id },
      });
    }

    expect(error).toHaveProperty('code', 'NOT_FOUND');
  });
});
