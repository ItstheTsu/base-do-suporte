import { z } from "zod";

const text = (min, max) => z.string().trim().min(min).max(max);
const lines = (max = 30) => z.array(text(1, 2000)).max(max);
const source = z
  .object({
    title: text(3, 180),
    url: z
      .url()
      .max(1000)
      .refine((value) => {
        if (!URL.canParse(value)) return false;
        const url = new URL(value);
        return (
          url.protocol === "https:" &&
          !url.username &&
          !url.password &&
          ![...url.searchParams.keys()].some((key) =>
            /pass|token|secret|serie|key/i.test(key),
          )
        );
      }, "Use um link HTTPS público, sem credenciais."),
  })
  .strict();

const image = z.object({
  id: z.uuid(),
  url: z.string().regex(/^\/api\/uploads\/[a-f0-9-]{36}$/),
  caption: z.string().trim().max(500).default(""),
  step: z.number().int().min(1).max(50).optional(),
}).strict().refine(value => value.url === "/api/uploads/" + value.id, "Imagem inválida.");
const procedureSection = z.object({
  id: text(1,80).regex(/^[a-zA-Z0-9_-]+$/),
  title: text(2,120),
  kind: z.enum(["steps", "sql", "images"]).optional(),
  sql: z.string().max(60000).optional(),
  steps: lines(50),
  images: z.array(image).max(10).default([]),
}).strict().superRefine((section, ctx) => {
  const issue = (path, message) => ctx.addIssue({ code: "custom", path: [path], message });
  if (section.kind === "sql") {
    if (!section.sql?.trim()) issue("sql", "Informe o código SQL.");
  } else if (section.sql !== undefined) {
    issue("sql", "Selecione o tipo SQL para incluir código.");
  }
  if (section.kind === "images" && !section.images.length) {
    issue("images", "Adicione pelo menos uma imagem à seção.");
  }
  if (section.kind === "steps") {
    if (!section.steps.length) issue("steps", "Informe pelo menos um passo.");
  } else if (!section.kind) {
    if (!section.steps.length && !section.images.length) issue("steps", "Inclua um passo ou imagem.");
  } else if (section.steps.length) {
    issue("steps", "Use o tipo Passo a passo para incluir passos.");
  }
  if (section.images.some(image => image.step && image.step > section.steps.length)) {
    issue("images", "O passo da imagem não existe.");
  }
});

export const articleSchema = z
  .object({
    title: text(5, 180),
    slug: text(3, 180)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .refine(
        (value) => value !== "novo",
        "Escolha outro endereço para o artigo.",
      ),
    summary: text(15, 500),
    product: text(2, 80),
    category: text(2, 80),
    section: text(2, 80),
    tags: z.array(text(1, 40)).max(12),
    symptoms: text(10, 5000),
    cause: text(10, 5000),
    steps: lines().min(1),
    validation: text(10, 5000),
    warnings: lines(10),
    sources: z.array(source).max(10).default([]),
    status: z.enum(["draft", "published"]),
    requiresDatabaseChange: z.boolean().default(false),
    databaseMode: z.enum(["none","read","write"]).default("none"),
    requiresEscalation: z.boolean().default(false),
    errorMessage: z.string().trim().max(5000).default(""),
    procedureSections: z.array(procedureSection).max(20).default([]),
  })
  .strict();

export const updateSchema = articleSchema.extend({
  version: z.number().int().positive(),
});
export const versionSchema = z
  .object({ version: z.number().int().positive() })
  .strict();
export const listSchema = z
  .object({
    q: z.string().trim().max(200).default(""),
    product: text(1, 80).optional(),
    category: text(1, 80).optional(),
    section: text(1, 80).optional(),
    tag: text(1, 40).optional(),
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    sort: z.enum(["relevance", "recent"]).default("relevance"),
    status: z.enum(["draft", "published"]).optional(),
    deleted: z.enum(["true", "false"]).default("false"),
  })
  .strict();

export function searchExpression(query) {
  const tokens =
    query
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) ?? [];
  return [...new Set(tokens)]
    .slice(0, 12)
    .map((token) => `"${token}"*`)
    .join(" AND ");
}

export function searchBody(article) {
  return [
    article.product,
    article.category,
    article.section,
    ...article.tags,
    article.symptoms,
    article.cause,
    ...article.steps,
    article.validation,
    ...article.warnings,
    article.errorMessage || "",
    ...(article.procedureSections || []).flatMap(section => [section.title, ...section.steps, section.sql ?? "", ...section.images.map(image => image.caption)]),
  ].join("\n");
}

export function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}
