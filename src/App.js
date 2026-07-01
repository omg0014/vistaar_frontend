import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Search from './pages/Search';
import Results from './pages/Results';
import SchoolDetail from './pages/SchoolDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Search />} />
        <Route path="/results"     element={<Results />} />
        <Route path="/school/:id"  element={<SchoolDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
