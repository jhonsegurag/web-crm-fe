import { computed, signal } from '@angular/core';
import { AuthUser } from '../shared/types';

const _token = signal<string | null>(
  typeof localStorage !== 'undefined' ? localStorage.getItem('crm_token') : null
);
const _user = signal<AuthUser | null>(null);

export const authStore = {
  token: _token.asReadonly(),
  user: _user.asReadonly(),
  isAuthenticated: computed(() => _token() !== null),
  login(token: string, user: AuthUser) {
    localStorage.setItem('crm_token', token);
    _token.set(token);
    _user.set(user);
  },
  logout() {
    localStorage.removeItem('crm_token');
    _token.set(null);
    _user.set(null);
  },
  setUser(user: AuthUser) {
    _user.set(user);
  },
};
