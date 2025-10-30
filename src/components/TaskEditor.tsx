import React, { useEffect, useState } from 'react'
import type { Task, Priority, Status, TimeSlot, TaskType } from '../types'

interface TaskEditorProps {
  initial?: Partial<Task>
  onCancel: () => void
  onSave: (task: Task) => void
}

export default function TaskEditor({ initial, onCancel, onSave }: TaskEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'medium')
  const [status, setStatus] = useState<Status>(initial?.status ?? 'todo')
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(initial?.timeSlot ?? 'morning')
  const [startTime, setStartTime] = useState(initial?.startTime ?? '')
  const [endTime, setEndTime] = useState(initial?.endTime ?? '')
  const [isFlexible, setIsFlexible] = useState(initial?.isFlexible ?? false)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [taskType, setTaskType] = useState<TaskType>(initial?.taskType ?? 'plan')
  const [isRecurring, setIsRecurring] = useState(initial?.isRecurring ?? false)

  useEffect(() => {
    setTitle(initial?.title ?? '')
    setPriority(initial?.priority ?? 'medium')
    setStatus(initial?.status ?? 'todo')
    setTimeSlot(initial?.timeSlot ?? 'morning')
    setStartTime(initial?.startTime ?? '')
    setEndTime(initial?.endTime ?? '')
    setIsFlexible(initial?.isFlexible ?? false)
    setNotes(initial?.notes ?? '')
    setTaskType(initial?.taskType ?? 'plan')
    setIsRecurring(initial?.isRecurring ?? false)
  }, [initial])

  return (
    <div className="space-y-3">
      <input
        type="text"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="任务标题"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        autoComplete="off"
      />
      <div className="flex gap-3">
        <select className="flex-1 rounded-md border border-gray-300 px-2 py-2 text-sm" value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)}>
          <option value="plan">📝 计划</option>
          <option value="meeting">👥 会议</option>
          <option value="course">📚 课程</option>
        </select>
        <select className="flex-1 rounded-md border border-gray-300 px-2 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
          <option value="todo">未开始</option>
          <option value="inprogress">进行中</option>
          <option value="done">完成</option>
        </select>
      </div>
      <div className="flex gap-3">
        <select className="flex-1 rounded-md border border-gray-300 px-2 py-2 text-sm" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          <option value="high">高优先级</option>
          <option value="medium">中优先级</option>
          <option value="low">低优先级</option>
        </select>
        <select className="flex-1 rounded-md border border-gray-300 px-2 py-2 text-sm" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}>
          <option value="morning">上午 8:30-12:00</option>
          <option value="afternoon">下午 14:00-19:00</option>
          <option value="evening">晚上 21:00-22:30</option>
        </select>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isFlexible}
            onChange={(e) => setIsFlexible(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-700">灵活时间</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-700">🔄 每周重复</span>
        </label>
      </div>
      
      {!isFlexible && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">开始时间</label>
            <input
              type="time"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">结束时间</label>
            <input
              type="time"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
      )}
      <textarea
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="备注"
        rows={4}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex justify-end gap-3">
        <button className="px-3 py-2 text-sm text-gray-600 hover:underline" onClick={onCancel}>取消</button>
        <button
          className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          onClick={() => {
            const id = (initial?.id) ?? `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
            onSave({ 
              id, 
              title: title.trim(), 
              priority, 
              status, 
              timeSlot, 
              startTime: isFlexible ? undefined : (startTime || undefined),
              endTime: isFlexible ? undefined : (endTime || undefined),
              isFlexible,
              notes: notes.trim(),
              taskType,
              isRecurring,
              templateId: initial?.templateId // 保留 templateId
            })
          }}
          disabled={!title.trim()}
        >
          保存
        </button>
      </div>
    </div>
  )
}


