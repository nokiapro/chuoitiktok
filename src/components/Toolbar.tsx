import { AppData } from '../types';

interface Props {
  data: AppData;
  onImport: (data: AppData) => void;
  onReset: () => void;
}

export default function Toolbar({ data, onImport, onReset }: Props) {
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streak-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as AppData;
        if (!parsed.people || !parsed.images) {
          alert('File JSON không đúng định dạng');
          return;
        }
        if (confirm('Import sẽ ghi đè dữ liệu hiện tại. Tiếp tục?')) {
          onImport(parsed);
        }
      } catch {
        alert('Không đọc được file JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="toolbar">
      <button className="btn" onClick={handleExport}>
        Xuất JSON
      </button>

      <label className="btn">
        Import JSON
        <input
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          hidden
        />
      </label>

      <button className="btn danger" onClick={onReset}>
        Reset
      </button>
    </div>
  );
}
