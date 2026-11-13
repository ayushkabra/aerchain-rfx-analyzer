import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aerchain RFx Analyzer — Kill the Quote Spreadsheet",
  description: "Next-generation procurement intelligence: ingest multi-format vendor quotes, extract with confidence & provenance, normalize deterministically, and interrogate via plain English.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
