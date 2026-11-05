import { once } from "node:events";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { openStore } from "../src/server/store.js";
import { createApp } from "../src/server/app.js";
import { seed } from "../src/server/seed.js";
const store=openStore(":memory:");seed(store);
const server=createApp({store,config:{username:"suporte",passwordHash:"",publicOrigin:"http://localhost:1992",production:true,secureCookies:false,frontendDist:resolve("dist")}}).listen(0,"127.0.0.1");
await once(server,"listening");
try{
 const origin="http://127.0.0.1:"+server.address().port;
 const page=await fetch(origin+"/");assert.equal(page.status,200);const html=await page.text();assert.match(html,/Base do Suporte/);
 const source=html.match(/src="([^"]+\.js)"/)?.[1];assert.ok(source);const response=await fetch(origin+source);assert.equal(response.status,200);assert.match(response.headers.get("cache-control"),/immutable/);
 assert.equal((await fetch(origin+"/admin")).status,200);
 const articles=await(await fetch(origin+"/api/articles")).json();assert.equal(articles.total,5);assert.ok(!("steps" in articles.items[0]));
 assert.equal((await fetch(origin+"/api/articles/sngpc-quantidade-igual-zero")).status,404);
 console.log("Smoke: HTML, bundles, /admin e API na mesma origem; cinco publicados, rascunhos ocultos.");
}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));store.close();}
