import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
const fixture = JSON.parse(
  await readFile(new URL('../../public/sample-workspace.json', import.meta.url), 'utf8'),
)
async function importData(page: Page, value: unknown) {
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.getByLabel('Workspace JSON', { exact: true }).fill(JSON.stringify(value))
  await page.getByRole('button', { name: 'Import workspace', exact: true }).click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)
}
async function deliver(page: Page, label: string) {
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: label, exact: true }).click()
  const file = await pending
  return { name: file.suggestedFilename(), buffer: await readFile((await file.path())!) }
}

test('typed named pointer models and index actions resolve escaped and empty keys and navigate parents exactly', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('[data-ui="selected-json"]')).toHaveText('"green"')
  await page.getByRole('button', { name: 'Inspect pointer "/label~1short"', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'JSON Pointer', exact: true })).toHaveValue(
    '/label~1short',
  )
  await expect(page.locator('[data-ui="selected-json"]')).toHaveText('"A/B"')
  await page.getByRole('button', { name: 'Inspect pointer "/~0note/"', exact: true }).click()
  await expect(page.locator('[data-ui="selected-json"]')).toHaveText(
    '"An empty key is still a key"',
  )
  await page.getByRole('button', { name: 'Select parent', exact: true }).click()
  await expect(page.locator('[data-ui="saved-pointer"]')).toHaveText('"/~0note"')
  await page.getByRole('button', { name: 'Select document root', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Select parent', exact: true })).toBeDisabled()
  const selected = JSON.parse((await deliver(page, 'Selection JSON')).buffer.toString('utf8'))
  expect(selected).toEqual(fixture.data)
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'JSON Pointer', exact: true })).toHaveValue('')
})
test('malformed pointers preserve saved work while missing array members remain explicit unresolved results and primitive roots work', async ({
  page,
}) => {
  await page.goto('/')
  const marker = await page.locator('[data-ui="marker"]').innerText()
  await page.getByRole('textbox', { name: 'JSON Pointer', exact: true }).fill('/~2')
  await page.getByRole('button', { name: 'Resolve pointer', exact: true }).click()
  await expect(page.locator('[data-ui="pointer-form"]').getByRole('alert')).toContainText(
    '~0 or ~1',
  )
  await expect(page.locator('[data-ui="marker"]')).toHaveText(marker)
  await page.getByRole('textbox', { name: 'JSON Pointer', exact: true }).fill('/shelf/01')
  await page.getByRole('button', { name: 'Resolve pointer', exact: true }).click()
  await expect(page.locator('[data-ui="resolution-status"]')).toHaveText('Not found')
  await expect(page.getByRole('button', { name: 'Selection JSON', exact: true })).toBeDisabled()
  await expect(page.locator('[data-ui="resolution-message"]')).toContainText('No array element')
  await page.getByRole('textbox', { name: 'Document JSON', exact: true }).fill('null')
  await page.getByRole('button', { name: 'Apply document', exact: true }).click()
  await page.getByRole('button', { name: 'Select document root', exact: true }).click()
  await expect(page.locator('[data-ui="selected-json"]')).toHaveText('null')
  await expect(page.locator('[data-count="2"]')).toHaveText('null')
  expect(JSON.parse((await deliver(page, 'Selection JSON')).buffer.toString('utf8'))).toBeNull()
})
test('separate document/pointer fields preserve pending edits and reject broken, oversized or unsafe numeric data atomically', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Workspace name', exact: true }).fill('Pending title')
  await page.getByRole('textbox', { name: 'Document JSON', exact: true }).fill('{"pending":true}')
  await page.getByRole('button', { name: 'Inspect pointer "/label~1short"', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Workspace name', exact: true })).toHaveValue(
    'Pending title',
  )
  await expect(page.getByRole('textbox', { name: 'Document JSON', exact: true })).toHaveValue(
    '{"pending":true}',
  )
  await page.getByRole('textbox', { name: 'JSON Pointer', exact: true }).fill('/other')
  await page.getByRole('button', { name: 'Apply document', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'JSON Pointer', exact: true })).toHaveValue(
    '/other',
  )
  const marker = await page.locator('[data-ui="marker"]').innerText()
  for (const source of ['{broken', '9007199254740993', JSON.stringify(Array(400).fill(0))]) {
    await page.getByRole('textbox', { name: 'Document JSON', exact: true }).fill(source)
    await page.getByRole('button', { name: 'Apply document', exact: true }).click()
    await expect(page.locator('[data-ui="document-form"]').getByRole('alert')).not.toHaveText('')
    await expect(page.locator('[data-ui="marker"]')).toHaveText(marker)
  }
  await importData(page, fixture)
  await expect(page.getByRole('textbox', { name: 'Workspace name', exact: true })).toHaveValue(
    fixture.name,
  )
  await expect(page.locator('[data-ui="selected-json"]')).toHaveText('"green"')
})
test('actual selected JSON is lossless and CSV/TXT safely retain complete escaped values and own prototype-looking members', async ({
  page,
}) => {
  await page.goto('/')
  const data = JSON.parse(
    '{"a/b":{"~key":[0,false,null,"<script>\\n\\u0000"]},"__proto__":{"own":true}}',
  )
  await importData(page, { ...fixture, data, pointer: '/a~1b/~0key/3' })
  const selected = await deliver(page, 'Selection JSON'),
    csv = await deliver(page, 'Index CSV'),
    txt = await deliver(page, 'Resolution TXT')
  expect(selected.name).toMatch(/^JP-[A-F0-9]{8}-selection\.json$/)
  expect(JSON.parse(selected.buffer.toString('utf8'))).toBe('<script>\n\u0000')
  expect(csv.buffer.includes(0)).toBe(false)
  expect(csv.buffer.toString('utf8')).toContain('\\u0000')
  expect(txt.buffer.toString('utf8')).toContain('SELECTED JSON\n"<script>\\n\\u0000"')
  expect(await page.evaluate(() => (Object.prototype as any).own)).toBeUndefined()
  const json = JSON.parse((await deliver(page, 'JSON')).buffer.toString('utf8'))
  expect(Object.hasOwn(json.data, '__proto__')).toBe(true)
  expect(json.trace).toBeUndefined()
  expect(json.selected).toBeUndefined()
})
