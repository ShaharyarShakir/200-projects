import Navbar from "@/components/navbar/navbar";
import Hero from "@/components/hero/Hero";
import Services from "@/components/services/services";
import Work from "@/components/work/work";
import Process from "@/components/process/process";
import Team from "@/components/team/team";
import Contact from "@/components/contact/contact";
import Footer from "@/components/footer/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <Hero />
        <Services />
        <Work />
        <Process />
        <Team />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
