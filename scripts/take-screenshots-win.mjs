/**
 * take-screenshots-win.mjs
 * Windows-native version — run via Windows Node.js so CDP on 127.0.0.1 is reachable.
 *
 * Usage (from WSL2):
 *   "/mnt/c/Program Files/nodejs/node.exe" \
 *     "C:\\Users\\nonom\\Claude_work\\hadith-path\\scripts\\take-screenshots-win.mjs" \
 *     [S00 S01 ...]
 */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

// ── Config ────────────────────────────────────────────────────────────────────
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3001";
const OUT = "C:\\Users\\nonom\\Claude_work\\hadith-path\\screenshots\\";
const DEBUG_PORT = 9223;

mkdirSync(OUT, { recursive: true });

// ── Fixture data ──────────────────────────────────────────────────────────────
const HADITH =
	"حَدَّثَنَا الْحُمَيْدِيُّ عَبْدُ اللَّهِ بْنُ الزُّبَيْرِ، قَالَ: حَدَّثَنَا سُفْيَانُ، قَالَ: حَدَّثَنَا يَحْيَى بْنُ سَعِيدٍ الأَنْصَارِيُّ، قَالَ: أَخْبَرَنِي مُحَمَّدُ بْنُ إِبْرَاهِيمَ التَّيْمِيُّ، أَنَّهُ سَمِعَ عَلْقَمَةَ بْنَ وَقَّاصٍ اللَّيْثِيَّ، يَقُولُ: سَمِعْتُ عُمَرَ بْنَ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ عَلَى الْمِنْبَرِ قَالَ: سَمِعْتُ رَسُولَ اللَّهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ يَقُولُ: إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى دُنْيَا يُصِيبُهَا، أَوْ إِلَى امْرَأَةٍ يَنْكِحُهَا، فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ.";

const SPLIT_AT = 347;
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

const VARIANT3_HADITH =
	"حَدَّثَنَا عَبْدُ اللَّهِ بْنُ يُوسُفَ قَالَ أَخْبَرَنَا مَالِكٌ عَنِ ابْنِ شِهَابٍ عَنْ أَنَسِ بْنِ مَالِكٍ أَنَّ رَسُولَ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ قَالَ إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَلِكُلِّ امْرِئٍ مَا نَوَى.";

const V3_PARSE = {
	inputHash: "ccccdddd",
	llmSplitAt: 135,
	splitAt: 135,
	corrected: false,
};

const VARIANTS_WITH_THREE = [
	...VARIANTS_WITH_TWO,
	{
		id: "v3",
		label: "نسخة ٣",
		rawText: VARIANT3_HADITH,
		color: "#D97706",
		parseResult: V3_PARSE,
		narratorExtraction: { inputHash: "ccccdddd", narrators: [] },
	},
];

// Each screen: id, url, tab (which dashboard tab), state to inject
const SCREENS = [
	{ id: "S00", url: `${BASE}/`, state: {} },
	{ id: "S01", url: `${BASE}/dashboard`, state: {} },
	{
		// S02: parsing/loading state — intercept fetch then click submit
		id: "S02",
		url: `${BASE}/dashboard`,
		state: {
			"hadith-input-raw": HADITH,
			"hadith-api-key-claude": "sk-ant-screenshot-fake",
		},
		interceptFetchAndClickSubmit: true,
	},
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
		// S06: disambiguation panel open — click ambiguous narrator at position 1
		id: "S06",
		url: `${BASE}/dashboard`,
		state: {
			"hadith-input-raw": HADITH,
			"hadith-parse-result": JSON.stringify(PARSE_RESULT),
			"hadith-narrator-extraction": JSON.stringify(EXTRACTION),
		},
		clickNarratorAtPosition: 1,
	},
	{
		// S07: add custom narrator form — click ambiguous narrator then "إضافة راوٍ جديد"
		id: "S07",
		url: `${BASE}/dashboard`,
		state: {
			"hadith-input-raw": HADITH,
			"hadith-parse-result": JSON.stringify(PARSE_RESULT),
			"hadith-narrator-extraction": JSON.stringify(EXTRACTION),
		},
		clickNarratorAtPosition: 1,
		thenClickAddCustom: true,
	},
	{
		id: "S08",
		url: `${BASE}/dashboard`,
		state: {
			"hadith-input-raw": HADITH,
			"hadith-parse-result": JSON.stringify(PARSE_RESULT),
			"hadith-narrator-extraction": JSON.stringify(EXTRACTION),
		},
		clickSelector: 'button[aria-label="split-correction"]',
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
		// S11: narrator bio drawer — click a chain node to show the bio card
		id: "S11",
		url: `${BASE}/dashboard`,
		state: {
			"hadith-input-raw": HADITH,
			"hadith-parse-result": JSON.stringify(PARSE_RESULT),
			"hadith-narrator-extraction": JSON.stringify(EXTRACTION),
		},
		clickChainNode: true,
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
		// S14: diff side-by-side with 3 variants — click المقارنة then Split
		id: "S14",
		url: `${BASE}/dashboard`,
		tab: "diff",
		state: {
			"hadith-input-raw": HADITH,
			"hadith-parse-result": JSON.stringify(PARSE_RESULT),
			"hadith-narrator-extraction": JSON.stringify(EXTRACTION),
			"hadith-variants": JSON.stringify(VARIANTS_WITH_THREE),
		},
		thenClickSplit: true,
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
	{
		// S16: import confirmation dialog — trigger file input change event
		id: "S16",
		url: `${BASE}/dashboard`,
		state: {
			"hadith-input-raw": HADITH,
			"hadith-parse-result": JSON.stringify(PARSE_RESULT),
			"hadith-narrator-extraction": JSON.stringify(EXTRACTION),
		},
		triggerImportDialog: true,
	},
	{
		id: "S17",
		url: `${BASE}/`,
		state: {
			"hadith-custom-narrators": JSON.stringify([
				{
					id: "custom-1",
					nameArabic: "راوٍ مخصص للاختبار",
					nameTransliterated: "Rawi Mukhassas",
					birthYear: null,
					deathYear: null,
					generation: "",
					reliabilityGrade: "",
					teachers: [],
					students: [],
					collections: [],
				},
			]),
		},
		clickSettings: true,
	},
];

// ── CDP client ────────────────────────────────────────────────────────────────
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
			"--hide-scrollbars",
			"--user-data-dir=C:\\Temp\\chrome-diff-profile",
			"about:blank",
		],
		{ stdio: "pipe", shell: false },
	);

	// Log Chrome stderr so we can see the DevTools URL
	let chromeReady = false;
	chrome.stderr.on("data", (buf) => {
		const line = buf.toString();
		if (line.includes("DevTools listening")) {
			chromeReady = true;
			console.log("  ", line.trim());
		}
	});

	// Wait for Chrome to be ready
	for (let i = 0; i < 10; i++) {
		await sleep(500);
		if (chromeReady) break;
	}
	await sleep(500);

	let tabs;
	for (let i = 0; i < 8; i++) {
		try {
			const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
			tabs = await res.json();
			break;
		} catch {
			await sleep(600);
		}
	}
	if (!tabs) throw new Error("Chrome did not start — no response on CDP port");

	const wsUrl = tabs[0].webSocketDebuggerUrl;
	console.log(`→ Connecting to ${wsUrl}`);
	const ws = new WebSocket(wsUrl);
	await new Promise((r) => ws.addEventListener("open", r));
	const cdp = new CDP(ws);

	await cdp.send("Page.enable");
	await cdp.send("Network.enable");
	await cdp.send("Emulation.setDeviceMetricsOverride", {
		width: 1440,
		height: 900,
		deviceScaleFactor: 1,
		mobile: false,
	});

	for (const screen of toRun) {
		console.log(`\n── ${screen.id} ─────────────────────────────────────`);

		// 1. Navigate to app root on same origin to allow localStorage write
		await cdp.send("Page.navigate", { url: `${BASE}/` });
		await sleep(800);

		// 2. Inject or clear localStorage
		if (Object.keys(screen.state).length > 0) {
			// Clear first, then set
			await cdp.send("Runtime.evaluate", {
				expression: `['hadith-input-raw','hadith-parse-result','hadith-narrator-extraction','hadith-variants','hadith-custom-narrators','hadith-api-key-claude'].forEach(k=>localStorage.removeItem(k))`,
			});
			const entries = Object.entries(screen.state)
				.map(
					([k, v]) =>
						`localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)})`,
				)
				.join(";\n");
			await cdp.send("Runtime.evaluate", { expression: entries });
			console.log(`   localStorage: ${Object.keys(screen.state).join(", ")}`);
		} else {
			await cdp.send("Runtime.evaluate", {
				expression: `['hadith-input-raw','hadith-parse-result','hadith-narrator-extraction','hadith-variants','hadith-custom-narrators','hadith-api-key-claude'].forEach(k=>localStorage.removeItem(k))`,
			});
			console.log("   localStorage: cleared");
		}

		// 3. Navigate to target URL and wait for load
		await cdp.send("Page.navigate", { url: screen.url });
		await new Promise((resolve) => {
			let resolved = false;
			const done = () => {
				if (!resolved) {
					resolved = true;
					resolve();
				}
			};
			cdp.on("Page.loadEventFired", done);
			setTimeout(done, 5000);
		});
		await sleep(1200);

		// 4. Click tab if needed
		if (screen.tab) {
			const tabText = screen.tab === "chain" ? "السلسلة" : "المقارنة";
			await cdp.send("Runtime.evaluate", {
				expression: `(function(){
          const btns=[...document.querySelectorAll('button')];
          const t=btns.find(b=>b.textContent.includes('${tabText}'));
          if(t){t.click();return 'clicked '+t.textContent.trim();}
          return 'not found';
        })()`,
			});
			await sleep(1000);
		}

		// 5. Click settings gear if needed
		if (screen.clickSettings) {
			await cdp.send("Runtime.evaluate", {
				expression: `(function(){
          const btns=[...document.querySelectorAll('button')];
          const gear=btns.find(b=>b.querySelector('svg')&&b.closest('header'));
          if(gear){gear.click();return 'clicked';}
          return 'not found';
        })()`,
			});
			await sleep(800);
		}

		// 5b. Intercept fetch then click submit (S02 loading state)
		if (screen.interceptFetchAndClickSubmit) {
			await cdp.send("Runtime.evaluate", {
				expression:
					"window.fetch = function() { return new Promise(()=>{}); };",
			});
			const r = await cdp.send("Runtime.evaluate", {
				expression: `(function(){
          const btns=[...document.querySelectorAll('button')];
          const btn=btns.find(b=>b.textContent.trim().includes('تحليل الحديث'));
          if(btn){btn.click();return 'clicked';}
          return 'not found';
        })()`,
			});
			console.log(`   fetch intercepted, submit: ${r.result?.value}`);
			await sleep(700);
		}

		// 5c. Click narrator row at given position index
		if (screen.clickNarratorAtPosition !== undefined) {
			const pos = screen.clickNarratorAtPosition;
			const r = await cdp.send("Runtime.evaluate", {
				expression: `(function(){
          const items=[...document.querySelectorAll('li[role="button"]')];
          if(items.length>${pos}){items[${pos}].click();return 'clicked '+${pos};}
          return 'not found, total: '+items.length;
        })()`,
			});
			console.log(`   narrator click: ${r.result?.value}`);
			await sleep(700);
		}

		// 5d. Click "إضافة راوٍ جديد" inside disambiguation panel
		if (screen.thenClickAddCustom) {
			const r = await cdp.send("Runtime.evaluate", {
				expression: `(function(){
          const btns=[...document.querySelectorAll('button')];
          const btn=btns.find(b=>b.textContent.includes('إضافة راوٍ جديد'));
          if(btn){btn.click();return 'clicked';}
          return 'not found';
        })()`,
			});
			console.log(`   add custom click: ${r.result?.value}`);
			await sleep(500);
		}

		// 5e. Click first ReactFlow chain node (S11 bio drawer)
		if (screen.clickChainNode) {
			await sleep(1800); // extra wait for ReactFlow to layout
			const r = await cdp.send("Runtime.evaluate", {
				expression: `(function(){
          const node=document.querySelector('.react-flow__node');
          if(node){node.click();return 'clicked';}
          return 'not found';
        })()`,
			});
			console.log(`   chain node click: ${r.result?.value}`);
			await sleep(700);
		}

		// 5f. Click "Split" button inside DiffView (S14)
		if (screen.thenClickSplit) {
			const r = await cdp.send("Runtime.evaluate", {
				expression: `(function(){
          const btns=[...document.querySelectorAll('button')];
          const btn=btns.find(b=>b.textContent.trim()==='Split');
          if(btn){btn.click();return 'clicked';}
          return 'not found';
        })()`,
			});
			console.log(`   split click: ${r.result?.value}`);
			await sleep(500);
		}

		// 5g. Trigger import confirmation dialog (S16)
		if (screen.triggerImportDialog) {
			const r = await cdp.send("Runtime.evaluate", {
				expression: `(function(){
          const input=document.querySelector('input[type="file"][accept=".json"]');
          if(!input) return 'no input';
          const file=new File(['{"test":true}'],'import.json',{type:'application/json'});
          const dt=new DataTransfer();
          dt.items.add(file);
          Object.defineProperty(input,'files',{get(){return dt.files;},configurable:true});
          input.dispatchEvent(new Event('change',{bubbles:true}));
          return 'dispatched';
        })()`,
			});
			console.log(`   import dialog: ${r.result?.value}`);
			await sleep(600);
		}

		// 6. Hide dev-only toolbars — target fixed full-width bottom bars (≤100px tall)
		await cdp.send("Runtime.evaluate", {
			expression: `(function(){
        document.querySelectorAll('*').forEach(el => {
          const st = window.getComputedStyle(el);
          if (st.position !== 'fixed') return;
          const r = el.getBoundingClientRect();
          const atBottom = r.bottom >= window.innerHeight - 5;
          const short    = r.height <= 100;
          const wide     = r.width  >= window.innerWidth * 0.5;
          if (atBottom && short && wide) {
            el.style.setProperty('display', 'none', 'important');
          }
        });
      })()`,
		});
		await sleep(100);

		// 7. Take screenshot
		const { data } = await cdp.send("Page.captureScreenshot", {
			format: "png",
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
	console.error("ERROR:", err.message);
	process.exit(1);
});
