import { NaturalLanguageParsingResult, EventRecurrence, EventCategory } from '../types';

export interface ISchedulingParser {
  parse(input: string, referenceDate?: Date): Promise<NaturalLanguageParsingResult>;
}

export class RuleBasedSchedulingParser implements ISchedulingParser {
  private formatZero(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }

  private formatDateString(d: Date): string {
    const year = d.getFullYear();
    const month = this.formatZero(d.getMonth() + 1);
    const day = this.formatZero(d.getDate());
    return `${year}-${month}-${day}`;
  }

  async parse(input: string, referenceDate: Date = new Date()): Promise<NaturalLanguageParsingResult> {
    const rawText = input.trim();
    if (!rawText) {
      throw new Error('Input text is empty');
    }

    const uncertainties: string[] = [];
    let confidence = 0.95;
    let workingText = rawText;

    // Detect Recurrence
    let recurrence: EventRecurrence = 'none';
    let recurrenceRuleText = '';
    let recurrenceDays: number[] = [];

    const weekdaysMap: { [key: string]: number } = {
      sunday: 0, sun: 0,
      monday: 1, mon: 1,
      tuesday: 2, tue: 2, tues: 2,
      wednesday: 3, wed: 3,
      thursday: 4, thu: 4, thurs: 4,
      friday: 5, fri: 5,
      saturday: 6, sat: 6,
    };

    const everyWeekdayRegex = /\bevery\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun)\b/i;
    const everyDayRegex = /\b(every\s+day|daily)\b/i;
    const everyWeekdaysRegex = /\b(every\s+weekday|weekdays)\b/i;
    const everyWeekRegex = /\b(every\s+week|weekly)\b/i;
    const everyMonthRegex = /\b(every\s+month|monthly)\b/i;

    const weekdayMatch = workingText.match(everyWeekdayRegex);
    if (weekdayMatch) {
      recurrence = 'weekly';
      const dayName = weekdayMatch[1].toLowerCase();
      const dayIndex = weekdaysMap[dayName];
      recurrenceDays = [dayIndex];
      const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      recurrenceRuleText = `Every ${capitalizedDay}`;
      workingText = workingText.replace(weekdayMatch[0], ' ');
    } else if (everyWeekdaysRegex.test(workingText)) {
      recurrence = 'weekdays';
      recurrenceRuleText = 'Every weekday (Mon-Fri)';
      workingText = workingText.replace(everyWeekdaysRegex, ' ');
    } else if (everyDayRegex.test(workingText)) {
      recurrence = 'daily';
      recurrenceRuleText = 'Every day';
      workingText = workingText.replace(everyDayRegex, ' ');
    } else if (everyWeekRegex.test(workingText)) {
      recurrence = 'weekly';
      recurrenceRuleText = 'Weekly';
      workingText = workingText.replace(everyWeekRegex, ' ');
    } else if (everyMonthRegex.test(workingText)) {
      recurrence = 'monthly';
      recurrenceRuleText = 'Monthly';
      workingText = workingText.replace(everyMonthRegex, ' ');
    }

    // Detect Target Date
    let targetDate = new Date(referenceDate.getTime());
    let dateDetected = false;

    // Check "today", "tomorrow", "day after tomorrow"
    if (/\bday\s+after\s+tomorrow\b/i.test(workingText)) {
      targetDate.setDate(targetDate.getDate() + 2);
      dateDetected = true;
      workingText = workingText.replace(/\bday\s+after\s+tomorrow\b/i, ' ');
      uncertainties.push(`Interpreted date as day after tomorrow (${this.formatDateString(targetDate)})`);
    } else if (/\btomorrow\b/i.test(workingText)) {
      targetDate.setDate(targetDate.getDate() + 1);
      dateDetected = true;
      workingText = workingText.replace(/\btomorrow\b/i, ' ');
      uncertainties.push(`Interpreted date as tomorrow (${this.formatDateString(targetDate)})`);
    } else if (/\btoday\b/i.test(workingText)) {
      dateDetected = true;
      workingText = workingText.replace(/\btoday\b/i, ' ');
    }

    // Check "this [day]" or "next [day]"
    if (!dateDetected) {
      const nextDayMatch = workingText.match(/\b(next|this|on)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
      if (nextDayMatch) {
        const dayName = nextDayMatch[2].toLowerCase();
        const targetDayIdx = weekdaysMap[dayName];
        const currentDayIdx = targetDate.getDay();
        let daysToAdd = (targetDayIdx - currentDayIdx + 7) % 7;
        if (daysToAdd === 0 && (nextDayMatch[1]?.toLowerCase() === 'next' || recurrence !== 'none')) {
          daysToAdd = 7;
        } else if (daysToAdd === 0 && !nextDayMatch[1]) {
          daysToAdd = 7;
        }
        targetDate.setDate(targetDate.getDate() + daysToAdd);
        dateDetected = true;
        workingText = workingText.replace(nextDayMatch[0], ' ');
        uncertainties.push(`Scheduled for next ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} (${this.formatDateString(targetDate)})`);
      }
    }

    // Check specific dates e.g. "on Sept 25", "on September 25", "on 2026-09-25", "9/25"
    if (!dateDetected) {
      const explicitMonthMatch = workingText.match(/\b(on\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?\b/i);
      if (explicitMonthMatch) {
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthPrefix = explicitMonthMatch[2].toLowerCase().substring(0, 3);
        const monthIdx = monthNames.indexOf(monthPrefix);
        const day = parseInt(explicitMonthMatch[3], 10);
        const year = explicitMonthMatch[4] ? parseInt(explicitMonthMatch[4], 10) : referenceDate.getFullYear();
        if (monthIdx !== -1 && day >= 1 && day <= 31) {
          targetDate = new Date(year, monthIdx, day);
          dateDetected = true;
          workingText = workingText.replace(explicitMonthMatch[0], ' ');
        }
      }
    }

    if (!dateDetected) {
      // If recurrence is weekly, default to next recurrence day
      if (recurrenceDays.length > 0) {
        const targetDayIdx = recurrenceDays[0];
        const currentDayIdx = targetDate.getDay();
        let daysToAdd = (targetDayIdx - currentDayIdx + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7;
        targetDate.setDate(targetDate.getDate() + daysToAdd);
        dateDetected = true;
      } else {
        uncertainties.push(`No specific date identified; defaulted to today (${this.formatDateString(targetDate)})`);
        confidence -= 0.15;
      }
    }

    // Detect Time and Duration
    let startHour = 10;
    let startMin = 0;
    let durationMinutes = 60;
    let timeDetected = false;
    let durationDetected = false;

    // Pattern 1: "from X to Y [am/pm]" e.g., "from 7 to 9 PM", "from 10:30am to 12pm"
    const fromToRegex = /\bfrom\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+to\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
    const fromToMatch = workingText.match(fromToRegex);

    if (fromToMatch) {
      let h1 = parseInt(fromToMatch[1], 10);
      const m1 = fromToMatch[2] ? parseInt(fromToMatch[2], 10) : 0;
      const meridiem1 = fromToMatch[3]?.toLowerCase();

      let h2 = parseInt(fromToMatch[4], 10);
      const m2 = fromToMatch[5] ? parseInt(fromToMatch[5], 10) : 0;
      const meridiem2 = fromToMatch[6].toLowerCase();

      // Normalize meridiem
      if (meridiem2 === 'pm' && h2 < 12) h2 += 12;
      if (meridiem2 === 'am' && h2 === 12) h2 = 0;

      if (meridiem1) {
        if (meridiem1 === 'pm' && h1 < 12) h1 += 12;
        if (meridiem1 === 'am' && h1 === 12) h1 = 0;
      } else {
        // If first has no meridiem, inherit from second if reasonable
        if (meridiem2 === 'pm' && h1 < h2 && h1 >= 1 && h1 < 12) {
          h1 += 12;
        }
      }

      startHour = h1;
      startMin = m1;
      timeDetected = true;

      const totalStartMin = h1 * 60 + m1;
      const totalEndMin = h2 * 60 + m2;
      durationMinutes = Math.max(15, totalEndMin - totalStartMin);
      durationDetected = true;

      workingText = workingText.replace(fromToMatch[0], ' ');
    }

    // Pattern 2: "at X [am/pm]" or "@ X [am/pm]"
    if (!timeDetected) {
      const atTimeRegex = /\b(?:at|@)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
      const atMatch = workingText.match(atTimeRegex);
      if (atMatch) {
        let h = parseInt(atMatch[1], 10);
        const m = atMatch[2] ? parseInt(atMatch[2], 10) : 0;
        const meridiem = atMatch[3]?.toLowerCase();

        if (meridiem === 'pm' && h < 12) h += 12;
        if (meridiem === 'am' && h === 12) h = 0;
        // If no meridiem and hour between 1 and 6, assume PM for common workday hours
        if (!meridiem && h >= 1 && h <= 6) h += 12;

        startHour = h;
        startMin = m;
        timeDetected = true;
        workingText = workingText.replace(atMatch[0], ' ');
      }
    }

    // Check duration: "for one hour", "for X hours", "for X mins", "for 45m"
    if (!durationDetected) {
      if (/\bfor\s+(?:one|1)\s+hour\b/i.test(workingText)) {
        durationMinutes = 60;
        durationDetected = true;
        workingText = workingText.replace(/\bfor\s+(?:one|1)\s+hour\b/i, ' ');
      } else if (/\bfor\s+half\s+an\s+hour\b/i.test(workingText)) {
        durationMinutes = 30;
        durationDetected = true;
        workingText = workingText.replace(/\bfor\s+half\s+an\s+hour\b/i, ' ');
      } else {
        const durationHourMatch = workingText.match(/\bfor\s+(\d+(?:\.\d+)?)\s*(?:hours|hour|hrs|hr|h)\b/i);
        if (durationHourMatch) {
          durationMinutes = Math.round(parseFloat(durationHourMatch[1]) * 60);
          durationDetected = true;
          workingText = workingText.replace(durationHourMatch[0], ' ');
        } else {
          const durationMinMatch = workingText.match(/\bfor\s+(\d+)\s*(?:minutes|minute|mins|min|m)\b/i);
          if (durationMinMatch) {
            durationMinutes = parseInt(durationMinMatch[1], 10);
            durationDetected = true;
            workingText = workingText.replace(durationMinMatch[0], ' ');
          }
        }
      }
    }

    if (!timeDetected) {
      uncertainties.push('No start time found; defaulted to 10:00 AM');
      confidence -= 0.2;
    }

    if (!durationDetected) {
      uncertainties.push('No duration specified; defaulted to 60 minutes');
    }

    // Calculate End Time
    const totalStartMinutes = startHour * 60 + startMin;
    const totalEndMinutes = totalStartMinutes + durationMinutes;
    const endHour = Math.floor(totalEndMinutes / 60) % 24;
    const endMin = totalEndMinutes % 60;

    const startDateStr = this.formatDateString(targetDate);
    const startTimeStr = `${this.formatZero(startHour)}:${this.formatZero(startMin)}`;
    const endTimeStr = `${this.formatZero(endHour)}:${this.formatZero(endMin)}`;

    // Clean Title
    let cleanedTitle = workingText
      .replace(/\s+/g, ' ')
      .replace(/^[,\-–—:\s]+|[,\-–—:\s]+$/g, '')
      .trim();

    if (!cleanedTitle) {
      cleanedTitle = 'Scheduled Activity';
      uncertainties.push('Title could not be extracted cleanly');
      confidence -= 0.1;
    } else {
      // Capitalize first character
      cleanedTitle = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
    }

    // Determine Category and Color
    let category: EventCategory = 'deep_work';
    let color = '#6366f1'; // indigo

    const lowerOriginal = rawText.toLowerCase();
    if (/\b(meeting|supervisor|sync|call|catchup|interview|1:1|chat)\b/.test(lowerOriginal)) {
      category = 'meeting';
      color = '#6366f1'; // indigo
    } else if (/\b(study|read|reading|lecture|class|homework|learn|course)\b/.test(lowerOriginal)) {
      category = 'study';
      color = '#10b981'; // emerald
    } else if (/\b(gym|workout|run|training|yoga|health|lunch|dinner|coffee|doctor)\b/.test(lowerOriginal)) {
      category = 'personal';
      color = '#f59e0b'; // amber
    } else if (/\b(review|retro|audit|critique|checkin)\b/.test(lowerOriginal)) {
      category = 'review';
      color = '#ec4899'; // pink
    } else if (/\b(deadline|due|submit|exam)\b/.test(lowerOriginal)) {
      category = 'deadline';
      color = '#ef4444'; // red
    } else {
      category = 'deep_work';
      color = '#06b6d4'; // cyan
    }

    return {
      rawText,
      title: cleanedTitle,
      startDate: startDateStr,
      startTime: startTimeStr,
      endDate: startDateStr,
      endTime: endTimeStr,
      durationMinutes,
      isAllDay: false,
      recurrence,
      recurrenceRuleText,
      category,
      color,
      confidence: Math.max(0.4, Math.min(1.0, confidence)),
      uncertainties,
    };
  }
}

// Unified scheduling service instance
export const schedulingService: ISchedulingParser = new RuleBasedSchedulingParser();
