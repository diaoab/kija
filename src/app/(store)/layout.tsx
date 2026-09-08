import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {children}
      </main>
      <Footer />
    </>
  );
}
