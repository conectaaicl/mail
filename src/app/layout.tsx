import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"], 
  weight: ['400', '500', '600', '700', '800'] 
});

export const metadata: Metadata = {
  title: "MailSaaS - Ultra Pro Dashboard",
  description: "Manage your targeted emails in style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
<body className={`${jakarta.className} antialiased bg-[#0A0C10] text-zinc-100`}>
        {children}
      </body>
    </html>
  );
}
