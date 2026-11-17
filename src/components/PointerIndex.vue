<script setup lang="ts">
import { computed } from 'vue'
import { enumerate, type Json } from '../domain/pointer.ts'
const props = defineProps<{ data: Json; pointer: string }>(),
  rows = computed(() => enumerate(props.data)),
  emit = defineEmits<{ select: [pointer: string] }>()
</script>
<template>
  <div data-ui="pointer-index">
    <p class="mb-3 text-xs text-muted">
      Showing {{ Math.min(rows.length, 200) }} of {{ rows.length }} indexed values
    </p>
    <div class="h-72 overflow-auto rounded-xl border border-line">
      <table class="w-full min-w-[700px] table-fixed border-collapse text-xs">
        <caption class="sr-only">
          Canonical JSON Pointer index; select a row to inspect the complete value
        </caption>
        <thead>
          <tr>
            <th scope="col" class="w-64 border-b border-line bg-background p-3 text-left">
              Pointer JSON string
            </th>
            <th scope="col" class="w-20 border-b border-line bg-background p-3 text-left">Type</th>
            <th scope="col" class="border-b border-line bg-background p-3 text-left">
              Value preview
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows.slice(0, 200)"
            :key="row.pointer"
            :data-index-pointer="row.pointer"
            :class="pointer === row.pointer ? 'bg-accent/10' : 'bg-white'"
          >
            <th scope="row" class="border-b border-line p-2 text-left">
              <button
                @click="emit('select', row.pointer)"
                :aria-label="
                  row.pointer
                    ? 'Inspect pointer ' + JSON.stringify(row.pointer)
                    : 'Inspect document root'
                "
                :aria-pressed="pointer === row.pointer"
                class="max-w-full break-all bg-background font-mono text-xs hover:bg-soft"
              >
                {{ JSON.stringify(row.pointer) }}
              </button>
            </th>
            <td class="border-b border-line p-3">{{ row.type }}</td>
            <td class="break-all border-b border-line p-3 font-mono">
              {{ JSON.stringify(row.value).slice(0, 120)
              }}{{ JSON.stringify(row.value).length > 120 ? '…' : '' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
