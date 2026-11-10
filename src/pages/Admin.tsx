import { Link } from 'react-router-dom';
import type { AppData, Person } from '../types';
import AddImageForm from '../components/AddImageForm';
import ImageList from '../components/ImageList';
import PeoplePanel from '../components/PeoplePanel';
import Toolbar from '../components/Toolbar';

interface Props {
  data: AppData;
  updatePeople: (people: Person[]) => void;
  setPersonDay: (id: string, day: number) => void;
  advanceAll: () => void;
  addOrUpdateImage: (day: number, fileId: string) => void;
  removeImage: (day: number) => void;
  importData: (data: AppData) => void;
  resetData: () => void;
}

export default function Admin({
  data,
  updatePeople,
  setPersonDay,
  advanceAll,
  addOrUpdateImage,
  removeImage,
  importData,
  resetData,
}: Props) {
  return (
    <div className="admin">
      <header className="admin-header">
        <div>
          <h1>Admin</h1>
          <p>Quản lý người & ảnh</p>
        </div>
        <Link to="/" className="btn">
          ← Về trang chính
        </Link>
      </header>

      <Toolbar data={data} onImport={importData} onReset={resetData} />

      <div className="admin-grid">
        <div className="admin-left">
          <PeoplePanel
            people={data.people}
            onChangeDay={setPersonDay}
            onAdvanceAll={advanceAll}
            onUpdatePeople={updatePeople}
            images={data.images}
          />
          <AddImageForm
            onAdd={addOrUpdateImage}
            existingDays={Object.keys(data.images)}
          />
        </div>
        <div className="admin-right">
          <ImageList images={data.images} onRemove={removeImage} />
        </div>
      </div>

      <div className="admin-note">
        <strong>Lưu ý:</strong> Dữ liệu được lưu tạm trên trình duyệt. 
        Hãy thường xuyên bấm <b>Xuất JSON</b> để lưu thành file backup. 
        Khi sang máy/điện thoại khác, dùng <b>Import JSON</b> để khôi phục.
      </div>
    </div>
  );
}
