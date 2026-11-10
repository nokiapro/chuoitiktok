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
          <p>Quản lý tạm · Dữ liệu chính nằm ở Google Sheet</p>
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
        <strong>Cách dùng với Google Sheet:</strong>
        <br />
        1. Dùng trang này để thêm ảnh / chỉnh ngày tạm thời
        <br />
        2. Bấm <b>Xuất JSON</b> hoặc copy thủ công sang Google Sheet
        <br />
        3. Tab <b>People</b>: cột id, name, currentDay
        <br />
        4. Tab <b>Images</b>: cột day, fileId (hoặc FILELD)
        <br />
        5. Về trang chính bấm <b>Làm mới</b> để thấy dữ liệu mới từ Sheet
      </div>
    </div>
  );
}
