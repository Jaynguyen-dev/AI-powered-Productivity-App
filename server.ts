import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Conversational Copilot Route
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history, workspaceContext } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message text is required' });
      }

      const ai = getAI();
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured',
          fallbackRequired: true,
        });
      }

      const currentDate = workspaceContext?.currentDate || new Date().toISOString().slice(0, 10);
      const currentTime = workspaceContext?.currentTime || '09:00';

      const systemInstruction = `You are Zen, an intelligent, proactive executive copilot inside the "Zen Productivity Workspace".
The user drives the entire workspace through conversation with you:
- Scheduling calendar events
- Creating, prioritizing, and completing tasks
- Adding and linking ideas in the knowledge graph
- Starting focus/pomodoro timers
- Querying agenda, workload, and project status

CURRENT CONTEXT:
- Today's Date: ${currentDate}
- Current Time: ${currentTime}
- Existing Calendar Events: ${JSON.stringify(workspaceContext?.events?.slice(0, 20) || [])}
- Existing Tasks: ${JSON.stringify(workspaceContext?.tasks?.slice(0, 30) || [])}
- Existing Ideas: ${JSON.stringify(workspaceContext?.ideas?.slice(0, 20) || [])}
- Existing Projects: ${JSON.stringify(workspaceContext?.projects || [])}

RESPONSE INSTRUCTIONS:
You MUST respond with a valid JSON object strictly matching this schema:
{
  "reply": "Your natural, helpful, conversational markdown reply to the user. Explain any actions taken or answer questions directly.",
  "actions": [
    {
      "id": "unique-id",
      "type": "create_event" | "delete_event" | "create_task" | "delete_task" | "complete_task" | "create_idea" | "delete_idea" | "connect_ideas" | "start_timer" | "navigate_view",
      "summary": "Brief 1-sentence description of the action taken",
      "payload": {
        // For "create_event": { title, startDate (YYYY-MM-DD), startTime (HH:mm), endDate (YYYY-MM-DD), endTime (HH:mm), category: 'meeting'|'deep_work'|'study'|'personal'|'deadline'|'review', recurrence: 'none'|'daily'|'weekly'|'weekdays'|'monthly', color }
        // For "delete_event": { eventId } — match the id from existing events. If user references by title (e.g. "delete my standup"), find the best match and use its id. Include eventTitle in payload for confirmation.
        // For "create_task": { title, priority: 'high'|'medium'|'low', dueDate (YYYY-MM-DD optional), estimatedMinutes (optional), tags (array) }
        // For "delete_task": { taskId } — match the id from existing tasks. Include taskTitle in payload for confirmation.
        // For "complete_task": { taskId }
        // For "create_idea": { title, content, type: 'concept'|'hypothesis'|'insight'|'question'|'reference'|'resource', tags (array) }
        // For "delete_idea": { ideaId } — match the id from existing ideas. Include ideaTitle in payload for confirmation.
        // For "connect_ideas": { sourceId, targetId, relationshipType: 'related_to'|'supports'|'contradicts'|'depends_on'|'inspired_by'|'part_of'|'derived_from' }
        // For "start_timer": { durationMinutes (number), taskId (optional) }
        // For "navigate_view": { view: 'dashboard'|'calendar'|'tasks'|'ideas' }
      }
    }
  ],
  "suggestedFollowUps": ["Short follow-up 1", "Short follow-up 2", "Short follow-up 3"]
}

Guidelines:
1. Always infer exact dates accurately relative to today (${currentDate}). If user says "tomorrow", add 1 day. If they say "Friday", pick the upcoming Friday.
2. If the user asks a question (e.g. "What's on my schedule today?"), provide a clear, organized markdown summary in "reply" and leave "actions" empty ([]).
3. If the user commands an action (e.g. "Schedule team sync tomorrow at 3pm"), populate "actions" with the exact parameters and confirm in "reply".
4. Always provide 2-3 relevant "suggestedFollowUps" to keep the conversation flowing smoothly.
5. Return ONLY raw JSON without markdown code fences (\`\`\`json).`;

      const contents: any[] = [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          if (item.parts?.[0]?.text) {
            contents.push({
              role: item.role === 'model' ? 'model' : 'user',
              parts: [{ text: item.parts[0].text }],
            });
          }
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      // Try reliable fast models with fallback if experiencing temporary 503 spikes
      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
      let response: any = null;
      let lastErr: any = null;

      for (const model of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.15,
            },
          });
          if (response) break;
        } catch (err: any) {
          lastErr = err;
          console.warn(`Model ${model} failed, trying next fallback:`, err.message);
        }
      }

      if (!response && lastErr) {
        throw lastErr;
      }

      let cleaned = (response.text || '{}').trim();
      // Strip markdown code fences if returned by model
      if (cleaned.includes('```')) {
        cleaned = cleaned.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
      }

      try {
        const parsed = JSON.parse(cleaned);
        return res.json({
          reply: parsed.reply || 'I processed your request.',
          actions: parsed.actions || [],
          suggestedFollowUps: parsed.suggestedFollowUps || [],
        });
      } catch (parseErr) {
        console.error('Failed to parse Gemini JSON response:', cleaned);
        return res.json({
          reply: cleaned,
          actions: [],
          suggestedFollowUps: ["What's on my schedule today?", "What tasks do I have?"],
        });
      }
    } catch (err: any) {
      console.error('Error in /api/chat:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zen Workspace Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
