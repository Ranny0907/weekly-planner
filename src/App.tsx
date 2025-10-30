import React, { useEffect, useMemo, useRef, useState } from 'react'
import { addWeeks, getISOWeekNumber, getWeekDates, getWeekRangeLabel, startOfWeek, toISODate, formatDateWithWeekday, getWeekdayName } from './utils/date'
import type { Task, WeekData, TimeSlot, TaskTemplate } from './types'
import { loadData, saveData, loadTemplates, saveTemplates, loadUnassignedTasks, saveUnassignedTasks } from './utils/storage'
import Header from './components/Header'
import TimelineView from './components/TimelineView'
import UnassignedTasks from './components/UnassignedTasks'
import TaskTemplateManager from './components/TaskTemplateManager'
import BatchAddTasks from './components/BatchAddTasks'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function App() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [data, setData] = useState<Record<string, WeekData>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([]) // 全局未分配任务
  const [showTemplates, setShowTemplates] = useState(false)
  const [showBatchAdd, setShowBatchAdd] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false) // 添加初始化标志
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 加载保存的数据
    const savedData = loadData()
    const savedTemplates = loadTemplates()
    const savedUnassignedTasks = loadUnassignedTasks()
    
    setData(savedData)
    setTemplates(savedTemplates)
    setUnassignedTasks(savedUnassignedTasks)
    setIsInitialized(true) // 标记已初始化
  }, [])

  useEffect(() => {
    // 只有在初始化完成后才保存数据，避免覆盖已加载的数据
    if (isInitialized && Object.keys(data).length > 0) {
      saveData(data)
    }
  }, [data, isInitialized])

  useEffect(() => {
    // 只有在初始化完成后才保存模板数据，避免初始化时覆盖
    if (isInitialized) {
      saveTemplates(templates)
    }
  }, [templates, isInitialized])

  useEffect(() => {
    // 保存全局未分配任务
    if (isInitialized) {
      saveUnassignedTasks(unassignedTasks)
    }
  }, [unassignedTasks, isInitialized])

  const monday = useMemo(() => startOfWeek(addWeeks(new Date(), weekOffset)), [weekOffset])
  const weekKey = useMemo(() => toISODate(monday), [monday])
  const weekData = useMemo<WeekData>(() => {
    const existing = data[weekKey]
    
    // 强制重新创建正确的日期顺序 - 确保周一到周日
    const correctDays = getWeekDates(monday).map(d => ({ dateISO: toISODate(d), tasks: [] as Task[] }))
    
    if (existing) {
      // 重新映射现有任务到正确的日期顺序
      const reorderedDays = correctDays.map(correctDay => {
        const existingDay = existing.days.find(d => d.dateISO === correctDay.dateISO)
        return existingDay || correctDay
      })
      
      return { weekStartISO: weekKey, days: reorderedDays }
    }
    
    // 如果没有现有数据，返回空数据（重复任务的复制由 useEffect 处理）
    return { weekStartISO: weekKey, days: correctDays }
  }, [data, weekKey, monday])

  // 移除这个useEffect，它会导致数据被重复覆盖
  // useEffect(() => {
  //   // 确保当前周的数据存在
  //   if (!data[weekKey]) {
  //     console.log('创建新周数据:', weekKey, weekData)
  //     setData(prev => {
  //       const newData = { ...prev, [weekKey]: weekData }
  //       console.log('新数据:', newData)
  //       return newData
  //     })
  //   }
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [weekKey, weekData])

  // 确保新周的重复任务被复制（幂等：只补充缺少的，不重复添加）
  useEffect(() => {
    if (!isInitialized) return
    
    // 检查上周是否有重复任务需要复制
    const lastWeekMonday = new Date(monday)
    lastWeekMonday.setDate(lastWeekMonday.getDate() - 7)
    const lastWeekKey = toISODate(lastWeekMonday)
    const lastWeekData = data[lastWeekKey]
    
    console.log(`[重复任务] 当前周: ${weekKey}, 上周: ${lastWeekKey}`)
    
    if (!lastWeekData) {
      console.log(`[重复任务] 上周 ${lastWeekKey} 没有数据，跳过`)
      return // 上周没有数据
    }
    
    // 检查上周是否有重复任务
    const recurringTasksByDay = lastWeekData.days.map(day => 
      day.tasks.filter(task => task.isRecurring)
    )
    
    const totalRecurringTasks = recurringTasksByDay.reduce((sum, tasks) => sum + tasks.length, 0)
    if (totalRecurringTasks === 0) {
      console.log(`[重复任务] 没有重复任务，跳过`)
      return // 没有重复任务
    }
    
    // 获取当前周数据（如果没有则创建）
    const currentWeekData = data[weekKey]
    const correctDays = getWeekDates(monday).map(d => ({ dateISO: toISODate(d), tasks: [] as Task[] }))
    
    // 合并现有任务和重复任务
    const newDaysWithRecurring = correctDays.map((day, dayIndex) => {
      // 获取现有任务
      const existingTasks = currentWeekData?.days[dayIndex]?.tasks || []
      const existingTemplateIds = new Set(existingTasks.map(t => t.templateId || ''))
      
      // 获取上周的重复任务
      const recurringTasks = (recurringTasksByDay[dayIndex] || []).map(task => {
        // 如果任务没有 templateId，使用任务的原始 id 作为 templateId
        // 这样所有基于同一任务复制的任务都会有相同的 templateId
        const templateId = task.templateId || task.id
        
        return {
          ...task,
          id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          status: 'todo' as const,
          templateId // 确保每个重复任务都有 templateId
        }
      })
      // 只补充当前周缺少的（按 templateId 判断）
      const missingRecurring = recurringTasks.filter(t => t.templateId && !existingTemplateIds.has(t.templateId))
      
      return {
        ...day,
        tasks: [...missingRecurring, ...existingTasks] // 重复任务放在前面
      }
    })
    
    // 保存到 data
    const newWeekData: WeekData = {
      weekStartISO: weekKey,
      days: newDaysWithRecurring
    }
    
    setData(prev => ({ ...prev, [weekKey]: newWeekData }))
  }, [isInitialized, weekKey, data, monday])
  

  const updateWeekData = (update: (w: WeekData) => WeekData) => {
    setData(prev => {
      const newData = { ...prev, [weekKey]: update(prev[weekKey] ?? weekData) }
      return newData
    })
  }

  const handleAddTask = (dateISO: string, task: Task) => {
    updateWeekData(w => ({
      ...w,
      days: w.days.map(d => d.dateISO === dateISO ? { ...d, tasks: [...d.tasks, task] } : d)
    }))
  }

  const handleUpdateTask = (dateISO: string, task: Task) => {
    // 如果只是切换状态（todo/inprogress/done），只更新当前任务，不弹窗
    const originalTask = weekData.days.find(d => d.dateISO === dateISO)?.tasks.find(t => t.id === task.id)
    const isStatusOnlyChange = (() => {
      if (!originalTask) return false
      const sameExceptStatus = (
        originalTask.title === task.title &&
        originalTask.priority === task.priority &&
        originalTask.timeSlot === task.timeSlot &&
        originalTask.startTime === task.startTime &&
        originalTask.endTime === task.endTime &&
        originalTask.isFlexible === task.isFlexible &&
        (originalTask.notes || '') === (task.notes || '') &&
        (originalTask.taskType || 'plan') === (task.taskType || 'plan') &&
        (originalTask.isRecurring || false) === (task.isRecurring || false) &&
        (originalTask.templateId || '') === (task.templateId || '')
      )
      return sameExceptStatus && originalTask.status !== task.status
    })()

    if (isStatusOnlyChange) {
      updateWeekData(w => ({
        ...w,
        days: w.days.map(d => d.dateISO === dateISO ? { ...d, tasks: d.tasks.map(t => t.id === task.id ? task : t) } : d)
      }))
      return
    }
    // 如果任务标记为重复但没有 templateId，给它分配一个
    let updatedTask = task
    if (task.isRecurring && !task.templateId) {
      updatedTask = { ...task, templateId: task.id }
      console.log(`[重复任务] 为任务 ${task.title} 分配 templateId: ${task.id}`)
    }
    
    // 如果任务是重复任务，询问是否要更新所有周的相同任务
    if (updatedTask.isRecurring && updatedTask.templateId) {
      const confirmMessage = `这是一个每周重复的任务。\n\n• 点击"确定"：更新所有周的此任务\n• 点击"取消"：只更新本周的此任务`
      const updateAll = window.confirm(confirmMessage)
      
      if (updateAll) {
        // 更新所有周中基于同一模板的任务
        const templateId = updatedTask.templateId
        setData(prevData => {
          const newData = { ...prevData }
          Object.keys(newData).forEach(weekKey => {
            const weekData = newData[weekKey]
            if (!weekData) return
            newData[weekKey] = {
              weekStartISO: weekData.weekStartISO,
              days: weekData.days.map(day => ({
                ...day,
                tasks: day.tasks.map(t => {
                  if (t.templateId === templateId) {
                    // 保留原任务的 id 和 status，更新其他字段
                    return {
                      ...updatedTask,
                      id: t.id,
                      status: t.status
                    }
                  }
                  return t
                })
              }))
            }
          })
          return newData
        })
        return
      }
    }
    
    // 只更新当前任务
    updateWeekData(w => ({
      ...w,
      days: w.days.map(d => d.dateISO === dateISO ? { ...d, tasks: d.tasks.map(t => t.id === updatedTask.id ? updatedTask : t) } : d)
    }))
  }

  const handleDeleteTask = (dateISO: string, taskId: string) => {
    // 找到要删除的任务
    const taskToDelete = weekData.days
      .find(d => d.dateISO === dateISO)
      ?.tasks.find(t => t.id === taskId)
    
    // 如果任务是重复任务，询问是否要删除所有周的相同任务
    if (taskToDelete?.isRecurring && taskToDelete?.templateId) {
      const confirmMessage = `这是一个每周重复的任务。\n\n• 点击"确定"：删除所有周的此任务\n• 点击"取消"：只删除本周的此任务`
      const deleteAll = window.confirm(confirmMessage)
      
      if (deleteAll) {
        // 删除所有周中基于同一模板的任务
        const templateId = taskToDelete.templateId
        setData(prevData => {
          const newData = { ...prevData }
          Object.keys(newData).forEach(weekKey => {
            const weekData = newData[weekKey]
            if (!weekData) return
            newData[weekKey] = {
              weekStartISO: weekData.weekStartISO,
              days: weekData.days.map(day => ({
                ...day,
                tasks: day.tasks.filter(t => t.templateId !== templateId)
              }))
            }
          })
          return newData
        })
        return
      }
    }
    
    // 只删除当前任务
    updateWeekData(w => ({
      ...w,
      days: w.days.map(d => d.dateISO === dateISO ? { ...d, tasks: d.tasks.filter(t => t.id !== taskId) } : d)
    }))
  }

  // 未分配任务相关函数（全局）
  const handleAddUnassignedTask = (task: Task) => {
    setUnassignedTasks(prev => [...prev, task])
  }

  const handleUpdateUnassignedTask = (task: Task) => {
    setUnassignedTasks(prev => prev.map(t => t.id === task.id ? task : t))
  }

  const handleDeleteUnassignedTask = (taskId: string) => {
    setUnassignedTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const handleAssignTask = (taskId: string, dateISO: string, timeSlot: TimeSlot) => {
    const task = unassignedTasks.find(t => t.id === taskId)
    if (!task) return

    // 从未分配任务中移除
    setUnassignedTasks(prev => prev.filter(t => t.id !== taskId))
    
    // 添加到具体日期
    updateWeekData(w => ({
      ...w,
      days: w.days.map(d => 
        d.dateISO === dateISO 
          ? { ...d, tasks: [...d.tasks, { ...task, timeSlot }] }
          : d
      )
    }))
  }

  const handleMoveTask = (fromDateISO: string, toDateISO: string, taskId: string, timeSlot: TimeSlot) => {
    // 检查是否从未分配任务拖拽
    const unassignedTask = unassignedTasks.find(t => t.id === taskId)
    if (unassignedTask) {
      // 从未分配任务拖拽到具体日期
      setUnassignedTasks(prev => prev.filter(t => t.id !== taskId))
      updateWeekData(w => ({
        ...w,
        days: w.days.map(d => 
          d.dateISO === toDateISO 
            ? { ...d, tasks: [...d.tasks, { ...unassignedTask, timeSlot }] }
            : d
        )
      }))
      return
    }

    // 从具体日期拖拽到另一个日期
    if (!fromDateISO || fromDateISO === toDateISO) return
    
    updateWeekData(w => {
      let moved: Task | undefined
      const daysRemoved = w.days.map(d => {
        if (d.dateISO === fromDateISO) {
          const idx = d.tasks.findIndex(t => t.id === taskId)
          if (idx >= 0) {
            moved = d.tasks[idx]
            const newTasks = d.tasks.slice()
            newTasks.splice(idx, 1)
            return { ...d, tasks: newTasks }
          }
        }
        return d
      })
      if (!moved) return w
      // Update the moved task's timeSlot
      const updatedTask = { ...moved, timeSlot }
      const daysAdded = daysRemoved.map(d => d.dateISO === toDateISO ? { ...d, tasks: [...d.tasks, updatedTask] } : d)
      return { ...w, days: daysAdded }
    })
  }

  // 模板管理
  const handleSaveTemplate = (template: TaskTemplate) => {
    setTemplates(prev => {
      const existing = prev.find(t => t.id === template.id)
      if (existing) {
        // 如果是更新模板，同步更新所有使用该模板创建的任务
        syncTasksFromTemplate(template)
        return prev.map(t => t.id === template.id ? template : t)
      } else {
        return [...prev, template]
      }
    })
  }

  // 同步更新所有使用该模板创建的任务
  const syncTasksFromTemplate = (template: TaskTemplate) => {
    // 更新所有周的任务
    setData(prev => {
      const newData = { ...prev }
      let hasChanges = false

      // 遍历所有周的数据
      Object.keys(newData).forEach(weekKey => {
        const week = newData[weekKey]
        if (!week) return
        
        // 更新每天的任务
        week.days.forEach(day => {
          day.tasks.forEach(task => {
            if (task.templateId === template.id) {
              // 同步模板的内容到任务，但保留任务的状态
              task.title = template.title
              task.priority = template.priority
              task.timeSlot = template.timeSlot
              task.startTime = template.startTime
              task.endTime = template.endTime
              task.notes = template.notes
              task.taskType = template.taskType
              task.isRecurring = template.isRecurring
              hasChanges = true
            }
          })
        })
      })

      return hasChanges ? newData : prev
    })
    
    // 更新全局未分配任务
    setUnassignedTasks(prev => {
      let hasChanges = false
      const updated = prev.map(task => {
        if (task.templateId === template.id) {
          hasChanges = true
          return {
            ...task,
            title: template.title,
            priority: template.priority,
            timeSlot: template.timeSlot,
            startTime: template.startTime,
            endTime: template.endTime,
            notes: template.notes,
            taskType: template.taskType,
            isRecurring: template.isRecurring
          }
        }
        return task
      })
      return hasChanges ? updated : prev
    })
  }

  const handleDeleteTemplate = (templateId: string) => {
    // 检查是否有任务使用了这个模板
    let hasRelatedTasks = false
    Object.values(data).forEach(weekData => {
      weekData.days.forEach(day => {
        if (day.tasks.some(task => task.templateId === templateId)) {
          hasRelatedTasks = true
        }
      })
    })
    
    // 如果有相关任务，询问是否一起删除
    if (hasRelatedTasks) {
      const confirmMessage = `此模板已被用于创建任务。\n\n• 点击"确定"：删除模板及所有相关任务\n• 点击"取消"：只删除模板，保留已创建的任务`
      const deleteRelatedTasks = window.confirm(confirmMessage)
      
      if (deleteRelatedTasks) {
        // 删除所有基于此模板的任务
        setData(prevData => {
          const newData = { ...prevData }
          Object.keys(newData).forEach(weekKey => {
            const weekData = newData[weekKey]
            if (!weekData) return
            newData[weekKey] = {
              weekStartISO: weekData.weekStartISO,
              days: weekData.days.map(day => ({
                ...day,
                tasks: day.tasks.filter(t => t.templateId !== templateId)
              }))
            }
          })
          return newData
        })
      }
    }
    
    // 删除模板
    setTemplates(prev => prev.filter(t => t.id !== templateId))
  }

  const handleUseTemplate = (template: TaskTemplate) => {
    // 将模板转换为任务并添加到当前周的第一天
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: template.title,
      priority: template.priority,
      status: 'todo',
      timeSlot: template.timeSlot,
      startTime: template.startTime,
      endTime: template.endTime,
      notes: template.notes,
      templateId: template.id, // 关联模板ID
      taskType: template.taskType,
      isRecurring: template.isRecurring
    }
    if (weekData.days.length > 0 && weekData.days[0]) {
      handleAddTask(weekData.days[0].dateISO, task)
    }
  }

  // 批量添加任务
  const handleBatchAddTasks = (tasksToAdd: { dateISO: string; task: Task }[]) => {
    tasksToAdd.forEach(({ dateISO, task }) => {
      handleAddTask(dateISO, task)
    })
  }

  // 重新排序任务
  const handleReorderTasks = (dateISO: string, timeSlot: TimeSlot, taskIds: string[]) => {
    updateWeekData(w => ({
      ...w,
      days: w.days.map(d => {
        if (d.dateISO === dateISO) {
          const tasksInSlot = d.tasks.filter(t => t.timeSlot === timeSlot)
          const otherTasks = d.tasks.filter(t => t.timeSlot !== timeSlot)
          
          // 按照新的顺序重新排列
          const reorderedTasks = taskIds.map(id => tasksInSlot.find(t => t.id === id)).filter(Boolean) as Task[]
          
          return { ...d, tasks: [...otherTasks, ...reorderedTasks] }
        }
        return d
      })
    }))
  }

  const handleExportPDF = async () => {
    if (!exportRef.current) return
    const canvas = await html2canvas(exportRef.current, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('l', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth
    const imgHeight = canvas.height * (imgWidth / canvas.width)
    let y = 0
    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight)
    } else {
      // paginate
      let remaining = imgHeight
      let position = 0
      while (remaining > 0) {
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        remaining -= pageHeight
        position -= pageHeight
        if (remaining > 0) pdf.addPage()
      }
    }
    pdf.save(`每周计划_${weekKey}.pdf`)
  }

  const weekNumber = getISOWeekNumber(monday)
  const rangeLabel = getWeekRangeLabel(monday)
  
  // 获取当前日期，用于显示"今天"标识
  const today = new Date()
  const todayISO = toISODate(today)

  const completedCount = weekData.days.reduce((acc, d) => acc + d.tasks.filter(t => t.status === 'done').length, 0)
  const totalCount = weekData.days.reduce((acc, d) => acc + d.tasks.length, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-8xl p-6 space-y-6">
        <Header
          weekNumber={weekNumber}
          rangeLabel={rangeLabel}
          onPrev={() => setWeekOffset(o => o - 1)}
          onNext={() => setWeekOffset(o => o + 1)}
          onToday={() => setWeekOffset(0)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onExportPDF={handleExportPDF}
          onShowTemplates={() => setShowTemplates(true)}
          onShowBatchAdd={() => setShowBatchAdd(true)}
        />
        
        {/* 图例和进度 */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              <span>计划（按优先级蓝色深浅）</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">会议</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📚</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">课程</span>
            </div>
            <div className="border-l border-gray-300 pl-4 ml-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs">●</div>
                  <span>未开始</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs">▲</div>
                  <span>进行中</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
                  <span>已完成</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-gray-600">本周进度</div>
            <div className="bg-gray-200 rounded-full h-2 w-24">
              <div 
                className="bg-indigo-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="font-medium text-gray-800">{completedCount}/{totalCount}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-8 gap-4 h-[calc(100vh-180px)] lg:h-[calc(100vh-160px)]">
          {/* 未分配任务区域 - 移动端隐藏 */}
          <div className="hidden lg:block lg:col-span-1">
            <UnassignedTasks
              tasks={unassignedTasks}
              onAddTask={handleAddUnassignedTask}
              onUpdateTask={handleUpdateUnassignedTask}
              onDeleteTask={handleDeleteUnassignedTask}
              onAssignTask={handleAssignTask}
            />
          </div>
          
          {/* 时间轴视图区域 */}
          <div className="lg:col-span-7 col-span-1">
            <div ref={exportRef} className="overflow-hidden h-full">
              <TimelineView
                weekData={weekData}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onMoveTask={handleMoveTask}
                onReorderTasks={handleReorderTasks}
                searchQuery={searchQuery}
                todayISO={todayISO}
              />
            </div>
          </div>
        </div>
        
        {/* 移动端浮动按钮 */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <button
            className="bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
            onClick={() => {
              // 滚动到页面顶部显示未分配任务
              const unassignedSection = document.getElementById('mobile-unassigned')
              if (unassignedSection) {
                unassignedSection.scrollIntoView({ behavior: 'smooth' })
              }
            }}
            title="查看待安排任务"
          >
            📋
          </button>
        </div>
        
        {/* 移动端未分配任务区域 */}
        <div id="mobile-unassigned" className="lg:hidden bg-white rounded-xl shadow-sm p-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 待安排任务</h3>
          <UnassignedTasks
            tasks={unassignedTasks}
            onAddTask={handleAddUnassignedTask}
            onUpdateTask={handleUpdateUnassignedTask}
            onDeleteTask={handleDeleteUnassignedTask}
            onAssignTask={handleAssignTask}
          />
        </div>
      </div>
      
      {/* 模板管理模态框 */}
      {showTemplates && (
        <TaskTemplateManager
          templates={templates}
          onSaveTemplate={handleSaveTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onUseTemplate={handleUseTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
      
      {/* 批量添加模态框 */}
      {showBatchAdd && (
        <BatchAddTasks
          weekData={weekData}
          templates={templates}
          onAddTasks={handleBatchAddTasks}
          onClose={() => setShowBatchAdd(false)}
        />
      )}
    </div>
  )
}


