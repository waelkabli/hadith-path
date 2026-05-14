import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";

import { ApiKeySettings } from "@/components/api-key-settings";

const STORAGE_KEY = "hadith-api-key-claude";

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	cleanup();
	localStorage.clear();
});

describe("ApiKeySettings", () => {
	describe("visibility", () => {
		it("renders nothing when isOpen is false", () => {
			render(<ApiKeySettings isOpen={false} onClose={mock(() => {})} />);
			expect(screen.queryByRole("dialog")).toBeNull();
		});

		it("renders the modal dialog when isOpen is true", () => {
			render(<ApiKeySettings isOpen={true} onClose={mock(() => {})} />);
			expect(screen.getByRole("dialog")).toBeDefined();
		});
	});

	describe("initial state", () => {
		it("shows an empty input when no key is stored", () => {
			render(<ApiKeySettings isOpen={true} onClose={mock(() => {})} />);
			const input = screen.getByLabelText(
				"مفتاح Claude API",
			) as HTMLInputElement;
			expect(input.value).toBe("");
		});

		it("pre-fills the input with the stored key when one exists", () => {
			localStorage.setItem(STORAGE_KEY, "sk-ant-stored-key");
			render(<ApiKeySettings isOpen={true} onClose={mock(() => {})} />);
			const input = screen.getByLabelText(
				"مفتاح Claude API",
			) as HTMLInputElement;
			expect(input.value).toBe("sk-ant-stored-key");
		});

		it("input type is text (temporarily for troubleshooting — TODO revert to password)", () => {
			render(<ApiKeySettings isOpen={true} onClose={mock(() => {})} />);
			const input = screen.getByLabelText(
				"مفتاح Claude API",
			) as HTMLInputElement;
			expect(input.type).toBe("text");
		});
	});

	describe("save", () => {
		it("clicking Save writes the key to localStorage and calls onClose", async () => {
			const onClose = mock(() => {});
			render(<ApiKeySettings isOpen={true} onClose={onClose} />);
			await act(async () => {
				fireEvent.change(screen.getByLabelText("مفتاح Claude API"), {
					target: { value: "sk-ant-new-key" },
				});
			});
			await act(async () => {
				screen.getByRole("button", { name: "حفظ" }).click();
			});
			expect(localStorage.getItem(STORAGE_KEY)).toBe("sk-ant-new-key");
			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it("clicking Save with an empty field calls onClose without writing to localStorage", async () => {
			const onClose = mock(() => {});
			render(<ApiKeySettings isOpen={true} onClose={onClose} />);
			await act(async () => {
				screen.getByRole("button", { name: "حفظ" }).click();
			});
			expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it("Save trims whitespace from the key before writing", async () => {
			const onClose = mock(() => {});
			render(<ApiKeySettings isOpen={true} onClose={onClose} />);
			await act(async () => {
				fireEvent.change(screen.getByLabelText("مفتاح Claude API"), {
					target: { value: "  sk-ant-padded  " },
				});
			});
			await act(async () => {
				screen.getByRole("button", { name: "حفظ" }).click();
			});
			expect(localStorage.getItem(STORAGE_KEY)).toBe("sk-ant-padded");
		});
	});

	describe("dismiss without saving", () => {
		it("clicking Cancel calls onClose without writing to localStorage", async () => {
			const onClose = mock(() => {});
			render(<ApiKeySettings isOpen={true} onClose={onClose} />);
			await act(async () => {
				fireEvent.change(screen.getByLabelText("مفتاح Claude API"), {
					target: { value: "sk-ant-edited" },
				});
			});
			await act(async () => {
				screen.getByRole("button", { name: "إلغاء" }).click();
			});
			expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it("clicking the X button calls onClose", async () => {
			const onClose = mock(() => {});
			render(<ApiKeySettings isOpen={true} onClose={onClose} />);
			await act(async () => {
				screen.getByRole("button", { name: "إغلاق" }).click();
			});
			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it("pressing Escape calls onClose", async () => {
			const onClose = mock(() => {});
			render(<ApiKeySettings isOpen={true} onClose={onClose} />);
			const backdrop = screen.getByRole("dialog").parentElement as HTMLElement;
			await act(async () => {
				fireEvent.keyDown(backdrop, { key: "Escape" });
			});
			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it("clicking the backdrop calls onClose", async () => {
			const onClose = mock(() => {});
			render(<ApiKeySettings isOpen={true} onClose={onClose} />);
			const backdrop = screen.getByRole("dialog").parentElement as HTMLElement;
			await act(async () => {
				fireEvent.click(backdrop);
			});
			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it("clicking inside the dialog does not call onClose", async () => {
			const onClose = mock(() => {});
			render(<ApiKeySettings isOpen={true} onClose={onClose} />);
			await act(async () => {
				fireEvent.click(screen.getByRole("dialog"));
			});
			expect(onClose).not.toHaveBeenCalled();
		});
	});

	describe("keyboard submit", () => {
		it("pressing Enter saves the key and calls onClose", async () => {
			const onClose = mock(() => {});
			render(<ApiKeySettings isOpen={true} onClose={onClose} />);
			const backdrop = screen.getByRole("dialog").parentElement as HTMLElement;
			await act(async () => {
				fireEvent.change(screen.getByLabelText("مفتاح Claude API"), {
					target: { value: "sk-ant-enter-key" },
				});
			});
			await act(async () => {
				fireEvent.keyDown(backdrop, { key: "Enter" });
			});
			expect(localStorage.getItem(STORAGE_KEY)).toBe("sk-ant-enter-key");
			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});

	describe("reopen behavior", () => {
		it("re-opening after an unsaved edit shows the original stored key", async () => {
			localStorage.setItem(STORAGE_KEY, "sk-ant-original");
			const onClose = mock(() => {});
			const { rerender } = render(
				<ApiKeySettings isOpen={true} onClose={onClose} />,
			);
			await act(async () => {
				fireEvent.change(screen.getByLabelText("مفتاح Claude API"), {
					target: { value: "sk-ant-changed" },
				});
			});
			// close without saving
			rerender(<ApiKeySettings isOpen={false} onClose={onClose} />);
			// reopen
			await act(async () => {
				rerender(<ApiKeySettings isOpen={true} onClose={onClose} />);
			});
			const input = screen.getByLabelText(
				"مفتاح Claude API",
			) as HTMLInputElement;
			expect(input.value).toBe("sk-ant-original");
		});
	});
});
