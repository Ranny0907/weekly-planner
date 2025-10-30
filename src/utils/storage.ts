import type { WeekData, TaskTemplate, Task } from '../types'

const KEY = 'weekly-planner-data-v1'
const TEMPLATES_KEY = 'weekly-planner-templates-v1'
const OLD_TEMPLATES_KEY = 'weekly-planner-templates' // 旧的键名
const UNASSIGNED_TASKS_KEY = 'weekly-planner-unassigned-tasks' // 全局未分配任务

export function loadData(): Record<string, WeekData> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    return data
  } catch (error) {
    console.error('加载数据失败:', error)
    return {}
  }
}

export function saveData(data: Record<string, WeekData>): void {
  try {
    const jsonString = JSON.stringify(data)
    localStorage.setItem(KEY, jsonString)
  } catch (error) {
    console.error('保存数据失败:', error)
    // 如果保存失败，尝试清理旧数据
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('LocalStorage空间不足，尝试清理旧数据')
      // 可以在这里添加清理逻辑
    }
  }
}

export function loadTemplates(): TaskTemplate[] {
  try {
    // 先尝试从新键名加载
    let raw = localStorage.getItem(TEMPLATES_KEY)
    
    // 如果新键名没有数据，尝试从旧键名迁移
    if (!raw) {
      const oldRaw = localStorage.getItem(OLD_TEMPLATES_KEY)
      if (oldRaw) {
        // 迁移数据到新键名
        localStorage.setItem(TEMPLATES_KEY, oldRaw)
        // 删除旧键名
        localStorage.removeItem(OLD_TEMPLATES_KEY)
        raw = oldRaw
      }
    }
    
    if (!raw) return []
    const data = JSON.parse(raw)
    // 确保返回的是数组
    if (Array.isArray(data)) {
      return data
    }
    return []
  } catch (error) {
    console.error('加载模板失败:', error)
    return []
  }
}

export function saveTemplates(templates: TaskTemplate[]): void {
  try {
    // 确保传入的是数组
    if (!Array.isArray(templates)) {
      console.error('保存模板失败：传入的数据不是数组')
      return
    }
    const jsonString = JSON.stringify(templates)
    localStorage.setItem(TEMPLATES_KEY, jsonString)
  } catch (error) {
    console.error('保存模板失败:', error)
    // 如果保存失败，尝试清理旧数据
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('LocalStorage空间不足')
    }
  }
}

export function loadUnassignedTasks(): Task[] {
  try {
    const raw = localStorage.getItem(UNASSIGNED_TASKS_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    if (Array.isArray(data)) {
      return data
    }
    return []
  } catch (error) {
    console.error('加载未分配任务失败:', error)
    return []
  }
}

export function saveUnassignedTasks(tasks: Task[]): void {
  try {
    if (!Array.isArray(tasks)) {
      console.error('保存未分配任务失败：传入的数据不是数组')
      return
    }
    const jsonString = JSON.stringify(tasks)
    localStorage.setItem(UNASSIGNED_TASKS_KEY, jsonString)
  } catch (error) {
    console.error('保存未分配任务失败:', error)
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('LocalStorage空间不足')
    }
  }
}

// 移除了已处理周的持久化逻辑，改为在运行时幂等合并

