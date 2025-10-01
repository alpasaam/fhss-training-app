import { object, z } from 'zod/v4';
import { prisma } from '../../../../../prisma/client';
import { authorizedProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { TaskStatus } from '../../../../../prisma/generated/enums';

const getTasksByUserInput = z.object({
  pageSize: z.number().min(1).max(100).default(20),
  pageOffset: z.number().min(0).default(0),
});

const getTasksByUserOutput = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      status: z.literal(Object.values(TaskStatus)),
      completedAt: z.date().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
      ownerId: z.string(),
    })
  ),
  totalCount: z.number(),
});

export const getTasksByUser = authorizedProcedure
  .meta({ requiredPermissions: ['manage-tasks'] })
  .input(getTasksByUserInput)
  .output(getTasksByUserOutput)
  .mutation(async opts => {
    // Your logic goes here
    const totalCount = await prisma.task.count({
      where: { ownerId: opts.ctx.userId },
    });

    if (opts.input.pageOffset && opts.input.pageOffset >= totalCount) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot paginate to item ${opts.input.pageOffset + 1}, as there are only ${totalCount} items`,
      });
    }

    const data = await prisma.task.findMany({
      where: { ownerId: opts.ctx.userId },
      take: opts.input.pageSize,
      skip: opts.input.pageOffset,
      orderBy: { createdAt: 'desc' },
    });

    return { data, totalCount };
  });
