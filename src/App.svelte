<script lang="ts">
  // The sandbox panel: machines, their jobs, and one job's output.
  //
  // THE OUTPUT IS A CONNECT STREAM, not Server-Sent Events. It used to be SSE because a browser could
  // not speak Connect; the panel speaks it now, so the stream is a server-streaming RPC on the same
  // transport as everything else — the same client, the same authentication, no second way to be
  // authorised.
  //
  // THE SCREEN IS AN IFRAME. It used to be a canvas fed by an H.264 WebSocket with no controls at all;
  // the worker already serves easystream-webui at /desktop/, which has zoom, pan, a virtual keyboard
  // and touch — so the panel embeds that instead of drawing frames.
  import { onMount } from 'svelte'
  import type { Job, Sandbox } from './gen/ui/v1/ui_pb.js'
  import { client, SESSION } from './client.js'
  import MachineRail from './lib/MachineRail.svelte'
  import JobRail from './lib/JobRail.svelte'
  import ScreenPane from './lib/ScreenPane.svelte'
  import OutputPane from './lib/OutputPane.svelte'

  const LIST_MS = 10_000
  const JOBS_MS = 5_000

  /** The panel's own hash route, so a tool result can open the thing it was about. */
  type Route = { sandbox: string; job: string; view: 'screen' | 'job' }

  function parseHash(): Route {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
    if (parts[0] !== 'sb' || !parts[1]) return { sandbox: '', job: '', view: 'screen' }
    const sandbox = decodeURIComponent(parts[1])
    if (parts[2] === 'job' && parts[3]) {
      return { sandbox, job: decodeURIComponent(parts[3]), view: 'job' }
    }
    return { sandbox, job: '', view: 'screen' }
  }

  const initial = parseHash()
  let sandboxes = $state<Sandbox[]>([])
  let jobs = $state<Job[]>([])
  let sbName = $state(initial.sandbox)
  let jobId = $state(initial.job)
  let view = $state<'screen' | 'job'>(initial.view)
  let listError = $state('')
  let jobError = $state('')
  let output = $state('')
  let totalLines = $state(0)
  let shownLines = $state(0)
  let streaming = $state(false)

  /** The live stream's abort handle, so a new selection cancels the old one. */
  let watcher: AbortController | null = null
  /** The desktop link, fetched per selection; the screen iframe loads it. */
  let desktopURL = $state('')
  let desktopError = $state('')

  /**
   * Read the desktop URL for one machine.
   *
   * THE URL IS SIGNED BY THE EXTENSION and expires, because an IFRAME NAVIGATION CANNOT CARRY AN
   * Authorization header — the browser's rule. Asking through this RPC is where the permission is
   * checked: the caller's token resolves to a tenant, and the machine must be one of theirs.
   */
  async function refreshDesktop(name: string): Promise<void> {
    desktopURL = ''
    desktopError = ''
    if (name === '') return
    try {
      const res = await client.authorizeDesktop({ session: SESSION, sandbox: name })
      desktopURL = res.url
    } catch (e) {
      desktopError = e instanceof Error ? e.message : String(e)
    }
  }

  async function refreshList(): Promise<void> {
    try {
      const res = await client.listSandboxes({ session: SESSION })
      sandboxes = res.sandboxes
      listError = ''
      // A machine that disappeared must not stay selected: the panel would keep offering one the
      // reader no longer has.
      if (sbName !== '' && !sandboxes.some(s => s.name === sbName)) select('')
    } catch (e) {
      listError = e instanceof Error ? e.message : String(e)
    }
  }

  async function refreshJobs(): Promise<void> {
    if (sbName === '') return
    try {
      const res = await client.listJobs({ session: SESSION, sandbox: sbName })
      jobs = res.jobs
      jobError = ''
    } catch (e) {
      jobs = []
      jobError = e instanceof Error ? e.message : String(e)
    }
    // A job named in the hash opens once its list arrives — it may be older than this page load, and
    // the machine still has it.
    if (jobId !== '' && view === 'job' && output === '') {
      const j = jobs.find(x => x.id === jobId)
      if (j) void watch(j)
    }
  }

  /** Replaces any running stream, so two jobs cannot interleave their lines. */
  function stopStream(): void {
    watcher?.abort()
    watcher = null
    streaming = false
  }

  async function watch(job: Job): Promise<void> {
    stopStream()
    jobId = job.id
    output = ''
    shownLines = 0
    totalLines = 0
    view = 'job'

    // A FINISHED JOB STILL HAS OUTPUT WORTH READING, and nothing to stream. Asking once is a shorter
    // path than opening a stream that will only send `done`.
    if (job.state === 'done' || job.state === 'failed' || job.state === 'killed') {
      try {
        const res = await client.getJobOutput({ session: SESSION, sandbox: sbName, jobId: job.id })
        output = res.lines.join('\n')
        totalLines = res.totalLines
        shownLines = res.lines.length
      } catch (e) {
        output = e instanceof Error ? e.message : String(e)
      }
      return
    }

    const ac = new AbortController()
    watcher = ac
    streaming = true
    try {
      const stream = client.watchJob({ session: SESSION, sandbox: sbName, jobId: job.id }, { signal: ac.signal })
      for await (const ev of stream) {
        switch (ev.event.case) {
          case 'output':
            output += ev.event.value + '\n'
            shownLines++
            break
          case 'done':
            output += `\n[finished, exit ${ev.event.value.exitCode}]\n`
            // The list shows the job's state, so refresh it now that it has changed.
            void refreshJobs()
            return
          case 'error':
            output += `\n[stream error: ${ev.event.value}]\n`
            return
        }
      }
    } catch (e) {
      // An abort is this panel's own doing, not a failure worth reporting.
      if (!ac.signal.aborted) output += `\n[stream failed: ${e instanceof Error ? e.message : String(e)}]\n`
    } finally {
      if (watcher === ac) {
        watcher = null
        streaming = false
      }
    }
  }

  /** Selects a machine, clearing everything that belonged to the previous one. */
  function select(name: string): void {
    if (name === sbName) return
    sbName = name
    jobId = ''
    jobs = []
    output = ''
    totalLines = 0
    shownLines = 0
    view = 'screen'
    stopStream()
    desktopURL = ''
    desktopError = ''
    if (name !== '') {
      void refreshJobs()
      void refreshDesktop(name)
    }
  }

  function openJob(job: Job): void {
    void watch(job)
  }

  onMount(() => {
    // The hash decided what opens: a result about one job should land ON it, not on a picker.
    void refreshList().then(() => {
      if (sbName !== '') {
        void refreshJobs()
        void refreshDesktop(sbName)
      }
    })
    const listTimer = setInterval(() => void refreshList(), LIST_MS)
    const jobTimer = setInterval(() => void refreshJobs(), JOBS_MS)
    return () => {
      clearInterval(listTimer)
      clearInterval(jobTimer)
      // A STREAM OUTLIVES THE PAGE OTHERWISE: the browser closes it when the document goes, which is
      // later than when the reader left — and the worker keeps sending until then.
      stopStream()
    }
  })

  const current = $derived(sandboxes.find(s => s.name === sbName) ?? null)
</script>

<div class="panel">
  <MachineRail {sandboxes} {sbName} {listError} onselect={select} />
  <JobRail {jobs} {sbName} {jobId} {jobError} onselect={openJob} />

  <main>
    {#if sbName === ''}
      <div class="state">Pick a machine.</div>
    {:else}
      {@render pane()}
    {/if}
  </main>
</div>

{#snippet pane()}
  {#if current?.screen === false}
    <!-- A HEADLESS MACHINE HAS NO SCREEN, and offering one would be a permanent spinner. The test is
         `screen` (a desktop is present), not `a11y` (a CLI is on PATH): those are different questions,
         and a Wayland box can have a screen and no xa11y. -->
    <ScreenPane {sbName} headless={true} os={current.os} url="" error="" />
  {:else if view === 'screen'}
    <ScreenPane {sbName} headless={false} os={current?.os ?? ''} url={desktopURL} error={desktopError} />
  {:else}
    <OutputPane {jobId} {output} {shownLines} {totalLines} {streaming} />
  {/if}
{/snippet}

<style>
  .panel {
    display: flex;
    height: 100%;
    min-height: 0;
  }

  main {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }

  .state {
    margin: auto;
    padding: 24px;
    color: var(--muted);
    text-align: center;
  }

  /* TWO RAILS BECOME ONE ON A NARROW PANEL, the way the console's own pages do. */
  @media (max-width: 720px) {
    .panel {
      flex-direction: column;
    }
  }
</style>
