/** Host-provided splash art shown in the welcome banner in place of the
 *  built-in `omp` wordmark. The coding agent reads `startup.splashArt` from
 *  settings and pushes the file's text here; the TUI renders it with the same
 *  gradient as the logo. `null` restores the default look. Process-local. */
let override: string | null = null;
/** Monotonic counter bumped on every override change, so render caches can self-check. */
let overrideVersion = 0;

export function setSplashArtOverride(text: string | null): void {
	override = text === null || text.trim() === "" ? null : text.replace(/\r\n/g, "\n").replace(/\n+$/, "");
	overrideVersion++;
}

export function getSplashArtOverride(): string | null {
	return override;
}

export function splashArtVersion(): number {
	return overrideVersion;
}
