import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages 部署配置
// 仓库：github.com/kyleblank/ai-growth-site
// 访问：https://kyleblank.github.io/ai-growth-site/
export default defineConfig({
  site: 'https://kyleblank.github.io',
  base: '/ai-growth-site/',
  vite: {
    plugins: [tailwindcss()],
  },
});
