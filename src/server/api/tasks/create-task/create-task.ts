import { z } from 'zod/v4';
import { prisma } from '../../../../../prisma/client';
import { authorizedProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { title } from 'process';

const createTaskInput = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).nullable().optional(),
});

const createTaskOutput = z.object({
  id: z.string(),
});

export const createTask = authorizedProcedure
  .meta({ requiredPermissions: ['manage-tasks'] })
  .input(createTaskInput)
  .output(createTaskOutput)
  .mutation(async opts => {
    // Your logic goes here

    if (!opts.input.title.trim()) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Title cannot be empty',
      });
    }

    const task = await prisma.task.create({
      data: {
        title: opts.input.title,
        description: opts.input.description,
        ownerId: opts.ctx.userId,
      },
    });

    return { id: task.id };
  });
