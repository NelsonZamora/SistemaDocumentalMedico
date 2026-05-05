import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    return data;
  }

  async getUserId() {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.user.id;
  }

  async getUserProfile(userId: string) {
  const { data, error } = await this.supabase
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
  }

  async logout() {
    await this.supabase.auth.signOut();
  }

  getClient() {
    return this.supabase;
  }
}