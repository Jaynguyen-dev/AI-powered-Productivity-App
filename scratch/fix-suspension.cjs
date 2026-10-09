const fs = require('fs');
let content = fs.readFileSync('src/services/soundService.ts', 'utf8');

// Add silent oscillator property
if (!content.includes('private wakeLockOsc')) {
  content = content.replace(
    /private alarmSource: AudioBufferSourceNode \| null = null;/,
    `private alarmSource: AudioBufferSourceNode | null = null;
  private wakeLockOsc: OscillatorNode | null = null;`
  );
}

// Start wake lock inside playTick (which is called on user interaction like Start/Pause)
if (!content.includes('this.wakeLockOsc =')) {
  content = content.replace(
    /playTick\(\) \{[\s\S]*?try \{[\s\S]*?const ctx = this\.getContext\(\);/m,
    `playTick() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      
      // Keep audio context permanently awake by playing an inaudible oscillator
      if (!this.wakeLockOsc) {
        this.wakeLockOsc = ctx.createOscillator();
        const silentGain = ctx.createGain();
        silentGain.gain.value = 0.0001; // nearly silent
        this.wakeLockOsc.connect(silentGain);
        silentGain.connect(ctx.destination);
        this.wakeLockOsc.start();
      }`
  );
}

// Remove pointerdown
content = content.replace(/window\.addEventListener\('pointerdown', this\.interactionListener, \{ capture: true \}\);\n/g, '');
content = content.replace(/window\.removeEventListener\('pointerdown', this\.interactionListener, \{ capture: true \}\);\n/g, '');

// Also ensure we only use click and keydown
fs.writeFileSync('src/services/soundService.ts', content);
