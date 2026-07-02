import { NextResponse } from "next/server";
import packageJson from "@/package.json";

// GIT_SHA isn't available inside a Docker image by default — .git is
// excluded from the build context (.dockerignore). Pass it at build time:
// `docker build --build-arg GIT_SHA=$(git rev-parse --short HEAD) .`
// (see docs/self-hosting/docker.md). Falls back to "unknown" otherwise.
export async function GET() {
  return NextResponse.json({
    name: packageJson.name,
    version: packageJson.version,
    gitSha: process.env.GIT_SHA || "unknown",
  });
}
