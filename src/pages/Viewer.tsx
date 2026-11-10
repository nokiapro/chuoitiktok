import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AppData, Person } from '../types';
import { fetchSheetData } from '../services/sheet';
import { getImageUrl, getDownloadUrl, getViewUrl } from '../utils/drive';

export default function Viewer() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchSheetData();
      setData(result);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadAll = () => {
    if (!data) return;
    data.people.forEach((p) => {
      const fileId = data.images[String(p.currentDay)];
      if (fileId) {
        const a = document.createElement('a');
        a.href = getDownloadUrl(fileId);
        a.download = `ngay_${p.currentDay}.png`;
        a.target = '_blank';
        a.click();
      }
    });
  };

  if (loading && !data) {
    return (
      <div className="viewer">
        <div className="loading-state">Đang tải dữ liệu từ Google Sheet...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="viewer">
        <div className="error-state">
          <p>{error}</p>
          <button className="btn primary" onClick={loadData}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const people = data?.people || [];
  const images = data?.images || {};
  const availableCount = people.filter((p) => images[String(p.currentDay)]).length;

  return (
    <div className="viewer">
      <header className="viewer-header">
        <div>
          <h1>Streak</h1>
          <p>
            Chuỗi ngày hôm nay
            {lastUpdated && (
              <span className="last-updated">
                {' '}
                · Cập nhật {lastUpdated.toLocaleTimeString('vi-VN')}
              </span>
            )}
          </p>
        </div>
        <div className="viewer-actions">
          <button className="btn" onClick={loadData} disabled={loading}>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
          {availableCount > 0 && (
            <button className="btn primary" onClick={handleDownloadAll}>
              Tải tất cả
            </button>
          )}
          <Link to="/admin" className="btn ghost">
            Admin
          </Link>
        </div>
      </header>

      {error && (
        <div className="banner-error">
          {error} — đang hiện dữ liệu cũ
        </div>
      )}

      {people.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có dữ liệu người trong Google Sheet.</p>
          <p className="muted">Hãy thêm dòng vào tab <b>People</b>.</p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
