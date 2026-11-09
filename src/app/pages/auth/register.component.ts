import { Component, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { authStore } from '../../store/auth.store';
import { AuthResponse } from '../../shared/types';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="card">

        <!-- Logo -->
        <div class="brand">
          <img src="assets/fluvo/lockups/fluvo-lockup-on-dark.svg" alt="Fluvo" height="32" width="143">
        </div>

        <h1 class="heading">Create your account</h1>
        <p class="sub">Join 200+ food businesses already on Fluvo</p>

        <!-- Form-level error -->
        @if (error()) {
          <div class="alert" role="alert" aria-live="assertive" tabindex="-1" #errorAlert>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7.25" stroke="#ef4444" stroke-width="1.5"/>
              <path d="M8 4.5v4M8 10.5v1" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            {{ error() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>

          <!-- Business Name -->
          <div class="field">
            <label class="label" for="businessName">
              Business name <span class="req" aria-hidden="true">*</span>
            </label>
            <input
              id="businessName"
              class="input"
              [class.input--error]="showError('businessName')"
              type="text"
              formControlName="businessName"
              autocomplete="organization"
              placeholder="Acme Foods"
              aria-required="true"
              [attr.aria-describedby]="showError('businessName') ? 'businessName-err' : null"
            />
            @if (showError('businessName')) {
              <span class="field-error" id="businessName-err" role="alert">
                Business name is required
              </span>
            }
          </div>

          <!-- Email -->
          <div class="field">
            <label class="label" for="email">
              Work email <span class="req" aria-hidden="true">*</span>
            </label>
            <input
              id="email"
              class="input"
              [class.input--error]="showError('email')"
              type="email"
              formControlName="email"
              autocomplete="email"
              placeholder="you@company.com"
              aria-required="true"
              [attr.aria-describedby]="showError('email') ? 'email-err' : null"
            />
            @if (showError('email')) {
              <span class="field-error" id="email-err" role="alert">
                {{ emailErrorMsg() }}
              </span>
            }
          </div>

          <!-- Password -->
          <div class="field">
            <label class="label" for="password">
              Password <span class="req" aria-hidden="true">*</span>
            </label>
            <div class="input-wrap">
              <input
                id="password"
                class="input input--pw"
                [class.input--error]="showError('password')"
                [type]="showPw() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="new-password"
                placeholder="Min. 6 characters"
                aria-required="true"
                [attr.aria-describedby]="showError('password') ? 'password-err' : 'pw-hint'"
              />
              <button type="button" class="eye-btn" (click)="togglePw()"
                [attr.aria-label]="showPw() ? 'Hide password' : 'Show password'">
                @if (showPw()) {
                  <!-- eye-off -->
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                } @else {
                  <!-- eye -->
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                }
              </button>
            </div>
            @if (showError('password')) {
              <span class="field-error" id="password-err" role="alert">
                {{ pwErrorMsg() }}
              </span>
            }
            @if (!showError('password') && pwValue().length > 0) {
              <!-- Strength bar -->
              <div class="strength" id="pw-hint" [attr.aria-label]="'Password strength: ' + strengthLabel()">
                <div class="strength-bars">
                  @for (seg of [0,1,2,3]; track seg) {
                    <div class="strength-seg" [class]="strengthClass(seg)"></div>
                  }
                </div>
                <span class="strength-label" [class]="'strength-label--' + strengthKey()">{{ strengthLabel() }}</span>
              </div>
            }
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="btn-primary"
            [disabled]="loading()"
            [attr.aria-busy]="loading()"
            style="touch-action: manipulation"
          >
            @if (loading()) {
              <span class="spinner" aria-hidden="true"></span>
              <span>Creating account…</span>
            } @else {
              <span>Create account</span>
            }
          </button>
        </form>

        <p class="signin-link">
          Already have an account?
          <a routerLink="/login" class="link">Sign in</a>
        </p>

        <p class="legal">
          By creating an account you agree to our
          <a href="#" class="link">Terms</a> and
          <a href="#" class="link">Privacy Policy</a>.
        </p>

      </div>
    </div>
  `,
  styles: [`
    :host {
      --riverbed:    #231A33;
      --shallows:    #F1EEF8;
      --stream:      #B8A7FF;
      --stream-ink:  #8A76E8;
      --current:     #FF6B2C;
      --ready:       #22A565;
      --muted:       #5E566E;
      --danger:      #ef4444;
      --border:      rgba(35,26,51,0.14);
      --input-bg:    #fff;
      --radius:      12px;
    }

    /* ── PAGE ─────────────────────────── */
    .page {
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      background: var(--shallows);
      background-image:
        radial-gradient(ellipse 80% 60% at 10% 0%, rgba(138,118,232,0.12) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 90% 100%, rgba(255,107,44,0.07) 0%, transparent 55%);
    }

    /* ── CARD ─────────────────────────── */
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(14px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0)   scale(1); }
    }
    .card {
      width: 100%;
      max-width: 440px;
      background: #fff;
      border-radius: 20px;
      padding: 40px 40px 32px;
      box-shadow: 0 4px 6px rgba(35,26,51,0.04), 0 16px 40px rgba(35,26,51,0.09);
      animation: cardIn 0.35s cubic-bezier(0.22,1,0.36,1) both;
    }
    @media (max-width: 480px) {
      .card { padding: 32px 24px 28px; }
    }

    /* ── BRAND ────────────────────────── */
    .brand {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      background: var(--riverbed);
      border-radius: 14px;
      margin-bottom: 24px;
    }

    /* ── HEADING ──────────────────────── */
    .heading {
      font-family: 'Unbounded', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--riverbed);
      margin: 0 0 6px;
      line-height: 1.25;
    }
    .sub {
      font-family: 'Manrope', sans-serif;
      font-size: 0.9rem;
      color: var(--muted);
      margin: 0 0 24px;
    }

    /* ── ALERT ────────────────────────── */
    .alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      color: #b91c1c;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      margin-bottom: 20px;
    }

    /* ── FIELD ────────────────────────── */
    .field {
      display: flex;
      flex-direction: column;
      margin-bottom: 18px;
    }
    .label {
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--riverbed);
      margin-bottom: 6px;
    }
    .req { color: var(--current); margin-left: 2px; }

    /* ── INPUT ────────────────────────── */
    .input {
      height: 48px;
      padding: 0 14px;
      border: 1.5px solid var(--border);
      border-radius: var(--radius);
      font-family: 'Manrope', sans-serif;
      font-size: 0.95rem;
      color: var(--riverbed);
      background: var(--input-bg);
      outline: none;
      transition: border-color 0.18s, box-shadow 0.18s;
      width: 100%;
      box-sizing: border-box;
    }
    .input::placeholder { color: rgba(94,86,110,0.5); }
    .input:hover { border-color: rgba(138,118,232,0.4); }
    .input:focus {
      border-color: var(--stream-ink);
      box-shadow: 0 0 0 3px rgba(138,118,232,0.15);
    }
    .input--error {
      border-color: var(--danger) !important;
      box-shadow: 0 0 0 3px rgba(239,68,68,0.10) !important;
    }
    .input--pw { padding-right: 48px; }

    .input-wrap { position: relative; }
    .eye-btn {
      position: absolute;
      right: 0;
      top: 0;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--muted);
      border-radius: 0 var(--radius) var(--radius) 0;
      transition: color 0.15s;
    }
    .eye-btn:hover { color: var(--stream-ink); }
    .eye-btn:focus-visible {
      outline: 2px solid var(--stream-ink);
      outline-offset: -2px;
      border-radius: var(--radius);
    }

    /* ── FIELD ERROR ──────────────────── */
    .field-error {
      margin-top: 5px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8rem;
      color: var(--danger);
    }

    /* ── PASSWORD STRENGTH ────────────── */
    .strength {
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .strength-bars {
      display: flex;
      gap: 4px;
      flex: 1;
    }
    .strength-seg {
      height: 4px;
      border-radius: 2px;
      flex: 1;
      background: rgba(35,26,51,0.1);
      transition: background 0.25s;
    }
    .strength-seg--weak   { background: #ef4444; }
    .strength-seg--fair   { background: #f97316; }
    .strength-seg--good   { background: #eab308; }
    .strength-seg--strong { background: var(--ready); }

    .strength-label {
      font-family: 'Manrope', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }
    .strength-label--weak   { color: #ef4444; }
    .strength-label--fair   { color: #f97316; }
    .strength-label--good   { color: #ca8a04; }
    .strength-label--strong { color: var(--ready); }

    /* ── SUBMIT BUTTON ────────────────── */
    .btn-primary {
      width: 100%;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 8px;
      background: var(--stream-ink);
      color: #fff;
      border: none;
      border-radius: var(--radius);
      font-family: 'Manrope', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
      box-shadow: 0 2px 10px rgba(138,118,232,0.3);
    }
    .btn-primary:hover:not(:disabled) {
      background: #7460d4;
      box-shadow: 0 4px 16px rgba(138,118,232,0.4);
      transform: translateY(-1px);
    }
    .btn-primary:active:not(:disabled) { transform: translateY(0); }
    .btn-primary:focus-visible {
      outline: 2px solid var(--stream-ink);
      outline-offset: 3px;
      border-radius: var(--radius);
    }
    .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }

    /* ── SPINNER ──────────────────────── */
    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── FOOTER LINKS ─────────────────── */
    .signin-link {
      margin-top: 24px;
      text-align: center;
      font-family: 'Manrope', sans-serif;
      font-size: 0.9rem;
      color: var(--muted);
    }
    .legal {
      margin-top: 12px;
      text-align: center;
      font-family: 'Manrope', sans-serif;
      font-size: 0.78rem;
      color: rgba(94,86,110,0.7);
      line-height: 1.5;
    }
    .link {
      color: var(--stream-ink);
      font-weight: 600;
      text-decoration: none;
      transition: color 0.15s;
    }
    .link:hover { color: #7460d4; text-decoration: underline; }
    .link:focus-visible {
      outline: 2px solid var(--stream-ink);
      outline-offset: 2px;
      border-radius: 3px;
    }

    @media (prefers-reduced-motion: reduce) {
      .card { animation: none; }
      .spinner { animation: none; opacity: 0.6; }
      .btn-primary { transition: none; }
      .input { transition: none; }
    }
  `],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  @ViewChild('errorAlert') private errorAlert?: ElementRef<HTMLElement>;

  form = this.fb.group({
    businessName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = signal(false);
  error = signal('');
  showPw = signal(false);

  pwValue = computed(() => (this.form.get('password')?.value ?? '') as string);

  strengthKey = computed<'weak' | 'fair' | 'good' | 'strong'>(() => {
    const pw = this.pwValue();
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score === 0) return 'weak';
    if (score === 1) return 'weak';
    if (score === 2) return 'fair';
    if (score === 3) return 'good';
    return 'strong';
  });

  strengthLabel = computed(() => {
    const map = { weak: 'Weak', fair: 'Fair', good: 'Good', strong: 'Strong' };
    return map[this.strengthKey()];
  });

  strengthClass(seg: number): string {
    const level = { weak: 1, fair: 2, good: 3, strong: 4 }[this.strengthKey()];
    return seg < level ? `strength-seg strength-seg--${this.strengthKey()}` : 'strength-seg';
  }

  togglePw() { this.showPw.update(v => !v); }

  showError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  emailErrorMsg = computed(() => {
    const ctrl = this.form.get('email');
    if (!ctrl || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'Email is required';
    if (ctrl.errors['email']) return 'Enter a valid email address';
    return '';
  });

  pwErrorMsg = computed(() => {
    const ctrl = this.form.get('password');
    if (!ctrl || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'Password is required';
    if (ctrl.errors['minlength']) return 'Password must be at least 6 characters';
    return '';
  });

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      // Focus the first invalid field for keyboard/screen-reader users
      const firstInvalid = ['businessName', 'email', 'password'].find(
        f => this.form.get(f)?.invalid
      );
      if (firstInvalid) {
        (document.getElementById(firstInvalid) as HTMLElement)?.focus();
      }
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.http.post<{ success: boolean; data: AuthResponse }>('/auth/register', this.form.value).subscribe({
      next: (res) => {
        authStore.login(res.data.token, res.data.user);
        this.router.navigate(['/inbox']);
      },
      error: (err) => {
        this.error.set(err.error?.error ?? 'Registration failed. Please try again.');
        this.loading.set(false);
        // After DOM update, move focus to the error summary
        setTimeout(() => this.errorAlert?.nativeElement?.focus(), 0);
      },
    });
  }
}
