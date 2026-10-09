const fs = require('fs');
let content = fs.readFileSync('src/components/calendar/CalendarView.tsx', 'utf8');

// Replace move logic
content = content.replace(
  /const deltaMins = Math\.round\(deltaY \/ 15\) \* 15;[\s\S]*?let newStart = state\.initialStartMins;[\s\S]*?let newEnd = state\.initialEndMins;[\s\S]*?let newDateStr = state\.currentDateStr;[\s\S]*?if \(state\.type === 'move'\) \{[\s\S]*?newStart \+= deltaMins;[\s\S]*?newEnd \+= deltaMins;/m,
  `let newStart = state.initialStartMins;
        let newEnd = state.initialEndMins;
        let newDateStr = state.currentDateStr;
        
        if (state.type === 'move') {
           const rawStart = state.initialStartMins + deltaY;
           newStart = Math.round(rawStart / 15) * 15;
           newEnd = newStart + (state.initialEndMins - state.initialStartMins);`
);

// Replace resize logic
content = content.replace(
  /\} else if \(state\.type === 'resize-top'\) \{[\s\S]*?newStart = Math\.min\(newStart \+ deltaMins, newEnd - 15\);[\s\S]*?\} else if \(state\.type === 'resize-bottom'\) \{[\s\S]*?newEnd = Math\.max\(newEnd \+ deltaMins, newStart \+ 15\);[\s\S]*?\}/m,
  `} else if (state.type === 'resize-top') {
           const rawStart = state.initialStartMins + deltaY;
           newStart = Math.round(rawStart / 15) * 15;
           newStart = Math.min(newStart, newEnd - 15);
        } else if (state.type === 'resize-bottom') {
           const rawEnd = state.initialEndMins + deltaY;
           newEnd = Math.round(rawEnd / 15) * 15;
           newEnd = Math.max(newEnd, state.initialStartMins + 15);
        }`
);

fs.writeFileSync('src/components/calendar/CalendarView.tsx', content);
