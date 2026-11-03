<script lang="ts">
  // The machines this tenant configured.
  //
  // A MACHINE THAT IS DOWN IS SHOWN, not hidden: it is information, and hiding it makes the panel
  // look empty instead of broken.
  import type { Sandbox } from '../gen/ui/v1/ui_pb.js'

  let {
    sandboxes,
    sbName,
    listError,
    onselect,
  }: {
    sandboxes: Sandbox[]
    sbName: string
    listError: string
    onselect: (name: string) => void
  } = $props()

  /** "linux · linux-wayland", or "—" when the machine did not answer. */
  function subtitle(s: Sandbox): string {
    return [s.os, s.platform].filter(Boolean).join(' · ') || '—'
  }
</script>

<aside>
  {#if sandboxes.length === 0}
    <div class="state" class:err={listError !== ''}>
      {listError || 'No sandboxes configured.'}
    </div>
  {:else}
    {#each sandboxes as s (s.name)}
      <button
        type="button"
        class="row"
        class:active={s.name === sbName}
        onclick={() => onselect(s.name)}
      >
        <span class="name">{s.name}</span>
        <span class="micro muted">{subtitle(s)}</span>
        <span class="micro">
          {#if s.live}
            <span class="pill ok">live</span>
          {:else}
            <span class="pill bad" title={s.error}>down</span>
          {/if}
        </span>
      </button>
    {/each}
  {/if}
</aside>

<style>
  aside {
    display: flex;
    width: 200px;
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

  /* The console's own selected-row treatment: filled, because a thin outline is easy to miss in a
     narrow rail. */
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
