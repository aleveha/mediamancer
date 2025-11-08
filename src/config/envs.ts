import { number, object, picklist, pipe, safeParse, string, transform } from "valibot";

const schema = object({
	PORT: pipe(string(), transform(Number), number()),
	NODE_ENV: pipe(
		string(),
		picklist(["development", "production"], "Invalid NODE_ENV value, use 'development' or 'production'"),
	),
});

const parseResult = safeParse(schema, process.env);

if (!parseResult.success) {
	console.error(
		"Environment validation issues: " +
			JSON.stringify(
				parseResult.issues.map((issue) => ({
					message: issue.message,
					expected: issue.expected,
					received: issue.received,
				})),
				null,
				2,
			),
	);
	process.exit(1);
}

const _envs = parseResult.output;

export const envs = {
	..._envs,
	isProduction: _envs.NODE_ENV === "production",
	isDevelopment: _envs.NODE_ENV === "development",
};

console.info("Environment variables: ", envs);
