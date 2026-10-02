import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEvent, CalendarViewMode, Task, Project } from '../../types';
import { GlassCard } from '../common/GlassCard';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';

interface CalendarViewProps {
  events: CalendarEvent[];
  tasks: Task[];
  projects: Project[];
  onOpenNaturalLanguageModal: () => void;
  onOpenCreateEventModal: (defaultDate?: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onToggleTaskComplete?: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  onUpdateEvent?: (updatedEvent: CalendarEvent) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  tasks,
  projects,
  onOpenNaturalLanguageModal,
  onOpenCreateEventModal,
  onEditEvent,
  onToggleTaskComplete,
  onEditTask,
}) => {
  // Current view mode: day, week, month
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  // Anchor date: default to 2026-09-19
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showTaskDeadlines, setShowTaskDeadlines] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [dragState, setDragState] = useState<{
    eventId: string;
    type: 'move' | 'resize-top' | 'resize-bottom';
    pointerId: number;
    initialStartMins: number;
    initialEndMins: number;
    initialDate: string;
    startY: number;
    startX: number;
    colWidth: number;
    currentDateStr: string;
    currentStartMins: number;
    currentEndMins: number;
    hasMoved: boolean;
  } | null>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dragState) return;
    
    const handleGlobalPointerMove = (e: PointerEvent) => {
      // Create a synthetic-like event for our existing handlePointerMove
      handlePointerMove(e as unknown as React.PointerEvent);
    };
    
    const handleGlobalPointerUp = (e: PointerEvent) => {
      handlePointerUp(e as unknown as React.PointerEvent);
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [dragState]);


  
  const formatMinsToTime = (mins: number) => {
    mins = Math.max(0, Math.min(1440, mins));
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handlePointerDown = (e: React.PointerEvent, event: CalendarEvent, type: 'move' | 'resize-top' | 'resize-bottom') => {
    e.stopPropagation();
    if (e.button !== 0) return;
    
    // Use global window events for capturing drag
    
    const startMins = parseTimeToMins(event.startTime);
    const endMins = parseTimeToMins(event.endTime);
    
    // Estimate column width based on container for week view
    let colW = 0;
    if (containerRef.current && viewMode === 'week') {
       colW = (containerRef.current.getBoundingClientRect().width * 0.125);
    }
    
    setDragState({
      eventId: event.id,
      type,
      pointerId: e.pointerId,
      initialStartMins: startMins,
      initialEndMins: endMins,
      initialDate: event.startDate,
      startY: e.clientY,
      startX: e.clientX,
      colWidth: colW,
      currentDateStr: event.startDate,
      currentStartMins: startMins,
      currentEndMins: endMins,
      hasMoved: false
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    
    const deltaY = e.clientY - dragState.startY;
    const deltaMins = Math.round(deltaY / 15) * 15; // snap to 15 mins
    
    let newStart = dragState.initialStartMins;
    let newEnd = dragState.initialEndMins;
    let newDateStr = dragState.currentDateStr;
    
    if (dragState.type === 'move') {
       newStart += deltaMins;
       newEnd += deltaMins;
       
       if (viewMode === 'week' && dragState.colWidth > 0) {
         const deltaX = e.clientX - dragState.startX;
         const colShift = Math.round(deltaX / dragState.colWidth);
         
         if (colShift !== 0) {
           const initialDateObj = new Date(dragState.initialDate + 'T12:00:00');
           initialDateObj.setDate(initialDateObj.getDate() + colShift);
           
           const startOfWeek = new Date(currentDate);
           startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
           const endOfWeek = new Date(startOfWeek);
           endOfWeek.setDate(endOfWeek.getDate() + 6);
           
           if (initialDateObj >= startOfWeek && initialDateObj <= endOfWeek) {
             const yyyy = initialDateObj.getFullYear();
             const mm = formatZero(initialDateObj.getMonth() + 1);
             const dd = formatZero(initialDateObj.getDate());
             newDateStr = `${yyyy}-${mm}-${dd}`;
           }
         }
       }
    } else if (dragState.type === 'resize-top') {
       newStart = Math.min(newStart + deltaMins, newEnd - 15);
    } else if (dragState.type === 'resize-bottom') {
       newEnd = Math.max(newEnd + deltaMins, newStart + 15);
    }
    
    // Clamp to day bounds
    if (newStart < 0) {
       newEnd -= newStart; 
       newStart = 0;
    }
    if (newEnd > 1440) {
       newStart -= (newEnd - 1440);
       newEnd = 1440;
    }
    
    if (newStart !== dragState.currentStartMins || newEnd !== dragState.currentEndMins || newDateStr !== dragState.currentDateStr) {
      setDragState(prev => prev ? {
        ...prev,
        currentStartMins: newStart,
        currentEndMins: newEnd,
        currentDateStr: newDateStr,
        hasMoved: true
      } : null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState) return;
    
    if (dragState.hasMoved && onUpdateEvent) {
      const originalEvent = events.find(ev => ev.id === dragState.eventId);
      if (originalEvent) {
         const startDateObj = new Date(originalEvent.startDate + 'T12:00:00');
         const endDateObj = new Date(originalEvent.endDate + 'T12:00:00');
         const diffTime = endDateObj.getTime() - startDateObj.getTime();
         
         const newStartDateObj = new Date(dragState.currentDateStr + 'T12:00:00');
         const newEndDateObj = new Date(newStartDateObj.getTime() + diffTime);
         
         const yyyy = newEndDateObj.getFullYear();
         const mm = formatZero(newEndDateObj.getMonth() + 1);
         const dd = formatZero(newEndDateObj.getDate());
         
         onUpdateEvent({
           ...originalEvent,
           startDate: dragState.currentDateStr,
           endDate: `${yyyy}-${mm}-${dd}`,
           startTime: formatMinsToTime(dragState.currentStartMins),
           endTime: formatMinsToTime(dragState.currentEndMins)
         });
      }
    }
    
    
    
    // Delay nulling out dragState slightly so onClick doesn't fire immediately
    setTimeout(() => {
      setDragState(null);
    }, 50);
  };


  const formatZero = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatDateString = (d: Date) =>
    `${d.getFullYear()}-${formatZero(d.getMonth() + 1)}-${formatZero(d.getDate())}`;

  // Helper date calculations
  const todayStr = formatDateString(new Date());

  // Navigate calendar
  const handlePrev = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'day') {
      nextDate.setDate(nextDate.getDate() - 1);
    } else if (viewMode === 'week') {
      nextDate.setDate(nextDate.getDate() - 7);
    } else {
      nextDate.setMonth(nextDate.getMonth() - 1);
    }
    setCurrentDate(nextDate);
  };

  const handleNext = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'day') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (viewMode === 'week') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    setCurrentDate(nextDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Header Title
  const headerTitle = useMemo(() => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    if (viewMode === 'month') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    // Week
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    return `${monthNames[startOfWeek.getMonth()]} ${startOfWeek.getDate()} – ${
      startOfWeek.getMonth() !== endOfWeek.getMonth() ? monthNames[endOfWeek.getMonth()] + ' ' : ''
    }${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
  }, [currentDate, viewMode]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'all') return events;
    return events.filter((e) => e.category === selectedCategory);
  }, [events, selectedCategory]);

  // Week days
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay(); // 0 is Sunday
    startOfWeek.setDate(startOfWeek.getDate() - day);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Month days
  const monthMatrix = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const matrix: Date[][] = [];
    let currentWeek: Date[] = [];

    // Fill days before the 1st of month from previous month
    const startOffset = firstDay.getDay();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      currentWeek.push(new Date(year, month - 1, prevMonthLastDay - i));
    }

    // Fill days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      currentWeek.push(new Date(year, month, day));
      if (currentWeek.length === 7) {
        matrix.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill remaining days of last week
    if (currentWeek.length > 0) {
      let nextMonthDay = 1;
      while (currentWeek.length < 7) {
        currentWeek.push(new Date(year, month + 1, nextMonthDay++));
      }
      matrix.push(currentWeek);
    }

    return matrix;
  }, [currentDate]);

  // Hours array for Day and Week grid (0:00 to 23:00)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const parseTimeToMins = (tStr: string) => {
    if (!tStr) return 0;
    const [h, m] = tStr.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const getMonthCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'deep_work': return 'bg-blue-950/80 border-blue-800/50 text-blue-300';
      case 'meeting': return 'bg-purple-950/80 border-purple-800/50 text-purple-300';
      case 'study': return 'bg-cyan-950/80 border-cyan-800/50 text-cyan-300';
      case 'personal': return 'bg-emerald-950/80 border-emerald-800/50 text-emerald-300';
      case 'deadline': return 'bg-rose-950/80 border-rose-800/50 text-rose-300';
      case 'review': return 'bg-amber-950/80 border-amber-800/50 text-amber-300';
      default: return 'bg-slate-800/80 border-slate-600/50 text-slate-300';
    }
  };

  const getCategoryColorBadge = (cat: string) => {
    switch (cat) {
      case 'deep_work': return 'bg-blue-500/10 border-blue-500/20 text-blue-300';
      case 'meeting': return 'bg-purple-500/10 border-purple-500/20 text-purple-300';
      case 'study': return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300';
      case 'personal': return 'bg-green-500/10 border-green-500/20 text-green-300';
      case 'deadline': return 'bg-rose-500/10 border-rose-500/20 text-rose-300';
      case 'review': return 'bg-orange-500/10 border-orange-500/20 text-orange-300';
      default: return 'bg-white/10 border-white/20 text-white/80';
    }
  };

  const getTaskColorBadge = (priority: string) => {
    if (priority === "high") return "bg-rose-500/10 border border-rose-500/30 text-rose-300";
    if (priority === "medium") return "bg-amber-500/10 border border-amber-500/30 text-amber-300";
    return "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300";
  };
  const getTaskDotColor = (priority: string) => {
    if (priority === "high") return "bg-rose-400";
    if (priority === "medium") return "bg-amber-400";
    return "bg-emerald-400";
  };

  return (
    <div className="space-y-5">
      {/* Calendar Top Control Header */}
      <GlassCard className="p-4 sm:p-5 flex flex-col gap-4">
        {/* Top Row: Navigation and Main Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Left: Navigation and Date */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl bg-black/10 border border-white/10 p-1">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous period"
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-3 py-1 text-sm font-semibold text-white hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next period"
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{headerTitle}</h2>
          </div>

          {/* Right: View Mode Toggle & Add Actions */}
          <div className="flex items-center gap-3">
            {/* View Mode Buttons */}
            <div className="flex items-center rounded-xl bg-black/10 border border-white/10 p-1">
              {(['day', 'week', 'month'] as CalendarViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-sm font-medium rounded-lg capitalize transition-all cursor-pointer ${
                    viewMode === mode
                      ? 'bg-blue-500 text-white shadow-md font-semibold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Natural Language Button */}
            <button
              type="button"
              id="btn-open-nl-schedule"
              onClick={onOpenNaturalLanguageModal}
              className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Smart Schedule</span>
            </button>

            {/* Manual Add Event Button */}
            <button
              type="button"
              id="btn-manual-add-event"
              onClick={() => onOpenCreateEventModal(formatDateString(currentDate))}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white hover:text-white border border-white/10 text-sm font-semibold flex items-center justify-center transition-all cursor-pointer"
              title="Create Event Manually"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bottom Row: Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/10">
          {/* Category Filter */}
          <div className="flex items-center rounded-xl bg-black/10 border border-white/10 p-1 text-sm text-white/80">
            <Filter className="w-3.5 h-3.5 ml-2 text-white/60" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent px-2 py-1 text-sm text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-black/80">All Categories</option>
              <option value="meeting" className="bg-black/80">Meetings</option>
              <option value="deep_work" className="bg-black/80">Deep Work</option>
              <option value="study" className="bg-black/80">Study</option>
              <option value="personal" className="bg-black/80">Personal</option>
            </select>
          </div>

          {/* Toggle Task Deadlines */}
          <button
            type="button"
            onClick={() => setShowTaskDeadlines(!showTaskDeadlines)}
            className={`px-3 py-1.5 rounded-xl border text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              showTaskDeadlines
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
            }`}
            title="Toggle showing task deadlines directly inside the calendar"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Task Deadlines</span>
          </button>
        </div>
      </GlassCard>

      {/* VIEW: DAY VIEW */}
      {viewMode === 'day' && (
        <GlassCard className="p-5 sm:p-5 overflow-x-auto">
          {/* Day Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/40 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-bold border ${
                  formatDateString(currentDate) === todayStr
                    ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-white/10 border-white/40 text-white'
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider font-semibold">
                  {currentDate.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-base">{currentDate.getDate()}</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <p className="text-sm text-white/60">
                  {filteredEvents.filter((e) => e.startDate === formatDateString(currentDate)).length} scheduled activities
                </p>
              </div>
            </div>

            {/* Tasks with deadlines today */}
            {showTaskDeadlines && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-white/60">Due Today:</span>
                {tasks
                  .filter((t) => t.dueDate === formatDateString(currentDate) && t.status !== 'completed')
                  .map((task) => (
                    <span
                      key={task.id}
                      onClick={() => onEditTask?.(task)}
                      className={`px-2.5 py-1 rounded-lg ${getTaskColorBadge(task.priority)} text-sm font-medium flex items-center gap-1 cursor-pointer hover:brightness-110 transition-all`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${getTaskDotColor(task.priority)}`} />
                      {task.title.substring(0, 24)}...
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Absolute Timeline */}
          <div ref={containerRef}  className="relative min-w-[500px] h-[1440px] mt-4 mb-8 bg-white/[0.02] rounded-xl border border-white/10 touch-none">
            {hours.map((hour) => (
              <div key={hour} className="absolute w-full flex items-center pointer-events-none" style={{ top: `${hour * 60}px`, height: '0px', marginTop: '-6px' }}>
                <span className="w-16 text-[11px] text-white/40 font-mono flex-shrink-0 select-none pl-2 leading-none">
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : hour === 0 ? '' : `${hour} AM`}
                </span>
                {hour !== 0 && <div className="flex-1 border-t border-white/10"></div>}
              </div>
            ))}
            
            {filteredEvents.flatMap(evt => {
                if (dragState && dragState.eventId === evt.id) {
                   return [{
                      ...evt,
                      sMins: dragState.currentStartMins,
                      eMins: dragState.currentEndMins,
                      startTime: formatMinsToTime(dragState.currentStartMins),
                      endTime: formatMinsToTime(dragState.currentEndMins),
                      segIdx: 0
                   }];
                }
                return getEventSegmentsForDate(evt, formatDateString(currentDate)).map((seg, idx) => ({ ...evt, ...seg, segIdx: idx }));
             }).map((evt) => { 
                const isDragging = dragState?.eventId === evt.id;
                const height = Math.max(evt.eMins - evt.sMins, 25);
                
                return (
                  <div
                    key={`${evt.id}-${evt.segIdx}`} onPointerDown={(e) => handlePointerDown(e, evt as CalendarEvent, 'move')}
                    onClick={() => { if (!dragState?.hasMoved) onEditEvent(evt as CalendarEvent); }}
                    className={`absolute left-16 right-4 rounded-xl border ${getCategoryColorBadge(
                      evt.category
                    )} shadow-md backdrop-blur-md cursor-pointer hover:brightness-110 transition-all p-2 overflow-hidden`}
                    style={{ top: `${evt.sMins}px`, height: `${height}px` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-white truncate">{evt.title}</h4>
                      <span className="text-[11px] font-mono text-white/80 opacity-80 flex-shrink-0">
                        {evt.startTime} - {evt.endTime}
                      </span>
                    </div>
                    {height >= 45 && evt.description && <p className="text-[11px] text-white/80 mt-1 line-clamp-1 truncate">{evt.description}</p>}
                    <div 
                      className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 hover:opacity-100 bg-white/20"
                      onPointerDown={(e) => handlePointerDown(e, evt as CalendarEvent, 'resize-top')}
                    />
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 hover:opacity-100 bg-white/20"
                      onPointerDown={(e) => handlePointerDown(e, evt as CalendarEvent, 'resize-bottom')}
                    />
                  </div>
                );
            })}
          </div>
        </GlassCard>
      )}

      {/* VIEW: WEEK VIEW */}
      {viewMode === 'week' && (
        <GlassCard className="p-3 sm:p-5 overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Week Header Row */}
            <div className="grid grid-cols-8 gap-2 pb-3 border-b border-white/40 text-center">
              <div className="text-sm text-white/50 font-mono pt-3">GMT-7</div>
              {weekDays.map((d, i) => {
                const isToday = formatDateString(d) === todayStr;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      setCurrentDate(d);
                      setViewMode('day');
                    }}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                      isToday
                        ? 'bg-blue-500/30 border-blue-500/50 shadow-sm'
                        : 'bg-white/[0.02] border-white/40 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="block text-[11px] font-medium text-white/60 uppercase">
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className={`text-base font-bold ${isToday ? 'text-blue-300' : 'text-white'}`}>
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
            </div>

            {/* Week Grid Rows - Absolute Timeline */}
            <div ref={containerRef}  className="relative h-[1440px] mt-4 mb-4 bg-white/[0.01] rounded-xl border border-white/5 touch-none">
              {/* Background grid lines and labels */}
              {hours.map((hour) => (
                <div key={hour} className="absolute w-full flex items-center pointer-events-none" style={{ top: `${hour * 60}px`, height: '0px', marginTop: '-6px' }}>
                  <span className="w-[12.5%] text-[10px] text-white/40 font-mono flex-shrink-0 select-none text-center leading-none">
                    {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : hour === 0 ? '' : `${hour} AM`}
                  </span>
                  {hour !== 0 && <div className="flex-1 border-t border-white/10"></div>}
                </div>
              ))}

              {/* Events and Tasks mapped absolutely */}
              {weekDays.map((d, dayIdx) => {
                const dateStr = formatDateString(d);
                const matchingEvents = filteredEvents.filter(e => e.startDate === dateStr);
                const matchingTasks = showTaskDeadlines ? tasks.filter(t => t.dueDate === dateStr && t.status !== 'completed') : [];
                
                const leftPercent = 12.5 + (dayIdx * 12.5);

                return (
                  <React.Fragment key={dayIdx}>
                    {/* Events */}
                    {filteredEvents.flatMap(evt => {
                      if (dragState && dragState.eventId === evt.id) {
                         if (dateStr === dragState.currentDateStr) {
                           return [{
                             ...evt,
                             sMins: dragState.currentStartMins,
                             eMins: dragState.currentEndMins,
                             startTime: formatMinsToTime(dragState.currentStartMins),
                             endTime: formatMinsToTime(dragState.currentEndMins),
                             segIdx: 0
                           }];
                         } else {
                           return []; // hide original event if moved to another day
                         }
                      }
                      return getEventSegmentsForDate(evt, dateStr).map((seg, idx) => ({ ...evt, ...seg, segIdx: idx }));
                    }).map((evt) => { 
                      const isDragging = dragState?.eventId === evt.id;
                      const height = Math.max(evt.eMins - evt.sMins, 20);

                      return (
                        <div
                          key={`${evt.id}-${evt.segIdx}`} onPointerDown={(e) => handlePointerDown(e, evt as CalendarEvent, 'move')}
                          onClick={() => { if (!dragState?.hasMoved) onEditEvent(evt as CalendarEvent); }}
                          className={`absolute p-1.5 rounded-lg border cursor-pointer hover:scale-[1.02] transition-all overflow-hidden shadow-md backdrop-blur-md ${getCategoryColorBadge(evt.category)}`}
                          style={{ 
                            top: `${evt.sMins}px`, 
                            height: `${height}px`,
                            left: `calc(${leftPercent}% + 4px)`,
                            width: `calc(12.5% - 8px)`
                          }}
                          title={`${evt.title} (${evt.startTime}-${evt.endTime})`}
                        >
                          <span className="block text-[10px] font-semibold text-white truncate leading-tight">
                            {evt.title}
                          </span>
                          {height >= 35 && (
                             <span className="block text-[9px] font-mono opacity-80 mt-0.5 truncate">
                               {evt.startTime} - {evt.endTime}
                             </span>
                           )}
                           <div 
                             className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 hover:opacity-100 bg-white/20"
                             onPointerDown={(e) => handlePointerDown(e, evt as CalendarEvent, 'resize-top')}
                           />
                           <div 
                             className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 hover:opacity-100 bg-white/20"
                             onPointerDown={(e) => handlePointerDown(e, evt as CalendarEvent, 'resize-bottom')}
                           />
                        </div>
                      );
                    })}
                    
                    {/* Tasks */}
                    {matchingTasks.map((t, tIdx) => {
                      const startMins = t.dueTime ? parseTimeToMins(t.dueTime) : (17 * 60 + (tIdx * 25)); // Default to 5 PM if no time
                      return (
                        <div
                          key={t.id}
                          onClick={(e) => { e.stopPropagation(); onEditTask?.(t); }}
                          className={`absolute p-1 rounded-md ${getTaskColorBadge(t.priority)} text-[9px] flex items-center gap-1 font-medium truncate cursor-pointer hover:brightness-110 transition-all shadow-md z-10`}
                          style={{ 
                            top: `${startMins}px`,
 height: '22px',
                            left: `calc(${leftPercent}% + 8px)`,
                            width: `calc(12.5% - 16px)`
                          }}
                          title={`Task Deadline: ${t.title}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${getTaskDotColor(t.priority)} flex-shrink-0`} />
                          <span className="truncate">{t.title}</span>
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
          </div>
        </GlassCard>
      )}

      {/* VIEW: MONTH VIEW */}
      {viewMode === 'month' && (
        <GlassCard className="p-3 sm:p-5">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 pb-2 text-center text-sm font-semibold text-white/60">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Month Matrix */}
          <div className="space-y-1 sm:space-y-2">
            {monthMatrix.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-cols-7 gap-1 sm:gap-2">
                {week.map((dateObj, dIdx) => {
                  const dateStr = formatDateString(dateObj);
                  const isCurrentMonth = dateObj.getMonth() === currentDate.getMonth();
                  const isToday = dateStr === todayStr;
                  const dayEvents = filteredEvents.filter((e) => e.startDate === dateStr);
                  const dayTasks = showTaskDeadlines ? tasks.filter((t) => t.dueDate === dateStr) : [];

                  return (
                    <div
                      key={dIdx}
                      onClick={() => {
                        setCurrentDate(dateObj);
                        setViewMode('day');
                      }}
                      className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-[16px] border flex flex-col justify-between transition-all cursor-pointer ${
                        isToday
                          ? 'bg-blue-950/40 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                          : isCurrentMonth
                          ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08]'
                          : 'bg-white/[0.01] border-white/5 opacity-40 hover:opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-lg ${
                            isToday ? 'bg-blue-500 text-white' : 'text-white/80'
                          }`}
                        >
                          {dateObj.getDate()}
                        </span>
                        {dayTasks.length > 0 && (
                          <span
                            className="text-[10px] px-1.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-500/30 font-semibold"
                            title={`${dayTasks.length} task(s) due`}
                          >
                            {dayTasks.length}
                          </span>
                        )}
                      </div>

                      {/* Event chips */}
                      <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                        {dayEvents.slice(0, 2).map((e) => (
                          <div
                            key={e.id}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold truncate border ${getMonthCategoryBadge(
                              e.category
                            )}`}
                          >
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[10px] text-white/60 font-medium pl-1">
                            +{dayEvents.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};


export const parseTimeToMinsHelper = (tStr: string) => {
  if (!tStr) return 0;
  const [h, m] = tStr.split(':').map(Number);
  return h * 60 + (m || 0);
};

export const getEventSegmentsForDate = (evt: any, dateStr: string) => {
  const startMins = parseTimeToMinsHelper(evt.startTime);
  const endMins = parseTimeToMinsHelper(evt.endTime);
  const crossesMidnight = endMins < startMins;
  
  const [y, m, d] = evt.startDate.split('-').map(Number);
  const startD = new Date(y, m - 1, d);
  startD.setDate(startD.getDate() + 1);
  const yStr = startD.getFullYear();
  const mStr = String(startD.getMonth() + 1).padStart(2, '0');
  const dStr = String(startD.getDate()).padStart(2, '0');
  const nextDateStr = `${yStr}-${mStr}-${dStr}`;

  if (evt.startDate === dateStr) {
    if (crossesMidnight) return [{ sMins: startMins, eMins: 1440 }];
    return [{ sMins: startMins, eMins: endMins }];
  } else if (crossesMidnight && nextDateStr === dateStr) {
    return [{ sMins: 0, eMins: endMins }];
  } else if (evt.endDate === dateStr && evt.endDate !== evt.startDate) {
    return [{ sMins: 0, eMins: endMins }];
  } else if (evt.endDate && dateStr > evt.startDate && dateStr < evt.endDate) {
    return [{ sMins: 0, eMins: 1440 }];
  }
  return [];
};
