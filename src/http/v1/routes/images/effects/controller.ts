import { Elysia } from "elysia";
import type { FormDataEntryValue } from "undici-types";
import { literal, object, union } from "valibot";
import { applyTriggeredEffect } from "~/effects/images";
import { IMAGE_EFFECTS_LIST, type ImageEffectId } from "~/effects/images/types";
import type { ErrorResponse } from "~/http/errors";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const FORM_FIELD_NAME = "image";
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type EffectHandler = (buffer: Buffer) => Promise<Buffer>;

const EFFECT_HANDLERS: Record<ImageEffectId, EffectHandler> = {
	triggered: applyTriggeredEffect,
};

const ERROR_CODES = {
	/* effect */
	INVALID_EFFECT_ID: "INVALID_EFFECT_ID",

	/* image */
	IMAGE_REQUIRED: "IMAGE_REQUIRED",
	IMAGE_EMPTY: "IMAGE_EMPTY",
	IMAGE_TOO_LARGE: "IMAGE_TOO_LARGE",
	IMAGE_INVALID_TYPE: "IMAGE_INVALID_TYPE",
	IMAGE_UNSUPPORTED_TYPE: "IMAGE_UNSUPPORTED_TYPE",
	IMAGE_PROCESSING_FAILED: "IMAGE_PROCESSING_FAILED",
} as const;

type ImageValidationResult = { success: true; file: File } | { success: false; error: ErrorResponse };

const validateImageFile = (file: FormDataEntryValue | null): ImageValidationResult => {
	if (!file || !(file instanceof File)) {
		return {
			success: false,
			error: {
				code: ERROR_CODES.IMAGE_REQUIRED,
				details: { fieldName: FORM_FIELD_NAME },
				message: "Image file is required",
			},
		};
	}

	if (file.size === 0) {
		return {
			success: false,
			error: {
				code: ERROR_CODES.IMAGE_EMPTY,
				details: { fieldName: FORM_FIELD_NAME },
				message: "Image file cannot be empty",
			},
		};
	}

	if (file.size > MAX_FILE_SIZE) {
		return {
			success: false,
			error: {
				code: ERROR_CODES.IMAGE_TOO_LARGE,
				details: {
					maxSize: MAX_FILE_SIZE,
					maxSizeMB: MAX_FILE_SIZE / 1024 / 1024,
					actualSize: file.size,
				},
				message: "Image file size exceeds the maximum allowed size",
			},
		};
	}

	if (!file.type.startsWith("image/")) {
		return {
			success: false,
			error: {
				code: ERROR_CODES.IMAGE_INVALID_TYPE,
				details: {
					supportedTypes: SUPPORTED_IMAGE_TYPES,
					receivedType: file.type,
				},
				message: "Image file is invalid",
			},
		};
	}

	if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
		return {
			success: false,
			error: {
				code: ERROR_CODES.IMAGE_UNSUPPORTED_TYPE,
				details: {
					supportedTypes: SUPPORTED_IMAGE_TYPES,
					receivedType: file.type,
				},
				message: "Image file is unsupported",
			},
		};
	}

	return { success: true, file };
};

const generateFilename = (effectId: ImageEffectId): string => {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 9);
	return `${effectId}-${timestamp}-${random}.jpg`;
};

export const routes = new Elysia({ prefix: "/effects" })
	.get("/", ({ status }) => status(200, { availableEffects: IMAGE_EFFECTS_LIST }))
	.post(
		"/:effectId",
		async ({ params, request, status }) => {
			const { effectId } = params;

			const formData = await request.formData();
			const imageFile = formData.get(FORM_FIELD_NAME);
			const validationResult = validateImageFile(imageFile);
			if (!validationResult.success) {
				return status(400, validationResult.error);
			}

			let processedImage: Buffer;
			try {
				processedImage = await EFFECT_HANDLERS[effectId](Buffer.from(await validationResult.file.arrayBuffer()));
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				console.error(`Error processing image with effect "${effectId}":`, errorMessage);
				return status(500, {
					code: ERROR_CODES.IMAGE_PROCESSING_FAILED,
					details: { effectId },
					message: errorMessage,
				});
			}

			return new Response(processedImage, {
				headers: {
					"Content-Type": "image/jpeg",
					"Content-Disposition": `inline; filename="${generateFilename(effectId)}"`,
					"Cache-Control": "no-cache",
				},
			});
		},
		{
			params: object({
				effectId: union(IMAGE_EFFECTS_LIST.map((id) => literal(id))),
			}),
			error: ({ code, error, status }) => {
				if (code === "VALIDATION") {
					return status(400, {
						code: ERROR_CODES.INVALID_EFFECT_ID,
						message: error.valueError?.message || error.customError || JSON.stringify(error),
					});
				}
			},
		},
	);
