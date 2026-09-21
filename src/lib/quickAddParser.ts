import { Tracker } from '../types/index.ts';

export interface ParseResult {
  status: 'matched' | 'ambiguous' | 'no_match';
  targetTracker?: Tracker;
  candidateTrackers?: Tracker[];
  parsedValue: number;
  extractedQuery: string;
  originalInput: string;
  suggestedQuestTitle: string;
}

export function parseQuickAddInput(input: string, activeTrackers: Tracker[]): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      status: 'no_match',
      parsedValue: 1,
      extractedQuery: '',
      originalInput: input,
      suggestedQuestTitle: '',
    };
  }

  // Look for quantity pattern at end or start, e.g. "30m", "1.5h", "25", "+5"
  // Patterns:
  // 1) End: "guitar 30m", "pushups 25", "deep work 1h"
  // 2) Start: "30m guitar", "25 pushups", "+5 pushups"
  let parsedValue = 1;
  let textQuery = trimmed;

  const endNumRegex = /\s+(\+?\d+(?:\.\d+)?)\s*(m|min|mins|minutes|h|hr|hrs|hours|x|reps|times|pages|p)?$/i;
  const startNumRegex = /^(\+?\d+(?:\.\d+)?)\s*(m|min|mins|minutes|h|hr|hrs|hours|x|reps|times|pages|p)?\s+(.+)$/i;

  const endMatch = trimmed.match(endNumRegex);
  const startMatch = trimmed.match(startNumRegex);

  if (endMatch) {
    const rawNum = parseFloat(endMatch[1].replace('+', ''));
    const unit = (endMatch[2] || '').toLowerCase();
    if (unit.startsWith('h')) {
      parsedValue = Math.round(rawNum * 60);
    } else {
      parsedValue = rawNum;
    }
    textQuery = trimmed.slice(0, endMatch.index).trim();
  } else if (startMatch) {
    const rawNum = parseFloat(startMatch[1].replace('+', ''));
    const unit = (startMatch[2] || '').toLowerCase();
    if (unit.startsWith('h')) {
      parsedValue = Math.round(rawNum * 60);
    } else {
      parsedValue = rawNum;
    }
    textQuery = startMatch[3].trim();
  }

  const cleanQuery = textQuery.toLowerCase();
  const nonArchived = activeTrackers.filter(t => !t.archived);

  // Exact match
  const exactMatches = nonArchived.filter(t => t.name.toLowerCase() === cleanQuery);
  if (exactMatches.length === 1) {
    return {
      status: 'matched',
      targetTracker: exactMatches[0],
      parsedValue: normalizeValueForType(exactMatches[0], parsedValue),
      extractedQuery: cleanQuery,
      originalInput: input,
      suggestedQuestTitle: trimmed,
    };
  }

  // Prefix match (e.g. "push" -> "Pushups", "guit" -> "Guitar practice")
  const prefixMatches = nonArchived.filter(t => 
    t.name.toLowerCase().startsWith(cleanQuery) || cleanQuery.startsWith(t.name.toLowerCase())
  );
  if (prefixMatches.length === 1) {
    return {
      status: 'matched',
      targetTracker: prefixMatches[0],
      parsedValue: normalizeValueForType(prefixMatches[0], parsedValue),
      extractedQuery: cleanQuery,
      originalInput: input,
      suggestedQuestTitle: trimmed,
    };
  }

  // Contains match
  const containsMatches = nonArchived.filter(t => 
    t.name.toLowerCase().includes(cleanQuery)
  );

  if (containsMatches.length === 1) {
    return {
      status: 'matched',
      targetTracker: containsMatches[0],
      parsedValue: normalizeValueForType(containsMatches[0], parsedValue),
      extractedQuery: cleanQuery,
      originalInput: input,
      suggestedQuestTitle: trimmed,
    };
  }

  if (containsMatches.length > 1) {
    return {
      status: 'ambiguous',
      candidateTrackers: containsMatches,
      parsedValue,
      extractedQuery: cleanQuery,
      originalInput: input,
      suggestedQuestTitle: trimmed,
    };
  }

  if (prefixMatches.length > 1) {
    return {
      status: 'ambiguous',
      candidateTrackers: prefixMatches,
      parsedValue,
      extractedQuery: cleanQuery,
      originalInput: input,
      suggestedQuestTitle: trimmed,
    };
  }

  // No match: offer to create quest
  return {
    status: 'no_match',
    parsedValue,
    extractedQuery: cleanQuery,
    originalInput: input,
    suggestedQuestTitle: trimmed,
  };
}

function normalizeValueForType(tracker: Tracker, parsedVal: number): number {
  if (tracker.type === 'habit') {
    return 1;
  }
  if (tracker.type === 'tally') {
    return Math.max(1, Math.round(parsedVal));
  }
  if (tracker.type === 'timer') {
    return Math.max(1, Math.round(parsedVal));
  }
  return parsedVal;
}
