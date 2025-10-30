import React from 'react'
import type { Task } from '../types'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onUpdateTask?: (task: Task) => void
}

export default function TaskCard({ task, onEdit, onDelete, onUpdateTask }: TaskCardProps) {
  // 任务类型和优先级配置
  const getTaskTypeConfig = () => {
    const type = task.taskType || 'plan'
    
    // 会议和课程使用固定颜色
    if (type === 'meeting') {
      return {
        label: '会议',
        icon: '👥',
        bg: 'bg-purple-50',
        border: 'border-purple-300',
        badge: 'bg-purple-100 text-purple-700'
      }
    }
    
    if (type === 'course') {
      return {
        label: '课程',
        icon: '📚',
        bg: 'bg-green-50',
        border: 'border-green-300',
        badge: 'bg-green-100 text-green-700'
      }
    }
    
    // 计划类型根据优先级使用不同深浅的蓝色
    const priorityColors = {
      high: {
        bg: 'bg-blue-100',
        border: 'border-blue-500',
        badge: 'bg-blue-200 text-blue-900'
      },
      medium: {
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        badge: 'bg-blue-100 text-blue-700'
      },
      low: {
        bg: 'bg-blue-50/50',
        border: 'border-blue-200',
        badge: 'bg-blue-50 text-blue-600'
      }
    }[task.priority]
    
    return {
      label: '计划',
      icon: '📝',
      ...priorityColors
    }
  }
  
  const taskTypeConfig = getTaskTypeConfig()

  const priorityConfig = {
    high: { 
      bg: 'bg-red-50', 
      border: 'border-red-200', 
      text: 'text-red-700', 
      dot: 'bg-red-500'
    },
    medium: { 
      bg: 'bg-yellow-50', 
      border: 'border-yellow-200', 
      text: 'text-yellow-700', 
      dot: 'bg-yellow-500'
    },
    low: { 
      bg: 'bg-green-50', 
      border: 'border-green-200', 
      text: 'text-green-700', 
      dot: 'bg-green-500'
    },
  }[task.priority]

  const statusConfig = {
    todo: { dot: 'bg-gray-400', icon: '●', nextStatus: 'inprogress' as const },
    inprogress: { dot: 'bg-yellow-500', icon: '▲', nextStatus: 'done' as const },
    done: { dot: 'bg-green-500', icon: '✓', nextStatus: 'todo' as const }
  }[task.status]

  const handleStatusToggle = () => {
    if (onUpdateTask) {
      const updatedTask = { ...task, status: statusConfig.nextStatus }
      onUpdateTask(updatedTask)
    }
  }

  return (
    <div
      className={`group rounded-lg border-2 ${taskTypeConfig.bg} ${taskTypeConfig.border} p-3 cursor-grab active:cursor-grabbing select-none hover:shadow-md transition-all duration-200 hover:scale-[1.02]`} 
      draggable 
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id)
        e.currentTarget.classList.add('opacity-50', 'rotate-2')
      }}
      onDragEnd={(e) => {
        e.currentTarget.classList.remove('opacity-50', 'rotate-2')
      }}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={handleStatusToggle}
          className={`w-5 h-5 rounded-full ${statusConfig.dot} flex items-center justify-center text-white text-xs font-bold hover:scale-110 transition-transform duration-200 flex-shrink-0`}
          title={`点击切换到${statusConfig.nextStatus === 'inprogress' ? '进行中' : statusConfig.nextStatus === 'done' ? '已完成' : '未开始'}`}
        >
          {statusConfig.icon}
        </button>
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span 
              className={`text-xs ${taskTypeConfig.badge} px-1.5 py-0.5 rounded font-medium flex-shrink-0`}
              title={taskTypeConfig.label}
            >
              {taskTypeConfig.icon} {taskTypeConfig.label}
            </span>
            {task.isRecurring && (
              <span 
                className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                title="每周重复任务"
              >
                🔄
              </span>
            )}
            {task.templateId && (
              <span 
                className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                title="来自模板"
              >
                📋
              </span>
            )}
          </div>
          <div className="text-sm font-medium text-gray-800 break-words" title={task.title}>
            {task.title}
          </div>
        </div>
      </div>
      
      {task.isFlexible ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <span className="text-gray-400">⏰</span>
          <span className="text-blue-600 font-medium">灵活时间</span>
        </div>
      ) : (task.startTime || task.endTime) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <span className="text-gray-400">🕐</span>
          <span>
            {task.startTime && task.endTime 
              ? `${task.startTime} - ${task.endTime}`
              : task.startTime 
                ? `从 ${task.startTime} 开始`
                : `到 ${task.endTime} 结束`
            }
          </span>
        </div>
      )}
      
      {task.notes ? (
        <div className="mt-2 text-xs text-gray-600 line-clamp-2 whitespace-pre-wrap">
          {task.notes}
        </div>
      ) : null}
      
      <div className="hidden group-hover:flex justify-end gap-2 mt-3 pt-2 border-t border-gray-200/50">
        <button 
          className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors duration-200" 
          onClick={() => onEdit(task)}
        >
          编辑
        </button>
        <button 
          className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors duration-200" 
          onClick={() => onDelete(task.id)}
        >
          删除
        </button>
      </div>
    </div>
  )
}


