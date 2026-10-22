import { execSync } from 'node:child_process'

const ports = process.argv.slice(2).map(Number).filter((port) => port > 0)
if (ports.length === 0) {
  ports.push(5000, 5001, 5002)
}

function pidsOn(port) {
  try {
    return execSync(`lsof -nP -tiTCP:${port} -sTCP:LISTEN`, { encoding: 'utf8' })
      .trim()
      .split(/\s+/)
      .filter(Boolean)
  } catch {
    return []
  }
}

for (const port of ports) {
  for (const pid of pidsOn(port)) {
    try {
      process.kill(Number(pid), 'SIGKILL')
      console.log(`freed :${port} (pid ${pid})`)
    } catch {
      // already gone
    }
  }
}
