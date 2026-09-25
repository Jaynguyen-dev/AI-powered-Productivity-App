import React from 'react';
import { CalendarEvent, Task, IdeaNode, Project, IdeaEdge } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { PriorityBadge } from '../common/PriorityBadge';
import { ContributionGraph } from './ContributionGraph';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Lightbulb,
  Folder,
  Circle,
  TrendingUp,
  AlertCircle,
  Plus,
  Bot,
  Mic,
  MessageSquare,
} from 'lucide-react';

interface DashboardOverviewProps {
  events: CalendarEvent[];
  tasks: Task[];
  ideas: IdeaNode[];
  edges: IdeaEdge[];
  projects: Project[];
  onNavigateTab: (tab: 'dashboard' | 'calendar' | 'tasks' | 'ideas' | 'projects') => void;
  onOpenNaturalLanguageModal: () => void;
  onOpenCreateTaskModal: () => void;
  onToggleTaskComplete: (taskId: string) => void;
  onQuickCaptureIdea?: (content: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectTask: (task: Task) => void;
  onOpenCopilot?: () => void;
  onOpenCopilotWithPrompt?: (prompt: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  events,
  tasks,
  ideas,
  edges,
  projects,
  onNavigateTab,
  onOpenNaturalLanguageModal,
  onOpenCreateTaskModal,
  onToggleTaskComplete,
  onQuickCaptureIdea,
  onSelectEvent,
  onSelectTask,
  onOpenCopilot,
  onOpenCopilotWithPrompt,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Events today
  const todayEvents = events
    .filter((e) => e.startDate === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // High & Medium active tasks
  const priorityTasks = tasks
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
    })
    .slice(0, 5);

  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const highPriorityCount = tasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Banner: Greeting & Quick Capture */}
      <GlassCard variant="elevated" className="p-6 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-500 uppercase tracking-wider">
              <span>Workspace Overview</span>
              <span>&bull;</span>
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white mt-1 tracking-tight">
              Lock in with Zen
            </h1>
            <p className="text-base sm:text-xl text-[#d4ba8a] mt-3 italic font-black leading-tight tracking-wide md:pr-4" style={{ textShadow: "0 0 15px rgba(212,186,138,0.5), 0 0 5px rgba(212,186,138,0.3)" }}>
              "{[
  'Focus on being productive instead of busy.',
  'The secret of getting ahead is getting started.',
  'Amateurs sit and wait for inspiration, the rest of us just get up and go to work.',
  'Your mind is for having ideas, not holding them.',
  'Productivity is never an accident. It is a commitment to excellence.',
  'Don\'t wait. The time will never be just right.',
  'Great acts are made up of small deeds.',
  'Action is the foundational key to all success.',
  'The key is not to prioritize what\'s on your schedule, but to schedule your priorities.',
  'You don\'t need a new plan for next year. You need a commitment.',
  'Focus on the step in front of you, not the whole staircase.',
  'What gets measured gets managed.'
][new Date().getHours() % 12]}"
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">

            <button
              type="button"
              onClick={onOpenNaturalLanguageModal}
              className="px-4 py-2.5 rounded-[16px] bg-white/5 hover:bg-white/10 text-white border border-white/15 text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"> <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Schedule Event</span>
            </button>

            <button
              type="button"
              onClick={onOpenCreateTaskModal}
              className="px-4 py-2.5 rounded-[16px] bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 border border-transparent text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"> <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* KPI Workload Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <GlassCard
          variant="interactive"
          onClick={() => onNavigateTab('calendar')}
          className="p-6 flex items-center justify-between"
        >
          <div>
            <span className="text-sm text-white/90 font-bold">Scheduled Today</span>
            <div className="text-4xl font-black text-white mt-1">{todayEvents.length}</div>
            <span className="text-[11px] text-blue-200/90 font-bold mt-0.5 inline-block">
              View day timeline &rarr;
            </span>
          </div>
          <div className="w-10 h-10 rounded-[16px] bg-blue-500/30 border border-blue-500/30 flex items-center justify-center text-blue-200 shadow-[0_0_15px_rgba(37,99,235,0.3)]"> <Calendar className="w-5 h-5" />
          </div>
        </GlassCard>

        <GlassCard
          variant="interactive"
          onClick={() => onNavigateTab('tasks')}
          className="p-6 flex items-center justify-between"
        >
          <div>
            <span className="text-sm text-rose-300 font-bold">High Priority</span>
            <div className="text-2xl font-bold text-rose-400 mt-1">{highPriorityCount}</div>
            <span className="text-[11px] text-rose-200/90 font-bold mt-0.5 inline-block">
              Urgent tasks &rarr;
            </span>
          </div>
          <div className="w-10 h-10 rounded-[16px] bg-rose-500/30 border border-rose-500/30 flex items-center justify-center text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)]"> <AlertCircle className="w-5 h-5" />
          </div>
        </GlassCard>

        <GlassCard
          variant="interactive"
          onClick={() => onNavigateTab('tasks')}
          className="p-6 flex items-center justify-between"
        >
          <div>
            <span className="text-sm text-emerald-400 font-bold">Completed Work</span>
            <div className="text-4xl font-black text-white mt-1">{completedTasksCount}</div>
            <span className="text-[11px] text-emerald-200/90 font-bold mt-0.5 inline-block">
              {Math.round((completedTasksCount / (tasks.length || 1)) * 100)}% progress &rarr;
            </span>
          </div>
          <div className="w-10 h-10 rounded-[16px] bg-emerald-500/30 border border-emerald-500/30 flex items-center justify-center text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]"> <CheckCircle2 className="w-5 h-5" />
          </div>
        </GlassCard>

        <GlassCard
          variant="interactive"
          onClick={() => onNavigateTab('ideas')}
          className="p-6 flex items-center justify-between"
        >
          <div>
            <span className="text-sm text-amber-400 font-bold">Knowledge Graph</span>
            <div className="text-4xl font-black text-white mt-1">{ideas.length}</div>
            <span className="text-[11px] text-amber-200/90 font-bold mt-0.5 inline-block">
              {edges.length} connections &rarr;
            </span>
          </div>
          <div className="w-10 h-10 rounded-[16px] bg-amber-500/30 border border-amber-500/30 flex items-center justify-center text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.3)]"> <Lightbulb className="w-5 h-5" />
          </div>
        </GlassCard>
      </div>

      {/* Activity Contribution Graph */}
      <ContributionGraph tasks={tasks} onSelectDate={(date) => {
        onNavigateTab('tasks');
      }} />

      {/* Main Dual Grid: Today's Schedule & Priority Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <GlassCard className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <h3 className="text-lg font-black text-white tracking-tight">Today's Schedule</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('calendar')}
                className="text-sm text-blue-500 hover:text-blue-500 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Full Calendar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 mt-3">
              {todayEvents.length === 0 ? (
                <p className="text-sm text-white/60 py-6 text-center italic">
                  No activities scheduled for today. Use natural-language scheduling to book focus time!
                </p>
              ) : (
                todayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => onSelectEvent(evt)}
                    className="p-3 rounded-[16px] bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2 py-1 rounded-lg bg-blue-950/80 border border-white/40 text-blue-500 text-sm font-mono font-bold">
                        {evt.startTime}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-base font-extrabold text-white group-hover:text-blue-500 transition-colors truncate">
                          {evt.title}
                        </h4>
                        <span className="text-[10px] text-white/60 capitalize">
                          {evt.category.replace('_', ' ')} &bull; {evt.durationMinutes}m
                        </span>
                      </div>
                    </div>
                    {evt.sourceText && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded bg-white/10/[0.04] text-blue-500/80 border border-white/5 flex items-center gap-1 flex-shrink-0"
                        title={`Natural-Language Prompt: "${evt.sourceText}"`}
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span className="hidden sm:inline">NLP</span>
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
            <button
              type="button"
              onClick={onOpenNaturalLanguageModal}
              className="text-sm text-blue-500 hover:text-blue-200 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Schedule via Natural Language</span>
            </button>
          </div>
        </GlassCard>

        {/* Priority Task Queue */}
        <GlassCard className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-lg font-black text-white tracking-tight">Priority Task Queue</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('tasks')}
                className="text-sm text-blue-500 hover:text-blue-500 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>All Tasks ({tasks.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 mt-3">
              {priorityTasks.length === 0 ? (
                <p className="text-sm text-white/60 py-6 text-center italic">
                  No active tasks! You're completely caught up.
                </p>
              ) : (
                priorityTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-[16px] bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onToggleTaskComplete(task.id)}
                        className="w-4 h-4 rounded-md border border-white/60 hover:border-[#0A84FF] flex items-center justify-center flex-shrink-0 cursor-pointer"
                      >
                        <Circle className="w-3 h-3 text-transparent" />
                      </button>

                      <div
                        onClick={() => onSelectTask(task)}
                        className="min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={task.priority} size="sm" />
                          <h4 className="text-base font-extrabold text-white group-hover:text-blue-500 transition-colors truncate">
                            {task.title}
                          </h4>
                        </div>
                        {task.dueDate && (
                          <span className="text-[10px] text-white/60 mt-0.5 block">
                            Due: {task.dueDate === todayStr ? 'Today' : task.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
            <button
              type="button"
              onClick={onOpenCreateTaskModal}
              className="text-sm text-blue-500 hover:text-blue-200 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Connected Projects & Ideas Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Progress */}
        <GlassCard className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-blue-500" />
              <h3 className="text-lg font-black text-white tracking-tight">Active Workspaces & Projects</h3>
            </div>
            <button 
              onClick={() => onNavigateTab('projects')}
              className="text-sm font-bold text-blue-500 hover:text-blue-500 transition-colors cursor-pointer flex items-center gap-1"
            >
              Manage Projects &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {projects.map((proj) => {
              const projTasks = tasks.filter((t) => t.projectId === proj.id);
              const doneTasks = projTasks.filter((t) => t.status === 'completed').length;
              const pct = projTasks.length > 0 ? Math.round((doneTasks / projTasks.length) * 100) : 0;
              const connectedIdeasCount = ideas.filter(
                (i) => i.metadata?.connectedProjectId === proj.id
              ).length;

              return (
                <div
                  key={proj.id}
                  onClick={() => onNavigateTab('projects')}
                  className="p-5 rounded-[16px] bg-white/10 hover:bg-white/10 border border-white/10 hover:border-white/40 flex flex-col justify-between transition-all cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: proj.color || '#6366f1' }}
                      />
                      <h4 className="text-base font-extrabold text-white">{proj.name}</h4>
                    </div>
                    {proj.description && (
                      <p className="text-[11px] text-white/60 mt-1 line-clamp-1">{proj.description}</p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between text-[10px] text-white/60 mb-1">
                      <span>
                        {doneTasks}/{projTasks.length} tasks
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {connectedIdeasCount > 0 && (
                      <span className="text-[10px] text-blue-500/80 mt-1.5 flex items-center gap-1">
                        <Lightbulb className="w-2.5 h-2.5 text-blue-500" />
                        {connectedIdeasCount} connected idea{connectedIdeasCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Ideas Knowledge Highlights */}
        <GlassCard className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-blue-500" />
                <h3 className="text-lg font-black text-white tracking-tight">Recent Sparks</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('ideas')}
                className="text-sm text-blue-500 hover:text-blue-500 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Explore Graph</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 mt-3">
              {ideas.slice(0, 3).map((idea) => (
                <div
                  key={idea.id}
                  onClick={() => onNavigateTab('ideas')}
                  className="p-2.5 rounded-[16px] bg-white/10 border border-white/10 hover:border-transparent transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-[#FF9F0A]/10 text-blue-500 border border-transparent">
                      {idea.type}
                    </span>
                    <h5 className="text-base font-extrabold text-white truncate">{idea.title}</h5>
                  </div>
                  <p className="text-[11px] text-white/60 mt-1 line-clamp-1">{idea.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => onNavigateTab('ideas')}
              className="w-full py-2 rounded-[16px] bg-red-500/10 hover:bg-red-500/20 text-blue-500 border border-transparent text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-blue-500" />
              <span>Open Knowledge Graph Canvas</span>
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
