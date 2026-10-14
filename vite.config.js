import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' permite publicar a pasta dist em qualquer hospedagem estática
export default defineConfig({ plugins: [react()], base: './' })
