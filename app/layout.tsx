import type { Metadata } from "next";
import { Barlow, Bebas_Neue } from "next/font/google";
import "./globals.css";

const barlow = Barlow({ subsets:["latin"], weight:["400","500","600","700","900"], variable:"--font-barlow" });
const bebas = Bebas_Neue({ subsets:["latin"], weight:"400", variable:"--font-bebas" });

export const metadata: Metadata = {
  title: "Radar Canarinho",
  description: "Inteligência digital da Seleção Brasileira no Instagram."
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${barlow.variable} ${bebas.variable} font-sans`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}