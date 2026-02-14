import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";

export const { fontFamily: fontDisplay } = loadBricolage("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
});

export const { fontFamily: fontBody } = loadDMSans("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
});

export const { fontFamily: fontMono } = loadJetBrains("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
});
