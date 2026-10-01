import { Cta3D, Footer, Header } from "./sections/Chrome";
import { Hero } from "./sections/Hero";
import { Pipeline } from "./sections/Pipeline";
import { Roadmap } from "./sections/Roadmap";
import { Studio } from "./sections/Studio";

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(255,122,61,0.08),transparent_50%)]" />
      <Header />
      <main>
        <Hero />
        <Pipeline />
        <Studio />
        <Roadmap />
        <Cta3D />
      </main>
      <Footer />
    </div>
  );
}
