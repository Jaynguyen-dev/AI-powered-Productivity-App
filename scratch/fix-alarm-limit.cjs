const fs = require('fs');
let content = fs.readFileSync('src/services/soundService.ts', 'utf8');

content = content.replace(
  /const osc = ctx\.createOscillator\(\);[\s\S]*?osc\.stop\(now \+ 90\);\s*this\.activeOscillators\.push\(osc\);/m,
  `// Create separate oscillators for each cycle to avoid browser AudioParam event limits
    for (let i = 0; i < 90 * 2; i++) {
      const cycleStart = now + i * 0.5;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Use a clear, pleasant tone. Focus=C6(1046.5Hz), Break=A5(880Hz)
      osc.type = 'sine';
      osc.frequency.value = type === 'focus_end' ? 1046.5 : 880;

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

      osc.connect(gain);
      gain.connect(this.alarmGain);

      osc.start(cycleStart);
      osc.stop(cycleStart + 0.25);
      
      this.activeOscillators.push(osc);
    }`
);

fs.writeFileSync('src/services/soundService.ts', content);
