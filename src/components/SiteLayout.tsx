import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ChevronDown, Clock3, Mail, MapPin, Menu, MessageCircle, Phone, X } from "lucide-react";
import { Language, Link, NavLink, TranslationLayer, useI18n } from "@/i18n/I18n";

export const PHONE_DISPLAY = "0176 81009006";
export const PHONE_LINK = "+4917681009006";
export const WHATSAPP_LINK = "https://wa.me/4917681009006";
export const EMAIL = "alp-gmbh@outlook.de";

const nav = [
  ["Startseite", "/"],
  ["Im Todesfall", "/im-todesfall"],
  ["Leistungen", "/leistungen"],
  ["Überführungen", "/internationale-ueberfuehrungen"],
  ["Islamische Bestattung", "/islamische-bestattung"],
  ["Kurdische Bestattung", "/kurdische-bestattung"],
  ["Über uns", "/ueber-uns"],
  ["FAQ", "/faq"],
  ["Kontakt", "/kontakt"],
];

function LanguageSwitch() {
  const { language, switchLanguage } = useI18n();
  const options: { code: Language; label: string }[] = [{ code: "de", label: "DE" }, { code: "tr", label: "TR" }, { code: "ku", label: "KU" }];
  return (
    <div className="relative flex items-center gap-1 text-xs font-semibold tracking-widest" aria-label="Sprachauswahl">
      {options.map((option) => (
        <button key={option.code} onClick={() => switchLanguage(option.code)} className={`rounded-full px-2.5 py-2 transition ${language === option.code ? 'bg-brand text-white' : 'text-stone-600 hover:bg-sand'}`} aria-current={language === option.code ? 'true' : undefined} lang={option.code}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function SiteLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    if (location.hash) {
      window.setTimeout(() => document.querySelector(location.hash)?.scrollIntoView(), 0);
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [location.hash, location.pathname]);

  return (
    <TranslationLayer><div className="min-h-screen bg-ivory text-ink">
      <a href="#main" className="sr-only z-[100] rounded-lg bg-white px-4 py-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Zum Inhalt springen</a>
      <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-ivory/95 backdrop-blur-lg">
        <div className="bg-ink text-white">
          <div className="site-container flex min-h-10 items-center justify-between gap-4 py-2 text-xs sm:text-sm">
            <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-bronze" />24 Stunden erreichbar – auch an Sonn- und Feiertagen</span>
            <div className="hidden items-center gap-4 sm:flex">
              <a className="font-semibold hover:text-bronze" href={`tel:${PHONE_LINK}`}>Jetzt anrufen</a>
              <a className="font-semibold hover:text-bronze" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
          </div>
        </div>
        <div className="site-container flex h-[78px] items-center justify-between gap-6">
          <Link to="/" className="group flex items-center gap-3" aria-label="Mezopotamya Startseite">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-brand/30 bg-sand font-serif text-xl font-semibold text-brand">M</span>
            <span className="leading-tight"><strong className="block font-serif text-lg font-semibold tracking-wide text-ink">MEZOPOTAMYA</strong><span className="hidden text-[10px] uppercase tracking-[0.2em] text-stone-500 sm:block">Bestattung & Überführung</span></span>
          </Link>
          <nav className="hidden items-center gap-5 xl:flex" aria-label="Hauptnavigation">
            {nav.map(([label, href]) => <NavLink key={href} to={href} className={({ isActive }) => `text-[13px] font-medium transition hover:text-brand ${isActive ? 'text-brand' : 'text-stone-700'}`}>{label}</NavLink>)}
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <button onClick={() => setOpen(!open)} className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-white xl:hidden" aria-expanded={open} aria-label="Menü öffnen">{open ? <X /> : <Menu />}</button>
          </div>
        </div>
        {open && <nav className="border-t border-stone-200 bg-white px-5 py-4 xl:hidden" aria-label="Mobile Navigation"><div className="mx-auto grid max-w-3xl gap-1">{nav.map(([label, href]) => <NavLink key={href} to={href} className={({ isActive }) => `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium ${isActive ? 'bg-sand text-brand' : 'text-stone-700'}`}>{label}<ChevronDown className="h-4 w-4 -rotate-90" /></NavLink>)}</div></nav>}
      </header>

      <main id="main"><Outlet /></main>

      <footer className="bg-ink pb-20 text-stone-300 md:pb-0">
        <div className="site-container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
          <div><div className="font-serif text-2xl text-white">Mezopotamya</div><p className="mt-4 max-w-xs text-sm leading-6">Bestattungen und internationale Überführungen – persönlich, kultursensibel und rund um die Uhr erreichbar.</p></div>
          <div><h2 className="text-sm font-semibold uppercase tracking-widest text-white">Soforthilfe</h2><div className="mt-4 space-y-3 text-sm"><a className="flex items-center gap-2 hover:text-bronze" href={`tel:${PHONE_LINK}`}><Phone className="h-4 w-4" />{PHONE_DISPLAY}</a><a className="flex items-center gap-2 hover:text-bronze" href={WHATSAPP_LINK} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" />WhatsApp öffnen</a><a className="flex items-center gap-2 hover:text-bronze" href={`mailto:${EMAIL}`}><Mail className="h-4 w-4" />{EMAIL}</a></div></div>
          <div><h2 className="text-sm font-semibold uppercase tracking-widest text-white">Anschrift</h2><address className="mt-4 flex gap-2 text-sm not-italic leading-6"><MapPin className="mt-1 h-4 w-4 shrink-0" />Alp GmbH<br />Wehringhauser Str. 5<br />58089 Hagen</address></div>
          <div><h2 className="text-sm font-semibold uppercase tracking-widest text-white">Information</h2><div className="mt-4 grid gap-2 text-sm"><Link className="hover:text-bronze" to="/ratgeber">Ratgeber</Link><Link className="hover:text-bronze" to="/impressum">Impressum</Link><Link className="hover:text-bronze" to="/datenschutz">Datenschutz</Link></div></div>
        </div>
        <div className="border-t border-white/10"><div className="site-container py-5 text-xs text-stone-500">© {new Date().getFullYear()} Alp GmbH · Mezopotamya Bestattung & Überführung</div></div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 border-t border-stone-200 bg-white p-2 shadow-[0_-8px_30px_rgba(35,31,28,.12)] md:hidden">
        <a href={`tel:${PHONE_LINK}`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink font-semibold text-white"><Phone className="h-5 w-5" />Telefon</a>
        <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-xl font-semibold text-brand"><MessageCircle className="h-5 w-5" />WhatsApp</a>
      </div>
    </div></TranslationLayer>
  );
}
