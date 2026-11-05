import api from "./ApiConfig";
import type { CreateTagPayload, Tag, UpdateTagPayload } from "../models/TagModel";

export const TagService = {
  async list(search?: string): Promise<Tag[]> {
    const { data } = await api.get<Tag[]>("/tags", {
      params: search ? { search } : undefined,
    });
    return data;
  },

  async getById(id: string): Promise<Tag> {
    const { data } = await api.get<Tag>(`/tags/${id}`);
    return data;
  },

  async create(payload: CreateTagPayload): Promise<Tag> {
    const { data } = await api.post<Tag>("/tags", payload);
    return data;
  },

  async update(id: string, payload: UpdateTagPayload): Promise<Tag> {
    const { data } = await api.patch<Tag>(`/tags/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/tags/${id}`);
  },
};

export default TagService;
