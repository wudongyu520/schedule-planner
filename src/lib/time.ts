export const MINUTES_IN_DAY = 1440
export const TIME_GRANULARITY = 5

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function getTopPercent(startMinutes: number): number {
  return (startMinutes / MINUTES_IN_DAY) * 100
}

export function getHeightPercent(startMinutes: number, endMinutes: number): number {
  return ((endMinutes - startMinutes) / MINUTES_IN_DAY) * 100
}

export function getNowMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

export function roundToGranularity(minutes: number, granularity: number = TIME_GRANULARITY): number {
  return Math.round(minutes / granularity) * granularity
}

export function getWeekDates(date: Date): Date[] {
  const result: Date[] = []
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)

  for (let i = 0; i < 7; i++) {
    const date = new Date(d)
    date.setDate(d.getDate() + i)
    result.push(date)
  }

  return result
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5)
}
