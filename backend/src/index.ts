import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";

import { config } from "./config.ts";
import { restRoutes } from "./api/rest.ts";
import { wsRoutes } from "./api/websocket.ts";
import { loadTemplates } from "./services/blendshape-mapper.ts";
import { HttpError } from "./utils/errors.ts";

await loadTemplates();

const app = new Elysia()
  .use(cors())
  .use(
    openapi({
      documentation: {
        info: {
          title: "Facial Expression Generator API",
          description:
            "Backend API for generating facial expressions from dialogue emotional context",
          version: "1.0.0",
        },
      },
    }),
  )
  .onError(({ code, error, set }) => {
    if (error instanceof HttpError) {
      set.status = error.statusCode;
      return { error: error.message };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "Not found" };
    }

    if (code === "VALIDATION") {
      set.status = 422;
      return { error: error.message };
    }

    console.error("[unhandled]", error);
    set.status = 500;
    return { error: "Internal server error" };
  })
  .use(restRoutes)
  .use(wsRoutes)
  .listen(config.port);

console.log(`Backend running on ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
