import { readFile } from "node:fs/promises";
import path from "node:path";
import { useDevStore } from "@/lib/env";
import { devLogoDir } from "@/lib/store/dev";

const TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
};

export async function GET(_request: Request, ctx: RouteContext<"/api/dev/logo/[name]">) {
  if (!useDevStore) return new Response("Not found", { status: 404 });
  const name = path.basename((await ctx.params).name);
  const type = TYPES[name.split(".").pop() ?? ""];
  if (!type) return new Response("Not found", { status: 404 });
  try {
    const file = await readFile(path.join(devLogoDir, name));
    return new Response(file, {
      headers: {
        "content-type": type,
        "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
