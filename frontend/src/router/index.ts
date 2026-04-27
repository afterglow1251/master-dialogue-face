import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/chat",
    },
    {
      path: "/chat",
      name: "chat",
      component: () => import("@/views/HomeView.vue"),
    },
    {
      path: "/chat/:chatId",
      name: "chat-detail",
      component: () => import("@/views/HomeView.vue"),
    },
    {
      path: "/sign-in",
      name: "sign-in",
      component: () => import("@/views/SignInView.vue"),
    },
    {
      path: "/sign-up",
      name: "sign-up",
      component: () => import("@/views/SignUpView.vue"),
    },
  ],
});

export default router;
