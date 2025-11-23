import { describe, expect, test } from "bun:test";
import sharp from "sharp";
import { applyTriggeredEffect } from "./triggered";

const createTestImage = async (width = 100, height = 100): Promise<Buffer> => {
	return await sharp({
		create: {
			width,
			height,
			channels: 3,
			background: { r: 255, g: 255, b: 255 },
		},
	})
		.png()
		.toBuffer();
};

const verifyProcessedImage = async (
	original: Buffer,
	result: Buffer,
	expectedWidth: number,
	expectedHeight: number,
) => {
	expect(result).not.toEqual(original);
	expect(result.length).not.toBe(original.length);

	const metadata = await sharp(result).metadata();

	expect(metadata.format).toBe("jpeg");
	expect(metadata.width).toBe(expectedWidth);
	expect(metadata.height).toBe(expectedHeight);
};

describe("applyTriggeredEffect", () => {
	test("processes images of various sizes and orientations", async () => {
		const testCases = [
			{ width: 200, height: 200, name: "square" },
			{ width: 400, height: 200, name: "landscape" },
			{ width: 200, height: 400, name: "portrait" },
			{ width: 50, height: 50, name: "small" },
			{ width: 1000, height: 1000, name: "large" },
			{ width: 2000, height: 500, name: "very wide landscape" },
			{ width: 500, height: 2000, name: "very tall portrait" },
			{ width: 10, height: 10, name: "minimum viable size" },
		];

		for (const testCase of testCases) {
			const testImage = await createTestImage(testCase.width, testCase.height);
			const result = await applyTriggeredEffect(testImage);
			await verifyProcessedImage(testImage, result, testCase.width, testCase.height);
		}
	});

	test("throws error for invalid image buffer", async () => {
		const invalidBuffer = Buffer.from("not a valid image");
		await expect(applyTriggeredEffect(invalidBuffer)).rejects.toThrow();
	});

	test("throws error for empty buffer", async () => {
		const emptyBuffer = Buffer.from([]);
		await expect(applyTriggeredEffect(emptyBuffer)).rejects.toThrow();
	});
});
