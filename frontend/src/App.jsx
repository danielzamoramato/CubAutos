import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CarDetailPage from './pages/CarDetailPage'
import Admin from './pages/Admin'
import Rentals from './pages/Rentals'
import RentalDetailPage from './pages/RentalDetailPage'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cars/:id" element={<CarDetailPage />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/rentas" element={<Rentals />} />
          <Route path="/rentas/:id" element={<RentalDetailPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}