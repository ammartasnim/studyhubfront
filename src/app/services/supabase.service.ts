import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl, 
      environment.supabaseKey
    );
  }

  async signInWithGoogle() {
      return await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:4200/auth/callback'
        }
      });
    }
    async signInWithGithub(){
      return await this.supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: 'http://localhost:4200/auth/callback'
        }
      });
    }

  async getSessionToken() {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.access_token;
  }
  async getUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async signOut() {
    await this.supabase.auth.signOut();
  }


  
}
