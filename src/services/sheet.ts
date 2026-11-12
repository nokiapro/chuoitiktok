import type { AppData, Person, User } from '../types';

const SHEET_ID = '1LyK_EwY01BRKrEjLxfWww4lCwD3U5vLe4enNlCcFJrg';

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

export async function fetchSheetData(): Promise<AppData> {
  const base = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=`;

  const [usersRes, peopleRes, imagesRes] = await Promise.all([
    fetch(base + 'Users'),
    fetch(base + 'People'),
    fetch(base + 'Images'),
  ]);

  if (!usersRes.ok || !peopleRes.ok || !imagesRes.ok) {
    throw new Error(
      'Không thể tải dữ liệu từ Google Sheet. Kiểm tra quyền chia sẻ (Anyone with the link) và tên tab Users / People / Images.'
    );
  }

  const [usersText, peopleText, imagesText] = await Promise.all([
    usersRes.text(),
    peopleRes.text(),
    imagesRes.text(),
  ]);

  const usersRows = parseCSV(usersText);
  const peopleRows = parseCSV(peopleText);
  const imagesRows = parseCSV(imagesText);

  // Users
  const users: User[] = [];
  if (usersRows.length > 0) {
    const headers = usersRows[0].map(normalizeHeader);
    const idIdx = headers.findIndex((h) => h === 'user_id' || h === 'userid' || h === 'id');
    const nameIdx = headers.findIndex((h) => h === 'name');
    const secretIdx = headers.findIndex((h) => h === 'secret');

    for (let i = 1; i < usersRows.length; i++) {
      const row = usersRows[i];
      const id = clean(row[idIdx]);
      const name = clean(row[nameIdx]) || id;
      const secret = clean(row[secretIdx]);
      if (id && secret) {
        users.push({ id, name, secret });
      }
    }
  }

  // People
  const people: Person[] = [];
  if (peopleRows.length > 0) {
    const headers = peopleRows[0].map(normalizeHeader);
    const idIdx = headers.findIndex((h) => h === 'id');
    const userIdIdx = headers.findIndex(
      (h) => h === 'user_id' || h === 'userid' || h === 'user'
    );
    const nameIdx = headers.findIndex((h) => h === 'name');
    const dayIdx = headers.findIndex(
      (h) => h === 'currentday' || h === 'current_day'
    );

    for (let i = 1; i < peopleRows.length; i++) {
      const row = peopleRows[i];
      const id = clean(row[idIdx]) || String(i);
      const userId = clean(row[userIdIdx]);
      const name = clean(row[nameIdx]) || `Người ${i}`;
      const currentDay = parseInt(clean(row[dayIdx]) || '1', 10) || 1;

      // Nếu chưa có cột USER_ID thì gán tạm 'default' để tương thích sheet cũ
      people.push({
        id,
        userId: userId || 'default',
        name,
        currentDay,
      });
    }
  }

  // Images
  const images: Record<string, string> = {};
  if (imagesRows.length > 0) {
    const headers = imagesRows[0].map(normalizeHeader);
    const dayIdx = headers.findIndex((h) => h === 'day');
    const fileIdx = headers.findIndex(
      (h) => h === 'fileid' || h === 'fileld' || h === 'file_id'
    );

    for (let i = 1; i < imagesRows.length; i++) {
      const row = imagesRows[i];
      const day = clean(row[dayIdx]);
      const fileId = clean(row[fileIdx]);
      if (day && fileId) {
        images[day] = fileId;
      }
    }
  }

  return { users, people, images };
}
