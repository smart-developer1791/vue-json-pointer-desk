<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import sample from '../public/sample-workspace.json'
import StudioHeader from './components/StudioHeader.vue'
import DataTools from './components/DataTools.vue'
import AppDialog from './components/AppDialog.vue'
import PointerForm from './components/PointerForm.vue'
import PointerIndex from './components/PointerIndex.vue'
import {
  parse,
  serialize,
  parseDocument,
  resolve,
  enumerate,
  tokens,
  escapeToken,
  kind,
  selectionExport,
  csvExport,
  textExport,
} from './domain/pointer.ts'
import { useDraft } from './services/draft.ts'
import { download } from './services/files.ts'
const { draft, storageStatus } = useDraft('vue-json-pointer-desk:v1', parse(sample), parse),
  identity = computed(() => serialize(draft.value).provenance.marker),
  result = computed(() => resolve(draft.value.data, draft.value.pointer)),
  nodeCount = computed(() => enumerate(draft.value.data).length),
  title = ref(draft.value.name),
  pointer = ref(draft.value.pointer),
  source = ref(JSON.stringify(draft.value.data, null, 2)),
  error = ref(''),
  sourceError = ref(''),
  about = ref(false),
  selectedText = computed(() =>
    result.value.found ? JSON.stringify(result.value.value, null, 2) : 'No value selected.',
  )
watch(
  () => draft.value.name,
  () => {
    title.value = draft.value.name
  },
)
watch(
  () => draft.value.pointer,
  () => {
    pointer.value = draft.value.pointer
  },
)
watch(
  () => JSON.stringify(draft.value.data),
  () => {
    source.value = JSON.stringify(draft.value.data, null, 2)
    sourceError.value = ''
  },
)
function replace(value: unknown) {
  draft.value = parse(value)
  title.value = draft.value.name
  pointer.value = draft.value.pointer
  source.value = JSON.stringify(draft.value.data, null, 2)
  error.value = ''
  sourceError.value = ''
}
function applyPointer() {
  try {
    draft.value = parse({ ...draft.value, name: title.value, pointer: pointer.value })
    title.value = draft.value.name
    pointer.value = draft.value.pointer
    error.value = ''
  } catch (e) {
    error.value = (e as Error).message
  }
}
function go(next: string) {
  draft.value = parse({ ...draft.value, pointer: next })
  pointer.value = next
  error.value = ''
}
function root() {
  go('')
}
function parent() {
  go(
    tokens(draft.value.pointer)
      .slice(0, -1)
      .map((t) => '/' + escapeToken(t))
      .join(''),
  )
}
function applySource() {
  try {
    draft.value = parse({ ...draft.value, data: parseDocument(source.value) })
    source.value = JSON.stringify(draft.value.data, null, 2)
    sourceError.value = ''
  } catch (e) {
    sourceError.value = (e as Error).message
  }
}
function exportSelection() {
  download(identity.value + '-selection.json', selectionExport(draft.value))
}
function exportCsv() {
  download(identity.value + '-index.csv', csvExport(draft.value), 'text/csv;charset=utf-8')
}
function exportText() {
  download(identity.value + '-resolution.txt', textExport(draft.value), 'text/plain;charset=utf-8')
}
</script>
<template>
  <div data-project="vue-json-pointer-desk" class="min-h-screen">
    <StudioHeader title="JSON Pointer Desk" subtitle="Find a value. Keep its exact place" code="JP"
      ><DataTools
        :workspace="draft"
        :sample="sample"
        :parse="parse"
        :serialize="serialize"
        @replace="replace"
      /><button class="bg-surface hover:bg-soft" @click="about = true">About</button></StudioHeader
    >
    <main class="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8">
      <section class="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div class="min-w-0 max-w-2xl">
          <p class="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">
            ONE DOCUMENT, PRECISE ADDRESSES
          </p>
          <h1 class="break-words font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {{ draft.name }}
          </h1>
          <p class="mt-3 max-w-xl leading-relaxed text-muted">
            Follow a pointer through objects and arrays. Inspect each decoded token, keep the
            selected value, and export a complete map of the document.
          </p>
        </div>
        <div class="rounded-xl border border-line bg-surface px-4 py-3 text-right">
          <span class="block font-mono text-xs text-accent" data-ui="marker">{{ identity }}</span
          ><span class="mt-1 block text-xs text-muted" role="status">{{ storageStatus }}</span>
        </div>
      </section>
      <div
        data-ui="workspace"
        class="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]"
      >
        <section
          class="flex h-[1280px] min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface"
          data-ui="editor-panel"
        >
          <div class="border-b border-line p-5">
            <h2 class="text-lg font-semibold">A document and a precise address</h2>
            <p class="mt-1 text-xs text-muted">
              Bounded JSON · exact key spelling · read-only resolution
            </p>
          </div>
          <div class="min-h-0 flex-1 space-y-5 overflow-auto p-5">
            <PointerForm
              v-model:name="title"
              v-model:pointer="pointer"
              :error="error"
              :at-root="draft.pointer === ''"
              @apply="applyPointer"
              @root="root"
              @parent="parent"
            />
            <form
              @submit.prevent="applySource"
              novalidate
              class="border-t border-line pt-5"
              data-ui="document-form"
            >
              <label
                >Document JSON<textarea
                  v-model="source"
                  maxlength="120000"
                  rows="13"
                  spellcheck="false"
                  class="resize-none font-mono!"
                />
              </label>
              <p class="mt-3 text-xs leading-relaxed text-muted">
                Source up to 120,000 characters; canonical JSON up to 40,000. At most 400 values,
                depth 8, single-line keys up to 80 units, and string values up to 1,000 units.
              </p>
              <p role="alert" class="mt-3 min-h-14 text-xs text-danger">{{ sourceError }}</p>
              <button class="w-full bg-background text-accent hover:bg-soft">Apply document</button>
            </form>
            <div class="rounded-xl border border-line bg-soft p-4">
              <h3 class="font-semibold">A key is not an array index</h3>
              <p class="mt-3 text-xs leading-relaxed text-muted">
                Object keys match exactly. An empty key is addressed by /. In arrays, use 0 or a
                positive index without leading zeroes. The - token does not select an existing
                element.
              </p>
              <p class="mt-3 text-xs leading-relaxed text-muted">
                This desk accepts plain pointer strings, not URI fragments or JSONPath expressions.
                It reads values and never applies JSON Patch operations.
              </p>
            </div>
          </div>
        </section>
        <section
          class="flex h-[1280px] min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface"
          data-ui="preview-panel"
        >
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
            <div>
              <h2 class="text-lg font-semibold">The value at the end of the path</h2>
              <p class="mt-1 text-xs text-muted">Every token is resolved from the document root</p>
            </div>
            <span
              class="rounded-full px-3 py-1 text-xs font-semibold"
              :class="result.found ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'"
              data-ui="resolution-status"
              >{{ result.found ? 'Found' : 'Not found' }}</span
            >
          </div>
          <div class="min-h-0 flex-1 space-y-5 overflow-auto p-5">
            <div class="grid grid-cols-3 gap-2">
              <div
                v-for="(metric, i) in [
                  { name: 'JSON values', value: nodeCount },
                  { name: 'Tokens', value: tokens(draft.pointer).length },
                  { name: 'Selected type', value: result.found ? kind(result.value) : 'none' },
                ]"
                :key="metric.name"
                class="h-24 overflow-auto rounded-xl border border-line p-3"
              >
                <p class="text-[10px] uppercase text-muted">{{ metric.name }}</p>
                <p class="mt-2 break-all font-mono text-lg" :data-count="i">{{ metric.value }}</p>
              </div>
            </div>
            <div class="h-20 overflow-auto rounded-xl border border-line bg-soft p-4">
              <p class="text-[10px] uppercase text-muted">Saved pointer</p>
              <p class="mt-3 break-all font-mono text-xs" data-ui="saved-pointer">
                {{ JSON.stringify(draft.pointer) }}
              </p>
            </div>
            <div>
              <h3 class="font-semibold">Resolved steps</h3>
              <ol
                class="mt-3 h-32 space-y-2 overflow-auto rounded-xl border border-line p-3"
                data-ui="resolution-trace"
              >
                <li v-for="(step, i) in result.trace" :key="i" class="break-all font-mono text-xs">
                  {{ i }} · {{ JSON.stringify(step.token) }} → {{ JSON.stringify(step.pointer) }} ·
                  {{ step.type }}
                </li>
              </ol>
            </div>
            <p
              role="status"
              class="min-h-12 text-xs leading-relaxed text-muted"
              data-ui="resolution-message"
            >
              {{ result.found ? 'Selection is available as exact JSON.' : result.message }}
            </p>
            <div>
              <h3 class="font-semibold">Complete selected JSON</h3>
              <pre
                class="mt-3 h-60 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-line bg-background p-4 font-mono text-xs leading-relaxed"
                data-ui="selected-json"
                >{{ selectedText }}</pre>
            </div>
            <PointerIndex :data="draft.data" :pointer="draft.pointer" @select="go" />
            <p class="text-xs leading-relaxed text-muted">
              The index shows up to 200 values. Selection export and index CSV remain complete. A
              missing member is a visible unresolved result; malformed pointer syntax keeps the
              previous saved pointer.
            </p>
          </div>
          <div class="grid grid-cols-3 gap-2 border-t border-line p-4">
            <button
              @click="exportSelection"
              :disabled="!result.found"
              class="bg-background text-xs hover:bg-soft"
            >
              Selection JSON</button
            ><button @click="exportCsv" class="bg-background text-xs hover:bg-soft">
              Index CSV</button
            ><button @click="exportText" class="bg-background text-xs hover:bg-soft">
              Resolution TXT
            </button>
          </div>
        </section>
      </div>
      <footer
        class="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-muted"
      >
        <span>Made with Vue · Stored on this device</span><span>CodeSculptor · MIT · 2026</span>
      </footer>
    </main>
    <AppDialog v-model="about" title="About JSON Pointer Desk"
      ><div class="space-y-4 leading-relaxed text-muted">
        <p>
          A bounded JSON Pointer string inspector. A child form exposes typed named Vue models for
          pending name/pointer fields; validated source, resolution, and exports stay local.
        </p>
        <p>
          JSON keeps the editable workspace. Local storage stays on this browser; exports let you
          keep a copy elsewhere.
        </p>
        <a href="/sample-workspace.json" class="font-semibold text-accent underline" download
          >Download the complete sample</a
        >
      </div></AppDialog
    >
  </div>
</template>
