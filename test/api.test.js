import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { createApp } from "../src/server/app.js";
import { openStore } from "../src/server/store.js";
import { seed } from "../src/server/seed.js";
import { hashPassword } from "../src/server/auth.js";
import { articleSchema } from "../src/server/article.js";

const password = randomBytes(24).toString("hex");
const passwordHash = await hashPassword(password);
async function fixture(t, overrides = {}) {
  const dir = mkdtempSync(join(tmpdir(), "support-test-"));
  const filename = join(dir, "test.sqlite");
  const store = openStore(filename);
  seed(store);
  const config = {
    username: "suporte",
    passwordHash,
    publicOrigin: "http://localhost:1992",
    production: false,
    ...overrides,
  };
  const server = createApp({ store, config }).listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const call = (path, { method = "GET", body, cookie, origin } = {}) =>
    fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
        ...(origin ? { origin } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const login = async () => {
    const response = await call("/session", {
      method: "POST",
      body: { username: "suporte", password },
    });
    assert.equal(response.status, 200);
    return response.headers.get("set-cookie").split(";")[0];
  };
  return { store, config, call, login, filename };
}
const document = (slug = "novo-artigo") => ({
  title: "Novo artigo de suporte",
  slug,
  summary: "Resumo do procedimento para atendimento.",
  product: "OuroFarma",
  category: "SNGPC",
  section: "Erros",
  tags: ["conferência"],
  symptoms: "Mensagem recebida no atendimento.",
  cause: "Causa verificada pelo suporte.",
  steps: ["Conferir o retorno antes de agir."],
  validation: "Conferir o resultado com o responsável.",
  warnings: [],
  sources: [
    {
      title: "Documentação VSM",
      url: "https://www.vsm.com.br/areadocliente/baseConhecimentoTopico?idTopico=173",
    },
  ],
  status: "draft",
});

test("a origem do IP que recebeu a conexão funciona mesmo sem descoberta de adaptadores", async t => {
  const {call}=await fixture(t,{production:true,publicOrigin:"http://localhost:1992",allowedOrigins:[]});
  const health=await call("/health");
  const origin=new URL(health.url).origin;
  const response=await call("/articles",{method:"POST",origin,body:{...document("origem-do-socket"),status:"published"}});
  assert.equal(response.status,201);
  const denied=await call("/articles",{method:"POST",origin:"http://outro-site.test",body:{...document("origem-externa"),status:"published"}});
  assert.equal(denied.status,403);
});

test("leitura pública, busca por corpo/acento/prefixo, filtros e paginação", async (t) => {
  const { call } = await fixture(t);
  const page = await (await call("/articles")).json();
  assert.equal(page.total, 5);
  assert.equal(page.items.length, 5);
  for (const q of [
    "conferencia",
    "CONFERÊNCIA",
    "quarent",
    "zero letra",
    "sngpc xml",
  ]) {
    const response = await call(`/articles?q=${encodeURIComponent(q)}`);
    assert.equal(response.status, 200);
    const found = await response.json();
    assert.ok(found.total > 0, `query ${q}`);
    assert.ok(found.items.every((item) => item.status === "published"));
  }
  const routines = await (
    await call("/articles?section=Rotinas&limit=1&page=2")
  ).json();
  assert.equal(routines.total, 2);
  assert.equal(routines.items.length, 1);
  const wrongProduct = await (
    await call("/articles?product=FrontFarma")
  ).json();
  assert.equal(wrongProduct.total, 0);
  assert.equal((await (await call("/articles?tag=RT")).json()).total, 1);
  assert.equal((await (await call("/articles?q=%22%3B%2A")).json()).total, 0);
  assert.equal((await call("/articles?q=%27%20OR%201%3D1%20--")).status, 200);
  assert.equal((await call("/articles?page=0")).status, 422);
  assert.equal((await call("/articles?limit=99999")).status, 422);
});

test("rascunhos não vazam na busca, no link direto ou nas facetas", async (t) => {
  const { call } = await fixture(t);
  for (const path of [
    "/articles?q=QUANTIDADE%3D0",
    "/articles?status=draft&deleted=true&q=QUANTIDADE%3D0",
  ]) {
    const result = await (await call(path)).json();
    assert.equal(result.total, 0);
  }
  assert.equal(
    (await call("/articles/sngpc-quantidade-igual-zero")).status,
    404,
  );
  const facets = await (await call("/facets")).json();
  assert.ok(!facets.tags.some((item) => item.value === "revisão pendente"));
  assert.equal((await call("/support/articles")).status, 401);
});

test("gestão de rascunhos, exclusão e restauração exigem suporte, inclusive com role forjada", async (t) => {
  const { call, store } = await fixture(t);
  for (const [method, path, body] of [
    ["POST", "/support/articles", document()],
    [
      "PATCH",
      "/support/articles/sngpc-cpf-rt",
      { ...document(), version: 1, role: "support" },
    ],
    ["DELETE", "/support/articles/sngpc-cpf-rt", { version: 1 }],
    ["POST", "/support/articles/sngpc-cpf-rt/restore", { version: 1 }],
  ])
    assert.equal((await call(path, { method, body })).status, 401);
  assert.equal(store.get("sngpc-cpf-rt").deletedAt, null);
  assert.equal(
    (
      await call("/auth/register", {
        method: "POST",
        body: { role: "support" },
      })
    ).status,
    404,
  );
});

test("equipe cria e edita sem login, mas não oculta, exclui ou acessa rascunhos", async (t) => {
  const { call, store } = await fixture(t);
  const body = {
    ...document("colaboracao-publica"),
    status: "published",
    requiresDatabaseChange: true,
  };
  const created = await call("/articles", { method: "POST", body });
  assert.equal(created.status, 201);
  const article = await created.json();
  assert.equal((await call(`/articles/${article.slug}`)).status, 200);
  assert.equal(
    (
      await call(`/articles/${article.id}`, {
        method: "PATCH",
        body: { ...body, title: "Título alterado pela equipe", version: 1 },
      })
    ).status,
    200,
  );
  assert.equal(store.get(article.id).title, "Título alterado pela equipe");
  assert.equal(store.get(article.id).requiresDatabaseChange, true);
  assert.equal(
    (
      await call(`/articles/${article.id}`, {
        method: "PATCH",
        body: { ...body, version: 1 },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call(`/articles/${article.id}`, {
        method: "PATCH",
        body: { ...body, status: "draft", version: 2 },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call(`/articles/${article.id}`, {
        method: "DELETE",
        body: { version: 2 },
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await call("/articles", {
        method: "POST",
        body: document("rascunho-publico"),
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call("/articles/sngpc-quantidade-zero", {
        method: "PATCH",
        body: { ...body, version: 1 },
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await call("/articles", {
        method: "POST",
        body: { ...body, role: "support" },
      })
    ).status,
    422,
  );
  assert.equal(
    store.db
      .prepare("SELECT actor FROM audit WHERE article_id=? ORDER BY id LIMIT 1")
      .get(article.id).actor,
    "equipe-sem-login",
  );
});

test("publicar, atualizar índice, impedir conflito, excluir e restaurar como rascunho", async (t) => {
  const { call, login, store } = await fixture(t);
  const cookie = await login();
  const created = await call("/support/articles", {
    method: "POST",
    body: document(),
    cookie,
  });
  assert.equal(created.status, 201);
  const article = await created.json();
  assert.equal((await call("/articles/novo-artigo")).status, 404);
  let response = await call(`/support/articles/${article.id}`, {
    method: "PATCH",
    body: { ...document(), status: "published", version: 1 },
    cookie,
  });
  assert.equal(response.status, 200);
  assert.equal((await call("/articles/novo-artigo")).status, 200);
  response = await call(`/support/articles/${article.id}`, {
    method: "PATCH",
    body: { ...document(), version: 1 },
    cookie,
  });
  assert.equal(response.status, 409);
  response = await call(`/support/articles/${article.id}`, {
    method: "PATCH",
    body: { ...document("outro-endereco"), version: 2 },
    cookie,
  });
  assert.equal(response.status, 422);
  response = await call(`/support/articles/${article.id}`, {
    method: "PATCH",
    body: {
      ...document(),
      status: "published",
      cause: "Causa com o termo exclusivo zebraverde.",
      version: 2,
    },
    cookie,
  });
  assert.equal(response.status, 200);
  assert.equal((await (await call("/articles?q=zebraverde")).json()).total, 1);
  assert.equal(
    (
      await call(`/support/articles/${article.id}`, {
        method: "DELETE",
        body: { version: 2 },
        cookie,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call(`/support/articles/${article.id}`, {
        method: "DELETE",
        body: { version: 3 },
        cookie,
      })
    ).status,
    204,
  );
  assert.equal((await call("/articles/novo-artigo")).status, 404);
  assert.equal((await (await call("/articles?q=zebraverde")).json()).total, 0);
  assert.ok(
    (
      await (await call("/support/articles?deleted=true", { cookie })).json()
    ).items.some((item) => item.id === article.id),
  );
  response = await call(`/support/articles/${article.id}/restore`, {
    method: "POST",
    body: { version: 4 },
    cookie,
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, "draft");
  assert.equal((await call("/articles/novo-artigo")).status, 404);
  assert.deepEqual(
    store.db
      .prepare("SELECT action FROM audit WHERE article_id=? ORDER BY id")
      .all(article.id)
      .map((row) => row.action),
    ["create", "update", "update", "trash", "restore"],
  );
});

test("sessão HttpOnly, expiração, logout e troca da senha revogam acesso", async (t) => {
  const { call, config, store } = await fixture(t);
  const response = await call("/session", {
    method: "POST",
    body: { username: "suporte", password },
  });
  const header = response.headers.get("set-cookie");
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=Strict/i);
  assert.match(header, /Path=\/api/i);
  const cookie = header.split(";")[0];
  assert.equal((await call("/support/articles", { cookie })).status, 200);
  const row = store.db.prepare("SELECT * FROM sessions").get();
  assert.ok(!JSON.stringify(row).includes(cookie.split("=")[1]));
  store.db.prepare("UPDATE sessions SET expires_at=0").run();
  assert.equal((await call("/support/articles", { cookie })).status, 401);
  const second = await call("/session", {
    method: "POST",
    body: { username: "suporte", password },
  });
  const secondCookie = second.headers.get("set-cookie").split(";")[0];
  assert.equal(
    (
      await call("/session", {
        method: "DELETE",
        body: {},
        cookie: secondCookie,
      })
    ).status,
    204,
  );
  assert.equal(
    (await call("/support/articles", { cookie: secondCookie })).status,
    401,
  );
  const third = await call("/session", {
    method: "POST",
    body: { username: "suporte", password },
  });
  const thirdCookie = third.headers.get("set-cookie").split(";")[0];
  config.passwordHash = await hashPassword(randomBytes(24).toString("hex"));
  assert.equal(
    (await call("/support/articles", { cookie: thirdCookie })).status,
    401,
  );
});

test("sem senha configurada a base permanece pública e a gestão bloqueada", async (t) => {
  const { call } = await fixture(t, { passwordHash: "" });
  assert.equal((await call("/articles")).status, 200);
  assert.equal(
    (
      await call("/session", {
        method: "POST",
        body: { username: "suporte", password },
      })
    ).status,
    503,
  );
  assert.equal((await call("/support/articles")).status, 401);
});

test("origem, limites de login e validação de conteúdo", async (t) => {
  const { call, login } = await fixture(t);
  const cookie = await login();
  assert.equal(
    (
      await call("/session", {
        method: "POST",
        body: { username: "suporte", password },
        origin: "https://outro.site",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call("/support/articles", {
        method: "POST",
        body: document(),
        cookie,
        origin: "https://outro.site",
      })
    ).status,
    403,
  );
  for (const url of [
    "javascript:alert(1)",
    "https://www.vsm.com.br/?pass=example",
    "https://user:pass@example.com/",
  ]) {
    assert.equal(
      (
        await call("/support/articles", {
          method: "POST",
          body: { ...document(), sources: [{ title: "Fonte insegura", url }] },
          cookie,
        })
      ).status,
      422,
    );
  }
  assert.equal(
    (
      await call("/support/articles", {
        method: "POST",
        body: { ...document(), role: "support" },
        cookie,
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await call("/support/articles", {
        method: "POST",
        body: { ...document(), steps: [] },
        cookie,
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await call("/support/articles", {
        method: "POST",
        body: { ...document(), slug: "sngpc-cpf-xml-responsavel-tecnico" },
        cookie,
      })
    ).status,
    409,
  );
  for (let i = 0; i < 9; i++)
    assert.equal(
      (
        await call("/session", {
          method: "POST",
          body: { username: "suporte", password: "invalid" },
        })
      ).status,
      401,
    );
  assert.equal(
    (
      await call("/session", {
        method: "POST",
        body: { username: "suporte", password: "invalid" },
      })
    ).status,
    429,
  );
});

test("disco persiste artigos e seed não sobrescreve edições nem restaura exclusões", async (t) => {
  const { store, filename } = await fixture(t);
  const original = store.get("sngpc-cpf-rt");
  const { id, version, createdAt, updatedAt, publishedAt, deletedAt, ...raw } =
    original;
  store.update(
    id,
    articleSchema.parse({ ...raw, title: "Título revisado pelo suporte" }),
    version,
    "suporte",
  );
  store.trash("sngpc-quarentena", 1, "suporte");
  assert.equal(seed(store), 0);
  const another = openStore(filename);
  try {
    assert.equal(another.get(id).title, "Título revisado pelo suporte");
    assert.ok(another.get("sngpc-quarentena").deletedAt);
    assert.equal(seed(another), 0);
  } finally {
    another.close();
  }
});

test("relevância prioriza correspondência no título", async (t) => {
  const { call, store } = await fixture(t);
  store.create({
    ...document("titulo-exclusivo"),
    title: "Zebraverde no título",
    status: "published",
  });
  store.create({
    ...document("corpo-exclusivo"),
    cause: "Zebraverde aparece apenas no corpo.",
    status: "published",
  });
  const page = await (await call("/articles?q=zebraverde")).json();
  assert.equal(page.total, 2);
  assert.equal(page.items[0].slug, "titulo-exclusivo");
});

test("HTTP na rede interna serve SPA, assets e API pela mesma origem", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "support-static-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(
    join(dir, "index.html"),
    '<!doctype html><title>Base do Suporte</title><div id="root"></div>',
  );
  writeFileSync(join(dir, "app.js"), 'console.log("base");');
  const { call } = await fixture(t, {
    frontendDist: dir,
    production: true,
    secureCookies: false,
  });
  const root = (await call("/health")).url.replace("/api/health", "");
  for (const path of [
    "/",
    "/admin",
    "/artigos/novo",
    "/artigos/sngpc-consultar-retorno-xml",
  ]) {
    const response = await fetch(root + path);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Base do Suporte/);
    assert.ok(
      !response.headers
        .get("content-security-policy")
        .includes("upgrade-insecure-requests"),
    );
  }
  assert.match(await (await fetch(root + "/app.js")).text(), /console.log/);
  assert.equal((await call("/inexistente")).status, 404);
});

const pngImage=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRjEAAAAASUVORK5CYII=","base64");
async function uploadImage(call,body=pngImage,type="image/png"){
 const origin=(await call("/health")).url.replace("/api/health","");
 return fetch(origin+"/api/uploads",{method:"POST",headers:{"content-type":type},body});
}
test("prints têm prévia temporária e leitura apenas em artigos publicados ou pelo suporte",async t=>{
 const {call,login}=await fixture(t);
 const response=await uploadImage(call);assert.equal(response.status,201);const image=await response.json();
 const base=(await call("/health")).url.replace("/api/health","");
 assert.equal((await fetch(base+image.url)).status,404);
 const preview=await fetch(base+image.previewUrl);assert.equal(preview.status,200);assert.match(preview.headers.get("content-type"),/image\/png/);
 const {previewUrl,...attachment}=image;
 const body={...document("artigo-com-prints"),procedureSections:[{id:"secao-um",title:"Análise do retorno",steps:["Conferir o registro antes de orientar."],images:[{...attachment,caption:"Clique em Extrato — legenda pesquisável lumiverde",step:1}]}]};
 const cookie=await login();
 const created=await call("/support/articles",{method:"POST",body,cookie});assert.equal(created.status,201);const article=await created.json();
 assert.equal((await fetch(base+image.url)).status,404);
 assert.equal((await fetch(base+image.url,{headers:{cookie}})).status,200);
 assert.equal((await call("/support/articles/"+article.id,{method:"PATCH",body:{...body,status:"published",version:1},cookie})).status,200);
 assert.equal((await fetch(base+image.url)).status,200);
 const found=await(await call("/articles?q=lumiverde")).json();assert.equal(found.total,1);assert.ok(!("procedureSections" in found.items[0]));
 assert.equal((await call("/support/articles/"+article.id,{method:"DELETE",body:{version:2},cookie})).status,204);
 assert.equal((await fetch(base+image.url)).status,404);
 assert.equal((await call("/support/articles/"+article.id+"/restore",{method:"POST",body:{version:3},cookie})).status,200);
 assert.equal((await fetch(base+image.url,{headers:{cookie}})).status,200);
});
test("upload rejeita formato falso, SVG e arquivos maiores que 5 MB",async t=>{
 const {call}=await fixture(t);
 assert.equal((await uploadImage(call,Buffer.from("not a PNG"))).status,422);
 assert.equal((await uploadImage(call,Buffer.from("<svg/>"),"image/svg+xml")).status,415);
 assert.equal((await uploadImage(call,Buffer.alloc(5*1024*1024+1))).status,413);
});
test("seções validam vínculos dos prints e aceitam consulta e escalonamento independentes",async t=>{
 const {call}=await fixture(t);
 const image=await(await uploadImage(call)).json();const {previewUrl,...attachment}=image;
 const body={...document("consulta-com-secoes"),status:"published",databaseMode:"read",requiresEscalation:true,errorMessage:"Mensagem completa do sistema.",procedureSections:[{id:"secao-a",title:"Conferência",steps:["Passo único da conferência."],images:[{...attachment,caption:"Print da conferência",step:2}]}]};
 assert.equal((await call("/articles",{method:"POST",body})).status,422);
 body.procedureSections[0].images[0].step=1;
 const created=await call("/articles",{method:"POST",body});assert.equal(created.status,201);
 const result=await(await call("/articles/consulta-com-secoes")).json();assert.equal(result.databaseMode,"read");assert.equal(result.requiresEscalation,true);assert.equal(result.procedureSections[0].images.length,1);
});
test("a listagem pública envia somente resumos, sem o corpo dos procedimentos",async t=>{
 const {call}=await fixture(t);const page=await(await call("/articles")).json();
 for(const item of page.items){assert.ok(!("steps" in item));assert.ok(!("symptoms" in item));assert.ok(!("procedureSections" in item));assert.ok(item.summary);}
});
