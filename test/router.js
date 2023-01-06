/* eslint-env mocha */

// sorry for the mess, there has to be a cleaner way

import makeDebug from 'debug'
import { expect } from 'chai'
import http from 'node:http'
import Koa from 'koa'
import Router from 'koa-router'
import WebSocket from 'ws'

import websocket from '../index.js'

const debug = makeDebug('koa-websocket:test')

const app = new Koa()
const router = new Router()

const server = http.createServer(app.callback())
let address // forgive my mutant heresy

app.use(websocket('ws', { server })).use(router.routes()).use(router.allowedMethods())

router.get('/pow/obi', async (ctx, next) => {
  if (ctx.ws) {
    const ws = await ctx.ws()
    ws.send('chancellor palpatine is evil')
  }
})

router.get('/pow/ani', async (ctx, next) => {
  if (ctx.ws) {
    const ws = await ctx.ws()
    ws.send('the jedi are evil')
    ws.send('404')
  }
})

describe('composing with router', function () {
  before(async () => {
    return new Promise((resolve, reject) => {
      debug("server started for test 'router'")
      server.listen()
      server.once('listening', () => {
        const serverAddress = server.address()
        address = `localhost:${serverAddress.port}`
        debug("server listening for test 'router'")
        resolve()
      })
    })
  })

  after(() => {
    debug("server closed for test 'router'")
    server.close()
  })

  it("should connect to handler at '/pow/obi'", async function () {
    await new Promise((resolve, reject) => {
      debug("running test 'router/obi'")
      const ws = new WebSocket(`ws://${address}/pow/obi`)

      ws.once('message', data => {
        expect(data.toString('utf8')).to.equal('chancellor palpatine is evil')
        ws.close()
        resolve()
      })
    })
  })

  it("should connect to handler at '/pow/ani'", async function () {
    await new Promise((resolve, reject) => {
      debug("running test 'router/ani'")
      const ws = new WebSocket(`ws://${address}/pow/ani`)

      ws.once('message', data => {
        expect(data.toString('utf8')).to.equal('the jedi are evil')
        ws.close()
        resolve()
      })
    })
  })
})
