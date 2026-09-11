import { FormEvent, ReactNode, useState } from "react";
import { ArrowRight, Check, ChevronRight, MessageCircle, Phone, Send } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link, useI18n } from "@/i18n/I18n";
import { EMAIL, PHONE_LINK, WHATSAPP_LINK } from "./SiteLayout";

export function Breadcrumbs({ current }: { current: string }) {
  return <nav aria-label="Breadcrumb" className="site-container pt-6 text-xs text-stone-500"><ol className="flex items-center gap-2"><li><Link className="hover:text-brand" to="/">Startseite</Link></li><ChevronRight className="h-3 w-3" /><li className="text-stone-700" aria-current="page">{current}</li></ol></nav>;
}

interface PageHeroProps { eyebrow: string; title: string; intro: string; image?: string; children?: ReactNode; }
export function PageHero({ eyebrow, title, intro, image, children }: PageHeroProps) {
  return <section className="site-container py-10 md:py-16"><div className={`overflow-hidden rounded-[2rem] ${image ? 'grid bg-ink lg:grid-cols-[1.05fr_.95fr]' : 'paper-pattern border border-stone-200'}`}><div className={`flex flex-col justify-center p-7 sm:p-10 lg:p-14 ${image ? 'text-white' : ''}`}><p className="eyebrow">{eyebrow}</p><h1 className="display-title max-w-3xl">{title}</h1><p className={`mt-6 max-w-2xl text-base leading-7 sm:text-lg ${image ? 'text-stone-300' : 'text-stone-600'}`}>{intro}</p>{children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}</div>{image && <img src={image} alt="Ruhiges Motiv für persönliche Begleitung und würdevolle Bestattung" className="h-72 w-full object-cover lg:h-full" />}</div></section>;
}

export function ContactActions({ inquiry = false }: { inquiry?: boolean }) {
  return <><a className="btn-primary" href={`tel:${PHONE_LINK}`}><Phone className="h-4 w-4" />Jetzt anrufen</a><a className="btn-outline" href={WHATSAPP_LINK} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" />WhatsApp</a>{inquiry && <a className="btn-outline" href="#anfrage">Überführung anfragen</a>}</>;
}

export function TrustStrip() {
  return <div className="site-container -mt-4 relative z-10"><div className="grid rounded-3xl border border-stone-200 bg-white p-5 shadow-lg shadow-stone-800/5 sm:grid-cols-2 lg:grid-cols-4">{["Persönliche Begleitung", "Internationale Überführungen", "Unterstützung bei Formalitäten", "24 Stunden erreichbar"].map((item) => <div key={item} className="flex items-center gap-3 border-stone-200 p-3 lg:border-r lg:last:border-0"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sand text-brand"><Check className="h-4 w-4" /></span><span className="text-sm font-semibold">{item}</span></div>)}</div></div>;
}

export function Steps({ items }: { items: { title: string; text: string }[] }) {
  return <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => <article key={item.title} className="rounded-3xl border border-stone-200 bg-white p-6"><span className="font-serif text-3xl text-brand">{String(index + 1).padStart(2, '0')}</span><h3 className="mt-5 text-xl font-semibold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-stone-600">{item.text}</p></article>)}</div>;
}

export interface FaqItem { question: string; answer: string; }
export function FaqList({ items }: { items: FaqItem[] }) {
  return <Accordion type="single" collapsible className="mt-8 rounded-3xl border border-stone-200 bg-white px-5 sm:px-8">{items.map((item, index) => <AccordionItem key={item.question} value={`faq-${index}`}><AccordionTrigger className="py-5 text-left font-semibold hover:no-underline">{item.question}</AccordionTrigger><AccordionContent className="max-w-3xl pb-6 leading-7 text-stone-600">{item.answer}</AccordionContent></AccordionItem>)}</Accordion>;
}

export function FinalCta() {
  return <section className="site-container pb-16 md:pb-24"><div className="rounded-[2rem] bg-ink px-7 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-14"><div><p className="eyebrow">Wir sind für Sie erreichbar</p><h2 className="section-title">Sie müssen nicht alles selbst organisieren.</h2><p className="mt-3 text-stone-300">Rufen Sie uns an – wir erklären Ihnen ruhig und verständlich die nächsten Schritte.</p></div><div className="mt-7 flex flex-wrap gap-3 lg:mt-0"><a className="btn-primary" href={`tel:${PHONE_LINK}`}><Phone className="h-4 w-4" />24h anrufen</a><a className="btn-outline !border-white/30 !bg-transparent !text-white" href={WHATSAPP_LINK} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" />WhatsApp</a></div></div></section>;
}

export function InquiryForm({ compact = false }: { compact?: boolean }) {
  const [sent, setSent] = useState(false);
  const { t } = useI18n();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`${t("Anfrage")} Mezopotamya – ${data.get('zielland') || t('Kontakt')}`);
    const body = encodeURIComponent(`${t("Name")}: ${data.get('name')}\n${t("Telefon")}: ${data.get('telefon')}\nE-Mail: ${data.get('email')}\n${t("Zielland")}: ${data.get('zielland')}\n\n${t("Nachricht")}:\n${data.get('nachricht')}`);
    setSent(true);
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  };
  return <form onSubmit={submit} className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold">Name *<input required name="name" autoComplete="name" className="mt-2 h-12 w-full rounded-xl border bg-ivory px-4 font-normal" /></label><label className="text-sm font-semibold">Telefon *<input required name="telefon" type="tel" autoComplete="tel" className="mt-2 h-12 w-full rounded-xl border bg-ivory px-4 font-normal" /></label><label className="text-sm font-semibold">E-Mail (optional)<input name="email" type="email" autoComplete="email" className="mt-2 h-12 w-full rounded-xl border bg-ivory px-4 font-normal" /></label><label className="text-sm font-semibold">Zielland<input name="zielland" className="mt-2 h-12 w-full rounded-xl border bg-ivory px-4 font-normal" placeholder="z. B. Türkei, Irak, Syrien" /></label></div>{!compact && <label className="mt-5 block text-sm font-semibold">Nachricht *<textarea required name="nachricht" rows={5} className="mt-2 w-full rounded-xl border bg-ivory p-4 font-normal" /></label>}<label className="mt-5 flex items-start gap-3 text-sm leading-6 text-stone-600"><input required type="checkbox" aria-label="Datenschutz akzeptieren" className="mt-1 h-4 w-4 shrink-0 accent-[#9A6642]" /><span>Ich habe die <Link className="text-brand underline" to="/datenschutz">Datenschutzhinweise</Link> gelesen und stimme der Verarbeitung meiner Angaben zur Bearbeitung der Anfrage zu.</span></label><button className="btn-primary mt-6" type="submit"><Send className="h-4 w-4" />Anfrage per E-Mail senden</button>{sent && <p role="status" className="mt-4 text-sm text-brand">Ihr E-Mail-Programm wurde mit der vorbereiteten Anfrage geöffnet.</p>}</form>;
}

export function LinkCard({ to, title, text, icon }: { to: string; title: string; text: string; icon?: ReactNode }) {
  return <Link to={to} className="group flex h-full flex-col rounded-3xl border border-stone-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-xl hover:shadow-stone-900/5"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-sand text-brand">{icon ?? <ArrowRight className="h-5 w-5" />}</span><h3 className="mt-6 text-xl font-semibold">{title}</h3><p className="mt-3 flex-1 text-sm leading-6 text-stone-600">{text}</p><span className="mt-6 flex items-center gap-2 text-sm font-semibold text-brand">Mehr erfahren <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></Link>;
}
