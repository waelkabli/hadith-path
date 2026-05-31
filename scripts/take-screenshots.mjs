/**
 * take-screenshots.mjs
 * Launches Windows Chrome headless via CDP, injects localStorage fixture state,
 * screenshots each screen, saves to screenshots/browser-SXX.png
 *
 * Usage: node scripts/take-screenshots.mjs [S00 S01 ...]
 *        (no args = all screens)
 */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

// ── Config ────────────────────────────────────────────────────────────────────
const IS_WIN = process.platform === "win32";
const CHROME = IS_WIN
	? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
	: "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:3001";
const OUT =
	join(dirname(fileURLToPath(import.meta.url)), "../screenshots") +
	(IS_WIN ? "\\" : "/");
const DEBUG_PORT = 9223; // avoid clash with any existing Chrome

mkdirSync(OUT, { recursive: true });

// ── Fixture data ──────────────────────────────────────────────────────────────
const HADITH =
	"حَدَّثَنَا الْحُمَيْدِيُّ عَبْدُ اللَّهِ بْنُ الزُّبَيْرِ، قَالَ: حَدَّثَنَا سُفْيَانُ، قَالَ: حَدَّثَنَا يَحْيَى بْنُ سَعِيدٍ الأَنْصَارِيُّ، قَالَ: أَخْبَرَنِي مُحَمَّدُ بْنُ إِبْرَاهِيمَ التَّيْمِيُّ، أَنَّهُ سَمِعَ عَلْقَمَةَ بْنَ وَقَّاصٍ اللَّيْثِيَّ، يَقُولُ: سَمِعْتُ عُمَرَ بْنَ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ عَلَى الْمِنْبَرِ قَالَ: سَمِعْتُ رَسُولَ اللَّهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ يَقُولُ: إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى دُنْيَا يُصِيبُهَا، أَوْ إِلَى امْرَأَةٍ يَنْكِحُهَا، فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ.";

const SPLIT_AT = 347; // "سَمِعْتُ رَسُولَ" starts here
const HADITH_HASH = "c54e9901";
const ISNAD_HASH = "178ec5d2";

const PARSE_RESULT = {
	inputHash: HADITH_HASH,
	llmSplitAt: SPLIT_AT,
	splitAt: SPLIT_AT,
	corrected: false,
};

const PARSE_CORRECTED = { ...PARSE_RESULT, corrected: true };

const NARRATORS = [
	{
		extractedName: "الْحُمَيْدِيُّ عَبْدُ اللَّهِ بْنُ الزُّبَيْرِ",
		position: 0,
		mentionStart: 9,
		mentionEnd: 44,
		topMatches: [{ narratorId: "ibn-umar", score: 0.78 }],
		selectedId: "ibn-umar",
		userOverride: true,
		confidence: "high",
		isAmbiguous: false,
	},
	{
		extractedName: "سُفْيَانُ",
		position: 1,
		mentionStart: 54,
		mentionEnd: 62,
		topMatches: [
			{ narratorId: "malik-ibn-anas", score: 0.65 },
			{ narratorId: "ibn-shihab-al-zuhri", score: 0.6 },
		],
		selectedId: null,
		userOverride: false,
		confidence: "low",
		isAmbiguous: true,
	},
	{
		extractedName: "يَحْيَى بْنُ سَعِيدٍ الأَنْصَارِيُّ",
		position: 2,
		mentionStart: 72,
		mentionEnd: 106,
		topMatches: [{ narratorId: "anas-ibn-malik", score: 0.72 }],
		selectedId: "anas-ibn-malik",
		userOverride: true,
		confidence: "high",
		isAmbiguous: false,
	},
	{
		extractedName: "مُحَمَّدُ بْنُ إِبْرَاهِيمَ التَّيْمِيُّ",
		position: 3,
		mentionStart: 118,
		mentionEnd: 151,
		topMatches: [{ narratorId: "ibn-shihab-al-zuhri", score: 0.55 }],
		selectedId: null,
		userOverride: false,
		confidence: "medium",
		isAmbiguous: false,
	},
	{
		extractedName: "عَلْقَمَةَ بْنَ وَقَّاصٍ اللَّيْثِيَّ",
		position: 4,
		mentionStart: 165,
		mentionEnd: 196,
		topMatches: [],
		selectedId: null,
		userOverride: true,
		confidence: "low",
		isAmbiguous: false,
	},
	{
		extractedName: "عُمَرَ بْنَ الْخَطَّابِ",
		position: 5,
		mentionStart: 208,
		mentionEnd: 227,
		topMatches: [{ narratorId: "umar-ibn-al-khattab", score: 0.97 }],
		selectedId: "umar-ibn-al-khattab",
		userOverride: true,
		confidence: "high",
		isAmbiguous: false,
	},
];

const EXTRACTION = { inputHash: ISNAD_HASH, narrators: NARRATORS };

const VARIANT2_HADITH =
	"أَخْبَرَنَا مَالِكٌ عَنِ ابْنِ شِهَابٍ عَنْ أَنَسِ بْنِ مَالِكٍ عَنْ عُمَرَ بْنِ الْخَطَّابِ أَنَّهُ قَالَ: سَمِعْتُ رَسُولَ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ يَقُولُ: إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ.";

const V2_PARSE = {
	inputHash: "aaaabbbb",
	llmSplitAt: 110,
	splitAt: 110,
	corrected: false,
};
const V2_EXTRACTION = {
	inputHash: "aaaabbbb",
	narrators: [
		{
			extractedName: "مَالِكٌ",
			position: 0,
			mentionStart: 12,
			mentionEnd: 18,
			topMatches: [{ narratorId: "malik-ibn-anas", score: 0.95 }],
			selectedId: "malik-ibn-anas",
			userOverride: true,
			confidence: "high",
			isAmbiguous: false,
		},
		{
			extractedName: "ابْنِ شِهَابٍ",
			position: 1,
			mentionStart: 23,
			mentionEnd: 34,
			topMatches: [{ narratorId: "ibn-shihab-al-zuhri", score: 0.95 }],
			selectedId: "ibn-shihab-al-zuhri",
			userOverride: true,
			confidence: "high",
			isAmbiguous: false,
		},
		{
			extractedName: "أَنَسِ بْنِ مَالِكٍ",
			position: 2,
			mentionStart: 38,
			mentionEnd: 55,
			topMatches: [{ narratorId: "anas-ibn-malik", score: 0.97 }],
			selectedId: "anas-ibn-malik",
			userOverride: true,
			confidence: "high",
			isAmbiguous: false,
		},
		{
			extractedName: "عُمَرَ بْنِ الْخَطَّابِ",
			position: 3,
			mentionStart: 59,
			mentionEnd: 78,
			topMatches: [{ narratorId: "umar-ibn-al-khattab", score: 0.97 }],
			selectedId: "umar-ibn-al-khattab",
			userOverride: true,
			confidence: "high",
			isAmbiguous: false,
		},
	],
};

const VARIANTS_WITH_TWO = [
	{
		id: "v1",
		label: "نسخة ١",
		rawText: HADITH,
		color: "#16A34A",
		parseResult: PARSE_RESULT,
		narratorExtraction: EXTRACTION,
	},
	{
		id: "v2",
		label: "نسخة ٢",
		rawText: VARIANT2_HADITH,
		color: "#2563EB",
		parseResult: V2_PARSE,
		narratorExtraction: V2_EXTRACTION,
	},
];

// Each screen: id, url, tab (which dashboard tab), state to inject
const SCREENS = [
	{ id: "S00", url: `${BASE}/`, state: {} },
	{ id: "S01", url: `${BASE}/dashboard`, state: {} },
	{
		id: "S03",
		url: `${BASE}/dashboard`,
		state: {
			"hadith-input-raw": HADITH,
			"hadith-parse-result": JSON.stringify(PARSE_RESULT),
		},
	},
	{
		id: "S04",
		url: `${BASE}/dashboard`,
		state: {
			"hadith-input-raw": HADITH,
			"hadith-parse-result": JSON.stringify(PARSE_RESULT),
			"hadith-narrator-extraction": JSON.stringify(EXTRACTION),
		},
	},
	{
		id: "S05",
		url: `${BASE}/dashboard`,
		state: {
			"hadith-input-raw": HADITH,
			"hadith-parse-result": JSON.stringify(PARSE_RESULT),
			"hadith-narrator-extraction": JSON.stringify({
				...EXTRACTION,
				narrators: NARRATORS.map((n) =>
					n.position === 1
						? { ...n, userOverride: false, selectedId: null }
						: n,
				),
			}),
		},
	},
	{
		id: "S08",
		url: `${BASE}/dashboard`,
		state: {
			"hadith-input-raw": HADITH,
			"hadith-parse-result": JSON.stringify(PARSE_RESULT),
			"hadith-narrator-extraction": JSON.stringify(EXTRACTION),
		},
		clickSelector:
			'button[aria-label="split-correction"], button:has-text("تعديل")',
	},
	{
		id: "S09",
		url: `${BASE}/dashboard`,
		tab: "chain",
		state: {
			"hadith-input-raw": HADITH,
			"hadith-parse-result": JSON.stringify(PARSE_RESULT),
			"hadith-narrator-extraction": JSON.stringify(EXTRACTION),
		},
	},
	{
		id: "S10",
		url: `${BASE}/dashboard`,
		tab: "chain",
		state: {
			"hadith-input-raw": HADITH,
			"hadith-parse-result": JSON.stringify(PARSE_RESULT),
			"hadith-narrator-extraction": JSON.stringify(EXTRACTION),
			"hadith-variants": JSON.stringify(VARIANTS_WITH_TWO),
		},
	},
	{
		id: "S12",
		url: `${BASE}/dashboard`,
		state: {
			"hadith-input-raw": HADITH,
			"hadith-parse-result": JSON.stringify(PARSE_RESULT),
			"hadith-narrator-extraction": JSON.stringify(EXTRACTION),
			"hadith-variants": JSON.stringify(VARIANTS_WITH_TWO),
		},
	},
	{
		id: "S13",
		url: `${BASE}/dashboard`,
		tab: "diff",
		state: {
			"hadith-input-raw": HADITH,
			"hadith-parse-result": JSON.stringify(PARSE_RESULT),
			"hadith-narrator-extraction": JSON.stringify(EXTRACTION),
			"hadith-variants": JSON.stringify(VARIANTS_WITH_TWO),
		},
	},
	{
		id: "S15",
		url: `${BASE}/dashboard`,
		state: {
			"hadith-input-raw": HADITH,
			"hadith-parse-result": JSON.stringify(PARSE_RESULT),
			"hadith-narrator-extraction": JSON.stringify(EXTRACTION),
		},
	},
	{ id: "S17", url: `${BASE}/dashboard`, state: {}, clickSettings: true },
];

// ── CDP client (Node 24 built-in WebSocket) ────────────────────────────────────
class CDP {
	constructor(ws) {
		this.ws = ws;
		this.id = 0;
		this.pending = new Map();
		this.events = new Map();
		ws.addEventListener("message", ({ data }) => {
			const msg = JSON.parse(data);
			if (msg.id !== undefined) {
				const r = this.pending.get(msg.id);
				if (r) {
					this.pending.delete(msg.id);
					r(msg);
				}
			} else if (msg.method) {
				const cbs = this.events.get(msg.method) ?? [];
				for (const cb of cbs) cb(msg.params);
			}
		});
	}

	send(method, params = {}) {
		return new Promise((resolve, reject) => {
			const id = ++this.id;
			this.pending.set(id, (msg) => {
				if (msg.error) reject(new Error(`CDP ${method}: ${msg.error.message}`));
				else resolve(msg.result);
			});
			this.ws.send(JSON.stringify({ id, method, params }));
		});
	}

	on(event, cb) {
		const arr = this.events.get(event) ?? [];
		arr.push(cb);
		this.events.set(event, arr);
	}
}

async function fetchJSON(url) {
	const res = await fetch(url);
	return res.json();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
	const requested = process.argv.slice(2);
	const toRun = requested.length
		? SCREENS.filter((s) => requested.includes(s.id))
		: SCREENS;

	console.log(`→ Starting Chrome on port ${DEBUG_PORT}…`);
	const chrome = spawn(
		CHROME,
		[
			`--remote-debugging-port=${DEBUG_PORT}`,
			"--headless=new",
			"--disable-gpu",
			"--no-sandbox",
			"--disable-dev-shm-usage",
			"--window-size=1440,900",
			"--user-data-dir=/tmp/chrome-diff-profile",
			"about:blank",
		],
		{ stdio: "ignore", detached: true },
	);

	await sleep(2000);

	let tabs;
	for (let i = 0; i < 5; i++) {
		try {
			tabs = await fetchJSON(`http://localhost:${DEBUG_PORT}/json`);
			break;
		} catch {
			await sleep(800);
		}
	}
	if (!tabs) throw new Error("Chrome did not start");

	const wsUrl = tabs[0].webSocketDebuggerUrl;
	const ws = new WebSocket(wsUrl);
	await new Promise((r) => ws.addEventListener("open", r));
	const cdp = new CDP(ws);

	await cdp.send("Page.enable");
	await cdp.send("Network.enable");

	for (const screen of toRun) {
		console.log(`\n── ${screen.id} ─────────────────────────────────────`);

		// 1. Navigate to app root to set localStorage in same origin
		await cdp.send("Page.navigate", { url: `${BASE}/` });
		await sleep(600);

		// 2. Inject localStorage
		if (Object.keys(screen.state).length > 0) {
			const entries = Object.entries(screen.state)
				.map(
					([k, v]) =>
						`localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)})`,
				)
				.join(";\n");
			await cdp.send("Runtime.evaluate", { expression: entries });
			console.log(`   localStorage: ${Object.keys(screen.state).join(", ")}`);
		} else {
			// Clear state for empty screens
			await cdp.send("Runtime.evaluate", {
				expression: `['hadith-input-raw','hadith-parse-result','hadith-narrator-extraction','hadith-variants'].forEach(k=>localStorage.removeItem(k))`,
			});
		}

		// 3. Navigate to target URL
		await cdp.send("Page.navigate", { url: screen.url });
		await new Promise((resolve) => {
			const done = (params) => {
				if (params?.frameId) {
					cdp.events.delete("Page.loadEventFired");
					resolve();
				}
			};
			cdp.on("Page.loadEventFired", done);
			setTimeout(resolve, 4000); // fallback timeout
		});
		await sleep(800);

		// 4. Click tab if needed (chain or diff)
		if (screen.tab) {
			const tabText = screen.tab === "chain" ? "السلسلة" : "المقارنة";
			await cdp.send("Runtime.evaluate", {
				expression: `
          (function() {
            const btns = [...document.querySelectorAll('button')];
            const t = btns.find(b => b.textContent.includes('${tabText}'));
            if (t) t.click();
          })()
        `,
			});
			await sleep(800);
		}

		// 5. Click settings gear if needed
		if (screen.clickSettings) {
			await cdp.send("Runtime.evaluate", {
				expression: `
          (function() {
            const btns = [...document.querySelectorAll('button')];
            const gear = btns.find(b => b.querySelector('svg') && b.closest('header'));
            if (gear) gear.click();
          })()
        `,
			});
			await sleep(600);
		}

		// 6. Screenshot
		const { data } = await cdp.send("Page.captureScreenshot", {
			format: "png",
			quality: 100,
			captureBeyondViewport: false,
		});

		const outPath = `${OUT}browser-${screen.id}.png`;
		writeFileSync(outPath, Buffer.from(data, "base64"));
		console.log(`   ✓ saved → ${outPath}`);
	}

	ws.close();
	chrome.kill();
	console.log("\n✓ Done.");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
