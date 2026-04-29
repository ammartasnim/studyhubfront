/**
 * Focus Session UI Model - Clean interface for components
 */
export interface FocusSessionUI {
  id: number;
  userId: number;
  title: string;
  timer: string; // formatted time like "00:25:00"
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED'; // Match your Java Enum
  remainingSeconds: number; // Changed from 'integer' to 'number'
  lastUpdated?: string; // ISO string from LocalDateTime
  displayDuration?: string; // same as timer
}
