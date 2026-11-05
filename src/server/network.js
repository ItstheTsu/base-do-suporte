import { networkInterfaces } from "node:os";
import { isIPv4 } from "node:net";

export function localAddresses(interfaces = networkInterfaces()) {
  const addresses = [];
  for (const [name, entries] of Object.entries(interfaces)) {
    for (const item of entries || []) {
      if (!item.internal && isIPv4(item.address) && !/^(127\.|169\.254\.|0\.)/.test(item.address)) {
        const privateAddress = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(item.address);
        const virtual = /vethernet|virtual|vmware|virtualbox|wsl|docker|tailscale|loopback/i.test(name);
        addresses.push({ address: item.address, score: (privateAddress ? 0 : 2) + (virtual ? 4 : 0) });
      }
    }
  }
  return [...new Set(addresses.sort((a, b) => a.score - b.score || a.address.localeCompare(b.address)).map(item => item.address))];
}

export function accessAddresses(port, publicOrigin = "", interfaces) {
  const local = `http://localhost:${port}`;
  const network = localAddresses(interfaces).map(address => `http://${address}:${port}`);
  const configured = publicOrigin ? new URL(publicOrigin) : null;
  const loopback = configured && configured.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(configured.hostname);
  const preferred = configured && !loopback ? publicOrigin : network[0] || local;
  return { local, network, preferred, allowedOrigins: [...new Set([publicOrigin, local, `http://127.0.0.1:${port}`, ...network].filter(Boolean))] };
}
