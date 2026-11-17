import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const fixture = JSON.parse(
  readFileSync(new URL('../public/sample-workspace.json', import.meta.url), 'utf8'),
)

import {
  parse,
  serialize,
  tokens,
  escapeToken,
  jsonValue,
  parseDocument,
  resolve,
  enumerate,
  selectionExport,
  csvExport,
  textExport,
} from '../src/domain/pointer.ts'
test('canonical sample resolves exact object/array values and reconstructs every indexed pointer', () => {
  const w = parse(fixture)
  assert.deepEqual(serialize(w), fixture)
  const r = resolve(w.data, w.pointer)
  assert.equal(r.found, true)
  if (r.found) {
    assert.equal(r.value, 'green')
    assert.deepEqual(
      r.trace.map((s) => s.token),
      ['(root)', 'shelf', '0', 'tags', '1'],
    )
  }
  for (const row of enumerate(w.data)) {
    const result = resolve(w.data, row.pointer)
    assert.equal(result.found, true)
    if (result.found) assert.deepEqual(result.value, row.value)
  }
})
test('plain JSON Pointer examples handle empty, slash, tilde, backslash, quotes and escape decoding order', () => {
  const data = jsonValue({
    foo: ['bar', 'baz'],
    '': 0,
    'a/b': 1,
    'c%d': 2,
    'e^f': 3,
    'g|h': 4,
    'i\\j': 5,
    'k"l': 6,
    ' ': 7,
    'm~n': 8,
    '~1': 9,
  })
  for (const [pointer, value] of [
    ['/foo/0', 'bar'],
    ['/', 0],
    ['/a~1b', 1],
    ['/c%d', 2],
    ['/e^f', 3],
    ['/g|h', 4],
    ['/i\\j', 5],
    ['/k"l', 6],
    ['/ ', 7],
    ['/m~0n', 8],
    ['/~01', 9],
  ] as const) {
    const r = resolve(data, pointer)
    assert.equal(r.found, true)
    if (r.found) assert.equal(r.value, value)
  }
  assert.deepEqual(tokens('/~01'), ['~1'])
  assert.equal(escapeToken('~/'), '~0~1')
  const root = resolve(data, '')
  assert.equal(root.found, true)
  if (root.found) assert.deepEqual(root.value, data)
})
test('array canonical indices, missing/scalar values and prototype-looking keys follow concrete own-member lookup', () => {
  for (const pointer of ['/foo/01', '/foo/-', '/foo/2', '/foo/-1', '/foo/0/x', '/toString'])
    assert.equal(resolve(jsonValue({ foo: ['bar', 'baz'] }), pointer).found, false)
  const object = jsonValue(JSON.parse('{"__proto__":{"x":1},"constructor":"own","01":3}'))
  assert.equal(Object.hasOwn(object!, '__proto__'), true)
  const r = resolve(object, '/__proto__/x')
  assert.equal(r.found, true)
  if (r.found) assert.equal(r.value, 1)
  const own = resolve(object, '/constructor')
  assert.equal(own.found, true)
  if (own.found) assert.equal(own.value, 'own')
  assert.equal(({} as any).x, undefined)
  assert.equal(resolve(jsonValue({}), '/constructor').found, false)
})
test('strict document limits reject unsupported values, cycles, unsafe numbers, deep/large data and malformed pointer syntax', () => {
  for (const value of [
    undefined,
    NaN,
    Infinity,
    9007199254740992,
    new Date(),
    new Array(2),
    'a'.repeat(1001),
    Array(400).fill(0),
    { ['a'.repeat(81)]: 0 },
  ])
    assert.throws(() => jsonValue(value))
  let deep: any = 0
  for (let i = 0; i < 9; i++) deep = { x: deep }
  assert.throws(() => jsonValue(deep))
  const cyclic: any = {}
  cyclic.x = cyclic
  assert.throws(() => jsonValue(cyclic))
  assert.throws(() => jsonValue(Array(41).fill('a'.repeat(1000))))
  for (const pointer of ['a', '#/foo', '/~2', '/~', '/x\n']) assert.throws(() => tokens(pointer))
  assert.throws(() => parseDocument(' '.repeat(120001)))
  assert.throws(() => parse({ ...fixture, version: 2 }))
  assert.equal(jsonValue(null), null)
})
test('full 400-value CSV and selected JSON preserve escaped controls and values beyond the 200-row view', () => {
  const data = Array.from({ length: 399 }, (_, i) => (i === 398 ? '\u0000\n"=SUM(1,2)' : i)),
    w = parse({ ...fixture, data, pointer: '/398' }),
    csv = csvExport(w)
  assert.equal(enumerate(w.data).length, 400)
  assert.equal(csv.trim().split('\r\n').length, 401)
  assert.equal(csv.includes('\u0000'), false)
  assert.ok(csv.includes('\\u0000'))
  assert.equal(JSON.parse(selectionExport(w)), data[398])
  assert.ok(textExport(w).includes('Nodes: 400'))
  assert.throws(() => selectionExport({ ...w, pointer: '/399' }))
})
test('canonical workspace rebuilds detached JSON data, preserves primitive roots and stamps UTF-8 rather than surrogate prefixes', () => {
  for (const data of [null, false, 0, '', []]) {
    const w = parse({ ...fixture, data, pointer: '' })
    assert.deepEqual(JSON.parse(selectionExport(w)), data)
    assert.deepEqual(parse(serialize(w)), w)
  }
  const source = structuredClone(fixture),
    w = parse(source)
  source.data.shelf[0].title = 'Changed'
  assert.notEqual((w.data as any).shelf[0].title, 'Changed')
  assert.notEqual(
    serialize({ ...w, name: '🙂' }).provenance.marker,
    serialize({ ...w, name: '🙃' }).provenance.marker,
  )
})
