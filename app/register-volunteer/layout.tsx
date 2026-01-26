"use client";
import BackButton from "@/components/back-button";
import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* <NavBar /> */}
      <div className="absolute top-10 left-10">
        <BackButton fallbackHref="/"/>
      </div>
      {children}
      {/* <Footer /> */}
    </div>
  );
}
