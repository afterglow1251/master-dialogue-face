<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { computed } from "vue";
import { cn } from "@/lib/utils";
import {
  TabsRoot,
  useForwardPropsEmits,
  type TabsRootEmits,
  type TabsRootProps,
} from "reka-ui";

const props = defineProps<
  TabsRootProps & { class?: HTMLAttributes["class"] }
>();
const emits = defineEmits<TabsRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <TabsRoot
    data-slot="tabs"
    v-bind="forwarded"
    :class="cn('flex flex-col gap-2', props.class)"
  >
    <slot />
  </TabsRoot>
</template>
