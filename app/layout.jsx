import { Space_Grotesk, Manrope } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata = {
  title: "Pocket Image Lab",
  description: "繁體中文預設的手機優先圖片生成介面。"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
