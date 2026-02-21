import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AnimatedBackground from "@/components/AnimatedBackground";

export const metadata: Metadata = {
  title: "TrueHire — AI Interview Intelligence | DataVex",
  description: "Stop interviewing candidates. Start uncovering them. AI-powered interview intelligence for enterprise hiring teams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AnimatedBackground />
        <Navbar />
        <main style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
