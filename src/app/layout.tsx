import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "PyPractical - Python Practical Learning Platform (V1.0)",
  description:
    "Interactive Python mastery platform with 20 levels, 100 problems, Monaco Editor, in-browser isolated execution, automated test evaluation, and milestone assignments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0d1117] text-[#c9d1d9] min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
