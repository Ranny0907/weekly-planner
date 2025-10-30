import React, { useState } from 'react'
import type { TaskTemplate, Priority, TimeSlot, TaskType, Weekday } from '../types'

interface TaskTemplateManagerProps {
  templates: TaskTemplate[]
  onSaveTemplate: (template: TaskTemplate) => void
  onDeleteTemplate: (templateId: string) => void
  onUseTemplate: (template: TaskTemplate) => void
  onClose: () => void
}

export default function TaskTemplateManager({ 
  templates, 
  onSaveTemplate, 
  onDeleteTemplate, 
  onUseTemplate, 
  onClose 
}: TaskTemplateManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null)
  const [filterType, setFilterType] = useState<TaskType | 'all'>('all')
  
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('morning')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [taskType, setTaskType] = useState<TaskType>('plan')
  const [isRecurring, setIsRecurring] = useState(false)
  const [weekdays, setWeekdays] = useState<Weekday[]>([])

  const handleSave = () => {
    if (!title.trim()) return
    
    const template: TaskTemplate = {
      id: editingTemplate?.id ?? `template_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim(),
      priority,
      timeSlot,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      notes: notes.trim() || undefined,
      taskType,
      isRecurring,
      weekdays: weekdays.length > 0 ? weekdays : undefined
    }
    
    onSaveTemplate(template)
    resetForm()
  }

  const resetForm = () => {
    setTitle('')
    setPriority('medium')
    setTimeSlot('morning')
    setStartTime('')
    setEndTime('')
    setNotes('')
    setTaskType('plan')
    setIsRecurring(false)
    setWeekdays([])
    setShowAddForm(false)
    setEditingTemplate(null)
  }

  const handleEdit = (template: TaskTemplate) => {
    setEditingTemplate(template)
    setTitle(template.title)
    setPriority(template.priority)
    setTimeSlot(template.timeSlot)
    setStartTime(template.startTime || '')
    setEndTime(template.endTime || '')
    setNotes(template.notes || '')
    setTaskType(template.taskType || 'plan')
    setIsRecurring(template.isRecurring || false)
    setWeekdays(template.weekdays || [])
    setShowAddForm(true)
  }

  const filteredTemplates = filterType === 'all' 
    ? templates 
    : templates.filter(t => (t.taskType || 'plan') === (filterType as TaskType))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">任务模板管理</h2>
          <button 
            className="text-gray-400 hover:text-gray-600 text-2xl"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {!showAddForm ? (
            <div className="space-y-4">
              {/* 类型筛选标签 */}
              <div className="flex gap-2 flex-wrap">
                <button
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    filterType === 'all' 
                      ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setFilterType('all')}
                >
                  全部 ({templates.length})
                </button>
                <button
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    filterType === 'plan' 
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setFilterType('plan')}
                >
                  📝 计划 ({templates.filter(t => (t.taskType || 'plan') === 'plan').length})
                </button>
                <button
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    filterType === 'meeting' 
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setFilterType('meeting')}
                >
                  👥 会议 ({templates.filter(t => t.taskType === 'meeting').length})
                </button>
                <button
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    filterType === 'course' 
                      ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setFilterType('course')}
                >
                  📚 课程 ({templates.filter(t => t.taskType === 'course').length})
                </button>
              </div>
              
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-700">常用任务模板</h3>
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  onClick={() => setShowAddForm(true)}
                >
                  + 添加模板
                </button>
              </div>
              
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📝</div>
                  <div>暂无{filterType === 'all' ? '任务模板' : filterType === 'meeting' ? '会议模板' : filterType === 'course' ? '课程模板' : '计划模板'}</div>
                  <div className="text-sm mt-2">点击"添加模板"创建常用{filterType === 'meeting' ? '会议' : filterType === 'course' ? '课程' : '任务'}</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.map(template => {
                    const typeConfig = {
                      plan: { label: '计划', icon: '📝', color: 'bg-blue-100 text-blue-700' },
                      meeting: { label: '会议', icon: '👥', color: 'bg-purple-100 text-purple-700' },
                      course: { label: '课程', icon: '📚', color: 'bg-green-100 text-green-700' }
                    }[template.taskType || 'plan']
                    
                    return (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs ${typeConfig.color} px-2 py-1 rounded font-medium`}>
                              {typeConfig.icon} {typeConfig.label}
                            </span>
                            {template.isRecurring && (
                              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded font-medium">
                                🔄 每周重复
                              </span>
                            )}
                          </div>
                          <div className="font-medium text-gray-800">{template.title}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {template.timeSlot === 'morning' ? '上午' : template.timeSlot === 'afternoon' ? '下午' : '晚上'}
                            {template.startTime && template.endTime && ` ${template.startTime}-${template.endTime}`}
                          </div>
                          {template.weekdays && template.weekdays.length > 0 && (
                            <div className="text-xs text-indigo-600 mt-1 flex items-center gap-1 flex-wrap">
                              <span>📅</span>
                              {template.weekdays.map(w => {
                                const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
                                return (
                                  <span key={w} className="bg-indigo-100 px-1.5 py-0.5 rounded">{days[w]}</span>
                                )
                              })}
                            </div>
                          )}
                          {template.notes && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">{template.notes}</div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 ml-4">
                          <button
                            className="text-blue-600 hover:text-blue-800 text-sm whitespace-nowrap"
                            onClick={() => onUseTemplate(template)}
                          >
                            使用
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-800 text-sm whitespace-nowrap"
                            onClick={() => handleEdit(template)}
                          >
                            编辑
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 text-sm whitespace-nowrap"
                            onClick={() => {
                              if (confirm(`确定要删除模板"${template.title}"吗？`)) {
                                onDeleteTemplate(template.id)
                              }
                            }}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <button
                  className="text-gray-600 hover:text-gray-800"
                  onClick={resetForm}
                >
                  ← 返回
                </button>
                <h3 className="text-lg font-medium text-gray-700">
                  {editingTemplate ? '编辑模板' : '添加模板'}
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">任务标题</label>
                  <input
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="输入任务标题"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">任务类型</label>
                  <select 
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={taskType} 
                    onChange={(e) => setTaskType(e.target.value as TaskType)}
                  >
                    <option value="plan">📝 计划</option>
                    <option value="meeting">👥 会议</option>
                    <option value="course">📚 课程</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                    <select 
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={priority} 
                      onChange={(e) => setPriority(e.target.value as Priority)}
                    >
                      <option value="high">高优先级</option>
                      <option value="medium">中优先级</option>
                      <option value="low">低优先级</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">时间段</label>
                    <select 
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={timeSlot} 
                      onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}
                    >
                      <option value="morning">上午 8:30-12:00</option>
                      <option value="afternoon">下午 14:00-18:00</option>
                      <option value="evening">晚上 21:00-22:30</option>
                    </select>
                  </div>
                </div>
                
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-1.5">
                      <span>🔄</span>
                      <span>每周重复</span>
                    </label>
                  </div>
                  <div className="text-xs text-orange-700 pl-6">
                    💡 勾选后，使用此模板创建的任务会在下次切换到新一周时自动复制
                  </div>
                </div>
                
                {/* 周几选择（仅会议和课程显示） */}
                {(taskType === 'meeting' || taskType === 'course') && (
                  <div className="border-l-4 border-indigo-400 bg-indigo-50/50 p-4 rounded-r-md space-y-2">
                    <div className="text-sm font-semibold text-indigo-900">选择周几</div>
                    <div className="text-xs text-indigo-700 mb-2">可多选，批量添加时会在选中的每一天创建任务</div>
                    <div className="flex gap-2 flex-wrap">
                      {(['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const).map((day, index) => {
                        const weekday = index as Weekday
                        const isSelected = weekdays.includes(weekday)
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setWeekdays(prev => prev.filter(w => w !== weekday))
                              } else {
                                setWeekdays(prev => [...prev, weekday].sort())
                              }
                            }}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                    <input
                      type="time"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                    <input
                      type="time"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder="可选备注信息"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    onClick={resetForm}
                  >
                    取消
                  </button>
                  <button
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    onClick={handleSave}
                    disabled={!title.trim()}
                  >
                    {editingTemplate ? '更新' : '保存'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
