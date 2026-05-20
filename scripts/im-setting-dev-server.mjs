import { spawn } from 'node:child_process'

const port = '4310'
const baseUrl = `http://127.0.0.1:${port}`
const viteCommand =
  process.platform === 'win32'
    ? 'npm run dev -- --host 127.0.0.1 --port 4310 --strictPort'
    : 'npm run dev -- --host 127.0.0.1 --port 4310 --strictPort'

const child = spawn(viteCommand, {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
})

let ready = false
let warmupStarted = false

child.stdout.on('data', (chunk) => {
  const text = chunk.toString()
  process.stdout.write(text)
  if (!ready && text.includes('Local:')) {
    ready = true
    if (!warmupStarted) {
      warmupStarted = true
      void warmupModules()
    }
  }
})

child.stderr.on('data', (chunk) => {
  process.stderr.write(chunk.toString())
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(0)
  }
  process.exit(code ?? 0)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    child.kill(signal)
  })
}

async function warmupModules() {
  const targets = [
    '/',
    '/src/main.tsx',
    '/src/App.tsx',
    '/src/index.css',
    '/src/components/AppShell.tsx',
    '/src/pages/ImSettingPage.tsx',
    '/src/pages/ImSettingPage.css',
    '/src/services/imSetting.ts',
  ]

  for (const target of targets) {
    await requestWithRetry(`${baseUrl}${target}`)
  }

  console.log(`[im-setting-dev-server] warmup complete for ${targets.length} modules`)
}

async function requestWithRetry(url) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        await response.arrayBuffer()
        return
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  throw new Error(`Warmup request failed: ${url}`)
}
