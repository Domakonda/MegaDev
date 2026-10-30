// What a merged ticket holds once it is split by problem, not by subject. Pages explain it; this file is what runs.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

// A cause from causes.ts, or the reports the desk read as a one-day move (desk-notes.json). The desk
// counts those where they are filed, under their tenant's cause; this problem counts them again on
// their own, because a date that moved by one day was not flipped by the parser.
export type Problem = 'parser' | 'hint' | 'one-day-move' | 'unplaced';

export type ProblemGroup = {
  problem: Problem;
  ids: string[];
  // Set when these reports are also counted under another problem.
  alsoIn: Problem | null;
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  channels: Record<string, number>;
};

function group(problem: Problem, rs: Report[], alsoIn: Problem | null = null): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    ids: rs.map((r) => r.id).sort(),
    alsoIn,
    tenants: new Set(rs.map((r) => r.tenant)).size,
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
    channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
  };
}

export function splitTicket(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { total: number; groups: ProblemGroup[] } {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const byCause = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = causeOf(r, tenantOf(r)) ?? 'unplaced';
    byCause.set(p, [...(byCause.get(p) ?? []), r]);
  }
  const groups = [...byCause.entries()].map(([p, rs]) => group(p, rs)).sort((a, b) => b.ids.length - a.ids.length);

  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  const filedUnder = [...new Set(moved.map((r) => causeOf(r, tenantOf(r)) ?? 'unplaced'))];
  if (moved.length) groups.push(group('one-day-move', moved, filedUnder.length === 1 ? filedUnder[0] : null));
  return { total: merged.length, groups };
}
