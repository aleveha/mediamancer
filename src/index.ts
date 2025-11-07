import { imageEffectsController } from "~/http/v1/routes/images/effects";
import { json } from "~/shared/utils";

const server = Bun.serve({
	routes: {
		"/health": () => json({ success: true, message: "OK" }, { status: 200 }),

		"/v1/images/effects/:effectId": imageEffectsController,
	},
	fetch: () => {
		return json({ success: false, message: "Not Found" }, { status: 404 });
	},
	error: (error) => {
		console.error(error);
		return json({ success: false, message: "Internal Server Error" }, { status: 500 });
	},
});

console.log(`Server running at ${server.url}`);
