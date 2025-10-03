import { Component, inject, signal } from '@angular/core';
import { trpcResource } from '@fhss-web-team/frontend-utils';
import { TRPC_CLIENT } from '../../utils/trpc.client';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-tasks',
  imports: [MatProgressSpinnerModule, MatPaginator, MatIconModule],
  templateUrl: './tasks.page.html',
  styleUrl: './tasks.page.scss',
})
export class TasksPage {
  private readonly trpc = inject(TRPC_CLIENT);

  protected readonly PAGE_SIZE = 12;
  protected readonly pageOffset = signal(0);

  protected readonly taskResource = trpcResource(
    this.trpc.tasks.getTasksByUser.mutate,
    () => ({
      pageSize: this.PAGE_SIZE,
      pageOffset: this.pageOffset(),
    }),
    { autoRefresh: true }
  );

  protected handlePageEvent(e: PageEvent) {
    this.pageOffset.set(e.pageIndex * this.PAGE_SIZE);
  }
}
