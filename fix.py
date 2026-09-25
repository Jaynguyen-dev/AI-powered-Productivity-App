import sys
import re

with open('src/services/conversationService.ts', 'r') as f:
    content = f.read()

bad_block = re.search(r'// 2\. Try Local LLM.*?// 3\. Client-side rule-based fallback engine', content, re.DOTALL)
if bad_block:
    new_code = """// 2. Try Local LLM (Ollama / LM Studio)
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

    // 3. Client-side rule-based fallback engine"""
    
    content = content[:bad_block.start()] + new_code + content[bad_block.end():]
    with open('src/services/conversationService.ts', 'w') as f:
        f.write(content)
