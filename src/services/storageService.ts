import { Task, Project, CalendarEvent, IdeaNode, IdeaEdge } from '../types';

const STORAGE_KEYS = {
  TASKS: 'aura_workspace_tasks_v1',
  PROJECTS: 'aura_workspace_projects_v1',
  EVENTS: 'aura_workspace_events_v1',
  IDEAS: 'aura_workspace_ideas_v1',
  EDGES: 'aura_workspace_edges_v1',
  THEME: 'aura_workspace_theme_v1',
};

// Initial realistic seed dataset anchored around current date
export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Computer Vision Research',
    description: 'Lightweight segmentation and efficient neural architectures',
    color: '#10b981', // emerald
    connectedIdeaId: 'idea-1',
  },
  {
    id: 'proj-2',
    name: 'Distributed Systems',
    description: 'Consensus protocols and fault-tolerant state machine replication',
    color: '#6366f1', // indigo
  },
  {
    id: 'proj-3',
    name: 'Personal & Wellness',
    description: 'Physical training, reading, and mental wellness',
    color: '#f59e0b', // amber
  },
];

export const INITIAL_IDEAS: IdeaNode[] = [
  {
    id: 'idea-1',
    title: 'Lightweight Real-Time Segmentation Architecture',
    content: 'Designing an ultra-low latency semantic segmentation backbone that achieves >45 FPS on edge devices without sacrificing boundary fidelity on fine details.',
    type: 'concept',
    tags: ['vision', 'edge-ai', 'efficiency', 'mobile'],
    createdAt: '2026-09-15T10:00:00.000Z',
    updatedAt: '2026-09-17T14:30:00.000Z',
    metadata: {
      connectedProjectId: 'proj-1',
      x: 320,
      y: 260,
    },
  },
  {
    id: 'idea-2',
    title: 'Knowledge Distillation via Multi-Scale Feature Mimicking',
    content: 'What if we transfer intermediate feature representations from a heavier ConvNeXt teacher into the lightweight inverted bottleneck student, weighting boundary pixels higher?',
    type: 'hypothesis',
    tags: ['distillation', 'vision', 'optimization'],
    createdAt: '2026-09-16T11:20:00.000Z',
    updatedAt: '2026-09-18T09:15:00.000Z',
    metadata: {
      connectedProjectId: 'proj-1',
      connectedTaskId: 'task-1',
      x: 520,
      y: 160,
    },
  },
  {
    id: 'idea-3',
    title: 'Structured Pruning for Redundant Attention Heads',
    content: 'Empirical analysis shows that up to 35% of self-attention heads in early ViT layers exhibit near-identical attention maps during spatial pooling.',
    type: 'insight',
    tags: ['transformers', 'pruning', 'efficiency'],
    createdAt: '2026-09-16T15:45:00.000Z',
    updatedAt: '2026-09-16T15:45:00.000Z',
    metadata: {
      x: 540,
      y: 380,
    },
  },
  {
    id: 'idea-4',
    title: 'Post-Training 8-Bit Quantization Calibration',
    content: 'Using asymmetric per-channel quantization on activation tensors with KL-divergence histogram calibration to mitigate accuracy degradation.',
    type: 'concept',
    tags: ['quantization', 'hardware', 'deployment'],
    createdAt: '2026-09-17T08:00:00.000Z',
    updatedAt: '2026-09-17T12:10:00.000Z',
    metadata: {
      x: 180,
      y: 400,
    },
  },
  {
    id: 'idea-5',
    title: 'Can token mixer redundancy explain mobile ViT throughput cliffs?',
    content: 'Why do depthwise convolutions outperform linear self-attention layers on mobile hardware despite having higher FLOP counts? Memory bandwidth bottleneck hypothesis.',
    type: 'question',
    tags: ['vision', 'hardware-efficiency', 'architecture'],
    createdAt: '2026-09-18T13:30:00.000Z',
    updatedAt: '2026-09-18T13:30:00.000Z',
    metadata: {
      x: 360,
      y: 490,
    },
  },
  {
    id: 'idea-6',
    title: 'Automated Profiling Suite for Embedded Tensor Accelerators',
    content: 'Python utility wrapper executing TFLite / ONNX Runtime benchmarks with power consumption telemetry logging.',
    type: 'resource',
    tags: ['tooling', 'benchmark', 'deployment'],
    createdAt: '2026-09-18T16:00:00.000Z',
    updatedAt: '2026-09-18T16:00:00.000Z',
    metadata: {
      x: 120,
      y: 180,
    },
  },
];

export const INITIAL_EDGES: IdeaEdge[] = [
  {
    id: 'edge-1',
    sourceId: 'idea-2',
    targetId: 'idea-1',
    relationshipType: 'supports',
    metadata: { label: 'Feature mimicking boosts student mIoU by 3.2%' },
    createdAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: 'edge-2',
    sourceId: 'idea-3',
    targetId: 'idea-2',
    relationshipType: 'related_to',
    metadata: { label: 'Combined pruning + student distillation' },
    createdAt: '2026-09-16T16:00:00.000Z',
  },
  {
    id: 'edge-3',
    sourceId: 'idea-4',
    targetId: 'idea-1',
    relationshipType: 'depends_on',
    metadata: { label: 'Quantization applied after baseline stabilization' },
    createdAt: '2026-09-17T09:00:00.000Z',
  },
  {
    id: 'edge-4',
    sourceId: 'idea-5',
    targetId: 'idea-2',
    relationshipType: 'inspired_by',
    metadata: { label: 'Bandwidth findings inspire distillation loss' },
    createdAt: '2026-09-18T14:00:00.000Z',
  },
  {
    id: 'edge-5',
    sourceId: 'idea-6',
    targetId: 'idea-4',
    relationshipType: 'supports',
    metadata: { label: 'Validates real latency of INT8 kernels' },
    createdAt: '2026-09-18T16:30:00.000Z',
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Implement multi-scale knowledge distillation loss function',
    description: 'Combine cross-entropy, Kullback-Leibler divergence, and L2 intermediate feature mimic loss with gradient scaling.',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2026-09-20',
    dueTime: '17:00',
    projectId: 'proj-1',
    tags: ['pytorch', 'modeling', 'experiment'],
    estimatedMinutes: 120,
    originatingIdeaId: 'idea-2',
    createdAt: '2026-09-17T10:00:00.000Z',
  },
  {
    id: 'task-2',
    title: 'Prepare slide deck for supervisor sync',
    description: 'Summarize Cityscapes validation results, FPS comparisons, and distillation ablation experiments.',
    priority: 'high',
    status: 'todo',
    dueDate: '2026-09-19',
    dueTime: '13:30',
    projectId: 'proj-1',
    tags: ['presentation', 'sync'],
    estimatedMinutes: 60,
    createdAt: '2026-09-18T09:00:00.000Z',
  },
  {
    id: 'task-3',
    title: 'Benchmark latency on Jetson Orin edge board',
    description: 'Run 1000 warmup iterations and capture 99th percentile inference latency across batch sizes 1 and 4.',
    priority: 'medium',
    status: 'todo',
    dueDate: '2026-09-21',
    dueTime: '16:00',
    projectId: 'proj-1',
    tags: ['benchmark', 'hardware'],
    estimatedMinutes: 90,
    originatingIdeaId: 'idea-6',
    createdAt: '2026-09-18T11:00:00.000Z',
  },
  {
    id: 'task-4',
    title: 'Review Raft consensus leader election edge cases',
    description: 'Study network partition behaviors, term increments, and randomized election timeout parameters.',
    priority: 'medium',
    status: 'todo',
    dueDate: '2026-09-22',
    dueTime: '18:00',
    projectId: 'proj-2',
    tags: ['reading', 'consensus'],
    estimatedMinutes: 75,
    createdAt: '2026-09-18T14:00:00.000Z',
  },
  {
    id: 'task-5',
    title: 'Reorganize research bibliography and paper highlights',
    description: 'Export BibTeX keys and clean up tag hierarchy in Zotero library.',
    priority: 'low',
    status: 'todo',
    dueDate: '2026-09-24',
    projectId: 'proj-1',
    tags: ['organization'],
    estimatedMinutes: 30,
    createdAt: '2026-09-18T15:00:00.000Z',
  },
  {
    id: 'task-6',
    title: 'Set up baseline MobileNetV3 evaluation pipeline',
    description: 'Verified accuracy on Cityscapes test split matching published literature baseline.',
    priority: 'medium',
    status: 'completed',
    dueDate: '2026-09-17',
    projectId: 'proj-1',
    tags: ['baseline', 'verified'],
    estimatedMinutes: 60,
    createdAt: '2026-09-15T09:00:00.000Z',
    completedAt: '2026-09-17T16:20:00.000Z',
  },
];

export const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Meeting with my supervisor',
    description: 'Bi-weekly research progress sync on segmentation and distillation experiments.',
    startDate: '2026-09-20',
    startTime: '14:00',
    endDate: '2026-09-20',
    endTime: '15:00',
    durationMinutes: 60,
    recurrence: 'none',
    category: 'meeting',
    color: '#6366f1',
    connectedProjectId: 'proj-1',
    sourceText: 'Meeting with my supervisor tomorrow at 2 PM for one hour',
    createdAt: '2026-09-18T10:00:00.000Z',
  },
  {
    id: 'event-2',
    title: 'Study computer vision',
    description: 'Focused literature review and architecture study session.',
    startDate: '2026-09-22',
    startTime: '19:00',
    endDate: '2026-09-22',
    endTime: '21:00',
    durationMinutes: 120,
    recurrence: 'weekly',
    recurrenceRuleText: 'Every Tuesday',
    category: 'study',
    color: '#10b981',
    connectedProjectId: 'proj-1',
    sourceText: 'Study computer vision every Tuesday from 7 to 9 PM',
    createdAt: '2026-09-18T10:30:00.000Z',
  },
  {
    id: 'event-3',
    title: 'Deep Focus: Loss Function Math',
    description: 'Deriving numerical stability bounds for feature mimicking gradients.',
    startDate: '2026-09-19',
    startTime: '14:30',
    endDate: '2026-09-19',
    endTime: '16:30',
    durationMinutes: 120,
    recurrence: 'none',
    category: 'deep_work',
    color: '#06b6d4',
    connectedProjectId: 'proj-1',
    connectedTaskId: 'task-1',
    createdAt: '2026-09-19T08:00:00.000Z',
  },
  {
    id: 'event-4',
    title: 'Distributed Systems Lab Sync',
    description: 'Presentation of Raft vs Paxos benchmarks.',
    startDate: '2026-09-21',
    startTime: '10:00',
    endDate: '2026-09-21',
    endTime: '11:30',
    durationMinutes: 90,
    recurrence: 'weekly',
    recurrenceRuleText: 'Every Monday',
    category: 'meeting',
    color: '#8b5cf6',
    connectedProjectId: 'proj-2',
    createdAt: '2026-09-18T11:00:00.000Z',
  },
  {
    id: 'event-5',
    title: 'Sprint & Mobility Training',
    description: 'Zone 2 cardio and stretching interval.',
    startDate: '2026-09-19',
    startTime: '17:30',
    endDate: '2026-09-19',
    endTime: '18:30',
    durationMinutes: 60,
    recurrence: 'none',
    category: 'personal',
    color: '#f59e0b',
    connectedProjectId: 'proj-3',
    createdAt: '2026-09-19T08:05:00.000Z',
  },
];

export const storageService = {
  getTasks: (): Task[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : INITIAL_TASKS;
    } catch (e) {
      console.warn('Failed to read tasks from localStorage', e);
      return INITIAL_TASKS;
    }
  },

  saveTasks: (tasks: Task[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage', e);
    }
  },

  getProjects: (): Project[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return data ? JSON.parse(data) : INITIAL_PROJECTS;
    } catch (e) {
      return INITIAL_PROJECTS;
    }
  },

  saveProjects: (projects: Project[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects to localStorage', e);
    }
  },

  getEvents: (): CalendarEvent[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return data ? JSON.parse(data) : INITIAL_EVENTS;
    } catch (e) {
      return INITIAL_EVENTS;
    }
  },

  saveEvents: (events: CalendarEvent[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    } catch (e) {
      console.error('Failed to save events to localStorage', e);
    }
  },

  getIdeas: (): IdeaNode[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.IDEAS);
      return data ? JSON.parse(data) : INITIAL_IDEAS;
    } catch (e) {
      return INITIAL_IDEAS;
    }
  },

  saveIdeas: (ideas: IdeaNode[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.IDEAS, JSON.stringify(ideas));
    } catch (e) {
      console.error('Failed to save ideas to localStorage', e);
    }
  },

  getEdges: (): IdeaEdge[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EDGES);
      return data ? JSON.parse(data) : INITIAL_EDGES;
    } catch (e) {
      return INITIAL_EDGES;
    }
  },

  saveEdges: (edges: IdeaEdge[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.EDGES, JSON.stringify(edges));
    } catch (e) {
      console.error('Failed to save edges to localStorage', e);
    }
  },

  resetAllData: (): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
      localStorage.setItem(STORAGE_KEYS.IDEAS, JSON.stringify(INITIAL_IDEAS));
      localStorage.setItem(STORAGE_KEYS.EDGES, JSON.stringify(INITIAL_EDGES));
    } catch (e) {
      console.error('Failed to reset localStorage data', e);
    }
  },

  exportData: () => {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks: storageService.getTasks(),
      projects: storageService.getProjects(),
      events: storageService.getEvents(),
      ideas: storageService.getIdeas(),
      edges: storageService.getEdges(),
    };
  },

  importData: (jsonData: any): boolean => {
    try {
      if (jsonData.tasks) storageService.saveTasks(jsonData.tasks);
      if (jsonData.projects) storageService.saveProjects(jsonData.projects);
      if (jsonData.events) storageService.saveEvents(jsonData.events);
      if (jsonData.ideas) storageService.saveIdeas(jsonData.ideas);
      if (jsonData.edges) storageService.saveEdges(jsonData.edges);
      return true;
    } catch (e) {
      console.error('Failed to import JSON data', e);
      return false;
    }
  },

  // Task CRUD helpers
  createTask: (taskData: Omit<Task, 'id' | 'createdAt'> | Task): Task => {
    const tasks = storageService.getTasks();
    const newTask: Task = {
      ...taskData,
      id: 'id' in taskData ? taskData.id : `task-${Date.now()}`,
      createdAt: 'createdAt' in taskData && taskData.createdAt ? taskData.createdAt : new Date().toISOString(),
    };
    storageService.saveTasks([newTask, ...tasks]);
    return newTask;
  },

  updateTask: (task: Task): Task => {
    const tasks = storageService.getTasks();
    const updated = tasks.map((t) => (t.id === task.id ? task : t));
    storageService.saveTasks(updated);
    return task;
  },

  deleteTask: (taskId: string): void => {
    const tasks = storageService.getTasks();
    storageService.saveTasks(tasks.filter((t) => t.id !== taskId));
  },

  // Event CRUD helpers
  createEvent: (eventData: Omit<CalendarEvent, 'id' | 'createdAt'> | CalendarEvent): CalendarEvent => {
    const events = storageService.getEvents();
    const newEvent: CalendarEvent = {
      ...eventData,
      id: 'id' in eventData ? eventData.id : `event-${Date.now()}`,
      createdAt: 'createdAt' in eventData && eventData.createdAt ? eventData.createdAt : new Date().toISOString(),
    };
    storageService.saveEvents([...events, newEvent]);
    return newEvent;
  },

  updateEvent: (event: CalendarEvent): CalendarEvent => {
    const events = storageService.getEvents();
    const updated = events.map((e) => (e.id === event.id ? event : e));
    storageService.saveEvents(updated);
    return event;
  },

  deleteEvent: (eventId: string): void => {
    const events = storageService.getEvents();
    storageService.saveEvents(events.filter((e) => e.id !== eventId));
  },

  // Idea CRUD helpers
  createIdea: (ideaData: Omit<IdeaNode, 'id' | 'createdAt' | 'updatedAt'> | IdeaNode): IdeaNode => {
    const ideas = storageService.getIdeas();
    const now = new Date().toISOString();
    const newIdea: IdeaNode = {
      ...ideaData,
      id: 'id' in ideaData ? ideaData.id : `idea-${Date.now()}`,
      createdAt: 'createdAt' in ideaData && ideaData.createdAt ? ideaData.createdAt : now,
      updatedAt: 'updatedAt' in ideaData && ideaData.updatedAt ? ideaData.updatedAt : now,
    };
    storageService.saveIdeas([newIdea, ...ideas]);
    return newIdea;
  },

  updateIdea: (idea: IdeaNode): IdeaNode => {
    const ideas = storageService.getIdeas();
    const updated = ideas.map((i) => (i.id === idea.id ? { ...idea, updatedAt: new Date().toISOString() } : i));
    storageService.saveIdeas(updated);
    return idea;
  },

  deleteIdea: (ideaId: string): void => {
    const ideas = storageService.getIdeas();
    storageService.saveIdeas(ideas.filter((i) => i.id !== ideaId));
    // Also remove connected edges
    const edges = storageService.getEdges();
    storageService.saveEdges(edges.filter((e) => e.sourceId !== ideaId && e.targetId !== ideaId));
  },

  // Edge CRUD helpers
  createEdge: (edgeData: Omit<IdeaEdge, 'id' | 'createdAt'> | IdeaEdge): IdeaEdge => {
    const edges = storageService.getEdges();
    const newEdge: IdeaEdge = {
      ...edgeData,
      id: 'id' in edgeData ? edgeData.id : `edge-${Date.now()}`,
      createdAt: 'createdAt' in edgeData && edgeData.createdAt ? edgeData.createdAt : new Date().toISOString(),
    };
    storageService.saveEdges([...edges, newEdge]);
    return newEdge;
  },

  deleteEdge: (edgeId: string): void => {
    const edges = storageService.getEdges();
    storageService.saveEdges(edges.filter((e) => e.id !== edgeId));
  },

  // Project CRUD helpers
  createProject: (project: Project): Project => {
    const projects = storageService.getProjects();
    storageService.saveProjects([...projects, project]);
    return project;
  },

  updateProject: (project: Project): Project => {
    const projects = storageService.getProjects();
    const updated = projects.map((p) => (p.id === project.id ? project : p));
    storageService.saveProjects(updated);
    return project;
  },

  deleteProject: (projectId: string): void => {
    const projects = storageService.getProjects();
    storageService.saveProjects(projects.filter((p) => p.id !== projectId));
  },
};
