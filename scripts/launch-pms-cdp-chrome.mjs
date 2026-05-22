import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

const chromeExecutablePath =
  process.env.PMS_CHROME_PATH ?? 'C:/Users/Administrator/AppData/Local/Google/Chrome/Bin/chrome.exe'
const remoteDebuggingPort = Number(process.env.PMS_REMOTE_DEBUGGING_PORT ?? '9222')
const userDataDir = path.resolve(process.env.PMS_CHROME_USER_DATA_DIR ?? 'tmp/chrome-cdp-profile')
const startUrl = process.env.PMS_TARGET_URL ?? 'https://minsubao.localhome.cn/home'

function main() {
  if (!fs.existsSync(chromeExecutablePath)) {
    throw new Error(`Chrome executable not found: ${chromeExecutablePath}`)
  }

  fs.mkdirSync(userDataDir, { recursive: true })

  const args = [
    `--remote-debugging-port=${remoteDebuggingPort}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--new-window',
    startUrl,
  ]

  const child = spawn(chromeExecutablePath, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  })

  child.unref()

  console.log(
    JSON.stringify(
      {
        ok: true,
        pid: child.pid,
        chromeExecutablePath,
        remoteDebuggingPort,
        userDataDir,
        startUrl,
        nextStep: 'Complete the login manually, then run scripts/chrome-login-probe.mjs or scripts/refresh-pms-auth.mjs.',
      },
      null,
      2,
    ),
  )
}

main()
