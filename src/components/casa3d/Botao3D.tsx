import { Box } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { createPortal } from "react-dom";
import type { Brief, Plan } from "../../lib/types";

// o Three.js (≈ 1 MB) só é baixado quando a pessoa abre o 3D
const Casa3D = lazy(() => import("./Casa3D"));

/** Botão "Entrar na casa 3D" + a tela cheia do 3D. Recebe a planta atual: o 3D sempre reflete a planta 2D. */
export function Botao3D({ plan, brief, onEditar, className = "" }: { plan: Plan | null; brief: Brief | null; onEditar?: () => void; className?: string }) {
  const [aberto, setAberto] = useState(false);
  if (!plan) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={`inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 font-display text-sm font-semibold text-ink transition-colors hover:bg-primary-2 ${className}`}
      >
        <Box className="size-4" /> Entrar na casa 3D
      </button>
      {aberto &&
        createPortal(
          <Suspense fallback={<Carregando />}>
            <Casa3D
              plan={plan}
              brief={brief}
              onFechar={() => setAberto(false)}
              onEditar={
                onEditar
                  ? () => {
                      setAberto(false);
                      onEditar();
                    }
                  : undefined
              }
            />
          </Suspense>,
          document.body,
        )}
    </>
  );
}

function Carregando() {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-bg" data-lenis-prevent role="status">
      <div className="text-center">
        <p className="font-display text-lg font-semibold">Construindo sua casa...</p>
        <p className="mt-1 text-sm text-muted">Preparando o 3D</p>
        <div className="mx-auto mt-3 h-1 w-48 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
