import { useState, useMemo } from 'react';
import { getImageUrl, getViewUrl, getDownloadUrl } from '../utils/drive';

interface Props {
  images: Record<string, string>;
  onRemove: (day: number) => void;
}

export default function ImageList({ images, onRemove }: Props) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const sortedDays = useMemo(() => {
    return Object.keys(images)
      .map(Number)
      .filter((d) => !isNaN(d))
      .sort((a, b) => a - b);
  }, [images]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sortedDays;
    const q = search.trim();
    return sortedDays.filter((d) => String(d).includes(q));
  }, [sortedDays, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  return (
    <div className="card">
      <div className="card-header">
        <h2>Danh sách ảnh ({sortedDays.length})</h2>
        <input
          type="text"
          className="search-input"
          placeholder="Tìm theo số ngày..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="empty">Chưa có ảnh nào hoặc không tìm thấy.</p>
      ) : (
        <>
          <div className="image-list">
            {pageItems.map((day) => {
              const fileId = images[String(day)];
              return (
                <div key={day} className="image-row">
                  <div className="day-badge">Ngày {day}</div>
                  <a
                    href={getViewUrl(fileId)}
                    target="_blank"
                    rel="noreferrer"
                    className="thumb"
                  >
                    <img
                      src={getImageUrl(fileId)}
                      alt={`Ngày ${day}`}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </a>
                  <div className="row-actions">
                    <a
                      className="btn small"
                      href={getDownloadUrl(fileId)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Tải
                    </a>
                    <button
                      className="btn small danger"
                      onClick={() => {
                        if (confirm(`Xóa ảnh ngày ${day}?`)) onRemove(day);
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn small"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Trước
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                className="btn small"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
