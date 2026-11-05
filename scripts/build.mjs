import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runNode } from "./runtime.mjs";

const root=fileURLToPath(new URL("../",import.meta.url));
for(const [entry,args] of [["node_modules/typescript/bin/tsc",["-b"]],["node_modules/vite/bin/vite.js",["build"]]]){
 if(!runNode([resolve(root,entry),...args],{cwd:root}))process.exit(1);
}
