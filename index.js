import makeDebug from 'debug'
import http from 'node:http'
import process from 'node:process'
import WebSocket from 'ws'

const debug = makeDebug('koa-easy-ws')

const serversPatched = new WeakSet()

function createWebsocketMiddleware (propertyName = 'ws', options) {
  if (!options) options = {}
  if (options instanceof http.Server) options = { server: options }

  if (parseInt(process.versions.node) < 10 && !options.noServerWorkaround) {
    // node 9 or earlier needs a workaround for upgrade requests
    if (!options.server) {
      throw new TypeError(
        `
        If you target Node 9 or earlier you must provide the HTTP server either as an option or as the second parameter.
        See the readme for more instructions: https://github.com/b3nsn0w/koa-easy-ws#special-usage-for-node-9-or-earlier
      `
          .trim()
          .split('\n')
          .map(s => s.trim())
          .join('\n')
      )
    } else {
      if (!serversPatched.has(options.server)) {
        serversPatched.add(options.server)
        options.server.on('upgrade', req => options.server.emit('request', req, new http.ServerResponse(req)))
        debug('added workaround to a server')
      }
    }
  }

  debug(`websocket middleware created with property name '${propertyName}'`)
  const wss = new WebSocket.Server({ ...options.wsOptions, noServer: true })

  const websocketMiddleware = async (ctx, next) => {
    debug(`websocket middleware called on route ${ctx.path}`)
    const upgradeHeader = (ctx.request.headers.upgrade || '').split(',').map(s => s.trim().toLowerCase())

    if (~upgradeHeader.indexOf('websocket')) {
      debug(`websocket middleware in use on route ${ctx.path}`)
      ctx[propertyName] = () =>
        new Promise(resolve => {
          wss.handleUpgrade(ctx.req, ctx.request.socket, Buffer.alloc(0), ws => {
            resolve(ws)
            wss.emit('connection', ws, ctx.req)
          })
          ctx.respond = false
        })
      if (options.exposeServerOn) ctx[options.exposeServerOn] = wss
    }

    await next()
  }

  websocketMiddleware.server = wss
  return websocketMiddleware
}

export default createWebsocketMiddleware
