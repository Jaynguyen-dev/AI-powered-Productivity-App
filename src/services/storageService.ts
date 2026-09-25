import { Task, Project, CalendarEvent, IdeaNode, IdeaEdge } from '../types';

const STORAGE_KEYS = {
  TASKS: 'aura_workspace_tasks_v1',
  PROJECTS: 'aura_workspace_projects_v1',
  EVENTS: 'aura_workspace_events_v1',
  IDEAS: 'aura_workspace_ideas_v1',
  EDGES: 'aura_workspace_edges_v1',
  THEME: 'aura_workspace_theme_v1',
};

export const INITIAL_PROJECTS: Project[] = [];
export const INITIAL_IDEAS: IdeaNode[] = [];
export const INITIAL_EDGES: IdeaEdge[] = [];
export const INITIAL_TASKS: Task[] = [];
export const INITIAL_EVENTS: CalendarEvent[] = [];

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
