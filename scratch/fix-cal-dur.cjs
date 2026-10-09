const fs = require('fs');
let content = fs.readFileSync('src/components/calendar/CalendarView.tsx', 'utf8');

content = content.replace(
  /endTime: formatTime\(state\.currentEndMins\)/,
  `endTime: formatTime(state.currentEndMins),
                 durationMinutes: (state.currentEndMins < state.currentStartMins ? state.currentEndMins + 1440 : state.currentEndMins) - state.currentStartMins`
);

fs.writeFileSync('src/components/calendar/CalendarView.tsx', content);
