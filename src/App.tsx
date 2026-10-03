import { MotionConfig } from "framer-motion";
import { Intro } from "./components/Intro";
import { Mascote } from "./components/Mascote";
import { SmoothScroll } from "./components/SmoothScroll";
import { Footer, Header, ScrollProgress } from "./sections/Chrome";
import { Builder } from "./sections/Builder";
import { Hero } from "./sections/Hero";
import { Manifesto } from "./sections/Manifesto";
import { Pipeline } from "./sections/Pipeline";
import { Roadmap } from "./sections/Roadmap";
import { Studio } from "./sections/Studio";

export default function App() {
  return (
    // reducedMotion="user": quem pediu menos movimento no sistema vê tudo sem animação
    <MotionConfig reducedMotion="user">
      <SmoothScroll />
      <Intro />
      <ScrollProgress />
      <div className="min-h-screen overflow-x-clip">
        <Header />
        <main>
          <Hero />
          <Manifesto />
          <Pipeline />
          <Studio />
          <Builder />
          <Roadmap />
        </main>
        <Footer />
      </div>
      <Mascote />
    </MotionConfig>
  );
}
