import { appendFileSync, closeSync, copyFileSync, existsSync, mkdirSync, openSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { loadEnvFile } from "node:process";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { supportedNode } from "./runtime.mjs";
import { readHealth, waitForHealth } from "./readiness.mjs";

const root=resolve(fileURLToPath(new URL("../",import.meta.url)));
process.chdir(root);
const cache=join(root,".cache"),logs=join(root,"logs");
mkdirSync(cache,{recursive:true});mkdirSync(logs,{recursive:true});
if(!existsSync(".env"))copyFileSync(".env.example",".env");
loadEnvFile(".env");
const statePath=join(cache,"service.json"),readyPath=join(cache,"ready.json"),stopPath=join(cache,"stop.json"),lockPath=join(cache,"manager.lock");
const port=Number(process.env.PORT||1992);
function read(path){try{return JSON.parse(readFileSync(path,"utf8"));}catch{return null;}}
function remove(path){try{unlinkSync(path);}catch(error){if(error.code!=="ENOENT")throw error;}}
function alive(pid){if(!Number.isInteger(pid)||pid<=0)return false;try{process.kill(pid,0);return true;}catch(error){return error.code==="EPERM";}}
function valid(state){return state&&state.projectRoot===root&&Number.isInteger(state.pid)&&/^[a-f0-9-]{36}$/i.test(state.instance||"");}
function openUrl(url){
 if(process.env.BASE_NO_OPEN==="1")return;
 const parsed=new URL(url);if(!["http:","https:"].includes(parsed.protocol))throw new Error("Endereço do site inválido.");
 const processHandle=spawn(process.platform==="win32"?"explorer.exe":"xdg-open",[url],{stdio:"ignore",shell:false});
 processHandle.on("error",()=>{});processHandle.unref();
}
async function prepare(){
 console.log("Preparando a Base do Suporte. Esta etapa mostra os downloads e o build.");
 const logPath=join(logs,"preparacao.log");writeFileSync(logPath,"");
 const task=spawn(process.execPath,[join(root,"scripts/launch.mjs"),"--prepare-only"],{cwd:root,stdio:["inherit","pipe","pipe"],shell:false});
 task.stdout.on("data",chunk=>{process.stdout.write(chunk);appendFileSync(logPath,chunk);});
 task.stderr.on("data",chunk=>{process.stderr.write(chunk);appendFileSync(logPath,chunk);});
 await new Promise((resolvePromise,reject)=>{task.once("error",reject);task.once("exit",code=>code===0?resolvePromise():reject(new Error("A preparação falhou. Consulte logs/preparacao.log.")));});
}
async function start(){
 const old=read(statePath);
 if(valid(old)&&alive(old.pid)){
  const response=await readHealth(old.port||port);
  if(response.ok&&response.data.instanceId===old.instance){
   if(old.port!==port)throw new Error("A instância anterior usa outra porta. Encerre-a antes de alterar PORT.");
   const ready=read(readyPath);console.log("Esta instância já está em execução.");if(ready?.url)openUrl(ready.url);return;
  }
  throw new Error("Há uma instância registrada ainda ativa, mas ela não confirmou sua identidade. Consulte os logs antes de iniciar outra.");
 }
 await prepare();
 remove(readyPath);remove(stopPath);
 const instance=randomUUID();
 const output=openSync(join(logs,"site.log"),"w"),errors=openSync(join(logs,"erros.log"),"w");
 let worker;
 try{
  worker=spawn(process.execPath,[join(root,"scripts/launch.mjs"),"--serve-only"],{
   cwd:root,detached:true,windowsHide:true,shell:false,stdio:["ignore",output,errors],
   env:{...process.env,BASE_LAUNCH_ID:instance,BASE_BACKGROUND:"1",BASE_NO_OPEN:"1"},
  });
 }finally{closeSync(output);closeSync(errors);}
 worker.once("error",error=>{worker.startError=error;});
 if(!worker.pid)throw new Error("Não foi possível iniciar o processo. Consulte o histórico do Windows e os logs.");
 writeFileSync(statePath,JSON.stringify({pid:worker.pid,instance,projectRoot:root,port,startedAt:new Date().toISOString()}));
 worker.unref();
 try{
  await waitForHealth(port,worker,{instance});
  let ready;
  for(let attempt=0;attempt<100;attempt++){
   ready=read(readyPath);if(ready?.instance===instance&&ready?.pid===worker.pid)break;
   await new Promise(resolvePromise=>setTimeout(resolvePromise,100));
  }
  if(ready?.instance!==instance)throw new Error("A API respondeu, mas o arquivo de inicialização não foi confirmado. Consulte os logs.");
  console.log("Site pronto na rede. O CMD pode fechar; o servidor continua em segundo plano.");
  if(ready?.url){console.log("Acesse "+ready.url);openUrl(ready.url);}
 }catch(error){
  if(existsSync(join(logs,"erros.log")))process.stderr.write(readFileSync(join(logs,"erros.log"),"utf8").slice(-8000));
  if(alive(worker.pid))writeFileSync(stopPath,JSON.stringify({pid:worker.pid,instance}));
  throw error;
 }
}
async function stop(){
 const state=read(statePath);
 if(!state){console.log("Nenhuma instância registrada nesta pasta.");return;}
 if(!alive(state.pid)){remove(statePath);remove(readyPath);remove(stopPath);return;}
 const ready=read(readyPath);
 if(!valid(state)||ready?.pid!==state.pid||ready?.instance!==state.instance)throw new Error("O registro não identifica esta instância. Nenhum processo foi encerrado.");
 writeFileSync(stopPath,JSON.stringify({pid:state.pid,instance:state.instance}));
 for(let attempt=0;attempt<60;attempt++){
  if(!alive(state.pid)){remove(statePath);remove(readyPath);remove(stopPath);console.log("Base do Suporte encerrada.");return;}
  await new Promise(resolvePromise=>setTimeout(resolvePromise,250));
 }
 throw new Error("A instância não confirmou o encerramento. Consulte os logs; nenhum outro processo foi finalizado.");
}

let lock;
try{
 if(!supportedNode())throw new Error("Use Node.js 24 ou 26 LTS com npm.");
 try{lock=openSync(lockPath,"wx");}catch(error){
  if(error.code!=="EEXIST")throw error;
  const owner=read(lockPath);if(alive(owner?.pid))throw new Error("Outra preparação está em andamento. Aguarde sua conclusão.");
  remove(lockPath);lock=openSync(lockPath,"wx");
 }
 writeFileSync(lock,JSON.stringify({pid:process.pid}));
 const action=process.argv[2]||"start";
 if(action==="start")await start();else if(action==="stop")await stop();else throw new Error("Ação inválida. Use start ou stop.");
}catch(error){
 const message="ERRO: "+error.message;
 console.error(message);appendFileSync(join(logs,"gerenciador.log"),new Date().toISOString()+" "+message+"\n");process.exitCode=1;
}finally{if(lock!==undefined){closeSync(lock);remove(lockPath);}}
