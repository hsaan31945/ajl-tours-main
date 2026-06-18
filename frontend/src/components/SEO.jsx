import { useEffect } from "react";
import { useI18n } from "../i18n";

const DEFAULT_TITLE = "AJL Tours | Private Switzerland Tours";
const DEFAULT_DESCRIPTION =
  "AJL Tours offers private Switzerland tours with luxury vehicles, tailored itineraries, local guides, and seamless premium travel experiences.";

const upsertMeta = (selector, attributes) => {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    document.head.appendChild(tag);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    tag.setAttribute(key, value);
  });
};

const upsertCanonical = (href) => {
  let tag = document.head.querySelector('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", "canonical");
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
};

const upsertJsonLd = (id, data) => {
  let tag = document.head.querySelector(`script[data-seo-jsonld="${id}"]`);
  if (!data) {
    tag?.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement("script");
    tag.type = "application/ld+json";
    tag.setAttribute("data-seo-jsonld", id);
    document.head.appendChild(tag);
  }
  tag.textContent = JSON.stringify(data);
};

const SEO = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  image = "/logoTravel.png",
  canonicalPath,
  noIndex = false,
  type = "website",
  structuredData,
}) => {
  const { language, t } = useI18n();
  const resolvedTitle = title === DEFAULT_TITLE ? t("seo.defaultTitle") : title;
  const resolvedDescription = description === DEFAULT_DESCRIPTION ? t("seo.defaultDescription") : description;

  useEffect(() => {
    const canonical =
      typeof window !== "undefined"
        ? `${window.location.origin}${canonicalPath || window.location.pathname}`
        : "";
    const resolvedImage =
      typeof window !== "undefined" && image && !/^https?:\/\//i.test(image)
        ? `${window.location.origin}${image.startsWith("/") ? image : `/${image}`}`
        : image;

    document.documentElement.lang = language;
    document.title = resolvedTitle;
    upsertMeta('meta[name="description"]', { name: "description", content: resolvedDescription });
    upsertMeta('meta[name="robots"]', {
      name: "robots",
      content: noIndex ? "noindex, nofollow" : "index, follow",
    });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: resolvedTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: resolvedDescription });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
    upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: language });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: resolvedImage });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: resolvedTitle });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: resolvedDescription });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: resolvedImage });
    upsertCanonical(canonical);
  }, [resolvedTitle, resolvedDescription, image, language, canonicalPath, noIndex, type]);

  useEffect(() => {
    const items = Array.isArray(structuredData)
      ? structuredData.filter(Boolean)
      : structuredData
        ? [structuredData]
        : [];

    items.forEach((item, index) => upsertJsonLd(index, item));
    for (let index = items.length; index < 8; index += 1) {
      upsertJsonLd(index, null);
    }
  }, [structuredData]);

  return null;
};

export default SEO;
