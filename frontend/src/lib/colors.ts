// Chart color palette - designed to be distinguishable and colorblind-friendly
const CHART_COLORS = [
  '#2563eb', // Blue
  '#dc2626', // Red
  '#16a34a', // Green
  '#9333ea', // Purple
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#c026d3', // Fuchsia
  '#ca8a04', // Yellow
  '#4f46e5', // Indigo
  '#be123c', // Rose
];

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export function getChartColors(count: number): string[] {
  return Array.from({ length: count }, (_, i) => getChartColor(i));
}
