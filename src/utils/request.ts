import axios from 'axios'
import { clearToken } from './auth'

const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('pms_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && body.code !== undefined && body.code !== 0) {
      return Promise.reject(new Error(body.message || '请求失败'))
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      if (window.location.hash !== '#/login') {
        window.location.hash = '#/login'
      }
    }
    return Promise.reject(error)
  },
)

export default http
