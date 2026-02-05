import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    name: "Full Uproar Admin",
    short_name: "FU Admin",
    description: "Full Uproar order fulfillment and admin tools",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#f97316",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
}
