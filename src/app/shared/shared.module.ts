import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ToastHostComponent } from './components/toast-host/toast-host.component';
import { ConfirmHostComponent } from './components/confirm-host/confirm-host.component';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { SkeletonComponent } from './components/skeleton/skeleton.component';
import { StatTileComponent } from './components/stat-tile/stat-tile.component';
import { LocationBadgeComponent } from './components/location-badge/location-badge.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { ArCountPipe, NumPipe } from './pipes/ar-count.pipe';

const KIT = [
  ToastHostComponent,
  ConfirmHostComponent,
  PageHeaderComponent,
  EmptyStateComponent,
  SkeletonComponent,
  StatTileComponent,
  LocationBadgeComponent,
  PaginationComponent,
  ArCountPipe,
  NumPipe
];

/** The design system's shared building blocks. Import once in AppModule. */
@NgModule({
  declarations: KIT,
  imports: [CommonModule, RouterModule, FormsModule],
  exports: KIT
})
export class SharedModule {}
