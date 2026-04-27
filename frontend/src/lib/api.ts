import { treaty } from "@elysiajs/eden";
import type { App } from "@backend/index.ts";
import { env } from "@/utils/env";
import { useAuth } from "@clerk/vue";

export function useApi() {
  const { getToken } = useAuth();

  return treaty<App>(env.apiBaseUrl, {
    async headers() {
      const token = await getToken.value();
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
      return {};
    },
  });
}
