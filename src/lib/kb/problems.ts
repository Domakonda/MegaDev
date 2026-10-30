// What a merged ticket holds once it is split by problem, not by subject. Pages explain it; this file is what runs.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

// A cause from causes.ts, or a report the desk read as a one-day move (desk-notes.json): a date that
// moved by one day was not flipped by the parser, whatever its tenant says.
export type Problem = 'parser' | 'hint' | 'one-day-move' | 'unplaced';

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'one-day-move';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  ids: string[];
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  channels: Record<string, number>;
};

export function splitTicket(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { total: number; groups: ProblemGroup[] } {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const byProblem = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r), oneDayMove);
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  const groups = [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        ids: rs.map((r) => r.id).sort(),
        tenants: new Set(rs.map((r) => r.tenant)).size,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
        channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
      };
    })
    .sort((a, b) => b.ids.length - a.ids.length);
  return { total: merged.length, groups };
}
