import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const CustomDatePicker = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    const d = value ? new Date(value + 'T12:00:00') : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const clickOut = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  const handleSelect = (day: number) => {
    const d = new Date(year, month, day);
    const pad = (n: number) => n.toString().padStart(2, '0');
    onChange(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`);
    setIsOpen(false);
  };
  
  const handlePrev = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentDate(new Date(year, month - 1, 1)); };
  const handleNext = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentDate(new Date(year, month + 1, 1)); };

  const displayDate = value ? new Date(value + 'T12:00:00') : new Date();
  
  return (
    <div className="relative" ref={containerRef}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white text-sm focus:outline-none flex items-center justify-between hover:bg-white/5 transition-colors shadow-inner"
      >
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          {value ? displayDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Select Date'}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 top-full mt-2 left-0 w-72 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="flex justify-between items-center mb-4">
              <button type="button" onClick={handlePrev} className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
              <div className="font-bold text-white text-sm">{MONTH_NAMES[month]} {year}</div>
              <button type="button" onClick={handleNext} className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(d => <div key={d} className="text-center text-[10px] uppercase font-bold text-white/50">{d}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {Array.from({length: firstDay}).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({length: daysInMonth}).map((_, i) => {
                const day = i + 1;
                const isSelected = value && displayDate.getDate() === day && displayDate.getMonth() === month && displayDate.getFullYear() === year;
                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelect(day)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all cursor-pointer mx-auto
                      ${isSelected ? 'bg-blue-500 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 
                        isToday ? 'bg-white/10 text-blue-300 font-bold border border-blue-500/30' : 'text-white/80 hover:bg-white/10 hover:text-white border border-transparent'}`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const CustomTimePicker = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const clickOut = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  const parseTime = (timeStr: string) => {
    if (!timeStr) return { h: 12, m: 0, ampm: 'PM' };
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return { h, m, ampm };
  };

  const { h, m, ampm } = parseTime(value);

  const updateTime = (newH: number, newM: number, newAMPM: string) => {
    let outH = newH;
    if (newAMPM === 'PM' && outH < 12) outH += 12;
    if (newAMPM === 'AM' && outH === 12) outH = 0;
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    onChange(`${pad(outH)}:${pad(newM)}`);
  };

  const handleDisplay = () => {
    if (!value) return 'Select Time';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)} ${ampm}`;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white text-sm focus:outline-none flex items-center justify-between hover:bg-white/5 transition-colors shadow-inner"
      >
        <span className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          {handleDisplay()}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 top-full mt-2 left-0 w-64 p-3 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex justify-between h-56 overflow-hidden"
          >
            {/* Hours */}
            <div className="flex-1 overflow-y-auto scroll-smooth flex flex-col items-center border-r border-white/10 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {[12,1,2,3,4,5,6,7,8,9,10,11].map(hour => (
                <button
                  key={`h-${hour}`}
                  type="button"
                  onClick={() => updateTime(hour, m, ampm)}
                  className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl text-sm transition-all my-1 cursor-pointer ${h === hour ? 'bg-emerald-500 text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-white/70 hover:bg-white/10'}`}
                >
                  {hour.toString().padStart(2, '0')}
                </button>
              ))}
            </div>

            {/* Minutes */}
            <div className="flex-1 overflow-y-auto scroll-smooth flex flex-col items-center border-r border-white/10 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(minute => (
                <button
                  key={`m-${minute}`}
                  type="button"
                  onClick={() => updateTime(h, minute, ampm)}
                  className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl text-sm transition-all my-1 cursor-pointer ${m === minute ? 'bg-emerald-500 text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-white/70 hover:bg-white/10'}`}
                >
                  {minute.toString().padStart(2, '0')}
                </button>
              ))}
            </div>

            {/* AM/PM */}
            <div className="flex-1 flex flex-col justify-center items-center gap-3">
              <button
                type="button"
                onClick={() => updateTime(h, m, 'AM')}
                className={`w-14 h-14 rounded-2xl text-sm transition-all cursor-pointer ${ampm === 'AM' ? 'bg-emerald-500 text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-white/70 hover:bg-white/10 border border-white/5'}`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => updateTime(h, m, 'PM')}
                className={`w-14 h-14 rounded-2xl text-sm transition-all cursor-pointer ${ampm === 'PM' ? 'bg-emerald-500 text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-white/70 hover:bg-white/10 border border-white/5'}`}
              >
                PM
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
