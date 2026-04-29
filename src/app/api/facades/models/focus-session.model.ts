/**
 * Focus Session UI Model - Clean interface for components
 */
export interface FocusSessionUI {
  id: number;
  userId: number;
  title: string;
  timer: string; // formatted time like "00:25:00"
  displayDuration?: string; // same as timer
}
