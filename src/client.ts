// The typed client for this panel's API.
//
// THE CONTRACT IS A .PROTO SHARED WITH THE BACKEND. Before this the two sides agreed on field names
// by review, which is the arrangement that produced an empty file tree in another extension when one
// side emitted `Path` and the other read `path`.

import { createClient } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'

import { UiService } from './gen/ui/v1/ui_pb.js'

/** Where the API lives, derived from the mount so a rename of the Service cannot break it. */
const API_BASE = (() => {
  const p = location.pathname.replace(/\/+$/, '') // /ext/sandbox
  return `${p}/api`
})()

/** The session the console opened this panel for, when it supplied one. */
export const SESSION = new URLSearchParams(location.search).get('session') ?? ''

/**
 * THE BEARER, FROM localStorage.
 *
 * Same-origin with the console by construction — easyagent-ext-ui-host serves both — so the token the
 * console already stored is the one this panel sends. It never goes in a URL, never in a message
 * another window could read.
 */
function bearer(): string {
  try {
    return localStorage.getItem('agent.token') ?? ''
  } catch {
    return ''
  }
}

const transport = createConnectTransport({
  baseUrl: API_BASE,
  // READ AT CALL TIME: a re-login in the console changes the stored token, and a client that captured
  // it once would keep presenting the old one until the panel was reloaded.
  interceptors: [
    next => async req => {
      const tok = bearer()
      if (tok !== '') req.header.set('Authorization', `Bearer ${tok}`)
      return next(req)
    },
  ],
})

export const client = createClient(UiService, transport)
