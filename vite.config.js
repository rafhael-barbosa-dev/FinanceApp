import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Se o repositório for um projeto (não site de usuário), use '/FinanceApp/'
// Se for site de usuário/organização, use '/'
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/FinanceApp/' : '/',
})