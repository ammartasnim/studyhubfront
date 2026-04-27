import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeResDto } from '../../api-generated/model/badgeResDto';

@Component({
  selector: 'app-badges-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="badges-container">
      <p class="eyebrow mb-3">Badges Earned</p>
      
      @if (hasBadges()) {
        <div class="badges-grid">
          @for (badge of badges(); track badge.id) {
            <div class="badge-item" [title]="getBadgeTooltip(badge.type || '')">
              <div class="badge-icon">{{ getBadgeEmoji(badge.type || '') }}</div>
              <p class="badge-name">{{ getBadgeName(badge.type || '') }}</p>
            </div>
          }
        </div>
      } @else {
        <p class="empty-state">No badges earned yet. Keep learning!</p>
      }
    </div>
  `,
  styles: [`
    .badges-container {
      margin-top: 1.5rem;
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
      margin: 0;
    }

    .mb-3 { margin-bottom: 0.75rem; }

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

    .badge-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(99, 102, 241, 0.12);
      border-color: #d8b4fe;
    }

    .badge-icon {
      font-size: 2rem;
      line-height: 1;
    }

    .badge-name {
      font-size: 0.75rem;
      font-weight: 600;
      text-align: center;
      color: #6b7280;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .empty-state {
      color: #9ca3af;
      font-size: 0.875rem;
      text-align: center;
      padding: 1rem;
      font-style: italic;
    }
  `]
})
export class BadgesDisplayComponent {
  readonly badges = input<BadgeResDto[] | undefined>();
  readonly hasBadges = computed(() => (this.badges()?.length ?? 0) > 0);

  getBadgeEmoji(type: string): string {
    const emojiMap: { [key: string]: string } = {
      'BEGINNER': '🌱',
      'LEARNER': '📚',
      'EXPLORER': '🗺️',
      'CONTRIBUTOR': '💡',
      'HELPER': '🤝',
      'CONSISTENT': '🔥',
      'COLLABORATOR': '👥',
      'ACHIEVER': '🏆',
      'MENTOR': '🎓',
      'LEGEND': '⭐'
    };
    return emojiMap[type] || '🎖️';
  }

  getBadgeName(type: string): string {
    const nameMap: { [key: string]: string } = {
      'BEGINNER': 'Beginner',
      'LEARNER': 'Learner',
      'EXPLORER': 'Explorer',
      'CONTRIBUTOR': 'Contributor',
      'HELPER': 'Helper',
      'CONSISTENT': 'Consistent',
      'COLLABORATOR': 'Collaborator',
      'ACHIEVER': 'Achiever',
      'MENTOR': 'Mentor',
      'LEGEND': 'Legend'
    };
    return nameMap[type] || 'Badge';
  }

  getBadgeTooltip(type: string): string {
    const tooltips: { [key: string]: string } = {
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
    return tooltips[type] || 'Badge';
  }
}
