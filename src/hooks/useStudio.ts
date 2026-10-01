import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_FORM, type FormValues } from "../lib/brief/form";
import { interpret, type BriefSource } from "../lib/brief/interpret";
import { ROOM_INFO } from "../lib/catalog";
import { dragToAreas, type SplitHandle } from "../lib/layout/slicing";
import {
  preferredProfile,
  recordChoice,
  learnedHints,
  loadLearning,
  recordAreaEdit,
  recordGeneration,
  recordRating,
  saveLearning,
  createLearningState,
  type LearningState,
} from "../lib/learning/engine";
import { parseCommand } from "../lib/plan/commands";
import { EDICAO_VAZIA, type EdicaoEletrica } from "../lib/plan/electrical";
import { relayout } from "../lib/pipeline";
import { gerarOpcoes, type Opcao } from "../lib/plan/profiles";
import type { Brief, LayoutStrategy, Plan } from "../lib/types";

export type Phase = "idle" | "interpretando" | "estruturando" | "distribuindo" | "desenhando" | "pronto";

interface Result {
  brief: Brief;
  fonte: BriefSource;
  aviso?: string;
  /** as 3 opções (Equilibrada, Área social, Privacidade), cada uma com variações */
  opcoes: Opcao[];
  /** opção escolhida */
  escolha: number;
  /** variação dentro da opção escolhida ("Outra opção") */
  index: number;
  texto: string;
}

/** Tudo o que o "Desfazer" consegue voltar. */
interface Snapshot {
  overrides: Record<string, number>;
  strategyOverride: LayoutStrategy | null;
  eletrica: EdicaoEletrica;
  nomes: Record<string, string>;
}

/** Passo do arraste de paredes (m): 5 cm, como numa trena. */
export const SNAP = 0.05;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useStudio() {
  const [form, setForm] = useState<FormValues>(DEFAULT_FORM);
  const [learning, setLearning] = useState<LearningState>(() => (typeof window === "undefined" ? createLearningState() : loadLearning()));
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [strategyOverride, setStrategyOverride] = useState<LayoutStrategy | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [rated, setRated] = useState<"up" | "down" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const dragStart = useRef<Record<string, number> | null>(null);
  const [eletrica, setEletrica] = useState<EdicaoEletrica>(EDICAO_VAZIA);
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [past, setPast] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const snap = (): Snapshot => ({ overrides, strategyOverride, eletrica, nomes });
  /** Guarda o estado atual antes de uma mudança (para poder desfazer). */
  const commit = () => {
    setPast((p) => [...p.slice(-49), snap()]);
    setFuture([]);
  };
  const restore = (x: Snapshot) => {
    setOverrides(x.overrides);
    setStrategyOverride(x.strategyOverride);
    setEletrica(x.eletrica);
    setNomes(x.nomes);
    setAnimate(false);
  };
  const undo = () => {
    const prev = past.at(-1);
    if (!prev) return;
    setFuture((f) => [snap(), ...f]);
    setPast((p) => p.slice(0, -1));
    restore(prev);
    setMessage("Desfeito.");
  };
  const redo = () => {
    const next = future[0];
    if (!next) return;
    setPast((p) => [...p, snap()]);
    setFuture((f) => f.slice(1));
    restore(next);
    setMessage("Refeito.");
  };
  /** Começa do zero o histórico e as edições (nova planta). */
  const clearEdits = () => {
    setOverrides({});
    setStrategyOverride(null);
    setEletrica(EDICAO_VAZIA);
    setNomes({});
    setPast([]);
    setFuture([]);
  };

  useEffect(() => saveLearning(learning), [learning]);

  const opcao = result ? result.opcoes[result.escolha] : null;
  const plan: Plan | null = useMemo(() => {
    if (!result || !opcao) return null;
    const base = opcao.plans[result.index];
    const p = !strategyOverride && Object.keys(overrides).length === 0 ? base : relayout(result.brief, strategyOverride ?? base.strategy, learning, overrides, opcao.perfil.multiplicadores);
    if (Object.keys(nomes).length === 0) return p;
    return { ...p, rooms: p.rooms.map((r) => (nomes[r.id] ? { ...r, nome: nomes[r.id] } : r)) };
    // o aprendizado só muda a planta quando o usuário gera de novo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, overrides, strategyOverride, nomes]);

  const generate = useCallback(async () => {
    setPhase("interpretando");
    setSelectedId(null);
    setMessage(null);
    setRated(null);
    const exemplos = learning.examples.map((e) => ({ texto: e.texto, brief: e.brief }));
    const { brief, fonte, aviso } = await interpret(form, { hints: learnedHints(learning), exemplos });
    setPhase("estruturando");
    await wait(700);
    setPhase("distribuindo");
    await wait(50);
    const opcoes = gerarOpcoes(brief, learning);
    const preferido = opcoes.findIndex((o) => o.perfil.id === preferredProfile(learning));
    await wait(650);
    setPhase("desenhando");
    clearEdits();
    setAnimate(true);
    setResult({ brief, fonte, aviso, opcoes, escolha: Math.max(0, preferido), index: 0, texto: form.descricao });
    setLearning((l) => recordGeneration(l, brief));
    await wait(1600);
    setPhase("pronto");
  }, [form, learning]);

  const rebuild = useCallback(
    (brief: Brief, keepStrategy = true) => {
      if (!result) return;
      const opcoes = gerarOpcoes(brief, learning);
      setResult({ ...result, brief, opcoes, index: 0 });
      clearEdits();
      if (!keepStrategy) setStrategyOverride(null);
      setAnimate(true);
    },
    [result, learning],
  );

  /** "Escolher esta": troca de opção e ensina ao sistema qual perfil a pessoa prefere. */
  const escolher = useCallback(
    (i: number) => {
      if (!result) return;
      setResult({ ...result, escolha: i, index: 0 });
      clearEdits();
      setSelectedId(null);
      setRated(null);
      setAnimate(true);
      const perfil = result.opcoes[i].perfil;
      setLearning((l) => recordChoice(l, perfil.id, perfil.nome));
      setMessage(`Opção "${perfil.nome}" escolhida. Agora você pode editar os cômodos.`);
    },
    [result],
  );

  const nextOption = useCallback(() => {
    if (!result) return;
    const total = result.opcoes[result.escolha].plans.length;
    setResult({ ...result, index: (result.index + 1) % total });
    clearEdits();
    setSelectedId(null);
    setRated(null);
    setAnimate(true);
  }, [result]);

  const mirror = useCallback(() => {
    if (!plan) return;
    commit();
    setEletrica(EDICAO_VAZIA); // pontos elétricos dependem do lado das portas
    setStrategyOverride({ ...plan.strategy, mirror: !plan.strategy.mirror });
    setAnimate(true);
  }, [plan]);

  const setRoomArea = useCallback(
    (roomId: string, area: number) => {
      if (!plan) return;
      const room = plan.rooms.find((r) => r.id === roomId);
      if (!room || room.tipo === "circulacao") return;
      const info = ROOM_INFO[room.tipo];
      const current = room.w * room.h;
      const next = Math.min(info.maxArea * 1.5, Math.max(info.minArea, area));
      commit();
      setAnimate(false);
      setOverrides((o) => ({ ...o, [roomId]: next }));
      setLearning((l) => recordAreaEdit(l, room.tipo, current, next));
      setMessage(`${room.nome}: ${current.toFixed(1)} → ${next.toFixed(1)} m². A IA anotou essa preferência.`);
    },
    [plan],
  );

  const onDrag = useCallback(
    (h: SplitHandle, pos: number, phase: "move" | "end") => {
      if (!plan) return;
      const current = Object.fromEntries(plan.rooms.map((r) => [r.id, r.w * r.h]));
      if (!dragStart.current) {
        dragStart.current = current;
        commit();
      }
      setAnimate(false);
      const next = dragToAreas(h, Math.round(pos / SNAP) * SNAP, current);
      delete next["circulacao-1"];
      setOverrides((o) => ({ ...o, ...next }));
      if (phase === "end") {
        const start = dragStart.current;
        dragStart.current = null;
        setLearning((l) => {
          let s = l;
          for (const [id, area] of Object.entries(next)) {
            const room = plan.rooms.find((r) => r.id === id);
            if (room && Math.abs(area - start[id]) > 0.3) s = recordAreaEdit(s, room.tipo, start[id], area);
          }
          return s;
        });
        setMessage("Parede movida. Áreas recalculadas e preferência registrada.");
      }
    },
    [plan],
  );

  const runCommand = useCallback(
    (text: string) => {
      if (!plan || !result) return;
      const cmd = parseCommand(text, plan.rooms);
      switch (cmd.kind) {
        case "resize": {
          const room = plan.rooms.find((r) => r.id === cmd.roomId)!;
          setSelectedId(room.id);
          setRoomArea(room.id, room.w * room.h + cmd.delta);
          break;
        }
        case "set":
          setSelectedId(cmd.roomId);
          setRoomArea(cmd.roomId, cmd.area);
          break;
        case "mirror":
          mirror();
          setMessage("Planta espelhada.");
          break;
        case "next":
          nextOption();
          setMessage("Mostrando outra opção de distribuição.");
          break;
        case "add": {
          const brief: Brief = {
            ...result.brief,
            ambientes: [...result.brief.ambientes, { tipo: cmd.tipo, area: null, nome: null }],
            carro: cmd.tipo === "garagem" ? (result.brief.carro ?? { ...form.carro }) : result.brief.carro,
          };
          rebuild(brief);
          setMessage(`${ROOM_INFO[cmd.tipo].label} adicionado(a). Planta redistribuída.`);
          break;
        }
        case "remove": {
          const idx = result.brief.ambientes.map((a) => a.tipo).lastIndexOf(cmd.tipo);
          if (idx < 0) {
            setMessage(`Não há ${ROOM_INFO[cmd.tipo].label.toLowerCase()} para remover.`);
            break;
          }
          if (cmd.tipo === "sala" || cmd.tipo === "cozinha") {
            setMessage("Sala e cozinha são obrigatórias.");
            break;
          }
          const ambientes = result.brief.ambientes.filter((_, i) => i !== idx);
          rebuild({ ...result.brief, ambientes, carro: cmd.tipo === "garagem" ? null : result.brief.carro });
          setMessage(`${ROOM_INFO[cmd.tipo].label} removido(a).`);
          break;
        }
        default:
          setMessage(cmd.reason);
      }
    },
    [plan, result, form.carro, setRoomArea, mirror, nextOption, rebuild],
  );

  const rate = useCallback(
    (up: boolean) => {
      if (!plan || !result) return;
      setLearning((l) => recordRating(l, up, plan.strategy, result.brief, result.texto));
      setRated(up ? "up" : "down");
      setMessage(up ? "Valeu! Essa combinação vai pesar mais nas próximas plantas." : "Anotado. Vou priorizar outras distribuições — veja a próxima opção.");
    },
    [plan, result],
  );

  const resetLearning = useCallback(() => {
    setLearning(createLearningState());
    setMessage("Aprendizado zerado.");
  }, []);

  const resetEdits = useCallback(() => {
    commit();
    setOverrides({});
    setStrategyOverride(null);
    setEletrica(EDICAO_VAZIA);
    setNomes({});
    setAnimate(true);
    setMessage("Planta voltou ao original (dá para desfazer).");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrides, strategyOverride, eletrica, nomes]);

  /** Renomeia um cômodo ("Quarto 1" → "Quarto da Ana"). */
  const renameRoom = (id: string, nome: string) => {
    if (!nome.trim()) return;
    commit();
    setNomes((n) => ({ ...n, [id]: nome.trim() }));
  };

  /** Altera a fiação (mover, acrescentar, apagar, trocar circuito). */
  const editEletrica = (fn: (e: EdicaoEletrica) => EdicaoEletrica, registrar = true) => {
    if (registrar) commit();
    setEletrica((e) => fn(e));
  };

  return {
    form,
    setForm,
    phase,
    result,
    opcao,
    nota: result && opcao ? (Object.keys(overrides).length || strategyOverride ? plan?.score ?? 0 : opcao.notas[result.index]) : 0,
    escolher,
    plan,
    overrides,
    eletrica,
    editEletrica,
    renameRoom,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    selectedId,
    setSelectedId,
    editMode,
    setEditMode,
    animate,
    rated,
    message,
    setMessage,
    learning,
    generate,
    nextOption,
    mirror,
    setRoomArea,
    onDrag,
    runCommand,
    rate,
    resetLearning,
    resetEdits,
  };
}

export type Studio = ReturnType<typeof useStudio>;
