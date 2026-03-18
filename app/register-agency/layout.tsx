"use client";
import BackButton from "@/components/back-button";
import NavBar from "@/components/navbar";
import Footer from "@/parts/landingPage/footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-muted/40">
      {/* <NavBar /> */}
      <header className="w-full">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 pt-4 sm:px-6 sm:pt-6">
          <BackButton
            size="sm"
            className="border-none bg-transparent px-0 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground"
          />
        </div>
      </header>
      <main className="flex items-center justify-center px-4 pb-8 pt-2">
        {children}
      </main>
      {/* <Footer /> */}
    </div>
  );
}
