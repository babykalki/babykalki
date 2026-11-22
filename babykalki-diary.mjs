// babykalki-diary.mjs — the automatic diary (Library layer 1). v0.3, 18 Nov 2026 (unchanged since v0.2). MIT licence.
// Written by the HARNESS from session events, not by the agent: no model call on the write path.
// Append-only JSONL per citizen per month, in bk_chain.py's format (verify with `bk_chain.py verify-dir /data/diary`):
//   {"prev":"<64 hex>","hash":"<64 hex>","body":<event JSON>}   hash = sha256(prev + sha256(body bytes as stored))
// Status: logic tested with node 24 + a fake ctx (tests/test_diary.mjs). The dsh `session/event` hook and the
// session fields (cwd, id) are TO VERIFY on dsh 0.2.2-rc.3. (Verified on Nimbuz 18 Nov: the plugin row ACTIVATES as an
// absolute-path local row — no error; no session has run yet because no model key was set.)
import { appendFileSync, mkdirSync, openSync, closeSync, fsyncSync, readFileSync, existsSync, statSync, readSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'babykalki-diary'
const HERE = dirname(fileURLToPath(import.meta.url))
const ZERO = '0'.repeat(64)
const sha = (b) => createHash('sha256').update(b).digest('hex')

// ---- the ONE shared secret filter (same secret-patterns.json as bk_secrets.py) ----
export function loadScanner ({ patternsPath = join(HERE, 'secret-patterns.json'), hashesFile = '/run/bk/secret-hashes' } = {}) {
  const d = JSON.parse(readFileSync(patternsPath, 'utf8'))
  const pats = d.patterns.map((p) => [p.name, new RegExp(p.re, 'g')])
  const a = d.assignment
  const assign = new RegExp('(' + a.key_re + ')' + a.sep_re + '(' + a.value_re + ')', 'gi')
  const skip = new RegExp(a.value_skip_re ?? '(?!)')
  const minLen = d.min_exact_len ?? 12
  let hashes = new Set()
  try { hashes = new Set(readFileSync(hashesFile, 'utf8').split('\n').filter((l) => /^[0-9a-f]{64}$/.test(l))) } catch {}
  function find (text) {
    const hits = []
    if (hashes.size) {
      for (const m of text.matchAll(/[A-Za-z0-9_\-.:+/=~]{8,}/g)) {
        const tok = m[0]; const parts = [[tok, 0]]
        for (const sep of ['=', ':']) { let off = 0; for (const p of tok.split(sep)) { parts.push([p, off]); off += p.length + 1 } }
        for (const [p, off] of parts) {
          const s = p.replace(/[.,;:=]+$/, '')
          if (s.length >= minLen && hashes.has(sha(s))) hits.push(['exact-match', m.index + off, m.index + off + s.length])
        }
      }
    }
    for (const [n, re] of pats) for (const m of text.matchAll(re)) hits.push([n, m.index, m.index + m[0].length])
    for (const m of text.matchAll(assign)) {
      const v = m[2]
      if (/[A-Za-z]/.test(v) && /[0-9]/.test(v) && !skip.test(v)) { const s = m.index + m[0].length - v.length; hits.push(['key=value', s, s + v.length]) }
    }
    hits.sort((x, y) => x[1] - y[1] || y[2] - x[2])
    const out = []
    for (const h of hits) {
      const last = out[out.length - 1]
      if (last && h[1] < last[2]) { if (h[2] > last[2]) last[2] = h[2]; continue }
      out.push([...h])
    }
    return out
  }
  function redact (text) {
    let out = ''; let last = 0
    for (const [k, s, e] of find(text)) { out += text.slice(last, s) + `[SECRET:${k}:${sha(text.slice(s, e)).slice(0, 8)}]`; last = e }
    return out + text.slice(last)
  }
  return { find, redact }
}

function citizenOf (session) {
  // Each citizen works in /data/citizens/<name>/work; anything else goes to a quarantine diary (never dropped).
  const cwd = session?.cwd ?? session?.info?.cwd ?? ''
  const m = /\/citizens\/([a-z][a-z0-9_-]{0,31})(?:\/|$)/.exec(String(cwd))
  return m ? m[1] : '_unmapped'
}

function lastHash (file) {
  // hash of the last complete line; a torn tail is recorded by the next write (same rule as bk_chain.py)
  if (!existsSync(file)) return [ZERO, null]
  const size = statSync(file).size
  if (!size) return [ZERO, null]
  const len = Math.min(size, 1 << 20); const buf = Buffer.alloc(len)
  const fd = openSync(file, 'r'); readSync(fd, buf, 0, len, size - len); closeSync(fd)
  let text = buf.toString('latin1'); let torn = null
  if (!text.endsWith('\n')) { const cut = text.lastIndexOf('\n'); torn = buf.subarray(cut + 1); text = text.slice(0, cut + 1) }
  for (const line of text.trimEnd().split('\n').reverse()) {
    const m = /^\{"prev":"[0-9a-f]{64}","hash":"([0-9a-f]{64})","(?:body|tomb)":/.exec(line)
    if (m) return [m[1], torn]
  }
  return [ZERO, torn]
}

export function createDiary (config = {}) {
  const root = config.root ?? '/data/diary'
  const flushMs = config.flushMs ?? 250            // batch writes: one append (+ optional fsync) per batch, not per event
  const maxBatch = config.maxBatchBytes ?? 262144
  const maxEvent = config.maxEventBytes ?? 262144  // bigger events are kept as head + sha256 (the one non-verbatim case)
  const doFsync = config.fsync ?? false
  const scanner = config.scanner ?? loadScanner(config)
  const prevOf = new Map(); const pending = new Map(); let timer = null; let pendingBytes = 0

  function errorLog (err) {
    try { appendFileSync(join(root, 'DIARY-ERRORS.log'), `${new Date().toISOString()} ${scanner.redact(String(err?.stack ?? err)).slice(0, 2000)}\n`) } catch {}
  }

  function flush () {
    if (timer) { clearTimeout(timer); timer = null }
    for (const [file, chunks] of pending) {
      try {
        const fd = openSync(file, 'a')
        appendFileSync(fd, Buffer.concat(chunks))
        if (doFsync) fsyncSync(fd)
        closeSync(fd)
      } catch (err) { errorLog(err) }
    }
    pending.clear(); pendingBytes = 0
  }

  function push (file, line) {
    if (!pending.has(file)) pending.set(file, [])
    pending.get(file).push(line); pendingBytes += line.length
    if (pendingBytes >= maxBatch) flush()
    else if (!timer) { timer = setTimeout(flush, flushMs); timer.unref?.() }
  }

  function appendBody (file, obj) {
    if (!prevOf.has(file)) {
      mkdirSync(dirname(file), { recursive: true })
      const [h, torn] = lastHash(file)
      prevOf.set(file, h)
      if (torn) { push(file, Buffer.from('\n')); appendBody(file, { event: 'torn-tail-recovered', torn_sha256: sha(torn), torn_len: torn.length }) }
    }
    let body = scanner.redact(JSON.stringify(obj))
    if (Buffer.byteLength(body) > maxEvent) {
      body = JSON.stringify({ ...obj, data: undefined, truncated: true, original_bytes: Buffer.byteLength(body), original_sha256: sha(body), head: body.slice(0, 4096) })
    }
    const prev = prevOf.get(file)
    const hash = sha(prev + sha(Buffer.from(body, 'utf8')))
    push(file, Buffer.from(`{"prev":"${prev}","hash":"${hash}","body":${body}}\n`, 'utf8'))
    prevOf.set(file, hash)
  }

  function record (session, event) {
    try {   // must be quick and must NEVER throw into the agent loop
      const who = citizenOf(session)
      const file = join(root, who, `${new Date().toISOString().slice(0, 7)}.jsonl`)
      appendBody(file, { session: session?.id, type: event?.type, seq: event?.seq, time: event?.time ?? new Date().toISOString(), data: event?.data })
    } catch (err) { errorLog(err) }
  }

  return { record, flush }
}

export function apply (ctx, config = {}) {
  const diary = createDiary(config)
  ctx.on('session/event', (session, event) => diary.record(session, event), { global: true })
  // Last batch on exit. (No SIGTERM listener here: adding one would change dsh's own shutdown behaviour.)
  // A hard kill can lose at most flushMs (250 ms) of events — the price of not fsyncing every event.
  process.on('exit', () => diary.flush())
}
