export const navItems = [
  { id: "home", label: "首页" },
  { id: "about", label: "关于我" },
  { id: "projects", label: "AI与项目" },
  { id: "life", label: "生活切片" },
  { id: "medicine", label: "医学与科研" },
  { id: "contact", label: "联系我" },
] as const;

export const profile = {
  name: "阿走",
  school: "南京医科大学",
  major: "临床医学",
  city: "南京",
  mbti: "ENTJ",
  email: "2942997834@qq.com",
  interests: ["医学", "AI", "摄影", "攀岩"],
};

export const projects = [
  {
    number: "01",
    type: "GAME",
    title: "坦克大战",
    description: "原创三关单人坦克大战，支持键盘与手机触控。点击卡片即可开始游戏。",
    status: "● 点击进入游戏",
    variant: "feature",
  },
  {
    number: "02",
    type: "AI LAB",
    title: "AI 探索日志",
    description: "记录我如何把 AI 用进学习、创作和生活：从大学生 OPC 分享，到人工智能训练师认证。",
    status: "● 点击阅读日志",
    variant: "coral",
  },
  {
    number: "03",
    type: "SOCIAL",
    title: "创作与表达",
    description: "抖音内容入口",
    status: "抖音入口",
    variant: "blue",
  },
] as const;

export const lifeClips = [
  { number: "01", type: "CLIMBING", title: "攀岩", caption: "专注、判断，再向上一点。", art: "climbing", image: "", alt: "阿走的攀岩照片" },
  { number: "02", type: "PHOTOGRAPHY", title: "摄影", caption: "把稍纵即逝的光留下来。", art: "photo", image: "", alt: "阿走拍摄的摄影作品" },
] as const;

