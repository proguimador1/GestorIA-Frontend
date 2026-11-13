import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { geminiProxy } from './server/gemini-proxy.js'

// base './' permite publicar a pasta dist em qualquer hospedagem estática.
// A chave do Gemini (GEMINI_API_KEY, em .env.local) é lida só aqui, no servidor do Vite.
// Como não começa com VITE_, ela nunca é incluída no código enviado ao navegador.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return { plugins: [react(), geminiProxy(env)], base: './' }
})
