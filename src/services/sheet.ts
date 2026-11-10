import type { AppData, Person } from '../types';

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

export async function fetchSheetData(): Promise<AppData> {
  const peopleUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=People`;
  const imagesUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Images`;

  const [peopleRes, imagesRes] = await Promise.all([
    fetch(peopleUrl),
    fetch(imagesUrl),
  ]);

  if (!peopleRes.ok || !imagesRes.ok) {
    throw new Error('Không thể tải dữ liệu từ Google Sheet. Kiểm tra quyền chia sẻ (Anyone with the link).');
  }

  const peopleText = await peopleRes.text();
  const imagesText = await imagesRes.text();

  const peopleRows = parseCSV(peopleText);
  const imagesRows = parseCSV(imagesText);

  // Parse People
  const people: Person[] = [];
  if (peopleRows.length > 0) {
    const headers = peopleRows[0].map(normalizeHeader);
    const idIdx = headers.findIndex((h) => h === 'id');
    const nameIdx = headers.findIndex((h) => h === 'name');
    const dayIdx = headers.findIndex((h) => h === 'currentday' || h === 'current_day');

    for (let i = 1; i < peopleRows.length; i++) {
      const row = peopleRows[i];
      const id = (row[idIdx] || String(i)).replace(/^"|"$/g, '');
      const name = (row[nameIdx] || `Người ${i}`).replace(/^"|"$/g, '');
      const dayStr = (row[dayIdx] || '1').replace(/^"|"$/g, '');
      const currentDay = parseInt(dayStr, 10) || 1;

      people.push({ id, name, currentDay });
    }
  }

  // Parse Images
  const images: Record<string, string> = {};
  if (imagesRows.length > 0) {
    const headers = imagesRows[0].map(normalizeHeader);
    const dayIdx = headers.findIndex((h) => h === 'day');
    // Accept both fileid and the typo fileld
    const fileIdx = headers.findIndex((h) => h === 'fileid' || h === 'fileld' || h === 'file_id');

    for (let i = 1; i < imagesRows.length; i++) {
      const row = imagesRows[i];
      const day = (row[dayIdx] || '').replace(/^"|"$/g, '').trim();
      const fileId = (row[fileIdx] || '').replace(/^"|"$/g, '').trim();

      if (day && fileId) {
        images[day] = fileId;
      }
    }
  }

  return { people, images };
}
