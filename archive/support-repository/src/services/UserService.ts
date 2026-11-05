import api from "./ApiConfig";
import type { User } from "../models/UserModel";

export const UserService = {
  async list(): Promise<User[]> {
    const { data } = await api.get<User[]>("/users");
    return data;
  },

  async updateRole(userId: string, role: "MASTER" | "USER"): Promise<User> {
    const { data } = await api.patch<User>(`/users/${userId}/role`, { role });
    return data;
  },
};

export default UserService;
