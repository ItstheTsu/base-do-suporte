import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { accessAddresses } from "./network.js";
import { openStore } from "./store.js";
import { createApp } from "./app.js";
export const ROOT=fileURLToPath(new URL("../../",import.meta.url));
const production=process.env.NODE_ENV==="production";
const port=Number(process.env.PORT||1992);
const publicOrigin=process.env.PUBLIC_ORIGIN||"http://localhost:"+port;
const secureCookies=process.env.COOKIE_SECURE==="true";
const origin=new URL(publicOrigin);
if(publicOrigin!==origin.origin||!["http:","https:"].includes(origin.protocol)||(secureCookies&&origin.protocol!=="https:"))throw new Error("PUBLIC_ORIGIN inválida para o protocolo configurado.");
const addresses=accessAddresses(port,publicOrigin);
const allowedOrigins=secureCookies?[publicOrigin]:addresses.allowedOrigins;
const store=openStore(resolve(ROOT,process.env.DATABASE_PATH||"./data/knowledge.sqlite"));
const app=createApp({store,config:{production,secureCookies,publicOrigin,allowedOrigins,username:process.env.SUPPORT_USERNAME||"suporte",passwordHash:process.env.SUPPORT_PASSWORD_HASH||"",frontendDist:resolve(ROOT,process.env.FRONTEND_DIST||"dist")}});
const server=app.listen(port,process.env.HOST||"0.0.0.0",()=>{
 console.log("Base do Suporte: "+publicOrigin);
 console.log("Neste computador: "+addresses.local);
 if(!secureCookies)for(const url of addresses.network)console.log("Rede interna: "+url);
});
let closing=false;
function shutdown(){
 if(closing)return;closing=true;
 server.close(()=>{store.close();process.exit(0);});
 setTimeout(()=>server.closeAllConnections(),5000).unref();
}
for(const signal of ["SIGINT","SIGTERM"])process.on(signal,shutdown);
process.on("message",message=>{if(process.send&&message?.type==="shutdown")shutdown();});
