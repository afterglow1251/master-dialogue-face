<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { SignUp } from "@clerk/vue";

const { t } = useI18n();
</script>

<template>
  <main
    class="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10"
  >
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_36%),radial-gradient(circle_at_bottom,_rgba(234,88,12,0.12),_transparent_32%)]"
    />

    <section
      class="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border/60 bg-background/90 shadow-2xl backdrop-blur md:grid-cols-[0.95fr_1.05fr]"
    >
      <div
        class="flex items-center justify-center px-6 py-8 md:order-2 md:px-8"
      >
        <div class="w-full max-w-md">
          <SignUp
            path="/sign-up"
            routing="path"
            sign-in-url="/sign-in"
            force-redirect-url="/"
            fallback-redirect-url="/"
          />
        </div>
      </div>

      <div
        class="flex flex-col justify-between bg-stone-950 px-8 py-10 text-stone-50 md:order-1"
      >
        <div class="space-y-4">
          <p class="text-sm uppercase tracking-[0.28em] text-emerald-300/80">
            {{ t("auth.signUp.title") }}
          </p>
          <h1 class="max-w-md text-4xl font-semibold tracking-tight">
            {{ t("auth.signUp.subtitle") }}
          </h1>
          <p class="max-w-md text-sm leading-6 text-stone-300">
            {{ t("auth.signUp.description") }}
          </p>
        </div>

        <div class="max-w-md space-y-2 text-sm leading-6 text-stone-300/90">
          <p>
            {{ t("auth.signUp.footer") }}
          </p>
        </div>
      </div>
    </section>
  </main>
</template>
