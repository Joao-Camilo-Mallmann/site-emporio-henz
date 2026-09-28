import { api as axios } from "@/plugins/axios";

interface HealthcheckResponse {
  status: string;
  timestamp?: string;
  uptime?: number;
}

export default {
  async status(): Promise<HealthcheckResponse> {
    const response = await axios.get<HealthcheckResponse>("/health");
    return response.data;
  },
};
