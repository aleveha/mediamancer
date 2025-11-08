import { Elysia } from "elysia";
import { imageEffectsRoute } from "~/http/v1/routes/images/effects";

export const app = new Elysia()
	.use(imageEffectsRoute)
	.get("/health", () => ({ success: true, message: "OK" }))
	.onError((data) => {
		console.error(
			"Global error handler: " +
				JSON.stringify(
					{
						method: data.request.method,
						path: data.path,
						code: data.code,
					},
					null,
					2,
				),
		);

		return {
			success: false,
			message: data.code,
		};
	});

export type App = typeof app;
