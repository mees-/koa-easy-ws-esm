/* eslint-env mocha */

import makeDebug from 'debug'
import { expect } from 'chai'
import http from 'node:http'
import Koa from 'koa'
import WebSocket, { WebSocketServer } from 'ws'

import websocket from '../index.js'

const debug = makeDebug('koa-websocket:test')

const app = new Koa()

const server = http.createServer(app.callback())
let address // forgive my mutant heresy

app.use(websocket('ws', { server, exposeServerOn: 'wss' }))
app.use(async (ctx, next) => {
  if (ctx.ws) {
    const ws = await ctx.ws()

    return ws.send(ctx.wss instanceof WebSocketServer ? 'valid' : 'invalid')
  }

  ctx.body = 'websocket pls'
})

describe('exposed server in context', function () {
  before(async () => {
    return new Promise((resolve, reject) => {
      debug("server started for test 'exposed-in-context'")
      server.listen()
      server.once('listening', () => {
        const serverAddress = server.address()
        address = `localhost:${serverAddress.port}`
        debug("server listening for test 'exposed-in-context'")
        resolve()
      })
    })
  })

  after(() => {
    debug("server closed for test 'exposed-in-context'")
    server.close()
  })

  it('should verify the websocket server is exposed', async function () {
    await new Promise((resolve, reject) => {
      debug("running test 'exposed-in-context'")
      const ws = new WebSocket(`ws://${address}`)

      ws.on('message', data => {
        expect(data.toString('utf8')).to.equal('valid')
        ws.close()
        resolve()
      })
    })
  })
})
