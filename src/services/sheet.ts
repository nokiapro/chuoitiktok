import type { AppData, Person, User } from '../types';

const SHEET_ID = '1VoLBFNqRTW-gheRHlXh4glhE32Z5TXk3oRiC2nQLCB0';
const USERS_GID = '1222537680';

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (current || row.length) {
        row.push(current.trim());
        rows.push(row);
        row = [];
        current = '';
      }
      if (char === '\r' && next === '\n') i++;
      continue;
    }

    current += char;
  }

  if (current || row.length) {
    row.push(current.trim());
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.length > 0));
}

function normalizeHeader(h: string): string {
  return h.replace(/^"|"$/g, '').trim().toLowerCase();
}

function clean(v: string | undefined): string {
  return (v || '').replace(/^"|"$/g, '').trim();
}

function looksLikeHtml(text: string): boolean {
  const t = text.trim().toLowerCase();
  return t.startsWith('<!doctype') || t.startsWith('<html') || t.includes('window[\'ppconfig\']');
}

async function fetchCsv(url: string): Promise<string[][] | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || looksLikeHtml(text)) return null;
    const rows = parseCSV(text);
    if (rows.length === 0) return null;
    return rows;
  } catch {
    return null;
  }
}

function parseUsers(rows: string[][]): User[] {
  const headers = rows[0].map(normalizeHeader);
  // Phải có cột secret mới coi là tab Users thật
  const secretIdx = headers.findIndex((h) => h === 'secret');
  if (secretIdx === -1) return [];

  const idIdx = headers.findIndex(
    (h) => h === 'user_id' || h === 'userid' || h === 'id'
  );
  const nameIdx = headers.findIndex((h) => h === 'name');

  const users: User[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const id = clean(row[idIdx]) || `u${i}`;
    const name = clean(row[nameIdx]) || id;
    const secret = clean(row[secretIdx]);
    if (secret) users.push({ id, name, secret });
  }
  return users;
}

function parsePeople(rows: string[][]): Person[] {
  if (rows.length === 0) return [];
  const headers = rows[0].map(normalizeHeader);
  const idIdx = headers.findIndex((h) => h === 'id');
  const userIdIdx = headers.findIndex(
    (h) => h === 'user_id' || h === 'userid' || h === 'user'
  );
  const nameIdx = headers.findIndex((h) => h === 'name');
  const dayIdx = headers.findIndex(
    (h) => h === 'currentday' || h === 'current_day'
  );

  const people: Person[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const id = clean(row[idIdx]) || String(i);
    const userId = userIdIdx >= 0 ? clean(row[userIdIdx]) : '';
    const name = clean(row[nameIdx]) || `Người ${i}`;
    const currentDay = parseInt(clean(row[dayIdx]) || '1', 10) || 1;
    people.push({
      id,
      userId: userId || 'u1', // mặc định u1 nếu chưa có cột USER_ID
      name,
      currentDay,
    });
  }
  return people;
}

function parseImages(rows: string[][]): Record<string, string> {
  const images: Record<string, string> = {};
  if (rows.length === 0) return images;
  const headers = rows[0].map(normalizeHeader);
  const dayIdx = headers.findIndex((h) => h === 'day');
  const fileIdx = headers.findIndex(
    (h) => h === 'fileid' || h === 'fileld' || h === 'file_id'
  );
  for (let i = 1; i < rows.length; i++) {
    const day = clean(rows[i][dayIdx]);
    const fileId = clean(rows[i][fileIdx]);
    if (day && fileId) images[day] = fileId;
  }
  return images;
}

export async function fetchSheetData(): Promise<AppData> {
  const baseGviz = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
  const baseExport = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

  // Users: thử theo tên, rồi theo gid
  let usersRows =
    (await fetchCsv(`${baseGviz}&sheet=Users`)) ||
    (await fetchCsv(`${baseGviz}&gid=${USERS_GID}`)) ||
    (await fetchCsv(`${baseExport}&gid=${USERS_GID}`));

  let users = usersRows ? parseUsers(usersRows) : [];

  // Fallback: nếu không đọc được Users tab → 1 user mặc định
  if (users.length === 0) {
    users = [{ id: 'u1', name: 'XuanKen', secret: '12051994' }];
  }

  const peopleRows =
    (await fetchCsv(`${baseGviz}&sheet=People`)) ||
    (await fetchCsv(`${baseGviz}&gid=0`));
  const people = peopleRows ? parsePeople(peopleRows) : [];

  const imagesRows =
    (await fetchCsv(`${baseGviz}&sheet=Images`)) ||
    (await fetchCsv(`${baseGviz}&gid=1913989790`));
  const images = imagesRows ? parseImages(imagesRows) : {};

  return { users, people, images };
}
