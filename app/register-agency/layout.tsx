"use client"
import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";

export default function Layout({
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
