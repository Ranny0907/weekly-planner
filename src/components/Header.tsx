import React from 'react'

interface HeaderProps {
  weekNumber: number
  rangeLabel: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  searchQuery: string
  onSearchChange: (q: string) => void
  onExportPDF: () => void
  onShowTemplates: () => void
  onShowBatchAdd: () => void
}

export default function Header({ weekNumber, rangeLabel, onPrev, onNext, onToday, searchQuery, onSearchChange, onExportPDF, onShowTemplates, onShowBatchAdd }: HeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex gap-1 md:gap-3">
          <button className="rounded-md border px-2 py-1 md:px-3 md:py-2 text-xs md:text-sm hover:bg-gray-50" onClick={onPrev}>上周</button>
          <button className="rounded-md border px-2 py-1 md:px-3 md:py-2 text-xs md:text-sm hover:bg-gray-50" onClick={onToday}>本周</button>
          <button className="rounded-md border px-2 py-1 md:px-3 md:py-2 text-xs md:text-sm hover:bg-gray-50" onClick={onNext}>下周</button>
        </div>
        <div className="ml-2 text-sm md:text-lg font-semibold">第{weekNumber}周</div>
        <div className="text-xs md:text-sm text-gray-500 hidden sm:block">{rangeLabel}</div>
      </div>
      <div className="flex items-center gap-2 md:gap-3 flex-wrap">
        <input
          className="w-32 sm:w-48 md:w-64 rounded-md border border-gray-300 px-2 py-1 md:px-3 md:py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="搜索任务..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <div className="flex gap-1 md:gap-2">
          <button 
            className="rounded-md border px-2 py-1 md:px-3 md:py-2 text-xs md:text-sm hover:bg-gray-50 bg-blue-50 text-blue-700 border-blue-200" 
            onClick={onShowTemplates}
            title="任务模板（计划/会议/课程）"
          >
            📋 模板
          </button>
          <button 
            className="rounded-md border px-2 py-1 md:px-3 md:py-2 text-xs md:text-sm hover:bg-gray-50 bg-green-50 text-green-700 border-green-200" 
            onClick={onShowBatchAdd}
            title="批量添加"
          >
            ⚡ 批量
          </button>
          <button 
            className="rounded-md border px-2 py-1 md:px-3 md:py-2 text-xs md:text-sm hover:bg-gray-50" 
            onClick={onExportPDF}
            title="导出PDF"
          >
            📄 导出
          </button>
        </div>
      </div>
    </div>
  )
}


