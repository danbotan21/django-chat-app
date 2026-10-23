import axios from 'axios'
import { API_URL } from '../config'

export const api = axios.create({ baseURL: API_URL })

// every request carries the token saved at login
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Token ${token}`
  return config
})

// an expired or deleted token sends the user back to the login page
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      clearSession()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export const saveSession = ({ token, user }) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export const clearSession = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const getSession = () => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  return token && user ? { token, user } : null
}

export const mediaUrl = (path) =>
  !path ? null : path.startsWith('http') ? path : `${API_URL}${path}`

export const errorMessage = (error, fallback = 'Something went wrong.') =>
  error.response?.data?.error || fallback
