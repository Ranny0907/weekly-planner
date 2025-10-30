export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  // 让周一成为0，周日成为6
  const day = (d.getDay() + 6) % 7 // Monday=0, Sunday=6
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + weeks * 7)
  return d
}

export function formatDate(date: Date): string {
  const m = date.getMonth() + 1
  const day = date.getDate()
  return `${m}月${day}日`
}

export function formatDateWithWeekday(date: Date): string {
  const m = date.getMonth() + 1
  const day = date.getDate()
  const weekday = getWeekdayName(date)
  return `${m}月${day}日 ${weekday}`
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function getWeekRangeLabel(weekStart: Date): string {
  const startLabel = formatDate(weekStart)
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  const endLabel = formatDate(end)
  return `${startLabel}—${endLabel}`
}

export function getISOWeekNumber(date: Date): number {
  // ISO week number: Thursday-based
  const target = new Date(date.valueOf())
  const dayNr = (date.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const firstThursdayDayNr = (firstThursday.getDay() + 6) % 7
  firstThursday.setDate(firstThursday.getDate() - firstThursdayDayNr + 3)
  const diff = target.getTime() - firstThursday.getTime()
  return 1 + Math.round(diff / (7 * 24 * 3600 * 1000))
}

export function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
}

// 中国节假日检测（2024-2025年）
export function isChineseHoliday(date: Date): { isHoliday: boolean; name?: string } {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  // 2024年节假日
  const holidays2024: { [key: string]: string } = {
    '1-1': '元旦',
    '2-10': '春节', '2-11': '春节', '2-12': '春节', '2-13': '春节', '2-14': '春节', '2-15': '春节', '2-16': '春节', '2-17': '春节',
    '4-4': '清明节', '4-5': '清明节', '4-6': '清明节',
    '5-1': '劳动节', '5-2': '劳动节', '5-3': '劳动节', '5-4': '劳动节', '5-5': '劳动节',
    '6-10': '端午节',
    '9-15': '中秋节', '9-16': '中秋节', '9-17': '中秋节',
    '10-1': '国庆节', '10-2': '国庆节', '10-3': '国庆节', '10-4': '国庆节', '10-5': '国庆节', '10-6': '国庆节', '10-7': '国庆节'
  }
  
  // 2025年节假日
  const holidays2025: { [key: string]: string } = {
    '1-1': '元旦',
    '1-28': '春节', '1-29': '春节', '1-30': '春节', '1-31': '春节', '2-1': '春节', '2-2': '春节', '2-3': '春节', '2-4': '春节',
    '4-4': '清明节', '4-5': '清明节', '4-6': '清明节',
    '5-1': '劳动节', '5-2': '劳动节', '5-3': '劳动节', '5-4': '劳动节', '5-5': '劳动节',
    '5-31': '端午节', '6-1': '端午节', '6-2': '端午节',
    '10-1': '国庆节', '10-2': '国庆节', '10-3': '国庆节', '10-4': '国庆节', '10-5': '国庆节', '10-6': '国庆节', '10-7': '国庆节', '10-8': '国庆节'
  }
  
  // 2026年节假日
  const holidays2026: { [key: string]: string } = {
    '1-1': '元旦', '1-2': '元旦', '1-3': '元旦',
    '2-16': '春节', '2-17': '春节', '2-18': '春节', '2-19': '春节', '2-20': '春节', '2-21': '春节', '2-22': '春节', '2-23': '春节',
    '4-4': '清明节', '4-5': '清明节', '4-6': '清明节',
    '5-1': '劳动节', '5-2': '劳动节', '5-3': '劳动节', '5-4': '劳动节', '5-5': '劳动节',
    '6-19': '端午节', '6-20': '端午节', '6-21': '端午节',
    '10-1': '国庆节', '10-2': '国庆节', '10-3': '国庆节', '10-4': '国庆节', '10-5': '国庆节', '10-6': '国庆节', '10-7': '国庆节', '10-8': '国庆节'
  }
  
  const key = `${month}-${day}`
  
  if (year === 2024 && holidays2024[key]) {
    return { isHoliday: true, name: holidays2024[key] }
  }
  
  if (year === 2025 && holidays2025[key]) {
    return { isHoliday: true, name: holidays2025[key] }
  }
  
  if (year === 2026 && holidays2026[key]) {
    return { isHoliday: true, name: holidays2026[key] }
  }
  
  return { isHoliday: false }
}

// 获取星期几的中文名称
export function getWeekdayName(date: Date): string {
  const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  // 将JavaScript的getDay()结果转换为周一到周日的索引
  // 周日(0) -> 6, 周一(1) -> 0, 周二(2) -> 1, ..., 周六(6) -> 5
  const dayIndex = (date.getDay() + 6) % 7
  return weekdays[dayIndex] || '周一'
}

