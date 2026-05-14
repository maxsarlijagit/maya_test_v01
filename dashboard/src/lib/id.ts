export function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
