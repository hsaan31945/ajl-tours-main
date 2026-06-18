import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const SITE_URL = "https://ajltour.com";
const DEFAULT_IMAGE = `${SITE_URL}/assets/images/optimized/hero4-1600.webp`;

const routes = [
  {
    path: "/",
    title: "AJL Tours | Private Switzerland Tours",
    description: "Book premium private Switzerland tours with luxury vehicles, flexible itineraries, local guides, and seamless pickup.",
    heading: "Private Switzerland tours, tailored around you",
  },
  {
    path: "/tours",
    title: "Private Switzerland Tours | Luxury Day Tours | AJL Tours",
    description: "Browse private Switzerland tours to Lucerne, Interlaken, Zermatt, Rhine Falls, Titlis, and more.",
    heading: "Private Switzerland tours",
  },
  {
    path: "/destinations",
    title: "Switzerland Tour Destinations | AJL Tours",
    description: "Discover private day tours and tailored travel experiences across Switzerland's most memorable destinations.",
    heading: "Explore Switzerland destinations",
  },
  {
    path: "/switzerland",
    title: "Private Switzerland Day Tours from Zurich | AJL Tours",
    description: "Explore private Switzerland day tours from Zurich with local guides, luxury vehicles, and flexible itineraries.",
    heading: "Private Switzerland day tours",
  },
  {
    path: "/sri-lanka",
    title: "Sri Lanka Private Tours | AJL Tours",
    description: "Plan a custom Sri Lanka private tour with beaches, culture, wildlife, family travel, and personal itinerary support.",
    heading: "Private Sri Lanka tours",
    image: `${SITE_URL}/assets/images/optimized/hero6-1600.webp`,
  },
  {
    path: "/about",
    title: "About AJL Tours | Our Story & Local Team",
    description: "Meet AJL Tours, a Switzerland-based travel team creating private tours with local knowledge, premium vehicles, and personal service.",
    heading: "About AJL Tours",
  },
  {
    path: "/contact",
    title: "Contact AJL Tours | Get a Private Tour Quote",
    description: "Contact AJL Tours for a private Switzerland tour quote, custom itinerary, luxury transfer, or booking support.",
    heading: "Plan your private tour",
  },
  {
    path: "/blogs",
    title: "Switzerland Travel Blog | Tips & Guides | AJL Tours",
    description: "Read Switzerland travel guides, destination inspiration, and private tour tips from AJL Tours.",
    heading: "Switzerland travel guides",
  },
  {
    path: "/blogs/top-10-places-to-visit-in-switzerland",
    title: "Top 10 Places to Visit in Switzerland | AJL Tours",
    description: "Discover ten outstanding places to visit in Switzerland, from alpine villages and lakes to luxury city escapes.",
    heading: "Top 10 places to visit in Switzerland",
    type: "article",
  },
  {
    path: "/blogs/complete-guide-to-titlis-engelberg-and-lucerne",
    title: "Titlis, Engelberg & Lucerne Travel Guide | AJL Tours",
    description: "Plan a private journey to Mount Titlis, Engelberg, and Lucerne with this practical Central Switzerland guide.",
    heading: "A complete guide to Titlis, Engelberg and Lucerne",
    type: "article",
  },
  {
    path: "/blogs/rhine-falls-to-black-forest-day-trip",
    title: "Rhine Falls to Black Forest Day Trip Guide | AJL Tours",
    description: "Explore Rhine Falls, Lake Titisee, and the Black Forest on a scenic private day trip from Switzerland.",
    heading: "Rhine Falls to the Black Forest",
    type: "article",
  },
  {
    path: "/blogs/titlis-and-central-switzerland-guide",
    title: "Titlis & Central Switzerland Guide | AJL Tours",
    description: "Discover Mount Titlis, Engelberg, Lucerne, and the highlights of Central Switzerland in this detailed guide.",
    heading: "Titlis and Central Switzerland",
    type: "article",
  },
  ...[
    ["lucerne-private-tour", "Lucerne Private Tour"],
    ["interlaken-private-tour", "Interlaken Private Tour"],
    ["zermatt-private-tour", "Zermatt Private Tour"],
    ["4-country-tours", "Four-Country Private Tour"],
    ["grindelwald-tours", "Grindelwald Private Tour"],
    ["crashlanding-tours", "Crash Landing on You Private Tour"],
    ["from-zurich-private-st-gallen-and-appenzell-day-tour", "St. Gallen & Appenzell Private Day Tour"],
    ["zurich-to-rhine-falls-unforgettable-private-day-trip", "Rhine Falls Private Day Trip from Zurich"],
    ["from-zurich-full-day-private-tour-basel-and-colmar", "Basel & Colmar Private Day Tour from Zurich"],
  ].map(([slug, heading]) => ({
    path: `/tours/${slug}`,
    title: `${heading} | AJL Tours`,
    description: `Explore the ${heading} with AJL Tours, including a private vehicle, flexible itinerary, and personal travel support.`,
    heading,
  })),
];

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const replaceTag = (html, pattern, replacement) => (
  pattern.test(html) ? html.replace(pattern, replacement) : html.replace("</head>", `${replacement}\n</head>`)
);

const renderRoute = (template, route) => {
  const canonical = `${SITE_URL}${route.path === "/" ? "/" : route.path}`;
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const heading = escapeHtml(route.heading);
  const type = route.type || "website";
  const image = route.image || DEFAULT_IMAGE;

  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  html = replaceTag(html, /<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${description}" />`);
  html = replaceTag(html, /<meta\s+name="robots"[^>]*>/i, '<meta name="robots" content="index, follow" />');
  html = replaceTag(html, /<meta\s+property="og:type"[^>]*>/i, `<meta property="og:type" content="${type}" />`);
  html = replaceTag(html, /<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${title}" />`);
  html = replaceTag(html, /<meta\s+property="og:description"[^>]*>/i, `<meta property="og:description" content="${description}" />`);
  html = replaceTag(html, /<meta\s+property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonical}" />`);
  html = replaceTag(html, /<meta\s+property="og:image"[^>]*>/i, `<meta property="og:image" content="${image}" />`);
  html = replaceTag(html, /<meta\s+name="twitter:card"[^>]*>/i, '<meta name="twitter:card" content="summary_large_image" />');
  html = replaceTag(html, /<meta\s+name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${title}" />`);
  html = replaceTag(html, /<meta\s+name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${description}" />`);
  html = replaceTag(html, /<meta\s+name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${image}" />`);
  html = replaceTag(html, /<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}" />`);

  return html.replace(
    '<div id="root"></div>',
    `<div id="root"><main data-static-seo="true"><h1>${heading}</h1><p>${description}</p><p><a href="${SITE_URL}/tours">Browse private tours</a></p></main></div>`,
  );
};

const distDir = new URL("../dist/", import.meta.url);
const template = await readFile(new URL("index.html", distDir), "utf8");

for (const route of routes) {
  const relativePath = route.path === "/" ? "index.html" : join(route.path.slice(1), "index.html");
  const outputPath = new URL(relativePath, distDir);
  await mkdir(dirname(outputPath.pathname), { recursive: true });
  await writeFile(outputPath, renderRoute(template, route), "utf8");
}

console.log(`Pre-rendered ${routes.length} crawlable routes.`);
