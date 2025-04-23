// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Настройка для правильной работы с файлами диаграмм
    watch: {
      usePolling: true,
    },
  },
  optimizeDeps: {
    include: ['mermaid'],
  },
  build: {
    // Отключаем минификацию для лучшей отладки
    minify: false,
    rollupOptions: {
      // Указываем mermaid как внешнюю зависимость для оптимизации
      external: ['mermaid'],
      output: {
        globals: {
          mermaid: 'mermaid',
        },
      },
    },
  },
});