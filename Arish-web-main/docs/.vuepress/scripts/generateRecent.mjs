import fg from 'fast-glob'
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'

const ROOT = process.cwd()
const NOTES_GLOB = 'docs/notes/**/*.md'
const OUT_DIR = 'docs/.vuepress/public'
const OUT_FILE = 'recent.json'
const COUNT = parseInt(process.env.RECENT_COUNT || '6', 10)

function safeDateFrom(value) {
  if (!value) return null
  const s = String(value).trim().replace(/\//g, '-')
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return d
  return null
}

function toUrl(file) {
  // derive a reasonable URL fallback from file path
  // e.g. docs/notes/Internet/port.md -> /notes/Internet/port/
  let rel = file.replace(/\\/g, '/').split('/docs/')[1] || file
  rel = rel.replace(/\.md$/i, '')
  if (!rel.startsWith('/')) rel = '/' + rel
  if (!rel.endsWith('/')) rel = rel + '/'
  return rel
}

async function main() {
  const files = await fg(NOTES_GLOB, { dot: false })
  const items = []

  for (const f of files) {
    try {
      const content = await fs.readFile(f, 'utf8')
      const { data: fm } = matter(content)

      let date = null
      if (fm) {
        date = safeDateFrom(fm.createTime || fm.create_time || fm.date || fm.CreateTime)
      }

      if (!date) {
        const st = await fs.stat(f)
        date = new Date(st.mtimeMs)
      }

      const title = fm && (fm.title || fm.title === 0 ? fm.title : null) || path.basename(f).replace(/\.md$/i, '')
      const link = fm && fm.permalink ? fm.permalink : toUrl(f)

      items.push({ title, link, date: date.toISOString() })
    } catch (e) {
      // ignore individual file errors
      console.error('skip', f, e.message)
    }
  }

  items.sort((a, b) => new Date(b.date) - new Date(a.date))

  const out = items.slice(0, COUNT)

  await fs.mkdir(OUT_DIR, { recursive: true })
  await fs.writeFile(path.join(OUT_DIR, OUT_FILE), JSON.stringify(out, null, 2), 'utf8')
  console.log(`generated ${OUT_FILE} with ${out.length} items`)
}

main().catch((e) => { console.error(e); process.exit(1) })
