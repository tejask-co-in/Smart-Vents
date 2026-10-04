import React, { useState } from 'react';
import { Vent } from '../../types/vent';
import { PieChart, Download } from 'lucide-react';

interface CategoryDistributionChartProps {
  vents: Vent[];
}

export const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({ vents }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const activeVents = vents.filter((v) => !v.deleted && !v.archived);
  const total = activeVents.length;

  if (total === 0) return null;

  // Aggregate by main classification
  const counts: Record<string, { count: number; color: string }> = {
    Task: { count: 0, color: '#6366f1' },
    'Future idea': { count: 0, color: '#f59e0b' },
    Reference: { count: 0, color: '#10b981' },
    Note: { count: 0, color: '#0284c7' },
    Technical: { count: 0, color: '#ec4899' },
    Thought: { count: 0, color: '#8b5cf6' },
    Other: { count: 0, color: '#64748b' },
  };

  activeVents.forEach((v) => {
    if (counts[v.type]) {
      counts[v.type].count++;
    } else {
      counts['Other'].count++;
    }
  });

  const categories = Object.entries(counts).filter(([_, data]) => data.count > 0);
  const radius = 70;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const segments = categories.map(([name, data]) => {
    const fraction = data.count / total;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += fraction * circumference;

    return {
      name,
      count: data.count,
      percentage: Math.round(fraction * 100),
      color: data.color,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="rounded-2xl app-card app-border p-4 sm:p-5 flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold app-text-main flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-500" />
            <span>Dump Distribution Diagram</span>
          </h3>
          <p className="text-xs app-text-muted mt-0.5">
            Breakdown of thought classifications discovered across your archive.
          </p>
        </div>
        <span className="text-xs font-mono app-text-muted tabular-nums">
          {total} total items
        </span>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-around gap-6 pt-2">
        {/* SVG Donut Visual */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
            {/* Background track */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {segments.map((seg) => (
              <circle
                key={seg.name}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={activeCategory === seg.name ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setActiveCategory(seg.name)}
                onMouseLeave={() => setActiveCategory(null)}
              />
            ))}
          </svg>

          {/* Center Info */}
          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
            {activeCategory ? (
              <>
                <span className="text-lg font-mono font-bold app-text-main tabular-nums">
                  {segments.find((s) => s.name === activeCategory)?.percentage}%
                </span>
                <span className="text-[10px] app-text-muted font-medium">
                  {activeCategory}
                </span>
              </>
            ) : (
              <>
                <span className="text-xl font-mono font-bold app-text-main tabular-nums">
                  {total}
                </span>
                <span className="text-[10px] app-text-muted font-mono">Dumps</span>
              </>
            )}
          </div>
        </div>

        {/* Legend and Bar Breakdown */}
        <div className="flex-1 w-full space-y-2.5">
          {segments.map((seg) => (
            <div
              key={seg.name}
              onMouseEnter={() => setActiveCategory(seg.name)}
              onMouseLeave={() => setActiveCategory(null)}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activeCategory === seg.name
                  ? 'app-subtle border app-border'
                  : 'hover:opacity-90'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="font-medium app-text-main">{seg.name}</span>
                </div>
                <div className="flex items-center gap-3 app-text-muted font-mono text-[11px]">
                  <span>{seg.count} dumps</span>
                  <span className="app-text-main font-medium">{seg.percentage}%</span>
                </div>
              </div>

              {/* Progress gauge bar */}
              <div className="mt-1.5 w-full h-1.5 rounded-full app-subtle overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${seg.percentage}%`, backgroundColor: seg.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
