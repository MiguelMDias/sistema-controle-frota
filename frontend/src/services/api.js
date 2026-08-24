import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

// Anexa o token JWT em toda requisição, se o usuário estiver logado.
api.interceptors.request.use((config) => {
  const salvo = localStorage.getItem('auth')
  if (salvo) {
    const { token } = JSON.parse(salvo)
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Se o token expirou ou é inválido (401), desloga e manda pra tela de login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
