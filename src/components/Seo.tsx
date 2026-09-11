import { useEffect } from "react";
import { useLocation } from "react-router-dom";

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

export function Seo({ title, description, image = "/assets/mezopotamya-hero.png", schema }: SeoProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    const fullTitle = `${title} | Mezopotamya Hagen`;
    const canonical = `${window.location.origin}${pathname === "/" ? "" : pathname}`;
    document.title = fullTitle;
    document.documentElement.lang = "de";
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    setMeta('meta[property="og:url"]', "property", "og:url", canonical);
    setMeta('meta[property="og:image"]', "property", "og:image", `${window.location.origin}${image}`);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;
    document.head.querySelectorAll('script[data-page-schema="true"]').forEach((node) => node.remove());
    if (schema) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.pageSchema = "true";
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }
  }, [description, image, pathname, schema, title]);
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
