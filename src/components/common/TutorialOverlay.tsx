import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Network,
  Bot,
  ArrowRight,
  Sparkles,
  X,
  Timer
} from 'lucide-react';

interface TutorialOverlayProps {
  onClose: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const steps = [
    {
      icon: Sparkles,
      title: 'Welcome to Zen Workspace',
      description: 'Your ultimate spatial productivity environment. Let us show you around so you can get the most out of your new workspace.',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    {
      icon: Calendar,
      title: 'Smart Calendar',
      description: 'Schedule events seamlessly using natural language, link them directly to tasks, and visually block out your day.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    },
    {
      icon: CheckSquare,
      title: 'Priority Task Management',
      description: 'Organize your to-dos by priority, link them to projects, and use the built-in Focus Timer to execute deep work without distractions.',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    {
      icon: Network,
      title: 'Idea Knowledge Graph',
      description: 'Capture freeform ideas and connect them visually. Build a constellation of thoughts and turn them into actionable tasks.',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    {
      icon: Bot,
      title: 'Zen Copilot',
      description: 'Chat with your AI assistant at any time to summarize your day, schedule tasks, or explore your knowledge graph.',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10'
    }
  ];

  const current = steps[step];
  const Icon = current.icon;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md pointer-events-auto" onClick={handleClose} />
      
      <div className={`pointer-events-auto z-10 w-full max-w-lg transition-all duration-500 transform ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}`}>
        <GlassCard variant="glow" className="p-8 relative overflow-hidden border border-white/20 shadow-[0_0_80px_rgba(249,115,22,0.15)]">
          {/* Subtle Background Glow */}
          <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl opacity-30 ${current.bg.replace('/10', '')}`} />

          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center mt-4">
            <div className={`w-20 h-20 rounded-2xl ${current.bg} flex items-center justify-center mb-6 shadow-xl border border-white/10`}>
              <Icon className={`w-10 h-10 ${current.color}`} />
            </div>

            <h2 className="text-2xl font-black text-white mb-4 tracking-tight">{current.title}</h2>
            <p className="text-white/70 leading-relaxed mb-10 px-4 min-h-[80px]">
              {current.description}
            </p>

            <div className="w-full flex items-center justify-between mt-auto">
              {/* Dots */}
              <div className="flex gap-2">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-blue-500 w-6' : 'bg-white/20'}`} 
                  />
                ))}
              </div>

              <div className="flex gap-3">
                {step > 0 && (
                  <button 
                    onClick={() => setStep(s => s - 1)}
                    className="px-5 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors font-bold text-sm"
                  >
                    Back
                  </button>
                )}
                {step < steps.length - 1 ? (
                  <button 
                    onClick={() => setStep(s => s + 1)}
                    className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 transition-colors font-bold text-sm flex items-center gap-2"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={handleClose}
                    className="px-5 py-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all font-bold text-sm flex items-center gap-2"
                  >
                    Get Started <Sparkles className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};