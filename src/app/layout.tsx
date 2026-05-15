import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Analizador de Cuellos de Botella",
  description: "Analiza lotes de panadería y sugiere mejoras operativas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
