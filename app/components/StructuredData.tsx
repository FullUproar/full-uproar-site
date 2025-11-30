// JSON-LD Structured Data components for SEO

export function OrganizationSchema() {
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Full Uproar Games',
    url: 'https://fulluproar.com',
    logo: 'https://fulluproar.com/logo.png',
    description: 'Game modifiers so chaotic, Fugly approves. Turn any game night into beautiful disaster.',
    sameAs: [
      'https://facebook.com/fulluproar',
      'https://instagram.com/fulluproar',
      'https://twitter.com/fulluproar',
      'https://tiktok.com/@fulluproar',
      'https://youtube.com/@fulluproar',
      'https://pinterest.com/fulluproar',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: 'https://fulluproar.com/contact',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
    />
  );
}

interface ProductSchemaProps {
  name: string;
  description: string;
  image: string;
  priceCents: number;
  slug: string;
  inStock?: boolean;
}

export function ProductSchema({ name, description, image, priceCents, slug, inStock = true }: ProductSchemaProps) {
  const productData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    url: `https://fulluproar.com/games/${slug}`,
    brand: {
      '@type': 'Brand',
      name: 'Full Uproar Games',
    },
    offers: {
      '@type': 'Offer',
      price: (priceCents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Full Uproar Games',
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productData) }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
    />
  );
}

export function WebSiteSchema() {
  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Full Uproar Games',
    url: 'https://fulluproar.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://fulluproar.com/shop?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
    />
  );
}
