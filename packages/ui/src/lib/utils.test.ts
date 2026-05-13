import { describe, expect, it } from "bun:test";
import { cn } from "./utils";

describe("cn", () => {
	it("returns empty string with no arguments", () => {
		expect(cn()).toBe("");
	});

	it("joins multiple class strings", () => {
		expect(cn("foo", "bar", "baz")).toBe("foo bar baz");
	});

	it("resolves Tailwind conflicts — last argument wins", () => {
		expect(cn("p-2", "p-4")).toBe("p-4");
		expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
	});

	it("ignores falsy values", () => {
		expect(cn("base", undefined, null, false, "extra")).toBe("base extra");
	});

	it("includes classes from object keys whose value is true", () => {
		expect(cn({ active: true, disabled: false, hidden: true })).toBe(
			"active hidden",
		);
	});

	it("handles arrays of class values", () => {
		expect(cn(["flex", "items-center"], "gap-2")).toBe(
			"flex items-center gap-2",
		);
	});
});
