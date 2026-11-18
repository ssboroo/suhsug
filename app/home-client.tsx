"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Facebook, Search, ShieldCheck, Sparkles, Trophy } from "lucide-react";

type Result = { transactionDate: string; phoneNumber: string; ticketCount: number };
type PublicCampaign = {
  id: string;
  targetTicketCount: number | null;
  title: string; description: string; heroImageUrl: string | null; bankName: string | null; bankLogoUrl: string | null; accountHolder: string | null; accountNumber: string | null; iban: string | null; heroEyebrow: string | null;
  heroOverline: string | null; faqContent: string | null; stepsContent: string | null;
  closingTitle: string | null; footerDescription: string | null;
  facebookPageUrl: string | null;
};
type PublicProgress = { percent: number; sold: number; target: number | null; remaining: number | null };

const defaultHorseImage = "https://commons.wikimedia.org/wiki/Special:FilePath/Herd_of_horses_in_Mongolia.jpg?width=2000";

export default function HomePage() {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);
  const [campaigns, setCampaigns] = useState<{campaign:PublicCampaign;stats:{participants:number;tickets:number};progress:PublicProgress}[]>([]);
  const [progress, setProgress] = useState<PublicProgress | null>(null);
  const [stats, setStats] = useState<{participants:number;tickets:number}|null>(null);

  useEffect(() => {
    fetch("/api/campaign/public", { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (data?.campaigns?.length) { setCampaigns(data.campaigns); setCampaign(data.campaigns[0].campaign); setProgress(data.campaigns[0].progress); setStats(data.campaigns[0].stats); } else if (data?.campaign) { setCampaign(data.campaign); if (data?.progress) setProgress(data.progress); if (data?.stats) setStats(data.stats); } })
      .catch(() => undefined);
  }, []);

  async function searchPhone(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^\d{8}$/.test(phone)) { setMessage("Утасны дугаар 8 оронтой байх шаардлагатай."); return; }
    setLoading(true); setMessage(""); setResult(null);
    try {
      const response = await fetch("/api/search?phone=" + encodeURIComponent(phone) + (campaign?.id ? "&campaignId=" + encodeURIComponent(campaign.id) : ""), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Хайлт хийхэд алдаа гарлаа.");
      setResult(data.records || []);
      if (!data.records?.length) setMessage("Энэ дугаарт бүртгэл олдсонгүй. Утасны дугаараа шалгаад дахин оролдоно уу.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Түр алдаа гарлаа.");
    } finally { setLoading(false); }
  }

  function shareCampaign() {
    const url = window.location.href.split("#")[0];
    window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url), "_blank", "noopener,noreferrer,width=720,height=620");
  }

  const heroImage = campaign?.heroImageUrl || defaultHorseImage;
  const heroStyle = {
    backgroundImage: `linear-gradient(90deg,rgba(5,16,23,.88) 0%,rgba(5,16,23,.67) 44%,rgba(5,16,23,.22) 100%),url("${heroImage}")`
  };

  return (
    <main className="home-v2">
      <header className="home-v2-header">
        <a href="#home" className="home-v2-brand" aria-label="Сүхбаатарын хурд нүүр хуудас">
          <span className="home-v2-emblem" aria-hidden="true"><svg viewBox="0 0 48 48" role="img"><path d="M10 34c4-2 6-6 7-11l-3-7 7 2 4-5 4 2 2 7 8 5-4 3-5-2-2 7-5 4-3-3 2-6-6 1-2 6-4 1 1-4-4 2z" fill="currentColor"/><path d="M22 16l-1-7 5 4M29 14l5-5-1 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
          <span><strong>СҮХБААТАРЫН ХУРД</strong><small>СУГАЛААТ ХУДАЛДАА</small></span>
        </a>
        <nav className="home-v2-nav" aria-label="Үндсэн цэс">
          <a href="#home">НҮҮР</a>
          {campaign?.facebookPageUrl && <a href={campaign.facebookPageUrl} target="_blank" rel="noopener noreferrer">FACEBOOK</a>}
        </nav>
        <a className="home-v2-header-cta" href="#ticket-check"><Search size={15}/> ЭРХЭЭ ШАЛГАХ</a>
      </header>

      {campaigns.length > 1 && <section className="home-v2-campaign-picker" aria-label="Явагдаж буй сугалаанууд">
        <div className="home-v2-picker-heading"><span>АЗ ХИЙМОРИЙН БОЛОМЖУУД</span><strong>Явагдаж буй сугалаанууд</strong></div>
        <div className="home-v2-picker-grid">{campaigns.map(item=><button type="button" key={item.campaign.id} onClick={()=>{setCampaign(item.campaign);setProgress(item.progress);setStats(item.stats);setResult(null);setMessage("");}} className={"home-v2-picker-card"+(campaign?.id===item.campaign.id?" selected":"")}>
          <span className="home-v2-picker-image" style={{backgroundImage:item.campaign.heroImageUrl?'url("'+item.campaign.heroImageUrl+'")':"linear-gradient(135deg,#17313c,#52624e)"}}><i>ИДЭВХТЭЙ</i></span>
          <span className="home-v2-picker-info"><strong>{item.campaign.title}</strong><small>{item.stats.tickets.toLocaleString("mn-MN")} эрх · {item.stats.participants.toLocaleString("mn-MN")} оролцогч</small><span className="home-v2-picker-track"><i style={{width:item.progress.percent+"%"}}/></span><em>{item.progress.percent}% дүүргэлт</em></span>
        </button>)}</div>
      </section>}
      <section className="home-v2-hero" id="home" style={heroStyle}>
        <div className="home-v2-shade"/>
        <div className="home-v2-inner">
          <div className="home-v2-story">
            <div className="home-v2-kicker"><span/> {campaign?.heroEyebrow || "ӨВ СОЁЛ · ХУРД · ХИЙМОРЬ"}</div>
            <p className="home-v2-overline">{campaign?.heroOverline || "МОНГОЛЫН ХУРДНЫ ӨВ СОЁЛ"}</p>
            <h1>СҮХБААТАРЫН<br/><em>ХУРД</em></h1>
            <div className="home-v2-subtitle"><span/> СУГАЛААТ ХУДАЛДАА</div>
            <p className="home-v2-description">{campaign?.description || "Монгол түмний хийморь болсон хурдан хүлгийн уралдаанд тавтай морил. Сугалаанд бүртгүүлсэн эрхээ утасны дугаараараа хялбар, шуурхай шалгаарай."}</p>
            <div className="home-v2-trust"><ShieldCheck size={16}/> Бүртгэлийн мэдээллийг албан ёсны системээс шалгана</div>
            <div className="home-v2-progress">
              <span className="home-v2-progress-icon"><Trophy size={16}/></span>
              <span className="home-v2-progress-copy"><strong>СУГАЛААНЫ ЯВЦ</strong><small>{campaign?.title || "Сүхбаатарын хурд"}</small></span>
              {progress ? <strong className="home-v2-progress-percent">{progress.percent}%</strong> : <span className="home-v2-progress-live">АЛБАН ЁСНЫ</span>}
              {progress && <span className="home-v2-progress-line"><i style={{width: progress.percent + "%"}}/></span>}
            </div>
            <section className="home-v2-live-card" aria-label="Сугалааны явц">
              <div className="home-v2-live-head">
                <span className="home-v2-live-symbol"><Trophy size={17}/></span>
                <span><small>ОДОО ЯВАГДАЖ БУЙ</small><strong>{campaign?.title || "Сүхбаатарын хурд"}</strong></span>
                <span className="home-v2-live-badge"><i/> ИДЭВХТЭЙ</span>
              </div>
              <div className="home-v2-live-numbers">
                <div><strong>{(stats?.tickets ?? 0).toLocaleString("mn-MN")}</strong><small>БОРЛУУЛАГДСАН ЭРХ</small></div>
                <div><strong>{campaign?.targetTicketCount ? campaign.targetTicketCount.toLocaleString("mn-MN") : "—"}</strong><small>НИЙТ ЭРХ</small></div>
                <div><strong>{campaign?.targetTicketCount ? Math.max(0, campaign.targetTicketCount - (stats?.tickets ?? 0)).toLocaleString("mn-MN") : "—"}</strong><small>ҮЛДСЭН ЭРХ</small></div>
              </div>
              <div className="home-v2-live-track"><span style={{width: (progress?.percent ?? 0) + "%"}}/></div>
              <div className="home-v2-live-foot">
                <strong>{progress ? progress.percent + "% дүүргэлт" : "Дүүргэлтийн зорилт тохируулаагүй"}</strong>
                <span>{(stats?.participants ?? 0).toLocaleString("mn-MN")} оролцогч</span>
              </div>
              <p>Сугалааны бүртгэл шинэчлэгдэх бүрд явцын тоо автоматаар шинэчлэгдэнэ.</p>
            </section>
            <button className="home-v2-share" type="button" onClick={shareCampaign}><Facebook size={15}/> Facebook дээр хуваалцах</button>
          </div>

          <aside className="home-v2-check-card" id="ticket-check">
            <div className="home-v2-card-top"><span className="home-v2-card-icon"><Sparkles size={18}/></span><span className="home-v2-card-tag">ШУУРХАЙ · ХЯЛБАР · НАЙДВАРТАЙ</span></div>
            <div className="home-v2-card-heading">
              <span>СУГАЛААНЫ ЭРХ</span>
              <h2>Эрхээ шалгах</h2>
              <p>Бүртгүүлсэн утасны дугаараа оруулна уу.</p>
            </div>
            <form onSubmit={searchPhone} className="home-v2-form">
              <label htmlFor="phone-v2">УТАСНЫ ДУГААР</label>
              <div className="home-v2-phone">
                <span>+976</span>
                <input id="phone-v2" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={8} placeholder="9911 2233" value={phone}
                  onChange={e => {setPhone(e.target.value.replace(/\D/g, "").slice(0, 8)); setMessage(""); setResult(null);}}/>
                <small>{phone.length}/8</small>
              </div>
              <button className="home-v2-submit" type="submit" disabled={phone.length !== 8 || loading}>
                <Search size={17}/>{loading ? "ШАЛГАЖ БАЙНА..." : "СУГАЛААНЫ ЭРХЭЭ ШАЛГАХ"}<ArrowRight size={17}/>
              </button>
              {message && <div role="status" className={message.includes("бүртгэл олдсонгүй") ? "home-v2-message warning" : "home-v2-message error"}>{message}</div>}
            </form>
            {result && result.length > 0 && <div className="home-v2-result" aria-live="polite">
              <div className="home-v2-result-title"><CheckCircle2 size={18}/><span><strong>БҮРТГЭЛ ОЛДЛОО</strong><small>Таны хайлтын үр дүн</small></span></div>
              {result.map((r, i) => <div className="home-v2-result-row" key={i}>
                <div><small>Гүйлгээний огноо</small><strong>{new Date(r.transactionDate).toLocaleDateString("mn-MN")}</strong></div>
                <div><small>Сугалааны эрх</small><strong className="home-v2-ticket-count">{r.ticketCount} <i>ЭРХ</i></strong></div>
              </div>)}
            </div>}
            {(campaign?.bankName || campaign?.accountNumber) && <div className="home-v2-bank">
              <div className="home-v2-bank-top">
                {campaign.bankLogoUrl ? <img src={campaign.bankLogoUrl} alt={campaign.bankName || "Банк"} /> : <span className="home-v2-bank-mark">{(campaign.bankName || "Б").slice(0,1)}</span>}
                <span><small>ОРОЛЦОХ ДАНС</small><strong>{campaign.bankName || "Банкны мэдээлэл"}</strong></span>
              </div>
              {campaign.accountNumber && <div className="home-v2-account"><span>ДАНСНЫ ДУГААР</span><strong>{campaign.accountNumber}</strong></div>}
              {campaign.accountHolder && <div className="home-v2-account-holder">{campaign.accountHolder}</div>}
              {campaign.iban && <div className="home-v2-iban">IBAN: {campaign.iban}</div>}
            </div>}
            {stats && <div className="home-v2-stats">
              <div><strong>{stats.participants.toLocaleString("mn-MN")}</strong><small>ОРОЛЦОГЧ</small></div>
              <span/>
              <div><strong>{stats.tickets.toLocaleString("mn-MN")}</strong><small>НИЙТ ЭРХ</small></div>
            </div>}
            <div className="home-v2-card-foot"><ShieldCheck size={14}/> Таны мэдээлэл хамгаалагдсан.</div>
          </aside>
        </div>
        <div className="home-v2-bottom-mark"><span/> ХУРД · ХИЙМОРЬ · БАХАРХАЛ <span/></div>
      </section>

      <footer className="home-v2-footer">
        <span>© {new Date().getFullYear()} СҮХБААТАРЫН ХУРД</span>
        <span>{campaign?.footerDescription || "Монгол өв соёл, хурдны хийморийг эрхэмлэн дээдэлье."}</span>
        <a href="#home">ДЭЭШ ↑</a>
      </footer>
    </main>
  );
}
