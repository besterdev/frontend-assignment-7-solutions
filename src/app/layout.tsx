import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Freshsort — Back in five",
  description:
    "A playful auto-return todo list. Sort fruits and vegetables and watch them return in five seconds.",
};

const RootLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => (
  <html lang="en">
    <body>{children}</body>
  </html>
);

export default RootLayout;
