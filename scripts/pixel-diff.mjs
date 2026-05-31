/**
 * pixel-diff.mjs
 * Compares screenshots/figma-SXX.png vs screenshots/browser-SXX.png
 * Outputs screenshots/diff-SXX.png and prints a summary table.
 *
 * Usage: node scripts/pixel-diff.mjs [S00 S01 ...]
 *        (no args = all pairs found in screenshots/)
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import pixelmatch from "./node_modules/pixelmatch/index.js";

const require = createRequire(import.meta.url);
const { PNG } = require("./node_modules/pngjs/lib/png.js");

const DIR = new URL("../screenshots/", import.meta.url).pathname;

function loadPNG(path) {
	const buf = readFileSync(path);
	return PNG.sync.read(buf);
}

function resizePNG(src, targetW, targetH) {
	if (src.width === targetW && src.height === targetH) return src;
	const dst = new PNG({ width: targetW, height: targetH });
	dst.data.fill(255);
	const scaleX = src.width / targetW;
	const scaleY = src.height / targetH;
	for (let y = 0; y < targetH; y++) {
		for (let x = 0; x < targetW; x++) {
			const sx = Math.min(Math.floor(x * scaleX), src.width - 1);
			const sy = Math.min(Math.floor(y * scaleY), src.height - 1);
			const si = (sy * src.width + sx) * 4;
			const di = (y * targetW + x) * 4;
			dst.data[di] = src.data[si];
			dst.data[di + 1] = src.data[si + 1];
			dst.data[di + 2] = src.data[si + 2];
			dst.data[di + 3] = src.data[si + 3];
		}
	}
	return dst;
}

function diffPair(id) {
	const figmaPath = `${DIR}figma-${id}.png`;
	const browserPath = `${DIR}browser-${id}.png`;
	const diffPath = `${DIR}diff-${id}.png`;

	if (!existsSync(figmaPath)) return { id, status: "missing-figma" };
	if (!existsSync(browserPath)) return { id, status: "missing-browser" };

	const figma = loadPNG(figmaPath);
	let browser = loadPNG(browserPath);
	browser = resizePNG(browser, figma.width, figma.height);

	const diff = new PNG({ width: figma.width, height: figma.height });
	const totalPixels = figma.width * figma.height;

	const diffPixels = pixelmatch(
		figma.data,
		browser.data,
		diff.data,
		figma.width,
		figma.height,
		{ threshold: 0.1, includeAA: false },
	);

	writeFileSync(diffPath, PNG.sync.write(diff));

	const pct = ((diffPixels / totalPixels) * 100).toFixed(2);
	const status =
		diffPixels === 0
			? "PERFECT"
			: diffPixels < totalPixels * 0.01
				? "PASS"
				: diffPixels < totalPixels * 0.05
					? "MINOR"
					: "DIFF";
	return { id, diffPixels, totalPixels, pct, status, diffPath };
}

const requested = process.argv.slice(2);
const ids = requested.length
	? requested
	: readdirSync(DIR)
			.filter((f) => f.startsWith("figma-") && f.endsWith(".png"))
			.map((f) => f.replace("figma-", "").replace(".png", ""))
			.sort();

const results = ids.map(diffPair);

// Print summary table
console.log("\n┌────────┬────────────┬──────────────────────┬────────┐");
console.log("│ Screen │ Diff px    │ % different          │ Status │");
console.log("├────────┼────────────┼──────────────────────┼────────┤");
for (const r of results) {
	if (r.status === "missing-figma") {
		console.log(
			`│ ${r.id.padEnd(6)} │ ${"—".padEnd(10)} │ ${"no figma PNG".padEnd(20)} │ SKIP   │`,
		);
	} else if (r.status === "missing-browser") {
		console.log(
			`│ ${r.id.padEnd(6)} │ ${"—".padEnd(10)} │ ${"no browser PNG".padEnd(20)} │ SKIP   │`,
		);
	} else {
		const icon =
			r.status === "PERFECT"
				? "✓✓"
				: r.status === "PASS"
					? "✓ "
					: r.status === "MINOR"
						? "~ "
						: "✗ ";
		console.log(
			`│ ${r.id.padEnd(6)} │ ${String(r.diffPixels).padEnd(10)} │ ${(r.pct + "%").padEnd(20)} │ ${icon} ${r.status.padEnd(5)} │`,
		);
	}
}
console.log("└────────┴────────────┴──────────────────────┴────────┘");

const failing = results.filter(
	(r) => r.status === "DIFF" || r.status === "MINOR",
);
if (failing.length) {
	console.log(`\nNeeds attention (${failing.length}):`);
	for (const r of failing)
		console.log(`  ${r.id}: ${r.pct}% diff  →  ${r.diffPath}`);
}
