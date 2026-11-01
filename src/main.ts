import { mount } from 'svelte'

import App from './App.svelte'
import './app.css'

// THEME, kept in step with the console.
//
// index.html applies `?theme=` before first paint; this listener covers a switch WHILE the panel is
// open. Without it a reader who toggles the console's theme keeps the old palette until a reload.
window.addEventListener('message', ev => {
  const d = ev.data as { type?: string; theme?: string } | null
  if (d?.type === 'easyagent:theme' && (d.theme === 'dark' || d.theme === 'light')) {
    document.documentElement.dataset['theme'] = d.theme
  }
})

const target = document.getElementById('app')
if (!target) throw new Error('#app is missing from index.html')

mount(App, { target })
