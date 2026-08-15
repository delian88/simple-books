export const listAccounts = async () => {
  const res = await fetch('/api/accounts.php?action=listAccounts');
  if (!res.ok) throw new Error('Failed to list accounts');
  return res.json();
};

export const addAccount = async ({ data }: { data: any }) => {
  const res = await fetch('/api/accounts.php?action=addAccount', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  if (!res.ok) throw new Error('Failed to add account');
  return res.json();
};

export const updateAccount = async ({ data }: { data: any }) => {
  const res = await fetch('/api/accounts.php?action=updateAccount', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  if (!res.ok) throw new Error('Failed to update account');
  return res.json();
};

export const deleteAccount = async ({ data }: { data: { id: string } }) => {
  const res = await fetch('/api/accounts.php?action=deleteAccount', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  if (!res.ok) throw new Error('Failed to delete account');
  return res.json();
};
