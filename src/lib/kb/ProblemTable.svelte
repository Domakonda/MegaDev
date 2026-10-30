<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket, type Problem } from '#lib/kb/problems';

  // `issues` maps each problem to the engineering ticket that now carries it, and what became of it.
  type Issue = { url: string; outcome: string };
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Problem, Issue>> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([ch, n]) => `${ch} ×${n}`)
      .join(' · ');
  const issueNo = (url: string) => url.replace(/^.*\/issues\//, 'issue #');
</script>

<p class="sum">
  <strong>{split.total}</strong> reports merged into #{ticket} ·
  <strong>{split.groups.length}</strong>
  {split.groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>came in by</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      {@const issue = issues[g.problem]}
      <tr>
        <td><code>{g.problem}</code></td>
        <td>{g.ids.length}{#if g.alsoIn}<sup>*</sup>{/if}</td>
        <td class="muted">{channels(g.channels)}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if issue}<a href={issue.url}>{issueNo(issue.url)}</a> · {issue.outcome}
          {:else}<span class="warn">no ticket</span>{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#each split.groups.filter((g) => g.alsoIn) as g (g.problem)}
  <p class="muted">
    <sup>*</sup>{g.ids.length} <code>{g.problem}</code> reports are also counted under <code>{g.alsoIn}</code>, where the desk
    files them by tenant.
  </p>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .muted { color: var(--muted); font-size: 0.85em; }
  .warn { color: var(--warn); font-weight: 600; }
</style>
