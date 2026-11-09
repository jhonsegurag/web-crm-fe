import { Component, inject, signal, OnInit } from '@angular/core';
import { ConfigurationService, UserDto, RoleDto, IntegrationDto } from './configuration.service';

const INT_TYPE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  email:    { label: 'Email',    color: '#8A76E8', bg: '#EDE9FF' },
  sms:      { label: 'SMS',      color: '#22A565', bg: '#E6F7EF' },
  webhook:  { label: 'Webhook',  color: '#FF6B2C', bg: '#FFF0E9' },
  crm:      { label: 'CRM',      color: '#0ea5e9', bg: '#e0f2fe' },
  calendar: { label: 'Calendar', color: '#d946ef', bg: '#fae8ff' },
  payment:  { label: 'Payment',  color: '#f59e0b', bg: '#fef3c7' },
};

@Component({
  selector: 'app-config-shell',
  standalone: true,
  imports: [],
  template: `
    <div class="page">

      <!-- Page header -->
      <div class="page-header">
        <div class="page-title-wrap">
          <div class="page-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
            </svg>
          </div>
          <div>
            <h1 class="page-title">Configuration</h1>
            <p class="page-sub">Manage users, roles, and integrations</p>
          </div>
        </div>
      </div>

      <!-- Tab strip -->
      <div class="tab-strip" role="tablist" aria-label="Configuration sections">
        <button
          role="tab"
          class="tab-btn"
          [class.tab-btn--active]="activeTab() === 'users'"
          [attr.aria-selected]="activeTab() === 'users'"
          (click)="setTab('users')"
          style="touch-action:manipulation"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Users
          @if (users().length > 0) {
            <span class="tab-badge" [attr.aria-label]="users().length + ' users'">{{ users().length }}</span>
          }
        </button>
        <button
          role="tab"
          class="tab-btn"
          [class.tab-btn--active]="activeTab() === 'roles'"
          [attr.aria-selected]="activeTab() === 'roles'"
          (click)="setTab('roles')"
          style="touch-action:manipulation"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Roles
          @if (roles().length > 0) {
            <span class="tab-badge" [attr.aria-label]="roles().length + ' roles'">{{ roles().length }}</span>
          }
        </button>
        <button
          role="tab"
          class="tab-btn"
          [class.tab-btn--active]="activeTab() === 'integrations'"
          [attr.aria-selected]="activeTab() === 'integrations'"
          (click)="setTab('integrations')"
          style="touch-action:manipulation"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="16 3 21 3 21 8"/>
            <line x1="4" y1="20" x2="21" y2="3"/>
            <polyline points="21 16 21 21 16 21"/>
            <line x1="15" y1="15" x2="21" y2="21"/>
          </svg>
          Integrations
          @if (integrations().length > 0) {
            <span class="tab-badge" [attr.aria-label]="integrations().length + ' integrations'">{{ integrations().length }}</span>
          }
        </button>
      </div>

      <!-- ══ USERS TAB ══════════════════════════════════════ -->
      @if (activeTab() === 'users') {
        <div role="tabpanel" aria-label="Users">

          @if (usersError()) {
            <div class="state-box state-box--error">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p>{{ usersError() }}</p>
              <button class="btn-retry" (click)="loadUsers()" style="touch-action:manipulation">Try again</button>
            </div>
          }

          @if (loadingUsers()) {
            <div class="item-list">
              @for (_ of skRows; track $index) {
                <div class="item-skel">
                  <div class="skel skel--avatar"></div>
                  <div class="skel-lines">
                    <div class="skel skel--title"></div>
                    <div class="skel skel--sub"></div>
                  </div>
                </div>
              }
            </div>
          }

          @if (!loadingUsers() && !usersError()) {

            <!-- Add User form -->
            @if (showAddUser()) {
              <div class="card card--form">
                <div class="card-header">
                  <h2 class="card-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="8.5" cy="7" r="4"/>
                      <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                    </svg>
                    Invite User
                  </h2>
                  <button class="btn-icon" (click)="cancelAddUser()" aria-label="Cancel" style="touch-action:manipulation">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                @if (addUserError()) {
                  <div class="toast toast--error" role="alert" aria-live="assertive">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {{ addUserError() }}
                  </div>
                }

                <form (ngSubmit)="submitUser()" novalidate>
                  <div class="field">
                    <label class="label" for="usr-email">Email <span class="req" aria-hidden="true">*</span></label>
                    <input
                      id="usr-email"
                      class="input"
                      [class.input--error]="userEmailError()"
                      type="email"
                      [value]="fUserEmail()"
                      (input)="fUserEmail.set(getInputValue($event))"
                      autocomplete="email"
                      placeholder="user@company.com"
                      aria-required="true"
                      [attr.aria-describedby]="userEmailError() ? 'usr-email-err' : null"
                    />
                    @if (userEmailError()) {
                      <span class="field-error" id="usr-email-err" role="alert">{{ userEmailError() }}</span>
                    }
                  </div>

                  <div class="field">
                    <label class="label" for="usr-pw">Password <span class="req" aria-hidden="true">*</span></label>
                    <div class="input-wrap">
                      <input
                        id="usr-pw"
                        class="input input--pw"
                        [class.input--error]="userPwError()"
                        [type]="showUserPw() ? 'text' : 'password'"
                        [value]="fUserPassword()"
                        (input)="fUserPassword.set(getInputValue($event))"
                        autocomplete="new-password"
                        placeholder="Min. 8 characters"
                        aria-required="true"
                        [attr.aria-describedby]="userPwError() ? 'usr-pw-err' : null"
                      />
                      <button type="button" class="eye-btn" (click)="toggleUserPw()"
                        [attr.aria-label]="showUserPw() ? 'Hide password' : 'Show password'"
                        style="touch-action:manipulation">
                        @if (showUserPw()) {
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        } @else {
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        }
                      </button>
                    </div>
                    @if (userPwError()) {
                      <span class="field-error" id="usr-pw-err" role="alert">{{ userPwError() }}</span>
                    }
                  </div>

                  <div class="field">
                    <label class="label" for="usr-role">Role</label>
                    <div class="select-wrap">
                      <select id="usr-role" class="input input--select" (change)="setUserRole($event)">
                        <option value="">No role assigned</option>
                        @for (role of roles(); track role.id) {
                          <option [value]="role.id" [selected]="fUserRoleId() === role.id">{{ role.name }}</option>
                        }
                      </select>
                      <svg class="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>

                  <div class="form-actions">
                    <button type="button" class="btn-secondary" (click)="cancelAddUser()" style="touch-action:manipulation">Cancel</button>
                    <button type="submit" class="btn-primary" [disabled]="addingUser()" [attr.aria-busy]="addingUser()" style="touch-action:manipulation">
                      @if (addingUser()) {
                        <span class="spinner" aria-hidden="true"></span>
                        <span>Inviting…</span>
                      } @else {
                        <span>Invite User</span>
                      }
                    </button>
                  </div>
                </form>
              </div>
            }

            <!-- Toolbar -->
            @if (!showAddUser()) {
              <div class="toolbar">
                <button class="btn-primary" (click)="openAddUser()" style="touch-action:manipulation">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Invite User
                </button>
              </div>
            }

            <!-- Empty -->
            @if (users().length === 0) {
              <div class="state-box">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
                <p>No users yet</p>
                <span>Invite your first team member to get started</span>
              </div>
            }

            <!-- User list -->
            @if (users().length > 0) {
              <ul class="item-list" aria-label="Users">
                @for (usr of users(); track usr.id) {
                  <li class="item-card">
                    <div class="item-avatar" aria-hidden="true">{{ userInitial(usr) }}</div>
                    <div class="item-body">
                      <div class="item-name">{{ usr.email }}</div>
                      <div class="item-meta">
                        <span
                          class="status-badge"
                          [class.status-badge--active]="usr.isActive"
                          [class.status-badge--inactive]="!usr.isActive"
                        >{{ usr.isActive ? 'Active' : 'Inactive' }}</span>
                      </div>
                    </div>
                    @if (confirmDeleteUserId() === usr.id) {
                      <div class="confirm-row">
                        <span class="confirm-text">Delete this user?</span>
                        <button class="btn-danger-sm" [disabled]="deletingUserId() === usr.id" (click)="doDeleteUser(usr.id!)" style="touch-action:manipulation">
                          @if (deletingUserId() === usr.id) {
                            <span class="spinner spinner--sm" aria-hidden="true"></span>
                          } @else {
                            Delete
                          }
                        </button>
                        <button class="btn-ghost-sm" (click)="cancelDeleteUser()" style="touch-action:manipulation">Cancel</button>
                      </div>
                    } @else {
                      <button class="btn-delete" (click)="confirmDeleteUser(usr.id!)" [attr.aria-label]="'Delete ' + usr.email" style="touch-action:manipulation">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    }
                  </li>
                }
              </ul>
            }
          }
        </div>
      }

      <!-- ══ ROLES TAB ══════════════════════════════════════ -->
      @if (activeTab() === 'roles') {
        <div role="tabpanel" aria-label="Roles">

          @if (rolesError()) {
            <div class="state-box state-box--error">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p>{{ rolesError() }}</p>
              <button class="btn-retry" (click)="loadRoles()" style="touch-action:manipulation">Try again</button>
            </div>
          }

          @if (loadingRoles()) {
            <div class="role-grid">
              @for (_ of skRows; track $index) {
                <div class="skel skel--role-chip"></div>
              }
            </div>
          }

          @if (!loadingRoles() && !rolesError()) {

            <!-- Add Role form -->
            @if (showAddRole()) {
              <div class="card card--form">
                <div class="card-header">
                  <h2 class="card-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    New Role
                  </h2>
                  <button class="btn-icon" (click)="cancelAddRole()" aria-label="Cancel" style="touch-action:manipulation">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                @if (addRoleError()) {
                  <div class="toast toast--error" role="alert" aria-live="assertive">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {{ addRoleError() }}
                  </div>
                }

                <form (ngSubmit)="submitRole()" novalidate>
                  <div class="field">
                    <label class="label" for="role-name">Role Name <span class="req" aria-hidden="true">*</span></label>
                    <input
                      id="role-name"
                      class="input"
                      [class.input--error]="roleNameError()"
                      type="text"
                      [value]="fRoleName()"
                      (input)="fRoleName.set(getInputValue($event))"
                      placeholder="e.g. Manager, Support Agent"
                      aria-required="true"
                      [attr.aria-describedby]="roleNameError() ? 'role-name-err' : null"
                    />
                    @if (roleNameError()) {
                      <span class="field-error" id="role-name-err" role="alert">Role name is required</span>
                    }
                  </div>
                  <div class="form-actions">
                    <button type="button" class="btn-secondary" (click)="cancelAddRole()" style="touch-action:manipulation">Cancel</button>
                    <button type="submit" class="btn-primary" [disabled]="addingRole()" [attr.aria-busy]="addingRole()" style="touch-action:manipulation">
                      @if (addingRole()) {
                        <span class="spinner" aria-hidden="true"></span>
                        <span>Creating…</span>
                      } @else {
                        <span>Create Role</span>
                      }
                    </button>
                  </div>
                </form>
              </div>
            }

            @if (!showAddRole()) {
              <div class="toolbar">
                <button class="btn-primary" (click)="openAddRole()" style="touch-action:manipulation">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  New Role
                </button>
              </div>
            }

            <!-- Empty -->
            @if (roles().length === 0) {
              <div class="state-box">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <p>No roles yet</p>
                <span>Create roles to manage permissions for your team</span>
              </div>
            }

            <!-- Role chips -->
            @if (roles().length > 0) {
              <ul class="role-grid" aria-label="Roles">
                @for (role of roles(); track role.id) {
                  <li class="role-chip">
                    <div class="role-chip__icon" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                    </div>
                    <span class="role-chip__name">{{ role.name }}</span>
                    @if (role.permissions && role.permissions.length > 0) {
                      <span class="role-chip__count">{{ role.permissions.length }} perms</span>
                    }
                  </li>
                }
              </ul>
            }
          }
        </div>
      }

      <!-- ══ INTEGRATIONS TAB ═══════════════════════════════ -->
      @if (activeTab() === 'integrations') {
        <div role="tabpanel" aria-label="Integrations">

          @if (lastIntError()) {
            <div class="toast toast--error" role="alert" aria-live="assertive">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {{ lastIntError() }}
            </div>
          }

          @if (integrationsError()) {
            <div class="state-box state-box--error">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p>{{ integrationsError() }}</p>
              <button class="btn-retry" (click)="loadIntegrations()" style="touch-action:manipulation">Try again</button>
            </div>
          }

          @if (loadingIntegrations()) {
            <div class="item-list">
              @for (_ of skRows; track $index) {
                <div class="item-skel item-skel--int">
                  <div class="skel skel--int-icon"></div>
                  <div class="skel-lines">
                    <div class="skel skel--title"></div>
                    <div class="skel skel--sub"></div>
                  </div>
                  <div class="skel skel--toggle"></div>
                </div>
              }
            </div>
          }

          @if (!loadingIntegrations() && !integrationsError()) {

            @if (integrations().length === 0) {
              <div class="state-box">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="16 3 21 3 21 8"/>
                  <line x1="4" y1="20" x2="21" y2="3"/>
                  <polyline points="21 16 21 21 16 21"/>
                  <line x1="15" y1="15" x2="21" y2="21"/>
                </svg>
                <p>No integrations configured</p>
                <span>Connect your tools to automate your workflow</span>
              </div>
            }

            @if (integrations().length > 0) {
              <ul class="item-list" aria-label="Integrations">
                @for (int of integrations(); track int.id) {
                  <li class="item-card item-card--int">
                    <div class="int-type-badge" [style.color]="intTypeCfg(int.type).color" [style.background]="intTypeCfg(int.type).bg">
                      {{ intTypeCfg(int.type).label }}
                    </div>
                    <div class="item-body">
                      <div class="item-name">{{ int.name }}</div>
                      @if (int.type) {
                        <div class="item-meta">
                          <span class="item-type-text">{{ int.type }}</span>
                        </div>
                      }
                    </div>

                    <!-- saving ring -->
                    @if (isIntSaving(int.id!)) {
                      <div class="saving-ring" aria-label="Saving…" role="status">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle cx="12" cy="12" r="9" stroke="rgba(138,118,232,0.2)" stroke-width="2.5"/>
                          <path d="M12 3a9 9 0 0 1 9 9" stroke="#8A76E8" stroke-width="2.5" stroke-linecap="round"/>
                        </svg>
                      </div>
                    }

                    <!-- Toggle switch -->
                    <button
                      role="switch"
                      class="sw"
                      [class.sw--on]="int.isActive"
                      [attr.aria-checked]="int.isActive"
                      [attr.aria-label]="(int.isActive ? 'Disable ' : 'Enable ') + (int.name ?? int.type)"
                      [disabled]="isIntSaving(int.id!)"
                      (click)="toggleInt(int)"
                      style="touch-action:manipulation"
                    >
                      <span class="sw-track" aria-hidden="true">
                        <span class="sw-thumb"></span>
                      </span>
                    </button>
                  </li>
                }
              </ul>
            }
          }
        </div>
      }

    </div>
  `,
  styles: [`
    :host {
      --riverbed:   #231A33;
      --shallows:   #F1EEF8;
      --stream:     #B8A7FF;
      --stream-ink: #8A76E8;
      --current:    #FF6B2C;
      --ready:      #22A565;
      --muted:      #5E566E;
      --danger:     #ef4444;
      --border:     rgba(35,26,51,0.12);
      --radius:     12px;
    }

    /* ── PAGE ─────────────────────────────── */
    .page {
      max-width: 760px;
      margin: 0 auto;
      padding: 32px 24px 64px;
    }
    @media (max-width: 640px) { .page { padding: 24px 16px 48px; } }

    /* ── PAGE HEADER ──────────────────────── */
    .page-header { margin-bottom: 28px; }
    .page-title-wrap { display: flex; align-items: center; gap: 16px; }
    .page-icon {
      width: 48px; height: 48px;
      background: linear-gradient(135deg, var(--stream-ink), #6e56d4);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      color: #fff; flex-shrink: 0;
    }
    .page-title {
      font-family: 'Unbounded', sans-serif;
      font-size: 1.5rem; font-weight: 700; color: var(--riverbed); margin: 0 0 2px;
    }
    .page-sub {
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem; color: var(--muted); margin: 0;
    }

    /* ── TAB STRIP ────────────────────────── */
    .tab-strip {
      display: flex; gap: 2px;
      border-bottom: 2px solid var(--border);
      margin-bottom: 28px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .tab-strip::-webkit-scrollbar { display: none; }
    .tab-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 14px;
      background: none; border: none;
      border-bottom: 2px solid transparent; margin-bottom: -2px;
      font-family: 'Manrope', sans-serif; font-size: 0.875rem; font-weight: 600;
      color: var(--muted); cursor: pointer; white-space: nowrap;
      border-radius: 8px 8px 0 0;
      transition: color 0.15s, background 0.15s;
    }
    .tab-btn:hover { color: var(--riverbed); background: rgba(138,118,232,0.05); }
    .tab-btn--active { color: var(--stream-ink); border-bottom-color: var(--stream-ink); }
    .tab-btn:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; }
    .tab-badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 20px; height: 20px; padding: 0 5px;
      border-radius: 10px; font-size: 0.72rem; font-weight: 700;
      background: rgba(138,118,232,0.18); color: var(--stream-ink);
    }
    .tab-btn--active .tab-badge { background: var(--stream-ink); color: #fff; }

    /* ── CARD ─────────────────────────────── */
    .card {
      background: #fff; border: 1.5px solid var(--border);
      border-radius: 16px; padding: 24px;
      box-shadow: 0 2px 8px rgba(35,26,51,0.05);
    }
    .card--form { margin-bottom: 20px; }
    .card-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px;
    }
    .card-title {
      display: flex; align-items: center; gap: 8px;
      font-family: 'Manrope', sans-serif; font-size: 0.95rem; font-weight: 700;
      color: var(--riverbed); margin: 0;
    }

    /* ── TOOLBAR ──────────────────────────── */
    .toolbar { display: flex; justify-content: flex-end; margin-bottom: 16px; }

    /* ── FIELD ────────────────────────────── */
    .field { display: flex; flex-direction: column; margin-bottom: 16px; }
    .label {
      font-family: 'Manrope', sans-serif; font-size: 0.875rem; font-weight: 600;
      color: var(--riverbed); margin-bottom: 6px;
    }
    .req { color: var(--current); margin-left: 2px; }
    .field-error {
      margin-top: 4px; font-family: 'Manrope', sans-serif;
      font-size: 0.8rem; color: var(--danger);
    }

    /* ── INPUT ────────────────────────────── */
    .input {
      height: 44px; padding: 0 14px;
      border: 1.5px solid var(--border); border-radius: var(--radius);
      font-family: 'Manrope', sans-serif; font-size: 0.95rem; color: var(--riverbed);
      background: #fff; outline: none; width: 100%; box-sizing: border-box;
      transition: border-color 0.18s, box-shadow 0.18s;
    }
    .input::placeholder { color: rgba(94,86,110,0.45); }
    .input:hover { border-color: rgba(138,118,232,0.4); }
    .input:focus { border-color: var(--stream-ink); box-shadow: 0 0 0 3px rgba(138,118,232,0.15); }
    .input--error { border-color: var(--danger) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.10) !important; }
    .input--pw { padding-right: 46px; }
    .input--select { appearance: none; cursor: pointer; padding-right: 34px; }

    .input-wrap { position: relative; }
    .eye-btn {
      position: absolute; right: 0; top: 0;
      width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      background: none; border: none; cursor: pointer;
      color: var(--muted); border-radius: 0 var(--radius) var(--radius) 0;
      transition: color 0.15s;
    }
    .eye-btn:hover { color: var(--stream-ink); }
    .eye-btn:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: -2px; border-radius: var(--radius); }

    .select-wrap { position: relative; }
    .select-arrow {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      pointer-events: none; color: var(--muted);
    }

    /* ── FORM ACTIONS ─────────────────────── */
    .form-actions {
      display: flex; justify-content: flex-end; gap: 10px;
      margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border);
    }

    /* ── BUTTONS ──────────────────────────── */
    .btn-primary {
      display: inline-flex; align-items: center; gap: 7px;
      height: 42px; padding: 0 20px;
      background: var(--stream-ink); color: #fff; border: none;
      border-radius: var(--radius);
      font-family: 'Manrope', sans-serif; font-size: 0.9rem; font-weight: 700;
      cursor: pointer;
      transition: background 0.18s, box-shadow 0.18s, transform 0.12s;
      box-shadow: 0 2px 8px rgba(138,118,232,0.28);
    }
    .btn-primary:hover:not(:disabled) {
      background: #7460d4;
      box-shadow: 0 4px 14px rgba(138,118,232,0.38);
      transform: translateY(-1px);
    }
    .btn-primary:active:not(:disabled) { transform: translateY(0); }
    .btn-primary:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 3px; }
    .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }

    .btn-secondary {
      display: inline-flex; align-items: center; gap: 7px;
      height: 42px; padding: 0 18px;
      background: var(--shallows); color: var(--riverbed);
      border: 1.5px solid var(--border); border-radius: var(--radius);
      font-family: 'Manrope', sans-serif; font-size: 0.9rem; font-weight: 600;
      cursor: pointer; transition: background 0.15s;
    }
    .btn-secondary:hover { background: #e5e0f3; }
    .btn-secondary:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; }

    .btn-icon {
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      background: var(--shallows); border: none; border-radius: 8px;
      color: var(--muted); cursor: pointer; transition: background 0.15s, color 0.15s;
    }
    .btn-icon:hover { background: #e5e0f3; color: var(--riverbed); }
    .btn-icon:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; }

    .btn-delete {
      width: 36px; height: 36px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: none; border: 1.5px solid transparent; border-radius: 8px;
      color: var(--muted); cursor: pointer;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .btn-delete:hover { background: #fef2f2; color: var(--danger); border-color: rgba(239,68,68,0.25); }
    .btn-delete:focus-visible { outline: 2px solid var(--danger); outline-offset: 2px; }

    .btn-retry {
      margin-top: 12px; padding: 8px 20px;
      background: var(--stream-ink); color: #fff; border: none;
      border-radius: var(--radius);
      font-family: 'Manrope', sans-serif; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: background 0.15s;
    }
    .btn-retry:hover { background: #7460d4; }
    .btn-retry:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; }

    .confirm-row {
      display: flex; align-items: center; gap: 8px; flex-shrink: 0;
    }
    .confirm-text {
      font-family: 'Manrope', sans-serif; font-size: 0.8rem;
      font-weight: 600; color: var(--danger); white-space: nowrap;
    }
    @media (max-width: 520px) {
      .confirm-row { flex-direction: column; align-items: flex-end; gap: 4px; }
    }
    .btn-danger-sm {
      height: 30px; padding: 0 12px;
      background: var(--danger); color: #fff; border: none; border-radius: 8px;
      font-family: 'Manrope', sans-serif; font-size: 0.78rem; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; gap: 5px; white-space: nowrap;
      transition: background 0.15s;
    }
    .btn-danger-sm:hover:not(:disabled) { background: #dc2626; }
    .btn-danger-sm:disabled { opacity: 0.65; cursor: not-allowed; }
    .btn-danger-sm:focus-visible { outline: 2px solid var(--danger); outline-offset: 2px; }

    .btn-ghost-sm {
      height: 30px; padding: 0 12px;
      background: var(--shallows); color: var(--riverbed);
      border: 1.5px solid var(--border); border-radius: 8px;
      font-family: 'Manrope', sans-serif; font-size: 0.78rem; font-weight: 600;
      cursor: pointer; white-space: nowrap; transition: background 0.15s;
    }
    .btn-ghost-sm:hover { background: #e5e0f3; }
    .btn-ghost-sm:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; }

    /* ── ITEM LIST ────────────────────────── */
    .item-list {
      list-style: none; margin: 0; padding: 0;
      display: flex; flex-direction: column; gap: 8px;
    }
    .item-card {
      display: flex; align-items: center; gap: 14px;
      background: #fff; border: 1.5px solid var(--border);
      border-radius: 14px; padding: 14px 16px;
      transition: box-shadow 0.15s, border-color 0.15s;
    }
    .item-card:hover { border-color: rgba(138,118,232,0.28); box-shadow: 0 2px 8px rgba(35,26,51,0.06); }
    .item-card--int { gap: 12px; }

    .item-avatar {
      width: 38px; height: 38px; flex-shrink: 0;
      background: linear-gradient(135deg, var(--stream-ink), #6e56d4);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Manrope', sans-serif; font-size: 0.9rem; font-weight: 700;
      color: #fff; text-transform: uppercase;
    }
    .item-body { flex: 1 1 0; min-width: 0; }
    .item-name {
      font-family: 'Manrope', sans-serif; font-size: 0.9rem; font-weight: 700;
      color: var(--riverbed);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .item-meta { display: flex; align-items: center; gap: 6px; margin-top: 3px; }
    .item-type-text {
      font-family: 'DM Mono', monospace; font-size: 0.75rem;
      color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em;
    }

    /* ── STATUS BADGE ─────────────────────── */
    .status-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px; border-radius: 20px;
      font-family: 'Manrope', sans-serif; font-size: 0.72rem; font-weight: 700;
    }
    .status-badge--active  { color: #15803d; background: #f0fdf4; }
    .status-badge--inactive { color: var(--muted); background: var(--shallows); }

    /* ── INTEGRATION TYPE BADGE ───────────── */
    .int-type-badge {
      flex-shrink: 0;
      display: inline-flex; align-items: center;
      padding: 4px 10px; border-radius: 20px;
      font-family: 'Manrope', sans-serif; font-size: 0.75rem; font-weight: 700;
    }

    /* ── ROLE GRID ────────────────────────── */
    .role-grid {
      list-style: none; margin: 0; padding: 0;
      display: flex; flex-wrap: wrap; gap: 10px;
    }
    .role-chip {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 16px;
      background: #fff; border: 1.5px solid var(--border); border-radius: 12px;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .role-chip:hover { border-color: rgba(138,118,232,0.3); box-shadow: 0 2px 8px rgba(35,26,51,0.06); }
    .role-chip__icon {
      width: 28px; height: 28px;
      background: rgba(138,118,232,0.1); border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: var(--stream-ink); flex-shrink: 0;
    }
    .role-chip__name {
      font-family: 'Manrope', sans-serif; font-size: 0.875rem; font-weight: 700;
      color: var(--riverbed);
    }
    .role-chip__count {
      font-family: 'DM Mono', monospace; font-size: 0.72rem; color: var(--muted);
      background: var(--shallows); padding: 1px 6px; border-radius: 10px;
    }

    /* ── TOGGLE SWITCH ────────────────────── */
    .sw {
      background: none; border: none; padding: 0; cursor: pointer;
      display: inline-flex; flex-shrink: 0;
    }
    .sw:disabled { opacity: 0.5; cursor: not-allowed; }
    .sw:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 3px; border-radius: 20px; }
    .sw-track {
      display: block; position: relative;
      width: 44px; height: 26px;
      background: rgba(35,26,51,0.14); border-radius: 13px;
      transition: background 0.22s;
    }
    .sw--on .sw-track { background: var(--stream-ink); }
    .sw-thumb {
      position: absolute; left: 3px; top: 3px;
      width: 20px; height: 20px;
      background: #fff; border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1);
    }
    .sw--on .sw-thumb { transform: translateX(18px); }

    /* ── SAVING RING ──────────────────────── */
    .saving-ring {
      width: 24px; height: 24px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .saving-ring svg { animation: spin 0.8s linear infinite; }

    /* ── TOASTS ───────────────────────────── */
    .toast {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; border-radius: 10px;
      font-family: 'Manrope', sans-serif; font-size: 0.875rem; font-weight: 600;
      margin-bottom: 18px;
    }
    .toast--error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }

    /* ── SKELETONS ────────────────────────── */
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    .skel {
      border-radius: 6px;
      background: linear-gradient(90deg, #ede9f8 25%, #f7f4fd 50%, #ede9f8 75%);
      background-size: 800px 100%;
      animation: shimmer 1.4s infinite linear;
    }
    .skel--avatar  { width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0; }
    .skel--int-icon { width: 70px; height: 26px; border-radius: 13px; flex-shrink: 0; }
    .skel--title   { height: 14px; width: 60%; margin-bottom: 8px; }
    .skel--sub     { height: 11px; width: 40%; }
    .skel--toggle  { width: 44px; height: 26px; border-radius: 13px; flex-shrink: 0; }
    .skel--role-chip { height: 48px; width: 120px; border-radius: 12px; }
    .skel-lines { flex: 1 1 0; }
    .item-skel {
      display: flex; align-items: center; gap: 14px;
      background: #fff; border: 1.5px solid var(--border);
      border-radius: 14px; padding: 14px 16px;
    }
    .item-skel--int { gap: 12px; }

    /* ── STATE BOXES ──────────────────────── */
    .state-box {
      text-align: center; padding: 48px 24px; color: var(--muted);
    }
    .state-box svg { color: rgba(138,118,232,0.3); margin-bottom: 12px; }
    .state-box p { font-family: 'Manrope', sans-serif; font-size: 0.95rem; font-weight: 600; color: var(--riverbed); margin: 0 0 4px; }
    .state-box span { font-family: 'Manrope', sans-serif; font-size: 0.875rem; color: var(--muted); }
    .state-box--error svg { color: rgba(239,68,68,0.4); }
    .state-box--error p { color: var(--danger); }

    /* ── SPINNER ──────────────────────────── */
    .spinner {
      width: 15px; height: 15px;
      border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff;
      border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0;
    }
    .spinner--sm { width: 11px; height: 11px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── REDUCED MOTION ───────────────────── */
    @media (prefers-reduced-motion: reduce) {
      .skel { animation: none; background: #ede9f8; }
      .spinner, .saving-ring svg { animation: none; opacity: 0.6; }
      .sw-thumb, .sw-track { transition: none; }
      .btn-primary, .item-card { transition: none; }
    }
  `],
})
export class ConfigShellComponent implements OnInit {
  private svc = inject(ConfigurationService);

  readonly skRows = [1, 2, 3, 4, 5];

  // ── tab ──────────────────────────────────────────────────────────
  activeTab = signal<'users' | 'roles' | 'integrations'>('users');

  // ── users ─────────────────────────────────────────────────────────
  users          = signal<UserDto[]>([]);
  loadingUsers   = signal(true);
  usersError     = signal('');

  showAddUser    = signal(false);
  fUserEmail     = signal('');
  fUserPassword  = signal('');
  fUserRoleId    = signal('');
  showUserPw     = signal(false);
  addingUser     = signal(false);
  addUserError   = signal('');
  addUserTouched = signal(false);

  confirmDeleteUserId = signal<string | null>(null);
  deletingUserId      = signal<string | null>(null);

  userEmailError(): string {
    if (!this.addUserTouched()) return '';
    const v = this.fUserEmail().trim();
    if (!v) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address';
    return '';
  }
  userPwError(): string {
    if (!this.addUserTouched()) return '';
    if (!this.fUserPassword()) return 'Password is required';
    if (this.fUserPassword().length < 8) return 'Password must be at least 8 characters';
    return '';
  }

  userInitial(usr: UserDto): string {
    return (usr.email ?? '?').charAt(0).toUpperCase();
  }

  // ── roles ─────────────────────────────────────────────────────────
  roles          = signal<RoleDto[]>([]);
  loadingRoles   = signal(true);
  rolesError     = signal('');

  showAddRole    = signal(false);
  fRoleName      = signal('');
  addingRole     = signal(false);
  addRoleError   = signal('');
  addRoleTouched = signal(false);

  roleNameError(): boolean {
    return this.addRoleTouched() && !this.fRoleName().trim();
  }

  // ── integrations ─────────────────────────────────────────────────
  integrations       = signal<IntegrationDto[]>([]);
  loadingIntegrations = signal(true);
  integrationsError  = signal('');
  savingIntIds       = signal<Set<string>>(new Set());
  lastIntError       = signal('');

  isIntSaving(id: string): boolean { return this.savingIntIds().has(id); }

  intTypeCfg(type?: string): { label: string; color: string; bg: string } {
    return INT_TYPE_CFG[type ?? ''] ?? { label: type ?? 'Other', color: '#5E566E', bg: '#F1EEF8' };
  }

  // ── lifecycle ─────────────────────────────────────────────────────
  ngOnInit() {
    this.loadUsers();
    this.loadRoles();
    this.loadIntegrations();
  }

  // ── helpers ───────────────────────────────────────────────────────
  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  setTab(tab: 'users' | 'roles' | 'integrations') {
    this.activeTab.set(tab);
  }

  setUserRole(event: Event) {
    this.fUserRoleId.set((event.target as HTMLSelectElement).value);
  }

  toggleUserPw() { this.showUserPw.update(v => !v); }

  // ── load data ─────────────────────────────────────────────────────
  loadUsers() {
    this.loadingUsers.set(true);
    this.usersError.set('');
    this.svc.getUsers().subscribe({
      next: (res) => { this.users.set(res.data.data ?? []); this.loadingUsers.set(false); },
      error: () => { this.usersError.set('Could not load users. Please try again.'); this.loadingUsers.set(false); },
    });
  }

  loadRoles() {
    this.loadingRoles.set(true);
    this.rolesError.set('');
    this.svc.getRoles().subscribe({
      next: (res) => { this.roles.set(res.data as RoleDto[]); this.loadingRoles.set(false); },
      error: () => { this.rolesError.set('Could not load roles. Please try again.'); this.loadingRoles.set(false); },
    });
  }

  loadIntegrations() {
    this.loadingIntegrations.set(true);
    this.integrationsError.set('');
    this.svc.getIntegrations().subscribe({
      next: (res) => { this.integrations.set(res.data as IntegrationDto[]); this.loadingIntegrations.set(false); },
      error: () => { this.integrationsError.set('Could not load integrations. Please try again.'); this.loadingIntegrations.set(false); },
    });
  }

  // ── users actions ─────────────────────────────────────────────────
  openAddUser() {
    this.fUserEmail.set('');
    this.fUserPassword.set('');
    this.fUserRoleId.set('');
    this.showUserPw.set(false);
    this.addUserError.set('');
    this.addUserTouched.set(false);
    this.showAddUser.set(true);
  }

  cancelAddUser() {
    this.showAddUser.set(false);
    this.addUserError.set('');
    this.addUserTouched.set(false);
  }

  submitUser() {
    this.addUserTouched.set(true);
    if (this.userEmailError() || this.userPwError()) {
      const field = this.userEmailError() ? 'usr-email' : 'usr-pw';
      (document.getElementById(field) as HTMLElement)?.focus();
      return;
    }
    this.addingUser.set(true);
    this.addUserError.set('');
    const dto = {
      email:    this.fUserEmail().trim(),
      password: this.fUserPassword(),
      roleId:   this.fUserRoleId() || undefined,
    };
    this.svc.createUser(dto).subscribe({
      next: (res) => {
        this.users.update(list => [...list, res.data as UserDto]);
        this.addingUser.set(false);
        this.showAddUser.set(false);
        this.addUserTouched.set(false);
      },
      error: (err) => {
        this.addUserError.set(err.error?.error ?? 'Could not create user. Please try again.');
        this.addingUser.set(false);
      },
    });
  }

  confirmDeleteUser(id: string) { this.confirmDeleteUserId.set(id); }
  cancelDeleteUser()            { this.confirmDeleteUserId.set(null); }

  doDeleteUser(id: string) {
    this.deletingUserId.set(id);
    this.svc.deleteUser(id).subscribe({
      next: () => {
        this.users.update(list => list.filter(u => u.id !== id));
        this.deletingUserId.set(null);
        this.confirmDeleteUserId.set(null);
      },
      error: () => {
        this.deletingUserId.set(null);
        this.confirmDeleteUserId.set(null);
      },
    });
  }

  // ── roles actions ─────────────────────────────────────────────────
  openAddRole() {
    this.fRoleName.set('');
    this.addRoleError.set('');
    this.addRoleTouched.set(false);
    this.showAddRole.set(true);
  }

  cancelAddRole() {
    this.showAddRole.set(false);
    this.addRoleError.set('');
    this.addRoleTouched.set(false);
  }

  submitRole() {
    this.addRoleTouched.set(true);
    if (!this.fRoleName().trim()) {
      (document.getElementById('role-name') as HTMLElement)?.focus();
      return;
    }
    this.addingRole.set(true);
    this.addRoleError.set('');
    this.svc.createRole({ name: this.fRoleName().trim(), permissions: [] }).subscribe({
      next: (res) => {
        this.roles.update(list => [...list, res.data as RoleDto]);
        this.addingRole.set(false);
        this.showAddRole.set(false);
        this.addRoleTouched.set(false);
      },
      error: (err) => {
        this.addRoleError.set(err.error?.error ?? 'Could not create role. Please try again.');
        this.addingRole.set(false);
      },
    });
  }

  // ── integrations actions ──────────────────────────────────────────
  toggleInt(int: IntegrationDto) {
    if (!int.id) return;
    const newVal = !int.isActive;
    this.integrations.update(list => list.map(i => i.id === int.id ? { ...i, isActive: newVal } : i));
    this.savingIntIds.update(ids => new Set([...ids, int.id!]));
    this.svc.toggleIntegration(int.id).subscribe({
      next: () => {
        this.savingIntIds.update(ids => { const s = new Set(ids); s.delete(int.id!); return s; });
      },
      error: () => {
        this.integrations.update(list => list.map(i => i.id === int.id ? { ...i, isActive: !newVal } : i));
        this.savingIntIds.update(ids => { const s = new Set(ids); s.delete(int.id!); return s; });
        this.lastIntError.set('Could not update "' + (int.name ?? int.type) + '". Please try again.');
        setTimeout(() => this.lastIntError.set(''), 3500);
      },
    });
  }
}
