import React, { useState } from 'react'
import type { Task, WeekData, TimeSlot } from '../types'
import { formatDateWithWeekday } from '../utils/date'
import TaskCard from './TaskCard'
import TaskEditor from './TaskEditor'

interface MobileDayViewProps {
  weekData: WeekData
  currentDayIndex: number
  onAddTask: (dateISO: string, task: Task) => void
  onUpdateTask: (dateISO: string, task: Task) => void
  onDeleteTask: (dateISO: string, taskId: string) => void
  onPrevDay: () => void
  onNextDay: () => void
  searchQuery: string
  todayISO?: string
}

export default function MobileDayView({
  weekData,
  currentDayIndex,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onPrevDay,
  onNextDay,
  searchQuery,
  todayISO
}: MobileDayViewProps) {
  const [editingTask, setEditingTask] = useState<{ dateISO: string; task: Task } | null>(null)
  const [addingTaskSlot, setAddingTaskSlot] = useState<{ dateISO: string; timeSlot: TimeSlot } | null>(null)

  const currentDay = weekData.days[currentDayIndex]
  if (!currentDay) return null

  const dateISO = currentDay.dateISO
  const isToday = dateISO === todayISO

  // 按时间段分组任务
  const morningTasks = currentDay.tasks.filter(t => t.timeSlot === 'morning')
  const afternoonTasks = currentDay.tasks.filter(t => t.timeSlot === 'afternoon')
  const eveningTasks = currentDay.tasks.filter(t => t.timeSlot === 'evening')

  // 搜索过滤
  const filterTasks = (tasks: Task[]) => {
    if (!searchQuery) return tasks
    const query = searchQuery.toLowerCase()
    return tasks.filter(t => t.title.toLowerCase().includes(query))
  }

  const renderTimeSlot = (title: string, icon: string, tasks: Task[], timeSlot: TimeSlot) => {
    const filteredTasks = filterTasks(tasks)
    
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-3">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h3 className="font-semibold text-base">{title}</h3>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              {filteredTasks.length}
            </span>
          </div>
          <button
            onClick={() => setAddingTaskSlot({ dateISO, timeSlot })}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-sm transition-colors"
          >
            ＋ 添加
          </button>
        </div>
        <div className="p-3 space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              {searchQuery ? '无匹配任务' : '暂无任务'}
            </div>
          ) : (
            filteredTasks.map(task => (
              <div key={task.id}>
                <TaskCard 
                  task={task}
                  onEdit={(t) => setEditingTask({ dateISO, task: t })}
                  onDelete={(taskId) => onDeleteTask(dateISO, taskId)}
                  onUpdateTask={(t) => onUpdateTask(dateISO, t)}
                />
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 日期导航 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onPrevDay}
            disabled={currentDayIndex === 0}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-center">
            <div className={`text-lg font-bold ${isToday ? 'text-indigo-600' : 'text-gray-800'}`}>
              {formatDateWithWeekday(new Date(dateISO))}
            </div>
            {isToday && (
              <div className="text-xs text-indigo-600 font-medium">今天</div>
            )}
          </div>
          
          <button
            onClick={onNextDay}
            disabled={currentDayIndex === weekData.days.length - 1}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* 日期指示器 */}
        <div className="flex justify-center gap-1 pb-2">
          {weekData.days.map((_, index) => (
            <div
              key={index}
              className={`h-1 w-8 rounded-full transition-colors ${
                index === currentDayIndex ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 时间段列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderTimeSlot('上午', '🌅', morningTasks, 'morning')}
        {renderTimeSlot('下午', '☀️', afternoonTasks, 'afternoon')}
        {renderTimeSlot('晚上', '🌙', eveningTasks, 'evening')}
      </div>

      {/* 编辑任务对话框 */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <TaskEditor
              task={editingTask.task}
              onSave={(updatedTask) => {
                onUpdateTask(editingTask.dateISO, updatedTask)
                setEditingTask(null)
              }}
              onDelete={() => {
                onDeleteTask(editingTask.dateISO, editingTask.task.id)
                setEditingTask(null)
              }}
              onCancel={() => setEditingTask(null)}
            />
          </div>
        </div>
      )}

      {/* 添加任务对话框 */}
      {addingTaskSlot && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <TaskEditor
              task={{
                id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                title: '',
                priority: 'medium',
                status: 'todo',
                timeSlot: addingTaskSlot.timeSlot,
                taskType: 'plan'
              }}
              onSave={(newTask) => {
                onAddTask(addingTaskSlot.dateISO, newTask)
                setAddingTaskSlot(null)
              }}
              onCancel={() => setAddingTaskSlot(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

