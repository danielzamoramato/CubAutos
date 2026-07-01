import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CarDetailPage from './pages/CarDetailPage'
import Admin from './pages/Admin'
import RentalDetailPage from './pages/RentalDetailPage'
import Rentals from './pages/Rentals'

export default function App() {
  return (
    <Routes>
      <Route path="/"       element={<Home />} />
      <Route path="/cars/:id" element={<CarDetailPage />} />
      <Route path="/admin"  element={<Admin />} />
      <Route path="/rentas" element={<Rentals />} />
      <Route path="/rentas/:id" element={<RentalDetailPage />} />
    </Routes>
  )
}