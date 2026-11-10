import type { Person } from '../types';
import { getImageUrl, getDownloadUrl, getViewUrl } from '../utils/drive';

interface Props {
  people: Person[];
  images: Record<string, string>;
}

export default function CurrentImages({ people, images }: Props) {
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

  const available = people.filter((p) => images[String(p.currentDay)]);

  return (
    <div className="card">
      <div className="card-header">
        <h2>Ảnh ngày hiện tại</h2>
        {available.length > 0 && (
          <button className="btn small" onClick={handleDownloadAll}>
            Tải tất cả ({available.length})
          </button>
        )}
      </div>

      <div className="current-grid">
        {people.map((person) => {
          const fileId = images[String(person.currentDay)];
          return (
            <div key={person.id} className="current-item">
              <div className="current-label">
                <strong>{person.name}</strong>
                <span>Ngày {person.currentDay}</span>
              </div>

              {fileId ? (
                <>
                  <a
                    href={getViewUrl(fileId)}
                    target="_blank"
                    rel="noreferrer"
                    className="img-wrapper"
                  >
                    <img
                      src={getImageUrl(fileId)}
                      alt={`Ngày ${person.currentDay}`}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://via.placeholder.com/200x200?text=Không+tải+được';
                      }}
                    />
                  </a>
                  <div className="img-actions">
                    <a
                      className="btn small"
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
                      Mở Drive
                    </a>
                  </div>
                </>
              ) : (
                <div className="no-image">Chưa có ảnh ngày {person.currentDay}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
