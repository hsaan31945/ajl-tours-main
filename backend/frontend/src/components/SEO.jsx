import { useEffect } from "react";

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

const SEO = ({ title = DEFAULT_TITLE, description = DEFAULT_DESCRIPTION, image = "/logoTravel.png" }) => {
  useEffect(() => {
    const canonical =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}`
        : "";
    const resolvedImage =
      typeof window !== "undefined" && image && !/^https?:\/\//i.test(image)
        ? `${window.location.origin}${image.startsWith("/") ? image : `/${image}`}`
        : image;

    document.title = title;
    upsertMeta('meta[name="description"]', { name: "description", content: description });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: resolvedImage });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    upsertCanonical(canonical);
  }, [title, description, image]);

  return null;
};

export default SEO;
