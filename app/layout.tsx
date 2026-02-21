import type { Metadata, Viewport } from "next";
import { Lora, Caveat, Courier_Prime, Forum } from "next/font/google";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hand",
  display: "swap",
});

const forum = Forum({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-page",
  display: "swap",
});

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  description: "Sustenance for a singular person.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(JSON.parse(localStorage.getItem('neko-kuro'))){document.documentElement.dataset.theme='dark'}}catch{}`,
          }}
        />
      </head>
      <body
        className={`${lora.variable} ${caveat.variable} ${courierPrime.variable} ${forum.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
