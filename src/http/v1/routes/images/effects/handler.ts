import { isValidImageEffectId } from "~/effects/images/utils";
import type { RouteHandler } from "~/http/v1/routes/types";
import { json } from "~/shared/utils";

export const imageEffectsHandler: RouteHandler<"/v1/images/effects/:effectId"> = async (req) => {
	const { effectId } = req.params;

	if (req.method !== "POST") {
		return json({ success: false, message: "Method not allowed" }, { status: 405 });
	}

	if (!isValidImageEffectId(effectId)) {
		return json({ success: false, message: `Unknown image effect: ${effectId}` }, { status: 400 });
	}

	return json({ success: false, message: "Not implemented" }, { status: 501 });
};
