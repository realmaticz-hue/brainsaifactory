import type { BusinessData } from '../businessExtractor';

function titleCase(input: string): string {
  return input
    .replace(/[-_]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(' ');
}

function extractBrand(url: string) {
  try {
    const parsed = new URL(
      url.startsWith('http') ? url : `https://${url}`
    );

    const hostname = parsed.hostname
      .replace(/^www\./, '');

    const root = hostname.split('.')[0];

    return {
      hostname,
      pathname: parsed.pathname,
      brand: titleCase(root),
    };
  } catch {
    return {
      hostname: url,
      pathname: '/',
      brand: 'Local Business',
    };
  }
}

export function buildDomainStub(
  url: string
): BusinessData {
  const { brand, hostname, pathname } =
    extractBrand(url);

  const context =
    pathname !== '/' && pathname.length > 1
      ? pathname
        .replace(/\//g, ' ')
        .replace(/[-_]/g, ' ')
      : 'business services';

  const keywords = [
    brand,
    hostname,
    context,
    'customer experience',
    'professional solutions',
    'local expertise',
  ];

  const posts7sec = [
    {
      title: `Discover ${brand}`,
      content: `${brand} provides solutions focused on ${context}. Learn what makes their approach unique and why customers continue to trust their services.`,
    },
    {
      title: `Why Customers Choose ${brand}`,
      content: `Explore the benefits, expertise, and value that help ${brand} stand out in a competitive market.`,
    },
    {
      title: `${brand} Insights`,
      content: `Key information and highlights gathered from ${hostname}.`,
    },
  ];

  const posts30sec = [
    {
      title: `The Story Behind ${brand}`,
      content: `${brand} has established an online presence through ${hostname}. This article explores their services, customer focus, and industry positioning.`,
    },
    {
      title: `${brand} Service Overview`,
      content: `An overview of offerings related to ${context}, including customer benefits, operational strengths, and market opportunities.`,
    },
    {
      title: `Understanding ${brand}'s Approach`,
      content: `A deeper look at how ${brand} delivers value through expertise, innovation, and customer engagement.`,
    },
  ];

  return {
    businessName: brand,
    website: hostname,
    description: `${brand} operates through ${hostname} with a focus on ${context}.`,
    keywords,
    keyPoints: [
      `${brand} online presence`,
      `Focus on ${context}`,
      `Customer-centered solutions`,
      `Industry expertise`,
    ],
    headings: [
      `About ${brand}`,
      `Services`,
      `Customer Benefits`,
      `Industry Insights`,
    ],
    content: `This is a generated summary for ${brand} based on the URL domain. It provides an overview of the business, its focus on ${context}, and key information that can be used for further content generation.`,
    posts7sec,
    posts30sec,
  };
}