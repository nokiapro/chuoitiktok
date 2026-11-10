import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAppData } from './hooks/useAppData';
import Viewer from './pages/Viewer';
import Admin from './pages/Admin';
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
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route
            path="/"
            element={
              <Viewer
                people={data.people}
                images={data.images}
                onAdvanceAll={advanceAll}
              />
            }
          />
          <Route
            path="/admin"
            element={
              <Admin
                data={data}
                updatePeople={updatePeople}
                setPersonDay={setPersonDay}
                advanceAll={advanceAll}
                addOrUpdateImage={addOrUpdateImage}
                removeImage={removeImage}
                importData={importData}
                resetData={resetData}
              />
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
