import { apiGet, apiPost } from "@/lib/api";

export const listPages = () => apiGet('/api/cms.php?action=listPages');

export const getPageBySlug = ({ data }: { data: { slug: string } }) =>
  apiPost('/api/cms.php?action=getPageBySlug', data);

export const upsertPage = ({ data }: { data: any }) =>
  apiPost('/api/cms.php?action=upsertPage', data);

export const deletePage = ({ data }: { data: { id: string } }) =>
  apiPost('/api/cms.php?action=deletePage', data);
