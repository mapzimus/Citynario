import type { Metadata } from "next";
import type { ReactNode } from "react";

import "maplibre-gl/dist/maplibre-gl.css";
import "./styles.css";

export const metadata: Metadata = {
  title: "Citynario — Lynn Scenario Studio",
  description: "Explore municipal planning scenarios with transparent assumptions.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
