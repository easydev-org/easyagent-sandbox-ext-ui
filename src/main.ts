import { mount } from 'svelte'

import App from './App.svelte'
// The shared palette first, then this panel's own additions — which override nothing but the terminal
// colours and the mount point.
import '@easydev-org/ext-ui/styles'
import './app.css'
import { connectToHost } from '@easydev-org/ext-ui'

/**
 * THE THEME, FROM THE CONTRACT RATHER THAN BY HAND.
 *
 * This used to be a bare `window.addEventListener` on `easyagent:theme` with the message name spelled
 * out — a second copy of a contract that lives in `@easydev-org/ext-ui`, in a repository whose CI could
 * not see the first one. A rename would have broken this panel silently: the listener stops matching,
 * and a panel that keeps its loaded palette looks like a styling choice rather than a bug.
 *
 * `connectToHost` also ANNOUNCES READINESS, which the hand-written version did not. Nothing broke,
 * because the console broadcasts to every frame on every change — but that is the console's current
 * behaviour, not a promise, and a panel that depends on it stops working the day the console sends only
 * to frames that said they were ready.
 */
connectToHost()

const target = document.getElementById('app')
if (!target) throw new Error('#app is missing from index.html')

mount(App, { target })
