import { describe, expect, test } from "bun:test";
import { IMAGE_EFFECTS } from "./types";
import { isValidImageEffectId } from "./utils";

describe("isValidImageEffectId", () => {
	test("returns true for valid effect ID", () => {
		expect(isValidImageEffectId("triggered")).toBe(true);
	});

	test("returns false for invalid effect ID", () => {
		expect(isValidImageEffectId("unknown")).toBe(false);
	});

	test("returns false for empty string", () => {
		expect(isValidImageEffectId("")).toBe(false);
	});

	test("returns false for case-sensitive variations", () => {
		expect(isValidImageEffectId("Triggered")).toBe(false);
	});

	test("returns false for partial matches", () => {
		expect(isValidImageEffectId("trigger")).toBe(false);
	});

	test("returns false for strings containing valid ID as substring", () => {
		expect(isValidImageEffectId("triggeredpost")).toBe(false);
	});

	test("works correctly with all defined effects", () => {
		const effectIds = Object.keys(IMAGE_EFFECTS);
		for (const effectId of effectIds) {
			expect(isValidImageEffectId(effectId)).toBe(true);
		}
	});

	test("type guard narrows type correctly", () => {
		const testId: string = "triggered";
		if (isValidImageEffectId(testId)) {
			expect(testId).toBe("triggered");
		}
	});
});
