export type PriorityLevel = 'high' | 'medium' | 'low';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: PriorityLevel;
  status: TaskStatus;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  projectId?: string;
  tags: string[];
  estimatedMinutes?: number;
  originatingIdeaId?: string; // Links task to sparking Idea
  calendarEventId?: string; // Links task to calendar timeblock
  createdAt: string;
  completedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  connectedIdeaId?: string;
}

export type EventRecurrence = 'none' | 'daily' | 'weekly' | 'weekdays' | 'monthly';

export type EventCategory = 'meeting' | 'deep_work' | 'study' | 'personal' | 'deadline' | 'review';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm (24h)
  durationMinutes: number;
  isAllDay?: boolean;
  recurrence: EventRecurrence;
  recurrenceRuleText?: string;
  category: EventCategory;
  color: string;
  connectedTaskId?: string;
  connectedProjectId?: string;
  sourceText?: string; // Natural language input that generated this event
  createdAt: string;
}

export interface NaturalLanguageParsingResult {
  rawText: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm
  durationMinutes: number;
  isAllDay: boolean;
  recurrence: EventRecurrence;
  recurrenceRuleText?: string;
  category: EventCategory;
  color: string;
  confidence: number; // 0.0 - 1.0
  uncertainties: string[]; // Clarifications e.g. "Duration defaulted to 60m"
  detectedEntities?: {
    dateEntity?: string;
    timeEntity?: string;
    durationEntity?: string;
    recurrenceEntity?: string;
  };
}

export type IdeaType = 'concept' | 'hypothesis' | 'insight' | 'question' | 'reference' | 'resource';

export type RelationshipType = 
  | 'related_to'
  | 'supports'
  | 'contradicts'
  | 'depends_on'
  | 'inspired_by'
  | 'part_of'
  | 'derived_from';

export interface IdeaNode {
  id: string;
  title: string;
  content: string;
  type: IdeaType;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  metadata?: {
    connectedTaskId?: string;
    connectedProjectId?: string;
    color?: string;
    x?: number;
    y?: number;
    pinned?: boolean;
  };
}

export interface IdeaEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationshipType: RelationshipType;
  metadata?: {
    label?: string;
    note?: string;
    strength?: number;
  };
  createdAt: string;
}

export interface ToastNotification {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'info' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export type ActiveView = 'dashboard' | 'calendar' | 'tasks' | 'ideas' | 'projects';

export type CalendarViewMode = 'day' | 'week' | 'month';

export type ConversationalActionType = 
  | 'create_event'
  | 'delete_event'
  | 'create_task'
  | 'delete_task'
  | 'complete_task'
  | 'create_idea'
  | 'delete_idea'
  | 'connect_ideas'
  | 'start_timer'
  | 'navigate_view';

export interface ConversationalAction {
  id: string;
  type: ConversationalActionType;
  summary: string;
  payload: any;
  executed?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actions?: ConversationalAction[];
  suggestedFollowUps?: string[];
  isVoiceInput?: boolean;
}
