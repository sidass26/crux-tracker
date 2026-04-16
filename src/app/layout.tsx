import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "CrUX Tracker",
  description: "Compare Core Web Vitals across competitor URLs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <nav className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-lg font-semibold text-gray-900">
                CrUX Tracker
              </Link>
              <nav className="hidden sm:flex items-center gap-4 text-sm">
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Groups
                </Link>
                <Link href="/comparisons" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Comparisons
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/comparisons/new"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                + New Comparison
              </Link>
              <Link
                href="/groups/new"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                + Add Group
              </Link>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
