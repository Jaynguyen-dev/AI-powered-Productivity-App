import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Task } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { soundService } from '../../services/soundService';
import {
  Play, Pause, RotateCcw, Volume2, VolumeX,
  Minimize2, Maximize2, CheckCircle2, X,
  Timer as TimerIcon,
} from 'lucide-react';

export type TimerMode = 'pomodoro' | 'short_break' | 'long_break' | 'deep_work' | 'sprint' | 'custom' | 'stopwatch';

interface FocusTimerProps {
  tasks: Task[];
  onToggleTaskComplete?: (taskId: string) => void;
  initialTaskId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  isFloatingMinimized: boolean;
  setIsFloatingMinimized: (val: boolean) => void;
}

// ─── Geometry ──────────────────────────────────────────────────────────────────
const MAX_SECS  = 90 * 60;
const SIZE      = 260;
const CX        = SIZE / 2;
const CY        = SIZE / 2;
const SWEEP     = 270;       // total arc degrees
const START_DEG = 225;       // 0 min = 7 o'clock (from top, CW)
const END_DEG   = START_DEG + SWEEP;

// degrees (from-top CW) -> SVG radians
const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
const pt = (r: number, d: number) => ({
  x: CX + r * Math.cos(toRad(d)),
  y: CY + r * Math.sin(toRad(d)),
});
const arcPath = (r: number, d0: number, d1: number) => {
  const s = pt(r, d0), e = pt(r, d1);
  const la = d1 - d0 > 180 ? 1 : 0;
  return `M ${s.x.toFixed(4)} ${s.y.toFixed(4)} A ${r} ${r} 0 ${la} 1 ${e.x.toFixed(4)} ${e.y.toFixed(4)}`;
};

// ease-in-out cubic
const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

// ─── Rotary Knob ───────────────────────────────────────────────────────────────
interface KnobProps {
  remainingSeconds: number;
  isRunning: boolean;
  isRelax: boolean;
  onSetTime: (s: number) => void;
}

const RotaryKnob: React.FC<KnobProps> = ({ remainingSeconds, isRunning, isRelax, onSetTime }) => {
  const svgRef      = useRef<SVGSVGElement>(null);
  const dragging    = useRef(false);          // sync ref, no render lag
  const animFrame   = useRef(0);
  const animState   = useRef<{ from: number; to: number; t0: number } | null>(null);

  // displayFrac drives the visual indicator (0 = 7 o'clock, 1 = 5 o'clock)
  const [displayFrac, setDisplayFrac] = useState(remainingSeconds / MAX_SECS);
  const displayFracRef = useRef(remainingSeconds / MAX_SECS);

  const rawFrac = Math.min(1, Math.max(0, remainingSeconds / MAX_SECS));

  // ── Animate displayFrac toward rawFrac ─────────────────────────────────────
  // Rules:
  //   • Dragging → instant (no rAF, synchronous in pointer handler)
  //   • Timer running → instant
  //   • Mode switch / reset → smooth 380ms rAF along the arc angle
  useEffect(() => {
    cancelAnimationFrame(animFrame.current);

    if (dragging.current || isRunning) {
      // Instant snap
      displayFracRef.current = rawFrac;
      setDisplayFrac(rawFrac);
      return;
    }

    const from = displayFracRef.current;
    const to   = rawFrac;
    if (Math.abs(to - from) < 0.0005) {
      displayFracRef.current = to;
      setDisplayFrac(to);
      return;
    }

    const DURATION = 380;
    const t0 = performance.now();

    const tick = (now: number) => {
      const t    = Math.min(1, (now - t0) / DURATION);
      const val  = from + (to - from) * easeInOut(t);
      displayFracRef.current = val;
      setDisplayFrac(val);
      if (t < 1) animFrame.current = requestAnimationFrame(tick);
    };
    animFrame.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animFrame.current);
  }, [rawFrac, isRunning]);

  // ── Pointer helpers ────────────────────────────────────────────────────────
  const toDeg = (cx: number, cy: number): number => {
    if (!svgRef.current) return 0;
    const r = svgRef.current.getBoundingClientRect();
    const x = cx - r.left - r.width  / 2;
    const y = cy - r.top  - r.height / 2;
    let d = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (d < 0) d += 360;
    return d;
  };

  const degToSecs = (deg: number): number => {
    let rel = ((deg - START_DEG) + 360) % 360;
    if (rel > SWEEP) rel = rel < SWEEP + 45 ? SWEEP : 0;
    return Math.round((rel / SWEEP) * MAX_SECS / 30) * 30;
  };

  const startDrag = (e: React.PointerEvent) => {
    if (isRunning) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    cancelAnimationFrame(animFrame.current); // stop any running animation
    dragging.current = true;
  };

  // During drag: update displayFrac IMMEDIATELY (bypass rAF) then notify parent
  const moveDrag = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const secs    = Math.max(30, degToSecs(toDeg(e.clientX, e.clientY)));
    const newFrac = secs / MAX_SECS;
    displayFracRef.current = newFrac;
    setDisplayFrac(newFrac);   // triggers re-render with new dot position
    onSetTime(secs);           // update parent state (will also update rawFrac, but dragging.current=true so useEffect is instant)
  };

  const endDrag = () => {
    dragging.current = false;
  };

  // ── Derived render values ──────────────────────────────────────────────────
  const indicatorDeg = START_DEG + displayFrac * SWEEP;
  const dotPt        = pt(73, indicatorDeg);                // always on the arc
  const progressPath = displayFrac > 0.003 ? arcPath(103, START_DEG, indicatorDeg) : null;
  const trackPath    = arcPath(103, START_DEG, END_DEG);

  const accent = isRelax ? '#34d399' : '#f43f5e';
  const glow   = isRelax ? 'rgba(52,211,153,0.75)' : 'rgba(244,63,94,0.75)';
  const glowSm = isRelax ? 'rgba(52,211,153,0.2)'  : 'rgba(244,63,94,0.2)';

  const TICK_N = 37;
  const ticks = Array.from({ length: TICK_N }, (_, i) => {
    const t   = i / (TICK_N - 1);
    const deg = START_DEG + t * SWEEP;
    const maj = i % 4 === 0;
    return { p1: pt(118, deg), p2: pt(maj ? 106 : 113, deg), maj, active: t <= displayFrac };
  });

  return (
    <svg ref={svgRef} width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={`w-full h-full select-none ${!isRunning ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
      onPointerDown={startDrag} onPointerMove={moveDrag}
      onPointerUp={endDrag}     onPointerLeave={endDrag}
      style={{ touchAction: 'none' }}>
      

      {/* Ticks */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.p1.x} y1={t.p1.y} x2={t.p2.x} y2={t.p2.y}
          strokeWidth={t.maj ? 2 : 1} strokeLinecap='round'
          style={{
            stroke: t.active ? accent : 'rgba(255,255,255,0.08)',
            filter: t.active && t.maj ? `drop-shadow(0 0 3px ${glow})` : 'none',
            transition: 'stroke 0.35s ease, filter 0.35s ease',
          }}/>
      ))}

      {/* Track */}
      <path d={trackPath} fill='none' stroke='rgba(255,255,255,0.055)' strokeWidth='5' strokeLinecap='round'/>

      {/* Progress arc — redrawn each frame via displayFrac, no CSS needed */}
      {progressPath && (
        <path d={progressPath} fill='none' strokeWidth='5' strokeLinecap='round'
          style={{ stroke: accent, filter: `drop-shadow(0 0 8px ${glow})`, transition: 'stroke 0.35s ease, filter 0.35s ease' }}/>
      )}

      {/* End-cap dots */}
      {(() => {
        const s = pt(103, START_DEG), e = pt(103, END_DEG);
        return (
          <>
            <circle cx={s.x} cy={s.y} r={3} style={{ fill: glowSm, transition: 'fill 0.35s ease' }}/>
            <circle cx={e.x} cy={e.y} r={3} fill='rgba(255,255,255,0.06)'/>
          </>
        );
      })()}

      {/* Indicator dot — NO cx/cy CSS transition; position recomputed from angle each frame */}
      <circle cx={dotPt.x} cy={dotPt.y} r={6}
        style={{ fill: 'white', filter: `drop-shadow(0 0 10px ${glow}) drop-shadow(0 0 4px rgba(255,255,255,0.85))`, transition: 'fill 0.35s ease, filter 0.35s ease' }}/>
      <circle cx={dotPt.x - 1.5} cy={dotPt.y - 1.5} r={2} fill='rgba(255,255,255,0.9)'/>

      </svg>
  );
};

// ─── Toggle ────────────────────────────────────────────────────────────────────
const ModeToggle: React.FC<{ isRelax: boolean; onChange: (v: boolean) => void }> = ({ isRelax, onChange }) => (
  <div className='flex items-center p-1 rounded-full bg-white/[0.06] border border-white/10 gap-0.5'>
    <button onClick={() => onChange(false)}
      className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-200 ${!isRelax ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/50' : 'text-white/60 hover:text-slate-300'}`}>
      Focus
    </button>
    <button onClick={() => onChange(true)}
      className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-200 ${isRelax ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/50' : 'text-white/60 hover:text-slate-300'}`}>
      Relax
    </button>
  </div>
);

// ─── Main ──────────────────────────────────────────────────────────────────────
export const FocusTimer: React.FC<FocusTimerProps> = ({
  tasks, onToggleTaskComplete, initialTaskId,
  isOpen, onClose, isFloatingMinimized, setIsFloatingMinimized,
}) => {
  const [isRelax,          setIsRelax]         = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [setSeconds,       setSetSeconds]       = useState(25 * 60);
  const [isRunning,        setIsRunning]        = useState(false);
  const [soundEnabled,     setSoundEnabled]     = useState(true);
  const [selectedTaskId,   setSelectedTaskId]   = useState<string | null>(initialTaskId || null);
  const [completedRounds,  setCompletedRounds]  = useState(0);

  useEffect(() => { if (initialTaskId) setSelectedTaskId(initialTaskId); }, [initialTaskId]);

  const handleModeSwitch = useCallback((relax: boolean) => {
    setIsRunning(false);
    setIsRelax(relax);
    const def = relax ? 15 * 60 : 25 * 60;
    setRemainingSeconds(def);
    setSetSeconds(def);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const iv = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(iv);
          setIsRunning(false);
          if (soundEnabled) soundService.playCompletionChime(isRelax ? 'break_end' : 'focus_end');
          if (!isRelax) setCompletedRounds(r => r + 1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [isRunning, isRelax, soundEnabled]);

  useEffect(() => {
    const mm = String(Math.floor(remainingSeconds / 60)).padStart(2,'0');
    const ss = String(remainingSeconds % 60).padStart(2,'0');
    document.title = isRunning
      ? `(${mm}:${ss}) ${isRelax ? 'Relax' : 'Focus'} | Zen`
      : 'Zen Workspace | Calendar, Tasks & Ideas';
    return () => { document.title = 'Zen Workspace | Calendar, Tasks & Ideas'; };
  }, [remainingSeconds, isRunning, isRelax]);

  const handleTogglePlay = () => { if (soundEnabled) soundService.playTick(); setIsRunning(r => !r); };
  const handleReset      = () => { setIsRunning(false); setRemainingSeconds(setSeconds); };
  const handleSetTime    = useCallback((secs: number) => {
    setRemainingSeconds(secs);
    setSetSeconds(secs);
  }, []);

  const mm  = String(Math.floor(remainingSeconds / 60)).padStart(2,'0');
  const ss2 = String(remainingSeconds % 60).padStart(2,'0');
  const timeFormatted = `${mm}:${ss2}`;
  const pct = setSeconds > 0 ? remainingSeconds / setSeconds : 0;
  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  const accentGlow   = isRelax ? 'rgba(52,211,153,0.5)' : 'rgba(244,63,94,0.5)';
  const accentHex    = isRelax ? '#34d399' : '#f43f5e';

  // ── Floating mini widget ───────────────────────────────────────────────────
  if (isFloatingMinimized) {
    const mR = 13, mC = 2 * Math.PI * mR;
    return (
      <div className='fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300'>
        <GlassCard variant='glow' className='p-2.5 pl-3.5 pr-2.5 flex items-center gap-3 border-white/20 shadow-2xl backdrop-blur-2xl bg-black/20'>
          <div className='relative w-8 h-8 flex-shrink-0'>
            <svg className='w-8 h-8 -rotate-90'>
              <circle cx='16' cy='16' r={mR} stroke='rgba(255,255,255,0.08)' strokeWidth='2.5' fill='none'/>
              <circle cx='16' cy='16' r={mR} strokeWidth='2.5' strokeLinecap='round' fill='none'
                strokeDasharray={mC} strokeDashoffset={mC - pct * mC}
                style={{ stroke: accentHex, transition: 'stroke 0.35s ease, stroke-dashoffset 0.5s ease' }}/>
            </svg>
            <span className='absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-slate-200'>{isRunning ? '●' : '⏸'}</span>
          </div>
          <div onClick={() => setIsFloatingMinimized(false)} className='cursor-pointer min-w-0 pr-1'>
            <div className='flex items-center gap-1.5'>
              <span className='text-xs font-mono font-bold text-white'>{timeFormatted}</span>
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${isRelax ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950 text-rose-300 border border-rose-500/30'}`} style={{ transition: 'all 0.35s ease' }}>
                {isRelax ? 'Relax' : 'Focus'}
              </span>
            </div>
            {selectedTask ? <p className='text-[10px] text-slate-300 truncate max-w-[130px] mt-0.5'>{selectedTask.title}</p> : <p className='text-[10px] text-white/60'>Focus Timer</p>}
          </div>
          <div className='flex gap-1 border-l border-white/10 pl-2'>
            <button onClick={handleTogglePlay}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-white cursor-pointer transition-all ${isRunning ? 'bg-red-500/80 hover:bg-red-500' : isRelax ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}>
              {isRunning ? <Pause className='w-3.5 h-3.5'/> : <Play className='w-3.5 h-3.5 ml-0.5'/>}
            </button>
            <button onClick={() => setIsFloatingMinimized(false)} className='w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors'>
              <Maximize2 className='w-3.5 h-3.5'/>
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

    

  return (
    <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4 sm:p-6 md:p-8 overflow-hidden">
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      
      {/* Modal Container */}
      <div className='pointer-events-auto z-10 animate-float w-full max-w-[820px] max-h-full flex flex-col'>
        <motion.div initial={{ opacity: 0, scale: 0.85, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 30 }} transition={{ type: "spring", stiffness: 350, damping: 25 }} className="w-full flex flex-col md:flex-row rounded-[36px] relative overflow-hidden bg-black/20 backdrop-blur-2xl border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.9)]">

          {/* Decorative Backgrounds */}
          <div className='absolute inset-0 pointer-events-none rounded-[inherit]'
            style={{ background: isRelax ? 'rgba(6,78,59,0.15)' : 'rgba(244,63,94,0.15)', transition: 'background 0.5s ease' }}/>
          <div className='absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-50'
            style={{ background: isRelax ? 'rgba(52,211,153,0.12)' : 'rgba(244,63,94,0.12)', transition: 'background 0.5s ease' }}/>

          {/* LEFT COLUMN: Knob and Time */}
          <div className='relative z-10 flex-1 flex flex-col items-center justify-center p-6 md:p-10 min-w-0 md:max-w-[400px]'>
            
            {/* Toggle */}
            <div className='mb-6 sm:mb-8 flex-shrink-0'>
              <ModeToggle isRelax={isRelax} onChange={handleModeSwitch}/>
            </div>

            {/* Knob Container (Forces aspect square, limits scaling) */}
            <div className='w-full max-w-[240px] md:max-w-[280px] aspect-square flex-shrink-0 flex items-center justify-center'>
              <RotaryKnob
                remainingSeconds={remainingSeconds}
                isRunning={isRunning}
                isRelax={isRelax}
                onSetTime={handleSetTime}
              />
            </div>

            {/* Large Time Display */}
            <div className='mt-6 sm:mt-8 flex flex-col items-center gap-2 text-center flex-shrink-0'>
              <span className='text-[52px] md:text-[64px] leading-none font-black font-mono text-white tracking-tight tabular-nums'
                style={{ textShadow: `0 0 40px ${accentGlow}, 0 0 14px ${accentGlow}`, transition: 'text-shadow 0.35s ease' }}>
                {timeFormatted}
              </span>
              <span className='text-[10px] font-bold uppercase tracking-[3px]'
                style={{ color: accentHex, transition: 'color 0.35s ease' }}>
                {isRelax ? 'relax time' : 'focus block'}
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: Info, Controls, Task */}
          <div className='relative z-10 flex-1 min-w-0 flex flex-col justify-between p-6 md:p-10 md:border-l border-t md:border-t-0 border-white/10'>
            
            {/* Header: Title and Top Controls */}
            <div className='flex items-start justify-between gap-4 mb-8 flex-shrink-0'>
              <div className='flex items-center gap-4 min-w-0'>
                {/* Timer Icon Container - Explicitly Sized & Padded */}
                <div className='w-14 h-14 flex-shrink-0 rounded-[14px] p-0.5 shadow-md flex items-center justify-center'
                  style={{ background: isRelax ? 'linear-gradient(135deg,#10b981,#0d9488)' : 'linear-gradient(135deg,#f43f5e,#e11d48)', transition: 'background 0.4s ease' }}>
                  <div className='w-full h-full rounded-[12px] bg-slate-950 flex items-center justify-center p-2.5'>
                    <TimerIcon className='w-full h-full object-contain flex-shrink-0' style={{ color: accentHex, transition: 'color 0.35s ease' }}/>
                  </div>
                </div>
                {/* Titles */}
                <div className='min-w-0 flex flex-col justify-center gap-0.5'>
                  <p className='text-xl font-bold text-white leading-tight truncate'>Zen Focus</p>
                  <p className='text-[11px] font-medium text-white/60 truncate'>{completedRounds} session{completedRounds !== 1 ? 's' : ''} done</p>
                </div>
              </div>
              
              {/* Window Controls */}
              <div className='flex items-center gap-2 flex-shrink-0'>
                <button onClick={() => setSoundEnabled(v => !v)} className={`p-2.5 rounded-xl border cursor-pointer transition-colors ${soundEnabled ? 'bg-white/8 border-white/12 text-slate-300' : 'bg-transparent border-white/6 text-white/80 hover:text-white/50'}`}>
                  {soundEnabled ? <Volume2 className='w-4 h-4'/> : <VolumeX className='w-4 h-4'/>}
                </button>
                <button onClick={() => setIsFloatingMinimized(true)} className='p-2.5 rounded-xl bg-white/6 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white cursor-pointer transition-colors'>
                  <Minimize2 className='w-4 h-4'/>
                </button>
                <button onClick={onClose} className='p-2.5 rounded-xl bg-white/4 hover:bg-white/8 border border-white/8 text-white/60 hover:text-white cursor-pointer transition-colors'>
                  <X className='w-4 h-4'/>
                </button>
              </div>
            </div>

            {/* Center Area: Play/Pause Controls */}
            <div className='flex flex-col flex-1 items-center justify-center py-4 min-h-0'>
              <div className='flex items-center justify-center gap-3 w-full max-w-[340px]'>
                <button onClick={handleReset} title='Reset'
                  className='p-4 md:p-5 rounded-2xl bg-white/6 hover:bg-white/10 text-white/50 hover:text-white border border-white/8 cursor-pointer transition-all flex-shrink-0'>
                  <RotateCcw className='w-5 h-5 md:w-6 md:h-6'/>
                </button>

                <button onClick={handleTogglePlay} disabled={remainingSeconds === 0}
                  className='flex-1 min-w-[120px] p-4 md:p-5 rounded-2xl text-white font-bold text-sm md:text-base shadow-xl flex items-center justify-center gap-2.5 cursor-pointer transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.03]'
                  style={{
                    background: isRunning ? '#f59e0b' : isRelax ? 'linear-gradient(90deg,#059669,#0d9488)' : 'linear-gradient(90deg,#f43f5e,#e11d48)',
                    boxShadow: isRunning ? '0 4px 24px rgba(245,158,11,0.35)' : isRelax ? '0 4px 24px rgba(16,185,129,0.4)' : '0 4px 24px rgba(244,63,94,0.45)',
                    transition: 'background 0.4s ease, box-shadow 0.4s ease, transform 0.2s ease',
                  }}>
                  {isRunning ? <><Pause className='w-5 h-5 md:w-6 md:h-6'/><span>Pause</span></> : <><Play className='w-5 h-5 md:w-6 md:h-6 ml-0.5 fill-white'/><span>Start</span></>}
                </button>

                <button title='+5 min'
                  onClick={() => {
                    const next = Math.min(MAX_SECS, remainingSeconds + 5 * 60);
                    setRemainingSeconds(next);
                    setSetSeconds(prev => Math.min(MAX_SECS, prev + 5 * 60));
                  }}
                  className='p-4 md:p-5 rounded-2xl bg-white/6 hover:bg-white/10 text-white/50 hover:text-white border border-white/8 cursor-pointer transition-all text-xs md:text-sm font-bold flex-shrink-0'>
                  +5m
                </button>
              </div>
            </div>

            {/* Bottom Area: Task Linker */}
            <div className='mt-8 pt-6 border-t border-white/[0.07] flex-shrink-0'>
              <label className='block text-[11px] font-semibold uppercase tracking-wider text-white/80 mb-3'>Linked Task</label>
              <div className='flex items-center gap-2 min-w-0'>
                <div className='flex-1 min-w-0 relative'>
                  <select value={selectedTaskId || ''} onChange={e => setSelectedTaskId(e.target.value || null)}
                    className='w-full truncate px-4 py-3.5 rounded-xl bg-black/20 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-400 cursor-pointer appearance-none pr-8'>
                    <option value=''>No task linked</option>
                    {tasks.filter(t => t.status !== 'completed').map(task => (
                      <option key={task.id} value={task.id}>[{task.priority.toUpperCase()}] {task.title}</option>
                    ))}
                  </select>
                  <div className='absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40'>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
                {selectedTask && onToggleTaskComplete && (
                  <button onClick={() => { onToggleTaskComplete(selectedTask.id); if (soundEnabled) soundService.playCompletionChime(); }}
                    className='px-4 py-3.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/25 text-emerald-300 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors flex-shrink-0'>
                    <CheckCircle2 className='w-4 h-4'/><span>Done</span>
                  </button>
                )}
              </div>
              {selectedTask && (
                <div className='mt-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between gap-3'>
                  <div className='flex items-center gap-2.5 min-w-0'>
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${selectedTask.priority === 'high' ? 'bg-rose-400' : selectedTask.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`}/>
                    <span className='text-xs text-white/80 truncate'>{selectedTask.title}</span>
                  </div>
                  {selectedTask.estimatedMinutes && <span className='text-[10px] text-white/60 flex-shrink-0 font-medium bg-white/10 px-2 py-1 rounded'>{selectedTask.estimatedMinutes}m</span>}
                </div>
              )}
            </div>

          </div>
        </motion.div>
        </div>
      </div>
    )}
  </AnimatePresence>
  );
};