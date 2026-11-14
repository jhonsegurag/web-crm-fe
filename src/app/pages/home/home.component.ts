import {
  AfterViewInit,
  Component,
  HostListener,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface Feature { title: string; desc: string; icon: SafeHtml; }
interface Testimonial { quote: string; name: string; role: string; initials: string; }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <!-- SKIP LINK -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- NAVBAR -->
    <nav class="nav" [class.scrolled]="scrolled()" role="banner">
      <div class="nav-inner">
        <button class="nav-logo" (click)="scrollTo('hero')" aria-label="Fluvo — back to top">
          <img src="assets/fluvo/lockups/fluvo-lockup-on-light.svg" alt="Fluvo" height="36" width="160">
        </button>
        <div class="nav-links" [class.open]="menuOpen()" role="navigation" aria-label="Main navigation">
          <button (click)="scrollTo('features')">Features</button>
          <button (click)="scrollTo('testimonials')">Testimonials</button>
          <button (click)="scrollTo('waitlist')">Waitlist</button>
          <button (click)="scrollTo('contact')">Contact</button>
          <a routerLink="/login" class="nav-login">Sign in</a>
          <a routerLink="/register" class="btn-cta-sm">Get started</a>
        </div>
        <button class="hamburger" (click)="menuOpen.set(!menuOpen())"
          [attr.aria-expanded]="menuOpen()" aria-label="Toggle navigation menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>

    <!-- HERO -->
    <section id="hero" class="hero" aria-labelledby="hero-heading">
      <div class="hero-deco" aria-hidden="true">
        <svg viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 80 C120 80 150 170 276 170" stroke="#B8A7FF" stroke-width="12" stroke-linecap="round"/>
          <path d="M24 170 L276 170" stroke="#231A33" stroke-width="7" stroke-linecap="round" opacity="0.1"/>
          <path d="M24 260 C120 260 150 170 276 170" stroke="#B8A7FF" stroke-width="12" stroke-linecap="round"/>
          <circle cx="304" cy="170" r="42" fill="#FF6B2C"/>
          <circle cx="304" cy="170" r="64" fill="#FF6B2C" opacity="0.12"/>
        </svg>
      </div>
      <div id="main-content" class="hero-content">
        <span class="hero-badge" role="text">WhatsApp CRM for food businesses</span>
        <h1 class="hero-title" id="hero-heading">From chat to order,<br>in one flow.</h1>
        <p class="hero-sub">Fluvo turns your WhatsApp conversations into confirmed orders — with a pipeline, contacts, catalog and AI agent built in.</p>
        <div class="hero-actions">
          <a routerLink="/register" class="btn-primary">Start free</a>
          <button class="btn-outline" (click)="scrollTo('features')">See how it works</button>
        </div>
      </div>
    </section>

    <!-- STATS BAR -->
    <div class="stats-bar" aria-label="Product statistics">
      <div class="container stats-inner">
        <div class="stat-item aos">
          <span class="stat-num">200+</span>
          <span class="stat-lbl">Active businesses</span>
        </div>
        <div class="stat-div" aria-hidden="true"></div>
        <div class="stat-item aos" style="transition-delay:0.06s">
          <span class="stat-num">10k+</span>
          <span class="stat-lbl">Orders daily</span>
        </div>
        <div class="stat-div" aria-hidden="true"></div>
        <div class="stat-item aos" style="transition-delay:0.12s">
          <span class="stat-num">30s</span>
          <span class="stat-lbl">Avg. response time</span>
        </div>
        <div class="stat-div" aria-hidden="true"></div>
        <div class="stat-item aos" style="transition-delay:0.18s">
          <span class="stat-num">5min</span>
          <span class="stat-lbl">Time to set up</span>
        </div>
      </div>
    </div>

    <!-- FEATURES -->
    <section id="features" class="section features-section" aria-labelledby="features-heading">
      <div class="container">
        <div class="section-header aos">
          <h2 class="section-title" id="features-heading">Everything in one flow</h2>
          <p class="section-sub">Six tools that talk to each other so you don't have to.</p>
        </div>
        <div class="features-grid">
          @for (f of features; track f.title; let i = $index) {
            <div class="feature-card aos" [style.transition-delay]="(i * 60) + 'ms'">
              <div class="feature-icon" [innerHTML]="f.icon" aria-hidden="true"></div>
              <h3 class="feature-title">{{ f.title }}</h3>
              <p class="feature-desc">{{ f.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- TESTIMONIALS -->
    <section id="testimonials" class="section testimonials-section" aria-labelledby="testimonials-heading">
      <div class="container">
        <div class="section-header aos">
          <h2 class="section-title" id="testimonials-heading">Loved by food businesses</h2>
          <p class="section-sub">From food trucks to catering — Fluvo grows with you.</p>
        </div>
        <div class="testimonials-grid">
          @for (t of testimonials; track t.name; let i = $index) {
            <figure class="testimonial-card aos" [style.transition-delay]="(i * 80) + 'ms'">
              <svg class="quote-mark" viewBox="0 0 32 24" fill="none" aria-hidden="true">
                <path d="M0 24V14.4C0 6.4 4.267 1.6 12.8 0l1.6 2.4C10.133 3.733 8 6.933 8 12H14.4V24H0ZM17.6 24V14.4C17.6 6.4 21.867 1.6 30.4 0L32 2.4C27.733 3.733 25.6 6.933 25.6 12H32V24H17.6Z" fill="#B8A7FF" opacity="0.5"/>
              </svg>
              <blockquote class="testimonial-quote">{{ t.quote }}</blockquote>
              <figcaption class="testimonial-author">
                <div class="avatar" aria-hidden="true">{{ t.initials }}</div>
                <div>
                  <div class="author-name">{{ t.name }}</div>
                  <div class="author-role">{{ t.role }}</div>
                </div>
              </figcaption>
            </figure>
          }
        </div>
      </div>
    </section>

    <!-- WAITLIST -->
    <section id="waitlist" class="section waitlist-section" aria-labelledby="waitlist-heading">
      <div class="container waitlist-inner">
        <div class="section-header aos">
          <h2 class="section-title" id="waitlist-heading">Get early access</h2>
          <p class="section-sub">Join the waitlist and be the first to know when we open new spots.</p>
        </div>
        <form class="waitlist-form aos" style="transition-delay:0.1s"
          (submit)="onWaitlistSubmit($event)" aria-label="Waitlist form" novalidate>
          @if (waitlistSubmitted()) {
            <div class="form-success" role="alert" aria-live="polite">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22A565" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              You're on the list! We'll reach out soon.
            </div>
          } @else {
            <div class="waitlist-fields">
              <div class="form-group">
                <label for="wname">Name <span class="req" aria-hidden="true">*</span></label>
                <input id="wname" type="text" placeholder="Your name" autocomplete="name"
                  [value]="waitlistName()" (input)="waitlistName.set($any($event.target).value)"
                  aria-required="true" required>
              </div>
              <div class="form-group">
                <label for="wemail">Email <span class="req" aria-hidden="true">*</span></label>
                <input id="wemail" type="email" placeholder="you@example.com" autocomplete="email"
                  [value]="waitlistEmail()" (input)="waitlistEmail.set($any($event.target).value)"
                  aria-required="true" required>
              </div>
              <div class="form-group">
                <label for="wcompany">Company</label>
                <input id="wcompany" type="text" placeholder="Your company (optional)" autocomplete="organization"
                  [value]="waitlistCompany()" (input)="waitlistCompany.set($any($event.target).value)">
              </div>
            </div>
            @if (waitlistError()) {
              <div class="form-error" role="alert" aria-live="polite">{{ waitlistError() }}</div>
            }
            <button type="submit" class="btn-primary" [disabled]="waitlistLoading()">
              {{ waitlistLoading() ? 'Joining…' : 'Join waitlist' }}
            </button>
          }
        </form>
      </div>
    </section>

    <!-- CONTACT -->
    <section id="contact" class="section contact-section" aria-labelledby="contact-heading">
      <div class="container contact-inner">
        <div class="contact-left aos">
          <h2 class="section-title" id="contact-heading">Let's talk</h2>
          <p class="section-sub" style="text-align:left;max-width:360px">
            Have a question or want a live demo? Send us a message and we'll reply within one business day.
          </p>
          <a href="mailto:hello@fluvo.app" class="contact-email">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A76E8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span>hello&#64;fluvo.app</span>
          </a>
        </div>
        <form class="contact-form aos" style="transition-delay:0.1s"
          (submit)="onSubmit($event)" aria-label="Contact form" novalidate>
          @if (submitted()) {
            <div class="form-success" role="alert" aria-live="polite">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22A565" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              Message sent! We'll be in touch soon.
            </div>
          } @else {
            <div class="form-row">
              <div class="form-group">
                <label for="fname">Name <span class="req" aria-hidden="true">*</span></label>
                <input id="fname" type="text" placeholder="Your name" autocomplete="name"
                  [value]="formName()" (input)="formName.set($any($event.target).value)"
                  aria-required="true" required>
              </div>
              <div class="form-group">
                <label for="femail">Email <span class="req" aria-hidden="true">*</span></label>
                <input id="femail" type="email" placeholder="you@example.com" autocomplete="email"
                  [value]="formEmail()" (input)="formEmail.set($any($event.target).value)"
                  aria-required="true" required>
              </div>
            </div>
            <div class="form-group">
              <label for="fmsg">Message <span class="req" aria-hidden="true">*</span></label>
              <textarea id="fmsg" rows="5" placeholder="Tell us about your business…"
                [value]="formMessage()" (input)="formMessage.set($any($event.target).value)"
                aria-required="true" required></textarea>
            </div>
            <button type="submit" class="btn-primary">Send message</button>
          }
        </form>
      </div>
    </section>

    <!-- BOTTOM CTA -->
    <section class="cta-section" aria-labelledby="cta-heading">
      <div class="cta-deco" aria-hidden="true">
        <svg viewBox="0 0 600 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 80 C180 80 200 150 400 150" stroke="#B8A7FF" stroke-width="10" stroke-linecap="round" opacity="0.25"/>
          <path d="M0 150 L400 150" stroke="#F1EEF8" stroke-width="5" stroke-linecap="round" opacity="0.1"/>
          <path d="M0 220 C180 220 200 150 400 150" stroke="#B8A7FF" stroke-width="10" stroke-linecap="round" opacity="0.25"/>
          <circle cx="430" cy="150" r="48" fill="#FF6B2C" opacity="0.18"/>
        </svg>
      </div>
      <div class="container cta-content">
        <div class="cta-text aos">
          <h2 class="cta-title" id="cta-heading">Ready to turn chats into orders?</h2>
          <p class="cta-sub">Join hundreds of food businesses already using Fluvo. Free 14-day trial, no credit card needed.</p>
        </div>
        <div class="cta-actions aos" style="transition-delay:0.1s">
          <a routerLink="/register" class="btn-primary btn-lg">Start for free</a>
          <a routerLink="/login" class="btn-ghost">Sign in</a>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer" role="contentinfo">
      <div class="container">
        <div class="footer-top">
          <button class="footer-logo" (click)="scrollTo('hero')" aria-label="Back to top">
            <img src="assets/fluvo/lockups/fluvo-lockup-on-dark.svg" alt="Fluvo" height="32" width="142">
          </button>
          <p class="footer-tagline">From chat to order, in one flow.</p>
          <nav class="footer-nav" aria-label="Footer navigation">
            <button (click)="scrollTo('features')">Features</button>
            <button (click)="scrollTo('testimonials')">Testimonials</button>
            <button (click)="scrollTo('waitlist')">Waitlist</button>
            <button (click)="scrollTo('contact')">Contact</button>
            <a routerLink="/login">Sign in</a>
            <a routerLink="/register">Register</a>
          </nav>
        </div>
        <div class="footer-bottom">
          <span>© 2025 Fluvo. All rights reserved.</span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    /* ── TOKENS ──────────────────────────── */
    :host {
      --riverbed:   #231A33;
      --shallows:   #F1EEF8;
      --stream:     #B8A7FF;
      --stream-ink: #8A76E8;
      --current:    #FF6B2C;
      --ready:      #22A565;
      --muted:      #5E566E;

      display: block;
      font-family: 'Manrope', sans-serif;
      color: var(--riverbed);
      overflow-x: hidden;
    }

    /* ── SKIP LINK ───────────────────────── */
    .skip-link {
      position: absolute;
      top: -100%;
      left: 16px;
      z-index: 200;
      background: var(--riverbed);
      color: var(--shallows);
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      padding: 10px 20px;
      border-radius: 0 0 10px 10px;
      text-decoration: none;
      transition: top 0.15s;
    }
    .skip-link:focus { top: 0; outline: 3px solid var(--current); outline-offset: 2px; }

    /* ── SCROLL REVEAL ───────────────────── */
    .aos {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .aos.visible {
      opacity: 1;
      transform: none;
    }
    @media (prefers-reduced-motion: reduce) {
      .aos { opacity: 1; transform: none; transition: none; }
    }

    /* ── HERO ENTRY ──────────────────────── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: none; }
    }
    .hero-badge   { animation: fadeUp 0.55s ease 0.05s both; }
    .hero-title   { animation: fadeUp 0.6s  ease 0.18s both; }
    .hero-sub     { animation: fadeUp 0.6s  ease 0.32s both; }
    .hero-actions { animation: fadeUp 0.6s  ease 0.46s both; }
    @media (prefers-reduced-motion: reduce) {
      .hero-badge, .hero-title, .hero-sub, .hero-actions { animation: none; }
    }

    /* ── NAV ─────────────────────────────── */
    .nav {
      position: fixed;
      inset: 0 0 auto 0;
      z-index: 100;
      transition: background 0.3s, box-shadow 0.3s;
    }
    .nav.scrolled {
      background: rgba(255,255,255,0.82);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      box-shadow: 0 1px 0 rgba(35,26,51,0.07);
    }
    .nav-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 28px;
      height: 68px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .nav-logo {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      flex-shrink: 0;
      line-height: 0;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 2px;
      margin-left: auto;
    }
    .nav-links button {
      background: none;
      border: none;
      font-family: 'Manrope', sans-serif;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--muted);
      cursor: pointer;
      padding: 8px 14px;
      border-radius: 8px;
      transition: color 0.2s, background 0.2s;
    }
    .nav-links button:hover { color: var(--riverbed); background: rgba(241,238,248,0.9); }
    .nav-links button:focus-visible {
      outline: 2px solid var(--stream-ink);
      outline-offset: 2px;
    }
    .nav-login {
      font-family: 'Manrope', sans-serif;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--muted);
      text-decoration: none;
      padding: 8px 14px;
      border-radius: 8px;
      transition: color 0.2s;
    }
    .nav-login:hover { color: var(--riverbed); }
    .nav-login:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 2px; }
    .btn-cta-sm {
      font-family: 'Manrope', sans-serif;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--riverbed);
      background: var(--current);
      text-decoration: none;
      padding: 9px 22px;
      border-radius: 100px;
      margin-left: 10px;
      transition: opacity 0.2s, transform 0.15s;
      white-space: nowrap;
    }
    .btn-cta-sm:hover { opacity: 0.88; transform: translateY(-1px); }
    .btn-cta-sm:focus-visible { outline: 3px solid var(--current); outline-offset: 3px; }
    .hamburger {
      display: none;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 10px;
      margin-left: auto;
      border-radius: 8px;
      transition: background 0.2s;
    }
    .hamburger:hover { background: var(--shallows); }
    .hamburger span {
      display: block;
      width: 22px;
      height: 2px;
      background: var(--riverbed);
      border-radius: 2px;
    }

    /* ── HERO ────────────────────────────── */
    .hero {
      min-height: 100dvh;
      background:
        radial-gradient(ellipse 60% 80% at 8% 55%, rgba(184,167,255,0.28) 0%, transparent 70%),
        radial-gradient(ellipse 45% 55% at 88% 15%, rgba(255,107,44,0.13) 0%, transparent 60%),
        radial-gradient(ellipse 50% 60% at 65% 85%, rgba(138,118,232,0.1) 0%, transparent 60%),
        #F1EEF8;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      padding: 120px 28px 80px;
    }
    .hero-deco {
      position: absolute;
      right: -48px;
      top: 50%;
      transform: translateY(-50%);
      width: min(580px, 56vw);
      pointer-events: none;
    }
    .hero-content {
      position: relative;
      z-index: 1;
      max-width: 680px;
      text-align: center;
    }
    .hero-badge {
      display: inline-block;
      font-family: 'DM Mono', monospace;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--stream-ink);
      background: rgba(138,118,232,0.1);
      border: 1px solid rgba(138,118,232,0.22);
      border-radius: 100px;
      padding: 5px 16px;
      margin-bottom: 28px;
      letter-spacing: 0.03em;
    }
    .hero-title {
      font-family: 'Unbounded', sans-serif;
      font-size: clamp(2.25rem, 5.5vw, 3.75rem);
      font-weight: 800;
      color: var(--riverbed);
      line-height: 1.15;
      margin: 0 0 24px;
    }
    .hero-sub {
      font-size: 1.125rem;
      font-weight: 400;
      color: var(--muted);
      line-height: 1.75;
      margin: 0 auto 44px;
      max-width: 520px;
    }
    .hero-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    /* ── BUTTONS ─────────────────────────── */
    .btn-primary {
      font-family: 'Manrope', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      color: var(--riverbed);
      background: var(--current);
      border: none;
      border-radius: 100px;
      padding: 14px 34px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      transition: opacity 0.2s, transform 0.15s;
      min-height: 48px;
    }
    .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
    .btn-primary:active { transform: translateY(0); }
    .btn-primary:focus-visible { outline: 3px solid var(--current); outline-offset: 3px; }
    .btn-primary.btn-lg { font-size: 1.0625rem; padding: 16px 40px; }
    .btn-outline {
      font-family: 'Manrope', sans-serif;
      font-size: 1rem;
      font-weight: 600;
      color: var(--riverbed);
      background: transparent;
      border: 2px solid var(--riverbed);
      border-radius: 100px;
      padding: 12px 30px;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
      min-height: 48px;
    }
    .btn-outline:hover { background: var(--riverbed); color: var(--shallows); }
    .btn-outline:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 3px; }
    .btn-ghost {
      font-family: 'Manrope', sans-serif;
      font-size: 1rem;
      font-weight: 600;
      color: rgba(241,238,248,0.7);
      background: transparent;
      border: none;
      border-radius: 100px;
      padding: 14px 24px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      transition: color 0.2s;
      min-height: 48px;
    }
    .btn-ghost:hover { color: var(--shallows); }
    .btn-ghost:focus-visible { outline: 2px solid rgba(241,238,248,0.6); outline-offset: 3px; }

    /* ── STATS BAR ───────────────────────── */
    .stats-bar {
      background: #fff;
      border-top: 1px solid rgba(35,26,51,0.07);
      border-bottom: 1px solid rgba(35,26,51,0.07);
      padding: 32px 28px;
    }
    .stats-inner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      flex-wrap: wrap;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 40px;
    }
    .stat-num {
      font-family: 'DM Mono', monospace;
      font-size: 2rem;
      font-weight: 500;
      color: var(--riverbed);
      line-height: 1;
    }
    .stat-lbl {
      font-size: 0.8125rem;
      color: var(--muted);
      letter-spacing: 0.01em;
    }
    .stat-div {
      width: 1px;
      height: 40px;
      background: rgba(35,26,51,0.1);
    }

    /* ── SECTION BASE ────────────────────── */
    .section { padding: 100px 28px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .section-header { text-align: center; margin-bottom: 64px; }
    .section-title {
      font-family: 'Unbounded', sans-serif;
      font-size: clamp(1.5rem, 3vw, 2.25rem);
      font-weight: 700;
      color: var(--riverbed);
      margin: 0 0 16px;
    }
    .section-sub {
      font-size: 1.0625rem;
      color: var(--muted);
      line-height: 1.7;
      margin: 0 auto;
      max-width: 520px;
    }

    /* ── FEATURES ────────────────────────── */
    .features-section { background: var(--shallows); }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .feature-card {
      background: rgba(255,255,255,0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.6);
      border-radius: 20px;
      padding: 32px 28px;
      cursor: default;
      transition:
        transform 0.25s ease,
        box-shadow 0.25s ease,
        opacity 0.5s ease;
    }
    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 40px rgba(35,26,51,0.1);
    }
    .feature-icon { width: 48px; height: 48px; margin-bottom: 20px; line-height: 0; }
    .feature-icon svg { width: 48px; height: 48px; }
    .feature-title {
      font-family: 'Unbounded', sans-serif;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--riverbed);
      margin: 0 0 10px;
    }
    .feature-desc {
      font-size: 0.9375rem;
      color: var(--muted);
      line-height: 1.7;
      margin: 0;
    }

    /* ── TESTIMONIALS ────────────────────── */
    .testimonials-section { background: #fff; }
    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .testimonial-card {
      background: var(--shallows);
      border-radius: 20px;
      padding: 32px 28px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      margin: 0;
    }
    .quote-mark { width: 28px; height: auto; flex-shrink: 0; }
    .testimonial-quote {
      font-size: 1rem;
      color: var(--riverbed);
      line-height: 1.75;
      margin: 0;
      flex: 1;
    }
    .testimonial-author { display: flex; align-items: center; gap: 14px; }
    .avatar {
      width: 44px;
      height: 44px;
      min-width: 44px;
      border-radius: 50%;
      background: var(--stream);
      color: var(--riverbed);
      font-weight: 700;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .author-name { font-weight: 700; font-size: 0.9375rem; color: var(--riverbed); }
    .author-role { font-size: 0.8125rem; color: var(--muted); margin-top: 3px; }

    /* ── CONTACT ─────────────────────────── */
    .contact-section { background: var(--shallows); }
    .contact-inner {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 80px;
      align-items: start;
    }
    .contact-left { padding-top: 4px; }
    .contact-email {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-top: 24px;
      font-size: 0.9375rem;
      color: var(--muted);
      text-decoration: none;
      transition: color 0.2s;
    }
    .contact-email:hover { color: var(--stream-ink); }
    .contact-email:focus-visible { outline: 2px solid var(--stream-ink); outline-offset: 3px; border-radius: 4px; }
    .req { color: var(--current); margin-left: 2px; }
    .contact-form { display: flex; flex-direction: column; gap: 20px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--riverbed);
    }
    .form-group input,
    .form-group textarea {
      font-family: 'Manrope', sans-serif;
      font-size: 0.9375rem;
      color: var(--riverbed);
      background: rgba(255,255,255,0.8);
      border: 2px solid transparent;
      border-radius: 12px;
      padding: 12px 16px;
      outline: none;
      transition: border-color 0.2s, background 0.2s;
      resize: vertical;
      min-height: 48px;
    }
    .form-group textarea { min-height: 120px; }
    .form-group input::placeholder,
    .form-group textarea::placeholder { color: #A89EC0; }
    .form-group input:focus,
    .form-group textarea:focus {
      border-color: var(--stream-ink);
      background: #fff;
    }
    .form-success {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1rem;
      font-weight: 600;
      color: var(--ready);
      background: rgba(34,165,101,0.07);
      border: 1px solid rgba(34,165,101,0.2);
      border-radius: 14px;
      padding: 24px;
    }

    /* ── BOTTOM CTA ──────────────────────── */
    .cta-section {
      position: relative;
      background:
        radial-gradient(ellipse 70% 90% at 50% 110%, rgba(184,167,255,0.18) 0%, transparent 65%),
        var(--riverbed);
      padding: 96px 28px;
      overflow: hidden;
      text-align: center;
    }
    .cta-deco {
      position: absolute;
      left: -40px;
      top: 50%;
      transform: translateY(-50%);
      width: min(600px, 60%);
      pointer-events: none;
      opacity: 0.5;
    }
    .cta-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 40px;
    }
    .cta-title {
      font-family: 'Unbounded', sans-serif;
      font-size: clamp(1.5rem, 3.5vw, 2.5rem);
      font-weight: 700;
      color: var(--shallows);
      margin: 0 0 16px;
    }
    .cta-sub {
      font-size: 1.0625rem;
      color: rgba(241,238,248,0.6);
      line-height: 1.7;
      margin: 0;
      max-width: 480px;
    }
    .cta-actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      justify-content: center;
    }

    /* ── FOOTER ──────────────────────────── */
    .footer {
      background: var(--riverbed);
      border-top: 1px solid rgba(241,238,248,0.08);
      padding: 48px 28px 36px;
    }
    .footer-top {
      display: flex;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
      padding-bottom: 36px;
    }
    .footer-logo { background: none; border: none; cursor: pointer; padding: 0; line-height: 0; }
    .footer-tagline {
      font-size: 0.9375rem;
      color: rgba(241,238,248,0.4);
      margin: 0;
    }
    .footer-nav {
      margin-left: auto;
      display: flex;
      gap: 2px;
      flex-wrap: wrap;
      align-items: center;
    }
    .footer-nav button,
    .footer-nav a {
      background: none;
      border: none;
      font-family: 'Manrope', sans-serif;
      font-size: 0.9rem;
      font-weight: 500;
      color: rgba(241,238,248,0.45);
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 6px;
      text-decoration: none;
      transition: color 0.2s;
    }
    .footer-nav button:hover,
    .footer-nav a:hover { color: var(--shallows); }
    .footer-nav button:focus-visible,
    .footer-nav a:focus-visible { outline: 2px solid rgba(241,238,248,0.5); outline-offset: 2px; }
    .footer-bottom {
      border-top: 1px solid rgba(241,238,248,0.08);
      padding-top: 24px;
    }
    .footer-bottom span {
      font-family: 'DM Mono', monospace;
      font-size: 0.8125rem;
      color: rgba(241,238,248,0.28);
    }

    /* ── WAITLIST ────────────────────────── */
    .waitlist-section { background: #fff; }
    .waitlist-inner { display: flex; flex-direction: column; align-items: center; }
    .waitlist-form { width: 100%; max-width: 640px; display: flex; flex-direction: column; gap: 20px; }
    .waitlist-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .waitlist-fields .form-group:last-child { grid-column: 1 / -1; }
    .form-error {
      font-size: 0.9rem;
      color: #d94040;
      background: rgba(217,64,64,0.07);
      border: 1px solid rgba(217,64,64,0.2);
      border-radius: 10px;
      padding: 12px 16px;
    }
    button[disabled] { opacity: 0.6; cursor: not-allowed; }

    /* ── RESPONSIVE ──────────────────────── */
    @media (max-width: 960px) {
      .features-grid,
      .testimonials-grid { grid-template-columns: repeat(2, 1fr); }
      .contact-inner { grid-template-columns: 1fr; gap: 48px; }
      .stat-item { padding: 8px 24px; }
    }
    @media (max-width: 960px) {
      .waitlist-fields { grid-template-columns: 1fr; }
      .waitlist-fields .form-group:last-child { grid-column: auto; }
    }
    @media (max-width: 640px) {
      .nav-links {
        display: none;
        position: fixed;
        top: 68px;
        inset-inline: 0;
        background: rgba(255,255,255,0.96);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        flex-direction: column;
        align-items: stretch;
        padding: 12px 16px 20px;
        border-bottom: 1px solid rgba(35,26,51,0.08);
        box-shadow: 0 16px 40px rgba(35,26,51,0.12);
        gap: 4px;
      }
      .nav-links.open { display: flex; }
      .nav-links .btn-cta-sm { text-align: center; margin-left: 0; margin-top: 4px; }
      .hamburger { display: flex; }
      .hero-deco { display: none; }
      .features-grid,
      .testimonials-grid { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
      .stat-div { display: none; }
      .stats-inner { gap: 8px; justify-content: space-around; }
      .footer-top { flex-direction: column; align-items: flex-start; }
      .footer-nav { margin-left: 0; }
    }
  `],
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  private sanitizer = inject(DomSanitizer);
  private observer?: IntersectionObserver;

  scrolled    = signal(false);
  menuOpen    = signal(false);
  submitted   = signal(false);
  formName    = signal('');
  formEmail   = signal('');
  formMessage = signal('');

  waitlistSubmitted = signal(false);
  waitlistLoading   = signal(false);
  waitlistError     = signal('');
  waitlistName      = signal('');
  waitlistEmail     = signal('');
  waitlistCompany   = signal('');

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 40); }

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    this.menuOpen.set(false);
  }

  onSubmit(e: Event) {
    e.preventDefault();
    this.submitted.set(true);
  }

  async onWaitlistSubmit(e: Event) {
    e.preventDefault();
    this.waitlistError.set('');
    this.waitlistLoading.set(true);
    try {
      const res = await fetch('http://localhost:3001/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.waitlistEmail(),
          name: this.waitlistName(),
          company: this.waitlistCompany(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        this.waitlistError.set(data?.message ?? 'Something went wrong. Please try again.');
      } else {
        this.waitlistSubmitted.set(true);
      }
    } catch {
      this.waitlistError.set('Could not reach the server. Please try again later.');
    } finally {
      this.waitlistLoading.set(false);
    }
  }

  ngAfterViewInit() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            this.observer?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.aos').forEach((el) => this.observer?.observe(el));
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  private icon(paths: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`
    );
  }

  features: Feature[] = [
    {
      title: 'Inbox',
      desc: 'Every WhatsApp chat in one unified view. Reply, assign and track conversations without juggling multiple phones.',
      icon: this.icon(`
        <rect x="6" y="8" width="36" height="28" rx="5" stroke="#8A76E8" stroke-width="2.5"/>
        <path d="M6 17l18 11 18-11" stroke="#8A76E8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      `),
    },
    {
      title: 'Pipeline',
      desc: 'Drag orders from new to ready on a visual board. Know the status of every order at a single glance.',
      icon: this.icon(`
        <rect x="4"  y="10" width="11" height="28" rx="4" stroke="#8A76E8" stroke-width="2.5"/>
        <rect x="19" y="14" width="11" height="24" rx="4" stroke="#8A76E8" stroke-width="2.5"/>
        <rect x="34" y="18" width="11" height="20" rx="4" stroke="#8A76E8" stroke-width="2.5"/>
      `),
    },
    {
      title: 'Contacts',
      desc: 'Build your customer database automatically from every conversation. No CSV imports, no manual entry.',
      icon: this.icon(`
        <circle cx="24" cy="17" r="8" stroke="#8A76E8" stroke-width="2.5"/>
        <path d="M8 43c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#8A76E8" stroke-width="2.5" stroke-linecap="round"/>
      `),
    },
    {
      title: 'Catalog',
      desc: 'Share product cards with photos, prices and variants in chat. One tap to add an item to the order.',
      icon: this.icon(`
        <rect x="4"  y="4"  width="18" height="18" rx="4" stroke="#8A76E8" stroke-width="2.5"/>
        <rect x="26" y="4"  width="18" height="18" rx="4" stroke="#8A76E8" stroke-width="2.5"/>
        <rect x="4"  y="26" width="18" height="18" rx="4" stroke="#8A76E8" stroke-width="2.5"/>
        <rect x="26" y="26" width="18" height="18" rx="4" stroke="#8A76E8" stroke-width="2.5"/>
      `),
    },
    {
      title: 'Map',
      desc: 'See your customers and active deliveries on a live map. Plan routes and estimate arrivals in seconds.',
      icon: this.icon(`
        <path d="M24 4C16.268 4 10 10.268 10 18c0 10.5 14 26 14 26s14-15.5 14-26c0-7.732-6.268-14-14-14z" stroke="#8A76E8" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="24" cy="18" r="4.5" stroke="#8A76E8" stroke-width="2.5"/>
      `),
    },
    {
      title: 'AI Agent',
      desc: 'The agent reads incoming chats, answers FAQs and drafts order confirmations — so you can focus on the food.',
      icon: this.icon(`
        <rect x="6"  y="16" width="36" height="26" rx="6" stroke="#8A76E8" stroke-width="2.5"/>
        <path d="M18 10v6M30 10v6" stroke="#8A76E8" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="17" cy="29" r="3" fill="#8A76E8"/>
        <circle cx="31" cy="29" r="3" fill="#8A76E8"/>
        <path d="M19 37c1.3 1.8 4 2.8 5 2.8s3.7-1 5-2.8" stroke="#8A76E8" stroke-width="2.5" stroke-linecap="round"/>
      `),
    },
  ];

  testimonials: Testimonial[] = [
    {
      quote: 'We went from missing WhatsApp orders to processing 200+ a day. Fluvo made the whole operation effortless.',
      name: 'Laura M.',
      role: 'Restaurant owner, CDMX',
      initials: 'LM',
    },
    {
      quote: 'The pipeline view changed everything for us. I know exactly where every order stands without asking anyone.',
      name: 'Carlos R.',
      role: 'Catering director, Guadalajara',
      initials: 'CR',
    },
    {
      quote: 'Our response time dropped from 5 minutes to under 30 seconds. Customers notice the difference.',
      name: 'Ana G.',
      role: 'Food truck operator, Monterrey',
      initials: 'AG',
    },
  ];
}
