import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";

export default function NotFound() {
  return <><Seo title="Seite nicht gefunden" description="Die angeforderte Seite konnte nicht gefunden werden." /><section className="site-container flex min-h-[60vh] items-center justify-center py-20"><div className="max-w-xl text-center"><p className="eyebrow">Fehler 404</p><h1 className="display-title">Diese Seite wurde nicht gefunden.</h1><p className="body-large mt-5">Vielleicht wurde der Link geändert. Über die Startseite erreichen Sie alle wichtigen Informationen und unseren 24h-Kontakt.</p><Link className="btn-primary mt-8" to="/">Zur Startseite</Link></div></section></>;
}
