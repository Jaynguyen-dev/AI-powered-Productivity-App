# 🏔️ Zen Productivity Workspace

Zen is an **agentic, spatial workspace** designed to unify your tasks, calendar, and knowledge graph into a single, cohesive environment. 

**Is this just a chatbot app?**  
No. While Zen features a conversational AI interface, it is far more than a chatbot. It is a fully functional productivity suite where the AI acts as an **executive assistant**. Instead of just answering questions, the AI has direct read/write access to your local workspace—it can physically schedule calendar events, create task tickets, link conceptual nodes in your knowledge graph, and manage your focus timers based on your natural language commands.

## ✨ Features

- **Spatial Glassmorphism UI:** A beautiful, responsive interface featuring 3D transitions, frosted glass panels, and a calming Yale Blue / Crimson aesthetic over a nature-inspired backdrop.
- **Conversational Copilot:** Press `Cmd/Ctrl + K` to summon Zen. Ask it to "Schedule a 45m design review tomorrow" or "Log a high priority task to ship the landing page" and watch the UI update instantly.
- **Node-Based Idea Graph:** Visually map out your thoughts and connect them using relationship edges.
- **Integrated Calendar & Tasks:** Manage your daily agenda and prioritize urgent work without leaving the app.
- **Pomodoro Focus Timer:** A built-in, visually striking Crimson timer to keep you locked in and productive during deep work sessions.
- **Local & Cloud AI Support:** Out-of-the-box support for Google Gemini in production, with fallback capabilities for local LLMs like Ollama and LM Studio for privacy-focused local development.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Optional: A [Google Gemini API Key](https://aistudio.google.com/) OR a local instance of [Ollama](https://ollama.com/) / [LM Studio](https://lmstudio.ai/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/zen-workspace.git
   cd zen-workspace
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
   The app will start on `http://localhost:3000`.

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Framer Motion, Lucide Icons
- **Backend:** Node.js, Express
- **AI Integration:** `@google/genai` SDK
- **Data Persistence:** LocalStorage (Zero-config persistence)

## 📦 Deployment

Zen is architected as a unified Node.js/Express application. The `server.ts` handles the AI routing and statically serves the Vite production build. 

You can easily deploy it to platforms like Render or Railway:
1. Set the build command to: `npm install && npm run build`
2. Set the start command to: `npm start`
3. Provide your `GEMINI_API_KEY` as an environment variable.

## 📄 License

MIT License - feel free to use and modify for your own productivity needs!