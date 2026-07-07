export const MINUTES_IN_DAY = 1440
export const TIME_GRANULARITY = 5
export const VIEW_START_MINUTES = 360 // 6:00
export const VIEW_END_MINUTES = MINUTES_IN_DAY // 24:00
export const VIEW_DURATION = VIEW_END_MINUTES - VIEW_START_MINUTES // 1080 minutes = 18 hours

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

export interface TimeRange {
  startTime: number
  endTime: number
}

export function checkOverlap(block1: TimeRange, block2: TimeRange): boolean {
  return block1.startTime < block2.endTime && block2.startTime < block1.endTime
}

export function findOverlappingBlock(
  blocks: TimeRange[],
  newBlock: TimeRange,
  excludeIndex?: number
): number {
  return blocks.findIndex((block, index) => {
    if (excludeIndex !== undefined && index === excludeIndex) return false
    return checkOverlap(block, newBlock)
  })
}

export function snapToGrid(minutes: number, granularity: number = TIME_GRANULARITY): number {
  return Math.max(0, Math.min(MINUTES_IN_DAY, roundToGranularity(minutes, granularity)))
}

export function getDayName(date: Date): string {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[date.getDay()]
}

export function getDayShortName(date: Date): string {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return days[date.getDay()]
}

export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + weeks * 7)
  return d
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function getMonthDates(date: Date): Date[] {
  const result: Date[] = []
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDayOfWeek = firstDay.getDay()

  const calendarStart = new Date(firstDay)
  calendarStart.setDate(1 - startDayOfWeek)

  for (let i = 0; i < 42; i++) {
    const d = new Date(calendarStart)
    d.setDate(calendarStart.getDate() + i)
    result.push(d)
  }

  return result
}

export function startOfMonth(date: Date): Date {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfMonth(date: Date): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + 1)
  d.setDate(0)
  d.setHours(23, 59, 59, 999)
  return d
}
