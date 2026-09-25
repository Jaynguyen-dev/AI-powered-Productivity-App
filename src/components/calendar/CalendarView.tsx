import React, { useState, useMemo } from 'react';
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
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  tasks,
  projects,
  onOpenNaturalLanguageModal,
  onOpenCreateEventModal,
  onEditEvent,
  onToggleTaskComplete,
}) => {
  // Current view mode: day, week, month
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  // Anchor date: default to 2026-09-19
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showTaskDeadlines, setShowTaskDeadlines] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  const getCategoryColorBadge = (cat: string) => {
    switch (cat) {
      case 'meeting':
        return 'border-blue-500/40 bg-blue-950/60 text-blue-300';
      case 'study':
        return 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300';
      case 'deep_work':
        return 'border-blue-500/40 bg-blue-950/60 text-blue-300';
      case 'personal':
        return 'border-red-500/40 bg-amber-950/60 text-amber-300';
      case 'review':
        return 'border-blue-500/40 bg-pink-950/60 text-pink-300';
      default:
        return 'border-slate-500/40 bg-white/10 text-white/80';
    }
  };

  return (
    <div className="space-y-5">
      {/* Calendar Top Control Header */}
      <GlassCard className="p-4 sm:p-5 flex flex-col gap-4">
        {/* Top Row: Navigation and Main Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Left: Navigation and Date */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl bg-black/20 border border-white/10 p-1">
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
            <div className="flex items-center rounded-xl bg-black/20 border border-white/10 p-1">
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
          <div className="flex items-center rounded-xl bg-black/20 border border-white/10 p-1 text-sm text-white/80">
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
        <GlassCard className="p-6 sm:p-6 overflow-x-auto">
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
                      className="px-2.5 py-1 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-300 text-sm font-medium flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      {task.title.substring(0, 24)}...
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="relative min-w-[500px]">
            {hours.map((hour) => {
              const hourStr = `${formatZero(hour)}:00`;
              const dayEvents = filteredEvents.filter(
                (e) => e.startDate === formatDateString(currentDate) && parseInt(e.startTime.split(':')[0], 10) === hour
              );

              return (
                <div key={hour} className={`flex items-start ${hour === 0 ? "" : "border-t border-white/40"} py-3 group hover:bg-white/[0.02] transition-colors`}>
                  <span className="w-16 text-sm text-white/60 font-mono flex-shrink-0 select-none">
                    {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </span>
                  <div className="flex-1 min-h-[44px] flex flex-wrap gap-2">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => onEditEvent(evt)}
                        className={`p-2.5 rounded-xl border ${getCategoryColorBadge(
                          evt.category
                        )} shadow-md backdrop-blur-md cursor-pointer hover:brightness-110 transition-all flex-1 min-w-[200px]`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-white">{evt.title}</h4>
                          <span className="text-[11px] font-mono text-white/80 opacity-80">
                            {evt.startTime} – {evt.endTime}
                          </span>
                        </div>
                        {evt.description && <p className="text-[11px] text-white/80 mt-1 line-clamp-1">{evt.description}</p>}
                        {evt.sourceText && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-300/80 mt-1">
                            <Sparkles className="w-2.5 h-2.5" /> NLP scheduled
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* VIEW: WEEK VIEW */}
      {viewMode === 'week' && (
        <GlassCard className="p-3 sm:p-6 overflow-x-auto">
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

            {/* Week Grid Rows */}
            <div className="space-y-1 pt-2">
              {hours.map((hour) => (
                <div key={hour} className={`grid grid-cols-8 gap-2 ${hour === 0 ? "" : "border-t border-white/40"} py-2 items-start min-h-[50px]`}>
                  <span className="text-[11px] text-white/60 font-mono select-none pt-1">
                    {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </span>

                  {weekDays.map((d, dayIdx) => {
                    const dateStr = formatDateString(d);
                    const matchingEvents = filteredEvents.filter(
                      (e) => e.startDate === dateStr && parseInt(e.startTime.split(':')[0], 10) === hour
                    );

                    // Tasks due in this hour or day
                    const matchingTasks = showTaskDeadlines
                      ? tasks.filter(
                          (t) =>
                            t.dueDate === dateStr &&
                            t.status !== 'completed' &&
                            (t.dueTime ? parseInt(t.dueTime.split(':')[0], 10) === hour : hour === 17)
                        )
                      : [];

                    return (
                      <div key={dayIdx} className="min-h-[38px] flex flex-col gap-1">
                        {matchingEvents.map((evt) => (
                          <div
                            key={evt.id}
                            onClick={() => onEditEvent(evt)}
                            className={`p-1.5 rounded-lg border text-left cursor-pointer transition-all hover:scale-[1.02] ${getCategoryColorBadge(
                              evt.category
                            )}`}
                            title={`${evt.title} (${evt.startTime}-${evt.endTime})`}
                          >
                            <span className="block text-[11px] font-semibold text-white truncate leading-tight">
                              {evt.title}
                            </span>
                            <span className="block text-[9px] font-mono opacity-80 mt-0.5">
                              {evt.startTime}
                            </span>
                          </div>
                        ))}

                        {matchingTasks.map((t) => (
                          <div
                            key={t.id}
                            className="p-1 rounded-md bg-blue-950/40 border border-blue-500/30 text-[10px] text-blue-300 flex items-center gap-1 font-medium truncate"
                            title={`Task Deadline: ${t.title}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                            <span className="truncate">{t.title}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      {/* VIEW: MONTH VIEW */}
      {viewMode === 'month' && (
        <GlassCard className="p-3 sm:p-6">
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
                      className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                        isToday
                          ? 'bg-blue-950/40 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                          : isCurrentMonth
                          ? 'bg-white/60 border-white/40 hover:bg-white/[0.04]'
                          : 'bg-white/10 border-transparent opacity-40 hover:opacity-70'
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
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate border ${getCategoryColorBadge(
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
