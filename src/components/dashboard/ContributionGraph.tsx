import React, { useMemo, useState, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Task } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { Activity, Flame, Trophy, CheckCircle } from 'lucide-react';

interface ContributionGraphProps {
  tasks: Task[];
  onSelectDate?: (dateStr: string) => void;
}

const TooltipOverlay: React.FC<{ cell: { date: string; count: number; rect: DOMRect } }> = ({ cell }) => {
  const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!tooltipRef.current) return;
    const tt = tooltipRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const margin = 12;
    
    // Target cell center
    const cx = cell.rect.left + cell.rect.width / 2;

    let top = cell.rect.top - tt.height - 10;
    let isBottom = false;

    // Flip to bottom if too close to top
    if (top < margin) {
      top = cell.rect.bottom + 10;
      isBottom = true;
    }

    let left = cx - tt.width / 2;
    let arrowLeft = '50%';
    
    // Shift right if too close to left edge
    if (left < margin) {
      const shift = margin - left;
      left = margin;
      arrowLeft = `calc(50% - ${shift}px)`;
    } 
    // Shift left if too close to right edge
    else if (left + tt.width > vw - margin) {
      const shift = (left + tt.width) - (vw - margin);
      left = vw - margin - tt.width;
      arrowLeft = `calc(50% + ${shift}px)`;
    }

    setStyle({
      position: 'fixed',
      top,
      left,
      opacity: 1,
      zIndex: 999999,
      pointerEvents: 'none'
    });

    if (isBottom) {
      setArrowStyle({
        top: -4,
        left: arrowLeft,
        transform: 'translateX(-50%) rotate(45deg)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderLeft: '1px solid rgba(255,255,255,0.1)'
      });
    } else {
      setArrowStyle({
        bottom: -4,
        left: arrowLeft,
        transform: 'translateX(-50%) rotate(45deg)',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      });
    }
  }, [cell]);

  return (
    <div 
      ref={tooltipRef}
      className="fixed px-3.5 py-2.5 rounded-xl bg-slate-900/98 border border-white/10 shadow-2xl backdrop-blur-2xl transition-opacity duration-150 animate-in fade-in zoom-in-95"
      style={style}
    >
      <p className="text-xs font-bold text-white whitespace-nowrap drop-shadow-md">
        {new Date(cell.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
      <p className="text-[11px] font-medium text-emerald-400 mt-0.5 whitespace-nowrap">
        {cell.count} {cell.count === 1 ? 'task' : 'tasks'} completed
      </p>
      <div 
        className="absolute w-2.5 h-2.5 bg-slate-900/98" 
        style={arrowStyle} 
      />
    </div>
  );
};

export const ContributionGraph: React.FC<ContributionGraphProps> = ({ tasks, onSelectDate }) => {
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; rect: DOMRect } | null>(null);

  // 1. Process tasks to get daily counts
  const { counts, stats } = useMemo(() => {
    const countsMap: Record<string, number> = {};
    tasks.forEach(t => {
      if (t.status === 'completed') {
        const dateString = t.completedAt || t.dueDate || t.createdAt;
        if (dateString) {
          const dateOnly = dateString.split('T')[0];
          countsMap[dateOnly] = (countsMap[dateOnly] || 0) + 1;
        }
      }
    });

    const activeDates = Object.keys(countsMap).sort();
    
    let currentStreak = 0;
    let longestStreak = 0;
    let total = 0;

    if (activeDates.length > 0) {
      let current = 1;
      let max = 1;
      total += countsMap[activeDates[0]];

      for (let i = 1; i < activeDates.length; i++) {
        total += countsMap[activeDates[i]];
        
        const d1 = new Date(activeDates[i - 1]);
        const d2 = new Date(activeDates[i]);
        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);
        
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays === 1) {
          current++;
          if (current > max) max = current;
        } else {
          current = 1;
        }
      }
      
      longestStreak = max;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastActive = new Date(activeDates[activeDates.length - 1]);
      lastActive.setHours(0, 0, 0, 0);
      const daysSinceLastActive = Math.ceil(Math.abs(today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastActive <= 1) {
        currentStreak = current;
      } else {
        currentStreak = 0;
      }
    }

    return { 
      counts: countsMap, 
      stats: { total, activeDays: activeDates.length, currentStreak, longestStreak } 
    };
  }, [tasks]);

  // 2. Generate Grid (past 52 weeks)
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const start = new Date(today);
    start.setDate(today.getDate() - 364);
    start.setDate(start.getDate() - start.getDay()); // shift to Sunday

    const generatedWeeks: { date: string; count: number; month: number }[][] = [];
    let currentWeek: { date: string; count: number; month: number }[] = [];
    
    const iterDate = new Date(start);
    while (iterDate <= today) {
      const dateStr = iterDate.toISOString().split('T')[0];
      currentWeek.push({
        date: dateStr,
        count: counts[dateStr] || 0,
        month: iterDate.getMonth()
      });
      
      if (currentWeek.length === 7 || iterDate.getTime() === today.getTime()) {
        generatedWeeks.push(currentWeek);
        currentWeek = [];
      }
      iterDate.setDate(iterDate.getDate() + 1);
    }

    const mLabels: { text: string; colIndex: number }[] = [];
    let lastMonth = -1;
    generatedWeeks.forEach((w, colIdx) => {
      const wMonth = w[0].month;
      if (wMonth !== lastMonth) {
        const monthName = new Date(w[0].date).toLocaleString('default', { month: 'short' });
        mLabels.push({ text: monthName, colIndex: colIdx });
        lastMonth = wMonth;
      }
    });

    return { weeks: generatedWeeks, monthLabels: mLabels };
  }, [counts]);

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-white/[0.08] border-white/10';
    if (count === 1) return 'bg-emerald-900/70 border-emerald-500/20';
    if (count === 2) return 'bg-emerald-700/80 border-emerald-500/30';
    if (count === 3) return 'bg-emerald-500 border-emerald-400/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
    return 'bg-emerald-400 border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.5)]';
  };

  return (
    <GlassCard className="p-6 relative">
      {hoveredCell && createPortal(<TooltipOverlay cell={hoveredCell} />, document.body)}

      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-500 uppercase tracking-wider mb-2">
            <Activity className="w-4 h-4" />
            <span>Activity Map</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Consistency</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 md:gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Total</span>
            <div className="flex items-center gap-1.5 mt-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-lg font-black text-white">{stats.total}</span>
            </div>
          </div>
          <div className="w-px h-8 bg-white/10 hidden md:block" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Active Days</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className="text-lg font-black text-white">{stats.activeDays}</span>
            </div>
          </div>
          <div className="w-px h-8 bg-white/10 hidden md:block" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Current Streak</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Flame className={`w-4 h-4 ${stats.currentStreak > 0 ? 'text-blue-500' : 'text-white/20'}`} />
              <span className="text-lg font-black text-white">{stats.currentStreak}</span>
            </div>
          </div>
          <div className="w-px h-8 bg-white/10 hidden md:block" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Longest</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-lg font-black text-white">{stats.longestStreak}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Area */}
      <div className="w-full overflow-x-auto hide-scrollbar cursor-default pb-2 relative">
        <div className="min-w-max pr-6">
          {/* Months */}
          <div className="flex relative h-5 mb-2 ml-8">
            {monthLabels.map((lbl, i) => (
              <span 
                key={i} 
                className="absolute text-[10px] font-bold text-white/60 uppercase tracking-widest"
                style={{ left: `${lbl.colIndex * 16}px` }}
              >
                {lbl.text}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            {/* Weekdays */}
            <div className="flex flex-col gap-1 text-[9px] font-bold text-white/50 uppercase tracking-widest w-6 text-right">
              <span className="h-[12px] flex items-center justify-end invisible">Sun</span>
              <span className="h-[12px] flex items-center justify-end">Mon</span>
              <span className="h-[12px] flex items-center justify-end invisible">Tue</span>
              <span className="h-[12px] flex items-center justify-end">Wed</span>
              <span className="h-[12px] flex items-center justify-end invisible">Thu</span>
              <span className="h-[12px] flex items-center justify-end">Fri</span>
              <span className="h-[12px] flex items-center justify-end invisible">Sat</span>
            </div>

            {/* Grid */}
            <div className="flex gap-1" onMouseLeave={() => setHoveredCell(null)}>
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((day, dIdx) => (
                    <div 
                      key={dIdx}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredCell({ date: day.date, count: day.count, rect });
                      }}
                      onClick={() => {
                         if (onSelectDate) onSelectDate(day.date);
                         setHoveredCell(null);
                      }}
                      className={`w-[12px] h-[12px] rounded-[3px] border transition-all duration-300 ${getColorClass(day.count)} ${onSelectDate ? 'cursor-pointer hover:scale-125 hover:z-10 relative' : ''}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-end gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider">
        <span>Less</span>
        <div className="flex gap-1 ml-1 mr-1">
          {[0, 1, 2, 3, 4].map(level => (
            <div key={level} className={`w-[12px] h-[12px] rounded-[3px] border ${getColorClass(level)}`} />
          ))}
        </div>
        <span>More</span>
      </div>

    </GlassCard>
  );
};