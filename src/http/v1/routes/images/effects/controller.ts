import { Elysia } from "elysia";
import { literal, object, union } from "valibot";
import { IMAGE_EFFECTS_LIST } from "~/effects/images/types";

export const imageEffectsRoute = new Elysia({ prefix: "/v1/images/effects" }).post(
	"/:effectId",
	({ params }) => {
		const { effectId } = params;
		console.log("Effect ID:", effectId);
		return { success: false, message: "Not implemented" };
	},
	{
		params: object({
			effectId: union(IMAGE_EFFECTS_LIST.map((id) => literal(id))),
		}),
	},
);
