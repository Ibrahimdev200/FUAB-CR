import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "School Course Registration & Results Management System",
  description: "Comprehensive portal for Students, Lecturers, and Management",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
