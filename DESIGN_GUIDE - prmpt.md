You are a senior product designer. Write a comprehensive DESIGN_GUIDE.md in Markdown for my project, modeled on a real reference site I'll point you to.

## My Inputs

- **Project name:** hadith-path
- **What it does (1–2 sentences):** Hadith Path is a client-side web tool for analyzing Islamic hadiths. Think of it like a JSON formatter or a code beautifier but purpose-built for hadith text. A user pastes raw Arabic hadith text and the tool will Parses and separates the isnad, Identifies each narrator, Visualizes the narrator chain and Compares multiple variants of hadith
- **Primary inspiration (URL):** I like this site because of the way they make the json elements collapsible and navigable like a tree: https://www.toptal.com/developers/json-formatter you can see it if you put a json to test, also this site: https://codebeautify.org/jsonviewer have the similar concept. Now when it comes for diff, look at this site: https://hcodx.com/tools/code-diff , the diff is beautiful and its inline not only side by side. This site also, have the same concept: https://diffchecker.dev/
- **Secondary inspirations (optional URLs):** I like the simplicity of this site: https://www.jsonformat.org/ and the general look and feel, also, the look and feel of https://skills.sh but of course not the dark mode and black colour.
- **Voice & feel (3–5 adjectives):** Arabic, simple ai style, elegant, bridge between tech and religion. 
- **Platform-specific UI elements I need (e.g., upload zone, chat bubble, player bar):** visual representation for the sequence of the narrators and beautiful in-line merged diff experience.

## Research Step (do this before writing)

Use your agentbrowser tool on the inspiration URL(s) to capture what static analysis misses:

1. **Fetch the CSS bundle.** Find the main stylesheet from the page source and extract concrete tokens — exact hex values, radii, font stacks, easing curves, durations. Don't guess; cite values from their CSS.
2. **Take screenshots** of: hero, a content section, a card grid, a button in default + hover, the nav, the footer. Reference these when describing the visual language.
3. **Record a short screen capture** (or step through hover/scroll states) to characterize motion personality — is it snappy, smooth, bouncy, restrained? Describe what you observed.
4. **Capture the non-obvious feel** explicitly:
   - **Density:** airy vs. compact (estimate section padding in px)
   - **Contrast philosophy:** soft vs. punchy (where contrast spikes, where it stays muted)
   - **Corner language:** sharp / rounded / pill (give the actual radius range)
   - **Motion personality:** snappy / smooth / bouncy (with the easing + duration that produces it)
   - **Imagery style:** photography / illustration / 3D / none (and how it's framed)

If a tool isn't available, say so — don't fabricate observations.

## Output: a single Markdown file with these sections

1. **Voice & Feel** — adjectives, one-paragraph mood description, reference sites with one-line rationale each.
2. **Color** — core palette (named tokens with hex/RGB/usage), text colors, background colors, border colors, semantic colors (success/warning/error/info), and explicit rules.
3. **Typography** — display + body font families with fallback stacks, full type scale table (size/weight/line-height/letter-spacing/family), weight usage, rules.
4. **Spacing & Layout** — base unit, spacing scale, container widths, page grid, **density verdict** (airy/compact + why).
5. **Radii, Shadows & Borders** — radius scale, **corner language verdict**, shadow philosophy, border conventions.
6. **Components** — copy-pasteable CSS for: buttons (primary/secondary/ghost/icon/small), navigation, cards, sections, inputs, plus the platform-specific components I listed.
7. **Motion** — **personality verdict** (snappy/smooth/bouncy + evidence from your recording), easing curves, duration scale, common transitions, scroll-triggered defaults.
8. **Imagery & Iconography** — **imagery style verdict**, icon library + stroke width.
9. **Contrast Philosophy** — **soft vs. punchy verdict** in one paragraph, with where contrast is punctuated.
10. **Responsive Breakpoints** — table + behavior notes.
11. **Do / Don't** — ~8 bullets each, opinionated.
12. **CSS Custom Properties** — full `:root { --token: value; }` block matching every value used above.

## Constraints

- Derive palette and type from the inspiration's actual CSS, not generic SaaS defaults.
- Every color: token name + hex + usage.
- Every component spec: real, copy-pasteable CSS.
- Be opinionated — state rules as rules.
- Tokens must stay internally consistent: the `:root` block at the end matches every value used earlier.
- No emojis, no filler, no lorem ipsum.
- For Arabic fonts use the Mania's font. I have the font. I can put it in a folder if you need it. Just tell me which folder. 