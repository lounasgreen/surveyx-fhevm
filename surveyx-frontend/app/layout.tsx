import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "./components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SurveyX - Confidential Survey System",
  description: "Privacy-preserving survey platform powered by FHEVM - Fully Homomorphic Encryption Virtual Machine",
  keywords: ["survey", "privacy", "FHEVM", "blockchain", "encryption", "confidential", "homomorphic"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
            <footer className="border-t border-border bg-card/30 mt-16">
              <div className="container mx-auto px-4 py-8">
                <div className="text-center text-sm text-muted-foreground">
                  <p>© 2024 SurveyX. Privacy-preserving survey platform powered by FHEVM</p>
                  <p className="mt-2">Powered by FHEVM & Zama</p>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
