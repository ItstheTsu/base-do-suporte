import { existsSync,readFileSync,writeFileSync,mkdirSync,copyFileSync,readdirSync,unlinkSync } from "node:fs";
import { createHash,randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve,join } from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { loadEnvFile } from "node:process";
import { accessAddresses } from "../src/server/network.js";
import { runNpm,runNode,supportedNode } from "./runtime.mjs";
import { waitForHealth } from "./readiness.mjs";
const root=fileURLToPath(new URL("../",import.meta.url));
process.chdir(root);
const cache=join(root,".cache");
function npm(args,quiet=false){
 return runNpm(args,{cwd:root,quiet});
}
function hash(paths){
 const value=createHash("sha256");
 function walk(path){
  if(!existsSync(path))return;
  const statNames=readdirSync(path,{withFileTypes:true});
  for(const entry of statNames.sort((a,b)=>a.name.localeCompare(b.name))){const next=join(path,entry.name);if(entry.isDirectory())walk(next);else if(entry.isFile()){value.update(next.slice(root.length));value.update(readFileSync(next));}}
 }
 for(const path of paths){if(existsSync(path)){try{walk(path);}catch(error){if(error.code!=="ENOTDIR")throw error;value.update(path.slice(root.length));value.update(readFileSync(path));}}}
 return value.digest("hex");
}
function stampMatches(path,value){try{return readFileSync(path,"utf8")===value;}catch{return false;}}
function available(port,host){return new Promise((resolvePromise,reject)=>{const server=createServer();server.once("error",()=>reject(new Error("A porta "+port+" está ocupada ou indisponível. Encerre a outra instância antes de iniciar esta versão.")));server.listen(port,host,()=>server.close(resolvePromise));});}
function openBrowser(url){
 const command=process.platform==="win32"?"explorer.exe":process.platform==="darwin"?"open":"xdg-open";
 const args=[url];
 const child=spawn(command,args,{stdio:"ignore",windowsHide:true});child.on("error",()=>{});child.unref();
}
try{
 if(!supportedNode())throw new Error("Use Node.js 24 ou 26 LTS com npm.");
 if(!existsSync(".env"))copyFileSync(".env.example",".env");
 loadEnvFile(".env");
 const port=Number(process.env.PORT||1992),host="0.0.0.0";
 // O inicializador do Windows publica na rede, inclusive com .env antigo em loopback.
 process.env.HOST=host;
 const addresses=accessAddresses(port,process.env.PUBLIC_ORIGIN);
 if(process.env.COOKIE_SECURE!=="true")process.env.PUBLIC_ORIGIN=addresses.preferred;
 await available(port,host);
 mkdirSync(cache,{recursive:true});
 if(!process.argv.includes("--serve-only")){
 const installHash=createHash("sha256").update(readFileSync("package-lock.json")).update(readFileSync("package.json")).update(process.platform+process.arch+process.versions.modules).digest("hex");
 const installStamp=join(cache,"dependencies.sha256");
 console.log("[1/4] Conferindo dependências...");
 if(!stampMatches(installStamp,installHash)||!npm(["ls","--depth=0","--include=dev"],true)){
  if(!npm(["ci","--include=dev"]))throw new Error("Não foi possível instalar as dependências.");
  writeFileSync(installStamp,installHash);
 }
 console.log("[2/4] Preparando o site...");
 const buildHash=hash(["src/client","public","index.html","vite.config.ts","tsconfig.app.json","tsconfig.node.json","package-lock.json"].map(path=>resolve(root,path)));
 const buildStamp=join(cache,"frontend.sha256");
 if(!existsSync("dist/index.html")||!stampMatches(buildStamp,buildHash)){
  if(!runNode(["scripts/build.mjs"],{cwd:root}))throw new Error("O frontend não compilou. Confira o erro acima.");
  writeFileSync(buildStamp,buildHash);
 }
 console.log("[3/4] Preparando o conteúdo inicial...");
 if(!runNode(["--env-file-if-exists=.env","src/server/seed.js"],{cwd:root}))throw new Error("Não foi possível preparar o conteúdo.");
 }
 if(process.argv.includes("--prepare-only")){console.log("Preparação concluída.");process.exit(0);}
 if(!existsSync("dist/index.html"))throw new Error("O site ainda não foi compilado. Execute INICIAR_SITE.cmd.");
 console.log("[4/4] Iniciando a Base do Suporte...");
 const child=spawn(process.execPath,["--env-file-if-exists=.env","src/server/server.js"],{cwd:root,windowsHide:process.env.BASE_BACKGROUND==="1",stdio:["inherit","inherit","inherit","ipc"]});
 const exited=new Promise(resolve=>{child.once("error",error=>{child.startError=error;resolve({code:1,error});});child.once("exit",(code,signal)=>resolve({code,signal}));});
 for(const signal of ["SIGINT","SIGTERM"])process.once(signal,()=>{if(!child.killed)child.kill(signal);});
 try{
  await waitForHealth(port,child);
  const url=process.env.PUBLIC_ORIGIN||"http://localhost:"+port;
  const instance=process.env.BASE_LAUNCH_ID||randomUUID();
  writeFileSync(join(cache,"ready.json"),JSON.stringify({pid:process.pid,instance,port,url,local:addresses.local,network:addresses.network,startedAt:new Date().toISOString()}));
  writeFileSync(join(root,"ENDERECO_DO_SITE.txt"),["Base do Suporte", "Acesso: "+url,"Neste computador: "+addresses.local,...addresses.network.map(address=>"Na rede: "+address),"Para encerrar: PARAR_SITE.cmd"].join("\r\n"));
  const stopFile=join(cache,"stop.json");
  const stopTimer=setInterval(()=>{
   try{const stop=JSON.parse(readFileSync(stopFile,"utf8"));if(stop.pid===process.pid&&stop.instance===instance&&child.connected){child.send({type:"shutdown"});unlinkSync(stopFile);}}catch{}
  },500);
  stopTimer.unref();
  console.log("Acesse "+url+" | Administração: /admin");
  console.log("Neste computador: "+addresses.local);
  for(const address of addresses.network)console.log("Na rede: "+address);
  console.log(process.env.BASE_BACKGROUND==="1"?"Servidor em segundo plano. Para encerrar, execute PARAR_SITE.cmd.":"Para encerrar, pressione Ctrl+C.");
  if(!process.argv.includes("--no-open")&&process.env.BASE_NO_OPEN!=="1")openBrowser(url);
  const result=await exited;process.exitCode=result.code??0;
  clearInterval(stopTimer);
  try{if(JSON.parse(readFileSync(join(cache,"ready.json"),"utf8")).pid===process.pid)unlinkSync(join(cache,"ready.json"));}catch{}
 }catch(error){if(!child.killed)child.kill();throw error;}
}catch(error){console.error("\nERRO: "+error.message);process.exitCode=1;}
