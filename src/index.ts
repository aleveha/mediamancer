const server = Bun.serve({
	routes: {},
	fetch: () => {
		return new Response("Not Found", { status: 404 });
	},
	error: (error) => {
		console.error(error);
		return new Response("Internal Server Error", { status: 500 });
	},
});

console.log(`Server running at ${server.url}`);
