import { describe, expect, spyOn, test } from "bun:test";
import sharp from "sharp";
import type { ErrorResponse } from "~/http/errors";
import { routes } from "./controller";

const BASE_URL = "http://localhost/effects";
const VALID_EFFECT_ID = "triggered";
const FORM_FIELD_NAME = "image";

const createTestImage = (): File => {
	const pngData = Buffer.from(
		"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
		"base64",
	);
	return new File([pngData], "test.png", { type: "image/png" });
};

const createRequest = (effectId: string, file?: File, method = "POST"): Request => {
	const formData = new FormData();
	if (file) {
		formData.append(FORM_FIELD_NAME, file);
	}

	return new Request(`${BASE_URL}/${effectId}`, {
		method,
		body: method === "POST" ? formData : undefined,
	});
};

const expectErrorResponse = async (
	response: Response,
	expectedStatus: number,
	expectedCode: ErrorResponse["code"],
	expectedMessage: string,
): Promise<ErrorResponse> => {
	expect(response.status).toBe(expectedStatus);
	expect(response.headers.get("Content-Type")).toBe("application/json");

	const body = (await response.json()) as ErrorResponse;
	expect(body.code).toBe(expectedCode);
	expect(body.message).toBe(expectedMessage);

	return body;
};

describe("/v1/images/effects", () => {
	describe("GET /", () => {
		test("returns available effects list", async () => {
			const request = new Request(`${BASE_URL}/`, { method: "GET" });
			const response = await routes.handle(request);

			expect(response.status).toBe(200);
			const body = (await response.json()) as { availableEffects: string[] };
			expect(body).toHaveProperty("availableEffects");
			expect(Array.isArray(body.availableEffects)).toBe(true);
		});
	});

	describe("POST /:effectId", () => {
		describe("route validation", () => {
			test("fails and returns 400 with invalid effectId", async () => {
				const request = createRequest("invalid", createTestImage());
				const response = await routes.handle(request);

				expect(response.status).toBe(400);
			});

			test("fails and returns 404 for non-POST request", async () => {
				const request = createRequest(VALID_EFFECT_ID, undefined, "GET");
				const response = await routes.handle(request);

				expect(response.status).toBe(404);
			});
		});

		describe("file validation", () => {
			test("returns error when image is missing", async () => {
				const request = createRequest(VALID_EFFECT_ID);
				const response = await routes.handle(request);
				const body = await expectErrorResponse(response, 400, "IMAGE_REQUIRED", "Image file is required");

				expect(body.details).toHaveProperty("fieldName", FORM_FIELD_NAME);
			});

			test("returns error for empty image file", async () => {
				const emptyFile = new File([], "empty.png", { type: "image/png" });
				const request = createRequest(VALID_EFFECT_ID, emptyFile);
				const response = await routes.handle(request);
				await expectErrorResponse(response, 400, "IMAGE_EMPTY", "Image file cannot be empty");
			});

			test("returns error for file too large", async () => {
				const largeFileData = new Uint8Array(11 * 1024 * 1024); // 11MB
				const largeFile = new File([largeFileData], "large.png", { type: "image/png" });
				const request = createRequest(VALID_EFFECT_ID, largeFile);
				const response = await routes.handle(request);
				const body = await expectErrorResponse(
					response,
					400,
					"IMAGE_TOO_LARGE",
					"Image file size exceeds the maximum allowed size",
				);

				expect(body.details).toHaveProperty("maxSize");
				expect(body.details).toHaveProperty("maxSizeMB", 10);
				expect(body.details).toHaveProperty("actualSize", 11 * 1024 * 1024);
			});

			test("returns error for non-image file", async () => {
				const textFile = new File(["not an image"], "test.txt", { type: "text/plain" });
				const request = createRequest(VALID_EFFECT_ID, textFile);
				const response = await routes.handle(request);
				const body = await expectErrorResponse(response, 400, "IMAGE_INVALID_TYPE", "Image file is invalid");

				expect(body.details).toHaveProperty("receivedType");
				expect(String(body.details?.receivedType)).toContain("text/plain");
				expect(body.details).toHaveProperty("supportedTypes");
			});

			test("returns error for unsupported image type", async () => {
				const svgFile = new File(["<svg></svg>"], "test.svg", { type: "image/svg+xml" });
				const request = createRequest(VALID_EFFECT_ID, svgFile);
				const response = await routes.handle(request);
				const body = await expectErrorResponse(response, 400, "IMAGE_UNSUPPORTED_TYPE", "Image file is unsupported");

				expect(body.details).toHaveProperty("supportedTypes");
				expect(body.details).toHaveProperty("receivedType", "image/svg+xml");
			});
		});

		describe("image processing", () => {
			test("returns error when image processing fails", async () => {
				spyOn(console, "error").mockImplementation(() => {});

				const invalidImageData = Buffer.from("not a valid image");
				const invalidImage = new File([invalidImageData], "invalid.jpg", { type: "image/jpeg" });
				const request = createRequest(VALID_EFFECT_ID, invalidImage);
				const response = await routes.handle(request);

				await expectErrorResponse(
					response,
					500,
					"IMAGE_PROCESSING_FAILED",
					"Input buffer contains unsupported image format",
				);
			});

			test("returns processed image for triggered effect", async () => {
				const pngBuffer = await sharp({
					create: {
						width: 100,
						height: 100,
						channels: 3,
						background: { r: 255, g: 255, b: 255 },
					},
				})
					.png()
					.toBuffer();

				const testImage = new File([pngBuffer], "test.png", { type: "image/png" });
				const request = createRequest(VALID_EFFECT_ID, testImage);
				const response = await routes.handle(request);

				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toBe("image/jpeg");
				expect(response.headers.get("Cache-Control")).toBe("no-cache");

				const contentDisposition = response.headers.get("Content-Disposition");
				expect(contentDisposition).toContain("inline");
				expect(contentDisposition).toContain("filename=");
				expect(contentDisposition).toMatch(/triggered-\d+-[a-z0-9]+\.jpg/);

				// Verify response body is actually an image
				const imageBuffer = await response.arrayBuffer();
				expect(imageBuffer.byteLength).toBeGreaterThan(0);
			});
		});
	});
});
