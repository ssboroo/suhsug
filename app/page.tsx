"use client";

import { useState } from "react";
import { Award, ChevronRight, Search, ShieldCheck } from "lucide-react";

type Result = { transactionDate: string; phoneNumber: string; ticketCount: number };

export default function HomePage() {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  return <main className="site-shell">
    <header className="topbar">
      <a href="#" className="brand" style={{textDecoration:"none",color:"inherit"}}><span className="brand-mark">ᠮ</span><span>СҮХБААТАРЫН ХУРД</span></a>
      <nav className="navlinks"><a href="#home">НҮҮР</a><a href="#search">ЭРХЭЭ ШАЛГАХ</a><a href="#about">БИДНИЙ ТУХАЙ</a></nav>
      <a href="#search" style={{color:"#f0d79f",fontSize:12,textDecoration:"none",fontWeight:800}}>СУГАЛАА ШАЛГАХ ↗</a>
    </header>

    <section className="hero" id="home">
      <div className="hero-content">
        <div className="eyebrow">ӨВ СОЁЛ · ХУРД · ХИЙМОРЬ</div>
        <h1>СҮХБААТАРЫН <span>ХУРД</span></h1>
        <div className="hero-sub">МОРИНЫ СУГАЛАА</div>
        <div className="hero-rule" />
        <p className="hero-copy">Монгол түмний хийморь болсон хурдан хүлгийн уралдаан. Сугалаанд оролцох эрхээ утасны дугаараараа хялбархан шалгаарай.</p>
        <button className="primary-btn" onClick={() => document.getElementById("search")?.scrollIntoView({behavior:"smooth"})}>СУГАЛААНЫ ЭРХЭЭ ШАЛГАХ <ChevronRight size={17} style={{display:"inline",verticalAlign:"middle"}} /></button>
      </div>
    </section>

    <div className="pattern-band" />
    <section className="section" id="search">
      <div className="section-inner">
        <div className="section-kicker">ТАНЫ ХИЙМОРЬ ӨӨДӨӨ</div>
        <h2 className="section-title">Сугалааны эрхээ шалгах</h2>
        <p className="section-desc">Сугалаанд бүртгүүлсэн 8 оронтой утасны дугаараа оруулж эрхийн мэдээллээ шалгана уу.</p>
        <form className="search-card" onSubmit={searchPhone}>
          <label className="search-label" htmlFor="phone">УТАСНЫ ДУГААР</label>
          <input id="phone" className="phone-input" type="tel" inputMode="numeric" autoComplete="tel" maxLength={8} placeholder="Жишээ: 99112233" value={phone} onChange={e=>{setPhone(e.target.value.replace(/\D/g,"").slice(0,8));setMessage("");setResult(null);}} />
          <button className="search-submit" type="submit" disabled={phone.length!==8 || loading}><Search size={17} style={{display:"inline",verticalAlign:"middle",marginRight:8}}/>{loading ? "ШАЛГАЖ БАЙНА..." : "СУГАЛААГАА ШАЛГАХ"}</button>
          {message && <p role="status" style={{fontSize:13,color:result===null && message.includes("бүртгэл олдсонгүй")?"#9b633e":"#a34235",margin:"14px 0 0"}}>{message}</p>}
        </form>
        {result && result.length>0 && <div className="result-card" aria-live="polite">
          <div className="status"><ShieldCheck size={15} style={{display:"inline",verticalAlign:"middle",marginRight:6}}/> БҮРТГЭЛ ОЛДЛОО</div>
          {result.map((r,i)=><div key={i} style={{borderBottom:i===result.length-1?"1px solid #ffffff20":0,paddingBottom:10,marginBottom:4}}>
            <div className="result-row"><span>Гүйлгээний огноо</span><strong>{new Date(r.transactionDate).toLocaleDateString("mn-MN")}</strong></div>
            <div className="result-row"><span>Утасны дугаар</span><strong>{r.phoneNumber}</strong></div>
            <div className="result-row"><span>Сугалааны эрхийн тоо</span><strong className="result-count">{r.ticketCount} эрх</strong></div>
          </div>)}
        </div>}
      </div>
    </section>
    <div className="pattern-band" />
    <section className="section" id="about" style={{background:"#eee7d9"}}>
      <div className="section-inner" style={{textAlign:"center"}}>
        <Award size={30} color="#a77b37" style={{margin:"0 auto 14px"}}/>
        <div className="section-kicker">МОНГОЛЫН ХИЙМОРЬ</div>
        <h2 className="section-title">Хурдны өлзий дэлгэрэх болтугай</h2>
        <p className="section-desc">Монгол адууны хийморь, уяачдын хөдөлмөр, наадмын бахархлыг эрхэмлэн дээдэлнэ.</p>
      </div>
    </section>
    <footer className="footer"><div className="brand"><span className="brand-mark">ᠮ</span><span>СҮХБААТАРЫН ХУРД</span></div><p>МОРИНЫ СУГАЛАА · Монгол өв соёл, хурдны хийморь</p><small>© {new Date().getFullYear()} Сүхбаатарын хурд. Бүх эрх хуулиар хамгаалагдсан.</small></footer>
  </main>;
}