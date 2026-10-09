const fs = require('fs');
let code = fs.readFileSync('src/services/schedulingParser.ts', 'utf8');

code = code.replace(
  'Create a calendar event exactly matching this description: "${rawText}". Calculate dates accurately relative to today.',
  'Create a calendar event exactly matching this description: "${rawText}". Calculate dates accurately relative to today. CRITICAL: DO NOT round times. If the user specifies 10:20 or any other exact minute, you MUST output exactly that minute (e.g. "10:20"). Do not round to the nearest 15 or 30 minutes.'
);

fs.writeFileSync('src/services/schedulingParser.ts', code);
console.log('Fixed prompt!');
