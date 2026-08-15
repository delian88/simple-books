export const createJournalEntry = async ({ data }: { data: any }) => {
  const res = await fetch('/api/ledger.php?action=createJournalEntry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create journal entry');
  }
  return res.json();
};

export const listJournalEntries = async () => {
  const res = await fetch('/api/ledger.php?action=listJournalEntries');
  if (!res.ok) throw new Error('Failed to list journal entries');
  return res.json();
};

export const approveJournalEntry = async ({ data }: { data: { id: string } }) => {
  const res = await fetch('/api/ledger.php?action=approveJournalEntry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  if (!res.ok) throw new Error('Failed to approve journal entry');
  return res.json();
};

export const reverseJournalEntry = async ({ data }: { data: { id: string, date: string, description: string } }) => {
  const res = await fetch('/api/ledger.php?action=reverseJournalEntry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  if (!res.ok) throw new Error('Failed to reverse journal entry');
  return res.json();
};

export const createJournalTemplate = async ({ data }: { data: any }) => {
  const res = await fetch('/api/ledger.php?action=createJournalTemplate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  if (!res.ok) throw new Error('Failed to create journal template');
  return res.json();
};

export const listJournalTemplates = async () => {
  const res = await fetch('/api/ledger.php?action=listJournalTemplates');
  if (!res.ok) throw new Error('Failed to list journal templates');
  return res.json();
};

export const getAccountStatement = async ({ data }: { data: { accountId: string, startDate?: string, endDate?: string } }) => {
  const res = await fetch('/api/ledger.php?action=getAccountStatement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  if (!res.ok) throw new Error('Failed to fetch account statement');
  return res.json();
};

export const getTrialBalance = async () => {
  const res = await fetch('/api/ledger.php?action=getTrialBalance');
  if (!res.ok) throw new Error('Failed to fetch trial balance');
  return res.json();
};

export const getFinancialStatements = async () => {
  const res = await fetch('/api/ledger.php?action=getFinancialStatements');
  if (!res.ok) throw new Error('Failed to fetch financial statements');
  return res.json();
};
