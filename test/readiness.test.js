import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { readHealth, waitForHealth } from "../scripts/readiness.mjs";
import { runNpm, supportedNode } from "../scripts/runtime.mjs";

async function fixture(t, handler) {
  const server=createServer(handler).listen(0,"127.0.0.1");await once(server,"listening");
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  return server.address().port;
}
test("a verificação aguarda uma API que demora a ficar pronta",async t=>{
  let ready=false;
  const port=await fixture(t,(_req,res)=>{res.writeHead(ready?200:503,{"Content-Type":"application/json"});res.end(JSON.stringify({status:ready?"ok":"starting",service:"base-do-suporte"}));});
  const timer=setTimeout(()=>{ready=true;},200);t.after(()=>clearTimeout(timer));
  const result=await waitForHealth(port,null,{timeoutMs:2000,intervalMs:25});
  assert.equal(result.status,"ok");
});
test("uma porta com outro serviço gera diagnóstico em vez de confirmar a base",async t=>{
  const port=await fixture(t,(_req,res)=>res.end("<html>outro serviço</html>"));
  assert.equal((await readHealth(port)).ok,false);
  await assert.rejects(waitForHealth(port,null,{timeoutMs:200,intervalMs:20}),error=>error.message.includes("127.0.0.1:"+port)&&error.message.includes("não é JSON"));
});
test("a saída e o sinal do processo aparecem no erro de inicialização",async()=>{
  await assert.rejects(waitForHealth(1992,{exitCode:3,signalCode:null}),/código 3/);
  await assert.rejects(waitForHealth(1992,{exitCode:null,signalCode:"SIGTERM"}),/SIGTERM/);
  await assert.rejects(waitForHealth(1992,{startError:new Error("ENOENT")}),/ENOENT/);
});
test("uma instância diferente não é aceita como confirmação da inicialização",async t=>{
  const port=await fixture(t,(_req,res)=>res.end(JSON.stringify({status:"ok",service:"base-do-suporte",instanceId:"outra"})));
  await assert.rejects(waitForHealth(port,null,{instance:"esperada",timeoutMs:200,intervalMs:20}),/outra instância/);
});
test("o npm é executado pelo Node sem shell intermediário nas versões LTS suportadas",()=>{
  assert.equal(supportedNode("24.22.1"),true);assert.equal(supportedNode("26.13.0"),true);
  assert.equal(supportedNode("25.0.0"),false);assert.equal(supportedNode("22.0.0"),false);
  assert.equal(runNpm(["--version"],{quiet:true}),true);
});
