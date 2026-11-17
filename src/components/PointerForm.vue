<script setup lang="ts">
const name = defineModel<string>('name', { required: true }),
  pointer = defineModel<string>('pointer', { required: true })
defineProps<{ error: string; atRoot: boolean }>()
const emit = defineEmits<{ apply: []; root: []; parent: [] }>()
</script>
<template>
  <form @submit.prevent="emit('apply')" novalidate data-ui="pointer-form">
    <label>Workspace name<input v-model="name" maxlength="80" /></label
    ><label class="mt-4"
      >JSON Pointer<input
        v-model="pointer"
        maxlength="1024"
        spellcheck="false"
        placeholder="/shelf/0/title"
        class="font-mono!"
    /></label>
    <p class="mt-3 text-xs leading-relaxed text-muted">
      An empty pointer selects the whole document. Escape / as ~1 and ~ as ~0 inside keys. Array
      indices are zero-based.
    </p>
    <p role="alert" class="mt-3 min-h-14 text-xs text-danger">{{ error }}</p>
    <button class="w-full border-accent! bg-accent text-on-accent hover:brightness-110">
      Resolve pointer
    </button>
    <div class="mt-3 grid grid-cols-2 gap-2">
      <button type="button" @click="emit('root')" class="bg-background text-xs hover:bg-soft">
        Select document root</button
      ><button
        type="button"
        @click="emit('parent')"
        :disabled="atRoot"
        class="bg-background text-xs hover:bg-soft"
      >
        Select parent
      </button>
    </div>
  </form>
</template>
