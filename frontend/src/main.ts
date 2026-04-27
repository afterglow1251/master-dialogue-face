import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import { clerkPlugin } from "@clerk/vue";

import App from "./App.vue";
import router from "./router";
import { env } from "./utils/env";
import { i18n } from "./lib/i18n";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(i18n);
app.use(clerkPlugin, { publishableKey: env.clerkPublishableKey });

app.mount("#app");
