<script lang="ts">
  // One job's output, live.
  //
  // THE NEWEST LINE STAYS IN VIEW, which is what a reader watching a live stream expects. Done with an
  // effect rather than in the render body: the element has to exist, and the scroll has to happen after
  // the text is in it.
  let {
    jobId,
    output,
    shownLines,
    totalLines,
    streaming,
  }: {
    jobId: string
    output: string
    shownLines: number
    totalLines: number
    streaming: boolean
  } = $props()

  let term: HTMLPreElement | null = $state(null)

  $effect(() => {
    // READ `output` SO THIS RE-RUNS ON EVERY CHUNK.
    void output
    if (term) term.scrollTop = term.scrollHeight
  })
</script>

<header>
  <span class="title mono micro">{jobId}</span>
  {#if totalLines > 0}
    <span class="micro muted">{shownLines}/{totalLines} lines</span>
  {/if}
  {#if streaming}
    <span class="pill run">streaming</span>
  {/if}
</header>

<pre bind:this={term} class="term">{output === '' ? 'waiting for output…' : output}</pre>

<style>
  header {
    display: flex;
    height: 40px;
    flex: 0 0 auto;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid var(--border);
    padding: 0 10px;
  }

  .title {
    overflow: hidden;
    flex: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* A TERMINAL IS DARK IN BOTH THEMES: that is what a terminal looks like, and coloured output
     assumes a dark background. */
  .term {
    flex: 1;
    min-height: 0;
    overflow: auto;
    margin: 0;
    padding: 10px;
    background: var(--term);
    color: var(--term-fg);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    line-height: 1.45;
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
