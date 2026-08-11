import type { Metadata } from "next";
import { Archivo, Bricolage_Grotesque, Source_Sans_3 } from "next/font/google";
import "./globals.css";

/* Primary type — all main UI text (nav, headings, body, buttons). */
const archivo = Archivo({
  variable: "--font-archivo",
  weight: "variable",
  subsets: ["latin"],
});

/* Secondary type — labels, eyebrows, pager counts, captions. */
const sourceSans = Source_Sans_3({
  variable: "--font-source-sans-3",
  weight: "variable",
  subsets: ["latin"],
});

/* Wordmark display face — "eventclassics" reads in Bricolage Grotesque
 * at 800 (hero wordmark + sticky header state share the same element). */
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  weight: "variable",
  axes: ["opsz", "wdth"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "eventclassics — Stagecraft for the brands that built the room",
  description:
    "We design change-making website experiences that finally reflect what you've actually built.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${archivo.variable} ${sourceSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-foreground">
        {children}
      </body>
    </html>
  );
}