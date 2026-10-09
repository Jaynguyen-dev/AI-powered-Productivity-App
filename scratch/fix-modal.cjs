const fs = require('fs');
let content = fs.readFileSync('src/components/calendar/EventModal.tsx', 'utf8');

content = content.replace(
  /endTime: endTime \|\| startTime,\s*durationMinutes,/,
  `endTime: endTime || startTime,
        durationMinutes: (function() {
          const [sH, sM] = startTime.split(':').map(Number);
          const [eH, eM] = (endTime || startTime).split(':').map(Number);
          let dur = (eH * 60 + eM) - (sH * 60 + sM);
          if (dur < 0) dur += 24 * 60;
          return dur;
        })(),`
);

fs.writeFileSync('src/components/calendar/EventModal.tsx', content);
