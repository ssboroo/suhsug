"use client";

import { useEffect, useState } from "react";
import { Award, ArrowDown, ArrowUpRight, CheckCircle2, ChevronRight, Search, ShieldCheck, Share2 } from "lucide-react";

type Result = { transactionDate: string; phoneNumber: string; ticketCount: number };
type PublicCampaign = { title: string; description: string; heroImageUrl: string | null };
type PublicProgress = { percent: number };

export default function HomePage() {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);
  const [progress, setProgress] = useState<PublicProgress | null>(null);

  useEffect(() => {
    fetch("/api/campaign/public", { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (data?.campaign) setCampaign(data.campaign); if (data?.progress) setProgress(data.progress); })
      .catch(() => undefined);
  }, []);

  async function searchPhone(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^\d{8}$/.test(phone)) { setMessage("Утасны дугаар 8 оронтой байх шаардлагатай."); return; }
    setLoading(true); setMessage(""); setResult(null);
    try {
      const response = await fetch("/api/search?phone=" + encodeURIComponent(phone), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Хайлт хийхэд алдаа гарлаа.");
      setResult(data.records || []);
      if (!data.records?.length) setMessage("Энэ дугаарт бүртгэл олдсонгүй. Утасны дугаараа шалгаад дахин оролдоно уу.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Түр алдаа гарлаа."); }
    finally { setLoading(false); }
  }

  async function shareCampaign() {
    const url = window.location.href.split("#")[0];
    const shareUrl = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url);
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=720,height=620");
  }

  const heroStyle = campaign?.heroImageUrl ? {
    backgroundImage: `linear-gradient(90deg,rgba(7,18,25,.94) 0%,rgba(7,18,25,.78) 46%,rgba(7,18,25,.22) 100%),url("${campaign.heroImageUrl}")`
  } : undefined;

  return <main className="site-shell">
    <header className="topbar">
      <a href="#home" className="brand" aria-label="Сүхбаатарын хурд нүүр хуудас">
        <span className="brand-mark"><span>ᠮ</span></span>
        <span className="brand-name"><strong>СҮХБААТАРЫН ХУРД</strong><small>СУГАЛААТ ХУДАЛДАА</small></span>
      </a>
      <nav className="navlinks" aria-label="Үндсэн цэс">
        <a href="#home" className="active">НҮҮР</a><a href="#search">ЭРХЭЭ ШАЛГАХ</a><a href="#about">МЭДЭЭЛЭЛ</a>
      </nav>
      <a href="#search" className="header-cta">СУГАЛАА ШАЛГАХ <ArrowUpRight size={16}/></a>
    </header>

    <section className="hero" id="home" style={heroStyle}>
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="eyebrow"><span className="eyebrow-line"/> ӨВ СОЁЛ · ХУРД · ХИЙМОРЬ <span className="eyebrow-line"/></div>
        <p className="hero-overline">МОНГОЛЫН ХУРДНЫ ӨВ СОЁЛ</p>
        <h1>СҮХБААТАРЫН<span>ХУРД</span></h1>
        <div className="hero-subtitle"><span/> СУГАЛААТ ХУДАЛДАА <span/></div>
        <p className="hero-copy">{campaign?.description || "Монгол түмний хийморь болсон хурдан хүлгийн уралдаанд тавтай морил. Сугалаанд бүртгүүлсэн эрхээ утасны дугаараараа хялбар, шуурхай шалгаарай."}</p>
        <a className="primary-btn" href="#search">СУГАЛААНЫ ЭРХЭЭ ШАЛГАХ <ChevronRight size={18}/></a>
        <div className="hero-footnote"><ShieldCheck size={16}/> Бүртгэлийн мэдээллээ албан ёсны системээс шалгана</div>
      </div>
      <div className="hero-side-label">ХУРД · ХИЙМОРЬ · БАХАРХАЛ</div>
      <a href="#search" className="scroll-cue"><span>ДООШ ГҮЙЛГЭХ</span><ArrowDown size={15}/></a>
    </section>

    <section className="campaign-progress-section" aria-label="Сугалааны явц">
      <div className="campaign-progress-card">
        <div className="campaign-thumb-wrap">
          <img src={campaign?.heroImageUrl || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=640&h=420&q=85"} alt="Сүхбаатарын хурд сугалааны зураг" className="campaign-thumb"/>
        </div>
        <div className="campaign-progress-content">
          <div className="section-kicker"><span/> СУГАЛААНЫ ЯВЦ</div>
          <h2>{campaign?.title || "Сүхбаатарын хурд — Сугалаат худалдаа"}</h2>
          {progress ? <>
            <div className="progress-meta"><span>Дүүргэлтийн явц</span><strong>{progress.percent}%</strong></div>
            <div className="progress-track" role="progressbar" aria-label="Сугалааны дүүргэлт" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}><span style={{width: progress.percent + "%"}}/></div>
            <div className="progress-count"><span>Сугалааны дүүргэлт</span><span>Зорилтот явц</span></div>
          </> : <p className="progress-unset">Сугалааны дүүргэлтийн мэдээлэл удахгүй харагдана.</p>}
          <button type="button" className="facebook-share-btn" onClick={shareCampaign}><Share2 size={17}/> Facebook дээр хуваалцах</button>
        </div>
      </div>
    </section>

    <div className="ornament-divider"><span>ᠮ</span></div>

    <section className="lookup-section section" id="search">
      <div className="section-inner lookup-layout">
        <div className="lookup-intro">
          <div className="section-kicker"><span/> ТАНЫ ХИЙМОРЬ ӨӨДӨӨ</div>
          <h2 className="section-title">Сугалааны эрхээ<br/><em>шалгах</em></h2>
          <p className="section-desc">Бүртгүүлсэн утасны дугаараа оруулснаар таны сугалааны эрхийн мэдээлэл шууд харагдана.</p>
          <div className="lookup-assurance"><span className="assurance-icon"><ShieldCheck size={20}/></span><span><strong>Найдвартай шалгалт</strong><small>Зөвхөн таны дугаарт бүртгэлтэй мэдээлэл</small></span></div>
        </div>
        <div className="lookup-panel">
          <div className="panel-topline"><span>ЭРХ ШАЛГАХ ХЭСЭГ</span><span className="live-dot">ШУУРХАЙ ХАЙЛТ</span></div>
          <div className="panel-heading"><div className="panel-icon"><Search size={21}/></div><div><h3>Утасны дугаараа оруулна уу</h3><p>8 оронтой дугаар ашиглана уу</p></div></div>
          <form className="search-card" onSubmit={searchPhone}>
            <label className="search-label" htmlFor="phone">ТАНЫ УТАСНЫ ДУГААР</label>
            <div className="phone-field"><span className="country-code">+976</span><input id="phone" className="phone-input" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={8} placeholder="9911 2233" value={phone} onChange={e=>{setPhone(e.target.value.replace(/\D/g,"").slice(0,8));setMessage("");setResult(null);}} /></div>
            <div className="input-hint"><span>Зөвхөн тоо оруулна уу</span><span>{phone.length}/8</span></div>
            <button className="search-submit" type="submit" disabled={phone.length!==8 || loading}><Search size={18}/>{loading ? "ШАЛГАЖ БАЙНА..." : "СУГАЛААГАА ШАЛГАХ"}<ChevronRight size={17}/></button>
            {message && <div role="status" className={message.includes("бүртгэл олдсонгүй") ? "notice notice-warn" : "notice notice-error"}>{message}</div>}
          </form>
          {result && result.length>0 && <div className="result-card" aria-live="polite">
            <div className="result-heading"><span className="result-check"><CheckCircle2 size={18}/></span><div><strong>БҮРТГЭЛ ОЛДЛОО</strong><small>Таны хайлтын үр дүн</small></div></div>
            {result.map((r,i)=><div className="result-record" key={i}>
              <div className="result-row"><span>Гүйлгээний огноо</span><strong>{new Date(r.transactionDate).toLocaleDateString("mn-MN")}</strong></div>
              <div className="result-row"><span>Утасны дугаар</span><strong>{r.phoneNumber}</strong></div>
              <div className="result-ticket"><span>Сугалааны эрхийн тоо</span><strong>{r.ticketCount}<small>ЭРХ</small></strong></div>
            </div>)}
          </div>}
          <div className="privacy-note"><ShieldCheck size={14}/> Таны мэдээллийг зөвхөн шалгах зорилгоор ашиглана.</div>
        </div>
      </div>
    </section>

    <section className="steps-section" id="about">
      <div className="section-inner">
        <div className="section-kicker centered"><span/> ХЯЛБАР · ШУУРХАЙ · ОЙЛГОМЖТОЙ <span/></div>
        <h2 className="section-title centered">Эрхээ шалгах <em>3 алхам</em></h2>
        <p className="section-desc centered">Сугалааны эрхийн мэдээллээ хэдхэн хормын дотор шалгаарай.</p>
        <div className="steps-grid">
          <article className="step-card"><span className="step-number">01</span><div className="step-icon"><span>ᠮ</span></div><h3>Дугаараа оруулах</h3><p>Сугалаанд бүртгүүлсэн 8 оронтой утасны дугаараа бичнэ.</p></article>
          <article className="step-card"><span className="step-number">02</span><div className="step-icon"><Search size={25}/></div><h3>Мэдээллээ шалгах</h3><p>“Сугалаагаа шалгах” товчийг дарж бүртгэлээ хайна.</p></article>
          <article className="step-card"><span className="step-number">03</span><div className="step-icon"><Award size={25}/></div><h3>Эрхийн тоогоо харах</h3><p>Бүртгэл олдвол огноо болон сугалааны эрхийн тоогоо харна.</p></article>
        </div>
      </div>
    </section>

    <section className="closing-band"><div className="closing-ornament">ᠮ</div><p>МОНГОЛЫН ХИЙМОРЬ · ХУРДНЫ БАХАРХАЛ</p><h2>Хурдны өлзий дэлгэрэх болтугай</h2><a href="#search">ЭРХЭЭ ОДОО ШАЛГАХ <ArrowUpRight size={16}/></a></section>

    <footer className="footer">
      <div className="footer-main"><div className="brand"><span className="brand-mark"><span>ᠮ</span></span><span className="brand-name"><strong>СҮХБААТАРЫН ХУРД</strong><small>СУГАЛААТ ХУДАЛДАА</small></span></div><p>Монгол өв соёл, хурдны хийморийг эрхэмлэн дээдэлье.</p><a href="#home">ДЭЭШ БУЦАХ ↑</a></div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Сүхбаатарын хурд. Бүх эрх хуулиар хамгаалагдсан.</span><span>МОНГОЛ УЛС</span></div>
    </footer>
  </main>;
}
