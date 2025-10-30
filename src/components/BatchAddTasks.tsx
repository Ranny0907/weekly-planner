import React, { useState } from 'react'
import type { TaskTemplate, Task, TimeSlot } from '../types'
import { getWeekDates, toISODate, getWeekdayName } from '../utils/date'

interface BatchAddTasksProps {
  weekData: { weekStartISO: string; days: { dateISO: string }[] }
  templates: TaskTemplate[]
  onAddTasks: (tasks: { dateISO: string; task: Task }[]) => void
  onClose: () => void
}

export default function BatchAddTasks({ weekData, templates, onAddTasks, onClose }: BatchAddTasksProps) {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>('morning')

  const weekDates = getWeekDates(new Date(weekData.weekStartISO))

  const handleAddTasks = () => {
    if (selectedTemplates.length === 0 || selectedDays.length === 0) return

    const tasksToAdd: { dateISO: string; task: Task }[] = []
    
    selectedTemplates.forEach(templateId => {
      const template = templates.find(t => t.id === templateId)
      if (!template) return
      
      selectedDays.forEach(dateISO => {
        const task: Task = {
          id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          title: template.title,
          priority: template.priority,
          status: 'todo',
          timeSlot: selectedTimeSlot,
          startTime: template.startTime,
          endTime: template.endTime,
          notes: template.notes,
          templateId: template.id, // 关联模板ID，用于同步更新
          taskType: template.taskType,
          isRecurring: template.isRecurring
        }
        tasksToAdd.push({ dateISO, task })
      })
    })

    onAddTasks(tasksToAdd)
    onClose()
  }

  const toggleTemplate = (templateId: string) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    )
  }

  const toggleDay = (dateISO: string) => {
    setSelectedDays(prev => 
      prev.includes(dateISO) 
        ? prev.filter(d => d !== dateISO)
        : [...prev, dateISO]
    )
  }

  const selectAllDays = () => {
    setSelectedDays(weekData.days.map(d => d.dateISO))
  }

  const selectWeekdays = () => {
    setSelectedDays(weekData.days.slice(0, 5).map(d => d.dateISO))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">批量添加任务</h2>
          <button 
            className="text-gray-400 hover:text-gray-600 text-2xl"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* 选择模板 */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">选择任务模板</h3>
            {templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📝</div>
                <div>暂无任务模板</div>
                <div className="text-sm mt-2">请先创建任务模板</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map(template => (
                  <label key={template.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTemplates.includes(template.id)}
                      onChange={() => toggleTemplate(template.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{template.title}</div>
                      <div className="text-sm text-gray-600">
                        {template.timeSlot === 'morning' ? '上午' : template.timeSlot === 'afternoon' ? '下午' : '晚上'}
                        {template.startTime && template.endTime && ` ${template.startTime}-${template.endTime}`}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 选择日期 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-700">选择日期</h3>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  onClick={selectWeekdays}
                >
                  工作日
                </button>
                <button
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  onClick={selectAllDays}
                >
                  全选
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekData.days.map((day, index) => (
                <label key={day.dateISO} className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(day.dateISO)}
                    onChange={() => toggleDay(day.dateISO)}
                    className="mb-2"
                  />
                  <div className="text-sm font-medium text-gray-800">{getWeekdayName(new Date(day.dateISO))}</div>
                  <div className="text-xs text-gray-600">{day.dateISO.slice(5)}</div>
                </label>
              ))}
            </div>
          </div>

          {/* 选择时间段 */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">应用时间段</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'morning', label: '上午', time: '8:30-12:00' },
                { key: 'afternoon', label: '下午', time: '14:00-18:00' },
                { key: 'evening', label: '晚上', time: '21:00-22:30' }
              ].map(slot => (
                <label key={slot.key} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="timeSlot"
                    value={slot.key}
                    checked={selectedTimeSlot === slot.key}
                    onChange={(e) => setSelectedTimeSlot(e.target.value as TimeSlot)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-800">{slot.label}</div>
                    <div className="text-sm text-gray-600">{slot.time}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            onClick={handleAddTasks}
            disabled={selectedTemplates.length === 0 || selectedDays.length === 0}
          >
            批量添加 ({selectedTemplates.length} 个模板 × {selectedDays.length} 天)
          </button>
        </div>
      </div>
    </div>
  )
}
