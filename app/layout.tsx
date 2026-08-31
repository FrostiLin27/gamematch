import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game Match｜遊戲火柴",
  description: "點亮一款適合現在的遊戲，開啟你的下一段旅程。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
