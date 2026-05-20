import { createReadStream, existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const root = process.argv[2]
const port = Number(process.argv[3] ?? 4190)

if (!root) {
  throw new Error('Missing root directory')
}

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

createServer((request, response) => {
  const requestPath = request.url ? request.url.split('?')[0] : '/'
  const safePath = normalize(requestPath).replace(/^(\.\.[/\\])+/, '')
  const filePath = join(root, safePath === '/' ? 'index.html' : safePath)

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    response.writeHead(200, {
      'content-type': mimeTypes[extname(filePath)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    })
    createReadStream(filePath).pipe(response)
    return
  }

  readFile(join(root, 'index.html'))
    .then((indexHtml) => {
      response.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      })
      response.end(indexHtml)
    })
    .catch((error) => {
      response.writeHead(500, {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
      })
      response.end(`failed to read index.html: ${error instanceof Error ? error.message : String(error)}`)
    })
}).listen(port, '127.0.0.1', () => {
  console.log(`ready:${port}`)
})
