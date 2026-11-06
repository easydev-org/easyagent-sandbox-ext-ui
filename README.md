# easyagent-sandbox-ext-ui

The sandbox extension's panel: the machines a tenant configured, their jobs, one job's output, and the
machine's live screen.

**A separate project, installed from a release.** The extension is a backend; `easyagent-ext-ui-host`
serves every panel at once, installing them from this repository's releases and answering the console's
discovery probe from their `ui.json`.

## The contract

`proto/ui/v1/ui.proto` defines the API. The Go backend generates its server from the same file, and
`src/gen/` here is generated from it — so a field the panel reads but the extension does not send is a
compile error rather than an empty list.

`proto/ui/v1/ui.proto` is a **copy** of the backend's. CI compares it, regenerates, and opens a pull
request when they differ.

| RPC                |                                                                              |
| ------------------ | ---------------------------------------------------------------------------- |
| `ListSandboxes`    | the tenant's machines, and whether each answered                             |
| `ListJobs`         | one machine's jobs — asked of the DAEMON, which is why old ones still appear |
| `GetJobOutput`     | one job's output, for a finished job                                         |
| `WatchJob`         | one job's output, **streamed** (this replaced Server-Sent Events)            |
| `AuthorizeDesktop` | a signed, short-lived URL for the screen                                     |

## The screen is an iframe, not a canvas

The panel used to decode H.264 itself with WebCodecs and paint a canvas. It drew frames correctly and
gave the reader nothing to do with them — no click, no key, no zoom.

`easystream-webui` has all of that, and the worker already serves it at `/desktop/`. So the panel asks
`AuthorizeDesktop` for a URL and embeds that.

**WHY THE URL IS SIGNED.** An iframe navigation cannot carry an `Authorization` header — the browser's
rule — so the permission has to travel in the URL. `AuthorizeDesktop` checks that the machine belongs
to the caller and returns an HMAC over (tenant, machine, expiry), which the extension's proxy verifies
before it forwards a byte. Links expire in five minutes.

## Development

```sh
npm install
npm run proto     # regenerate src/gen from the proto
npm run check     # svelte-check
npm run build     # emits dist/, which easyagent-ext-ui-host serves
```
