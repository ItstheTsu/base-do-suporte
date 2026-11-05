import { existsSync,readFileSync,writeFileSync,mkdirSync,copyFileSync,readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve,join } from "node:path";
import { spawn,spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { loadEnvFile } from "node:process";
const root=fileURLToPath(new URL("../",import.meta.url));
process.chdir(root);
const cache=join(root,".cache");
function npm(args,quiet=false){
 const result=spawnSync(process.platform==="win32"?"npm.cmd":"npm",args,{cwd:root,stdio:quiet?"ignore":"inherit",shell:process.platform==="win32"});
 if(result.error)throw result.error;
 return result.status===0;
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
async function healthy(port,child){
 for(let attempt=0;attempt<40;attempt++){
  if(child.exitCode!==null)throw new Error("O servidor encerrou durante a inicialização. Confira a mensagem acima.");
  try{const response=await fetch("http://127.0.0.1:"+port+"/api/health",{signal:AbortSignal.timeout(1000)});const data=await response.json();if(response.ok&&data.service==="base-do-suporte")return;}catch{}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 throw new Error("O servidor não respondeu à verificação inicial.");
}
function openBrowser(url){
 const command=process.platform==="win32"?"rundll32.exe":process.platform==="darwin"?"open":"xdg-open";
 const args=process.platform==="win32"?["url.dll,FileProtocolHandler",url]:[url];
 const child=spawn(command,args,{stdio:"ignore",windowsHide:true});child.on("error",()=>{});child.unref();
}
try{
 if(Number(process.versions.node.split(".")[0])!==24)throw new Error("Instale o Node.js 24 para iniciar.");
 if(!existsSync(".env"))copyFileSync(".env.example",".env");
 loadEnvFile(".env");
 const port=Number(process.env.PORT||1992),host=process.env.HOST||"0.0.0.0";
 await available(port,host);
 mkdirSync(cache,{recursive:true});
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
  if(!npm(["run","build"]))throw new Error("O frontend não compilou. Confira o erro acima.");
  writeFileSync(buildStamp,buildHash);
 }
 console.log("[3/4] Preparando o conteúdo inicial...");
 if(!npm(["run","seed"]))throw new Error("Não foi possível preparar o conteúdo.");
 console.log("[4/4] Iniciando a Base do Suporte...");
 const child=spawn(process.execPath,["--env-file-if-exists=.env","src/server/server.js"],{cwd:root,stdio:"inherit"});
 const exited=new Promise((resolve,reject)=>{child.once("error",reject);child.once("exit",(code,signal)=>resolve({code,signal}));});
 for(const signal of ["SIGINT","SIGTERM"])process.once(signal,()=>{if(!child.killed)child.kill(signal);});
 try{
  await healthy(port,child);
  const url=process.env.PUBLIC_ORIGIN||"http://localhost:"+port;
  console.log("Acesse "+url+" | Administração: /admin");
  console.log("Mantenha a janela aberta. Para encerrar, pressione Ctrl+C.");
  if(!process.argv.includes("--no-open")&&process.env.BASE_NO_OPEN!=="1")openBrowser(url);
  const result=await exited;process.exitCode=result.code??0;
 }catch(error){if(!child.killed)child.kill();throw error;}
}catch(error){console.error("\nERRO: "+error.message);process.exitCode=1;}
