import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hermes Command — Cognitive Mission Control",
  description:
    "Premium executive dashboard for monitoring, configuring, and coordinating autonomous AI agent teams with cognitive intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable}`}
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
        }}
      >
        <ThemeProvider>
          <Sidebar />
          <main
            style={{
              flex: 1,
              overflow: "auto",
              background: "var(--bg-root)",
            }}
          >
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
