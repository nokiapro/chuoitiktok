import { useEffect, useState } from 'react';
import type { AppData, Person } from '../types';
import { fetchSheetData } from '../services/sheet';
import { getImageUrl, getDownloadUrl, getViewUrl } from '../utils/drive';

const ADVANCE_URL =
  'https://script.google.com/macros/s/AKfycbyUibvFnuq5jrH6nEKSvksu4yxvym4g_zNIdD4DHVs-AIJJ0R8gLIrnzqf5xpbD4BO-iQ/exec';
const SECRET = '12051994';

export default function Viewer() {
  const [data, setData] = useState<AppData | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchSheetData();
      setData(result);
      setPeople(result.people);
      setLastUpdated(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdvance = async () => {
    if (advancing) return;
    if (!confirm('Tăng +1 ngày cho tất cả người và lưu vào Google Sheet?')) return;

    setAdvancing(true);
    setError('');
    setInfo('');

    try {
      const url = `${ADVANCE_URL}?action=advance&secret=${encodeURIComponent(SECRET)}`;
      const res = await fetch(url, { method: 'GET', redirect: 'follow' });
      const text = await res.text();

      let json: { ok?: boolean; error?: string; message?: string; updated?: number };
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error('Phản hồi từ script không hợp lệ. Kiểm tra lại deploy Apps Script.');
      }

      if (!json.ok) {
        throw new Error(json.error || 'Không thể tăng ngày');
      }

      setInfo(json.message || `Đã tăng +1 cho ${json.updated ?? ''} người`);
      // Tải lại dữ liệu mới từ Sheet
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi khi tăng ngày');
    } finally {
      setAdvancing(false);
    }
  };

  const handleDownloadAll = () => {
    if (!data) return;
    people.forEach((p) => {
      const fileId = data.images[String(p.currentDay)];
      if (fileId) {
        const a = document.createElement('a');
        a.href = getDownloadUrl(fileId);
        a.download = `ngay_${p.currentDay}_${p.name}.png`;
        a.target = '_blank';
        a.click();
      }
    });
  };

  if (loading && !data) {
    return (
      <div className="viewer">
        <div className="loading-state">
          <div className="spinner" />
          <p>Đang tải dữ liệu...</p>
        </div>
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

  const images = data?.images || {};
  const availableCount = people.filter((p) => images[String(p.currentDay)]).length;

  return (
    <div className="viewer">
      <header className="viewer-header">
        <div className="header-left">
          <h1>Streak</h1>
          <p className="subtitle">
            Chuỗi ngày hôm nay
            {lastUpdated && (
              <span className="last-updated">
                · {lastUpdated.toLocaleTimeString('vi-VN')}
              </span>
            )}
          </p>
        </div>

        <div className="viewer-actions">
          <button className="btn" onClick={loadData} disabled={loading || advancing}>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
          <button
            className="btn primary"
            onClick={handleAdvance}
            disabled={loading || advancing}
          >
            {advancing ? 'Đang lưu...' : 'Nâng +1 ngày'}
          </button>
          {availableCount > 0 && (
            <button className="btn accent" onClick={handleDownloadAll}>
              Tải tất cả ({availableCount})
            </button>
          )}
        </div>
      </header>

      {error && <div className="banner-error">{error}</div>}
      {info && <div className="banner-info">{info}</div>}

      {people.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có dữ liệu người trong Google Sheet.</p>
          <p className="muted">Thêm dòng vào tab <b>People</b>.</p>
        </div>
      ) : (
        <div className="viewer-grid">
          {people.map((person) => {
            const fileId = images[String(person.currentDay)];
            return (
              <div
                key={person.id}
                className={`viewer-card ${fileId ? 'has-image' : ''}`}
              >
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
                            'https://placehold.co/300x300/16161d/555?text=No+Image';
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
