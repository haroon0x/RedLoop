import type { Metadata } from "next";
import { Inter, Playfair_Display, Space_Grotesk } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  style: ["normal", "italic"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RedLoop - The Art of Security",
  description: "Zero-Cost Adversarial DevSecOps Autopilot. Attack your code before hackers do.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
