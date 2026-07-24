export type ExpirationUrgency = 'none' | 'expired' | 'soon' | 'ok'

const SOON_THRESHOLD_DAYS = 7

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function getExpirationUrgency(dateStr: string | null): ExpirationUrgency {
  if (!dateStr) return 'none'
  const days = daysUntil(dateStr)
  if (days < 0) return 'expired'
  if (days <= SOON_THRESHOLD_DAYS) return 'soon'
  return 'ok'
}

export function formatExpirationDetail(dateStr: string): string {
  const days = daysUntil(dateStr)
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`
  if (days === 0) return 'Expires today'
  return `Expires in ${days} day${days === 1 ? '' : 's'}`
}

export const EXPIRATION_URGENCY_CLASSNAME: Record<ExpirationUrgency, string> = {
  none: 'text-muted-foreground',
  expired: 'text-destructive font-medium',
  soon: 'text-amber-600 dark:text-amber-500 font-medium',
  ok: 'text-foreground',
}
