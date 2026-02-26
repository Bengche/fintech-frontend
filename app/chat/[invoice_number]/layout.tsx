import type { Metadata } from "next";
import type { ReactNode } from "react";
import Navbar from "../../components/Navbar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
