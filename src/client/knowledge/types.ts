export interface ArticleImage { id: string; url: string; caption: string; step?: number }
export interface ProcedureSection { id: string; title: string; steps: string[]; images: ArticleImage[] }
export interface ArticleDocument {
  title: string;
  slug: string;
  summary: string;
  product: string;
  category: string;
  section: string;
  tags: string[];
  symptoms: string;
  cause: string;
  steps: string[];
  validation: string;
  warnings: string[];
  sources: { title: string; url: string }[];
  status: "draft" | "published";
  requiresDatabaseChange?: boolean;
  databaseMode?: "none" | "read" | "write";
  requiresEscalation?: boolean;
  errorMessage?: string;
  procedureSections?: ProcedureSection[];
}
export interface Article extends ArticleDocument {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  deletedAt: string | null;
}
export type ArticleSummary = Pick<Article,"id"|"title"|"slug"|"summary"|"product"|"category"|"section"|"tags"|"status"|"updatedAt"|"requiresDatabaseChange"|"databaseMode"|"requiresEscalation">;
export interface ArticlePage<T = ArticleSummary> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
export interface Facet {
  value: string;
  count: number;
}
export interface Facets {
  products: Facet[];
  categories: Facet[];
  sections: Facet[];
  tags: Facet[];
}
export interface Session {
  user: { username: string; role: "support" } | null;
  loginEnabled: boolean;
}
