import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;
  return {
    title: "Citynario · Explore Lynn’s future",
    description: "Compare transparent, evidence-based housing scenarios for Lynn, Massachusetts.",
    openGraph: {
      title: "Citynario · Explore Lynn’s future",
      description: "A transparent city sandbox for comparing local planning choices.",
      type: "website",
      images: [{ url: imageUrl, width: 1733, height: 909, alt: "Citynario — transparent city scenario planning" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Citynario · Explore Lynn’s future",
      description: "A transparent city sandbox for comparing local planning choices.",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
