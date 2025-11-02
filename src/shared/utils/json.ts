export const json = (data: unknown, options?: ResponseInit) => {
	return new Response(JSON.stringify(data), {
		headers: {
			"Content-Type": "application/json",
			...options?.headers,
		},
		...options,
	});
};
