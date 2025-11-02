export const IMAGE_EFFECTS = {
	triggered: {
		title: "Triggered",
	},
} as const;

export const IMAGE_EFFECTS_LIST = Object.keys(IMAGE_EFFECTS);

export type ImageEffectId = keyof typeof IMAGE_EFFECTS;
export type ImageEffect = (typeof IMAGE_EFFECTS)[ImageEffectId];
