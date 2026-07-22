import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000
})

export const getBrands         = ()            => api.get('/brands')
export const getProvinces      = ()            => api.get('/provinces')
export const getMunicipalities = (province_id) => api.get('/municipalities', { params: { province_id } })

export const getCars    = (params) => api.get('/cars', { params })
export const getCarById = (id)     => api.get(`/cars/${id}`)

export const login = (password) => api.post('/auth/login', { password })

const adminHeaders = (token) => ({ Authorization: `Bearer ${token}` })

export const getAdminCars = (token) =>
  api.get('/admin/cars', { headers: adminHeaders(token) })

export const createCar = (data, token) =>
  api.post('/admin/cars', data, { headers: adminHeaders(token) })

export const updateCar = (id, data, token) =>
  api.put(`/admin/cars/${id}`, data, { headers: adminHeaders(token) })

export const deleteCar = (id, token) =>
  api.delete(`/admin/cars/${id}`, { headers: adminHeaders(token) })

export const uploadImages = (carId, files, coverIndex, token) => {
  const form = new FormData()
  files.forEach(f => form.append('images', f))
  form.append('cover_index', coverIndex)
  return api.post(`/admin/cars/${carId}/images`, form, { headers: adminHeaders(token) })
}

export const deleteImage = (imageId, token) =>
  api.delete(`/admin/images/${imageId}`, { headers: adminHeaders(token) })

export const setCover = (imageId, carId, token) =>
  api.put(`/admin/images/${imageId}/cover`, { car_id: carId }, { headers: adminHeaders(token) })

export const toggleCarActive = (id, is_active, token) =>
  api.patch(`/admin/cars/${id}/toggle`, { is_active }, { headers: adminHeaders(token) })

export const getRelatedCars = (id) => api.get(`/cars/${id}/related`)

// ─── Rentas ─────────────────────────────────────────────────

export const getRentalsList = (params) => api.get('/rentals', { params })
export const getRentalById   = (id)     => api.get(`/rentals/${id}`)

export const getAdminRentals = (token) =>
  api.get('/admin/rentals', { headers: adminHeaders(token) })

export const createRental = (data, token) =>
  api.post('/admin/rentals', data, { headers: adminHeaders(token) })

export const updateRental = (id, data, token) =>
  api.put(`/admin/rentals/${id}`, data, { headers: adminHeaders(token) })

export const deleteRental = (id, token) =>
  api.delete(`/admin/rentals/${id}`, { headers: adminHeaders(token) })

export const uploadRentalImages = (rentalId, files, coverIndex, token) => {
  const form = new FormData()
  files.forEach(f => form.append('images', f))
  form.append('cover_index', coverIndex)
  return api.post(`/admin/rentals/${rentalId}/images`, form, { headers: adminHeaders(token) })
}

export const deleteRentalImage = (imageId, token) =>
  api.delete(`/admin/rentals/images/${imageId}`, { headers: adminHeaders(token) })

export const setRentalCover = (imageId, rentalId, token) =>
  api.patch(`/admin/rentals/images/${imageId}/cover`, { rental_id: rentalId }, { headers: adminHeaders(token) })

export const toggleRentalActive = (id, is_active, token) =>
  api.patch(`/admin/rentals/${id}/toggle`, { is_active }, { headers: adminHeaders(token) })

export const getAd = (placement) => api.get(`/promos/${placement}`)
export const registerAdClick = (id) => api.post(`/promos/${id}/click`)

export const getAllAds = (token) => api.get('/admin/promos', { headers: adminHeaders(token) })
export const createAd = (data, token) => api.post('/admin/promos', data, { headers: adminHeaders(token) })
export const updateAd = (id, data, token) => api.put(`/admin/promos/${id}`, data, { headers: adminHeaders(token) })
export const deleteAd = (id, token) => api.delete(`/admin/promos/${id}`, { headers: adminHeaders(token) })
export const setCarFeatured = (id, featured_until, token) =>
  api.patch(`/admin/cars/${id}/featured`, { featured_until }, { headers: adminHeaders(token) })

export const setRentalFeatured = (id, featured_until, token) =>
  api.patch(`/admin/rentals/${id}/featured`, { featured_until }, { headers: adminHeaders(token) })

export const createBrand = (name, token) =>
  api.post('/admin/brands', { name }, { headers: adminHeaders(token) })