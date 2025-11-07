import { IMAGE_EFFECTS, type ImageEffectId } from "./types";

export const isValidImageEffectId = (effectId: string): effectId is ImageEffectId => {
	return effectId in IMAGE_EFFECTS;
};
