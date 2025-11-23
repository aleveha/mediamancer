export type ErrorResponse = {
	code: string;
	details?: Record<string, unknown>;
	message?: string;
};
