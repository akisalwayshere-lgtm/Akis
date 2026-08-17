# 阿走的个人主页

一个面向手机、平板与电脑的响应式单页网站，主题是“医学生 × AI 探索者 × 视觉创作者”。

## 更新个人资料

姓名、学校、项目、社交内容和生活照片都集中在 `app/site-content.ts`。后续补充资料时，优先修改这个文件。

生活照片请放入 `public/images/`，再把 `lifeClips` 对应条目的 `image` 改成 `/images/文件名.webp`。首屏以下的照片会自动懒加载。

攀岩相册已经预留轻音乐播放器。若要启用《中國人能飛》，请将有合法使用权的音频保存为 `public/audio/chinese-people-can-fly.mp3`；页面会在访客主动点击后，以 10% 音量循环播放。未添加音源时会显示官方收听入口。

## 本地运行

需要 Node.js 22 和 pnpm。

```bash
pnpm install
pnpm dev
```

## 构建与检查

```bash
pnpm build
pnpm test
```

构建会生成 `dist/client/index.html` 和全部静态资源，并执行适用于 Netlify 的预渲染。

## 部署到 Netlify

将整个项目导入 Netlify。仓库根目录中的 `netlify.toml` 已配置：

- Build command：`pnpm run build`
- Publish directory：`dist/client`
- Node.js：22

无需数据库、后端服务或私密环境变量。部署后，每次更新源码并重新构建即可发布新版本。

## 部署到 GitHub Pages

项目包含 `.github/workflows/deploy-pages.yml`。推送到 GitHub 仓库的 `main` 分支后，GitHub Actions 会自动构建网站、适配仓库子路径并发布到 GitHub Pages。

当前仓库对应的网址预计为：

`https://akisalwayshere-lgtm.github.io/Akis/`

## 主要交互

- 医学生角色眼睛跟随鼠标或触摸位置
- 鼠标和触摸粒子尾迹
- 响应指针的动态背景
- 滚动显现与章节导航状态
- 手机折叠菜单
- 自动支持“减少动态效果”系统设置

## 移动端与性能

- 手机端优先展示文字信息，再展示人物形象；布局、字号与间距会随屏幕流式调整
- 兼容刘海屏安全区，菜单与主要按钮均采用触控友好的点击尺寸
- 首屏关键样式直接内联，人物 WebP 图片优先加载，首屏以下图片使用懒加载与异步解码
- 正式构建会压缩并拆分 CSS/JavaScript，脚本以异步 ES Module 方式加载
- 不依赖 Tailwind、数据库或第三方动画库，运行时仅保留 React 与 React DOM

