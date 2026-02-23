import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WhySection from "@/components/WhySection";
import HowItWorks from "@/components/HowItWorks";
import CTASection from "@/components/CTASection";


export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <WhySection />
        <HowItWorks />
        <CTASection />  
      </main>
    </>
  );
}