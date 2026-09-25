import React, { useState } from 'react';
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import { IdeaType } from '../../types';

interface QuickCaptureBarProps {
  onCapture: (content: string, suggestedType?: IdeaType) => void;
  placeholder?: string;
}

export const QuickCaptureBar: React.FC<QuickCaptureBarProps> = ({
  onCapture,
  placeholder = 'Capture a raw thought or idea instantly... (Press Enter to save)',
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    // Lightweight heuristic to suggest type
    let suggestedType: IdeaType = 'concept';
    const trimmed = text.trim();
    if (trimmed.endsWith('?') || /^(what if|why|how|can|is)\b/i.test(trimmed)) {
      suggestedType = 'question';
    } else if (/^(hypothesize|hypothesis|if we|we suspect)\b/i.test(trimmed)) {
      suggestedType = 'hypothesis';
    } else if (/(found that|insight|discovered|proves|analysis shows)/i.test(trimmed)) {
      suggestedType = 'insight';
    }

    onCapture(trimmed, suggestedType);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-amber-400">
          <Lightbulb className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-24 py-3 rounded-2xl bg-black/60/80 backdrop-blur-2xl border border-white/15 text-slate-100 placeholder-slate-400 text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-amber-400 shadow-xl shadow-black/30 transition-all"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="absolute right-2 px-3 py-1.5 rounded-xl bg-red-500 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-red-500 text-slate-950 text-sm font-bold flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-red-500/20"
        >
          <span>Capture</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </form>
  );
};
