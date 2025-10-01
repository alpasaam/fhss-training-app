import { generateDummyUserData } from '../../../dummy/helpers/dummy-user';
import { appRouter } from '../../api.routes';
import { vi, describe, expect, it, beforeAll, afterAll } from 'vitest';
import { faker } from '@faker-js/faker';
import { prisma, User } from '../../../../../prisma/client';
import { create } from 'domain';
import { createTasks } from '../../../../../utils/task/create-tasks';

describe('Update task', () => {
  let wrongUser: User;
  let updatingUser: User;
  let updateTask: ReturnType<
    typeof appRouter.createCaller
  >['tasks']['updateTask'];

  beforeAll(async () => {
    wrongUser = await prisma.user.create({
      data: generateDummyUserData({
        permissions: ['manage-tasks'],
      }),
    });
    updatingUser = await prisma.user.create({
      data: generateDummyUserData({
        permissions: ['manage-tasks'],
      }),
    });
    updateTask = appRouter.createCaller({ userId: updatingUser.id }).tasks
      .updateTask;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: updatingUser.id } });
    await prisma.user.delete({ where: { id: wrongUser.id } });
  });

  it('updates the task', async () => {
    const task = await createTasks(1, updatingUser.id);

    const newTitle = faker.lorem.words(3);
    const newDescription = faker.lorem.sentence();
    const newStatus = 'Completed';
    const newCompletedAt = new Date();

    try {
      const updated = await updateTask({
        id: task[0].id,
        title: newTitle,
        description: newDescription,
        status: newStatus,
        completedAt: newCompletedAt,
      });
      expect(updated).toHaveProperty('id', task[0].id);
      expect(updated).toHaveProperty('title', newTitle);
      expect(updated).toHaveProperty('description', newDescription);
      expect(updated).toHaveProperty('status', newStatus);
      expect(updated).toHaveProperty('completedAt');
      expect(new Date(updated.completedAt!).getTime()).toBe(
        newCompletedAt.getTime()
      );
    } finally {
      await prisma.task.deleteMany({
        where: { id: task[0].id },
      });
    }
  });

  it('wrong user does not update the task', async () => {
    const task = await createTasks(1, wrongUser.id);
    let error;

    try {
      await updateTask({ id: task[0].id, title: 'New title' });
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
