import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const siteUrl = "https://mapzimus.github.io/Citynario/";
const imageUrl = "https://mapzimus.github.io/Citynario/og.png";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Citynario · Explore Lynn’s future",
  description: "Compare transparent, evidence-based housing scenarios for Lynn, Massachusetts.",
  alternates: { canonical: siteUrl },
  openGraph: {
    title: "Citynario · Explore Lynn’s future",
    description: "A transparent city sandbox for comparing local planning choices.",
    type: "website",
    url: siteUrl,
    images: [{ url: imageUrl, width: 1733, height: 909, alt: "Citynario — transparent city scenario planning" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Citynario · Explore Lynn’s future",
    description: "A transparent city sandbox for comparing local planning choices.",
    images: [imageUrl],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
