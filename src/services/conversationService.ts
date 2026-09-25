import {
  ChatMessage,
  ConversationalAction,
  CalendarEvent,
  Task,
  IdeaNode,
  IdeaEdge,
  Project,
  PriorityLevel,
  ActiveView,
} from '../types';
import { RuleBasedSchedulingParser } from './schedulingParser';

export interface WorkspaceContext {
  currentDate: string; // YYYY-MM-DD
  currentTime: string; // HH:mm
  events: CalendarEvent[];
  tasks: Task[];
  ideas: IdeaNode[];
  edges: IdeaEdge[];
  projects: Project[];
  activeView: ActiveView;
}

export interface ConversationResponse {
  reply: string;
  actions: ConversationalAction[];
  suggestedFollowUps?: string[];
}

export class ConversationService {
  private schedulingParser = new RuleBasedSchedulingParser();

  async processMessage(
    userMessage: string,
    history: ChatMessage[],
    context: WorkspaceContext
  ): Promise<ConversationResponse> {
    // 1. First attempt to call the server-side Gemini endpoint
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: history.slice(-8).map((msg) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          })),
          workspaceContext: context,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.reply) {
          return {
            reply: data.reply,
            actions: data.actions || [],
            suggestedFollowUps: data.suggestedFollowUps || [],
          };
        }
      }
    } catch (err) {
      console.warn('Backend /api/chat not available or error, checking for local LLM (Ollama/LM Studio):', err);
    }

    // 2. Try Local LLM (Ollama / LM Studio)
    try {
      // Common default local endpoints
      const localEndpoints = [
        'http://localhost:11434/v1/chat/completions', // Ollama
        'http://localhost:1234/v1/chat/completions'   // LM Studio
      ];

      for (const endpoint of localEndpoints) {
        try {
          // System prompt injecting the exact workspace state
          const systemPrompt = `You are Zen, a highly capable productivity assistant.
The user is managing their tasks, calendar, and ideas.
CURRENT DATE: ${context.currentDate}
CURRENT TIME: ${context.currentTime}
PENDING TASKS: ${JSON.stringify(context.tasks.filter(t => t.status !== 'completed').map(t => t.title))}
EVENTS TODAY: ${JSON.stringify(context.events.filter(e => e.startDate === context.currentDate).map(e => e.title))}

Answer the user directly and concisely.`;

          const messages = [
            { role: 'system', content: systemPrompt },
            ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ];

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'llama3', // Default for ollama, LM studio ignores
              messages,
              temperature: 0.7,
              max_tokens: 300,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const reply = data.choices[0].message.content;
            return {
              reply: reply,
              actions: [], // Local LLM tool-calling can be implemented here later
              suggestedFollowUps: [],
            };
          }
        } catch (e) {
          // Ignore connection errors and try next endpoint, or fallback
        }
      }
    } catch (err) {
      // Fallthrough
    }

    // 3. Client-side rule-based fallback engine
    return this.fallbackLocalAgent(userMessage, context);
  }

  private async fallbackLocalAgent(
    input: string,
    context: WorkspaceContext
  ): Promise<ConversationResponse> {
    const raw = input.trim();
    const lower = raw.toLowerCase();

    // A. View Navigation intent (e.g. "go to calendar", "switch to tasks", "show ideas", "open graph")
    if (
      lower.includes('calendar') &&
      (lower.includes('show') || lower.includes('go to') || lower.includes('open') || lower.includes('view') || lower.includes('switch'))
    ) {
      return {
        reply: "Switching to your Calendar view now. Here is your full visual schedule.",
        actions: [
          {
            id: `act-${Date.now()}`,
            type: 'navigate_view',
            summary: 'Switch view to Calendar',
            payload: { view: 'calendar' },
            executed: false,
          },
        ],
        suggestedFollowUps: ["What's on my schedule today?", "Schedule a meeting tomorrow at 2pm"],
      };
    }

    if (
      (lower.includes('task') || lower.includes('todo')) &&
      (lower.includes('show') || lower.includes('go to') || lower.includes('open') || lower.includes('view') || lower.includes('switch') || lower.includes('list'))
    ) {
      return {
        reply: "Navigating to your Task Management view. Here are your organized priorities.",
        actions: [
          {
            id: `act-${Date.now()}`,
            type: 'navigate_view',
            summary: 'Switch view to Tasks',
            payload: { view: 'tasks' },
            executed: false,
          },
        ],
        suggestedFollowUps: ["What are my high priority tasks?", "Add a new task with due date"],
      };
    }

    if (
      (lower.includes('idea') || lower.includes('graph') || lower.includes('mind map')) &&
      (lower.includes('show') || lower.includes('go to') || lower.includes('open') || lower.includes('view') || lower.includes('switch'))
    ) {
      return {
        reply: "Opening your Knowledge Graph view. Explore your interconnected ideas and concept nodes.",
        actions: [
          {
            id: `act-${Date.now()}`,
            type: 'navigate_view',
            summary: 'Switch view to Knowledge Graph',
            payload: { view: 'ideas' },
            executed: false,
          },
        ],
        suggestedFollowUps: ["Create a new concept node", "Connect two ideas"],
      };
    }

    if (
      (lower.includes('dashboard') || lower.includes('home') || lower.includes('overview')) &&
      (lower.includes('show') || lower.includes('go to') || lower.includes('open') || lower.includes('view') || lower.includes('switch'))
    ) {
      return {
        reply: "Here is your central Dashboard overview.",
        actions: [
          {
            id: `act-${Date.now()}`,
            type: 'navigate_view',
            summary: 'Switch view to Dashboard',
            payload: { view: 'dashboard' },
            executed: false,
          },
        ],
        suggestedFollowUps: ["What's on my schedule today?", "What high priority tasks do I have?"],
      };
    }

    // B. Query Schedule / "What's on my schedule today?"
    if (
      lower.includes("what's on my schedule") ||
      lower.includes("what is on my schedule") ||
      lower.includes("my schedule today") ||
      lower.includes("my calendar today") ||
      lower.includes("events today") ||
      lower.includes("agenda today") ||
      lower.includes("what do i have today") ||
      lower.includes("what's up today")
    ) {
      const todayEvents = context.events.filter(
        (e) => e.startDate === context.currentDate
      );
      if (todayEvents.length === 0) {
        return {
          reply: `You have no calendar events scheduled for today (${context.currentDate}). Your schedule is wide open for deep work or rest!`,
          actions: [],
          suggestedFollowUps: [
            "Start a 25-minute Pomodoro session",
            "What high priority tasks do I have?",
            "Schedule a focus block at 2pm",
          ],
        };
      }

      const eventList = todayEvents
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map((e) => `• **${e.title}** from ${e.startTime} to ${e.endTime} (${e.category})`)
        .join('\n');

      return {
        reply: `You have **${todayEvents.length} event${todayEvents.length > 1 ? 's' : ''}** scheduled for today (${context.currentDate}):\n\n${eventList}`,
        actions: [],
        suggestedFollowUps: [
          "Start a focus session",
          "What tasks do I have due today?",
          "Schedule another meeting tomorrow",
        ],
      };
    }

    // C. Query Tasks / "What are my high priority tasks?"
    if (
      lower.includes('what tasks') ||
      lower.includes('my tasks') ||
      lower.includes('high priority') ||
      lower.includes('todo list') ||
      lower.includes('what should i work on') ||
      lower.includes('what to do next')
    ) {
      const pendingTasks = context.tasks.filter((t) => t.status !== 'completed');
      const highTasks = pendingTasks.filter((t) => t.priority === 'high');

      if (pendingTasks.length === 0) {
        return {
          reply: "All clear! You have 0 pending tasks in your workspace right now. Excellent work!",
          actions: [],
          suggestedFollowUps: [
            "Add a new task",
            "Brainstorm ideas in the knowledge graph",
            "Check my calendar for tomorrow",
          ],
        };
      }

      let text = `You currently have **${pendingTasks.length} active task${pendingTasks.length > 1 ? 's' : ''}**`;
      if (highTasks.length > 0) {
        text += `, including **${highTasks.length} HIGH priority** item${highTasks.length > 1 ? 's' : ''}:\n\n`;
        text += highTasks
          .map(
            (t) =>
              `• 🔴 **${t.title}** ${t.dueDate ? `(Due: ${t.dueDate})` : ''} ${
                t.estimatedMinutes ? `(~${t.estimatedMinutes}m)` : ''
              }`
          )
          .join('\n');
      } else {
        text += `:\n\n` + pendingTasks.slice(0, 5).map((t) => `• [${t.priority.toUpperCase()}] **${t.title}**`).join('\n');
      }

      return {
        reply: text,
        actions: [],
        suggestedFollowUps: [
          highTasks[0] ? `Start focus session on "${highTasks[0].title}"` : "Start a 25-minute Pomodoro",
          "Go to tasks view",
          "Schedule a timeblock for my top task",
        ],
      };
    }

    // D. Focus Timer / Pomodoro Intent
    if (
      lower.includes('start timer') ||
      lower.includes('start pomodoro') ||
      lower.includes('focus timer') ||
      lower.includes('deep work session') ||
      lower.includes('start focus') ||
      lower.includes('start sprint')
    ) {
      let durationMinutes = 25;
      if (lower.includes('50') || lower.includes('deep work')) durationMinutes = 50;
      else if (lower.includes('15') || lower.includes('sprint')) durationMinutes = 15;
      else {
        const matchMin = lower.match(/(\d+)\s*(?:min|minute)/);
        if (matchMin) durationMinutes = parseInt(matchMin[1], 10);
      }

      // Try to find a matched task
      const topTask = context.tasks.find((t) => t.status !== 'completed' && t.priority === 'high') ||
                      context.tasks.find((t) => t.status !== 'completed');

      return {
        reply: `Starting a **${durationMinutes}-minute focus session**${topTask ? ` linked to **"${topTask.title}"**` : ''}. Time to dial in and eliminate distractions!`,
        actions: [
          {
            id: `act-${Date.now()}`,
            type: 'start_timer',
            summary: `Start ${durationMinutes}m focus session${topTask ? ` on ${topTask.title}` : ''}`,
            payload: {
              durationMinutes,
              taskId: topTask?.id,
            },
            executed: false,
          },
        ],
        suggestedFollowUps: ["Show my tasks", "What's on my schedule today?"],
      };
    }

    // E. Delete Calendar Event Intent
    if (
      /(?:delete|remove|cancel|drop)\s+(?:my\s+)?(?:the\s+)?(?:event|meeting|appointment|calendar\s+entry)/i.test(lower) ||
      /(?:delete|remove|cancel)\s+.+(?:from\s+(?:my\s+)?calendar)/i.test(lower)
    ) {
      const keyword = raw
        .replace(/(?:please\s+)?(?:can you\s+)?(?:delete|remove|cancel|drop)\s+(?:my\s+)?(?:the\s+)?(?:event|meeting|appointment|calendar\s+entry)[:\s]*/i, '')
        .replace(/\s*from\s+(?:my\s+)?calendar\s*$/i, '')
        .replace(/^[\"']|[\"']$/g, '')
        .trim();
      const match = context.events.find(e =>
        e.title.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(e.title.toLowerCase())
      );
      if (match) {
        return {
          reply: `Removed event **"${match.title}"** from your calendar.`,
          actions: [{
            id: `act-${Date.now()}`,
            type: 'delete_event',
            summary: `Delete event "${match.title}"`,
            payload: { eventId: match.id, eventTitle: match.title },
            executed: false,
          }],
          suggestedFollowUps: ["What's on my schedule today?", "Schedule a new event"],
        };
      } else if (keyword) {
        return {
          reply: `I couldn't find an event matching **"${keyword}"** on your calendar. Try asking *"What's on my schedule today?"* to see your events.`,
          actions: [],
          suggestedFollowUps: ["What's on my schedule today?"],
        };
      }
    }

    // E2. Delete Task Intent
    if (
      /(?:delete|remove|drop)\s+(?:my\s+)?(?:the\s+)?task/i.test(lower) ||
      /(?:delete|remove)\s+task[:\s]/i.test(lower)
    ) {
      const keyword = raw
        .replace(/(?:please\s+)?(?:can you\s+)?(?:delete|remove|drop)\s+(?:my\s+)?(?:the\s+)?task[:\s]*/i, '')
        .replace(/^[\"']|[\"']$/g, '')
        .trim();
      const match = context.tasks.find(t =>
        t.title.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(t.title.toLowerCase())
      );
      if (match) {
        return {
          reply: `Deleted task **"${match.title}"** from your list.`,
          actions: [{
            id: `act-${Date.now()}`,
            type: 'delete_task',
            summary: `Delete task "${match.title}"`,
            payload: { taskId: match.id, taskTitle: match.title },
            executed: false,
          }],
          suggestedFollowUps: ["Show my tasks", "What high priority tasks do I have?"],
        };
      } else if (keyword) {
        return {
          reply: `I couldn't find a task matching **"${keyword}"**. Try *"Show my tasks"* to see your list.`,
          actions: [],
          suggestedFollowUps: ["Show my tasks"],
        };
      }
    }

    // E3. Delete Idea Intent
    if (
      /(?:delete|remove|drop)\s+(?:my\s+)?(?:the\s+)?(?:idea|note|concept)/i.test(lower) ||
      /(?:delete|remove)\s+(?:idea|note|concept)[:\s]/i.test(lower)
    ) {
      const keyword = raw
        .replace(/(?:please\s+)?(?:can you\s+)?(?:delete|remove|drop)\s+(?:my\s+)?(?:the\s+)?(?:idea|note|concept)[:\s]*/i, '')
        .replace(/^[\"']|[\"']$/g, '')
        .trim();
      const match = context.ideas.find(i =>
        i.title.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(i.title.toLowerCase())
      );
      if (match) {
        return {
          reply: `Deleted idea **"${match.title}"** from your Knowledge Graph.`,
          actions: [{
            id: `act-${Date.now()}`,
            type: 'delete_idea',
            summary: `Delete idea "${match.title}"`,
            payload: { ideaId: match.id, ideaTitle: match.title },
            executed: false,
          }],
          suggestedFollowUps: ["Show my ideas", "Create a new idea"],
        };
      } else if (keyword) {
        return {
          reply: `I couldn't find an idea matching **"${keyword}"**. Try *"Show my ideas"* to see your graph.`,
          actions: [],
          suggestedFollowUps: ["Show my ideas"],
        };
      }
    }

    // F. Complete Task Intent
    if (
      lower.startsWith('complete task') ||
      lower.startsWith('mark task') ||
      lower.startsWith('finish task') ||
      lower.startsWith('done with task') ||
      lower.includes('as completed') ||
      lower.includes('as done')
    ) {
      // Find candidate task
      let candidateTitle = raw
        .replace(/^(complete task|mark task|finish task|done with task|done with|complete|finish)\s*/i, '')
        .replace(/\s*(as completed|as done|completed|done)\s*$/i, '')
        .replace(/^["']|["']$/g, '')
        .trim();

      const matchedTask = context.tasks.find(
        (t) =>
          t.title.toLowerCase().includes(candidateTitle.toLowerCase()) ||
          candidateTitle.toLowerCase().includes(t.title.toLowerCase())
      );

      if (matchedTask) {
        return {
          reply: `Marked task **"${matchedTask.title}"** as completed! Great progress.`,
          actions: [
            {
              id: `act-${Date.now()}`,
              type: 'complete_task',
              summary: `Mark "${matchedTask.title}" as completed`,
              payload: { taskId: matchedTask.id },
              executed: false,
            },
          ],
          suggestedFollowUps: [
            "What tasks are remaining?",
            "What's on my schedule today?",
          ],
        };
      }
    }

    // F. Create Idea / Knowledge Graph Node Intent
    if (
      /(?:create|add|new|note|brainstorm|capture)\s+(?:an?\s+)?(?:idea|concept|thought|hypothesis|insight|question)/i.test(lower) ||
      lower.startsWith('idea:') ||
      lower.startsWith('brainstorm:')
    ) {
      let contentText = raw
        .replace(/^(?:please\s+)?(?:can you\s+)?(?:create|add|new|note|brainstorm|capture)\s+(?:an?\s+)?(?:idea|concept|thought|hypothesis|insight|question)[:\s]*/i, '')
        .replace(/^about\s+/i, '')
        .trim();

      const title = contentText.length > 50 ? contentText.slice(0, 47) + '...' : contentText || 'New Concept';

      return {
        reply: `Added new idea node **"${title}"** to your Knowledge Graph!`,
        actions: [
          {
            id: `act-${Date.now()}`,
            type: 'create_idea',
            summary: `Add idea "${title}" to Knowledge Graph`,
            payload: {
              title,
              content: contentText,
              type: 'concept',
              tags: ['ai-captured'],
            },
            executed: false,
          },
        ],
        suggestedFollowUps: [
          "Open Knowledge Graph view",
          "Connect this idea to another concept",
          "Convert this idea into a task",
        ],
      };
    }

    // G. Create Task Intent
    if (
      /(?:create|add|new|make|put)\s+(?:a\s+)?(?:task|todo)/i.test(lower) ||
      lower.startsWith('task:') ||
      lower.startsWith('todo:') ||
      lower.includes('remind me to') ||
      lower.startsWith('add task') ||
      lower.startsWith('new task')
    ) {
      let taskTitle = raw
        .replace(/^(?:please\s+)?(?:can you\s+)?(?:create|add|new|make|put)\s+(?:a\s+)?(?:task|todo)[:\s]*/i, '')
        .replace(/^(?:task:|todo:|remind me to)\s*/i, '')
        .trim();

      let priority: PriorityLevel = 'medium';
      if (lower.includes('high priority') || lower.includes('urgent') || lower.includes('asap')) {
        priority = 'high';
        taskTitle = taskTitle.replace(/\b(with\s+)?(high priority|urgent|asap)\b/gi, '').trim();
      } else if (lower.includes('low priority')) {
        priority = 'low';
        taskTitle = taskTitle.replace(/\b(with\s+)?low priority\b/gi, '').trim();
      }

      let dueDate: string | undefined = undefined;
      if (lower.includes('due tomorrow') || lower.includes('by tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dueDate = tomorrow.toISOString().slice(0, 10);
        taskTitle = taskTitle.replace(/\b(due\s+|by\s+)?tomorrow\b/gi, '').trim();
      } else if (lower.includes('due today') || lower.includes('by today')) {
        dueDate = context.currentDate;
        taskTitle = taskTitle.replace(/\b(due\s+|by\s+)?today\b/gi, '').trim();
      }

      if (!taskTitle) taskTitle = 'Untitled Task';

      return {
        reply: `Created ${priority.toUpperCase()} priority task: **"${taskTitle}"**${
          dueDate ? ` (Due: ${dueDate})` : ''
        }.`,
        actions: [
          {
            id: `act-${Date.now()}`,
            type: 'create_task',
            summary: `Create task "${taskTitle}" (${priority} priority)`,
            payload: {
              title: taskTitle,
              priority,
              dueDate,
              tags: ['copilot'],
              status: 'todo',
            },
            executed: false,
          },
        ],
        suggestedFollowUps: [
          "Show all tasks",
          `Start a focus timer on "${taskTitle}"`,
          "Schedule time on my calendar for this task",
        ],
      };
    }

    // H. Schedule Calendar Event Intent (default parse via rule-based scheduling engine)
    try {
      const parsed = await this.schedulingParser.parse(raw);
      if (parsed.title && parsed.startDate && parsed.startTime) {
        return {
          reply: `Scheduled **"${parsed.title}"** on **${parsed.startDate}** from **${parsed.startTime} to ${parsed.endTime}** (${parsed.category}).`,
          actions: [
            {
              id: `act-${Date.now()}`,
              type: 'create_event',
              summary: `Schedule "${parsed.title}" on ${parsed.startDate} at ${parsed.startTime}`,
              payload: {
                title: parsed.title,
                startDate: parsed.startDate,
                startTime: parsed.startTime,
                endDate: parsed.endDate,
                endTime: parsed.endTime,
                durationMinutes: parsed.durationMinutes,
                category: parsed.category,
                recurrence: parsed.recurrence,
                recurrenceRuleText: parsed.recurrenceRuleText,
                color: parsed.color,
                sourceText: raw,
              },
              executed: false,
            },
          ],
          suggestedFollowUps: [
            "View on Calendar",
            "What else is on my schedule today?",
            "Add a reminder task for this event",
          ],
        };
      }
    } catch {
      // Not a scheduling command
    }

    // I. Friendly conversational answer
    return {
      reply: `I am your Aura Workspace Copilot. You can talk to me directly to manage everything:\n\n• **Schedule**: "Schedule Architecture Sync tomorrow at 2pm for 45 mins"\n• **Tasks**: "Add high priority task: Ship landing page due tomorrow"\n• **Ideas**: "Create idea: Multi-agent coordination protocols"\n• **Focus**: "Start 25-minute Pomodoro session on my top task"\n• **Queries**: "What's on my schedule today?" or "What high priority tasks do I have?"\n\nHow can I help you right now?`,
      actions: [],
      suggestedFollowUps: [
        "What's on my schedule today?",
        "What are my high priority tasks?",
        "Start a 25-minute focus session",
      ],
    };
  }
}

export const conversationService = new ConversationService();
