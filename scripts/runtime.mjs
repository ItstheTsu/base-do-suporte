import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

export function supportedNode(version = process.versions.node) {
  return [24, 26].includes(Number(version.split(".")[0]));
}

export function npmCli() {
  const bin = dirname(process.execPath);
  const candidates = [
    join(bin, "node_modules/npm/bin/npm-cli.js"),
    resolve(bin, "../lib/node_modules/npm/bin/npm-cli.js"),
    "/usr/share/nodejs/npm/bin/npm-cli.js",
    process.env.npm_execpath?.endsWith("npm-cli.js") ? process.env.npm_execpath : "",
  ];
  const file = candidates.find(path => path && existsSync(path));
  if (!file) throw new Error("O npm não foi encontrado. Repare a instalação oficial do Node.js com npm.");
  return file;
}

export function runNpm(args, { cwd, quiet = false } = {}) {
  const result = spawnSync(process.execPath, [npmCli(), ...args], {
    cwd, stdio: quiet ? "ignore" : "inherit", shell: false,
  });
  if (result.error) throw result.error;
  return result.status === 0;
}
