import { useState } from 'react';
import { extractFileId } from '../utils/drive';

interface Props {
  onAdd: (day: number, fileId: string) => void;
  existingDays: string[];
}

export default function AddImageForm({ onAdd, existingDays }: Props) {
  const [link, setLink] = useState('');
  const [day, setDay] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const fileId = extractFileId(link);
    if (!fileId) {
      setError('Link không hợp lệ. Hãy dán dạng: https://drive.google.com/file/d/xxxxx/view');
      return;
    }

    const dayNum = parseInt(day, 10);
    if (isNaN(dayNum) || dayNum < 1) {
      setError('Số ngày phải là số nguyên dương');
      return;
    }

    const isOverwrite = existingDays.includes(String(dayNum));
    onAdd(dayNum, fileId);

    setSuccess(
      isOverwrite
        ? `Đã cập nhật ảnh cho ngày ${dayNum}`
        : `Đã thêm ảnh ngày ${dayNum}`
    );
    setLink('');
    setDay('');
  };

  return (
    <div className="card">
      <h2>Thêm / Cập nhật ảnh</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Link ảnh Google Drive</label>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://drive.google.com/file/d/xxxxx/view"
            required
          />
        </div>

        <div className="form-group">
          <label>Số ngày</label>
          <input
            type="number"
            min="1"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            placeholder="Ví dụ: 114"
            required
          />
        </div>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <button type="submit" className="btn primary">
          Thêm ảnh
        </button>
      </form>
    </div>
  );
}
