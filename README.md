# Zen: AI-Powered Productivity Workspace

Zen is an **agentic, spatial workspace** designed to unify your tasks, calendar, and knowledge graph into a single, cohesive environment. 

**Is this just a chatbot app?**  
No. While Zen features a conversational AI interface, it is far more than a chatbot. It is a fully functional productivity suite where the AI acts as an **executive assistant**. Instead of just answering questions, the AI has direct read/write access to your local workspace—it can physically schedule calendar events, create task tickets, link conceptual nodes in your knowledge graph, and manage your focus timers based on your natural language commands.

## ✨ Core Features

- **Conversational Copilot:** Leverages Large Language Models (LLMs) to intelligently parse unstructured prose into structured calendar events, actionable tasks, and interconnected knowledge nodes.
- **Interactive Knowledge Graph:** A visually mapped, physics-simulated graph data structure that allows you to spatially organize and explore semantic relationships between AI-extracted concepts and manual notes.
- **Dynamic 4K Environments:** A 4-stage, time-based background system that seamlessly cross-fades between stunning 4K environments (Morning, Afternoon, Evening, Midnight) based on your local time to maintain immersion.
- **Spatial Glassmorphism UI:** A premium, lightweight interface featuring true frosted glass panels, fluid animations, and a sophisticated dark aesthetic optimized for maximum readability and focus.
- **Activity & Consistency Mapping:** A GitHub-style contribution heatmap that automatically tracks your completed tasks and productivity streaks over a 52-week rolling window.
- **Edge-First Architecture:** Zero-latency client-side React state management that securely persists chatbot conversational context, schedules, and complex relational graphs entirely on your local machine.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A [Google Gemini API Key](https://aistudio.google.com/) for cloud LLM processing, OR a local instance of [Ollama](https://ollama.com/) / [LM Studio](https://lmstudio.ai/) for offline inference.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jaynguyen-dev/AI-powered-Productivity-App.git
   cd AI-powered-Productivity-App
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory and add your API key if you plan to use cloud AI:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:3000`.

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Motion (Framer), Lucide Icons
- **Backend:** Node.js, Express (serving static assets & proxying AI requests)
- **AI Integration:** Google GenAI SDK (`@google/genai`)
- **Data Persistence:** LocalStorage (Zero-config local persistence)

## ☁️ Deployment

Zen is architected as a unified Node.js/Express application. The `server.ts` handles the AI routing and statically serves the Vite production build. 

You can easily deploy it to platforms like Render or Railway:
1. Set the build command to: `npm install && npm run build`
2. Set the start command to: `npm start`
3. Provide your `GEMINI_API_KEY` as an environment variable.

## 📝 License

MIT License - feel free to use and modify for your own productivity needs!