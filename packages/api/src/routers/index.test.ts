import { describe, expect, it } from "bun:test";
import { call, ORPCError } from "@orpc/server";

import { appRouter } from "./index";

const noSession = { auth: null, session: null } as const;

describe("healthCheck", () => {
	it("returns OK for any caller", async () => {
		const result = await call(appRouter.healthCheck, undefined, {
			context: noSession,
		});
		expect(result).toBe("OK");
	});
});

describe("privateData", () => {
	it("throws UNAUTHORIZED when there is no session", async () => {
		try {
			await call(appRouter.privateData, undefined, { context: noSession });
			expect.unreachable("should have thrown");
		} catch (e) {
			expect(e).toBeInstanceOf(ORPCError);
			expect((e as ORPCError).code).toBe("UNAUTHORIZED");
		}
	});

	it("returns message and user when a valid session is present", async () => {
		const mockUser = {
			id: "user-1",
			name: "Wael",
			email: "wael@example.com",
			emailVerified: false,
			image: null,
			createdAt: new Date("2024-01-01"),
			updatedAt: new Date("2024-01-01"),
		};
		const context = {
			auth: null,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			session: { user: mockUser, session: { id: "session-1" } as any },
		};

		const result = await call(appRouter.privateData, undefined, { context });

		expect(result).toEqual({ message: "This is private", user: mockUser });
	});
});
