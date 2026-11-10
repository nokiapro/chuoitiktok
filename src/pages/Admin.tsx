import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Person } from '../types';

interface Props {
  people: Person[];
  onUpdatePeople: (people: Person[]) => void;
}

export default function Admin({ people, onUpdatePeople }: Props) {
  const [copied, setCopied] = useState(false);

  const addPerson = () => {
    const newId = String(Date.now());
    const nextIndex = people.length + 1;
    onUpdatePeople([
      ...people,
      { id: newId, name: `Người ${nextIndex}`, currentDay: 1 },
    ]);
  };

  const removePerson = (id: string) => {
    if (people.length <= 1) {
      alert('Phải còn ít nhất 1 người');
      return;
    }
    if (confirm('Xóa người này?')) {
      onUpdatePeople(people.filter((p) => p.id !== id));
    }
  };

  const updatePerson = (id: string, field: 'name' | 'currentDay', value: string | number) => {
    onUpdatePeople(
      people.map((p) =>
        p.id === id
          ? {
              ...p,
              [field]: field === 'currentDay' ? Math.max(0, Number(value) || 0) : value,
            }
          : p
      )
    );
  };

  const copyForSheet = () => {
    // Tạo CSV đúng format để dán vào tab People
    const header = 'ID,NAME,CURRENTDAY';
    const rows = people.map((p) => `${p.id},${p.name},${p.currentDay}`);
    const csv = [header, ...rows].join('\n');

    navigator.clipboard.writeText(csv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="admin">
      <header className="admin-header">
        <div>
          <h1>Admin</h1>
          <p>Chỉ quản lý danh sách người</p>
        </div>
        <Link to="/" className="btn">
          ← Về trang chính
        </Link>
      </header>

      <div className="card">
        <div className="card-header">
          <h2>Danh sách người ({people.length})</h2>
          <button className="btn small" onClick={addPerson}>
            + Thêm người
          </button>
        </div>

        <div className="people-list">
          {people.map((person) => (
            <div key={person.id} className="person-row admin-person">
              <input
                className="person-name"
                value={person.name}
                onChange={(e) => updatePerson(person.id, 'name', e.target.value)}
                placeholder="Tên người"
              />
              <input
                type="number"
                className="person-day"
                min="0"
                value={person.currentDay}
                onChange={(e) => updatePerson(person.id, 'currentDay', e.target.value)}
              />
              <button
                className="btn small danger"
                onClick={() => removePerson(person.id)}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>

        <button className="btn primary full" onClick={copyForSheet} style={{ marginTop: 16 }}>
          {copied ? 'Đã copy!' : 'Copy dữ liệu để dán vào Google Sheet'}
        </button>
      </div>

      <div className="admin-note">
        <strong>Cách dùng:</strong>
        <br />
        1. Thêm / sửa tên và ngày hiện tại ở trên
        <br />
        2. Bấm <b>Copy dữ liệu để dán vào Google Sheet</b>
        <br />
        3. Mở tab <b>People</b> trên Google Sheet → chọn ô A1 → Paste
        <br />
        4. Ảnh thì thêm trực tiếp vào tab <b>Images</b> (cột DAY + FILEID)
        <br />
        5. Về trang chính bấm <b>Làm mới</b> để thấy thay đổi
      </div>
    </div>
  );
}
