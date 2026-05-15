#!/usr/bin/env bun
/**
 * Scrapes narrator records from Dorar.net and writes
 * public/data/narrators.json in the canonical BundledDB format.
 *
 * Usage:
 *   bun run scripts/scrape-narrators.ts
 *
 * The output file is committed to the repository. Application code
 * requires no changes — it fetches /data/narrators.json at runtime.
 *
 * Schema validation:
 *   After running, verify the output with:
 *   bun -e "const d=require('./public/data/narrators.json'); console.log(d.meta, d.narrators.length)"
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NarratorRecord {
	id: string;
	nameArabic: string;
	nameTransliterated: string;
	birthYear: number | null;
	deathYear: number | null;
	generation: "Sahabi" | "Tabi'i" | "Tabi' al-Tabi'in" | "later";
	reliabilityGrade: string;
	teachers: string[];
	students: string[];
	collections: string[];
	bioNote: string;
}

interface BundledDB {
	meta: {
		generatedAt: string;
		recordCount: number;
		source: string;
	};
	narrators: NarratorRecord[];
}

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_URL = "https://dorar.net";
const TARGET_COUNT = 10_000;
// Dorar.net narrator list sorted by hadith frequency across major collections
const LIST_URL = `${BASE_URL}/hadith/narrators`;
const DELAY_MS = 300; // polite delay between requests

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(_nameArabic: string, index: number): string {
	// Produce a stable opaque ID — not localised, just positional
	return `dorar-${index}`;
}

function parseDeathYear(text: string): number | null {
	const match = text.match(/(\d{3,4})\s*هـ/);
	return match ? Number.parseInt(match[1], 10) : null;
}

function parseGeneration(text: string): NarratorRecord["generation"] {
	if (/صحاب/.test(text)) return "Sahabi";
	if (/تابع التابعين/.test(text)) return "Tabi' al-Tabi'in";
	if (/تابع/.test(text)) return "Tabi'i";
	return "later";
}

function extractCollections(html: string): string[] {
	const collections: string[] = [];
	if (/البخاري/.test(html)) collections.push("Bukhari");
	if (/مسلم/.test(html)) collections.push("Muslim");
	if (/الترمذي/.test(html)) collections.push("Tirmidhi");
	if (/أبو داود/.test(html)) collections.push("Abu Dawud");
	if (/النسائي/.test(html)) collections.push("Nasai");
	if (/ابن ماجه/.test(html)) collections.push("Ibn Majah");
	if (/الموطأ/.test(html)) collections.push("Muwatta");
	return collections;
}

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function fetchHtml(url: string): Promise<string> {
	const res = await fetch(url, {
		headers: {
			"User-Agent":
				"hadith-path-scraper/1.0 (research tool; contact: maintainer)",
			Accept: "text/html",
		},
	});
	if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
	return res.text();
}

/** Extract narrator page URLs from a listing page. */
function extractNarratorLinks(html: string): string[] {
	const links: string[] = [];
	// Dorar.net narrator links follow /hadith/narrator/{id}
	const re = /href="(\/hadith\/narrator\/[^"]+)"/g;
	for (const m of html.matchAll(re)) {
		const url = `${BASE_URL}${m[1]}`;
		if (!links.includes(url)) links.push(url);
	}
	return links;
}

/** Extract next-page URL from a listing page, or null if last page. */
function extractNextPage(html: string): string | null {
	const m = html.match(/href="(\/hadith\/narrators\?[^"]*page=[^"]+)"/);
	if (!m) return null;
	return `${BASE_URL}${m[1]}`;
}

/** Parse a single narrator page into a partial NarratorRecord. */
function parseNarratorPage(html: string, index: number): NarratorRecord {
	// Arabic name — look for the main heading
	const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
	const nameArabic = nameMatch ? nameMatch[1].trim() : "";

	// Transliteration — Dorar.net may not provide this; leave empty
	const nameTransliterated = "";

	// Death year
	const deathYear = parseDeathYear(html);

	// Generation
	const generation = parseGeneration(html);

	// Reliability grade — look for common hadith criticism terms
	const gradeMatch = html.match(/الحكم[^:]*:\s*([^\n<]+)/);
	const reliabilityGrade = gradeMatch ? gradeMatch[1].trim() : "";

	// Collections
	const collections = extractCollections(html);

	// Bio note — first paragraph of the biography section if present
	const bioMatch = html.match(/class="narrator-bio"[^>]*>([^<]{10,300})/);
	const bioNote = bioMatch ? bioMatch[1].trim() : "";

	return {
		id: slugify(nameArabic, index),
		nameArabic,
		nameTransliterated,
		birthYear: null,
		deathYear,
		generation,
		reliabilityGrade,
		teachers: [],
		students: [],
		collections,
		bioNote,
	};
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
	console.log(`Scraping up to ${TARGET_COUNT} narrators from ${BASE_URL}…`);

	const narratorUrls: string[] = [];
	let listUrl: string | null = LIST_URL;

	// Collect narrator page URLs from listing pages
	while (listUrl && narratorUrls.length < TARGET_COUNT) {
		console.log(`  Listing: ${listUrl} (${narratorUrls.length} collected)`);
		const html = await fetchHtml(listUrl);
		const links = extractNarratorLinks(html);
		for (const link of links) {
			if (!narratorUrls.includes(link)) narratorUrls.push(link);
			if (narratorUrls.length >= TARGET_COUNT) break;
		}
		listUrl = extractNextPage(html);
		await sleep(DELAY_MS);
	}

	console.log(
		`Collected ${narratorUrls.length} narrator URLs. Fetching pages…`,
	);

	const narrators: NarratorRecord[] = [];
	for (let i = 0; i < narratorUrls.length; i++) {
		const url = narratorUrls[i];
		try {
			const html = await fetchHtml(url);
			const record = parseNarratorPage(html, i);
			narrators.push(record);
			if ((i + 1) % 100 === 0) {
				console.log(`  ${i + 1}/${narratorUrls.length} done`);
			}
		} catch (err) {
			console.warn(`  Skipping ${url}: ${err}`);
		}
		await sleep(DELAY_MS);
	}

	const output: BundledDB = {
		meta: {
			generatedAt: new Date().toISOString(),
			recordCount: narrators.length,
			source: "dorar.net",
		},
		narrators,
	};

	const outPath = resolve(import.meta.dir, "../public/data/narrators.json");
	writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");

	console.log(`\nDone. Wrote ${narrators.length} records to ${outPath}`);
	console.log(`meta.generatedAt = ${output.meta.generatedAt}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
