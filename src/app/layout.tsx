import type { Metadata } from "next";
import { Bricolage_Grotesque, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import { getSettings } from "@/lib/settings";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", weight: ["600", "800"] });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });
const jb = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jb" });

export const metadata: Metadata = { title: "GRINDLOG", description: "Daily competitive-programming tracker" };
export const dynamic = "force-dynamic";

const themeScript = `try{const t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const onboarded = !!getSettings();
  return (
    <html lang="en" suppressHydrationWarning className={`${bricolage.variable} ${grotesk.variable} ${jb.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans min-h-screen antialiased">
        {onboarded && <Nav />}
        <main className={onboarded ? "mx-auto max-w-6xl px-4 pb-20 pt-4 md:pt-8" : ""}>{children}</main>
      </body>
    </html>
  );
}
