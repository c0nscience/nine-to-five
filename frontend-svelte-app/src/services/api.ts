import axios from 'axios'
import { useAuth0 } from './auth0'

export const httpCli = axios.create({
  baseURL: import.meta.env.VITE_API_HOST
})

httpCli.interceptors.request.use(async config => {
  const token = await useAuth0.getAccessToken()
  config.headers['Authorization'] = `Bearer ${token}`
  return config
})
