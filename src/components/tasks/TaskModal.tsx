import React, { useState, useEffect } from 'react';
import { Task, PriorityLevel, TaskStatus, Project, IdeaNode } from '../../types';
import { Modal } from '../common/Modal';
import { PriorityBadge } from '../common/PriorityBadge';
import { Calendar, Clock, Lightbulb, Folder, Tag, Sparkles } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onScheduleToCalendar?: (task: Task) => void;
  taskToEdit?: Task | null;
  projects: Project[];
  ideas: IdeaNode[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onScheduleToCalendar,
  taskToEdit,
  projects,
  ideas,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [projectId, setProjectId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(60);
  const [originatingIdeaId, setOriginatingIdeaId] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setDueDate(taskToEdit.dueDate || '');
      setDueTime(taskToEdit.dueTime || '');
      setProjectId(taskToEdit.projectId || '');
      setTagsInput(taskToEdit.tags?.join(', ') || '');
      setEstimatedMinutes(taskToEdit.estimatedMinutes || 60);
      setOriginatingIdeaId(taskToEdit.originatingIdeaId || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setDueDate('2026-09-20');
      setDueTime('17:00');
      setProjectId(projects[0]?.id || '');
      setTagsInput('');
      setEstimatedMinutes(60);
      setOriginatingIdeaId('');
    }
  }, [taskToEdit, projects, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const task: Task = {
      id: taskToEdit ? taskToEdit.id : `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      projectId: projectId || undefined,
      tags,
      estimatedMinutes,
      originatingIdeaId: originatingIdeaId || undefined,
      calendarEventId: taskToEdit?.calendarEventId,
      createdAt: taskToEdit ? taskToEdit.createdAt : new Date().toISOString(),
      completedAt: status === 'completed' ? (taskToEdit?.completedAt || new Date().toISOString()) : undefined,
    };

    onSave(task);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Task' : 'Create New Task'}
      subtitle="Organize priorities, deadlines, and connect thoughts to execution"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-white mb-1">Task Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Implement knowledge distillation loss function"
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* Priority Selection (Multi-cue: Shape, Icon, Urgency bars) */}
        <div>
          <label className="block text-sm font-semibold text-white mb-1.5">Priority Level</label>
          <div className="grid grid-cols-3 gap-2.5">
            {(['high', 'medium', 'low'] as PriorityLevel[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setPriority(lvl)}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  priority === lvl
                    ? 'bg-white/60 border-blue-400 ring-2 ring-blue-500/30 shadow-md'
                    : 'bg-white/10 border-white/10 hover:bg-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                <PriorityBadge priority={lvl} showBars={true} size="md" />
                <span className="text-[10px] text-white/60 mt-0.5">
                  {lvl === 'high' ? 'Urgent / Critical' : lvl === 'medium' ? 'Standard Focus' : 'Flexible Target'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Dates and Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              Due Time (Optional)
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none"
            />
          </div>
        </div>

        {/* Project and Originating Idea connection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1 flex items-center gap-1">
              <Folder className="w-3.5 h-3.5 text-blue-500" />
              Project / Category
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none"
            >
              <option value="">No Project (General)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              Sparked by Idea
            </label>
            <select
              value={originatingIdeaId}
              onChange={(e) => setOriginatingIdeaId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none"
            >
              <option value="">None (Independent Task)</option>
              {ideas.map((idea) => (
                <option key={idea.id} value={idea.id}>
                  {idea.title.substring(0, 32)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Estimated Duration & Tags */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Estimated Minutes</label>
            <input
              type="number"
              min={1}
              step={1}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 30)}
              className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-blue-500" />
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. vision, modeling, urgent"
              className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Description & Acceptance Criteria</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add relevant notes, checklist or execution context..."
            className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          {taskToEdit && onScheduleToCalendar && (
            <button
              type="button"
              onClick={() => {
                onScheduleToCalendar(taskToEdit);
                onClose();
              }}
              className="px-3 py-2 rounded-xl bg-blue-950/50 hover:bg-blue-900/60 text-blue-300 border border-blue-500/30 text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Timeblock in Calendar</span>
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              {taskToEdit ? 'Save Task' : 'Create Task'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
