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
  ...block,
  color: mapColor(block.color),
}));

data.tasks = data.tasks.map(task => ({
  ...task,
  color: mapColor(task.color),
}));

fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

console.log(`转换完成！输出文件: ${outputPath}`);
console.log('颜色映射:');
console.log('  #a855f7 (紫色) -> #3b82f6 (蓝)');
console.log('  #ec4899 (粉色) -> #ef4444 (红)');
console.log('  #06b6d4 (青色) -> #3b82f6 (蓝)');
console.log(`时间块数量: ${data.timeBlocks.length}`);
console.log(`任务数量: ${data.tasks.length}`);