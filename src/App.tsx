import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueueProvider } from './context/QueueContext';
import Home from './pages/Home';
import Reception from './pages/Reception';
import Clinic from './pages/Clinic';
import Display from './pages/Display';
import ReceptionLogin from './pages/ReceptionLogin';
import ClinicLogin from './pages/ClinicLogin';
import NotFound from './pages/NotFound';

function App() {
  return (
    <QueueProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login/reception" element={<ReceptionLogin />} />

          <Route path="/login/clinic" element={<ClinicLogin />} />

          <Route path="/reception" element={<Reception />} />

          <Route path="/clinic" element={<Clinic />} />

          <Route path="/display" element={<Display />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueueProvider>
  );
}

export default App;
