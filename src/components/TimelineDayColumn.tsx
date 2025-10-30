import React, { useState } from 'react'
import type { Task, TimeSlot } from '../types'
import TaskCard from './TaskCard'
import TaskEditor from './TaskEditor'
import { formatDate, getWeekdayName, isChineseHoliday } from '../utils/date'

interface TimelineDayColumnProps {
  dateISO: string
  tasks: Task[]
  timeSlots: { time: string; segment: 'morning' | 'afternoon' | 'evening' }[]
  onAddTask: (task: Task) => void
  onUpdateTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onDropTaskFromId: (taskId: string, timeSlot: TimeSlot) => void
  isToday?: boolean
}

export default function TimelineDayColumn({
  dateISO,
  tasks,
  timeSlots,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onDropTaskFromId,
  isToday = false
}: TimelineDayColumnProps) {
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [openSegments, setOpenSegments] = useState<Record<string, boolean>>({})
  const [editorInitial, setEditorInitial] = useState<Partial<Task>>({ timeSlot: 'morning' })

  const date = new Date(dateISO)
  const holiday = isChineseHoliday(date)
  const actualWeekday = getWeekdayName(date)

  // 打开编辑器的包装函数
  const handleEdit = (task: Task) => {
    setEditorInitial(task)
    setEditing(task)
  }

  // 将时间（小时）转换为时间轴刻度索引
  const timeToSlotIndex = (timeInHours: number): number => {
    // 上午时间段：8:30-12:00（索引0-7）
    if (timeInHours >= 8.5 && timeInHours <= 12) {
      return (timeInHours - 8.5) / 0.5
    }
    // 下午时间段：14:00-19:00（索引8-18）
    else if (timeInHours >= 14 && timeInHours <= 19) {
      return 8 + (timeInHours - 14) / 0.5
    }
    // 晚上时间段：21:00-22:30（索引19-22）
    else if (timeInHours >= 21 && timeInHours <= 22.5) {
      return 19 + (timeInHours - 21) / 0.5
    }
    return -1
  }

  // 计算任务在时间轴上的位置（基于分段时间轴）
  const getTaskPosition = (task: Task) => {
    if (!task.startTime) return null
    
    const [hStr, mStr] = task.startTime.split(':')
    const hour = Number(hStr || '0')
    const minute = Number(mStr || '0')
    const startTimeInHours = hour + minute / 60
    
    const startIndex = timeToSlotIndex(startTimeInHours)
    if (startIndex < 0) return null // 不在有效时间段内
    
    const top = startIndex * 48
    
    // 计算高度（如果有结束时间）- 基于刻度索引差值
    let height = 48 // 默认1个刻度（30分钟）
    if (task.endTime) {
      const [ehStr, emStr] = task.endTime.split(':')
      const endHour = Number(ehStr || '0')
      const endMinute = Number(emStr || '0')
      const endTimeInHours = endHour + endMinute / 60
      
      const endIndex = timeToSlotIndex(endTimeInHours)
      
      if (endIndex >= startIndex) {
        // 使用索引差 * 48px（每个刻度的精确高度）
        height = (endIndex - startIndex) * 48
      } else {
        // 如果结束时间不在有效时间段或跨时间段，截断到当前时间段末尾
        if (startTimeInHours < 12) {
          // 上午任务，截断到12:00（索引7）
          height = (8 - startIndex) * 48
        } else if (startTimeInHours < 19) {
          // 下午任务，截断到19:00（索引18）
          height = (19 - startIndex) * 48
        } else {
          // 晚上任务，截断到22:30（索引22）
          height = (23 - startIndex) * 48
        }
      }
      
      // 至少显示半个刻度（24px）
      height = Math.max(24, height)
    }
    
    return { top, height }
  }

  // 分类任务
  const timedTasks = tasks.filter(t => t.startTime).sort((a, b) => a.startTime!.localeCompare(b.startTime!))
  const positionedTimed = timedTasks
    .map(task => {
      const pos = getTaskPosition(task)
      if (!pos) return null
      return { task, top: pos.top, height: pos.height }
    })
    .filter(Boolean) as { task: Task; top: number; height: number }[]
  const tasksByTimeSlot = tasks
    .filter(t => !t.startTime && t.timeSlot)
    .reduce((acc, task) => {
      const key = (task.timeSlot || 'morning') as string
      if (!acc[key]) acc[key] = []
      acc[key].push(task)
      return acc
    }, {} as Record<string, Task[]>)
  const noTimeNoSlotTasks = tasks.filter(t => !t.startTime && !t.timeSlot)
  
  // 时间段配置（用于无具体时间的任务）
  const timeSlotConfig = {
    morning: { 
      label: '上午', 
      time: '8:30-12:00', 
      color: 'bg-orange-100/70 border-l-4 border-orange-500', 
      startIndex: 0,  // 在时间轴上的起始索引
      endIndex: 7     // 结束索引
    },
    afternoon: { 
      label: '下午', 
      time: '14:00-19:00', 
      color: 'bg-blue-100/70 border-l-4 border-blue-500', 
      startIndex: 8,
      endIndex: 18    // 更新为19:00
    },
    evening: { 
      label: '晚上', 
      time: '21:00-22:30', 
      color: 'bg-purple-100/70 border-l-4 border-purple-500', 
      startIndex: 19,
      endIndex: 22
    }
  }

  // 是否存在任何“仅时间段”的任务，用于决定是否预留右侧列表栏
  const hasAnySlotTasks = Object.values(tasksByTimeSlot).some(arr => arr && arr.length > 0)

  return (
    <div className="flex-1 min-w-[320px] border-r border-gray-200 last:border-r-0">
      {/* 日期头部 */}
      <div className={`h-16 border-b border-gray-200 px-3 py-2 sticky top-0 z-10 bg-white ${
        holiday.isHoliday ? 'bg-red-50' : ''
      } ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-600">{actualWeekday}</span>
            {isToday && (
              <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                今
              </span>
            )}
          </div>
          <span className="text-sm font-semibold text-gray-800">{formatDate(date)}</span>
          {holiday.isHoliday && (
            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full mt-0.5">
              {holiday.name}
            </span>
          )}
        </div>
      </div>

      {/* 时间轴区域 */}
      <div className="relative" style={{ height: `${timeSlots.length * 48}px` }}>
        {/* 时间格子背景和刻度线 */}
        {timeSlots.map((slot, index) => {
          const prev = index > 0 ? timeSlots[index - 1] : undefined
          const isSegmentStart = index === 0 || slot.segment !== prev?.segment
          return (
            <div key={`${slot.time}-${index}`}>
              {/* 背景色（时间段颜色） */}
              <div
                className={`absolute left-0 right-0 ${
                  slot.segment === 'morning' ? 'bg-orange-50/30' :
                  slot.segment === 'afternoon' ? 'bg-blue-50/30' :
                  'bg-purple-50/30'
                }`}
                style={{ 
                  top: `${index * 48}px`, 
                  height: '48px',
                  zIndex: 0
                }}
              />
              {/* 刻度线（在顶部，虚线样式） */}
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{ 
                  top: `${index * 48}px`,
                  zIndex: 1,
                  borderTop: isSegmentStart 
                    ? '2px solid rgba(100, 116, 139, 0.3)' 
                    : '1px dashed rgba(203, 213, 225, 0.5)'
                }}
              />
            </div>
          )
        })}

        {/* 时间段标记和无具体时间的任务 */}
        {Object.entries(timeSlotConfig).map(([slot, config]) => {
          const slotTasks = tasksByTimeSlot[slot] || []
          // 如果这个时间段没有任务，不显示
          if (slotTasks.length === 0) return null
          
          const topPosition = config.startIndex * 48
          const height = (config.endIndex - config.startIndex + 1) * 48
          
          // 始终显示在右侧50%的位置（保持左右对称布局）
          // 右侧任务栏模式：显示完整任务卡片
          return (
            <div
              key={slot}
              className={`absolute ${config.color} p-2 space-y-2 overflow-y-auto rounded-l-lg shadow-lg border-l-4`}
              style={{
                top: `${topPosition}px`,
                height: `${height}px`,
                right: '0px',
                width: '50%',
                zIndex: 25,
                borderLeftColor: slot === 'morning' ? '#f97316' : slot === 'afternoon' ? '#3b82f6' : '#a855f7'
              }}
            >
              <div className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1 bg-white/95 p-1.5 rounded shadow-sm sticky top-0 z-10">
                <span>{config.label}</span>
                <span className="text-gray-500 font-normal text-[10px]">无具体时间</span>
                <span className="bg-gray-200 px-1.5 py-0.5 rounded-full text-gray-700 ml-auto text-[10px]">{slotTasks.length}</span>
              </div>
              {slotTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={onDeleteTask}
                  onUpdateTask={onUpdateTask}
                />
              ))}
            </div>
          )
        })}

        {/* 带具体时间的任务（显示在最上层） - 支持并排显示重叠任务 */}
        {(() => {
          type Positioned = { task: Task; top: number; height: number }
          type LaidOut = Positioned & { left: number; width: number }

          const positioned: Positioned[] = timedTasks.map(task => {
            const pos = getTaskPosition(task)
            return { task, top: pos?.top ?? 0, height: pos?.height ?? 48 }
          }).sort((a, b) => a.top - b.top)

          // 将重叠的任务分成簇
          const clusters: Positioned[][] = []
          let current: Positioned[] = []
          let currentMaxBottom = -1
          for (const p of positioned) {
            if (current.length === 0 || p.top < currentMaxBottom) {
              current.push(p)
              currentMaxBottom = Math.max(currentMaxBottom, p.top + p.height)
            } else {
              clusters.push(current)
              current = [p]
              currentMaxBottom = p.top + p.height
            }
          }
          if (current.length > 0) clusters.push(current)

          const laidOut: LaidOut[] = []

          for (const cluster of clusters) {
            // 列排布：贪心把事件放到第一个不冲突的列
            const columns: Positioned[][] = []
            const colBottoms: number[] = []
          for (const p of cluster) {
              let placed = false
              for (let i = 0; i < columns.length; i++) {
                const bottomVal = typeof colBottoms[i] === 'number' ? (colBottoms[i] as number) : 0
                if (p.top >= bottomVal - 1) { // 允许1px误差
                  columns[i]!.push(p)
                  const candidate = p.top + p.height
                  colBottoms[i] = Math.max(bottomVal || 0, candidate)
                  placed = true
                  break
                }
              }
              if (!placed) {
                columns.push([p])
                colBottoms.push(p.top + p.height)
              }
            }

            const cols = Math.max(1, columns.length)
            const width = 100 / cols
            columns.forEach((col, colIndex) => {
              col.forEach(p => {
                laidOut.push({ ...p, left: colIndex * width, width })
              })
            })
          }

          return laidOut.map(({ task, top, height, left, width }) => {
            // 左侧始终占50%（与右侧对称）
            const availableWidth = 50
            
            return (
              <div
                key={task.id}
                className="absolute z-30 group/task"
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  left: `calc(${left * availableWidth / 100}% + 4px)`,
                  width: `calc(${width * availableWidth / 100}% - 8px)`
                }}
              >
                {/* 紧凑模式：默认只显示标题和状态圆圈 */}
                <div className="h-full group-hover/task:hidden overflow-hidden">
                  <div className={`h-full rounded-lg border-2 p-2 flex items-center gap-2 ${
                    task.taskType === 'meeting' ? 'bg-purple-50 border-purple-300' :
                    task.taskType === 'course' ? 'bg-green-50 border-green-300' :
                    task.priority === 'high' ? 'bg-blue-100 border-blue-500' :
                    task.priority === 'medium' ? 'bg-blue-50 border-blue-300' :
                    'bg-blue-50/50 border-blue-200'
                  }`}>
                    <button
                      onClick={() => {
                        const statusConfig = {
                          todo: 'inprogress' as const,
                          inprogress: 'done' as const,
                          done: 'todo' as const
                        }
                        onUpdateTask({ ...task, status: statusConfig[task.status] })
                      }}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                        task.status === 'todo' ? 'bg-gray-400' :
                        task.status === 'inprogress' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                    >
                      {task.status === 'todo' ? '●' : task.status === 'inprogress' ? '▲' : '✓'}
                    </button>
                    <div className="flex-1 text-sm font-medium text-gray-800 truncate">
                      {task.title}
                    </div>
                  </div>
                </div>
                
                {/* 完整模式：hover时显示所有信息 */}
                <div className="hidden group-hover/task:block absolute top-0 left-0 right-0 z-50 shadow-xl">
                  <TaskCard
                    task={task}
                    onEdit={handleEdit}
                    onDelete={onDeleteTask}
                    onUpdateTask={onUpdateTask}
                  />
                </div>
              </div>
            )
          })
        })()}
      </div>

      {/* 既没有具体时间也没有时间段的任务 */}
      {noTimeNoSlotTasks.length > 0 && (
        <div className="border-t-2 border-dashed border-red-300 bg-gradient-to-b from-red-50 to-red-100 p-3 space-y-2 min-h-[120px]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">⚠️ 未设置时间段</span>
            <span className="text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded-full font-medium">
              {noTimeNoSlotTasks.length}
            </span>
          </div>
          {noTimeNoSlotTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEdit}
              onDelete={onDeleteTask}
              onUpdateTask={onUpdateTask}
            />
          ))}
        </div>
      )}

      {/* 添加按钮 */}
      <div className="p-2 border-t border-gray-200 bg-white sticky bottom-0">
        {!adding && !editing && (
          <button
            className="w-full py-2 text-xs text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-dashed border-gray-300 hover:border-indigo-300"
            onClick={() => {
              setEditorInitial({ timeSlot: 'morning' })
              setAdding(true)
            }}
          >
            + 添加任务
          </button>
        )}
      </div>

      {/* 编辑器弹窗 */}
      {(adding || editing) && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/30"
          onClick={(e) => {
            // 只在点击背景（而非内容）时关闭
            if (e.target === e.currentTarget) {
              setAdding(false)
              setEditing(null)
            }
          }}
        >
          {/* 弹窗内容 */}
          <div 
            className="relative bg-white rounded-lg shadow-2xl max-w-md w-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <TaskEditor
              initial={editorInitial}
              onCancel={() => {
                setAdding(false)
                setEditing(null)
              }}
              onSave={(task) => {
                if (editing) {
                  onUpdateTask(task)
                } else {
                  onAddTask(task)
                }
                setAdding(false)
                setEditing(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

