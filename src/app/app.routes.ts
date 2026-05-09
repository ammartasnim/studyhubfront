import { Routes } from '@angular/router';

import { privateGuard } from './core/guards/private.guard';
import { publicGuard } from './core/guards/public.guard';
import { roleGuard } from './core/guards/role.guard';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { AuthCallbackComponent } from './auth/callback/callback';
import { FocusTimerComponent } from './dashboard/client/pages/focus-timer.component';


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
    loadComponent: () => import('./dashboard/layout/dashboard-nav').then((m) => m.DashboardComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'feed'
      },
      {
        path: 'feed',
        loadComponent: () => import('./dashboard/client/pages/feed').then((m) => m.FeedComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./dashboard/client/pages/my_profile').then((m) => m.ProfileComponent)
      },
       {
         path: 'explore',
         loadComponent: () => import('./dashboard/client/pages/explore-communities').then((m) => m.ExploreCommunitiesComponent)
       },
       {
         path: 'communities',
         loadComponent: () => import('./dashboard/client/pages/communities').then((m) => m.MyCommunitiesComponent)
       },
       {
         path: 'community/:id',
         loadComponent: () => import('./dashboard/client/pages/community-detail').then((m) => m.CommunityDetailComponent)
       },
       {
         path: 'my-created',
           loadComponent: () => import('./dashboard/client/pages/my-communities').then((m) => m.MyCreatedCommunitiesComponent)
         },
      {
        path: 'focus-room',
        component:FocusTimerComponent
      },
      {
        path: 'settings',
        loadComponent: () => import('./dashboard/client/pages/settings').then((m) => m.SettingsComponent)
      },
      {
        path: 'chat',
        loadComponent: () => import('./dashboard/client/pages/chat').then((m) => m.ChatComponent)
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
      loadComponent: () => import('./dashboard/admin/admin-posts-reports')
       .then(m => m.AdminPostReports)
    },
  {
  path: 'comments',
  loadComponent: () => import('./dashboard/admin/admin-comments-reports')
    .then(m => m.AdminCommentReports)  
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
    loadComponent: () => import('./dashboard/layout/dashboard-nav').then((m) => m.DashboardComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'feed'
      },
      {
        path: 'feed',
        loadComponent: () => import('./dashboard/client/pages/feed').then((m) => m.FeedComponent)
      },
       {
         path: 'profile',
         loadComponent: () => import('./dashboard/client/pages/my_profile').then((m) => m.ProfileComponent)
       },
       {
         path: 'explore',
         loadComponent: () => import('./dashboard/client/pages/explore-communities').then((m) => m.ExploreCommunitiesComponent)
       },
        {
          path: 'communities',
          loadComponent: () => import('./dashboard/client/pages/communities').then((m) => m.MyCommunitiesComponent)
        },
       {
         path: 'community/:id',
         loadComponent: () => import('./dashboard/client/pages/community-detail').then((m) => m.CommunityDetailComponent)
       },
       {
         path: 'my-created',
         loadComponent: () => import('./dashboard/client/pages/my-communities').then((m) => m.MyCreatedCommunitiesComponent)
       },
       {
         path: 'focus-room',
         component:FocusTimerComponent
       },
        {
          path: 'settings',
          loadComponent: () => import('./dashboard/client/pages/settings').then((m) => m.SettingsComponent)
         },
         {
          path: 'chat',
          loadComponent: () => import('./dashboard/client/pages/chat').then((m) => m.ChatComponent)
         }
         ,
        {
         path: 'suggestedFriends',
         loadComponent: () => import('./dashboard/client/pages/suggested-friends').then((m) => m.SuggestedFriendsComponent)

        }
        ,
        {
         path: 'profile/:id',
         loadComponent: () => import('./dashboard/client/pages/profile-detail').then((m) => m.ProfileDetailComponent)
        }
      ]
    },
   {
     path: '**',
     redirectTo: 'auth/login'
   }
];
