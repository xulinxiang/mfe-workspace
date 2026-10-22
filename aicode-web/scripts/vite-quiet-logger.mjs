import { createLogger } from 'vite'

const ANSI = /\u001b\[[0-9;]*m/g

/** Vite/Rollup 噪音：产物清单、watch 提示、Network 行。启动只保留 Local / built / ready。 */
const DROP = [
  /building for production/i,
  /watching for file changes/i,
  /build started/i,
  /\bNetwork\b/,
  /computing gzip/i,
  /transforming/i,
  /rendering chunks/i,
  /modules transformed/i,
  /^\s*dist[\\/]/,
  /__federation_/,
  /\.(?:js|css|html|map|svg)\s+[\d.,]+\s+kB/i,
]

function shouldDrop(msg) {
  const text = String(msg).replace(ANSI, '')
  return !text.trim() || DROP.some((re) => re.test(text))
}

export function createQuietLogger() {
  const logger = createLogger()
  const origInfo = logger.info.bind(logger)
  const origWarn = logger.warn.bind(logger)
  logger.info = (msg, options) => {
    if (shouldDrop(msg)) return
    origInfo(msg, options)
  }
  logger.warn = (msg, options) => {
    const text = String(msg).replace(ANSI, '')
    if (/legacy-js-api|DEPRECATION WARNING/i.test(text)) return
    origWarn(msg, options)
  }
  return logger
}
