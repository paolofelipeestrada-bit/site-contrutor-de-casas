import { MotionConfig } from "framer-motion";
import { Footer, Header } from "./sections/Chrome";
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
    </MotionConfig>
  );
}
