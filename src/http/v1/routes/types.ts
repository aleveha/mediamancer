export type RouteController<TRoute extends string> = Bun.Serve.Handler<
	Bun.BunRequest<TRoute>,
	Bun.Server<undefined>,
	Response
>;
