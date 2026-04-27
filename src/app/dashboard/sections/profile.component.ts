import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserContextService } from '../../user-context.service';
import { BadgesDisplayComponent } from '../components/badges-display.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, BadgesDisplayComponent],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

    .profile-card {
      font-family: 'DM Sans', sans-serif;
      position: relative;
      border-radius: 2rem;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07), 0 0 0 1px rgb(99 102 241 / 0.08);
    }

    /* ── Banner ── */
    .banner {
      position: relative;
      height: 11rem;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #c026d3 100%);
      overflow: hidden;
    }
    .banner::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 60% at 20% 50%, rgb(255 255 255 / 0.12) 0%, transparent 60%),
        radial-gradient(ellipse 50% 80% at 80% 20%, rgb(255 255 255 / 0.08) 0%, transparent 55%);
    }
    /* Shimmer sweep */
    .banner::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg, transparent 40%, rgb(255 255 255 / 0.15) 50%, transparent 60%);
      background-size: 200% 100%;
      animation: shimmer 3.5s ease-in-out infinite;
    }
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Floating orbs */
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(40px);
      opacity: 0.35;
      animation: drift 8s ease-in-out infinite alternate;
    }
    .orb-1 { width: 160px; height: 160px; background: #818cf8; top: -40px; left: -30px; animation-delay: 0s; }
    .orb-2 { width: 120px; height: 120px; background: #e879f9; top: 10px; right: 40px; animation-delay: -3s; }
    .orb-3 { width: 80px; height: 80px; background: #a78bfa; bottom: -10px; left: 45%; animation-delay: -5s; }
    @keyframes drift {
      from { transform: translate(0, 0) scale(1); }
      to   { transform: translate(12px, 8px) scale(1.08); }
    }

    /* ── Avatar ── */
    .avatar-ring {
      position: relative;
      width: 7.5rem;
      height: 7.5rem;
      flex-shrink: 0;
    }
    .avatar-ring::before {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 1.6rem;
      background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
      z-index: 0;
    }
    .avatar-ring::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 1.6rem;
      background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
      filter: blur(12px);
      opacity: 0.5;
      z-index: -1;
      animation: pulse-glow 3s ease-in-out infinite;
    }
    @keyframes pulse-glow {
      0%, 100% { opacity: 0.4; filter: blur(12px); }
      50%       { opacity: 0.7; filter: blur(18px); }
    }
    .avatar-inner {
      position: relative;
      z-index: 1;
      width: 100%;
      height: 100%;
      border-radius: 1.4rem;
      overflow: hidden;
      background: #e0e7ff;
    }

    /* ── Monogram fallback ── */
    .monogram {
      display: grid;
      place-items: center;
      height: 100%;
      background: linear-gradient(135deg, #6366f1, #a855f7);
    }
    .monogram span {
      font-family: 'Syne', sans-serif;
      font-size: 2.25rem;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.02em;
    }

    /* ── Body ── */
    .body {
      padding: 0 2rem 2rem;
    }
    .meta-row {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: -2.75rem;
    }
    @media (min-width: 768px) {
      .meta-row { flex-direction: row; align-items: flex-end; justify-content: space-between; }
    }

    .eyebrow {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      background: linear-gradient(90deg, #6366f1, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0 0 0.35rem;
    }

    .display-name {
      font-family: 'Syne', sans-serif;
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.04em;
      line-height: 1.1;
      color: #0f172a;
      margin: 0 0 0.75rem;
    }

    /* ── Chips ── */
    .chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.28rem 0.75rem;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 500;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .chip:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgb(0 0 0 / 0.08); }

    .chip-username {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }
    .chip-role {
      background: linear-gradient(135deg, #ede9fe, #fdf4ff);
      color: #7c3aed;
      border: 1px solid #ddd6fe;
    }
    .chip-level {
      background: linear-gradient(135deg, #eef2ff, #fdf4ff);
      color: #4f46e5;
      border: 1px solid #c7d2fe;
      font-weight: 600;
    }

    /* ── Divider line ── */
    .gradient-rule {
      height: 1px;
      background: linear-gradient(90deg, #e0e7ff, #f3e8ff, transparent);
      margin: 1.4rem 0 1.2rem;
    }

    /* ── XP bar ── */
    .xp-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;
      font-weight: 500;
      color: #94a3b8;
      margin-bottom: 0.4rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .xp-track {
      height: 6px;
      border-radius: 999px;
      background: #f1f5f9;
      overflow: hidden;
    }
    .xp-fill {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);
      background-size: 200% 100%;
      animation: flow 2.5s linear infinite;
    }
    @keyframes flow {
      0%   { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
  `],
  template: `
    <article class="profile-card">

      <!-- Banner -->
      <div class="banner">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>

      <!-- Body -->
      <div class="body">
        <div class="meta-row">

          <!-- Avatar + name block -->
          <div style="display:flex; flex-direction:column; gap:1rem;">
            <div style="display:flex; align-items:flex-end; gap:1.25rem;">

              <!-- Avatar -->
              <div class=" mt-15  avatar-ring">
                <div class="avatar-inner">
                  @if (pfp()) {
                    <img [src]="pfp()" [alt]="displayName()" style="width:100%;height:100%;object-fit:cover;" />
                  } @else {
                    <div class="monogram">
                      <span>{{ initials() }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Name + chips -->
              <div style="padding-bottom:0.15rem;">
                <p class="eyebrow">Profile</p>
                <h2 class="display-name">{{ displayName() }}</h2>
                <div class="chips">
                  <span class="chip chip-username">&#64;{{ username() }}</span>
                  <span class="chip chip-role">{{ roleLabel() }}</span>
                  <span class="chip chip-level">Lv.&nbsp;{{ level() }}</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        <!-- XP bar -->
        <div class="gradient-rule"></div>
        <div class="xp-label">
          <span>Experience</span>
          <span>{{ xp().toLocaleString() }} XP</span>
        </div>
        <div class="xp-track">
          <div class="xp-fill" [style.width]="xpPercent() + '%'"></div>
        </div>

        <!-- Badges -->
        <div class="gradient-rule"></div>
        <app-badges-display [badges]="badges()" />

      </div>
    </article>
  `
})
export class ProfileComponent {
  private readonly userContext = inject(UserContextService);
  readonly user = this.userContext.user;

  readonly displayName = computed(() => {
    const user = this.user();
    const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    return fullName || user?.username || 'Student';
  });

  readonly username  = computed(() => this.user()?.username ?? '');
  readonly roleLabel = computed(() => this.user()?.role ?? '');
  readonly level     = computed(() => this.user()?.level ?? 1);
  readonly pfp       = computed(() => this.user()?.pfp ?? undefined);
  readonly xp        = computed(() => this.user()?.xpPts ?? 0);
  readonly badges    = computed(() => this.user()?.badges ?? []);

  /** Clamp XP to a 0–100 % fill for the bar (adjust 5000 to your XP-per-level cap) */
  readonly xpPercent = computed(() => Math.min(100, (this.xp() % 5000) / 50));

  initials(): string {
    const name = this.displayName();
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }
}