/* eslint-env mocha */

import makeDebug from 'debug'
import { expect } from 'chai'
import { WebSocketServer } from 'ws'

import websocket from '../index.js'

const debug = makeDebug('koa-websocket:test')

// const app = new Koa()
const websocketMiddleware = websocket('ws', {
  noServerWorkaround: true, // required for testing on node 9 or earlier
  wsOptions: {
    clientTracking: false,
    maxPayload: 69420
  }
})
const websocketServer = websocketMiddleware.server // this is where the fun begins

describe('exposed server', () => {
  it('should be a ws server', () => {
    debug("running test 'exposed'")
    expect(websocketServer).to.be.instanceOf(WebSocketServer)
  })

  it('should be configurable', () => {
    debug('running test for wsOptions')
    expect(websocketServer.options.maxPayload).to.equal(69420)
    expect(websocketServer.options.clientTracking).to.be.false // eslint-disable-line no-unused-expressions
    expect(websocketServer.clients).to.not.exist // eslint-disable-line no-unused-expressions
  })
})
