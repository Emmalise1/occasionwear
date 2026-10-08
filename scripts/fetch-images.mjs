#!/usr/bin/env node
/**
 * Regenerates the OccasionWear HERO image from Unsplash.
 *
 * IMPORTANT: the outfit catalogue photography in frontend/public/images is
 * user-supplied (locally provided files, renamed to kebab-case). This script
 * deliberately does NOT manage those files so it can never overwrite or
 * replace real catalog images.
 *
 * Run from the occasionwear/ root:  node scripts/fetch-images.mjs [--force]
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const OUT_DIR = path.resolve('frontend/public/images')
const FORCE = process.argv.includes('--force')

const ASSETS = [
  { file: 'hero.jpg', query: 'woman elegant evening gown fashion editorial', prefer: ['gown', 'dress', 'fashion'] },
]

async function search(query) {
  const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=12`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`search failed ${res.status} for ${query}`)
  const data = await res.json()
  if (!data.results?.length) throw new Error(`no results for ${query}`)
  return data.results
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': 'occasionwear-seed/1.0' } })
  if (!res.ok) throw new Error(`download failed ${res.status}: ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 15000) throw new Error(`image too small (${buf.length}B): ${url}`)
  await writeFile(dest, buf)
  return buf.length
}

await mkdir(OUT_DIR, { recursive: true })

let ok = 0
const failed = []
for (const asset of ASSETS) {
  const dest = path.join(OUT_DIR, asset.file)
  if (!FORCE && existsSync(dest)) {
    console.log(`skip  ${asset.file} (exists)`)
    ok++
    continue
  }
  try {
    const results = await search(asset.query)
    const keywords = asset.prefer ?? []
    const ranked = [
      ...results.filter((r) => keywords.some((k) => (r.alt_description ?? '').toLowerCase().includes(k))),
      ...results.filter((r) => !keywords.some((k) => (r.alt_description ?? '').toLowerCase().includes(k))),
    ]
    let done = false
    for (const r of ranked.slice(0, 6)) {
      try {
        const url = `${r.urls.raw}&w=900&q=80&fm=jpg&fit=max`
        const size = await download(url, dest)
        console.log(`ok    ${asset.file}  (${Math.round(size / 1024)} KB)  ← "${r.alt_description ?? asset.query}"`)
        done = true
        ok++
        break
      } catch (e) {
        console.warn(`  retry ${asset.file}: ${e.message}`)
      }
    }
    if (!done) throw new Error('all candidates failed')
  } catch (e) {
    failed.push(asset.file)
    console.error(`FAIL  ${asset.file}: ${e.message}`)
  }
}
console.log(`\n${ok}/${ASSETS.length} managed image(s) ready. Catalog imagery is user-supplied and untouched.`)
if (failed.length) {
  console.error('Failed: ' + failed.join(', '))
  process.exit(1)
}
