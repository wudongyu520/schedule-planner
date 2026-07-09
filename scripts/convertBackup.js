const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../../schedule-backup-2026-07-08.json');
const outputPath = path.join(__dirname, '../../schedule-backup-converted.json');

const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

const COLOR_MAP = {
  '#a855f7': '#3b82f6',
  '#ec4899': '#ef4444',
  '#06b6d4': '#3b82f6',
};

const STANDARD_COLORS = ['#ef4444', '#f97316', '#22c55e', '#6b7280', '#15803d', '#3b82f6'];

function mapColor(color) {
  if (!color) return color;
  if (COLOR_MAP[color]) return COLOR_MAP[color];
  if (STANDARD_COLORS.includes(color)) return color;
  return '#6b7280';
}

data.timeBlocks = data.timeBlocks.map(block => ({
  id: block.id,
  name: block.name,
  color: mapColor(block.color),
  date: block.date,
  startTime: block.startTime,
  endTime: block.endTime,
  position: block.position ?? 0,
  locked: block.locked ?? false,
}));

data.tasks = data.tasks.map(task => ({
  id: task.id,
  title: task.title,
  description: task.description ?? null,
  duration: task.duration,
  priority: task.priority ?? 'MEDIUM',
  status: task.status ?? 'PENDING',
  tags: task.tags ?? [],
  color: mapColor(task.color),
  timeBlockId: task.timeBlockId ?? null,
  blockPosition: task.blockPosition ?? null,
  completed: task.completed ?? false,
  completedAt: task.completedAt ?? null,
}));

if (data.templates) {
  data.templates = data.templates.map(tpl => ({
    name: tpl.name,
    description: tpl.description ?? null,
    blocks: (tpl.blocks ?? []).map((b) => ({
      ...b,
      color: mapColor(b.color),
    })),
    isPublic: tpl.isPublic ?? false,
  }));
}

if (data.logs) {
  data.logs = data.logs.map(log => ({
    taskTitle: log.taskTitle,
    taskId: log.taskId ?? null,
    date: log.date,
    action: log.action,
    reason: log.reason ?? null,
    details: log.details ?? null,
  }));
}

fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

console.log(`转换完成！输出文件: ${outputPath}`);
console.log('颜色映射:');
console.log('  #a855f7 (紫色) -> #3b82f6 (蓝)');
console.log('  #ec4899 (粉色) -> #ef4444 (红)');
console.log('  #06b6d4 (青色) -> #3b82f6 (蓝)');
console.log(`时间块数量: ${data.timeBlocks.length}`);
console.log(`任务数量: ${data.tasks.length}`);
console.log(`模板数量: ${data.templates?.length || 0}`);
console.log(`日志数量: ${data.logs?.length || 0}`);