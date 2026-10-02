import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Users, Brain, BookOpen, Heart, Eye, Flag, Circle } from 'lucide-react';

type Option = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  colorClass?: string;
};

const iconMap: Record<string, React.ReactNode> = {
  meeting: <Users className="w-4 h-4" />,
  deep_work: <Brain className="w-4 h-4" />,
  study: <BookOpen className="w-4 h-4" />,
  personal: <Heart className="w-4 h-4" />,
  review: <Eye className="w-4 h-4" />,
  deadline: <Flag className="w-4 h-4" />
};

const colorMap: Record<string, string> = {
  meeting: 'text-purple-400',
  deep_work: 'text-blue-400',
  study: 'text-cyan-400',
  personal: 'text-emerald-400',
  review: 'text-amber-400',
  deadline: 'text-rose-400'
};

const CATEGORIES = [
  { value: 'meeting', label: 'Meeting / Sync' },
  { value: 'deep_work', label: 'Deep Work / Focus' },
  { value: 'study', label: 'Study / Research' },
  { value: 'personal', label: 'Personal / Wellness' },
  { value: 'review', label: 'Review / Critique' },
  { value: 'deadline', label: 'Milestone / Deadline' }
];

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options?: Option[];
}

export const CustomSelect = ({ value, onChange, options = CATEGORIES }: CustomSelectProps) => {
  const [coords, setCoords] = useState<{ top?: number, bottom?: number, left: number, width: number }>({ top: 0, left: 0, width: 0 });
  const [isUp, setIsUp] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOut = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) && (!menuRef.current || !menuRef.current.contains(e.target as Node))) setIsOpen(false);
    }
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];
  const Icon = selectedOption.icon || iconMap[selectedOption.value] || <Circle className="w-4 h-4" />;
  const color = selectedOption.colorClass || colorMap[selectedOption.value] || 'text-white';

  return (
    <div className="relative" ref={containerRef}>
      <button 
        type="button" 
        onClick={(e) => {
          if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            
            if (spaceBelow < 250 && spaceAbove > spaceBelow) {
              // Open upwards
              setIsUp(true);
              setCoords({ bottom: window.innerHeight - rect.top, left: rect.left, width: rect.width });
            } else {
              // Open downwards
              setIsUp(false);
              setCoords({ top: rect.bottom, left: rect.left, width: rect.width });
            }
          }
          setIsOpen(!isOpen);
        }}
        className="w-full px-3 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white text-sm focus:outline-none flex items-center justify-between hover:bg-white/5 transition-colors shadow-inner"
      >
        <span className={`flex items-center gap-2 ${color}`}>
          {Icon}
          <span className="text-white">{selectedOption.label}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div 
            initial={{ opacity: 0, y: isUp ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isUp ? 10 : -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            ref={menuRef}
            className={`fixed z-[9999] ${isUp ? 'mb-2' : 'mt-2'} p-1.5 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col gap-1 max-h-60 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent`}
            style={{ top: coords.top !== undefined ? coords.top : 'auto', bottom: coords.bottom !== undefined ? coords.bottom : 'auto', left: coords.left, width: coords.width }}
          >
            {options.map((opt) => {
              const OptIcon = opt.icon || iconMap[opt.value] || <Circle className="w-4 h-4" />;
              const optColor = opt.colorClass || colorMap[opt.value] || 'text-white';
              const isSelected = opt.value === value;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 text-sm transition-all cursor-pointer ${
                    isSelected ? 'bg-white/15 font-semibold shadow-inner' : 'hover:bg-white/5 text-white/80 hover:text-white'
                  }`}
                >
                  <span className={optColor}>{OptIcon}</span>
                  <span>{opt.label}</span>
                  {isSelected && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                  )}
                </button>
              );
            })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
