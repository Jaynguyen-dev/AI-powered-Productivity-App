import { schedulingService } from './src/services/schedulingParser.js';

async function test() {
  const result = await schedulingService.parse("Meeting with my supervisor at 2 PM for one hour", new Date('2026-09-19T09:00:00'));
  console.log(result);
}

test();
