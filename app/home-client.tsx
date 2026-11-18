"use client";

import { useEffect, useState } from "react";
import { Award, ArrowDown, ArrowUpRight, CheckCircle2, ChevronRight, Search, ShieldCheck, Share2 } from "lucide-react";

type Result = { transactionDate: string; phoneNumber: string; ticketCount: number };
type PublicCampaign = { title: string; description: string; heroImageUrl: string | null; heroEyebrow:string|null; heroOverline:string|null; faqContent:string|null; stepsContent:string|null; closingTitle:string|null; footerDescription:string|null; bankName: string | null; accountHolder: string | null; accountNumber: string | null; iban: string | null; facebookPageUrl: string | null };
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

  const steps = (campaign?.stepsContent || `Дугаараа оруулах || Сугалаанд бүртгүүлсэн 8 оронтой утасны дугаараа бичнэ.
Мэдээллээ шалгах || “Сугалаагаа шалгах” товчийг дарна.
Эрхийн тоогоо харах || Бүртгэл олдвол эрхийн тоогоо харна.`).split(/\r?\n/).map(line=>line.split("||").map(part=>part.trim())).filter(parts=>parts.length>=2 && parts[0] && parts[1]).slice(0,3);
  const faqs = (campaign?.faqContent || `Сугалаанд хэрхэн оролцох вэ? || Зохион байгуулагчийн нийтэлсэн нөхцөл, зааврыг дагана уу.
Сугалааны эрхээ хэрхэн шалгах вэ? || 8 оронтой утасны дугаараа оруулж хайна уу.
Миний бүртгэл харагдахгүй байвал яах вэ? || Дугаараа шалгаад дахин хайна уу.
Данс болон IBAN мэдээллийг хаанаас харах вэ? || Албан ёсны дансны хэсгээс харна уу.
Сугалааны талаар хаанаас лавлах вэ? || Доорх Facebook Page-ээр холбогдоно уу.`).split(/\r?\n/).map(line=>line.split("||").map(part=>part.trim())).filter(parts=>parts.length>=2 && parts[0] && parts[1]).slice(0,12);

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
        <div className="eyebrow"><span className="eyebrow-line"/> {campaign?.heroEyebrow || "ӨВ СОЁЛ · ХУРД · ХИЙМОРЬ"} <span className="eyebrow-line"/></div>
        <p className="hero-overline">{campaign?.heroOverline || "МОНГОЛЫН ХУРДНЫ ӨВ СОЁЛ"}</p>
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
          {steps.map((step,i)=><article className="step-card" key={i}><span className="step-number">0{i+1}</span><div className="step-icon">{i===0?<span>ᠮ</span>:i===1?<Search size={25}/>:<Award size={25}/>}</div><h3>{step[0]}</h3><p>{step[1]}</p></article>)}
        </div>
      </div>
    </section>

    {(campaign?.bankName || campaign?.accountHolder || campaign?.accountNumber || campaign?.iban) && <section className="bank-info-section" id="bank-info">
      <div className="bank-info-inner">
        <div className="section-kicker"><span/> АЛБАН ЁСНЫ ТӨЛБӨРИЙН МЭДЭЭЛЭЛ</div>
        <h2 className="section-title">Сугалаанд оролцох <em>данс</em></h2>
        <p className="section-desc">Зөвхөн доорх зохион байгуулагчийн албан ёсны дансны мэдээллийг ашиглана уу.</p>
        <div className="bank-info-card">
          {campaign?.bankName && <div className="bank-info-row"><span>Банк</span><strong>{campaign.bankName}</strong></div>}
          {campaign?.accountHolder && <div className="bank-info-row"><span>Данс эзэмшигч</span><strong>{campaign.accountHolder}</strong></div>}
          {campaign?.accountNumber && <div className="bank-info-row"><span>Дансны дугаар</span><strong>{campaign.accountNumber}</strong></div>}
          {campaign?.iban && <div className="bank-info-row"><span>IBAN</span><strong>{campaign.iban}</strong></div>}
        </div>
        <p className="bank-info-warning">Гүйлгээ хийхээсээ өмнө дансны мэдээллийг нягтална уу. Хувийн болон өөр хүний данс руу шилжүүлэг бүү хийгээрэй.</p>
      </div>
    </section>}

    <section className="faq-section" id="faq">
      <div className="section-inner">
        <div className="section-kicker centered"><span/> ТУСЛАМЖ · МЭДЭЭЛЭЛ <span/></div>
        <h2 className="section-title centered">Түгээмэл <em>асуулт, хариулт</em></h2>
        <p className="section-desc centered">Сугалаанд оролцох болон эрхээ шалгахтай холбоотой мэдээлэл.</p>
        <div className="faq-list">
          {faqs.map((faq,i)=><details className="faq-item" key={i}><summary>{faq[0]}</summary><p>{faq[1]}</p></details>)}
        </div>
      </div>
    </section>

    <section className="closing-band"><div className="closing-ornament">ᠮ</div><p>МОНГОЛЫН ХИЙМОРЬ · ХУРДНЫ БАХАРХАЛ</p><h2>{campaign?.closingTitle || "Хурдны өлзий дэлгэрэх болтугай"}</h2><a href="#search">ЭРХЭЭ ОДОО ШАЛГАХ <ArrowUpRight size={16}/></a></section>

    <footer className="footer">
      <div className="footer-main"><div className="brand"><span className="brand-mark"><span>ᠮ</span></span><span className="brand-name"><strong>СҮХБААТАРЫН ХУРД</strong><small>СУГАЛААТ ХУДАЛДАА</small></span></div><p>{campaign?.footerDescription || "Монгол өв соёл, хурдны хийморийг эрхэмлэн дээдэлье."}</p><div className="footer-actions">{campaign?.facebookPageUrl && <a href={campaign.facebookPageUrl} target="_blank" rel="noopener noreferrer">FACEBOOK PAGE ↗</a>}<a href="#home">ДЭЭШ БУЦАХ ↑</a></div></div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Сүхбаатарын хурд. Бүх эрх хуулиар хамгаалагдсан.</span><span>МОНГОЛ УЛС</span></div>
    </footer>
  </main>;
}
