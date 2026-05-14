import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { HadithInput } from "@/components/hadith-input";
import { EXAMPLE_HADITH } from "@/constants/hadith-examples";

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	cleanup();
	localStorage.clear();
});

describe("HadithInput", () => {
	it("renders the example hadith as the textarea initial value when localStorage is empty", () => {
		render(<HadithInput />);
		const textarea = screen.getByRole("textbox");
		expect((textarea as HTMLTextAreaElement).value).toBe(EXAMPLE_HADITH);
	});

	it("renders a submit button with the Arabic analysis label", () => {
		render(<HadithInput />);
		expect(screen.getByRole("button", { name: "تحليل الحديث" })).toBeDefined();
	});

	it("clicking submit does not change the textarea value", async () => {
		render(<HadithInput />);
		const button = screen.getByRole("button", { name: "تحليل الحديث" });
		const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
		const valueBefore = textarea.value;
		button.click();
		expect(textarea.value).toBe(valueBefore);
	});

	describe("validation errors", () => {
		it("shows empty error when submitting an empty textarea", async () => {
			render(<HadithInput />);
			const textarea = screen.getByRole("textbox");
			await act(async () => {
				fireEvent.change(textarea, { target: { value: "" } });
			});
			await act(async () => {
				screen.getByRole("button", { name: "تحليل الحديث" }).click();
			});
			expect(screen.getByText("الرجاء إدخال نص الحديث")).toBeDefined();
		});

		it("error message has input-error-msg class", async () => {
			render(<HadithInput />);
			const textarea = screen.getByRole("textbox");
			await act(async () => {
				fireEvent.change(textarea, { target: { value: "" } });
			});
			await act(async () => {
				screen.getByRole("button", { name: "تحليل الحديث" }).click();
			});
			const msg = screen.getByText("الرجاء إدخال نص الحديث");
			expect(msg.className).toContain("input-error-msg");
		});

		it("shows non-arabic error when submitting Latin text", async () => {
			render(<HadithInput />);
			const textarea = screen.getByRole("textbox");
			await act(async () => {
				fireEvent.change(textarea, {
					target: { value: "hello world latin text" },
				});
			});
			await act(async () => {
				screen.getByRole("button", { name: "تحليل الحديث" }).click();
			});
			expect(
				screen.getByText("النص غير مدعوم — الأداة تقبل النصوص العربية فقط"),
			).toBeDefined();
		});

		it("shows word count error when text exceeds 3000 words", async () => {
			render(<HadithInput />);
			const textarea = screen.getByRole("textbox");
			const longText = "عن ".repeat(3001).trim();
			await act(async () => {
				fireEvent.change(textarea, { target: { value: longText } });
			});
			await act(async () => {
				screen.getByRole("button", { name: "تحليل الحديث" }).click();
			});
			expect(
				screen.getByText("النص يتجاوز الحد المسموح به (٣٠٠٠ كلمة)"),
			).toBeDefined();
		});
	});

	describe("error lifecycle", () => {
		it("no error message is visible before any submit attempt", () => {
			render(<HadithInput />);
			expect(screen.queryByText("الرجاء إدخال نص الحديث")).toBeNull();
		});

		it("error message is replaced when a valid re-submit succeeds", async () => {
			const onSubmit = mock(async () => {});
			render(<HadithInput onSubmit={onSubmit} />);
			const textarea = screen.getByRole("textbox");
			// Trigger an error
			await act(async () => {
				fireEvent.change(textarea, { target: { value: "" } });
			});
			await act(async () => {
				screen.getByRole("button", { name: "تحليل الحديث" }).click();
			});
			expect(screen.getByText("الرجاء إدخال نص الحديث")).toBeDefined();
			// Submit valid Arabic
			await act(async () => {
				fireEvent.change(textarea, {
					target: { value: "حدثنا محمد عن عبدالله رضي الله عنه" },
				});
			});
			await act(async () => {
				screen.getByRole("button", { name: "تحليل الحديث" }).click();
			});
			expect(screen.queryByText("الرجاء إدخال نص الحديث")).toBeNull();
		});
	});

	describe("loading state", () => {
		it("shows a spinner on the submit button while loading", async () => {
			let resolve!: () => void;
			const pending = new Promise<void>((res) => {
				resolve = res;
			});
			render(<HadithInput onSubmit={() => pending} />);
			act(() => {
				screen.getByRole("button", { name: "تحليل الحديث" }).click();
			});
			expect(screen.getByTestId("submit-spinner")).toBeDefined();
			await act(async () => {
				resolve();
			});
		});

		it("disables the submit button while loading", async () => {
			let resolve!: () => void;
			const pending = new Promise<void>((res) => {
				resolve = res;
			});
			render(<HadithInput onSubmit={() => pending} />);
			act(() => {
				screen.getByRole("button", { name: "تحليل الحديث" }).click();
			});
			const button = screen.getByRole("button", { name: "تحليل الحديث" });
			expect((button as HTMLButtonElement).disabled).toBe(true);
			await act(async () => {
				resolve();
			});
		});
	});

	describe("submitted state", () => {
		it("textarea is replaced by a compact summary row after a valid submit resolves", async () => {
			const onSubmit = mock(async () => {});
			render(<HadithInput onSubmit={onSubmit} />);
			await act(async () => {
				screen.getByRole("button", { name: "تحليل الحديث" }).click();
			});
			expect(screen.queryByRole("textbox")).toBeNull();
			expect(screen.getByTestId("compact-summary")).toBeDefined();
		});

		it("shows a reset button after submission", async () => {
			const onSubmit = mock(async () => {});
			render(<HadithInput onSubmit={onSubmit} />);
			await act(async () => {
				screen.getByRole("button", { name: "تحليل الحديث" }).click();
			});
			expect(screen.getByRole("button", { name: "بدء من جديد" })).toBeDefined();
		});

		it("hides the submit button after submission", async () => {
			const onSubmit = mock(async () => {});
			render(<HadithInput onSubmit={onSubmit} />);
			await act(async () => {
				screen.getByRole("button", { name: "تحليل الحديث" }).click();
			});
			expect(screen.queryByRole("button", { name: "تحليل الحديث" })).toBeNull();
		});

		it("reset button makes textarea editable again and preserves value", async () => {
			const onSubmit = mock(async () => {});
			const onReset = mock(() => {});
			render(<HadithInput onSubmit={onSubmit} onReset={onReset} />);
			await act(async () => {
				screen.getByRole("button", { name: "تحليل الحديث" }).click();
			});
			await act(async () => {
				screen.getByRole("button", { name: "بدء من جديد" }).click();
			});
			const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
			expect(textarea.readOnly).toBe(false);
			expect(textarea.value).toBe(EXAMPLE_HADITH);
			expect(onReset).toHaveBeenCalledTimes(1);
		});
	});
});
