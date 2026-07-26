import { betterAuth } from "better-auth";
import { authConfig } from "./config.js";

export const auth = betterAuth(authConfig);