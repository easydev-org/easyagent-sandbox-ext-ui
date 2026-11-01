# easyagent-sandbox-ext-ui

The sandbox extension's panel: machines, their jobs, and one job's output streaming live.

**A separate project, installed from a release.** The extension's Go binary no longer embeds a UI; it
is a backend, and `easyagent-ext-ui-host` serves every panel at once — installing them from this
repository's releases and answering the console's discovery probe from their `ui.json`.

## No build step, on purpose

`dist/` IS THE SOURCE. Four files — an HTML document, two ES modules, an icon — served as they are.
The panel lists machines, lists their jobs, and streams one job's output over SSE; a bundler would be
more moving parts than the feature, and the extension already made that call before this repository
existed.

That is why the release is a tarball of `dist/` rather than a build product: what is in git is what
ships.

## The contract

`dist/ui.json` is what the console reads to describe the panel — title, per-language descriptions,
icon path. It lives HERE rather than in the extension's Go code, so a wording change is a panel
release and not a backend deploy.

`app.js` derives its API base from where it is mounted:

```js
const p = location.pathname.replace(/\/+$/, '')   // /ext/sandbox
const API = `${p}/api/`                            // /ext/sandbox/api/
```

That is what makes the panel work under `ext-ui-host` without knowing it: the host serves
`/ext/sandbox/` from this bundle and forwards `/ext/sandbox/api/` to the extension.

## Releasing

Tag it. CI packs `dist/` into `ui.tar.gz` and attaches it to the release; `ext-ui-host` installs that.

```sh
git tag -a v0.1.0 -m "v0.1.0: the sandbox panel"
git push origin v0.1.0
```
