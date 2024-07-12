import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'date-fns',
      '@mui/x-date-pickers',
      // add any other packages you need here
    ]
  }
})
