const fs = require('fs');
let content = fs.readFileSync('src/components/timer/FocusTimer.tsx', 'utf8');

content = content.replace(
  /if \(soundEnabled\) soundService\.playCompletionChime\(isRelax \? 'break_end' : 'focus_end'\);/g,
  `if (soundEnabled) soundService.startAlarm(isRelax ? 'break_end' : 'focus_end');`
);

content = content.replace(
  /soundService\.playCompletionChime\(\)/g,
  `soundService.playCompletionChime()`
); // No change needed for task completion (it's fine to just play once)

fs.writeFileSync('src/components/timer/FocusTimer.tsx', content);
