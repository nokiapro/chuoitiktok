import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAppData } from './hooks/useAppData';
import Viewer from './pages/Viewer';
import Admin from './pages/Admin';
import './App.css';

function App() {
  const { data, updatePeople } = useAppData();

  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Viewer />} />
          <Route
            path="/admin"
            element={
              <Admin
                people={data.people}
                onUpdatePeople={updatePeople}
              />
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
