<script setup lang="ts">
import { LoaderCircle } from "lucide-vue-next";

defineProps<{
  label: string;
}>();
</script>

<template>
  <div
    class="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"
    role="status"
  >
    <LoaderCircle :size="16" class="animate-spin" />
    <span>{{ label }}</span>
  </div>
</template>
