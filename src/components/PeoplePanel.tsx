import type { Person } from '../types';

interface Props {
  people: Person[];
  onChangeDay: (id: string, day: number) => void;
  onAdvanceAll: () => void;
  onUpdatePeople: (people: Person[]) => void;
  images: Record<string, string>;
}

export default function PeoplePanel({
  people,
  onChangeDay,
  onAdvanceAll,
  onUpdatePeople,
  images,
}: Props) {
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

  const renamePerson = (id: string, name: string) => {
    onUpdatePeople(
      people.map((p) => (p.id === id ? { ...p, name } : p))
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Danh sách người</h2>
        <button className="btn small" onClick={addPerson}>
          + Thêm người
        </button>
      </div>

      <div className="people-list">
        {people.map((person) => {
          const hasImage = !!images[String(person.currentDay)];
          return (
            <div key={person.id} className="person-row">
              <input
                className="person-name"
                value={person.name}
                onChange={(e) => renamePerson(person.id, e.target.value)}
              />
              <input
                type="number"
                className="person-day"
                min="0"
                value={person.currentDay}
                onChange={(e) =>
                  onChangeDay(person.id, parseInt(e.target.value, 10) || 0)
                }
              />
              <span className={`badge ${hasImage ? 'ok' : 'missing'}`}>
                {hasImage ? 'Có ảnh' : 'Thiếu ảnh'}
              </span>
              <button
                className="btn small danger"
                onClick={() => removePerson(person.id)}
                title="Xóa"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <button className="btn primary full" onClick={onAdvanceAll}>
        Nâng +1 ngày cho tất cả
      </button>
    </div>
  );
}
