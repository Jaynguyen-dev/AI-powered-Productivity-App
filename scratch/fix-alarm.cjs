const fs = require('fs');
let content = fs.readFileSync('src/services/soundService.ts', 'utf8');

// Replace the startAlarm implementation
content = content.replace(
  /startAlarm\([\s\S]*?stopAlarm\(\) \{/m,
  `startAlarm(type: 'focus_end' | 'break_end' = 'focus_end') {
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

  stopAlarm() {`
);

fs.writeFileSync('src/services/soundService.ts', content);
