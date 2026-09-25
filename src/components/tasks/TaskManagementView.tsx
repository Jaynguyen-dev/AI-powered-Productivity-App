import React, { useState, useMemo } from 'react';
import { Task, Project, IdeaNode, PriorityLevel } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { PriorityBadge } from '../common/PriorityBadge';
import {
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Lightbulb,
  Edit2,
  Trash2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowUpDown,
  Timer,
} from 'lucide-react';

interface TaskManagementViewProps {
  tasks: Task[];
  projects: Project[];
  ideas: IdeaNode[];
  onOpenCreateTaskModal: () => void;
  onEditTask: (task: Task) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onScheduleTaskToCalendar: (task: Task) => void;
  onNavigateToIdea?: (ideaId: string) => void;
  onStartFocusTimer?: (task: Task) => void;
}

type TaskFilterTab = 'all' | 'today' | 'upcoming' | 'high_priority' | 'completed';

export const TaskManagementView: React.FC<TaskManagementViewProps> = ({
  tasks,
  projects,
  ideas,
  onOpenCreateTaskModal,
  onEditTask,
  onToggleTaskComplete,
  onDeleteTask,
  onScheduleTaskToCalendar,
  onNavigateToIdea,
  onStartFocusTimer,
}) => {
  const [activeTab, setActiveTab] = useState<TaskFilterTab>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'created'>('priority');

  const todayStr = new Date().toISOString().split('T')[0];

  // Compute workload statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const activeTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const highPriorityCount = tasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length;
  const dueTodayCount = tasks.filter((t) => t.dueDate === todayStr && t.status !== 'completed').length;
  const upcomingCount = tasks.filter((t) => t.status !== 'completed' && t.dueDate && t.dueDate > todayStr).length;

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Tab filter
      if (activeTab === 'completed') {
        if (task.status !== 'completed') return false;
      } else {
        // Other tabs exclude completed unless "all"
        if (activeTab === 'all' && task.status === 'completed') {
          // Allow in all tab
        } else if (activeTab !== 'all' && task.status === 'completed') {
          return false;
        }

        if (activeTab === 'today' && task.dueDate !== todayStr) return false;
        if (activeTab === 'upcoming' && (!task.dueDate || task.dueDate <= todayStr)) return false;
        if (activeTab === 'high_priority' && task.priority !== 'high') return false;
      }

      // Project filter
      if (selectedProjectId !== 'all' && task.projectId !== selectedProjectId) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        const matchTags = task.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchTags) return false;
      }

      return true;
    });
  }, [tasks, activeTab, selectedProjectId, searchQuery, todayStr]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      // Always put completed tasks at the bottom
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;

      if (sortBy === 'priority') {
        const priorityWeight: Record<PriorityLevel, number> = { high: 3, medium: 2, low: 1 };
        const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (diff !== 0) return diff;
        // Secondary sort by due date
        return (a.dueDate || '9999') > (b.dueDate || '9999') ? 1 : -1;
      }

      if (sortBy === 'dueDate') {
        return (a.dueDate || '9999') > (b.dueDate || '9999') ? 1 : -1;
      }

      return (b.createdAt || '') > (a.createdAt || '') ? 1 : -1;
    });
  }, [filteredTasks, sortBy]);

  // Project map for quick lookup
  const projectMap = useMemo(() => {
    return new Map(projects.map((p) => [p.id, p]));
  }, [projects]);

  // Idea map for quick lookup
  const ideaMap = useMemo(() => {
    return new Map(ideas.map((i) => [i.id, i]));
  }, [ideas]);

  const formatDueDateLabel = (dueDate?: string) => {
    if (!dueDate) return null;
    if (dueDate === todayStr) {
      return { text: 'Today', urgent: true };
    }
    if (dueDate === '2026-09-20') {
      return { text: 'Tomorrow', urgent: false };
    }
    if (dueDate < todayStr) {
      return { text: `Overdue (${dueDate.substring(5)})`, urgent: true, overdue: true };
    }
    return { text: dueDate.substring(5), urgent: false };
  };

  return (
    <div className="space-y-5">
      {/* Workload Overview Card */}
      <GlassCard className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Stats grouping */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 flex-1">
            <div className="p-3 rounded-xl bg-white/10 border border-white/10">
              <span className="text-sm text-white/60 font-medium">Workload Progress</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-white">{completionRate}%</span>
                <span className="text-sm text-white/60">
                  {completedTasks} of {totalTasks} done
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/60 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30">
              <span className="text-sm text-blue-300 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
                High Priority
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold text-blue-200">{highPriorityCount}</span>
                <span className="text-sm text-blue-300/80">urgent tasks</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/30 border border-red-500/30">
              <span className="text-sm text-amber-300 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Due Today
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold text-amber-200">{dueTodayCount}</span>
                <span className="text-sm text-amber-300/80">commitments</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/10 border border-white/10">
              <span className="text-sm text-white/60 font-medium flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                Active Queue
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold text-white">{activeTasks}</span>
                <span className="text-sm text-white/60">tasks remaining</span>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-create-task-main"
              onClick={onOpenCreateTaskModal}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Task</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Control Bar: Filters, Search, and Sort */}
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tab Navigation */}
          <div className="flex overflow-x-auto whitespace-nowrap hide-scrollbar items-center gap-1 p-1 rounded-xl bg-black/20 border border-white/10 w-full md:w-auto">
            {[
              { id: 'all', label: 'All Tasks', count: tasks.length },
              { id: 'today', label: 'Due Today', count: dueTodayCount },
              { id: 'high_priority', label: 'High Priority', count: highPriorityCount },
              { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
              { id: 'completed', label: 'Completed', count: completedTasks },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TaskFilterTab)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-md font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Right: Search, Project Filter & Sort */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks or tags..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/20 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
            </div>

            {/* Project Filter */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-black/20 border border-white/10 text-sm text-white/80 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-black/80">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-black/80">
                  {p.name}
                </option>
              ))}
            </select>

            {/* Sort Filter */}
            <div className="flex items-center rounded-xl bg-black/20 border border-white/10 p-1 text-sm text-white/80">
              <ArrowUpDown className="w-3.5 h-3.5 ml-1.5 text-white/60" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent px-2 py-0.5 text-sm text-white focus:outline-none cursor-pointer"
              >
                <option value="priority" className="bg-black/80">Sort: Priority</option>
                <option value="dueDate" className="bg-black/80">Sort: Due Date</option>
                <option value="created" className="bg-black/80">Sort: Created</option>
              </select>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Task List */}
      <div className="space-y-2.5">
        {sortedTasks.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-blue-500/50 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No tasks found</h3>
            <p className="text-sm text-white/60 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'No tasks match your current search query. Try clearing the search filter.'
                : 'No tasks in this category. Capture a new priority task to organize your day!'}
            </p>
            <button
              type="button"
              onClick={onOpenCreateTaskModal}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-500 text-white text-sm font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add a Task</span>
            </button>
          </GlassCard>
        ) : (
          sortedTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const project = task.projectId ? projectMap.get(task.projectId) : undefined;
            const originatingIdea = task.originatingIdeaId ? ideaMap.get(task.originatingIdeaId) : undefined;
            const dueInfo = formatDueDateLabel(task.dueDate);

            return (
              <GlassCard
                key={task.id}
                id={`task-item-${task.id}`}
                className={`p-6 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCompleted ? 'opacity-60 bg-white/10' : 'hover:border-white/20'
                }`}
              >
                {/* Left: Checkbox + Content */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Custom Checkbox */}
                  <button
                    type="button"
                    onClick={() => onToggleTaskComplete(task.id)}
                    aria-label={isCompleted ? 'Mark task incomplete' : 'Mark task complete'}
                    className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/40'
                        : 'border-2 border-slate-500 hover:border-blue-400 bg-white/10'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-transparent" />
                    )}
                  </button>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <PriorityBadge priority={task.priority} size="sm" />
                      <h4
                        className={`text-base font-semibold transition-all ${
                          isCompleted ? 'line-through text-white/60' : 'text-white'
                        }`}
                      >
                        {task.title}
                      </h4>
                    </div>

                    {task.description && (
                      <p className="text-sm text-white/60 mt-1 line-clamp-1 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Chips Row: Project, Idea Spark, Due Date, Tags */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {/* Project Tag */}
                      {project && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[11px] text-white/80">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: project.color || '#6366f1' }}
                          />
                          <span>{project.name}</span>
                        </span>
                      )}

                      {/* Originating Idea Reference */}
                      {originatingIdea && (
                        <button
                          type="button"
                          onClick={() => onNavigateToIdea?.(originatingIdea.id)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/40 border border-red-500/30 text-[11px] text-amber-300 hover:bg-amber-900/40 transition-colors cursor-pointer"
                          title={`Idea Spark: "${originatingIdea.title}". Click to view in Knowledge Graph.`}
                        >
                          <Lightbulb className="w-3 h-3 text-blue-500" />
                          <span className="truncate max-w-[140px]">{originatingIdea.title}</span>
                        </button>
                      )}

                      {/* Due Date Badge */}
                      {dueInfo && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                            dueInfo.urgent
                              ? 'bg-blue-950/50 text-blue-300 border-blue-500/40'
                              : 'bg-white/[0.04] text-white/80 border-white/10'
                          }`}
                        >
                          <Calendar className="w-3 h-3 text-white/60" />
                          <span>{dueInfo.text}</span>
                          {task.dueTime && (
                            <span className="text-[10px] opacity-80">@{task.dueTime}</span>
                          )}
                        </span>
                      )}

                      {/* Tags */}
                      {task.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.2 rounded text-[10px] bg-white/10 text-white/60 font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center pl-8 sm:pl-0">
                  {/* Focus Timer Button */}
                  {onStartFocusTimer && !isCompleted && (
                    <button
                      type="button"
                      onClick={() => onStartFocusTimer(task)}
                      className="p-1.5 rounded-lg text-white/60 hover:text-amber-300 hover:bg-amber-950/50 transition-colors cursor-pointer"
                      title="Start Focus Timer on this task"
                    >
                      <Timer className="w-4 h-4" />
                    </button>
                  )}

                  {/* Schedule to Calendar Button */}
                  <button
                    type="button"
                    onClick={() => onScheduleTaskToCalendar(task)}
                    className="p-1.5 rounded-lg text-white/60 hover:text-blue-300 hover:bg-blue-950/50 transition-colors cursor-pointer"
                    title="Timeblock this task on Calendar"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>

                  {/* Edit Task Button */}
                  <button
                    type="button"
                    onClick={() => onEditTask(task)}
                    className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Edit Task"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete Task Button */}
                  <button
                    type="button"
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 rounded-lg text-white/60 hover:text-blue-500 hover:bg-blue-950/40 transition-colors cursor-pointer"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
};
