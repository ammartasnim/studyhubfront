import { Component, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BadgeUI {
  id?: number;
  type?: string;
  name?: string;
  description?: string;
  earnedAt?: string;
}

@Component({
  selector: 'app-badges-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="badges-container">
      <div class="flex items-center justify-between mb-3">
        <p class="eyebrow">Badges Earned</p>
        @if ((badges()?.length ?? 0) > 1) {
          <button class="view-all-btn" (click)="modalOpen.set(true)">View all ({{ badges()!.length }})</button>
        }
      </div>

      @if (hasBadges()) {
        <!-- Preview: only last badge -->
        <div class="badges-grid">
          <div class="badge-item" [title]="getBadgeTooltip(lastBadge()!.type || '')">
            <div class="badge-icon">{{ getBadgeEmoji(lastBadge()!.type || '') }}</div>
            <p class="badge-name">{{ getBadgeName(lastBadge()!.type || '') }}</p>
            
          </div>
        </div>
      } @else {
        <p class="empty-state">No badges earned yet. Keep learning!</p>
      }
    </div>

    <!-- Modal -->
    @if (modalOpen()) {
      <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center" (click)="modalOpen.set(false)">
        <div class="bg-white rounded-2xl w-[min(520px,92vw)] shadow-2xl overflow-hidden" (click)="$event.stopPropagation()">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-lg font-bold text-slate-900">All Badges</h3>
            <button class="text-slate-400 hover:text-slate-600 text-xl" (click)="modalOpen.set(false)">✕</button>
          </div>
          <div class="p-6">
            <div class="badges-grid">
              @for (badge of badges(); track badge.id) {
                  <div>
                    @if (badge.earnedAt) {
                      <p class="badge-date">{{ badge.earnedAt | date:'MMM d, y' }}</p>

                    }
                    <div class="badge-item" [title]="getBadgeTooltip(badge.type || '')">
                      <div class="badge-icon">{{ getBadgeEmoji(badge.type || '') }}</div>
                      <p class="badge-name">{{ getBadgeName(badge.type || '') }}</p>
                    </div>
                  </div>
                }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .badges-container { margin-top: 1.5rem; }
    .eyebrow {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      background: linear-gradient(90deg, #6366f1, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
    }
    .view-all-btn {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6366f1;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
    }
    .view-all-btn:hover { color: #4f46e5; }
    .badges-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 1rem;
    }
    .badge-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 1rem;
      background: linear-gradient(135deg, #f0f4ff, #faf5ff);
      border: 1px solid #e9d5ff;
      transition: all 0.2s ease;
      cursor: pointer;
    }
      .badge-desc {
  font-size: 0.6rem;
  color: #a78bfa;
  margin: 0;
  text-align: center;
  font-style: italic;
  line-height: 1.3;
}

    .badge-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(99, 102, 241, 0.12);
      border-color: #d8b4fe;
    }
    .badge-icon { font-size: 2rem; line-height: 1; }
    .badge-name {
      font-size: 0.75rem;
      font-weight: 600;
      text-align: center;
      color: #6b7280;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
   .badge-date { 
  font-size: 0.6rem; 
  background: linear-gradient(90deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0; 
  text-align: center;
  font-weight: 600;
}
    .empty-state { color: #9ca3af; font-size: 0.875rem; text-align: center; padding: 1rem; font-style: italic; }
  `]
})
export class BadgesDisplayComponent {
  readonly badges    = input<BadgeUI[] | undefined>();
  readonly hasBadges = computed(() => (this.badges()?.length ?? 0) > 0);
readonly lastBadge = computed(() => {
  const list = this.badges();
  console.log('badges:', list);
  if (!list || list.length === 0) return null;
  return list[list.length - 1];
});

  readonly modalOpen = signal(false);

  getBadgeEmoji(type: string): string {
    const map: { [key: string]: string } = {
      'BEGINNER': '🌱', 'LEARNER': '📚', 'EXPLORER': '🗺️',
      'CONTRIBUTOR': '💡', 'HELPER': '🤝', 'CONSISTENT': '🔥',
      'COLLABORATOR': '👥', 'ACHIEVER': '🏆', 'MENTOR': '🎓', 'LEGEND': '⭐'
    };
    return map[type] || '🎖️';
  }

  getBadgeName(type: string): string {
    const map: { [key: string]: string } = {
      'BEGINNER': 'Beginner', 'LEARNER': 'Learner', 'EXPLORER': 'Explorer',
      'CONTRIBUTOR': 'Contributor', 'HELPER': 'Helper', 'CONSISTENT': 'Consistent',
      'COLLABORATOR': 'Collaborator', 'ACHIEVER': 'Achiever', 'MENTOR': 'Mentor', 'LEGEND': 'Legend'
    };
    return map[type] || 'Badge';
  }

  getBadgeTooltip(type: string): string {
    const map: { [key: string]: string } = {
      'BEGINNER': 'Welcome to StudyHub! Take your first steps.',
      'LEARNER': 'You\'re actively learning and growing.',
      'EXPLORER': 'Discover new communities and content.',
      'CONTRIBUTOR': 'Share your knowledge with others.',
      'HELPER': 'Help and support community members.',
      'CONSISTENT': 'Maintain a streak of daily activity.',
      'COLLABORATOR': 'Work together with other learners.',
      'ACHIEVER': 'Reach significant milestones.',
      'MENTOR': 'Guide and mentor other students.',
      'LEGEND': 'The ultimate achievement on StudyHub.'
    };
    return map[type] || 'Badge';
  }
}