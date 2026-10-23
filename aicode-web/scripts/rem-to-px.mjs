/**
 * One-off / maintenance: replace Nrem with px (16px base) in project SCSS.
 * Usage: node scripts/rem-to-px.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function remToPx(rem) {
  const px = rem * 16
  const rounded = Math.round(px * 1000) / 1000
  if (Number.isInteger(rounded)) return `${rounded}px`
  return `${rounded}px`.replace(/\.?0+px$/, 'px').replace(/(\.\d*?)0+px$/, '$1px')
}

function convertText(text) {
  return text.replace(/(-?\d*\.?\d+)rem\b/g, (_, num) => remToPx(parseFloat(num)))
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (/\.(scss|css)$/.test(name)) out.push(full)
  }
  return out
}

let changed = 0
for (const file of walk(root)) {
  const before = fs.readFileSync(file, 'utf8')
  const after = convertText(before)
  if (after !== before) {
    fs.writeFileSync(file, after)
    changed++
    console.log('updated', path.relative(root, file))
  }
}
console.log(`Done. ${changed} file(s) updated.`)
