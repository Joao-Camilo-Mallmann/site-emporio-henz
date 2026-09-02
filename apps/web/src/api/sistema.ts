import { api as axios } from "@/plugins/axios";
import type { BackendStatus } from "@/types";

export default {
  async status(): Promise<BackendStatus> {
    const response = await axios.get<BackendStatus>("/health");
    return response.data;
  },
};
