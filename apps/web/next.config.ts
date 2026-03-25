import { config } from "dotenv";
import path from "path";
import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

config({ path: path.resolve(__dirname, "../../.env") });

const withPWA = withPWAInit({
	dest: "public",
	disable: process.env.NODE_ENV === "development",
	register: true,
	skipWaiting: true,
});

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);
