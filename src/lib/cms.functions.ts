import { apiGet, apiPost } from "@/lib/api";

export const listPages = () => apiGet('/api/cms.php?action=listPages');

export const getPage = ({ queryKey }: any) => {
  const [_key, id] = queryKey;
  return apiGet(`/api/cms.php?action=getPage&id=${id}`);
};

export const getPageBySlug = async (slug: string) => {
  const res = await fetch(`http://localhost:8000/api/cms.php?action=getPageBySlug&slug=${slug}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch page');
  }
  return res.json();
};

export const savePage = ({ data }: { data: any }) =>
  apiPost('/api/cms.php?action=savePage', data);

export const deletePage = ({ data }: { data: { id: string } }) =>
  apiPost('/api/cms.php?action=deletePage', data);
