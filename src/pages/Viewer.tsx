import { Link } from 'react-router-dom';
import type { Person } from '../types';
import { getImageUrl, getDownloadUrl, getViewUrl } from '../utils/drive';

interface Props {
  people: Person[];
  images: Record<string, string>;
  onAdvanceAll: () => void;
}

export default function Viewer({ people, images, onAdvanceAll }: Props) {
  const handleDownloadAll = () => {
    people.forEach((p) => {
      const fileId = images[String(p.currentDay)];
      if (fileId) {
        const a = document.createElement('a');
        a.href = getDownloadUrl(fileId);
        a.download = `ngay_${p.currentDay}.png`;
        a.target = '_blank';
        a.click();
      }
    });
  };

  const availableCount = people.filter((p) => images[String(p.currentDay)]).length;

  return (
    <div className="viewer">
      <header className="viewer-header">
        <div>
          <h1>Streak</h1>
          <p>Chuỗi ngày hôm nay</p>
        </div>
        <div className="viewer-actions">
          <button className="btn primary" onClick={onAdvanceAll}>
            Nâng +1 ngày
          </button>
          {availableCount > 0 && (
            <button className="btn" onClick={handleDownloadAll}>
              Tải tất cả
            </button>
          )}
          <Link to="/admin" className="btn ghost">
            Admin
          </Link>
        </div>
      </header>

      <div className="viewer-grid">
        {people.map((person) => {
          const fileId = images[String(person.currentDay)];
          return (
            <div key={person.id} className="viewer-card">
              <div className="viewer-card-header">
                <span className="person-name">{person.name}</span>
                <span className="day-chip">Ngày {person.currentDay}</span>
              </div>

              {fileId ? (
                <>
                  <a
                    href={getViewUrl(fileId)}
                    target="_blank"
                    rel="noreferrer"
                    className="viewer-img"
                  >
                    <img
                      src={getImageUrl(fileId)}
                      alt={`Ngày ${person.currentDay}`}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://placehold.co/300x300/1a1a20/666?text=No+Image';
                      }}
                    />
                  </a>
                  <div className="viewer-card-actions">
                    <a
                      className="btn small primary"
                      href={getDownloadUrl(fileId)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Tải về
                    </a>
                    <a
                      className="btn small"
                      href={getViewUrl(fileId)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Mở
                    </a>
                  </div>
                </>
              ) : (
                <div className="viewer-empty">
                  <span>Chưa có ảnh</span>
                  <small>Ngày {person.currentDay}</small>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
