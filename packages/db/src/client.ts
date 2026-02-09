import { ConvexHttpClient } from "convex/browser";
import { ENV } from "@ffh/env";

export const convex = new ConvexHttpClient(ENV.CONVEX_URL);
