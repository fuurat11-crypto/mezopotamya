import { ArrowRight, Building2, FileCheck2, Globe2, HandHeart, HeartHandshake, MessageCircle, MoonStar, Phone, Plane, ScrollText, ShieldCheck, Truck, Users } from "lucide-react";
import { ContactActions, FinalCta, LinkCard, TrustStrip } from "@/components/ContentBlocks";
import { businessSchema, Seo } from "@/components/Seo";
import { PHONE_LINK } from "@/components/SiteLayout";
import { Link } from "@/i18n/I18n";

const services = [
  ["Internationale Überführungen", "Von der Abholung über Formalitäten und Transport bis zur Übergabe am Zielort.", "/internationale-ueberfuehrungen", <Globe2 />],
  ["Islamische Bestattungen", "Rituelle Versorgung und Beisetzung nach den religiösen Wünschen der Familie.", "/islamische-bestattung", <MoonStar />],
  ["Kurdische Bestattungen", "Kulturell vertraute, persönliche Begleitung ohne pauschale Annahmen.", "/kurdische-bestattung", <HandHeart />],
  ["Abholung Verstorbener", "Verlässliche Koordination der Abholung am Sterbeort und weiteren Versorgung.", "/leistungen/abholung-verstorbener", <Truck />],
  ["Rituelle Waschung", "Ghusl und Kafan werden respektvoll und nach Absprache organisiert.", "/leistungen/rituelle-waschung", <HeartHandshake />],
  ["Behörden & Dokumente", "Unterstützung bei Sterbeurkunde, Standesamt, Leichenpass und Unterlagen.", "/leistungen/behoerden-dokumente", <FileCheck2 />],
  ["Konsulate", "Koordination konsularischer Formalitäten entsprechend dem konkreten Zielland.", "/leistungen/konsulate", <Building2 />],
  ["Flug- & Fahrzeugüberführung", "Planung der geeigneten Transportart einschließlich Flug- und Frachtabwicklung.", "/leistungen/flug-fahrzeug", <Plane />],
  ["Organisation der Beisetzung", "Abstimmung der nächsten Schritte bis zur Bestattung oder Übergabe.", "/leistungen/organisation-beisetzung", <Users />],
];

const countries = [
  ["Türkei", "Überführung in die Türkei mit abgestimmter Behörden-, Konsulats- und Transportkoordination.", "/ueberfuehrung-tuerkei"],
  ["Irak / Kurdistan", "Individuelle Planung unter Berücksichtigung von Route, Zielregion und aktuellen Vorgaben.", "/ueberfuehrung-irak-kurdistan"],
  ["Syrien", "Sorgfältige Einzelfallprüfung der realisierbaren Route und notwendigen Genehmigungen.", "/ueberfuehrung-syrien"],
  ["Europa", "Grenzüberschreitende Überführungen, unter anderem in die Niederlande, nach Belgien und in die Schweiz.", "/internationale-ueberfuehrungen"],
];

export default function Index() {
  return <>
    <Seo title="Bestatter Hagen – islamische & kurdische Bestattungen" description="Mezopotamya in Hagen begleitet Familien 24/7 bei Bestattungen, Formalitäten und internationalen Überführungen in die Türkei, nach Kurdistan, Irak, Syrien und weltweit." schema={businessSchema} />
    <section className="site-container pt-5 md:pt-8">
      <div className="relative min-h-[650px] overflow-hidden rounded-[2.25rem] bg-ink lg:min-h-[680px]">
        <img src="/assets/mezopotamya-hero.png" alt="Ruhige menschliche Begleitung in schweren Zeiten" className="absolute inset-0 h-full w-full object-cover object-center opacity-40 lg:object-right" />
        <div className="absolute inset-0 bg-stone-950/50" />
        <div className="relative flex min-h-[650px] max-w-3xl flex-col justify-center p-7 text-white sm:p-12 lg:min-h-[680px] lg:p-16">
          <p className="eyebrow reveal !text-[#e0b184]">Bestattung & internationale Überführung</p>
          <h1 className="display-title reveal max-w-2xl text-5xl sm:text-6xl lg:text-7xl">In schweren Zeiten an Ihrer Seite.</h1>
          <p className="reveal-delay mt-6 max-w-xl text-lg leading-8 text-stone-200">Bestattungen und internationale Überführungen mit Erfahrung, Respekt und persönlicher Begleitung.</p>
          <div className="reveal-delay mt-8 flex flex-wrap gap-3"><ContactActions /></div>
          <Link to="/im-todesfall" className="mt-7 inline-flex w-fit items-center gap-2 text-sm font-semibold text-white underline decoration-white/40 underline-offset-8 hover:text-bronze">Was ist jetzt zu tun?<ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
    <TrustStrip />

    <section className="section-space site-container">
      <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:items-end"><div><p className="eyebrow">Soforthilfe</p><h2 className="section-title">Ein Todesfall ist eingetreten – was jetzt?</h2></div><p className="body-large">Sie müssen in diesem Moment nicht den gesamten Ablauf kennen. Ein Anruf genügt, damit wir den konkreten Fall besprechen und die nächsten Schritte gemeinsam ordnen.</p></div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">{[
        ["1", "Rufen Sie uns an.", "Wir sind rund um die Uhr erreichbar und hören zunächst genau zu."],
        ["2", "Wir klären den Todesfall.", "Wir besprechen Sterbeort, Wünsche und die notwendigen nächsten Schritte."],
        ["3", "Wir begleiten die Familie.", "Bis zur Bestattung oder zur geordneten Übergabe am Zielort."],
      ].map(([n, title, text]) => <article key={n} className="rounded-3xl bg-sand p-7"><span className="font-serif text-4xl text-brand">{n}</span><h3 className="mt-6 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-stone-600">{text}</p></article>)}</div>
      <a href={`tel:${PHONE_LINK}`} className="btn-dark mt-8"><Phone className="h-4 w-4" />Todesfall melden</a>
    </section>

    <section className="bg-white section-space"><div className="site-container"><div className="max-w-2xl"><p className="eyebrow">Unsere Leistungen</p><h2 className="section-title">Verlässlich organisiert. Persönlich begleitet.</h2><p className="body-large mt-5">Ein fester Ansprechpartner koordiniert die notwendigen organisatorischen, behördlichen und kulturellen Schritte.</p></div><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{services.map(([title, text, to, icon]) => <LinkCard key={title as string} title={title as string} text={text as string} to={to as string} icon={icon} />)}</div></div></section>

    <section className="section-space site-container"><div className="overflow-hidden rounded-[2rem] bg-ink text-white lg:grid lg:grid-cols-2"><img src="/assets/ueberfuehrung-landschaft.png" alt="Ruhiger Weg durch eine weite Landschaft als Symbol internationaler Überführung" className="h-80 w-full object-cover lg:h-full" /><div className="p-7 sm:p-10 lg:p-14"><p className="eyebrow">Internationale Überführungen</p><h2 className="section-title">Überführungen in die Heimat – zuverlässig organisiert.</h2><p className="mt-6 leading-7 text-stone-300">Wir begleiten Familien von der Abholung in Deutschland über Behörden, Dokumente und Transport bis zur Übergabe am Zielort.</p><Link to="/internationale-ueberfuehrungen" className="btn-primary mt-8">Alle Zielländer<ArrowRight className="h-4 w-4" /></Link></div></div><div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{countries.map(([title,text,to]) => <Link key={title} to={to} className="rounded-3xl border border-stone-200 bg-white p-6 hover:border-brand"><h3 className="text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-stone-600">{text}</p><span className="mt-5 flex items-center gap-2 text-sm font-semibold text-brand">Details <ArrowRight className="h-4 w-4" /></span></Link>)}</div></section>

    <section className="bg-white section-space"><div className="site-container grid gap-8 lg:grid-cols-2 lg:items-center"><div><p className="eyebrow">Verständnis schafft Vertrauen</p><h2 className="section-title">Kulturell vertraut. Offen für jede Familie.</h2><p className="body-large mt-5">Mezopotamya ist ein erfahrener Ansprechpartner für kurdische, türkische und muslimische Familien. Gleichzeitig begleiten wir Menschen jeder Herkunft respektvoll und ohne pauschale Annahmen.</p><div className="mt-7 grid gap-3 text-sm font-semibold">{["Wünsche der Familie stehen im Mittelpunkt", "Religiöse und regionale Traditionen werden individuell besprochen", "Klare Kommunikation in jedem Schritt"].map(item => <div key={item} className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-brand" />{item}</div>)}</div></div><img src="/assets/beratung-vertrauen.png" alt="Vertrauensvolles Beratungsgespräch mit einer Familie" className="h-[420px] w-full rounded-[2rem] object-cover" /></div></section>

    <FinalCta />
  </>;
}
