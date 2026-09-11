import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { translateText, useI18n } from "@/i18n/I18n";

interface SeoProps {
  title: string;
  description: string;
  image?: string;
  schema?: Record<string, unknown> | Record<string, unknown>[];
}

const setMeta = (selector: string, attribute: "name" | "property", key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
};

const localizeSchema = (value: unknown, language: "de" | "tr" | "ku"): unknown => {
  if (typeof value === "string") return value.includes("Alp GmbH") ? value : translateText(value, language);
  if (Array.isArray(value)) return value.map((item) => localizeSchema(item, language));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localizeSchema(item, language)]));
  return value;
};

export function Seo({ title, description, image = "/assets/mezopotamya-hero.png", schema }: SeoProps) {
  const { pathname } = useLocation();
  const { language } = useI18n();

  useEffect(() => {
    const localizedTitle = translateText(title, language);
    const localizedDescription = translateText(description, language);
    const fullTitle = `${localizedTitle} | Mezopotamya Hagen`;
    const canonical = `${window.location.origin}${pathname === "/" ? "" : pathname}`;
    const cleanPath = pathname.replace(/^\/(tr|ku)(?=\/|$)/, "") || "/";
    document.title = fullTitle;
    document.documentElement.lang = language;
    setMeta('meta[name="description"]', "name", "description", localizedDescription);
    setMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    setMeta('meta[property="og:description"]', "property", "og:description", localizedDescription);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    setMeta('meta[property="og:url"]', "property", "og:url", canonical);
    setMeta('meta[property="og:locale"]', "property", "og:locale", language === "de" ? "de_DE" : language === "tr" ? "tr_TR" : "ku_TR");
    setMeta('meta[property="og:image"]', "property", "og:image", `${window.location.origin}${image}`);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = canonical;
    document.head.querySelectorAll('link[data-hreflang="true"]').forEach((node) => node.remove());
    (["de", "tr", "ku", "x-default"] as const).forEach((code) => {
      const alternate = document.createElement("link");
      alternate.rel = "alternate";
      alternate.hreflang = code;
      const prefix = code === "de" || code === "x-default" ? "" : `/${code}`;
      alternate.href = `${window.location.origin}${prefix}${cleanPath === "/" ? "" : cleanPath}`;
      alternate.dataset.hreflang = "true";
      document.head.appendChild(alternate);
    });
    document.head.querySelectorAll('script[data-page-schema="true"]').forEach((node) => node.remove());
    if (schema) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.pageSchema = "true";
      script.textContent = JSON.stringify(localizeSchema(schema, language));
      document.head.appendChild(script);
    }
  }, [description, image, language, pathname, schema, title]);
  return null;
}

export const businessSchema = {
  "@context": "https://schema.org",
  "@type": "FuneralHome",
  name: "Mezopotamya Bestattung & Überführung – Alp GmbH",
  telephone: "+4917681009006",
  email: "alp-gmbh@outlook.de",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Wehringhauser Str. 5",
    postalCode: "58089",
    addressLocality: "Hagen",
    addressCountry: "DE",
  },
  areaServed: ["Deutschland", "Niederlande", "Belgien", "Schweiz"],
  openingHours: "Mo-Su 00:00-23:59",
};
