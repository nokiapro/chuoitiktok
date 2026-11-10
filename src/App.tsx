import { useAppData } from './hooks/useAppData';
import PeoplePanel from './components/PeoplePanel';
import CurrentImages from './components/CurrentImages';
import AddImageForm from './components/AddImageForm';
import ImageList from './components/ImageList';
import Toolbar from './components/Toolbar';
import './App.css';

function App() {
  const {
    data,
    updatePeople,
    setPersonDay,
    advanceAll,
    addOrUpdateImage,
    removeImage,
    importData,
    resetData,
  } = useAppData();

  return (
    <div className="app">
      <header className="header">
        <h1>Streak Manager</h1>
        <p>Quản lý ảnh chuỗi ngày TikTok</p>
      </header>

      <Toolbar data={data} onImport={importData} onReset={resetData} />

      <main className="main">
        <div className="left-col">
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

        <div className="right-col">
          <CurrentImages people={data.people} images={data.images} />
          <ImageList images={data.images} onRemove={removeImage} />
        </div>
      </main>

      <footer className="footer">
        <small>
          Dữ liệu được lưu tự động trên trình duyệt. Nên xuất JSON để backup.
        </small>
      </footer>
    </div>
  );
}

export default App;
