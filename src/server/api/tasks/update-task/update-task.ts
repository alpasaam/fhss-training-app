import { z } from 'zod/v4';
import { prisma, TaskStatus } from '../../../../../prisma/client';
import { authorizedProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { th } from '@faker-js/faker';
import { error } from 'console';
import { isPrismaError } from '../../../utils/prisma';

const updateTaskInput = z.object({
  id: z.string(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  status: z.literal(Object.values(TaskStatus)).optional(),
  completedAt: z.date().nullable().optional(),
});

const updateTaskOutput = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.literal(Object.values(TaskStatus)),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  ownerId: z.string(),
});

export const updateTask = authorizedProcedure
  .meta({ requiredPermissions: ['manage-tasks'] })
  .input(updateTaskInput)
  .output(updateTaskOutput)
  .mutation(async opts => {
    // Your logic goes here
    const oldTask = await prisma.task.findUnique({
      where: { id: opts.input.id, ownerId: opts.ctx.userId },
    });

    if (!oldTask) {
      throw new TRPCError({
        code: 'NOT_FOUND',
      });
    }

    let calculatedCompletedAt: Date | null = oldTask.completedAt;
    if (opts.input.status) {
      if (opts.input.status != oldTask.status) {
        //if we just switched the task to complete
        if (opts.input.status === 'Completed') {
          calculatedCompletedAt = new Date();
        }
        //if we just switched the task off complete
        else if (oldTask.status === 'Completed') {
          calculatedCompletedAt = null;
        }
      }
    }

    try {
      return await prisma.task.update({
        where: { id: opts.input.id, ownerId: opts.ctx.userId },
        data: {
          title: opts.input.title ?? oldTask.title,
          description:
            opts.input.description !== undefined
              ? opts.input.description
              : oldTask.description,
          status: opts.input.status ?? oldTask.status,
          completedAt:
            opts.input.completedAt !== undefined
              ? opts.input.completedAt
              : calculatedCompletedAt,
        },
      });
    } catch (e) {
      if (isPrismaError(e, 'NOT_FOUND')) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Task not found: ${opts.input.id} under user: ${opts.ctx.userId}`,
        });
      }
      throw e;
    }
  });
