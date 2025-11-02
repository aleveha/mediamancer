import { IMAGE_EFFECTS_LIST, type ImageEffectId } from "./types";

export const isValidImageEffectId = (effectId: string): effectId is ImageEffectId => {
	return IMAGE_EFFECTS_LIST.includes(effectId);
};
