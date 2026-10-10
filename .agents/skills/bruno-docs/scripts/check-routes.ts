// Compara as rotas registradas no backend com as requisições da collection Bruno.
// Uso (na raiz do repositório): bun .agents/skills/bruno-docs/scripts/check-routes.ts
// Sai com código 1 quando há rota sem .bru ou .bru sem rota.

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const ROUTES_INDEX = join(ROOT, "backend/src/routes/index.ts");
const MODULES_DIR = join(ROOT, "backend/src/modules");
const BRUNO_DIR = join(ROOT, "docs/backend/collections/bruno");

const METHODS = "get|post|put|patch|delete";

type Endpoint = { method: string; path: string; source: string };

function walk(dir: string, match: (file: string) => boolean): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, match);
    return match(entry.name) ? [full] : [];
  });
}

function normalize(path: string): string {
  const clean = path.split("?")[0].replace(/\/+$/, "");
  return clean === "" ? "/" : clean;
}

function key(e: Endpoint): string {
  return `${e.method} ${e.path}`;
}

function routesIn(file: string): Map<string, { method: string; path: string }[]> {
  const byRouter = new Map<string, { method: string; path: string }[]>();
  const pattern = new RegExp(
    `(\\w+)\\.(${METHODS})\\(\\s*["'\`]([^"'\`]*)["'\`]`,
    "g",
  );
  for (const [, router, method, path] of readFileSync(file, "utf8").matchAll(
    pattern,
  )) {
    const list = byRouter.get(router) ?? [];
    list.push({ method: method.toUpperCase(), path });
    byRouter.set(router, list);
  }
  return byRouter;
}

function backendEndpoints(): Endpoint[] {
  // O prefixo /api/v1 fica de fora: na collection ele faz parte de {{baseUrl}}.
  const index = readFileSync(ROUTES_INDEX, "utf8");

  // nome do router exportado -> prefixos onde foi montado
  const mounts = new Map<string, string[]>();
  for (const [, mount, router] of index.matchAll(
    /\.use\(\s*["'`]([^"'`]*)["'`]\s*,\s*(\w+)/g,
  )) {
    mounts.set(router, [...(mounts.get(router) ?? []), mount]);
  }

  const endpoints: Endpoint[] = [];
  const files = [
    ROUTES_INDEX,
    ...walk(MODULES_DIR, (name) => name.endsWith(".routes.ts")),
  ];

  for (const file of files) {
    const source = relative(ROOT, file).replaceAll("\\", "/");
    for (const [router, routes] of routesIn(file)) {
      const bases = file === ROUTES_INDEX ? [""] : mounts.get(router);
      if (!bases) {
        console.warn(`! ${source}: router "${router}" não está montado em routes/index.ts`);
        continue;
      }
      for (const base of bases) {
        for (const route of routes) {
          endpoints.push({
            method: route.method,
            path: normalize(base + route.path),
            source,
          });
        }
      }
    }
  }
  return endpoints;
}

function brunoEndpoints(): Endpoint[] {
  const pattern = new RegExp(
    `^(${METHODS})\\s*\\{[^}]*?url:\\s*\\{\\{baseUrl\\}\\}(\\S*)`,
    "m",
  );
  return walk(BRUNO_DIR, (name) => name.endsWith(".bru")).flatMap((file) => {
    const match = readFileSync(file, "utf8").match(pattern);
    if (!match) return [];
    return [
      {
        method: match[1].toUpperCase(),
        path: normalize(match[2]),
        source: relative(ROOT, file).replaceAll("\\", "/"),
      },
    ];
  });
}

const backend = backendEndpoints();
const bruno = brunoEndpoints();
const backendKeys = new Set(backend.map(key));
const brunoKeys = new Set(bruno.map(key));

const missing = backend.filter((e) => !brunoKeys.has(key(e)));
const stale = bruno.filter((e) => !backendKeys.has(key(e)));

console.log(`Rotas no backend: ${backendKeys.size} | Requisições Bruno: ${bruno.length}`);

if (missing.length) {
  console.log("\nSem requisição na collection Bruno:");
  for (const e of missing) console.log(`  ${key(e)}  (${e.source})`);
}

if (stale.length) {
  console.log("\nRequisições Bruno sem rota correspondente:");
  for (const e of stale) console.log(`  ${key(e)}  (${e.source})`);
}

if (!missing.length && !stale.length) {
  console.log("\nCollection Bruno cobre todas as rotas.");
}

process.exit(missing.length || stale.length ? 1 : 0);
