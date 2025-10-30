export type Priority = 'high' | 'medium' | 'low'
export type Status = 'todo' | 'inprogress' | 'done'
export type TimeSlot = 'morning' | 'afternoon' | 'evening'
export type TaskType = 'plan' | 'meeting' | 'course' // 计划、会议、课程
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0=周一, 1=周二, ..., 6=周日

export interface Task {
  id: string
  title: string
  priority: Priority
  status: Status
  timeSlot: TimeSlot
  startTime?: string // HH:MM format
  endTime?: string   // HH:MM format
  isFlexible?: boolean // 是否为灵活时间任务
  notes?: string
  templateId?: string // 关联的模板ID，用于同步更新
  taskType?: TaskType // 任务类型：计划、会议、课程
  isRecurring?: boolean // 是否每周重复
}

export interface DayData {
  dateISO: string // YYYY-MM-DD
  tasks: Task[]
}

export interface WeekData {
  weekStartISO: string // Monday date ISO
  days: DayData[] // length 7
}

export interface TaskTemplate {
  id: string
  title: string
  priority: Priority
  timeSlot: TimeSlot
  startTime?: string
  endTime?: string
  notes?: string
  taskType?: TaskType // 任务类型
  isRecurring?: boolean // 是否每周重复
  weekdays?: Weekday[] // 周几（可多选），用于会议和课程
}

