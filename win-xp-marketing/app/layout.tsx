import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Retro Diagnostic Machine v1.0",
  description: "A theatrical Win98-style marketing analysis experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
