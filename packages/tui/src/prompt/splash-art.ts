/** Host-provided splash art shown in the welcome banner in place of the
 *  built-in `omp` wordmark. The coding agent reads `startup.splashArt` from
 *  settings and pushes the file's text here; the TUI renders it with the same
 *  gradient as the logo. `null` restores the default look. Process-local.
 *
 *  The text may carry directives as `#`-prefixed lines:
 *
 *      # gradient: #ff4081, #ffd740, #40c4ff   (comma/space hex stops; `none`
 *                                               uses a single flat accent color)
 *      # animate: false                        (on by default)
 *
 *  All remaining lines are the art itself. Unknown `#` lines are ignored, so
 *  plain ASCII art comment headers still render as decorative prefixes... they
 *  are consumed as directives only when they start with a known keyword. */

export interface SplashArt {
	/** Art lines after directive consumption. */
	readonly lines: readonly string[];
	/** Gradient color stops as parsed `[r, g, b]` tuples, or `null` for flat art. */
	readonly stops: readonly [number, number, number][] | null;
	/** Whether the intro gradient sweep/shine animates (default true). */
	readonly animate: boolean;
}

let override: string | null = null;
let parsed: SplashArt | null = null;
/** Monotonic counter bumped on every override change, so render caches can self-check. */
let version = 0;

const DEFAULT_STOPS: readonly [number, number, number][] = [
	[248, 79, 204], // oklch(0.7 0.24 340)
	[147, 98, 244], // oklch(0.62 0.21 295)
	[0, 219, 228], // oklch(0.81 0.14 200)
];

/** Accept `#rgb`, `#rrggbb`; strip alpha components if present. */
function parseHexStop(text: string): [number, number, number] | null {
	const hex = text.trim();
	if (!hex.startsWith("#")) return null;
	const digits = hex.slice(1);
	switch (digits.length) {
		case 3:
			return [
				Number.parseInt(digits[0] + digits[0], 16) || 0,
				Number.parseInt(digits[1] + digits[1], 16) || 0,
				Number.parseInt(digits[2] + digits[2], 16) || 0,
			];
		case 6:
		case 8: {
			const r = Number.parseInt(digits.slice(0, 2), 16) || 0;
			const g = Number.parseInt(digits.slice(2, 4), 16) || 0;
			const b = Number.parseInt(digits.slice(4, 6), 16) || 0;
			return [r, g, b];
		}
		default:
			return null;
	}
}

function parseSplashArt(raw: string): SplashArt {
	const lines = raw.replace(/\r\n/g, "\n").split("\n");
	const art: string[] = [];
	let stops: readonly [number, number, number][] | null = DEFAULT_STOPS;
	let animate = true;
	for (const line of lines) {
		const directive = /^#\s*([a-zA-Z]+)\s*:\s*(.+)$/.exec(line);
		if (directive) {
			const [, key, value] = directive;
			const lowered = key.toLowerCase();
			if (lowered === "gradient") {
				const flat = /(^|\s)none($|\s)|(none|off)/i.test(value.trim());
				if (flat) {
					stops = null;
					continue;
				}
				const parsedStops = value
					.split(/[\s,]+/)
					.map(parseHexStop)
					.filter((stop): stop is [number, number, number] => stop !== null);
				stops = parsedStops.length >= 2 ? parsedStops : parsedStops.length === 1 ? DEFAULT_STOPS : stops;
				continue;
			}
			if (lowered === "animate") {
				animate = !/^(off|no|false|0)$/i.test(value.trim());
				continue;
			}
		}
		art.push(line);
	}
	while (art.length > 0 && art[art.length - 1]?.trim() === "") art.pop();
	return { lines: art, stops, animate };
}

/** Set the raw splash text (directives included) or `null` to restore defaults. */
export function setSplashArtOverride(raw: string | null): void {
	override = raw === null || raw.trim() === "" ? null : raw;
	parsed = override === null ? null : parseSplashArt(override);
	version++;
}

/** Parsed splash art, or `null` when unset. */
export function getSplashArt(): SplashArt | null {
	return parsed;
}

/** Raw override text, or `null` when unset. Kept for host introspection/tests. */
export function getSplashArtOverride(): string | null {
	return override;
}

export function splashArtVersion(): number {
	return version;
}
