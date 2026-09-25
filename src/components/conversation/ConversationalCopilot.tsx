import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import {
  ChatMessage,
  ConversationalAction,
  CalendarEvent,
  Task,
  IdeaNode,
  IdeaEdge,
  Project,
  ActiveView,
} from '../../types';
import { conversationService, WorkspaceContext } from '../../services/conversationService';
import { ConversationalActionCard } from './ConversationalActionCard';
import { GlassCard } from '../common/GlassCard';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  Calendar,
  ListTodo,
  Lightbulb,
  Timer,
  ChevronRight,
  Bot,
  User,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';

interface ConversationalCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  // Workspace data
  events: CalendarEvent[];
  tasks: Task[];
  ideas: IdeaNode[];
  edges: IdeaEdge[];
  projects: Project[];
  activeView: ActiveView;
  // Workspace mutation handlers
  onAddEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onAddTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onAddIdea: (idea: IdeaNode) => void;
  onDeleteIdea: (ideaId: string) => void;
  onAddEdge: (edge: IdeaEdge) => void;
  onNavigateTab: (tab: ActiveView) => void;
  onStartFocusTimer: (task?: Task, minutes?: number) => void;
  // Initial or queued query from header
  pendingQuery?: string | null;
  onClearPendingQuery?: () => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content:
      "Hello! I'm **Zen**, your conversational workspace copilot.\n\nYou can talk to me directly to run your entire day:\n• *\"What's on my schedule today?\"*\n• *\"Schedule a 45m design review tomorrow at 3pm\"*\n• *\"Add high priority task: Ship landing page due Friday\"*\n• *\"Start a 25-minute Pomodoro on my top task\"*\n• *\"Brainstorm 3 ideas for graph synthesis\"*\n\nWhat would you like to accomplish?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    suggestedFollowUps: [
      "What's on my schedule today?",
      "What are my high priority tasks?",
      "Start a 25m Focus Session",
      "Schedule team sync tomorrow at 3pm",
    ],
  },
];

const parseMarkdown = (text: string) => {
  // First escape HTML to prevent XSS
  const escapeHTML = (str: string) =>
    str.replace(/[&<>'"]/g, (tag) => {
      const charsToReplace: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      };
      return charsToReplace[tag] || tag;
    });

  let safeText = escapeHTML(text);

  // Bold
  safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  safeText = safeText.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Inline Code
  safeText = safeText.replace(/`(.*?)`/g, '<code class="bg-black/30 px-1 py-0.5 rounded text-[15px] font-mono text-blue-300">$1</code>');

  return { __html: safeText };
};

export const ConversationalCopilot: React.FC<ConversationalCopilotProps> = ({
  isOpen,
  onClose,
  events,
  tasks,
  ideas,
  edges,
  projects,
  activeView,
  onAddEvent,
  onDeleteEvent,
  onAddTask,
  onDeleteTask,
  onToggleTaskComplete,
  onAddIdea,
  onDeleteIdea,
  onAddEdge,
  onNavigateTab,
  onStartFocusTimer,
  pendingQuery,
  onClearPendingQuery,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);

  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false); // Text-to-speech audio reply
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Flush conversation history when the chat pops up
  useEffect(() => {
    if (isOpen) {
      setMessages(INITIAL_MESSAGES);
    }
  }, [isOpen]);

  // Handle pending query from header or dashboard
  useEffect(() => {
    if (pendingQuery && isOpen) {
      handleSendMessage(pendingQuery);
      if (onClearPendingQuery) {
        onClearPendingQuery();
      }
    }
  }, [pendingQuery, isOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setIsVoiceActive(false);
          handleSendMessage(transcript, true);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error in copilot:', err);
        setIsVoiceActive(false);
      };

      recognition.onend = () => {
        setIsVoiceActive(false);
      };

      recognitionRef.current = recognition;
    }
  }, [events, tasks, ideas, projects, activeView]);

  // Vocalize assistant reply if voiceEnabled
  const speakText = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Strip markdown syntax
      const cleanText = text
        .replace(/[*_~`#\[\]]/g, '')
        .replace(/\(https?:\/\/[^\)]+\)/g, '')
        .slice(0, 300);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not available in your current browser. You can type commands directly!');
      return;
    }

    if (isVoiceActive) {
      recognitionRef.current.stop();
      setIsVoiceActive(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsVoiceActive(true);
      } catch (err) {
        console.warn('Could not start recognition:', err);
        setIsVoiceActive(false);
      }
    }
  };

  const buildWorkspaceContext = (): WorkspaceContext => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return {
      currentDate: `${year}-${month}-${day}`,
      currentTime: `${hours}:${minutes}`,
      events,
      tasks,
      ideas,
      edges,
      projects,
      activeView,
    };
  };

  const executeAction = (action: ConversationalAction) => {
    const { type, payload } = action;
    const normType = String(type || '').toLowerCase();

    if ((normType === 'create_event' || normType === 'schedule_event' || normType === 'add_event') && payload) {
      const newEvent: CalendarEvent = {
        id: `event-${Date.now()}`,
        title: payload.title || 'Untitled Event',
        startDate: payload.startDate || new Date().toISOString().slice(0, 10),
        startTime: payload.startTime || '09:00',
        endDate: payload.endDate || payload.startDate || new Date().toISOString().slice(0, 10),
        endTime: payload.endTime || '10:00',
        durationMinutes: payload.durationMinutes || 60,
        category: payload.category || 'meeting',
        recurrence: payload.recurrence || 'none',
        recurrenceRuleText: payload.recurrenceRuleText,
        color: payload.color || '#6366f1',
        createdAt: new Date().toISOString(),
        sourceText: payload.sourceText,
      };
      onAddEvent(newEvent);
      action.payload.eventId = newEvent.id;
      action.executed = true;
    } else if ((normType === 'delete_event' || normType === 'remove_event') && payload) {
      // Resolve by eventId directly, or fuzzy-match by title
      let targetId: string | undefined = payload.eventId;
      if (!targetId && (payload.eventTitle || payload.title)) {
        const needle = String(payload.eventTitle || payload.title).toLowerCase();
        const match = events.find(e => e.title.toLowerCase().includes(needle) || needle.includes(e.title.toLowerCase()));
        targetId = match?.id;
      }
      if (targetId) {
        onDeleteEvent(targetId);
        action.payload.eventId = targetId;
        action.executed = true;
      }
    } else if ((normType === 'create_task' || normType === 'add_task' || normType === 'new_task') && payload) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: payload.title || 'Untitled Task',
        priority: payload.priority || 'medium',
        status: 'todo',
        dueDate: payload.dueDate,
        estimatedMinutes: payload.estimatedMinutes || 30,
        tags: payload.tags || ['copilot'],
        createdAt: new Date().toISOString(),
      };
      onAddTask(newTask);
      action.payload.taskId = newTask.id;
      action.executed = true;
    } else if ((normType === 'delete_task' || normType === 'remove_task') && payload) {
      let targetId: string | undefined = payload.taskId;
      if (!targetId && (payload.taskTitle || payload.title)) {
        const needle = String(payload.taskTitle || payload.title).toLowerCase();
        const match = tasks.find(t => t.title.toLowerCase().includes(needle) || needle.includes(t.title.toLowerCase()));
        targetId = match?.id;
      }
      if (targetId) {
        onDeleteTask(targetId);
        action.payload.taskId = targetId;
        action.executed = true;
      }
    } else if ((normType === 'complete_task' || normType === 'mark_task' || normType === 'finish_task') && payload) {
      if (payload.taskId) {
        onToggleTaskComplete(payload.taskId);
        action.executed = true;
      } else if (payload.title) {
        const found = tasks.find(t => t.title.toLowerCase().includes(String(payload.title).toLowerCase()));
        if (found) {
          onToggleTaskComplete(found.id);
          action.payload.taskId = found.id;
          action.executed = true;
        }
      }
    } else if ((normType === 'create_idea' || normType === 'add_idea' || normType === 'new_idea') && payload) {
      const newIdea: IdeaNode = {
        id: `idea-${Date.now()}`,
        title: payload.title || 'New Thought',
        content: payload.content || payload.title || '',
        type: payload.type || 'concept',
        tags: payload.tags || ['copilot'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onAddIdea(newIdea);
      action.payload.ideaId = newIdea.id;
      action.executed = true;
    } else if ((normType === 'delete_idea' || normType === 'remove_idea') && payload) {
      let targetId: string | undefined = payload.ideaId;
      if (!targetId && (payload.ideaTitle || payload.title)) {
        const needle = String(payload.ideaTitle || payload.title).toLowerCase();
        const match = ideas.find(i => i.title.toLowerCase().includes(needle) || needle.includes(i.title.toLowerCase()));
        targetId = match?.id;
      }
      if (targetId) {
        onDeleteIdea(targetId);
        action.payload.ideaId = targetId;
        action.executed = true;
      }
    } else if ((normType === 'connect_ideas' || normType === 'link_ideas') && payload) {
      if (payload.sourceId && payload.targetId) {
        const newEdge: IdeaEdge = {
          id: `edge-${Date.now()}`,
          sourceId: payload.sourceId,
          targetId: payload.targetId,
          relationshipType: payload.relationshipType || 'related_to',
          createdAt: new Date().toISOString(),
        };
        onAddEdge(newEdge);
        action.executed = true;
      }
    } else if ((normType === 'start_timer' || normType === 'start_focus') && payload) {
      const targetTask = tasks.find((t) => t.id === payload.taskId);
      onStartFocusTimer(targetTask, payload.durationMinutes || 25);
      action.executed = true;
    } else if ((normType === 'navigate_view' || normType === 'switch_view') && payload) {
      const viewStr = String(payload.view || '').toLowerCase();
      let targetView: ActiveView = 'dashboard';
      if (viewStr.includes('calendar') || viewStr.includes('sched')) targetView = 'calendar';
      else if (viewStr.includes('task') || viewStr.includes('todo')) targetView = 'tasks';
      else if (viewStr.includes('idea') || viewStr.includes('graph') || viewStr.includes('mind')) targetView = 'ideas';
      else targetView = 'dashboard';

      onNavigateTab(targetView);
      action.executed = true;
    }
  };

  const handleUndoAction = (action: ConversationalAction) => {
    if (action.type === 'create_event' && action.payload?.eventId) {
      onDeleteEvent(action.payload.eventId);
      action.executed = false;
    } else if (action.type === 'create_task' && action.payload?.taskId) {
      onDeleteTask(action.payload.taskId);
      action.executed = false;
    } else if (action.type === 'complete_task' && action.payload?.taskId) {
      onToggleTaskComplete(action.payload.taskId); // Toggle back
      action.executed = false;
    } else if (action.type === 'create_idea' && action.payload?.ideaId) {
      onDeleteIdea(action.payload.ideaId);
      action.executed = false;
    }
    setMessages((prev) => [...prev]); // Trigger re-render
  };

  const handleNavigateToAction = (action: ConversationalAction) => {
    if (action.type === 'create_event') {
      onNavigateTab('calendar');
    } else if (action.type === 'create_task') {
      onNavigateTab('tasks');
    } else if (action.type === 'create_idea' || action.type === 'connect_ideas') {
      onNavigateTab('ideas');
    }
  };

  const handleSendMessage = async (textToSend: string, fromVoice = false) => {
    const text = textToSend.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVoiceInput: fromVoice,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputVal('');
    setIsLoading(true);

    try {
      const context = buildWorkspaceContext();
      const response = await conversationService.processMessage(text, messages, context);

      let finalActions = response.actions || [];

      // If backend returned no actions, attempt client-side fallback parsing to guarantee interaction
      if (finalActions.length === 0) {
        try {
          const fallbackRes = await (conversationService as any).fallbackLocalAgent?.(text, context);
          if (fallbackRes && fallbackRes.actions && fallbackRes.actions.length > 0) {
            finalActions = fallbackRes.actions;
          }
        } catch (e) {
          // ignore
        }
      }

      // Execute any actions immediately on the workspace
      if (finalActions.length > 0) {
        finalActions.forEach((act) => executeAction(act));
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: finalActions.length > 0 ? finalActions : undefined,
        suggestedFollowUps: response.suggestedFollowUps,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      speakText(response.reply);
    } catch (err) {
      console.error('Failed to process message:', err);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: "I'm sorry, I encountered an issue analyzing that request. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (true) {
      setMessages(INITIAL_MESSAGES);
      localStorage.removeItem('Zen_conversation_history');
    }
  };

  

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEventsCount = events.filter((e) => e.startDate === todayStr).length;
  const highTasksCount = tasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length;

  return (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-end pointer-events-none p-4 md:p-6" style={{ perspective: 1200 }}>
      {/* 3D Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/20 pointer-events-auto transition-opacity"
          onClick={onClose}
        />

      {/* 3D Floating Glass Panel */}
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`pointer-events-auto flex flex-col h-full bg-black/20 backdrop-blur-xl rounded-[32px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden z-10 transition-[width] duration-300 ${
            isExpanded ? "w-full md:w-[700px]" : "w-full md:w-[480px]"
          }`}
        >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-950/40 via-purple-950/20 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">Zen Copilot</h2>
                <span className="px-1.5 py-0.5 rounded text-[12px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  AI Core
                </span>
              </div>
              <p className="text-[15px] text-white/80">
                {todayEventsCount} events today &bull; {highTasksCount} urgent tasks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-white/80">
            {/* Audio Speech output toggle */}
            <button
              type="button"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                voiceEnabled
                  ? 'text-blue-400 bg-blue-950/60 border border-blue-500/30'
                  : 'hover:text-white hover:bg-white/10'
              }`}
              title={voiceEnabled ? 'Mute AI voice output' : 'Enable voice reading of replies'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Clear conversation */}
            <button
              type="button"
              onClick={handleClearHistory}
              className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Expand / Collapse width */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer hidden md:block"
              title={isExpanded ? 'Collapse width' : 'Expand width'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Copilot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workspace Quick Context Bar */}
        <div className="px-4 py-2 border-b border-white/5 bg-black/60/40 flex items-center justify-between text-[15px] text-white/80 overflow-x-auto gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('calendar')}
              className="flex items-center gap-1 hover:text-blue-300 transition-colors cursor-pointer"
            >
              <Calendar className="w-3 h-3 text-blue-400" />
              <span>Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('tasks')}
              className="flex items-center gap-1 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <ListTodo className="w-3 h-3 text-emerald-400" />
              <span>Tasks ({tasks.filter((t) => t.status !== 'completed').length})</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('ideas')}
              className="flex items-center gap-1 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <Lightbulb className="w-3 h-3 text-amber-400" />
              <span>Graph ({ideas.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onStartFocusTimer()}
            className="flex items-center gap-1 text-blue-300 hover:text-blue-200 transition-colors cursor-pointer shrink-0"
          >
            <Timer className="w-3 h-3 text-blue-400" />
            <span>Focus Timer</span>
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-[14px] bg-black/20 backdrop-blur-2xl custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 border border-purple-200 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md shadow-blue-500/20">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-[24px] p-4 leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-black/20 text-white rounded-tr-sm border border-white/10'
                    : 'bg-white/5 text-white rounded-tl-sm border border-white/10'
                }`}
              >
                {/* Voice speech badge */}
                {msg.isVoiceInput && (
                  <div className="flex items-center gap-1 text-[12px] text-blue-400 mb-1 opacity-80">
                    <Mic className="w-2.5 h-2.5" />
                    <span>Spoken command</span>
                  </div>
                )}

                {/* Message Body */}
                <div
                  className={`whitespace-pre-wrap space-y-2 pblue pblue-sm max-w-none ${msg.role === 'user' ? 'pblue-invert' : 'pblue-slate'}`}
                  dangerouslySetInnerHTML={parseMarkdown(msg.content)}
                />

                {/* Embedded Actions */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10/50 space-y-2">
                    {msg.actions.map((action) => (
                      <ConversationalActionCard
                        key={action.id}
                        action={action}
                        onUndo={handleUndoAction}
                        onNavigateToAction={handleNavigateToAction}
                        onStartTimerForTask={(taskId) => {
                          const task = tasks.find((t) => t.id === taskId);
                          onStartFocusTimer(task);
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Suggested follow-ups */}
                {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10/50 flex flex-wrap gap-2">
                    {msg.suggestedFollowUps.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(suggestion)}
                        className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-purple-100 border border-purple-100 text-blue-300 text-[15px] font-bold transition-all cursor-pointer flex items-center gap-1 text-left shadow-sm hover:shadow"
                      >
                        <span>{suggestion}</span>
                        <ChevronRight className="w-3 h-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-2 text-[12px] text-white/80 text-right font-bold">
                  {msg.timestamp}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 border border-white/20 flex items-center justify-center text-white/90 shrink-0 mt-0.5 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-2.5 items-center">
              <div className="w-6 h-6 rounded-lg bg-blue-600/80 flex items-center justify-center text-white shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/15 text-slate-300 flex items-center gap-2 text-sm">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span>Zen is reasoning and orchestrating workspace actions...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-5 border-t border-white/60 bg-black/20 backdrop-blur-2xl space-y-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          {/* Quick Voice Wave Indicator */}
          {isVoiceActive && (
            <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-2xl bg-blue-100 border border-blue-300 text-blue-600 text-sm font-bold animate-pulse">
              <Mic className="w-4 h-4 animate-bounce" />
              <span>Listening to your voice command... Speak naturally</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-3 rounded-2xl transition-all cursor-pointer shadow-sm border ${
                isVoiceActive
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 animate-pulse border-blue-600'
                  : 'bg-white/5 hover:bg-white/5 text-white/80 hover:text-white border-white/10'
              }`}
              title={isVoiceActive ? 'Stop listening' : 'Start voice command'}
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputVal);
                }
              }}
              placeholder="Ask Zen anything or give a command..."
              className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/80 text-[15px] sm:text-[14px] font-bold shadow-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />

            <button
              type="button"
              onClick={() => handleSendMessage(inputVal)}
              disabled={!inputVal.trim() || isLoading}
              className="p-3 rounded-2xl bg-gradient-to-r from-red-500 to-blue-500 hover:from-amber-400 hover:to-blue-400 disabled:opacity-50 disabled:from-slate-300 disabled:to-slate-300 disabled:border-white/20 text-white shadow-[0_4px_15px_rgba(168,85,247,0.4)] transition-all cursor-pointer border border-amber-400"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[12px] font-bold text-white/80 px-2">
            <span>Commands execute across Calendar, Tasks, Ideas, and Focus</span>
            <span className="font-mono bg-white/50 px-1.5 py-0.5 rounded border border-white">Press Enter ↵</span>
          </div>
        </div>
      </motion.div></div>)}</AnimatePresence>
);
};