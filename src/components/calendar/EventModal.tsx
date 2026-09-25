import React, { useState, useEffect } from 'react';
import { CalendarEvent, EventRecurrence, EventCategory, Project, Task } from '../../types';
import { Modal } from '../common/Modal';
import { Trash2 } from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  eventToEdit?: CalendarEvent | null;
  defaultDate?: string;
  defaultTime?: string;
  projects: Project[];
  tasks: Task[];
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  eventToEdit,
  defaultDate,
  defaultTime = '10:00',
  projects,
  tasks,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('11:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [recurrence, setRecurrence] = useState<EventRecurrence>('none');
  const [recurrenceRuleText, setRecurrenceRuleText] = useState('');
  const [category, setCategory] = useState<EventCategory>('deep_work');
  const [color, setColor] = useState('#6366f1');
  const [connectedProjectId, setConnectedProjectId] = useState('');
  const [connectedTaskId, setConnectedTaskId] = useState('');

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || '');
      setStartDate(eventToEdit.startDate);
      setStartTime(eventToEdit.startTime);
      setEndDate(eventToEdit.endDate || eventToEdit.startDate);
      setEndTime(eventToEdit.endTime);
      setDurationMinutes(eventToEdit.durationMinutes || 60);
      setRecurrence(eventToEdit.recurrence || 'none');
      setRecurrenceRuleText(eventToEdit.recurrenceRuleText || '');
      setCategory(eventToEdit.category || 'deep_work');
      setColor(eventToEdit.color || '#6366f1');
      setConnectedProjectId(eventToEdit.connectedProjectId || '');
      setConnectedTaskId(eventToEdit.connectedTaskId || '');
    } else {
      const todayStr = defaultDate || new Date().toISOString().split('T')[0];
      setTitle('');
      setDescription('');
      setStartDate(todayStr);
      setStartTime(defaultTime);
      setEndDate(todayStr);
      const [h, m] = defaultTime.split(':').map(Number);
      const endH = ((h || 10) + 1) % 24;
      setEndTime(`${endH < 10 ? '0' : ''}${endH}:${m < 10 ? '0' : ''}${m || 0}`);
      setDurationMinutes(60);
      setRecurrence('none');
      setRecurrenceRuleText('');
      setCategory('deep_work');
      setColor('#06b6d4');
      setConnectedProjectId('');
      setConnectedTaskId('');
    }
  }, [eventToEdit, defaultDate, defaultTime, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !startTime) return;

    const event: CalendarEvent = {
      id: eventToEdit ? eventToEdit.id : `event-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      startDate,
      startTime,
      endDate: endDate || startDate,
      endTime: endTime || startTime,
      durationMinutes,
      recurrence,
      recurrenceRuleText: recurrence !== 'none' ? recurrenceRuleText : undefined,
      category,
      color,
      connectedProjectId: connectedProjectId || undefined,
      connectedTaskId: connectedTaskId || undefined,
      createdAt: eventToEdit ? eventToEdit.createdAt : new Date().toISOString(),
    };

    onSave(event);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventToEdit ? 'Edit Calendar Activity' : 'Create Calendar Activity'}
      subtitle="Configure schedule details, recurrence, and associated project"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Architectural Design Review"
            className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Date</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setEndDate(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => {
                const cat = e.target.value as EventCategory;
                setCategory(cat);
                const colorMap: Record<EventCategory, string> = {
                  meeting: '#6366f1',
                  deep_work: '#06b6d4',
                  study: '#10b981',
                  personal: '#f59e0b',
                  review: '#ec4899',
                  deadline: '#ef4444',
                };
                setColor(colorMap[cat]);
              }}
              className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none"
            >
              <option value="meeting">Meeting / Sync</option>
              <option value="deep_work">Deep Work / Focus</option>
              <option value="study">Study / Research</option>
              <option value="personal">Personal / Wellness</option>
              <option value="review">Review / Critique</option>
              <option value="deadline">Milestone / Deadline</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Start Time</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">End Time</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Recurrence</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as EventRecurrence)}
              className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none"
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekdays">Every Weekday (Mon-Fri)</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Associate Project</label>
            <select
              value={connectedProjectId}
              onChange={(e) => setConnectedProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none"
            >
              <option value="">None (Independent)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Notes / Description (Optional)</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Agenda, location, or focus goals..."
            className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          {eventToEdit && onDelete ? (
            <button
              type="button"
              onClick={() => {
                onDelete(eventToEdit.id);
                onClose();
              }}
              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1.5 text-sm cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              {eventToEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
