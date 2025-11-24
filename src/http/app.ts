import openapi from "@elysiajs/openapi";
import { toJsonSchema } from "@valibot/to-json-schema";
import { Elysia } from "elysia";
import { v1Routes } from "~/http/v1/routes";

export const app = new Elysia()
	.use(
		openapi({
			mapJsonSchema: {
				valibot: toJsonSchema,
			},
		}),
	)
	.use(v1Routes)
	.get("/health", ({ status }) => status(200, "OK"))
	.onError(({ code, error, path, request, status }) => {
		if (code === "VALIDATION") {
			return status(422, {
				code: "VALIDATION_ERROR",
				message: error.message || "Validation failed",
			});
		}

		if (code === "NOT_FOUND") {
			return status(404, {
				code: "NOT_FOUND",
				message: "Route not found",
				details: { path, method: request.method },
			});
		}

		console.error(`[${path}]: Error =>`, error);
		return status(500, {
			code: typeof code === "string" ? code : "INTERNAL_SERVER_ERROR",
			message: error instanceof Error ? error.message : String(error),
			details: { path, method: request.method },
		});
	});

export type App = typeof app;
