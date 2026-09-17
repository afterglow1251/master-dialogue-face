<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { SignIn } from "@clerk/vue";

const { t } = useI18n();
</script>

<template>
  <main
    class="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10"
  >
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_38%),radial-gradient(circle_at_bottom,_rgba(249,115,22,0.16),_transparent_32%)]"
    />

    <section
      class="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border/60 bg-background/90 shadow-2xl backdrop-blur md:grid-cols-[1.05fr_0.95fr]"
    >
      <div
        class="flex flex-col justify-between px-8 py-10 text-slate-50"
        style="background-color: #0a0a0a"
      >
        <div class="space-y-4">
          <p class="text-sm uppercase tracking-[0.28em] text-sky-300/80">
            {{ t("auth.signIn.title") }}
          </p>
          <h1 class="max-w-md text-4xl font-semibold tracking-tight">
            {{ t("auth.signIn.subtitle") }}
          </h1>
          <p class="max-w-md text-sm leading-6 text-slate-300">
            {{ t("auth.signIn.description") }}
          </p>
        </div>

        <div class="max-w-md space-y-2 text-sm leading-6 text-slate-300/90">
          <p>
            {{ t("auth.signIn.footer") }}
          </p>
        </div>
      </div>

      <div class="flex items-center justify-center px-6 py-8 md:px-8">
        <div class="w-full max-w-md">
          <SignIn
            path="/sign-in"
            routing="path"
            sign-up-url="/sign-up"
            force-redirect-url="/"
            fallback-redirect-url="/"
          />
        </div>
      </div>
    </section>
  </main>
</template>
