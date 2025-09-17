import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CustomThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "KI Model Arena",
  description: "Compare AI models side-by-side with real-time streaming and cost analysis",
  keywords: "AI, machine learning, model comparison, OpenAI, Anthropic, Claude, GPT",
  authors: [{ name: "KI Meetup" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <CustomThemeProvider>
          {children}
        </CustomThemeProvider>
      </body>
    </html>
  );
}
