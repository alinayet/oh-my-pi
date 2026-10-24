import { afterAll, describe, expect, it } from "bun:test";
import { getSplashArt, setSplashArtOverride, splashArtVersion } from "@oh-my-pi/pi-tui/prompt/splash-art";

afterAll(() => setSplashArtOverride(null));

describe("splash-art parsing", () => {
	it("parses gradient stops, flat mode and animate off", () => {
		setSplashArtOverride("# gradient: #ff4081, #ffd740\n# animate: false\n~ ~ ~\n  art  ");
		expect(getSplashArt()).toEqual({
			lines: ["~ ~ ~", "  art  "],
			stops: [
				[255, 64, 129],
				[255, 215, 64],
			],
			animate: false,
		});
		expect(splashArtVersion()).toBeGreaterThan(0);
	});

	it("supports flat `none` gradients and passthrough directives like # date comments", () => {
		setSplashArtOverride("#gradient: none\n# my scribbles\n~ art ~");
		expect(getSplashArt()).toEqual({ lines: ["# my scribbles", "~ art ~"], stops: null, animate: true });
	});

	it("ignores invalid stops and stays with the built-in palette", () => {
		setSplashArtOverride("# gradient: notacolor #zz\n~ art ~");
		expect(getSplashArt() === null).toBe(false);
		expect(getSplashArt()!.stops!.length).toBeGreaterThanOrEqual(2);
	});

	it("strips trailing blank art lines", () => {
		setSplashArtOverride("~ art ~\n\n\n");
		expect(getSplashArt()!.lines.length).toBe(1);
	});
});
