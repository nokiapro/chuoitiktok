import { useEffect, useState } from 'react';
import type { AppData, Person, User } from '../types';
import { fetchSheetData } from '../services/sheet';
import { getImageUrl, getDownloadUrl, getViewUrl } from '../utils/drive';

const ADVANCE_URL =
  'https://script.google.com/macros/s/AKfycbwBgq9PCtdyRJcL0OyzeLDzio4TmTpoGDCg0GH-ZtxkfotdYP14N1l9TFQzcpEeLeqC/exec';
const STORAGE_KEY = 'streak-user-secret';

export default function Viewer() {
  const [data, setData] = useState<AppData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Login form
  const [secretInput, setSecretInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const applyUser = (all: AppData, selected: User) => {
    setUser(selected);
    setPeople(all.people.filter((p) => p.userId === selected.id));
    setData(all);
    setLastUpdated(new Date());
  };

  const loadData = async (currentUser?: User | null) => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchSheetData();
      setData(result);

      const active = currentUser || user;
      if (active) {
        // Tìm lại user theo secret (phòng khi sheet đổi)
        const matched = result.users.find((u) => u.secret === active.secret);
        if (matched) {
          applyUser(result, matched);
        } else {
          // Secret không còn hợp lệ
          setUser(null);
          setPeople([]);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      setLastUpdated(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Lần đầu: thử đăng nhập từ localStorage
  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      try {
        const result = await fetchSheetData();
        setData(result);

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const matched = result.users.find((u) => u.secret === saved);
          if (matched) {
            applyUser(result, matched);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!data) {
      setLoginError('Chưa tải được dữ liệu Sheet');
      return;
    }
    const matched = data.users.find((u) => u.secret === secretInput.trim());
    if (!matched) {
      setLoginError('Secret không đúng');
      return;
    }
    localStorage.setItem(STORAGE_KEY, matched.secret);
    applyUser(data, matched);
    setSecretInput('');
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setPeople([]);
    setInfo('');
  };

  const handleAdvance = async () => {
    if (advancing || !user) return;
    if (!confirm(`Tăng +1 ngày cho tất cả streak của "${user.name}" và lưu vào Sheet?`)) {
      return;
    }

    setAdvancing(true);
    setError('');
    setInfo('');

    try {
      const url =
        `${ADVANCE_URL}?action=advance` +
        `&secret=${encodeURIComponent(user.secret)}` +
        `&user_id=${encodeURIComponent(user.id)}`;

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
      await loadData(user);
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

  // Loading lần đầu
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
          <button className="btn primary" onClick={() => loadData()}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập
  if (!user) {
    return (
      <div className="viewer">
        <div className="login-card">
          <h1>Streak</h1>
          <p className="login-desc">Nhập secret để xem streak của bạn</p>
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="password"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              placeholder="Secret"
              autoFocus
              required
            />
            {loginError && <p className="login-error">{loginError}</p>}
            <button type="submit" className="btn primary full">
              Đăng nhập
            </button>
          </form>
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
            {user.name}
            {lastUpdated && (
              <span className="last-updated">
                {' '}
                · {lastUpdated.toLocaleTimeString('vi-VN')}
              </span>
            )}
          </p>
        </div>

        <div className="viewer-actions">
          <button
            className="btn"
            onClick={() => loadData(user)}
            disabled={loading || advancing}
          >
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
              Tải ({availableCount})
            </button>
          )}
          <button className="btn ghost" onClick={handleLogout}>
            Thoát
          </button>
        </div>
      </header>

      {error && <div className="banner-error">{error}</div>}
      {info && <div className="banner-info">{info}</div>}

      {people.length === 0 ? (
        <div className="empty-state">
          <p>Bạn chưa có streak nào.</p>
          <p className="muted">
            Thêm dòng vào tab <b>People</b> với USER_ID = <b>{user.id}</b>
          </p>
        </div>
      ) : (
        <div className="list">
          {people.map((person, index) => {
            const fileId = images[String(person.currentDay)];
            return (
              <div
                key={person.id}
                className={`list-item ${fileId ? 'has-image' : ''}`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="list-thumb">
                  {fileId ? (
                    <a
                      href={getViewUrl(fileId)}
                      target="_blank"
                      rel="noreferrer"
                      className="thumb-link"
                    >
                      <img
                        src={getImageUrl(fileId)}
                        alt={`Ngày ${person.currentDay}`}
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://placehold.co/120x120/16161d/555?text=—';
                        }}
                      />
                    </a>
                  ) : (
                    <div className="thumb-empty">
                      <span>—</span>
                    </div>
                  )}
                </div>

                <div className="list-body">
                  <div className="list-top">
                    <span className="person-name">{person.name}</span>
                    <span className="day-chip">Ngày {person.currentDay}</span>
                  </div>
                  <div className="list-meta">
                    {fileId ? 'Có ảnh' : 'Chưa có ảnh'}
                  </div>
                </div>

                <div className="list-actions">
                  {fileId ? (
                    <>
                      <a
                        className="btn small primary"
                        href={getDownloadUrl(fileId)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Tải
                      </a>
                      <a
                        className="btn small"
                        href={getViewUrl(fileId)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Mở
                      </a>
                    </>
                  ) : (
                    <span className="no-action">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
