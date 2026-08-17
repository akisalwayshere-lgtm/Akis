"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { lifeClips, navItems, profile, projects } from "./site-content";

type Particle = { x: number; y: number; vx: number; vy: number; life: number; size: number; color: string };

function ParticleCanvas({ disabled }: { disabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let frame = 0;
    let pointerDown = false;
    let last = { x: -100, y: -100 };
    const particles: Particle[] = [];
    const colors = ["#ef7468", "#8dbfd0", "#f0ba68"];

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const spawn = (x: number, y: number, count: number, isTouch: boolean) => {
      const cap = isTouch ? 36 : 84;
      for (let i = 0; i < count && particles.length < cap; i += 1) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * (isTouch ? 1.6 : 2.4),
          vy: (Math.random() - 0.65) * 2.1,
          life: 1,
          size: 2 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const onMove = (event: PointerEvent) => {
      const isTouch = event.pointerType === "touch";
      const distance = Math.hypot(event.clientX - last.x, event.clientY - last.y);
      if ((!isTouch || pointerDown) && distance > (isTouch ? 18 : 8)) {
        spawn(event.clientX, event.clientY, isTouch ? 2 : pointerDown ? 4 : 2, isTouch);
        last = { x: event.clientX, y: event.clientY };
      }
    };
    const onDown = () => { pointerDown = true; };
    const onUp = () => { pointerDown = false; };

    const animate = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.035;
        particle.life -= 0.018;
        if (particle.life <= 0) { particles.splice(index, 1); continue; }
        context.globalAlpha = particle.life * 0.72;
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      frame = window.requestAnimationFrame(animate);
    };

    resize();
    animate();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [disabled]);

  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />;
}

function DoctorPortrait() {
  return (
    <div className="portrait-stage" aria-label="阳光帅气的男性医学生动漫形象">
      <div className="orbit orbit-one" /><div className="orbit orbit-two" />
      <span className="spark spark-one">✦</span><span className="spark spark-two">✦</span><span className="capsule" />
      <div className="avatar-sun" aria-hidden="true" />
      {/* Generated transparent asset: native img avoids requiring a server-side image optimizer on Netlify. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="doctor-image" src="/images/akis-medical-avatar-v2.webp" alt="面带笑容、身穿白大褂并佩戴听诊器的男性医学生动漫形象" width="900" height="960" decoding="async" fetchPriority="high" />
      <p className="look-hint">MOVE, I&apos;LL FOLLOW ·</p>
    </div>
  );
}

function SectionTitle({ number, kicker, children }: { number: string; kicker: string; children: React.ReactNode }) {
  return <div className="section-heading" data-reveal><p>{number} / {kicker}</p><h2>{children}</h2></div>;
}

function LifeVisual({ clip }: { clip: (typeof lifeClips)[number] }) {
  if (clip.image) {
    // Native loading keeps the exported Netlify site independent of an image-optimization server.
    // eslint-disable-next-line @next/next/no-img-element
    return <div className="life-art"><img src={clip.image} alt={clip.alt} loading="lazy" decoding="async" /></div>;
  }
  return clip.art === "climbing"
    ? <div className="life-art" aria-hidden="true"><span className="climber">●</span><i /><b /></div>
    : <div className="life-art" aria-hidden="true"><span className="camera">▣</span><i /><b /></div>;
}

export default function Home() {
  const rootRef = useRef<HTMLElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [climbingOpen, setClimbingOpen] = useState(false);
  const [photographyOpen, setPhotographyOpen] = useState(false);
  const [aiJournalOpen, setAiJournalOpen] = useState(false);
  const [douyinOpen, setDouyinOpen] = useState(false);
  const [tankGameOpen, setTankGameOpen] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicUnavailable, setMusicUnavailable] = useState(false);

  const climbingPhotos = [
    {
      src: "/images/climbing-action.webp",
      alt: "阿走在室内抱石墙上攀爬",
      label: "01 / 向上",
      caption: "向上之前，先把注意力留在当下。每一次伸手，都在重新理解身体与墙面的距离。",
    },
    {
      src: "/images/climbing-rest.webp",
      alt: "阿走坐在抱石墙前观察攀爬路线",
      label: "02 / 读线",
      caption: "休息不是停下，是在下一次起身前，安静地读一遍路线。",
    },
  ];

  const photographyPhotos = [
    {
      src: "/images/photo-doves.webp",
      alt: "树叶与旧建筑之间停留着一群鸽子",
      label: "01 / 树影之间",
      caption: "树影把入口留成一扇窗，鸽群落在旧建筑上，让安静突然有了层次。",
    },
    {
      src: "/images/photo-lone-dove.webp",
      alt: "一只白鸽停在深绿色树林的枝头",
      label: "02 / 一点白",
      caption: "大片深绿里，一点白停在枝头。画面越克制，目光越有去处。",
    },
    {
      src: "/images/photo-warm-wood.webp",
      alt: "阳光照在展览中的木质装置上",
      label: "03 / 木与光",
      caption: "午后的光沿着木纹缓慢移动，普通的展陈也因此有了温度。",
    },
    {
      src: "/images/photo-wall-shadows.webp",
      alt: "墙面装置在光线下投出长长的影子",
      label: "04 / 影子的标点",
      caption: "同一面墙上的器物和影子，像一行被时间拉长的标点。",
    },
    {
      src: "/images/photo-sunlit-street.webp",
      alt: "阳光下，一位行人经过爬满藤蔓的老房子",
      label: "05 / 路过一束光",
      caption: "阳光、藤蔓与匆匆经过的人，共同拼成城市里短暂而柔软的一秒。",
    },
  ];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("is-visible"); });
    }, { threshold: 0.12 });
    document.querySelectorAll("[data-reveal]").forEach((element) => revealObserver.observe(element));

    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target.id) setActiveSection(visible.target.id);
    }, { rootMargin: "-35% 0px -45%", threshold: [0, 0.25, 0.6] });
    navItems.forEach(({ id }) => { const section = document.getElementById(id); if (section) sectionObserver.observe(section); });

    return () => { media.removeEventListener("change", update); revealObserver.disconnect(); sectionObserver.disconnect(); };
  }, []);

  useEffect(() => {
    if (!climbingOpen && !photographyOpen && !aiJournalOpen && !douyinOpen && !tankGameOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setClimbingOpen(false);
        setPhotographyOpen(false);
        setAiJournalOpen(false);
        setDouyinOpen(false);
        setTankGameOpen(false);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [climbingOpen, photographyOpen, aiJournalOpen, douyinOpen, tankGameOpen]);

  const toggleMusic = async () => {
    const audio = musicRef.current;
    if (!audio) return;
    audio.volume = 0.1;
    if (musicPlaying) {
      audio.pause();
      setMusicPlaying(false);
      return;
    }
    try {
      await audio.play();
      setMusicPlaying(true);
      setMusicUnavailable(false);
    } catch {
      setMusicUnavailable(true);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (reducedMotion) return;
    const x = event.clientX / window.innerWidth;
    const y = event.clientY / window.innerHeight;
    rootRef.current?.style.setProperty("--pointer-x", `${x * 100}%`);
    rootRef.current?.style.setProperty("--pointer-y", `${y * 100}%`);
    rootRef.current?.style.setProperty("--portrait-x", `${Math.max(-7, Math.min(7, (x - 0.65) * 16))}px`);
    rootRef.current?.style.setProperty("--portrait-y", `${Math.max(-5, Math.min(5, (y - 0.4) * 12))}px`);
  };

  const resetPortrait = () => {
    rootRef.current?.style.setProperty("--portrait-x", "0px");
    rootRef.current?.style.setProperty("--portrait-y", "0px");
  };

  return (
    <main ref={rootRef} onPointerMove={handlePointerMove} onPointerUp={resetPortrait} onPointerLeave={resetPortrait}>
      <ParticleCanvas disabled={reducedMotion} />
      <div className="ambient ambient-one" aria-hidden="true" /><div className="ambient ambient-two" aria-hidden="true" />

      <header className="site-header">
        <a className="wordmark" href="#home" aria-label="返回首页">AZOU, IN PROGRESS.</a>
        <nav className={menuOpen ? "nav-open" : ""} aria-label="主导航">
          {navItems.map((item, index) => (
            <a key={item.id} href={`#${item.id}`} className={activeSection === item.id ? "active" : ""} onClick={() => setMenuOpen(false)}>
              <span>{String(index + 1).padStart(2, "0")}</span>{item.label}
            </a>
          ))}
        </nav>
        <button className="menu-button" type="button" aria-label={menuOpen ? "关闭导航" : "打开导航"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          <i /><i />
        </button>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow"><span>HELLO / NICE TO MEET YOU</span><i />阿走</p>
          <p className="ghost-name">Akis</p>
          <h1>Hi!<br />这里是阿走。</h1>
          <p className="hero-line">一名正在学习如何与生命对话的医学生，<br />也是一位用 AI 探索世界的狂热实践者。</p>
          <p className="hero-meta">{profile.school} · {profile.major} · {profile.mbti} · {profile.city}</p>
          <div className="hero-actions">
            <a className="button button-dark" href="#about">认识我 <span>↘</span></a>
            <a className="button" href={`mailto:${profile.email}`}>联系我 <span>✉</span></a>
          </div>
        </div>
        <DoctorPortrait />
        <a className="scroll-cue" href="#about" aria-label="继续向下浏览"><span>SCROLL TO EXPLORE</span><i>↓</i></a>
      </section>

      <section className="section about-section" id="about">
        <SectionTitle number="01" kicker="ABOUT ME">在医学与<br />AI 之间持续探索。</SectionTitle>
        <div className="about-grid">
          <div className="about-statement" data-reveal>
            <span className="quote-mark">“</span>
            <p>我相信，医学教会我理解生命，摄影让我留住瞬间，攀岩提醒我保持专注，而 AI 则不断拓宽我探索世界的方式。</p>
          </div>
          <div className="about-details" data-reveal>
            <p>目前就读于南京医科大学临床医学专业，目标是继续走近科研。我喜欢把看似遥远的领域连接起来，用审美和技术把好奇心变成真实的作品。</p>
            <div className="tag-row">{profile.interests.map((interest) => <span key={interest}>{interest}</span>)}</div>
          </div>
        </div>
      </section>

      <section className="section projects-section" id="projects">
        <SectionTitle number="02" kicker="AI & PROJECTS">把脑海里的想法，<br />做成可以触碰的东西。</SectionTitle>
        <div className="project-grid">
          {projects.map((project) => project.variant === "feature" ? (
            <button className="project-feature project-feature-button" type="button" data-reveal key={project.number} onClick={() => setTankGameOpen(true)} aria-haspopup="dialog" aria-label="打开阿走的坦克大战游戏">
              <div className="pixel-scene" aria-hidden="true"><span className="pixel-tank">▦</span><i /><b /></div>
              <div className="project-content"><p className="card-index">{project.number} / {project.type}</p><h3>{project.title}</h3><p>{project.description}</p><span className="status">{project.status}</span></div>
            </button>
          ) : project.variant === "coral" ? (
            <button className={`project-card ${project.variant}-card project-card-button`} type="button" data-reveal key={project.number} onClick={() => setAiJournalOpen(true)} aria-haspopup="dialog" aria-label="打开 AI 探索日志第一篇：大学生与 OPC">
              <p className="card-index">{project.number} / {project.type}</p><h3>{project.title}</h3><p>{project.description}</p><span className="status">{project.status}</span>
            </button>
          ) : project.variant === "blue" ? (
            <button className={`project-card ${project.variant}-card project-card-button`} type="button" data-reveal key={project.number} onClick={() => setDouyinOpen(true)} aria-haspopup="dialog" aria-label="打开阿走的抖音账号截图">
              <p className="card-index">{project.number} / {project.type}</p><h3>{project.title}</h3><p>{project.description}</p><span className="status">{project.status}</span>
            </button>
          ) : (
            <article className={`project-card ${project.variant}-card`} data-reveal key={project.number}>
              <p className="card-index">{project.number} / {project.type}</p><h3>{project.title}</h3><p>{project.description}</p><span className="status">{project.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section life-section" id="life">
        <SectionTitle number="03" kicker="LIFE CLIPS">离开书桌以后，<br />我用身体和镜头感受世界。</SectionTitle>
        <div className="life-grid">
          {lifeClips.map((clip) => clip.art === "climbing" || clip.art === "photo" ? (
            <button className={`life-card ${clip.art}-card life-card-button`} type="button" data-reveal key={clip.number} onClick={() => clip.art === "climbing" ? setClimbingOpen(true) : setPhotographyOpen(true)} aria-haspopup="dialog" aria-label={clip.art === "climbing" ? "打开攀岩故事，共两张照片" : "打开摄影故事，共五张照片"}>
              <LifeVisual clip={clip} />
              <div><p>{clip.number} / {clip.type}</p><h3>{clip.title}</h3><span>{clip.caption}</span></div>
            </button>
          ) : (
            <article className={`life-card ${clip.art}-card`} data-reveal key={clip.number}><LifeVisual clip={clip} /><div><p>{clip.number} / {clip.type}</p><h3>{clip.title}</h3><span>{clip.caption}</span></div></article>
          ))}
          <article className="life-note" data-reveal><p>MY LITTLE WORLD</p><h3>照片与作品<br />很快会在这里见面。</h3><span>素材待补充 · COMING SOON</span></article>
        </div>
      </section>

      {climbingOpen && (
        <div className="climbing-dialog" role="dialog" aria-modal="true" aria-labelledby="climbing-title" onPointerDown={(event) => { if (event.target === event.currentTarget) setClimbingOpen(false); }}>
          <div className="climbing-scroll-story">
            <button className="dialog-close" type="button" onClick={() => setClimbingOpen(false)} aria-label="关闭攀岩相册">×</button>
            <header className="climbing-story-intro">
              <p className="dialog-kicker">CLIMBING LOG · NANJING</p>
              <h2 id="climbing-title">和重力<br />谈一场判定。</h2>
              <p>向下滑动，依次阅读两段攀岩时刻。</p>
              <span aria-hidden="true">↓</span>
            </header>
            <div className="climbing-story-list">
              {climbingPhotos.map((photo, index) => (
                <article className="climbing-story-panel" key={photo.src}>
                  <div className="story-photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.src} alt={photo.alt} loading={index === 0 ? "eager" : "lazy"} decoding="async" />
                    <span>{String(index + 1).padStart(2, "0")} / {String(climbingPhotos.length).padStart(2, "0")}</span>
                  </div>
                  <div className="interactive-caption">
                    <span>{photo.label}</span>
                    <p>{photo.caption}</p>
                    <i>触碰文字，感受它向上浮动</i>
                  </div>
                </article>
              ))}
            </div>
            <footer className="climbing-story-footer">
              <div className="music-panel">
                {/* Instrumental/background playback contains no spoken dialogue requiring captions. */}
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <audio ref={musicRef} src="/audio/chinese-people-can-fly.mp3" preload="none" loop onPause={() => setMusicPlaying(false)} />
                <button type="button" onClick={toggleMusic}>{musicPlaying ? "Ⅱ 暂停轻音乐" : "♪ 播放轻音乐 · 10%"}</button>
                <p>{musicUnavailable ? "音源待添加：上传你有权使用的歌曲文件即可启用。" : "《中國人能飛》· 揽佬 / Chalky Wong"}</p>
                {musicUnavailable && <a href="https://www.kugou.com/mixsong/fid0lpcd.html" target="_blank" rel="noreferrer">前往官方平台收听 ↗</a>}
              </div>
              <button type="button" onClick={() => setClimbingOpen(false)}>看完了，返回生活切片 ↑</button>
            </footer>
          </div>
        </div>
      )}

      {photographyOpen && (
        <div className="climbing-dialog photography-dialog" role="dialog" aria-modal="true" aria-labelledby="photography-title" onPointerDown={(event) => { if (event.target === event.currentTarget) setPhotographyOpen(false); }}>
          <div className="climbing-scroll-story photography-scroll-story">
            <button className="dialog-close" type="button" onClick={() => setPhotographyOpen(false)} aria-label="关闭摄影故事">×</button>
            <header className="climbing-story-intro photography-story-intro">
              <p className="dialog-kicker">PHOTOGRAPHY NOTES · THROUGH MY EYES</p>
              <h2 id="photography-title">把光留下，<br />也把瞬间留下。</h2>
              <p>向下滑动，依次阅读五个被镜头留住的片刻。</p>
              <span aria-hidden="true">↓</span>
            </header>
            <div className="climbing-story-list photography-story-list">
              {photographyPhotos.map((photo, index) => (
                <article className="climbing-story-panel photography-story-panel" key={photo.src}>
                  <div className="story-photo photography-photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.src} alt={photo.alt} loading={index === 0 ? "eager" : "lazy"} decoding="async" />
                    <span>{String(index + 1).padStart(2, "0")} / {String(photographyPhotos.length).padStart(2, "0")}</span>
                  </div>
                  <div className="interactive-caption photography-caption">
                    <span>{photo.label}</span>
                    <p>{photo.caption}</p>
                    <i>让鼠标或手指经过文字，它会轻轻回应</i>
                  </div>
                </article>
              ))}
            </div>
            <div className="photography-story-footer">
              <p>FIVE FRAMES · FIVE QUIET MOMENTS</p>
              <button type="button" onClick={() => setPhotographyOpen(false)}>看完了，返回生活切片 ↑</button>
            </div>
          </div>
        </div>
      )}

      {aiJournalOpen && (
        <div className="ai-journal-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-journal-title" onPointerDown={(event) => { if (event.target === event.currentTarget) setAiJournalOpen(false); }}>
          <div className="ai-journal-scroll">
            <button className="dialog-close" type="button" onClick={() => setAiJournalOpen(false)} aria-label="关闭 AI 探索日志">×</button>
            <header className="ai-journal-intro">
              <p className="dialog-kicker">AI EXPLORATION JOURNAL · ENTRY 01</p>
              <h2 id="ai-journal-title">从大学生，<br />到一人公司。</h2>
              <p>一次关于 AI、行动力与个人创造力的 OPC 社区分享。</p>
            </header>
            <article className="ai-journal-entry">
              <div className="ai-journal-photo-pair">
                <figure className="ai-journal-photo ai-journal-photo-portrait">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/ai-opc-community-portrait.webp" alt="阿走参加 OPC 社区活动并展示参会证件" loading="lazy" decoding="async" />
                  <figcaption>01 / OPC COMMUNITY</figcaption>
                </figure>
                <figure className="ai-journal-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/ai-opc-community-talk.webp" alt="阿走在 OPC 社区进行大学生与 AI 主题分享" loading="lazy" decoding="async" />
                  <figcaption>02 / SHARING</figcaption>
                </figure>
              </div>
              <div className="ai-journal-copy">
                <p className="card-index">01 / ONE PERSON COMPANY</p>
                <h3>用 AI，开始自己的 OPC。</h3>
                <p>作为一名大学生，我在 OPC 社区（One Person Company）分享大学生如何借助 AI，从一个想法出发，建立并实践属于自己的 OPC 公司。</p>
                <p>对我来说，这不只是一场分享，也是一次把技术、行动力和个人创造力连接起来的尝试。</p>
                <div className="ai-journal-tags" aria-label="文章关键词"><span>大学生</span><span>AI 实践</span><span>OPC</span></div>
              </div>
            </article>
            <footer className="ai-journal-footer">
              <p>KEEP BUILDING · KEEP SHARING</p>
              <button type="button" onClick={() => setAiJournalOpen(false)}>读完了，返回 AI 与项目 ↑</button>
            </footer>
          </div>
        </div>
      )}

      {douyinOpen && (
        <div className="douyin-dialog" role="dialog" aria-modal="true" aria-label="阿走的抖音账号" onPointerDown={(event) => { if (event.target === event.currentTarget) setDouyinOpen(false); }}>
          <div className="douyin-profile-card">
            <button className="dialog-close" type="button" onClick={() => setDouyinOpen(false)} aria-label="关闭抖音账号截图">×</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/douyin-profile.webp" alt="阿走的抖音账号主页截图" width="1000" height="1657" decoding="async" />
          </div>
        </div>
      )}

      {tankGameOpen && (
        <div className="tank-game-dialog" role="dialog" aria-modal="true" aria-label="阿走的坦克大战游戏">
          <div className="tank-game-shell">
            <button className="tank-game-close" type="button" onClick={() => setTankGameOpen(false)} aria-label="关闭坦克大战并返回个人网站">关闭游戏 ×</button>
            <iframe src="/games/tank-battle/index.html" title="浪尖阿走·坦克大战" allow="autoplay; fullscreen" />
          </div>
        </div>
      )}

      <section className="section medicine-section" id="medicine">
        <SectionTitle number="04" kicker="MEDICINE & RESEARCH">学习如何与生命对话，<br />也学习如何提出好问题。</SectionTitle>
        <div className="medicine-grid">
          <div className="education-card" data-reveal><p className="card-index">EDUCATION</p><span className="year">本科</span><h3>南京医科大学</h3><p>临床医学</p><div className="ecg-line" aria-hidden="true"><i /><b /></div></div>
          <div className="research-card" data-reveal><p className="card-index">NEXT CHAPTER</p><h3>面向科研，<br />保持开放。</h3><p>具体研究方向仍在探索。我希望把临床问题、研究方法与 AI 工具连接起来，让每一次好奇都更接近答案。</p><span className="status">研究兴趣 · 持续形成中</span></div>
        </div>
      </section>

      <section className="section contact-section" id="contact">
        <p className="contact-kicker" data-reveal>05 / KEEP IN TOUCH</p>
        <div data-reveal><h2>有想法？<br /><em>来聊聊吧。</em></h2><p>无论是医学、AI、摄影，还是一个有趣但尚未成形的念头，我都愿意听听。</p><a className="contact-button" href={`mailto:${profile.email}`} aria-label="通过邮件联系阿走"><span>发送邮件</span><i>↗</i></a></div>
        <footer><span>AZOU © 2026</span><span>MADE WITH CURIOSITY IN NANJING</span><a href="#home">BACK TO TOP ↑</a></footer>
      </section>
    </main>
  );
}

