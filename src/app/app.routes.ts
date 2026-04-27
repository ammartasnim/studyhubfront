import { Routes } from '@angular/router';

import { privateGuard } from './guards/private.guard';
import { publicGuard } from './guards/public.guard';
import { roleGuard } from './guards/role.guard';
import { UserResDto } from './api-generated/model/userResDto';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [publicGuard],
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent)
  },
  {
    path: 'auth/login',
    canActivate: [publicGuard],
    loadComponent: () => import('./auth/components/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'auth/register',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./auth/components/register/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    canActivate: [privateGuard],
    loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'feed'
      },
      {
        path: 'feed',
        loadComponent: () => import('./dashboard/sections/feed.component').then((m) => m.FeedComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./dashboard/sections/profile.component').then((m) => m.ProfileComponent)
      },
      {
        path: 'communities',
        loadComponent: () => import('./dashboard/sections/my-communities.component').then((m) => m.MyCommunitiesComponent)
      },
      {
        path: 'my-created',
        loadComponent: () => import('./dashboard/sections/my-created-communities.component').then((m) => m.MyCreatedCommunitiesComponent)
      },
      {
        path: 'focus-room',
        loadComponent: () => import('./dashboard/sections/focus-room.component').then((m) => m.FocusRoomComponent)
      }
    ]
  },
  {
    path: 'dashboard/admin',
    canActivate: [privateGuard, roleGuard([UserResDto.RoleEnum.Admin])],
    loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'feed'
      },
      {
        path: 'feed',
        loadComponent: () => import('./dashboard/sections/feed.component').then((m) => m.FeedComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./dashboard/sections/profile.component').then((m) => m.ProfileComponent)
      },
      {
        path: 'communities',
        loadComponent: () => import('./dashboard/sections/my-communities.component').then((m) => m.MyCommunitiesComponent)
      },
      {
        path: 'my-created',
        loadComponent: () => import('./dashboard/sections/my-created-communities.component').then((m) => m.MyCreatedCommunitiesComponent)
      },
      {
        path: 'focus-room',
        loadComponent: () => import('./dashboard/sections/focus-room.component').then((m) => m.FocusRoomComponent)
      }
    ]
  },
  {
    path: 'dashboard/client',
    canActivate: [privateGuard, roleGuard([UserResDto.RoleEnum.Client])],
    loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'feed'
      },
      {
        path: 'feed',
        loadComponent: () => import('./dashboard/sections/feed.component').then((m) => m.FeedComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./dashboard/sections/profile.component').then((m) => m.ProfileComponent)
      },
       {
         path: 'communities',
         loadComponent: () => import('./dashboard/sections/my-communities.component').then((m) => m.MyCommunitiesComponent)
       },
       {
         path: 'my-created',
         loadComponent: () => import('./dashboard/sections/my-created-communities.component').then((m) => m.MyCreatedCommunitiesComponent)
       },
       {
         path: 'focus-room',
         loadComponent: () => import('./dashboard/sections/focus-room.component').then((m) => m.FocusRoomComponent)
       }
     ]
   },
   {
     path: '**',
     redirectTo: 'auth/login'
   }
];
