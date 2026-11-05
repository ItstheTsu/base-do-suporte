import test from "node:test";
import assert from "node:assert/strict";
import { localAddresses, accessAddresses } from "../src/server/network.js";

const interfaces={
  "vEthernet (WSL)": [{address:"172.17.0.1",family:"IPv4",internal:false}],
  Ethernet: [{address:"172.20.80.35",family:"IPv4",internal:false},{address:"::1",family:"IPv6",internal:false}],
  WiFi: [{address:"172.20.80.35",family:"IPv4",internal:false},{address:"169.254.1.2",family:"IPv4",internal:false}],
  Loopback: [{address:"127.0.0.1",family:"IPv4",internal:true}],
};
test("o acesso sugerido usa o IP da LAN antes do adaptador virtual",()=>{
  assert.deepEqual(localAddresses(interfaces),["172.20.80.35","172.17.0.1"]);
  const access=accessAddresses(1992,"http://localhost:1992",interfaces);
  assert.equal(access.preferred,"http://172.20.80.35:1992");
  assert.ok(access.allowedOrigins.includes("http://172.20.80.35:1992"));
  assert.ok(access.allowedOrigins.includes("http://127.0.0.1:1992"));
  assert.ok(!access.allowedOrigins.includes("http://outro-site:1992"));
});
test("um DNS configurado é preservado e a porta real é usada nos IPs",()=>{
  const access=accessAddresses(21992,"https://base.exemplo.test",interfaces);
  assert.equal(access.preferred,"https://base.exemplo.test");
  assert.equal(access.network[0],"http://172.20.80.35:21992");
});
test("sem conexão de rede o site continua disponível localmente",()=>{
  const access=accessAddresses(1992,"",{});
  assert.equal(access.preferred,"http://localhost:1992");
  assert.deepEqual(access.network,[]);
});
