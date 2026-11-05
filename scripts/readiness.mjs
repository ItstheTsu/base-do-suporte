import { get } from "node:http";

export function readHealth(port, timeout = 2000) {
  return new Promise(resolve => {
    // Loopback direto: a verificação local não depende do proxy HTTP da empresa.
    const request = get({ host: "127.0.0.1", port, path: "/api/health", agent: false }, response => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", chunk => {
        body += chunk;
        if (body.length > 4096) { response.destroy(); resolve({ ok: false, error: "Resposta de saúde maior que o esperado." }); }
      });
      response.on("error", error => resolve({ ok: false, error: error.message }));
      response.on("end", () => {
        try {
          const data = JSON.parse(body);
          const ok = response.statusCode === 200 && data.service === "base-do-suporte" && data.status === "ok";
          resolve({ ok, data, error: ok ? "" : `HTTP ${response.statusCode}; o serviço respondeu ${JSON.stringify(data.service ?? "sem identificação")}.` });
        } catch { resolve({ ok: false, error: `HTTP ${response.statusCode}; a resposta não é JSON da Base do Suporte.` }); }
      });
    });
    request.setTimeout(timeout, () => request.destroy(new Error("A conexão local excedeu o prazo.")));
    request.on("error", error => resolve({ ok: false, error: `${error.code || "HTTP"}: ${error.message}` }));
  });
}

export async function waitForHealth(port, child, { timeoutMs = 90000, intervalMs = 250, instance } = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "sem resposta";
  while (Date.now() < deadline) {
    if (child?.startError) throw new Error(`Não foi possível criar o processo do servidor: ${child.startError.message}`);
    if (child && (child.exitCode !== null || child.signalCode !== null)) {
      throw new Error(`O servidor encerrou antes de ficar pronto (código ${child.exitCode ?? "ausente"}, sinal ${child.signalCode ?? "nenhum"}). Consulte logs/erros.log.`);
    }
    const response = await readHealth(port, Math.min(2000, Math.max(100, deadline - Date.now())));
    if (response.ok && (!instance || response.data.instanceId === instance)) return response.data;
    lastError = response.ok ? "A porta respondeu com outra instância da Base do Suporte." : response.error;
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw new Error(`O servidor não ficou pronto em ${Math.ceil(timeoutMs / 1000)} s. Endereço testado: http://127.0.0.1:${port}/api/health. Última resposta: ${lastError}. Consulte logs/site.log e logs/erros.log.`);
}
