// Web Audio API Synthesizer for Focus & Session Notifications
// Pure synthesized audio - zero external asset dependencies

class SoundService {
  private ctx: AudioContext | null = null;
  private alarmInterval: number | null = null;
  private alarmTimeout: number | null = null;
  private interactionListener: ((e: Event) => void) | null = null;
  private alarmGain: GainNode | null = null;
  private activeOscillators: OscillatorNode[] = [];

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Melodic crystal chime when a focus or break session finishes
  playCompletionChime(type: 'focus_end' | 'break_end' = 'focus_end') {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = type === 'focus_end' ? [523.25, 659.25, 783.99, 1046.5] : [783.99, 659.25, 523.25]; // C5-E5-G5-C6
      const duration = 0.45;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        // Gentle envelope with shimmer
        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + duration + 0.05);
      });
    } catch (e) {
      console.warn('Audio chime notice failed to play', e);
    }
  }

  startAlarm(type: 'focus_end' | 'break_end' = 'focus_end') {
    this.stopAlarm(); // clear any existing

    const ctx = this.getContext();
    if (!ctx) return;

    // Use a dedicated gain node so we can silence everything instantly if needed
    this.alarmGain = ctx.createGain();
    this.alarmGain.connect(ctx.destination);
    this.activeOscillators = [];

    const now = ctx.currentTime;
    
    // Create one continuous oscillator for the entire 90 seconds
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Use a clear, pleasant tone. Focus=C6(1046.5Hz), Break=A5(880Hz)
    osc.type = 'sine';
    osc.frequency.value = type === 'focus_end' ? 1046.5 : 880;

    osc.connect(gain);
    gain.connect(this.alarmGain);

    // Initial silence
    gain.gain.setValueAtTime(0, now);

    // Schedule 90 seconds of continuous rhythmic beeping
    // Pattern: "beep-beep (pause)" twice a second
    for (let i = 0; i < 90 * 2; i++) {
      const cycleStart = now + i * 0.5;

      // First beep (0.0 to 0.08)
      gain.gain.setValueAtTime(0, cycleStart);
      gain.gain.linearRampToValueAtTime(0.2, cycleStart + 0.01);
      gain.gain.setValueAtTime(0.2, cycleStart + 0.08);
      gain.gain.linearRampToValueAtTime(0, cycleStart + 0.1);

      // Second beep (0.15 to 0.23)
      gain.gain.setValueAtTime(0, cycleStart + 0.15);
      gain.gain.linearRampToValueAtTime(0.2, cycleStart + 0.16);
      gain.gain.setValueAtTime(0.2, cycleStart + 0.23);
      gain.gain.linearRampToValueAtTime(0, cycleStart + 0.25);
    }

    osc.start(now);
    osc.stop(now + 90);
    this.activeOscillators.push(osc);

    // Cleanup resources after exactly 90 seconds
    this.alarmTimeout = window.setTimeout(() => {
      this.stopAlarm();
    }, 90000);

    // Add listener to stop on any interaction
    this.interactionListener = () => {
      this.stopAlarm();
    };
    
    // Use capture to catch events early
    window.addEventListener('click', this.interactionListener, { capture: true });
    window.addEventListener('keydown', this.interactionListener, { capture: true });
    window.addEventListener('pointerdown', this.interactionListener, { capture: true });
  }

  stopAlarm() {
    if (this.alarmGain) {
      try {
        this.alarmGain.gain.setValueAtTime(0, this.getContext()?.currentTime || 0);
        this.alarmGain.disconnect();
      } catch (e) {}
      this.alarmGain = null;
    }

    // Stop all scheduled oscillators to free memory immediately
    this.activeOscillators.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    this.activeOscillators = [];

    if (this.alarmInterval !== null) {
      window.clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.alarmTimeout !== null) {
      window.clearTimeout(this.alarmTimeout);
      this.alarmTimeout = null;
    }
    if (this.interactionListener) {
      window.removeEventListener('click', this.interactionListener, { capture: true });
      window.removeEventListener('keydown', this.interactionListener, { capture: true });
      window.removeEventListener('pointerdown', this.interactionListener, { capture: true });
      this.interactionListener = null;
    }
  }

  // Soft tactile click when starting/pausing
  playTick() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }
}

export const soundService = new SoundService();
