import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DATA } from "@/data";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopBackdrop } from "@/components/top-backdrop";
import { MotionProvider } from "@/components/motion-provider";
import { SectionIndex } from "@/components/section-index";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(DATA.url),
  title: {
    default: DATA.name,
    template: `%s | ${DATA.name}`,
  },
  description: DATA.description,
  openGraph: {
    title: `${DATA.name}`,
    description: DATA.description,
    url: DATA.url,
    siteName: `${DATA.name}`,
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: {
    title: `${DATA.name}`,
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Dark only: the site is themed on the Grid from TRON: Legacy, which
    // is a world of light in the dark. The class is static, so the first
    // paint is already dark and no script is involved.
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased relative",
          geist.variable,
          geistMono.variable
        )}
      >
        <MotionProvider>
          <TooltipProvider delayDuration={0}>
            <TopBackdrop />
            <div className="relative z-10 max-w-2xl mx-auto py-12 pb-24 sm:py-24 px-6 print:max-w-none print:p-0">
              {children}
              <Footer />
            </div>
            <SectionIndex />
            <Navbar />
          </TooltipProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
