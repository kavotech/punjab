import type { User } from '../types'

/* Private, greeting-only display names - deliberately not stored in
   admin_staff.name, which every other admin sees (as "System Developer")
   in Users & Team, activity logs, "invited by", etc. Only ever resolved for
   the signed-in account's own session (its boot screen and its own Home
   greeting), so the real name is never shown to anyone else. */
const PRIVATE_GREETING_NAMES: Record<string, string> = {
  'info@kavotech.uk': 'Oliver Alinaitwe',
}

export function greetingNameFor(user: Pick<User, 'email' | 'displayName'>): string {
  return PRIVATE_GREETING_NAMES[user.email.toLowerCase()] ?? user.displayName
}
