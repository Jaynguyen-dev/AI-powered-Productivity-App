// Web Audio API Synthesizer for Focus & Session Notifications
// Pure synthesized audio - zero external asset dependencies

class SoundService {
  private ctx: AudioContext | null = null;
  private alarmTimeout: number | null = null;
  private interactionListener: ((e: Event) => void) | null = null;
  private alarmGain: GainNode | null = null;
  private alarmSource: AudioBufferSourceNode | null = null;
  private wakeLockOsc: OscillatorNode | null = null;

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

  private createAlarmBuffer(ctx: AudioContext, type: 'focus_end' | 'break_end'): AudioBuffer {
    // 0.5 seconds of audio
    const sampleRate = ctx.sampleRate;
    const frameCount = sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);

    const freq = type === 'focus_end' ? 1046.5 : 880;
    const omega = 2 * Math.PI * freq / sampleRate;

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate; 
      let amp = 0;
      
      // Beep 1: 0.0 to 0.1s
      if (t >= 0.0 && t < 0.1) {
        if (t < 0.01) amp = (t / 0.01) * 0.2;
        else if (t > 0.08) amp = ((0.1 - t) / 0.02) * 0.2;
        else amp = 0.2;
      }
      // Beep 2: 0.15 to 0.25s
      else if (t >= 0.15 && t < 0.25) {
        if (t < 0.16) amp = ((t - 0.15) / 0.01) * 0.2;
        else if (t > 0.23) amp = ((0.25 - t) / 0.02) * 0.2;
        else amp = 0.2;
      }

      channelData[i] = Math.sin(i * omega) * amp;
    }

    return buffer;
  }

  startAlarm(type: 'focus_end' | 'break_end' = 'focus_end') {
    this.stopAlarm();

    const ctx = this.getContext();
    if (!ctx) return;

    this.alarmGain = ctx.createGain();
    this.alarmGain.connect(ctx.destination);

    // Create and play looping buffer
    const buffer = this.createAlarmBuffer(ctx, type);
    this.alarmSource = ctx.createBufferSource();
    this.alarmSource.buffer = buffer;
    this.alarmSource.loop = true;
    this.alarmSource.connect(this.alarmGain);
    
    this.alarmSource.start();

    // Cleanup resources after exactly 90 seconds
    // Note: If the tab is fully suspended, setTimeout might be delayed, but the 
    // AudioBufferSourceNode will continue to loop flawlessly in the OS audio thread until stopped.
    this.alarmTimeout = window.setTimeout(() => {
      this.stopAlarm();
    }, 90000);

    // Add listener to stop on any interaction
    this.interactionListener = () => {
      this.stopAlarm();
    };
    
    // Only bind to unambiguous user events (click, keydown).
    // Avoid 'pointerdown' as it can falsely trigger from phantom touch inputs or trackpad rests.
    window.addEventListener('click', this.interactionListener, { capture: true });
    window.addEventListener('keydown', this.interactionListener, { capture: true });
  }

  stopAlarm() {
    if (this.alarmSource) {
      try { this.alarmSource.stop(); } catch (e) {}
      try { this.alarmSource.disconnect(); } catch (e) {}
      this.alarmSource = null;
    }
    if (this.alarmGain) {
      try {
        this.alarmGain.gain.setValueAtTime(0, this.getContext()?.currentTime || 0);
        this.alarmGain.disconnect();
      } catch (e) {}
      this.alarmGain = null;
    }

    if (this.alarmTimeout !== null) {
      window.clearTimeout(this.alarmTimeout);
      this.alarmTimeout = null;
    }
    if (this.interactionListener) {
      window.removeEventListener('click', this.interactionListener, { capture: true });
      window.removeEventListener('keydown', this.interactionListener, { capture: true });
      this.interactionListener = null;
    }
  }

  // Soft tactile click when starting/pausing
  playTick() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      
      // Initialize wake lock to prevent aggressive browser audio suspension in background tabs
      if (!this.wakeLockOsc) {
        this.wakeLockOsc = ctx.createOscillator();
        const silentGain = ctx.createGain();
        silentGain.gain.value = 0.0001; // completely inaudible
        this.wakeLockOsc.connect(silentGain);
        silentGain.connect(ctx.destination);
        this.wakeLockOsc.start();
      }

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
