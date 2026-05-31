// Takes two README screenshots:
//   docs/screenshot-input.png  — pre-parse (empty input state)
//   docs/screenshot-dashboard.png — post-parse dashboard (chain visualization)
import { writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 9223;
const BASE = "http://localhost:3003";

const HADITH =
	"حَدَّثَنَا الْحُمَيْدِيُّ عَبْدُ اللَّهِ بْنُ الزُّبَيْرِ، قَالَ: حَدَّثَنَا سُفْيَانُ، قَالَ: حَدَّثَنَا يَحْيَى بْنُ سَعِيدٍ الأَنْصَارِيُّ، قَالَ: أَخْبَرَنِي مُحَمَّدُ بْنُ إِبْرَاهِيمَ التَّيْمِيُّ، أَنَّهُ سَمِعَ عَلْقَمَةَ بْنَ وَقَّاصٍ اللَّيْثِيَّ، يَقُولُ: سَمِعْتُ عُمَرَ بْنَ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ عَلَى الْمِنْبَرِ قَالَ: سَمِعْتُ رَسُولَ اللَّهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ يَقُولُ: إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى دُنْيَا يُصِيبُهَا، أَوْ إِلَى امْرَأَةٍ يَنْكِحُهَا، فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ.";

const PARSE = JSON.stringify({
	inputHash: "c54e9901",
	llmSplitAt: 347,
	splitAt: 347,
	corrected: false,
});

const NARRATORS = JSON.stringify({
	inputHash: "178ec5d2",
	narrators: [
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
	],
});

class CDP {
	constructor(ws) {
		this.ws = ws;
		this.id = 0;
		this.pending = new Map();
		ws.addEventListener("message", ({ data }) => {
			const msg = JSON.parse(data);
			if (msg.id !== undefined) {
				const r = this.pending.get(msg.id);
				if (r) {
					this.pending.delete(msg.id);
					r(msg);
				}
			}
		});
	}
	send(method, params = {}) {
		return new Promise((resolve, reject) => {
			const id = ++this.id;
			this.pending.set(id, (msg) => {
				if (msg.error) reject(new Error(`${method}: ${msg.error.message}`));
				else resolve(msg.result);
			});
			this.ws.send(JSON.stringify({ id, method, params }));
		});
	}
}

async function snap(cdp, path, width = 1400, height = 900) {
	await cdp.send("Emulation.setDeviceMetricsOverride", {
		width,
		height,
		deviceScaleFactor: 2,
		mobile: false,
	});
	await sleep(400);
	const { data } = await cdp.send("Page.captureScreenshot", {
		format: "png",
		clip: { x: 0, y: 0, width, height, scale: 1 },
	});
	writeFileSync(path, Buffer.from(data, "base64"));
	console.log("saved", path);
}

async function main() {
	const tabs = await fetch(`http://localhost:${PORT}/json`).then((r) =>
		r.json(),
	);
	const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
	await new Promise((r) => ws.addEventListener("open", r));
	const cdp = new CDP(ws);
	await cdp.send("Page.enable");

	// ── Screenshot 1: pre-parse input state ──────────────────────────────────
	await cdp.send("Page.navigate", { url: `${BASE}/` });
	await sleep(800);
	await cdp.send("Page.reload", { ignoreCache: true });
	await sleep(1500);
	await cdp.send("Runtime.evaluate", {
		expression: "localStorage.clear(); 'ok'",
	});
	await cdp.send("Page.navigate", { url: `${BASE}/dashboard` });
	await sleep(1500);
	await snap(cdp, "docs/screenshot-input.png", 1400, 760);

	// ── Screenshot 2: post-parse dashboard ───────────────────────────────────
	await cdp.send("Runtime.evaluate", {
		expression: `
      localStorage.setItem('hadith-input-raw', ${JSON.stringify(HADITH)});
      localStorage.setItem('hadith-parse-result', ${JSON.stringify(PARSE)});
      localStorage.setItem('hadith-narrator-extraction', ${JSON.stringify(NARRATORS)});
      'ok'
    `,
	});
	await cdp.send("Page.navigate", { url: `${BASE}/dashboard` });
	await sleep(4000);
	await snap(cdp, "docs/screenshot-dashboard.png", 1400, 900);

	ws.close();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
