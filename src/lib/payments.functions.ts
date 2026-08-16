import { apiGet, apiPost } from "@/lib/api";

export const listGateways = () => apiGet('/api/payments.php?action=listGateways');

export const upsertGateway = ({ data }: { data: any }) =>
  apiPost('/api/payments.php?action=upsertGateway', data);
