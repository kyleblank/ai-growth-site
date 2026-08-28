import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// 部署到 GitHub Pages 时按需修改 site / base：
// 项目站点 https://<用户名>.github.io/<仓库名>/ 需设置 base = '/<仓库名>/'
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
});
