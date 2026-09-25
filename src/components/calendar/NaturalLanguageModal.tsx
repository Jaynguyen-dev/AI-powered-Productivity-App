import React, { useState, useEffect } from 'react';
import { CalendarEvent, NaturalLanguageParsingResult, EventRecurrence, EventCategory, Project, Task } from '../../types';
import { schedulingService } from '../../services/schedulingParser';
import { Modal } from '../common/Modal';
import { Sparkles, Calendar, Clock, AlertTriangle, CheckCircle2, RotateCw, Tag, ArrowRight } from 'lucide-react';

interface NaturalLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => void;
  projects: Project[];
  tasks: Task[];
  initialPrompt?: string;
}

export const NaturalLanguageModal: React.FC<NaturalLanguageModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
  projects,
  tasks,
  initialPrompt = '',
}) => {
  const [inputText, setInputText] = useState(initialPrompt);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<NaturalLanguageParsingResult | null>(null);

  // Editable fields in review card
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [recurrence, setRecurrence] = useState<EventRecurrence>('none');
  const [recurrenceRuleText, setRecurrenceRuleText] = useState('');
  const [category, setCategory] = useState<EventCategory>('deep_work');
  const [color, setColor] = useState('#6366f1');
  const [connectedProjectId, setConnectedProjectId] = useState<string>('');
  const [connectedTaskId, setConnectedTaskId] = useState<string>('');
  const [description, setDescription] = useState('');

  const quickPrompts = [
    'Meeting with my supervisor tomorrow at 2 PM for one hour',
    'Study computer vision every Tuesday from 7 to 9 PM',
    'Deep work on distillation loss Friday at 10am for 2 hours',
    'Distributed systems retro next Monday 3pm for 45m',
  ];

  useEffect(() => {
    if (isOpen) {
      if (initialPrompt) {
        setInputText(initialPrompt);
        handleInterpret(initialPrompt);
      } else if (!inputText) {
        // Clear previous state
        setParseResult(null);
      }
    }
  }, [isOpen, initialPrompt]);

  const handleInterpret = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    setIsParsing(true);
    try {
      // Anchored to simulated current time: 2026-09-19
      const refDate = new Date(2026, 8, 19, 9, 0, 0);
      const result = await schedulingService.parse(textToParse, refDate);
      setParseResult(result);

      // Populate editable fields with parsed result
      setTitle(result.title);
      setStartDate(result.startDate);
      setStartTime(result.startTime);
      setEndTime(result.endTime);
      setDurationMinutes(result.durationMinutes);
      setRecurrence(result.recurrence);
      setRecurrenceRuleText(result.recurrenceRuleText || '');
      setCategory(result.category);
      setColor(result.color);
      setDescription('');
    } catch (err) {
      console.error('Failed to parse natural language event', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    // Recalculate end time using duration
    const [h, m] = newStartTime.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const totalStartMin = h * 60 + m;
      const totalEndMin = totalStartMin + durationMinutes;
      const endH = Math.floor(totalEndMin / 60) % 24;
      const endM = totalEndMin % 60;
      setEndTime(`${endH < 10 ? '0' : ''}${endH}:${endM < 10 ? '0' : ''}${endM}`);
    }
  };

  const handleDurationChange = (newDuration: number) => {
    setDurationMinutes(newDuration);
    const [h, m] = startTime.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const totalStartMin = h * 60 + m;
      const totalEndMin = totalStartMin + newDuration;
      const endH = Math.floor(totalEndMin / 60) % 24;
      const endM = totalEndMin % 60;
      setEndTime(`${endH < 10 ? '0' : ''}${endH}:${endM < 10 ? '0' : ''}${endM}`);
    }
  };

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !startTime) return;

    onEventCreated({
      title: title.trim(),
      description: description.trim() || undefined,
      startDate,
      startTime,
      endDate: startDate,
      endTime: endTime || startTime,
      durationMinutes,
      recurrence,
      recurrenceRuleText: recurrence !== 'none' ? recurrenceRuleText : undefined,
      category,
      color,
      connectedProjectId: connectedProjectId || undefined,
      connectedTaskId: connectedTaskId || undefined,
      sourceText: inputText.trim(),
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Natural-Language Smart Scheduling"
      subtitle="Type naturally to parse and verify structured calendar activities before committing"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Natural Language Prompt Input */}
        <div>
          <label htmlFor="nl-prompt-input" className="block text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">
            Schedule Prompt
          </label>
          <div className="relative">
            <input
              id="nl-prompt-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleInterpret(inputText);
                }
              }}
              placeholder="e.g. Meeting with my supervisor tomorrow at 2 PM for one hour"
              className="w-full pl-4 pr-28 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-base shadow-inner"
            />
            <button
              type="button"
              id="btn-interpret-nl"
              onClick={() => handleInterpret(inputText)}
              disabled={isParsing || !inputText.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 rounded-lg bg-blue-500 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-500 text-white text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isParsing ? 'Parsing...' : 'Interpret'}
            </button>
          </div>

          {/* Quick Examples */}
          <div className="mt-2.5">
            <span className="text-[11px] text-white/60 font-medium mr-1.5">Try examples:</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText(prompt);
                    handleInterpret(prompt);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors text-left"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interpreted Activity Review Card */}
        {parseResult && (
          <form onSubmit={handleCommit} className="space-y-4 pt-3 border-t border-white/10">
            {/* Header / Confidence banner */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white">Interpreted Activity Review</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-white/60">
                <span>Confidence:</span>
                <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                  parseResult.confidence >= 0.8
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-950/70 text-amber-300 border border-red-500/40'
                }`}>
                  {Math.round(parseResult.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* Uncertainty / Inferred assumptions banner */}
            {parseResult.uncertainties.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-red-500/30 text-amber-200 text-sm space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Interpretation Details & Inferences:</span>
                </div>
                <ul className="list-disc list-inside text-[11px] text-amber-200/90 pl-1 space-y-0.5">
                  {parseResult.uncertainties.map((unc, i) => (
                    <li key={i}>{unc}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Editable Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-1">Activity Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-blue-500" />
                  Category
                </label>
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
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="meeting">Meeting / Sync</option>
                  <option value="deep_work">Deep Work / Focus</option>
                  <option value="study">Study / Research</option>
                  <option value="personal">Personal / Wellness</option>
                  <option value="review">Review / Critique</option>
                  <option value="deadline">Milestone / Deadline</option>
                </select>
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Duration & End Time */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Duration (Minutes) &bull; Ends: {endTime || '—'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={durationMinutes}
                    onChange={(e) => handleDurationChange(parseInt(e.target.value, 10) || 60)}
                    className="w-28 px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <div className="flex gap-1">
                    {[30, 45, 60, 90, 120].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleDurationChange(m)}
                        className={`px-2 py-1 text-[11px] rounded-lg border transition-colors ${
                          durationMinutes === m
                            ? 'bg-blue-500/40 text-blue-200 border-blue-500/50 font-semibold'
                            : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recurrence */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-1 flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5 text-blue-500" />
                  Recurrence
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: 'none', label: 'Does not repeat' },
                    { val: 'daily', label: 'Daily' },
                    { val: 'weekdays', label: 'Every Weekday' },
                    { val: 'weekly', label: recurrenceRuleText || 'Weekly' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setRecurrence(item.val as EventRecurrence)}
                      className={`px-3 py-2 text-sm rounded-xl border text-center transition-all ${
                        recurrence === item.val
                          ? 'bg-blue-500/30 text-blue-200 border-blue-400/50 font-semibold shadow-sm'
                          : 'bg-white/10 text-white/60 border-white/10 hover:bg-white/5'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Connected Project */}
              {projects.length > 0 && (
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
              )}

              {/* Optional Connected Task */}
              {tasks.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Timeblock for Task</label>
                  <select
                    value={connectedTaskId}
                    onChange={(e) => setConnectedTaskId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none"
                  >
                    <option value="">None (Standalone Event)</option>
                    {tasks
                      .filter((t) => t.status !== 'completed')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title.substring(0, 38)}...
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Commit & Confirm Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-commit-event"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-500 hover:to-red-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Commit to Calendar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
