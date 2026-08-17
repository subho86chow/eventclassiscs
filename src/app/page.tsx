import { Brands } from "@/components/Brands";
import { FAQ } from "@/components/FAQ";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";
import { Gap } from "@/components/Gap";
import { KeepScrolling } from "@/components/KeepScrolling";
import { MonologHero } from "@/components/MonologHero";
import { Services } from "@/components/Services";
import { Statement } from "@/components/Statement";
import { SuccessStories } from "@/components/SuccessStories";

export default function Home() {
  return (
    <>
      <MonologHero />
      <Brands />
      <Statement />
      <Gap />
      <KeepScrolling />
      <SuccessStories />
      <Services />
      <FAQ />
      <FinalCta />
      <Footer />
    </>
  );
}