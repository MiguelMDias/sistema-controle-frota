import axios from 'axios'
import { obterMock } from './mockData'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

// Adapter usado só no modo Observador: nunca sai da máquina do usuário,
// nunca chama o backend real. Leituras (GET) retornam dados de demonstração;
// qualquer escrita (POST/PUT/PATCH/DELETE) é recusada com uma mensagem clara.
function adapterObservador(config) {
  const metodo = (config.method || 'get').toLowerCase()

  if (metodo === 'get') {
    return Promise.resolve({
      data: obterMock(config.url),
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    })
  }

  const erro = new Error('Ação não permitida no modo Observador (somente leitura).')
  erro.isAxiosError = true
  erro.response = {
    status: 403,
    data: { detail: 'Ação não permitida no modo Observador. Esta é uma visualização somente leitura, com dados de demonstração.' },
  }
  return Promise.reject(erro)
}

api.interceptors.request.use((config) => {
  const salvo = localStorage.getItem('auth')
  if (!salvo) return config

  const { token, papel } = JSON.parse(salvo)

  if (papel === 'observador') {
    config.adapter = adapterObservador
  } else if (token) {
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
