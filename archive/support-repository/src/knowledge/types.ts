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
}
export interface Article extends ArticleDocument {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  deletedAt: string | null;
}
export interface ArticlePage {
  items: Article[];
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
