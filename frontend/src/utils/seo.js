export const SITE_URL = "https://ajltour.com";

export const absoluteUrl = (path = "/") => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export const createBreadcrumbJsonLd = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "AJL Tours",
  url: SITE_URL,
  logo: absoluteUrl("/logoTravel-300.png"),
  image: absoluteUrl("/assets/images/optimized/hero4-1600.webp"),
  description:
    "AJL Tours provides private Switzerland tours, luxury transfers, custom itineraries, and premium guided travel experiences.",
  telephone: "+41 78 207 89 02",
  email: "hey@ajltour.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Plattenstrasse 7",
    addressLocality: "Opfikon",
    postalCode: "8152",
    addressCountry: "CH",
  },
  areaServed: ["Switzerland", "Sri Lanka"],
  sameAs: ["https://www.instagram.com/ajltransfer"],
};
