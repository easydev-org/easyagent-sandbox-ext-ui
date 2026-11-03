<script lang="ts">
  // The selected machine's jobs.
  //
  // ASKED OF THE MACHINE, not of this extension: a job belongs to the daemon that ran it, so one
  // started before this process booted — or by a tool call that has long returned — still appears.
  import type { Job } from '../gen/ui/v1/ui_pb.js'

  let {
    jobs,
    sbName,
    jobId,
    jobError,
    onselect,
  }: {
    jobs: Job[]
    sbName: string
    jobId: string
    jobError: string
    onselect: (job: Job) => void
  } = $props()

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
</script>

<aside>
  {#if sbName === ''}
    <div class="state">Pick a machine.</div>
  {:else if jobs.length === 0}
    <div class="state" class:err={jobError !== ''}>{jobError || 'No jobs yet.'}</div>
  {:else}
    {#each jobs as j (j.id)}
      <button type="button" class="row" class:active={j.id === jobId} onclick={() => onselect(j)}>
        <span class="name mono micro">{j.id.slice(0, 10)}</span>
        <span class="micro muted">{j.command.slice(0, 60)}</span>
        <span class="micro">
          {#if j.state}<span class="pill {tone(j.state)}">{j.state}</span>{/if}
        </span>
      </button>
    {/each}
  {/if}
</aside>

<style>
  aside {
    display: flex;
    width: 220px;
    flex: 0 0 auto;
    flex-direction: column;
    gap: 2px;
    overflow: auto;
    border-right: 1px solid var(--border);
    padding: 6px;
  }

  .row {
    display: flex;
    cursor: pointer;
    flex-direction: column;
    gap: 1px;
    width: 100%;
    border: 0;
    border-radius: 6px;
    background: none;
    padding: 6px 8px;
    color: inherit;
    font: inherit;
    text-align: left;
  }

  .row:hover {
    background: var(--card);
  }

  .row.active {
    background: var(--primary);
    color: #fff;
  }

  .row.active .muted {
    color: #dbeafe;
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .state {
    padding: 12px 8px;
    color: var(--muted-foreground);
    text-align: center;
  }

  .state.err {
    color: var(--destructive);
  }

  @media (max-width: 720px) {
    aside {
      width: 100%;
      max-height: 30%;
      border-right: 0;
      border-bottom: 1px solid var(--border);
    }
  }
</style>
