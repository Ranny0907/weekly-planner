import React, { useState } from 'react'
import type { Task, TimeSlot } from '../types'
import TaskCard from './TaskCard'

interface UnassignedTasksProps {
  tasks: Task[]
  onAddTask: (task: Task) => void
  onUpdateTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onAssignTask: (taskId: string, dateISO: string, timeSlot: TimeSlot) => void
}

export default function UnassignedTasks({ 
  tasks, 
  onAddTask, 
  onUpdateTask, 
  onDeleteTask, 
  onAssignTask 
}: UnassignedTasksProps) {
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return
    
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: newTaskTitle.trim(),
      priority: 'medium',
      status: 'todo',
      timeSlot: 'morning', // 默认值，实际不会使用
      isFlexible: true
    }
    
    onAddTask(task)
    setNewTaskTitle('')
    setAdding(false)
  }

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm h-full overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">📋 待安排</h3>
            <p className="text-xs text-gray-500 mt-1">{tasks.length} 个任务</p>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-auto p-4">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            <div className="text-2xl mb-2">📝</div>
            <div className="font-medium">暂无任务</div>
            <div className="text-xs mt-1">点击下方添加</div>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
              <div key={task.id} className="relative group">
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', task.id)
                    e.dataTransfer.setData('task-source', 'unassigned')
                  }}
                >
                  <TaskCard 
                    task={task} 
                    onEdit={setEditing} 
                    onDelete={onDeleteTask}
                    onUpdateTask={onUpdateTask}
                  />
                </div>
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    onClick={() => {
                      // 快速分配到今天的上午
                      const today = new Date()
                      const todayISO = today.toISOString().slice(0, 10)
                      onAssignTask(task.id, todayISO, 'morning')
                    }}
                    title="快速分配到今天上午"
                  >
                    分配
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Task Section */}
      <div className="border-t border-gray-200 bg-gray-50/50 p-3">
        {adding ? (
          <div className="space-y-2">
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="输入任务标题..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                onClick={() => { setAdding(false); setNewTaskTitle('') }}
              >
                取消
              </button>
              <button
                className="px-2 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700"
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
              >
                添加
              </button>
            </div>
          </div>
        ) : (
          <button 
            className="w-full rounded-lg border-2 border-dashed border-gray-300 py-2 text-xs text-gray-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50/50 transition-all duration-200 font-medium" 
            onClick={() => setAdding(true)}
          >
            + 添加任务
          </button>
        )}
      </div>
    </div>
  )
}
