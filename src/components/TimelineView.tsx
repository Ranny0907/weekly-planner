import React from 'react'
import type { Task, WeekData, TimeSlot } from '../types'
import TimelineDayColumn from './TimelineDayColumn'

interface TimelineViewProps {
  weekData: WeekData
  onAddTask: (dateISO: string, task: Task) => void
  onUpdateTask: (dateISO: string, task: Task) => void
  onDeleteTask: (dateISO: string, taskId: string) => void
  onMoveTask: (fromDateISO: string, toDateISO: string, taskId: string, timeSlot: TimeSlot) => void
  onReorderTasks: (dateISO: string, timeSlot: TimeSlot, taskIds: string[]) => void
  searchQuery: string
  todayISO?: string
}

// 生成时间刻度：只包含有效时间段，每30分钟一个刻度
// 上午：8:30-12:00，下午：14:00-19:00，晚上：21:00-22:30
const generateTimeSlots = () => {
  const slots: { time: string; segment: 'morning' | 'afternoon' | 'evening' }[] = []
  
  // 上午时间段：8:30-12:00
  const morningStart = 8.5 // 8:30
  const morningEnd = 12 // 12:00
  for (let h = morningStart; h <= morningEnd; h += 0.5) {
    const hour = Math.floor(h)
    const minute = (h % 1 === 0) ? '00' : '30'
    slots.push({ time: `${hour.toString().padStart(2, '0')}:${minute}`, segment: 'morning' })
  }
  
  // 下午时间段：14:00-19:00
  const afternoonStart = 14
  const afternoonEnd = 19
  for (let h = afternoonStart; h <= afternoonEnd; h += 0.5) {
    const hour = Math.floor(h)
    const minute = (h % 1 === 0) ? '00' : '30'
    slots.push({ time: `${hour.toString().padStart(2, '0')}:${minute}`, segment: 'afternoon' })
  }
  
  // 晚上时间段：21:00-22:30
  const eveningStart = 21
  const eveningEnd = 22.5
  for (let h = eveningStart; h <= eveningEnd; h += 0.5) {
    const hour = Math.floor(h)
    const minute = (h % 1 === 0) ? '00' : '30'
    slots.push({ time: `${hour.toString().padStart(2, '0')}:${minute}`, segment: 'evening' })
  }
  
  return slots
}

export default function TimelineView({ 
  weekData, 
  onAddTask, 
  onUpdateTask, 
  onDeleteTask, 
  onMoveTask, 
  onReorderTasks, 
  searchQuery, 
  todayISO 
}: TimelineViewProps) {
  const timeSlots = generateTimeSlots()

  return (
    <div className="flex h-full bg-white rounded-xl shadow-sm overflow-hidden">
      {/* 左侧时间轴 */}
      <div className="w-20 flex-shrink-0 border-r border-gray-200 bg-gray-50">
        <div className="h-16 border-b border-gray-200 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-500">时间</span>
        </div>
        <div className="relative">
          {timeSlots.map((slot, index) => {
            const isSegmentStart = index === 0 || slot.segment !== timeSlots[index - 1].segment
            return (
              <div 
                key={`${slot.time}-${index}`}
                className="relative"
                style={{ height: '48px' }}
              >
                {/* 刻度线和时间标注（在顶部） */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-center -translate-y-1/2">
                  <span className={`text-xs font-medium px-1 rounded ${
                    isSegmentStart 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'bg-white text-gray-600'
                  }`}>
                    {slot.time}
                  </span>
                </div>
                {/* 时间段分隔线 */}
                {isSegmentStart && index > 0 && (
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-gray-300 to-transparent"></div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 右侧日期列 */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex min-w-max">
          {weekData.days.map((day) => {
            const filteredTasks = searchQuery.trim()
              ? day.tasks.filter(t => t.title.toLowerCase().includes(searchQuery.trim().toLowerCase()))
              : day.tasks
            
            return (
              <TimelineDayColumn
                key={day.dateISO}
                dateISO={day.dateISO}
                tasks={filteredTasks}
                timeSlots={timeSlots}
                onAddTask={(task) => onAddTask(day.dateISO, task)}
                onUpdateTask={(task) => onUpdateTask(day.dateISO, task)}
                onDeleteTask={(taskId) => onDeleteTask(day.dateISO, taskId)}
                onDropTaskFromId={(taskId, timeSlot) => {
                  const fromDate = weekData.days.find(d => d.tasks.some(t => t.id === taskId))?.dateISO
                  if (fromDate) {
                    onMoveTask(fromDate, day.dateISO, taskId, timeSlot)
                  }
                }}
                isToday={todayISO === day.dateISO}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function findTaskDate(weekData: WeekData, taskId: string): string | undefined {
  for (const day of weekData.days) {
    if (day.tasks.some(t => t.id === taskId)) return day.dateISO
  }
}

