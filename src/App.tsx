import { Footer, Header } from "./sections/Chrome";
import { Hero } from "./sections/Hero";
import { Pipeline } from "./sections/Pipeline";
import { Roadmap } from "./sections/Roadmap";
import { Studio } from "./sections/Studio";

export default function App() {
  return (
    <div className="min-h-screen overflow-x-clip">
      <Header />
      <main>
        <Hero />
        <Pipeline />
        <Studio />
        <Roadmap />
      </main>
      <Footer />
    </div>
  );
}
