import React from 'react';
import { ConversationalAction } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { PriorityBadge } from '../common/PriorityBadge';
import {
  Calendar,
  CheckCircle2,
  ListTodo,
  Lightbulb,
  Link,
  Timer,
  Undo2,
  ExternalLink,
  Check,
} from 'lucide-react';

interface ConversationalActionCardProps {
  action: ConversationalAction;
  onUndo?: (action: ConversationalAction) => void;
  onNavigateToAction?: (action: ConversationalAction) => void;
  onStartTimerForTask?: (taskId: string) => void;
}

export const ConversationalActionCard: React.FC<ConversationalActionCardProps> = ({
  action,
  onUndo,
  onNavigateToAction,
  onStartTimerForTask,
}) => {
  const isExecuted = action.executed !== false;

  return (
    <GlassCard
      variant="default"
      className="p-5 my-2 border border-blue-500/25 bg-black/60/80 shadow-md text-xs space-y-2.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {action.type === 'create_event' && (
            <div className="w-6 h-6 rounded-lg bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          )}
          {action.type === 'create_task' && (
            <div className="w-6 h-6 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ListTodo className="w-3.5 h-3.5" />
            </div>
          )}
          {action.type === 'complete_task' && (
            <div className="w-6 h-6 rounded-lg bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          )}
          {action.type === 'create_idea' && (
            <div className="w-6 h-6 rounded-lg bg-amber-950/80 border border-red-500/30 flex items-center justify-center text-amber-400">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
          )}
          {action.type === 'connect_ideas' && (
            <div className="w-6 h-6 rounded-lg bg-red-950/80 border border-red-500/30 flex items-center justify-center text-red-400">
              <Link className="w-3.5 h-3.5" />
            </div>
          )}
          {action.type === 'start_timer' && (
            <div className="w-6 h-6 rounded-lg bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Timer className="w-3.5 h-3.5" />
            </div>
          )}

          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
            <span>{action.summary}</span>
            {isExecuted && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 flex items-center gap-0.5">
                <Check className="w-2.5 h-2.5" /> Executed
              </span>
            )}
          </div>
        </div>

        {onUndo && (
          <button
            type="button"
            onClick={() => onUndo(action)}
            className="text-white/50 hover:text-amber-300 p-1 rounded hover:bg-black/20 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            title="Undo this action"
          >
            <Undo2 className="w-3 h-3" />
            <span>Undo</span>
          </button>
        )}
      </div>

      {/* Payload details preview */}
      {action.type === 'create_event' && action.payload && (
        <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{action.payload.title}</span>
            <span>&bull;</span>
            <span className="text-blue-300 font-mono">
              {action.payload.startDate} {action.payload.startTime} - {action.payload.endTime}
            </span>
            {action.payload.category && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-900/40 text-blue-300 border border-blue-500/20 capitalize">
                {action.payload.category}
              </span>
            )}
          </div>
          {onNavigateToAction && (
            <button
              type="button"
              onClick={() => onNavigateToAction(action)}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>View in Calendar</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {action.type === 'create_task' && action.payload && (
        <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <PriorityBadge priority={action.payload.priority || 'medium'} />
            <span className="font-medium text-white">{action.payload.title}</span>
            {action.payload.dueDate && (
              <span className="text-white/50">Due: {action.payload.dueDate}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onStartTimerForTask && action.payload.taskId && (
              <button
                type="button"
                onClick={() => onStartTimerForTask(action.payload.taskId)}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <Timer className="w-3 h-3" />
                <span>Start Focus</span>
              </button>
            )}
            {onNavigateToAction && (
              <button
                type="button"
                onClick={() => onNavigateToAction(action)}
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>View in Tasks</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {action.type === 'create_idea' && action.payload && (
        <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{action.payload.title}</span>
            {action.payload.type && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-900/40 text-amber-300 border border-red-500/20 capitalize">
                {action.payload.type}
              </span>
            )}
          </div>
          {onNavigateToAction && (
            <button
              type="button"
              onClick={() => onNavigateToAction(action)}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>Explore in Graph</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </GlassCard>
  );
};
