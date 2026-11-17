import { record } from './validation.ts'
import { single, provenance } from './shared.ts'
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
export interface Workspace {
  version: 1
  name: string
  data: Json
  pointer: string
}
export function tokens(value: unknown) {
  const pointer = single(value, 'JSON Pointer', 1024, true)
  if (pointer !== '' && !pointer.startsWith('/'))
    throw new Error('JSON Pointer must be empty or begin with /.')
  if (/~(?:[^01]|$)/.test(pointer)) throw new Error('Pointer escapes must be ~0 or ~1.')
  return pointer === ''
    ? []
    : pointer
        .slice(1)
        .split('/')
        .map((t) => t.replaceAll('~1', '/').replaceAll('~0', '~'))
}
export const escapeToken = (s: string) => s.replaceAll('~', '~0').replaceAll('/', '~1')
export function jsonValue(value: unknown): Json {
  let count = 0
  const visiting = new Set<object>()
  function walk(v: unknown, depth: number): Json {
    if (++count > 400) throw new Error('Document exceeds 400 JSON nodes.')
    if (depth > 8) throw new Error('Document exceeds depth 8.')
    if (v === null || typeof v === 'boolean') return v
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) throw new Error('JSON numbers must be finite.')
      if (Number.isInteger(v) && !Number.isSafeInteger(v))
        throw new Error('JSON integers must be safe JavaScript integers.')
      return v
    }
    if (typeof v === 'string') {
      if (v.length > 1000) throw new Error('JSON string values are limited to 1,000 UTF-16 units.')
      return v
    }
    if (typeof v !== 'object' || !v) throw new Error('Document must contain only JSON values.')
    if (visiting.has(v)) throw new Error('Document must not contain cycles.')
    visiting.add(v)
    let result: Json
    if (Array.isArray(v)) result = Array.from(v, (item) => walk(item, depth + 1))
    else {
      if (![Object.prototype, null].includes(Object.getPrototypeOf(v)))
        throw new Error('Document needs plain JSON objects.')
      result = Object.fromEntries(
        Object.entries(v).map(([key, child]) => [
          single(key, 'Object key', 80, true),
          walk(child, depth + 1),
        ]),
      )
    }
    visiting.delete(v)
    return result
  }
  const result = walk(value, 0)
  if (JSON.stringify(result).length > 40000)
    throw new Error('Canonical document exceeds 40,000 characters.')
  return result
}
export function parse(value: unknown): Workspace {
  const w = record(value, 'Workspace')
  if (w.version !== 1) throw new Error('Workspace version must be 1.')
  tokens(w.pointer)
  return {
    version: 1,
    name: single(w.name, 'Workspace name', 80),
    data: jsonValue(w.data),
    pointer: w.pointer as string,
  }
}
export function serialize(value: unknown) {
  const w = parse(value)
  return { ...w, provenance: provenance('JP', 'vue-json-pointer-desk', w) }
}
export const kind = (v: Json) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v)
export interface Trace {
  token: string
  pointer: string
  type: string
}
export function resolve(
  data: Json,
  pointer: string,
):
  { found: true; value: Json; trace: Trace[] } | { found: false; message: string; trace: Trace[] } {
  const decoded = tokens(pointer),
    trace: Trace[] = [{ token: '(root)', pointer: '', type: kind(data) }]
  let current = data,
    path = ''
  for (const [index, token] of decoded.entries()) {
    if (Array.isArray(current)) {
      if (!/^(0|[1-9]\d*)$/.test(token) || Number(token) >= current.length)
        return {
          found: false,
          message:
            'No array element for token ' + JSON.stringify(token) + ' at step ' + (index + 1) + '.',
          trace,
        }
      current = current[Number(token)]!
    } else if (current !== null && typeof current === 'object' && Object.hasOwn(current, token))
      current = current[token]!
    else
      return {
        found: false,
        message: 'No member for token ' + JSON.stringify(token) + ' at step ' + (index + 1) + '.',
        trace,
      }
    path += '/' + escapeToken(token)
    trace.push({ token, pointer: path, type: kind(current) })
  }
  return { found: true, value: current, trace }
}
export function enumerate(data: Json) {
  const rows: { pointer: string; type: string; value: Json }[] = []
  function visit(value: Json, pointer: string) {
    rows.push({ pointer, type: kind(value), value })
    if (value !== null && typeof value === 'object')
      for (const [key, child] of Object.entries(value))
        visit(child, pointer + '/' + escapeToken(key))
  }
  visit(data, '')
  return rows
}
export function parseDocument(source: string) {
  if (source.length > 120000) throw new Error('Document source exceeds 120,000 characters.')
  return jsonValue(JSON.parse(source))
}
const quote = (s: string) => '"' + s.replaceAll('"', '""') + '"'
export function csvExport(value: Workspace) {
  const w = parse(value),
    marker = serialize(w).provenance.marker
  return (
    'pointer_json,type,value_json,marker\r\n' +
    enumerate(w.data)
      .map((r) =>
        [quote(JSON.stringify(r.pointer)), r.type, quote(JSON.stringify(r.value)), marker].join(
          ',',
        ),
      )
      .join('\r\n') +
    '\r\n'
  )
}
export function selectionExport(value: Workspace) {
  const w = parse(value),
    r = resolve(w.data, w.pointer)
  if (!r.found) throw new Error('Resolve an existing value before exporting the selection.')
  return JSON.stringify(r.value, null, 2) + '\n'
}
export function textExport(value: Workspace) {
  const w = parse(value),
    r = resolve(w.data, w.pointer)
  return (
    w.name +
    '\n' +
    serialize(w).provenance.marker +
    ' · CodeSculptor\nPointer: ' +
    JSON.stringify(w.pointer) +
    '\nNodes: ' +
    enumerate(w.data).length +
    '\nResult: ' +
    (r.found ? kind(r.value) : 'not found') +
    '\n\nRESOLVED STEPS\n' +
    r.trace
      .map(
        (s, i) =>
          i +
          '. ' +
          JSON.stringify(s.token) +
          ' -> ' +
          JSON.stringify(s.pointer) +
          ' [' +
          s.type +
          ']',
      )
      .join('\n') +
    '\n\n' +
    (r.found ? 'SELECTED JSON\n' + selectionExport(w) : r.message + '\n')
  )
}
