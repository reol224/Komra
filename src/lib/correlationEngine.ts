export interface CorrelationEvent {
  id: string;
  timestamp: string;
  source: string;
  level: string;
  message: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  endpoint?: string;
  status_code?: number;
}

export interface CorrelationGroup {
  key: string;
  count: number;
  lastSeen: string;
}

export interface CorrelationResult {
  kind: 'events' | 'groups';
  events: CorrelationEvent[];
  groups: CorrelationGroup[];
  matches: number;
}

type Comparator = '=' | '>' | '>=' | '<' | '<=';

interface Condition {
  field: string;
  comparator: Comparator;
  value: string;
}

const FIELD_ALIASES: Record<string, keyof CorrelationEvent> = {
  source: 'source',
  level: 'level',
  message: 'message',
  user: 'user_email',
  user_email: 'user_email',
  ip: 'ip_address',
  ip_address: 'ip_address',
  user_agent: 'user_agent',
  endpoint: 'endpoint',
  status_code: 'status_code',
  status: 'status_code',
};

/** Returns the numeric comparator and operand when a value starts with one. */
function splitComparator(raw: string): { comparator: Comparator; value: string } {
  const match = /^(>=|<=|>|<)\s*(.*)$/.exec(raw);
  return match ? { comparator: match[1] as Comparator, value: match[2] } : { comparator: '=', value: raw };
}

/** Parses "field:value" or "field >= value" into a condition, or a free-text term. */
function parseCondition(term: string): Condition {
  const fieldMatch = /^([a-z_]+)\s*(?::|(?=[<>]))\s*(.+)$/i.exec(term.trim());
  const field = fieldMatch?.[1].toLowerCase();
  if (!fieldMatch || !field || !(field in FIELD_ALIASES)) {
    return { field: 'any', comparator: '=', value: term.trim().replace(/^"|"$/g, '') };
  }
  const { comparator, value } = splitComparator(fieldMatch[2].trim());
  return { field: FIELD_ALIASES[field], comparator, value: value.replace(/^"|"$/g, '') };
}

/** Matches text against a case-insensitive pattern where * is a wildcard. */
function wildcardMatch(text: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  const hasWildcard = pattern.includes('*');
  return new RegExp(hasWildcard ? `^${escaped}$` : escaped, 'i').test(text);
}

/** Evaluates one condition against an event. */
function matchesCondition(event: CorrelationEvent, condition: Condition): boolean {
  if (condition.field === 'any') {
    return [event.message, event.source, event.user_email, event.ip_address, event.endpoint]
      .some((value) => value !== undefined && wildcardMatch(value, condition.value));
  }
  const actual = event[condition.field as keyof CorrelationEvent];
  if (actual === undefined || actual === '') return false;
  if (condition.comparator !== '=') {
    const left = Number(actual);
    const right = Number(condition.value);
    if (Number.isNaN(left) || Number.isNaN(right)) return false;
    return condition.comparator === '>' ? left > right
      : condition.comparator === '>=' ? left >= right
        : condition.comparator === '<' ? left < right
          : left <= right;
  }
  return wildcardMatch(String(actual), condition.value);
}

/** Evaluates an expression of conditions joined by AND/OR (AND binds tighter). */
function matchesExpression(event: CorrelationEvent, expression: string): boolean {
  const trimmed = expression.trim();
  if (!trimmed) return true;
  return trimmed.split(/\s+OR\s+/i).some((orPart) =>
    orPart.split(/\s+AND\s+/i).every((term) => matchesCondition(event, parseCondition(term))),
  );
}

/** Applies a numeric comparison for "where count > N" style clauses. */
function compareNumbers(left: number, comparator: string, right: number): boolean {
  switch (comparator) {
    case '>': return left > right;
    case '>=': return left >= right;
    case '<': return left < right;
    case '<=': return left <= right;
    default: return left === right;
  }
}

/**
 * Runs a correlation query over events. Supports `filter | where field op N | stats count by field | where count op N`.
 * Throws an Error with a readable message for unsupported syntax.
 */
export function runCorrelationQuery(events: CorrelationEvent[], query: string): CorrelationResult {
  const [filterPart, ...stages] = query.split('|');
  let current = events.filter((event) => matchesExpression(event, filterPart));
  let groups: CorrelationGroup[] | null = null;

  for (const rawStage of stages) {
    const stage = rawStage.trim();
    const statsMatch = /^stats\s+count\s+by\s+([a-z_]+)$/i.exec(stage);
    const whereMatch = /^where\s+([a-z_]+)\s*(>=|<=|=|>|<)\s*(.+)$/i.exec(stage);

    if (statsMatch) {
      const field = FIELD_ALIASES[statsMatch[1].toLowerCase()];
      if (!field) throw new Error(`Unknown field "${statsMatch[1]}" in stats clause.`);
      const buckets = new Map<string, CorrelationGroup>();
      for (const event of current) {
        const value = event[field];
        if (value === undefined || value === '') continue;
        const key = String(value);
        const bucket = buckets.get(key);
        if (bucket) {
          bucket.count += 1;
          if (event.timestamp > bucket.lastSeen) bucket.lastSeen = event.timestamp;
        } else {
          buckets.set(key, { key, count: 1, lastSeen: event.timestamp });
        }
      }
      groups = Array.from(buckets.values()).sort((a, b) => b.count - a.count);
    } else if (whereMatch) {
      const [, field, comparator, operand] = whereMatch;
      const number = Number(operand.trim());
      if (Number.isNaN(number)) throw new Error(`"where" expects a number, got "${operand.trim()}".`);
      if (field.toLowerCase() === 'count') {
        if (!groups) throw new Error('"where count" must follow a "stats count by <field>" clause.');
        groups = groups.filter((group) => compareNumbers(group.count, comparator, number));
      } else {
        const alias = FIELD_ALIASES[field.toLowerCase()];
        if (!alias) throw new Error(`Unknown field "${field}" in where clause.`);
        current = current.filter((event) => {
          const value = event[alias];
          return value !== undefined && compareNumbers(Number(value), comparator, number);
        });
      }
    } else {
      throw new Error(`Unsupported clause "${stage}". Use "stats count by <field>" or "where <field> <op> <number>".`);
    }
  }

  return groups
    ? { kind: 'groups', events: [], groups, matches: groups.length }
    : { kind: 'events', events: current, groups: [], matches: current.length };
}
