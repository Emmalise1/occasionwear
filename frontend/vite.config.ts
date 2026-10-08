import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Frontend talks to Spring Boot exclusively through the REST API
// configured with VITE_API_BASE_URL (see .env).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
