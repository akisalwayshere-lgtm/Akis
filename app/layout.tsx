import type { Metadata, Viewport } from "next";
import "./globals.css";

const criticalCss = `:root{--cream:#f3e9dd;--ink:#171914;--coral:#ef7468;--blue:#8dbfd0}*{box-sizing:border-box}html{background:var(--cream);-webkit-text-size-adjust:100%}body{margin:0;color:var(--ink);background:var(--cream);font-family:"PingFang SC","Microsoft YaHei",Arial,sans-serif}main{min-height:100svh;overflow:clip}.site-header{height:72px;display:flex;align-items:center;justify-content:space-between;position:fixed;inset:0 0 auto;z-index:40;background:rgba(243,233,221,.9)}.hero{min-height:100svh;display:grid;align-items:center}.doctor-image{display:block;width:78%;height:auto}@media(max-width:620px){.hero{padding:82px max(20px,env(safe-area-inset-right)) 64px max(20px,env(safe-area-inset-left))}.hero-copy{order:0}.portrait-stage{order:1;width:100%}}`;

export const metadata: Metadata = {
  title: "阿走｜医学生与 AI 探索者",
  description: "阿走的个人主页：在医学、AI、摄影与攀岩之间持续探索。",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3e9dd",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="format-detection" content="telephone=no" />
        <link rel="preload" href="/images/akis-medical-avatar-v2.webp" as="image" type="image/webp" fetchPriority="high" />
        <style dangerouslySetInnerHTML={{ __html: criticalCss }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

