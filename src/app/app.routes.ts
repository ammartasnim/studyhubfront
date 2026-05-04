import { Routes } from '@angular/router';

import { privateGuard } from './guards/private.guard';
import { publicGuard } from './guards/public.guard';
import { roleGuard } from './guards/role.guard';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AuthCallbackComponent } from './auth/auth-callback/auth-callback.component';
import { FocusTimerComponent } from './dashboard/client/focus-timer.component';

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
    component:LoginComponent
  },
  {
    path: 'auth/register',
    canActivate: [publicGuard],
    component:RegisterComponent
    
  },
  {
    path: 'auth/callback',
    canActivate: [publicGuard],
    component: AuthCallbackComponent
  },
  {
    path: 'dashboard',
    canActivate: [privateGuard],
    loadComponent: () => import('./dashboard/Nav/dashNav').then((m) => m.DashboardComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'feed'
      },
      {
        path: 'feed',
        loadComponent: () => import('./dashboard/client/feed').then((m) => m.FeedComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./dashboard/client/profile').then((m) => m.ProfileComponent)
      },
       {
         path: 'explore',
         loadComponent: () => import('./dashboard/client/explore-communities').then((m) => m.ExploreCommunitiesComponent)
       },
       {
         path: 'communities',
         loadComponent: () => import('./dashboard/client/my-communities').then((m) => m.MyCommunitiesComponent)
       },
       {
         path: 'community/:id',
         loadComponent: () => import('./dashboard/client/community-detail').then((m) => m.CommunityDetailComponent)
       },
       {
         path: 'my-created',
           loadComponent: () => import('./dashboard/client/my-created-communities').then((m) => m.MyCreatedCommunitiesComponent)
         },
      {
        path: 'focus-room',
        component:FocusTimerComponent
      },
      {
        path: 'settings',
        loadComponent: () => import('./dashboard/client/settings').then((m) => m.SettingsComponent)
      }
    ]
  },
  // {
  //   path: 'dashboard/admin',
  //   canActivate: [privateGuard, roleGuard(['Admin'])],
  //   loadComponent: () => import('./dashboard/Nav/dashNav').then((m) => m.DashboardComponent),
  //   children: [
  //     {
  //       path: '',
  //       pathMatch: 'full',
  //       redirectTo: 'feed'
  //     },
  //     {
  //       path: 'feed',
  //       loadComponent: () => import('./dashboard/client/feed').then((m) => m.FeedComponent)
  //     },
  //     {
  //       path: 'profile',
  //       loadComponent: () => import('./dashboard/client/profile').then((m) => m.ProfileComponent)
  //     },
  //      {
  //        path: 'explore',
  //        loadComponent: () => import('./dashboard/client/explore-communities').then((m) => m.ExploreCommunitiesComponent)
  //      },
  //      {
  //        path: 'communities',
  //        loadComponent: () => import('./dashboard/client/my-communities').then((m) => m.MyCommunitiesComponent)
  //      },
  //      {
  //        path: 'community/:id',
  //        loadComponent: () => import('./dashboard/client/community-detail').then((m) => m.CommunityDetailComponent)
  //      },
  //      {
  //        path: 'my-created',
  //        loadComponent: () => import('./dashboard/client/my-created-communities').then((m) => m.MyCreatedCommunitiesComponent)
  //      },
  //     {
  //       path: 'focus-room',
  //       component:FocusTimerComponent
  //     },
  //     {
  //       path: 'settings',
  //       loadComponent: () => import('./dashboard/client/settings').then((m) => m.SettingsComponent)
  //     }
  //   ]
  // },
  // In your routes, replace the dashboard/admin children with:
{
  path: 'dashboard/admin',
  canActivate: [privateGuard, roleGuard(['Admin'])],
  loadComponent: () => import('./dashboard/admin/admin-shell')
    .then(m => m.AdminShell),
  children: [
    { path: '', redirectTo: 'stats', pathMatch: 'full' },
    {
      path: 'stats',
      loadComponent: () => import('./dashboard/admin/admin-stats')
        .then(m => m.AdminStats)
    },
    {
      path: 'users',
      loadComponent: () => import('./dashboard/admin/admin-users')
        .then(m => m.AdminUsers)
    },
    {
      path: 'posts',
      loadComponent: () => import('./dashboard/admin/admin-posts')
        .then(m => m.AdminPosts)
    },
    {
      path: 'comments',
      loadComponent: () => import('./dashboard/admin/admin-comments')
        .then(m => m.AdminComments)
    },
    {
      path: 'communities',
      loadComponent: () => import('./dashboard/admin/admin-communities')
        .then(m => m.AdminCommunities)
    }
  ]
},
  {
    path: 'dashboard/client',
    canActivate: [privateGuard, roleGuard(['Client'])],
    loadComponent: () => import('./dashboard/Nav/dashNav').then((m) => m.DashboardComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'feed'
      },
      {
        path: 'feed',
        loadComponent: () => import('./dashboard/client/feed').then((m) => m.FeedComponent)
      },
       {
         path: 'profile',
         loadComponent: () => import('./dashboard/client/profile').then((m) => m.ProfileComponent)
       },
       {
         path: 'explore',
         loadComponent: () => import('./dashboard/client/explore-communities').then((m) => m.ExploreCommunitiesComponent)
       },
        {
          path: 'communities',
          loadComponent: () => import('./dashboard/client/my-communities').then((m) => m.MyCommunitiesComponent)
        },
       {
         path: 'community/:id',
         loadComponent: () => import('./dashboard/client/community-detail').then((m) => m.CommunityDetailComponent)
       },
       {
         path: 'my-created',
         loadComponent: () => import('./dashboard/client/my-created-communities').then((m) => m.MyCreatedCommunitiesComponent)
       },
       {
         path: 'focus-room',
         component:FocusTimerComponent
       },
       {
         path: 'settings',
         loadComponent: () => import('./dashboard/client/settings').then((m) => m.SettingsComponent)
       }
     ]
   },
   {
     path: '**',
     redirectTo: 'auth/login'
   }
];
