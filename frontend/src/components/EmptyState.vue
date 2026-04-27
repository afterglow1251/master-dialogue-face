<script setup lang="ts">
import type { Component } from "vue";

defineProps<{
  icon: Component;
  message: string;
}>();
</script>

<template>
  <div
    class="flex flex-col items-center gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/50 px-6 py-8 text-muted-foreground dark:border-amber-900/30 dark:bg-amber-950/20"
  >
    <div
      class="flex size-12 items-center justify-center rounded-xl border border-amber-300/60 bg-amber-100/80 dark:border-amber-800/40 dark:bg-amber-900/30"
    >
      <component
        :is="icon"
        :size="22"
        class="text-amber-400 dark:text-amber-500"
      />
    </div>
    <span class="text-sm">{{ message }}</span>
  </div>
</template>
