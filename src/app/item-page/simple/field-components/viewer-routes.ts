import { Routes } from '@angular/router';
import { ViewerComponent } from './view-file-pdf/viewer.component';

export const ROUTES: Routes = [
  { path: ':UUID', component: ViewerComponent },
];
