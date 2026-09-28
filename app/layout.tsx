import type { Metadata, Viewport } from "next";
import { Source_Serif_4, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Redline — AI Resume Coach & ATS Optimizer",
  description:
    "Your resume marked up before it costs you the interview. Line-by-line ATS match scoring, quantifiable metric rewrites, tailored cover letters, and live voice mock interviews.",
  keywords: [
    "ATS resume checker",
    "resume builder",
    "AI interview coach",
    "cover letter generator",
    "Google XYZ resume formula",
    "mock interview practice",
  ],
  authors: [{ name: "Redline Team" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#F6F5F1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${mono.variable} h-full antialiased selection:bg-[#D7FF3E] selection:text-[#14171F]`}
    >
      <body className="min-h-full flex flex-col bg-[#F6F5F1] text-[#14171F] font-[family-name:var(--font-sans)]">
        {children}
      </body>
    </html>
  );
}
