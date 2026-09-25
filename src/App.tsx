import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarEvent,
  Task,
  IdeaNode,
  IdeaEdge,
  Project,
  ToastNotification,
  IdeaType,
  RelationshipType,
} from './types';
import { storageService } from './services/storageService';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { CalendarView } from './components/calendar/CalendarView';
import { TaskManagementView } from './components/tasks/TaskManagementView';
import { IdeasKnowledgeView } from './components/ideas/IdeasKnowledgeView';
import { NaturalLanguageModal } from './components/calendar/NaturalLanguageModal';
import { EventModal } from './components/calendar/EventModal';
import { TaskModal } from './components/tasks/TaskModal';
import { IdeaModal } from './components/ideas/IdeaModal';
import { AddConnectionModal } from './components/ideas/AddConnectionModal';
import { ProjectModal } from './components/projects/ProjectModal';
import { ProjectsManagementView } from './components/projects/ProjectsManagementView';
import { FocusTimer } from './components/timer/FocusTimer';
import { ConversationalCopilot } from './components/conversation/ConversationalCopilot';
import { ToastContainer } from './components/common/ToastContainer';
import { TutorialOverlay } from './components/common/TutorialOverlay';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  CheckSquare,
  Network,
  Sparkles,
  Plus,
  FolderPlus,
  FolderKanban,
  Layers,
  Timer as TimerIcon,
  Bot,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';

const getLocalDateString = () => {
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'tasks' | 'ideas' | 'projects'>('dashboard');
  const [showTutorial, setShowTutorial] = useState(false);

  const handleNavigateTab = useCallback((tab: 'dashboard' | 'calendar' | 'tasks' | 'ideas' | 'projects') => {
    setActiveTab(tab);
    window.history.pushState({ tab }, '', '?tab=' + tab);
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
      } else {
        setActiveTab('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('zen_has_seen_tutorial')) {
      setShowTutorial(true);
    }
  }, []);

  // Core Data Entities
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ideas, setIdeas] = useState<IdeaNode[]>([]);
  const [edges, setEdges] = useState<IdeaEdge[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Modals state
  const [nlModalOpen, setNlModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [nlInitialPrompt, setNlInitialPrompt] = useState('');

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [eventDefaultDate, setEventDefaultDate] = useState(getLocalDateString());

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const [ideaModalOpen, setIdeaModalOpen] = useState(false);
  const [ideaToEdit, setIdeaToEdit] = useState<IdeaNode | null>(null);

  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [connectionSourceIdea, setConnectionSourceIdea] = useState<IdeaNode | null>(null);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  // Focus Timer state
  const [timerOpen, setTimerOpen] = useState(false);
  const [timerMinimized, setTimerMinimized] = useState(false);
  const [timerTaskId, setTimerTaskId] = useState<string | null>(null);

  // Conversational Copilot state
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [pendingCopilotQuery, setPendingCopilotQuery] = useState<string | null>(null);

  // Keyboard shortcut listener: Cmd/Ctrl + K opens Copilot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCopilotOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback(
    (
      title: string,
      message?: string,
      type: ToastNotification['type'] = 'success',
      action?: { label: string; onClick: () => void }
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newToast: ToastNotification = { id, title, message, type, action };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initial load from storage
  useEffect(() => {
    setEvents(storageService.getEvents());
    setTasks(storageService.getTasks());
    setIdeas(storageService.getIdeas());
    setEdges(storageService.getEdges());
    setProjects(storageService.getProjects());
  }, []);

  // Sync state helpers
  const refreshAll = useCallback(() => {
    setEvents(storageService.getEvents());
    setTasks(storageService.getTasks());
    setIdeas(storageService.getIdeas());
    setEdges(storageService.getEdges());
    setProjects(storageService.getProjects());
  }, []);

  // --- CALENDAR WORKFLOWS ---
  const handleCreateEventFromNL = (newEventData: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    const created = storageService.createEvent(newEventData);
    refreshAll();
    addToast(
      'Activity Scheduled',
      `"${created.title}" placed on ${created.startDate} at ${created.startTime}`,
      'success',
      {
        label: 'View Calendar',
        onClick: () => handleNavigateTab('calendar'),
      }
    );
  };

  const handleSaveManualEvent = (event: CalendarEvent) => {
    const existing = events.find((e) => e.id === event.id);
    if (existing) {
      storageService.updateEvent(event);
      addToast('Event Updated', `Updated "${event.title}"`);
    } else {
      storageService.createEvent(event);
      addToast('Event Created', `Added "${event.title}" to calendar`);
    }
    refreshAll();
  };

  const handleDeleteEvent = (eventId: string) => {
    const toDelete = events.find((e) => e.id === eventId);
    storageService.deleteEvent(eventId);
    refreshAll();
    if (toDelete) {
      addToast('Event Removed', `Deleted "${toDelete.title}"`, 'info', {
        label: 'Undo',
        onClick: () => {
          storageService.createEvent(toDelete);
          refreshAll();
        },
      });
    }
  };

  // --- TASK WORKFLOWS ---
  const handleSaveTask = (task: Task) => {
    const existing = tasks.find((t) => t.id === task.id);
    if (existing) {
      storageService.updateTask(task);
      addToast('Task Updated', `"${task.title}"`);
    } else {
      storageService.createTask(task);
      addToast('Task Created', `Added "${task.title}" with priority ${task.priority.toUpperCase()}`);
    }
    refreshAll();
  };

  const handleStartTaskFocus = (task: Task) => {
    setTimerTaskId(task.id);
    setTimerOpen(true);
    setTimerMinimized(false);
  };

  const handleToggleTaskComplete = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    const updated = storageService.updateTask({
      ...task,
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
    });
    refreshAll();

    if (newStatus === 'completed') {
      addToast('Task Completed', `"${task.title}" marked done`, 'success', {
        label: 'Undo',
        onClick: () => {
          storageService.updateTask({ ...task, status: 'todo', completedAt: undefined });
          refreshAll();
        },
      });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const toDelete = tasks.find((t) => t.id === taskId);
    storageService.deleteTask(taskId);
    refreshAll();
    if (toDelete) {
      addToast('Task Deleted', `Removed "${toDelete.title}"`, 'info', {
        label: 'Undo',
        onClick: () => {
          storageService.createTask(toDelete);
          refreshAll();
        },
      });
    }
  };

  const handleScheduleTaskToCalendar = (task: Task) => {
    // Open NaturalLanguageModal or EventModal with pre-populated prompt
    const prompt = `Work on "${task.title}" on ${task.dueDate || 'tomorrow'} at 10am for ${
      task.estimatedMinutes || 60
    }m`;
    setNlInitialPrompt(prompt);
    setNlModalOpen(true);
  };

  // --- IDEA & KNOWLEDGE GRAPH WORKFLOWS ---
  const handleQuickCaptureIdea = (content: string, type?: IdeaType) => {
    const title = content.length > 50 ? `${content.substring(0, 48)}...` : content;
    const newIdea = storageService.createIdea({
      title,
      content,
      type: type || 'concept',
      tags: ['raw_thought'],
    });
    refreshAll();
    addToast('Idea Captured', `Spark stored in Knowledge Graph`, 'success', {
      label: 'View Graph',
      onClick: () => handleNavigateTab('ideas'),
    });
  };

  const handleSaveIdea = (idea: IdeaNode) => {
    const existing = ideas.find((i) => i.id === idea.id);
    if (existing) {
      storageService.updateIdea(idea);
      addToast('Idea Updated', `Updated "${idea.title}"`);
    } else {
      storageService.createIdea(idea);
      addToast('Idea Created', `Added node to knowledge graph`);
    }
    refreshAll();
  };

  const handleDeleteIdea = (ideaId: string) => {
    const toDelete = ideas.find((i) => i.id === ideaId);
    storageService.deleteIdea(ideaId);
    refreshAll();
    if (toDelete) {
      addToast('Idea Removed', `Deleted node and its relationships`, 'info');
    }
  };

  const handleAddConnection = (
    sourceId: string,
    targetId: string,
    relationshipType: RelationshipType,
    label?: string
  ) => {
    storageService.createEdge({
      sourceId,
      targetId,
      relationshipType,
      metadata: label ? { label } : undefined,
    });
    refreshAll();
    addToast('Connection Created', `Linked ideas with relationship "${relationshipType}"`);
  };

  const handleRemoveEdge = (edgeId: string) => {
    storageService.deleteEdge(edgeId);
    refreshAll();
    addToast('Connection Removed', `Unlinked relationship`);
  };

  const handleConvertIdeaToTask = (idea: IdeaNode) => {
    // Convert idea into a task while preserving the relationship
    setTaskToEdit({
      id: `task-${Date.now()}`,
      title: idea.title,
      description: idea.content,
      priority: 'medium',
      status: 'todo',
      dueDate: '2026-09-21',
      dueTime: '14:00',
      tags: idea.tags || [],
      estimatedMinutes: 60,
      originatingIdeaId: idea.id,
      createdAt: new Date().toISOString(),
    });
    setTaskModalOpen(true);
  };

  // --- PROJECT WORKFLOWS ---
  const handleSaveProject = (project: Project) => {
    const existing = projects.find((p) => p.id === project.id);
    if (existing) {
      storageService.updateProject(project);
      addToast('Project Updated', `"${project.name}"`);
    } else {
      storageService.createProject(project);
      addToast('Project Created', `Workspace ready for tasks and ideas`);
    }
    refreshAll();
  };

  const handleDeleteProject = (projectId: string) => {
    storageService.deleteProject(projectId);
    addToast('Project Deleted');
    refreshAll();
  };

  return (
    <div className="min-h-screen flex p-4 sm:p-8 gap-6 selection:bg-blue-500/30 selection:text-blue-200 overflow-hidden text-white bg-transparent">
      
      {/* Zen Floating Glass Sidebar (Pill) */}
      <aside className="hidden md:flex flex-col w-[80px] h-full shrink-0 items-center py-6 bg-black/20 backdrop-blur-2xl rounded-[40px] border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.08)]">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-8 cursor-pointer hover:scale-105 transition-transform" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        
        <nav className="flex-1 flex flex-col items-center gap-4 w-full">
          {[
            { id: 'dashboard', icon: LayoutDashboard, title: 'Dashboard' },
            { id: 'calendar', icon: CalendarIcon, title: 'Calendar' },
            { id: 'tasks', icon: CheckSquare, title: 'Tasks' },
            { id: 'ideas', icon: Network, title: 'Idea Graph' },
            { id: 'projects', icon: FolderKanban, title: 'Projects' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleNavigateTab(tab.id as any)}
                title={tab.title}
                className={`w-12 h-12 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/20'
                    : 'text-white/90 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col gap-4 mt-auto">
          <button
            onClick={() => setTimerOpen(true)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/90 hover:text-white transition-all cursor-pointer"
            title="Focus Timer"
          >
            <TimerIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setCopilotOpen(true)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-blue-400 hover:text-blue-300 shadow-[0_0_20px_rgba(255,159,10,0.2)] transition-all cursor-pointer relative"
            title="Talk to Zen"
          >
            <Bot className="w-6 h-6" />
            <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-black/50 animate-pulse"></div>
          </button>
        </div>
      </aside>

      {/* Main Content Area (Glass Window) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-black/20 backdrop-blur-2xl rounded-[40px] border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.08)] relative">
        
                {/* Mobile Header (Fallback) */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            {activeTab !== 'dashboard' ? (
              <button 
                onClick={() => handleNavigateTab('dashboard')} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="font-bold text-white text-xl capitalize">
              {activeTab === 'dashboard' ? 'Zen' : activeTab}
            </span>
          </div>
          <button onClick={() => setCopilotOpen(true)} className="text-blue-400 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 cursor-pointer">
            <Bot className="w-6 h-6" />
          </button>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="max-w-6xl mx-auto h-full flex flex-col"
            >
        {activeTab === 'dashboard' && (
          <DashboardOverview
            events={events}
            tasks={tasks}
            ideas={ideas}
            edges={edges}
            projects={projects}
            onNavigateTab={handleNavigateTab}
            onOpenNaturalLanguageModal={() => {
              setNlInitialPrompt('');
              setNlModalOpen(true);
            }}
            onOpenCreateTaskModal={() => {
              setTaskToEdit(null);
              setTaskModalOpen(true);
            }}
            onToggleTaskComplete={handleToggleTaskComplete}
            onQuickCaptureIdea={handleQuickCaptureIdea}
            onSelectEvent={(evt) => {
              setEventToEdit(evt);
              setEventModalOpen(true);
            }}
            onSelectTask={(t) => {
              setTaskToEdit(t);
              setTaskModalOpen(true);
            }}
            onOpenCopilot={() => setCopilotOpen(true)}
            onOpenCopilotWithPrompt={(prompt) => {
              setPendingCopilotQuery(prompt);
              setCopilotOpen(true);
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            events={events}
            tasks={tasks}
            projects={projects}
            onOpenNaturalLanguageModal={() => {
              setNlInitialPrompt('');
              setNlModalOpen(true);
            }}
            onOpenCreateEventModal={(defaultDate) => {
              setEventToEdit(null);
              setEventDefaultDate(defaultDate || getLocalDateString());
              setEventModalOpen(true);
            }}
            onEditTask={(t) => {
              setTaskToEdit(t);
              setTaskModalOpen(true);
            }}
            onEditEvent={(evt) => {
              setEventToEdit(evt);
              setEventModalOpen(true);
            }}
            onToggleTaskComplete={handleToggleTaskComplete}
          />
        )}

        {activeTab === 'tasks' && (
          <TaskManagementView
            tasks={tasks}
            projects={projects}
            ideas={ideas}
            onOpenCreateTaskModal={() => {
              setTaskToEdit(null);
              setTaskModalOpen(true);
            }}
            onEditTask={(t) => {
              setTaskToEdit(t);
              setTaskModalOpen(true);
            }}
            onToggleTaskComplete={handleToggleTaskComplete}
            onDeleteTask={handleDeleteTask}
            onScheduleTaskToCalendar={handleScheduleTaskToCalendar}
            onStartFocusTimer={handleStartTaskFocus}
            onNavigateToIdea={(ideaId) => {
              handleNavigateTab('ideas');
              const found = ideas.find((i) => i.id === ideaId);
              if (found) {
                setIdeaToEdit(found);
                setIdeaModalOpen(true);
              }
            }}
          />
        )}

        {activeTab === 'ideas' && (
          <IdeasKnowledgeView
            ideas={ideas}
            edges={edges}
            projects={projects}
            onQuickCapture={handleQuickCaptureIdea}
            onOpenCreateIdeaModal={(coords) => {
              const now = new Date().toISOString();
              setIdeaToEdit({
                id: `idea-${Date.now()}`,
                title: '',
                content: '',
                type: 'concept',
                tags: [],
                metadata: coords ? { x: coords.x, y: coords.y } : undefined,
                createdAt: now,
                updatedAt: now,
              });
              setIdeaModalOpen(true);
            }}
            onEditIdea={(idea) => {
              setIdeaToEdit(idea);
              setIdeaModalOpen(true);
            }}
            onOpenAddConnection={(sourceIdea) => {
              setConnectionSourceIdea(sourceIdea);
              setConnectionModalOpen(true);
            }}
            onConvertIdeaToTask={handleConvertIdeaToTask}
            onAddConnectionDirect={handleAddConnection}
            onDeleteIdea={handleDeleteIdea}
            onOpenCopilot={() => setCopilotOpen(true)}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsManagementView
            projects={projects}
            ideas={ideas}
            tasks={tasks}
            onOpenCreateProjectModal={() => {
              setProjectToEdit(null);
              setProjectModalOpen(true);
            }}
            onEditProject={(project) => {
              setProjectToEdit(project);
              setProjectModalOpen(true);
            }}
            onDeleteProject={handleDeleteProject}
            onNavigateTab={handleNavigateTab}
            onDeleteIdea={handleDeleteIdea}
          />
        )}
          </motion.div>
        </AnimatePresence>
        </main>
      </div>

      {/* Global Modals */}
      {/* 1. Natural Language Calendar Review Modal */}
      <NaturalLanguageModal
        isOpen={nlModalOpen}
        onClose={() => setNlModalOpen(false)}
        onEventCreated={handleCreateEventFromNL}
        projects={projects}
        tasks={tasks}
        initialPrompt={nlInitialPrompt}
      />

      {/* 2. Manual Calendar Event Modal */}
      <EventModal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        onSave={handleSaveManualEvent}
        onDelete={handleDeleteEvent}
        eventToEdit={eventToEdit}
        defaultDate={eventDefaultDate}
        projects={projects}
        tasks={tasks}
      />

      {/* 3. Task Creation & Edit Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
        onScheduleToCalendar={handleScheduleTaskToCalendar}
        taskToEdit={taskToEdit}
        projects={projects}
        ideas={ideas}
      />

      {/* 4. Idea & Knowledge Node Modal */}
      <IdeaModal
        isOpen={ideaModalOpen}
        onClose={() => setIdeaModalOpen(false)}
        idea={ideaToEdit}
        edges={edges}
        allIdeas={ideas}
        projects={projects}
        onSaveIdea={handleSaveIdea}
        onDeleteIdea={handleDeleteIdea}
        onRemoveEdge={handleRemoveEdge}
        onOpenAddConnection={(source) => {
          setConnectionSourceIdea(source);
          setConnectionModalOpen(true);
        }}
        onConvertIdeaToTask={handleConvertIdeaToTask}
      />

      {/* 5. Add Connection in Knowledge Graph Modal */}
      <AddConnectionModal
        isOpen={connectionModalOpen}
        onClose={() => setConnectionModalOpen(false)}
        sourceIdea={connectionSourceIdea}
        allIdeas={ideas}
        onAddConnection={handleAddConnection}
      />

      {/* 6. Project Modal */}
      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSave={handleSaveProject}
        projectToEdit={projectToEdit}
      />

      {/* 7. Dedicated Focus & Pomodoro Station */}
      <FocusTimer
        tasks={tasks}
        onToggleTaskComplete={handleToggleTaskComplete}
        initialTaskId={timerTaskId}
        isOpen={timerOpen}
        onClose={() => setTimerOpen(false)}
        isFloatingMinimized={timerMinimized}
        setIsFloatingMinimized={setTimerMinimized}
      />

      {/* 8. Full-Workspace Conversational Copilot Drawer */}
      <ConversationalCopilot
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        events={events}
        tasks={tasks}
        ideas={ideas}
        edges={edges}
        projects={projects}
        activeView={activeTab}
        onAddEvent={(newEvent) => {
          storageService.createEvent(newEvent);
          refreshAll();
          addToast('Event Scheduled', `"${newEvent.title}" added to Calendar`);
        }}
        onDeleteEvent={handleDeleteEvent}
        onAddTask={(newTask) => {
          storageService.createTask(newTask);
          refreshAll();
          addToast('Task Created', `"${newTask.title}" added to Tasks`);
        }}
        onDeleteTask={handleDeleteTask}
        onToggleTaskComplete={handleToggleTaskComplete}
        onAddIdea={(newIdea) => {
          storageService.createIdea(newIdea);
          refreshAll();
          addToast('Idea Captured', `"${newIdea.title}" added to Knowledge Graph`);
        }}
        onDeleteIdea={handleDeleteIdea}
        onAddEdge={(newEdge) => {
          storageService.createEdge(newEdge);
          refreshAll();
          addToast('Ideas Connected', `Relationship linked in Knowledge Graph`);
        }}
        onNavigateTab={handleNavigateTab}
        onStartFocusTimer={(task) => {
          if (task) setTimerTaskId(task.id);
          setTimerOpen(true);
          setTimerMinimized(false);
        }}
        pendingQuery={pendingCopilotQuery}
        onClearPendingQuery={() => setPendingCopilotQuery(null)}
      />



      {/* Undoable Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {showTutorial && (
        <TutorialOverlay 
          onClose={() => {
            localStorage.setItem('zen_has_seen_tutorial', 'true');
            setShowTutorial(false);
          }} 
        />
      )}
    </div>
  );
}
