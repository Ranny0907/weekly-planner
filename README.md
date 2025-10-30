# 每周计划表 (React 18 + Vite + Tailwind + TypeScript)

现代风格的「每周计划表」Web 应用，支持拖拽任务、LocalStorage 持久化、搜索与导出 PDF，具备响应式布局。

## 功能
- 显示当前周数与日期范围；切换上周/下周/本周
- 周一至周日列视图；添加/编辑/删除任务
- 任务包含标题、优先级、状态、备注；跨日拖拽
- 本地存储自动保存
- 搜索任务标题
- 导出本周计划为 PDF
- 简单完成统计（本周完成任务数量）

## 快速开始
```bash
npm install
npm run dev
# 构建与预览
npm run build
npm run preview
```

## 目录概览
```
.
├─ index.html
├─ package.json
├─ postcss.config.js
├─ tailwind.config.js
├─ tsconfig.json
├─ vite.config.ts
└─ src
   ├─ App.tsx
   ├─ main.tsx
   ├─ index.css
   ├─ types.ts
   ├─ utils
   │  ├─ date.ts
   │  └─ storage.ts
   └─ components
      ├─ Header.tsx
      ├─ WeekView.tsx
      ├─ DayColumn.tsx
      ├─ TaskCard.tsx
      └─ TaskEditor.tsx
```
