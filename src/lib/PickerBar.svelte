<script lang="ts">
  // A single-column picker bar: the machine, then one of its jobs.
  //
  // WHY A BAR AND NOT TWO RAILS. This panel is embedded in the console's side pane, which is already
  // half a screen. Two fixed-width rails (200px + 220px) took more than half of THAT, leaving the
  // output — the thing being read — about a third of the width. A rail makes sense in a page that
  // owns the whole window; in a pane it is a column inside a column.
  //
  // THE TWO LEVELS STAY SEPARATE ON PURPOSE. Machines and jobs are different questions ("which box"
  // and "what ran on it"), and flattening them into one list would make the job rows spell out which
  // machine they belong to on every line.
  import type { Job, Sandbox } from '../gen/ui/v1/ui_pb.js'

  let {
    sandboxes,
    sbName,
    listError,
    jobs,
    jobId,
    jobError,
    onselectSandbox,
    onselectJob,
  }: {
    sandboxes: Sandbox[]
    sbName: string
    listError: string
    jobs: Job[]
    jobId: string
    jobError: string
    onselectSandbox: (name: string) => void
    onselectJob: (job: Job) => void
  } = $props()

  /** "linux · linux-wayland", or "—" when the machine did not answer. */
  function subtitle(s: Sandbox): string {
    return [s.os, s.platform].filter(Boolean).join(' · ') || '—'
  }

  /** The worker's own words, mapped to the tone each deserves. */
  function tone(state: string): string {
    switch (state) {
      case 'running':
        return 'run'
      case 'done':
        return 'ok'
      case 'failed':
      case 'killed':
        return 'bad'
      default:
        return ''
    }
  }

  /** A one-line label for a job: the command is the title. */
  function jobLabel(j: Job): string {
    return j.command || j.id
  }
</script>

<div class="bar">
  {#if listError}
    <!-- ONE LINE, CLIPPED. A transport error can be a paragraph — "unimplemented: HTTP 404" with a
         stack of context — and letting it wrap here pushes the picker and the content off the strip it
         belongs on. The full text is in the title, so hovering still shows it. -->
    <span class="err clip" title={listError}>{listError}</span>
  {:else if sandboxes.length === 0}
    <span class="muted">No sandboxes configured.</span>
  {:else}
    <!-- NATIVE SELECTS. A custom dropdown is a lot of markup for a control used once per visit, and
         these inherit the keyboard behaviour and the platform's own list for free. -->
    <select
      class="pick"
      value={sbName}
      onchange={e => onselectSandbox((e.currentTarget as HTMLSelectElement).value)}
      aria-label="machine"
    >
      {#each sandboxes as s (s.name)}
        <option value={s.name}>{s.name} · {subtitle(s)}</option>
      {/each}
    </select>
  {/if}

  {#if sbName !== ''}
    {#if jobError}
      <span class="err">{jobError}</span>
    {:else if jobs.length === 0}
      <span class="muted">No jobs yet.</span>
    {:else}
      <select
        class="pick grow"
        value={jobId}
        onchange={e => {
          const j = jobs.find(x => x.id === (e.currentTarget as HTMLSelectElement).value)
          if (j) onselectJob(j)
        }}
        aria-label="job"
      >
        {#each jobs as j (j.id)}
          <option value={j.id}>{j.state === 'running' ? '● ' : ''}{jobLabel(j)}</option>
        {/each}
      </select>
      <!-- The state of the selected job, beside the picker: it is the one thing a reader checks
           before scrolling, and a select option cannot carry colour. -->
      {#each jobs.filter(j => j.id === jobId) as j (j.id)}
        <span class="badge {tone(j.state)}">{j.state}</span>
      {/each}
    {/if}
  {/if}
</div>

<style>
  .bar {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    padding: var(--sp-sm) var(--sp-sm) 0;
    flex-wrap: wrap;
  }
  .pick {
    min-width: 0;
    max-width: 100%;
    padding: 4px 8px;
    font: inherit;
    font-size: var(--text-meta);
    color: var(--foreground);
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
  }
  .pick.grow {
    flex: 1 1 12rem;
  }
  .muted {
    font-size: var(--text-meta);
    color: var(--muted-foreground);
  }
  .err {
    font-size: var(--text-meta);
    color: var(--destructive);
  }
  .clip {
    flex: 1 1 100%;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .badge {
    flex: 0 0 auto;
    font-size: var(--text-micro);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .badge.ok {
    color: var(--success);
  }
  .badge.bad {
    color: var(--destructive);
  }
  .badge.run {
    color: var(--primary);
  }
</style>
