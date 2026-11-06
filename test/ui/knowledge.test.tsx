import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import Catalog from "../../src/client/knowledge/Catalog";
import ArticleEditor from "../../src/client/knowledge/ArticleEditor";
import ArticleContent from "../../src/client/knowledge/ArticleContent";
import ArticlePage from "../../src/client/knowledge/ArticlePage";
import { copyLink } from "../../src/client/knowledge/clipboard";
import {
  SessionContext,
  type SessionValue,
} from "../../src/client/knowledge/session-context";
import type { Article } from "../../src/client/knowledge/types";

const article: Article = {
  id: "sngpc-test",
  version: 1,
  title: "Conferir um lote em quarentena",
  slug: "conferir-lote",
  summary: "Conferir a entrada do lote antes de orientar a movimentação.",
  product: "OuroFarma",
  category: "SNGPC",
  section: "Rotinas",
  tags: ["SNGPC"],
  symptoms: "Um lote está bloqueado para venda.",
  cause: "A conferência da entrada está pendente.",
  steps: ["Conferir o retorno com o responsável."],
  validation: "Validar a situação após a conferência.",
  warnings: [],
  sources: [
    {
      title: "Tutorial VSM",
      url: "https://www.vsm.com.br/areadocliente/baseConhecimentoTopico?idTopico=674",
    },
  ],
  status: "published",
  createdAt: "2026-11-05T12:00:00.000Z",
  updatedAt: "2026-11-05T12:00:00.000Z",
  publishedAt: "2026-11-05T12:00:00.000Z",
  deletedAt: null,
};
const session: SessionValue = {
  user: { username: "suporte", role: "support" },
  ready: true,
  loginEnabled: true,
  refresh: async () => {},
  logout: async () => {},
};
const facets = {
  products: [{ value: "OuroFarma", count: 1 }],
  categories: [{ value: "SNGPC", count: 1 }],
  sections: [{ value: "Rotinas", count: 1 }],
  tags: [{ value: "SNGPC", count: 1 }],
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete (document as any).execCommand;
});

describe("consulta pública", () => {
  it("busca explícita e filtros permanecem na URL; filtros reiniciam a página", async () => {
    const fetch = vi.fn(async (path: string) =>
      path === "/api/facets"
        ? json(facets)
        : json({ items: [article], total: 1, page: 1, limit: 12 }),
    );
    vi.stubGlobal("fetch", fetch);
    render(
      <MemoryRouter initialEntries={["/?page=2"]}>
        <Catalog />
      </MemoryRouter>,
    );
    await screen.findByRole("heading", { name: article.title });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Buscar na base"), "conferencia");
    await user.click(
      screen.getByRole("button", { name: "Buscar", exact: true }),
    );
    await waitFor(() =>
      expect(
        fetch.mock.calls.some(
          ([path]) => path === "/api/articles?q=conferencia",
        ),
      ).toBe(true),
    );
    await user.selectOptions(screen.getByLabelText("Seção"), "Rotinas");
    await waitFor(() =>
      expect(
        fetch.mock.calls.some(
          ([path]) => path === "/api/articles?q=conferencia&section=Rotinas",
        ),
      ).toBe(true),
    );
    expect(
      screen
        .getByRole("link", { name: new RegExp(article.title) })
        .getAttribute("href"),
    ).toBe("/artigos/conferir-lote");
  });
  it("uma resposta atrasada não substitui a busca mais recente", async () => {
    let finishOld: (value: Response) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn((path: string) => {
        if (path === "/api/facets") return Promise.resolve(json(facets));
        if (path === "/api/articles?")
          return new Promise<Response>((resolve) => {
            finishOld = resolve;
          });
        return Promise.resolve(
          json({ items: [], total: 0, page: 1, limit: 12 }),
        );
      }),
    );
    render(
      <MemoryRouter>
        <Catalog />
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Buscar na base"), "inexistente");
    await user.click(
      screen.getByRole("button", { name: "Buscar", exact: true }),
    );
    await screen.findByText("Nenhum artigo encontrado");
    await act(async () => {
      finishOld(json({ items: [article], total: 1, page: 1, limit: 12 }));
    });
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: article.title })).toBeNull(),
    );
  });
  it("um erro de rede oferece recuperação", async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("Sem conexão"))
      .mockResolvedValue(json(facets));
    vi.stubGlobal("fetch", fetch);
    render(
      <MemoryRouter>
        <Catalog />
      </MemoryRouter>,
    );
    await screen.findByRole("alert");
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeDefined();
  });
});

describe("editor e conteúdo", () => {
  it("converte passos existentes em SQL e copia o código completo da prévia", async () => {
    const sql = "SELECT\n  'exemplo' AS lote;";
    const oldArticle = { ...article, steps: sql.split("\n") };
    const writeText = vi.fn(async (_code: string) => {});
    const user = userEvent.setup();
    vi.spyOn(navigator, "clipboard", "get").mockReturnValue({ writeText } as unknown as Clipboard);
    let saved: Article | undefined;
    vi.stubGlobal("fetch", vi.fn(async (_path: string, options: RequestInit) => {
      if (options.method === "PATCH") {
        saved = { ...oldArticle, ...JSON.parse(options.body as string), version: 2 };
        return json(saved);
      }
      return json(oldArticle);
    }));
    render(
      <SessionContext.Provider value={{ ...session, user: null }}>
        <MemoryRouter initialEntries={["/artigos/conferir-lote/editar"]}>
          <Routes><Route path="/artigos/:slug/editar" element={<ArticleEditor />} /></Routes>
        </MemoryRouter>
      </SessionContext.Provider>,
    );
    const kind = await screen.findByLabelText("Tipo da seção 1");
    await user.selectOptions(kind, "images");
    expect(screen.queryByLabelText("Passos da seção 1")).toBeNull();
    expect(screen.getByLabelText("Adicionar prints à seção 1")).toBeDefined();
    await user.selectOptions(kind, "sql");
    expect((screen.getByLabelText(/Código SQL da seção 1/) as HTMLTextAreaElement).value).toBe(sql);
    await user.click(screen.getByRole("button", { name: "Visualizar prévia" }));
    await user.click(screen.getByRole("button", { name: "Copiar SQL" }));
    expect(writeText).toHaveBeenCalledWith(sql);
    expect(await screen.findByText("SQL copiado.")).toBeDefined();
    await user.click(screen.getByRole("button", { name: "Salvar publicação" }));
    await screen.findByText("Artigo publicado. A leitura pública já está disponível.");
    expect(saved?.procedureSections?.[0]).toMatchObject({ kind: "sql", sql, steps: [] });
  });

  it("permite publicar após remover a última referência ou deixar uma linha vazia", async () => {
    let saved: any;
    vi.stubGlobal("fetch", vi.fn(async (_path: string, options: RequestInit) => {
      if (options.method === "PATCH") {
        saved = JSON.parse(options.body as string);
        return json({ ...article, ...saved, version: 2 });
      }
      return json(article);
    }));
    render(<SessionContext.Provider value={{ ...session, user: null }}>
      <MemoryRouter initialEntries={["/artigos/conferir-lote/editar"]}>
        <Routes><Route path="/artigos/:slug/editar" element={<ArticleEditor />} /></Routes>
      </MemoryRouter>
    </SessionContext.Provider>);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Remover fonte 1" }));
    expect(screen.queryByLabelText("Nome da fonte 1")).toBeNull();
    expect(screen.getByText(/As referências não são obrigatórias/)).toBeDefined();
    await user.click(screen.getByRole("button", { name: "+ Adicionar fonte" }));
    const title = screen.getByLabelText("Nome da fonte 1") as HTMLInputElement;
    const url = screen.getByLabelText("Link da fonte 1") as HTMLInputElement;
    expect(title.required).toBe(false);
    expect(url.required).toBe(false);
    await user.type(title, "Fonte opcional");
    expect(url.required).toBe(true);
    await user.clear(title);
    await user.click(screen.getByRole("button", { name: "Salvar publicação" }));
    await screen.findByText("Artigo publicado. A leitura pública já está disponível.");
    expect(saved.sources).toEqual([]);
  });

  it("oculta a seção e o link do índice quando não há referências", async () => {
    vi.stubGlobal("fetch", vi.fn(async (path: string) => path.includes("/articles?")
      ? json({ items: [], total: 0, page: 1, limit: 12 })
      : json({ ...article, sources: [] })));
    const { container } = render(<MemoryRouter initialEntries={["/artigos/conferir-lote"]}>
      <Routes><Route path="/artigos/:slug" element={<ArticlePage />} /></Routes>
    </MemoryRouter>);
    await screen.findByRole("heading", { name: article.title });
    expect(screen.queryByRole("heading", { name: "Fontes e referências" })).toBeNull();
    expect(container.querySelector('a[href="#fontes"]')).toBeNull();
    expect(screen.getByRole("link", { name: "Como validar", exact: true })).toBeDefined();
  });

  it("preserva o texto após conflito de versão, sem sobrescrever a edição do servidor", async () => {
    const writes: RequestInit[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_path: string, options: RequestInit) => {
        if (options.method === "PATCH") {
          writes.push(options);
          return json(
            { message: "O artigo mudou. Recarregue antes de salvar." },
            409,
          );
        }
        return json(article);
      }),
    );
    render(
      <SessionContext.Provider value={session}>
        <MemoryRouter initialEntries={["/admin/artigos/sngpc-test"]}>
          <Routes>
            <Route path="/admin/artigos/:id" element={<ArticleEditor />} />
          </Routes>
        </MemoryRouter>
      </SessionContext.Provider>,
    );
    const input = await screen.findByLabelText("Título");
    const user = userEvent.setup();
    await user.clear(input);
    await user.type(input, "Meu texto em revisão");
    await user.click(screen.getByRole("button", { name: "Salvar publicação" }));
    await screen.findByRole("alert");
    expect((screen.getByLabelText("Título") as HTMLInputElement).value).toBe(
      "Meu texto em revisão",
    );
    expect(writes.length).toBe(1);
    const body = JSON.parse(writes[0].body as string);
    expect(body.version).toBe(1);
    expect(body.status).toBe("published");
    expect(
      screen.getByRole("button", {
        name: "Recarregar versão salva (descarta alterações)",
      }),
    ).toBeDefined();
  });
  it("salvar rascunho solicita a retirada da leitura pública", async () => {
    let saved: any;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_path: string, options: RequestInit) => {
        if (options.method === "PATCH") {
          saved = JSON.parse(options.body as string);
          return json({ ...article, ...saved, version: 2 });
        }
        return json(article);
      }),
    );
    render(
      <SessionContext.Provider value={session}>
        <MemoryRouter initialEntries={["/admin/artigos/sngpc-test"]}>
          <Routes>
            <Route path="/admin/artigos/:id" element={<ArticleEditor />} />
          </Routes>
        </MemoryRouter>
      </SessionContext.Provider>,
    );
    await screen.findByLabelText("Título");
    fireEvent.click(screen.getByRole("button", { name: "Salvar rascunho" }));
    await screen.findByText(
      "Rascunho salvo. Apenas o suporte pode consultá-lo.",
    );
    expect(saved.status).toBe("draft");
  });
  it("uma visita anônima ao editor administrativo exige acesso do suporte", async () => {
    render(
      <SessionContext.Provider value={{ ...session, user: null }}>
        <MemoryRouter initialEntries={["/admin/novo"]}>
          <Routes>
            <Route path="/admin/novo" element={<ArticleEditor />} />
            <Route path="/admin" element={<p>Acesso do suporte</p>} />
          </Routes>
        </MemoryRouter>
      </SessionContext.Provider>,
    );
    expect(await screen.findByText("Acesso do suporte")).toBeDefined();
  });
  it("a equipe edita artigos publicados sem login e sem opção de exclusão", async () => {
    const writes: { path: string; body: Record<string, unknown> }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (path: string, options: RequestInit) => {
        if (options.method === "PATCH") {
          const body = JSON.parse(options.body as string);
          writes.push({ path, body });
          return json({ ...article, ...body, version: 2 });
        }
        return json(article);
      }),
    );
    render(
      <SessionContext.Provider value={{ ...session, user: null }}>
        <MemoryRouter initialEntries={["/artigos/conferir-lote/editar"]}>
          <Routes>
            <Route path="/artigos/:slug/editar" element={<ArticleEditor />} />
          </Routes>
        </MemoryRouter>
      </SessionContext.Provider>,
    );
    const title = await screen.findByLabelText("Título");
    fireEvent.change(title, {
      target: { value: "Artigo atualizado pela equipe" },
    });
    expect(
      screen.queryByRole("button", { name: "Salvar rascunho" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Excluir" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Salvar publicação" }));
    await screen.findByText(
      "Artigo publicado. A leitura pública já está disponível.",
    );
    expect(writes[0].path).toBe("/api/articles/sngpc-test");
    expect(writes[0].body.status).toBe("published");
    expect(writes[0].body.version).toBe(1);
  });
  it("conteúdo com marcação é exibido como texto", () => {
    const value = "<img src=x onerror=alert(1)>";
    const { container } = render(
      <ArticleContent article={{ ...article, symptoms: value }} />,
    );
    expect(screen.getByText(value)).toBeDefined();
    expect(container.querySelector("img")).toBeNull();
  });
});

import ProcedureEditor from "../../src/client/knowledge/ProcedureEditor";
it("apresenta seções, prints e colagem sem depender de Clipboard API de contexto seguro",()=>{
 const onChange=vi.fn();
 render(<ProcedureEditor value={[{id:"secao-a",title:"Análise",steps:["Conferir o retorno."],images:[]}]} steps={[]} onChange={onChange} onBusy={()=>{}} onPreview={()=>{}}/>);
 expect(screen.getByLabelText("Adicionar prints à seção 1")).toBeDefined();
 expect(screen.getByLabelText("Colar print da seção 1")).toBeDefined();
 fireEvent.click(screen.getByRole("button",{name:"Seção"}));expect(onChange.mock.calls[0][0]).toHaveLength(2);
});
it("exibe seções, legendas, mensagem e escalonamento nos procedimentos",()=>{
 render(<ArticleContent article={{...article,databaseMode:"read",requiresEscalation:true,errorMessage:"Retorno completo",procedureSections:[{id:"analise",title:"Análise no sistema",steps:["Conferir o retorno."],images:[{id:"image-a",url:"/api/uploads/image-a",caption:"Clique em Extrato",step:1}]}]}}/>);
 expect(screen.getByText("Análise no sistema")).toBeDefined();expect(screen.getByAltText("Clique em Extrato")).toBeDefined();expect(screen.getByText("Consulta ao banco de dados")).toBeDefined();expect(screen.getByText("Escalonamento necessário · N2 / Supervisor")).toBeDefined();expect(screen.getByText("Retorno completo")).toBeDefined();
});

it("editar passos antigos preserva o conteúdo no procedimento e na leitura compatível", async()=>{
 let saved:any;
 vi.stubGlobal("fetch",vi.fn(async(_path:string,options:RequestInit)=>{
  if(options.method==="PATCH"){saved=JSON.parse(options.body as string);return json({...article,...saved,version:2});}
  return json(article);
 }));
 render(<SessionContext.Provider value={{...session,user:null}}><MemoryRouter initialEntries={["/artigos/conferir-lote/editar"]}><Routes><Route path="/artigos/:slug/editar" element={<ArticleEditor/>}/></Routes></MemoryRouter></SessionContext.Provider>);
 const input=await screen.findByLabelText("Passos da seção 1");
 expect((input as HTMLTextAreaElement).value).toBe(article.steps[0]);
 expect(screen.queryByLabelText(/Passos do procedimento/)).toBeNull();
 fireEvent.change(input,{target:{value:"Primeiro, confira a entrada.\nDepois, valide o retorno."}});
 fireEvent.click(screen.getByRole("button",{name:"Salvar publicação"}));
 await screen.findByText("Artigo publicado. A leitura pública já está disponível.");
 expect(saved.steps).toEqual(["Primeiro, confira a entrada.","Depois, valide o retorno."]);
 expect(saved.procedureSections[0].steps).toEqual(saved.steps);
 expect(saved.version).toBe(1);
});

it("copiar link em HTTP usa o recurso disponível e restaura o foco",async()=>{
 vi.spyOn(navigator,"clipboard","get").mockReturnValue(undefined as any);
 const command=vi.fn(()=>{expect((document.activeElement as HTMLTextAreaElement).value).toBe("http://172.20.80.35:1992/artigos/teste");return true;});
 Object.defineProperty(document,"execCommand",{configurable:true,value:command});
 const button=document.createElement("button");document.body.append(button);button.focus();
 expect(await copyLink("http://172.20.80.35:1992/artigos/teste")).toBe(true);
 expect(document.activeElement).toBe(button);expect(command).toHaveBeenCalledWith("copy");button.remove();
 delete (document as any).execCommand;
});

it("sem nenhum recurso de cópia o artigo oferece o endereço selecionável",async()=>{
 vi.spyOn(navigator,"clipboard","get").mockReturnValue(undefined as any);
 vi.stubGlobal("fetch",vi.fn(async(path:string)=>path.includes("/articles?")?json({items:[],total:0,page:1,limit:12}):json(article)));
 render(<MemoryRouter initialEntries={["/artigos/conferir-lote"]}><Routes><Route path="/artigos/:slug" element={<ArticlePage/>}/></Routes></MemoryRouter>);
 fireEvent.click(await screen.findByRole("button",{name:"Copiar link"}));
 const field=await screen.findByLabelText("Link deste artigo");
 expect((field as HTMLInputElement).readOnly).toBe(true);
 expect(screen.getByText("Selecione e copie o endereço abaixo.")).toBeDefined();
});
