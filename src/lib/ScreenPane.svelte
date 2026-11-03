<script lang="ts">
  // The machine's screen, and it is an IFRAME because the screen is already a product.
  //
  // WHAT WAS HERE BEFORE: a canvas fed by an H.264 WebSocket, decoded with WebCodecs. It drew frames
  // correctly and gave the reader nothing to do with them — no click, no key, no zoom. easystream-webui
  // has all of that, and the worker already serves it at /desktop/, so this embeds it.
  //
  // THE URL IS SIGNED AND SHORT-LIVED. An iframe navigation cannot carry an Authorization header, so
  // the permission travels in the URL instead — issued by AuthorizeDesktop after checking that the
  // machine belongs to the caller.
  let {
    sbName,
    headless,
    os,
    url,
    error,
  }: {
    sbName: string
    headless: boolean
    os: string
    url: string
    error: string
  } = $props()
</script>

<header>
  <span class="title">{sbName}</span>
</header>

<div class="body">
  {#if headless}
    <div class="state">
      {sbName} is headless{os ? ` (${os})` : ''}. There is no screen to show.
    </div>
  {:else if error !== ''}
    <div class="state err">{error}</div>
  {:else if url === ''}
    <div class="state">Connecting…</div>
  {:else}
    <!-- No sandbox attribute: the frame is same-origin by construction (the host proxies it), and a
         sandboxed frame could not use localStorage or WebCodecs — either of which would break the
         stream it exists to show. -->
    <iframe title="{sbName} screen" src={url}></iframe>
  {/if}
</div>

<style>
  header {
    display: flex;
    height: 40px;
    flex: 0 0 auto;
    align-items: center;
    border-bottom: 1px solid var(--border);
    padding: 0 10px;
  }

  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }

  .body {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  iframe {
    flex: 1;
    border: 0;
    background: #000;
  }

  .state {
    margin: auto;
    padding: 24px;
    color: var(--muted-foreground);
    text-align: center;
  }

  .state.err {
    color: var(--destructive);
  }
</style>
