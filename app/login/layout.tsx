"use client"
import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <NavBar />
      {children}
      <Footer />
    </div>
  );
}
