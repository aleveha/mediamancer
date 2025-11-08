import { describe, expect, test } from "bun:test";
import { IMAGE_EFFECTS } from "~/effects/images/types";
import { imageEffectsRoute } from "./controller";

describe("/v1/images/effects/:effectId", () => {
	test("fails and returns 422 with invalid effectId", async () => {
		const request = new Request("http://localhost/v1/images/effects/invalid", {
			method: "POST",
		});

		const response = await imageEffectsRoute.handle(request);

		expect(response.status).toBe(422);
	});

	test("fails and returns 404 for non-POST request", async () => {
		const request = new Request("http://localhost/v1/images/effects/triggered", {
			method: "GET",
		});

		const response = await imageEffectsRoute.handle(request);

		expect(response.status).toBe(404);
	});

	test("returns success for all valid effect IDs", async () => {
		for (const effectId of Object.keys(IMAGE_EFFECTS)) {
			const request = new Request(`http://localhost/v1/images/effects/${effectId}`, {
				method: "POST",
			});

			const response = await imageEffectsRoute.handle(request);

			expect(response.status).toBe(200);
		}
	});
});
