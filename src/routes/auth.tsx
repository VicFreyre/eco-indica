import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Building2, Eye, EyeOff, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl, isValidCPF, maskCPF, onlyDigits } from "@/lib/domain";
import { useBonificacaoConfig } from "@/lib/bonificacao";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — ECO INDICA" },
      {
        name: "description",
        content: "Acesse a plataforma de indicações do Instituto Experiência do Cliente.",
      },
      { property: "og:title", content: "Entrar — ECO INDICA" },
      { property: "og:description", content: "Acesse a plataforma de indicações do IEC." },
    ],
  }),
  component: AuthPage,
});

const INPUT =
  "h-12 rounded-xl border-black/15 bg-white text-black shadow-sm transition-all duration-200 placeholder:text-black/30 hover:border-black/30 focus-visible:border-[#FFC400] focus-visible:ring-4 focus-visible:ring-[#FFC400]/30";

const localStyles = `
@keyframes iec-rise {
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes iec-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes iec-slide-left {
  from { opacity: 0; transform: translateX(-24px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes iec-pop {
  0%   { opacity: 0; transform: translateY(28px) scale(.92) rotate(0deg); }
  100% { opacity: 1; transform: translateY(0) scale(1) rotate(var(--r, 0deg)); }
}
@keyframes iec-bob {
  0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
  50%      { transform: translateY(-8px) rotate(var(--r, 0deg)); }
}
@keyframes iec-draw {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
@keyframes iec-grid-pan {
  from { background-position: 0 0; }
  to   { background-position: 48px 48px; }
}
@keyframes iec-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
@keyframes iec-field-in {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes iec-shine {
  from { transform: translateX(-120%) skewX(-20deg); }
  to   { transform: translateX(220%) skewX(-20deg); }
}
@keyframes iec-pulse-dot {
  0%   { box-shadow: 0 0 0 0 rgba(255,196,0,.6); }
  100% { box-shadow: 0 0 0 10px rgba(255,196,0,0); }
}

.iec-rise       { animation: iec-rise 700ms cubic-bezier(.2,.7,.2,1) both; }
.iec-fade       { animation: iec-fade 900ms ease-out both; }
.iec-slide-left { animation: iec-slide-left 700ms cubic-bezier(.2,.7,.2,1) both; }
.iec-draw       { transform-origin: left; animation: iec-draw 800ms cubic-bezier(.2,.7,.2,1) both; }
.iec-shake      { animation: iec-shake 420ms ease-in-out; }
.iec-field-in   { animation: iec-field-in 320ms ease-out both; }

.iec-card {
  animation:
    iec-pop 800ms cubic-bezier(.2,.8,.2,1) both,
    iec-bob 5s ease-in-out 1.2s infinite;
}

.iec-grid {
  background-image:
    linear-gradient(to right, rgba(255,255,255,.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,.05) 1px, transparent 1px);
  background-size: 48px 48px;
  -webkit-mask-image: radial-gradient(ellipse at 30% 40%, #000 20%, transparent 75%);
          mask-image: radial-gradient(ellipse at 30% 40%, #000 20%, transparent 75%);
  animation: iec-grid-pan 14s linear infinite;
}

.iec-btn { position: relative; overflow: hidden; }
.iec-btn::after {
  content: "";
  position: absolute; inset: 0 auto 0 0; width: 40%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent);
  transform: translateX(-120%) skewX(-20deg);
}
.iec-btn:hover:not(:disabled)::after { animation: iec-shine 700ms ease-out; }

.iec-live { animation: iec-pulse-dot 1.8s ease-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .iec-rise, .iec-fade, .iec-slide-left, .iec-draw, .iec-shake,
  .iec-field-in, .iec-card, .iec-grid, .iec-live,
  .iec-btn:hover:not(:disabled)::after {
    animation: none !important;
  }
}
`;

/** Anima um número de 0 até o valor final. */
function useCountUp(target: number | undefined, duration = 1100) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (typeof target !== "number") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return value;
}

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const { data: config, isLoading: configLoading, error: configError } = useBonificacaoConfig();
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroKey, setErroKey] = useState(0);
  const [verSenha, setVerSenha] = useState(false);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const valorPesquisador = useCountUp(config?.valorPesquisador);
  const valorEmpresa = useCountUp(config?.valorEmpresa);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/dashboard", replace: true });
  }, [loading, session, navigate]);

  function trocarModo(novo: "login" | "cadastro") {
    setModo(novo);
    setErro(null);
  }

  function falhar(msg: string) {
    setErro(msg);
    setErroKey((k) => k + 1);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!email.includes("@")) return falhar("Informe um e-mail válido.");
    if (senha.length < 6) return falhar("A senha deve ter no mínimo 6 caracteres.");

    if (modo === "cadastro") {
      if (nome.trim().length < 3) return falhar("Informe seu nome completo.");
      if (!isValidCPF(cpf)) return falhar("CPF inválido.");
    }

    setEnviando(true);
    try {
      if (modo === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome_completo: nome.trim(), cpf: onlyDigits(cpf) },
          },
        });
        if (error) throw error;
        toast.success("Cadastro realizado! Entrando...");
      }
      void navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível concluir.";
      if (msg.includes("duplicate") || msg.includes("cpf")) falhar("Este CPF já está cadastrado.");
      else if (msg.includes("Invalid login")) falhar("E-mail ou senha incorretos.");
      else if (msg.includes("already registered")) falhar("Este e-mail já possui cadastro.");
      else falhar(msg);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-white text-[#1a1a1a] lg:grid-cols-[1.05fr_1fr]">
      <style>{localStyles}</style>

      {/* ===================== PAINEL ESCURO (desktop) ===================== */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-black p-12 text-white lg:flex">
        {/* Grade sutil animada (sem bolas) */}
        <div className="iec-grid pointer-events-none absolute inset-0" aria-hidden />
        {/* Faixa amarela lateral */}
        <div
          className="iec-draw pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#FFC400]"
          aria-hidden
        />

        <Link
          to="/"
          aria-label="Eco Indica — início"
          className="iec-slide-left relative w-fit"
          style={{ animationDelay: "100ms" }}
        >
          <img src="/logo.png" alt="Eco Indica" className="h-10 w-auto object-contain" />
        </Link>

        <div className="relative">
          <span
            className="iec-rise inline-flex items-center gap-2 rounded-full border border-[#FFC400]/70 bg-[#FFC400]/5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#FFC400]"
            style={{ animationDelay: "200ms" }}
          >
            <span className="iec-live size-1.5 rounded-full bg-[#FFC400]" />
            Programa de indicações do Cliente Oculto IEC
          </span>

          <h2 className="mt-7 font-display text-5xl font-extrabold leading-[1.05] tracking-tight xl:text-6xl">
            <span className="iec-rise block" style={{ animationDelay: "320ms" }}>
              Indique pessoas e empresas.
            </span>
            <span
              className="iec-rise relative mt-1 inline-block text-[#FFC400]"
              style={{ animationDelay: "480ms" }}
            >
              Ganhe comissões.
              <span
                className="iec-draw absolute -bottom-2 left-0 h-1.5 w-full rounded bg-[#FFC400]/40"
                style={{ animationDelay: "1000ms" }}
                aria-hidden
              />
            </span>
          </h2>

          <p
            className="iec-rise mt-8 max-w-md text-base leading-relaxed text-white/75"
            style={{ animationDelay: "640ms" }}
          >
            Indique pesquisadores e empresas, acompanhe cada etapa e receba suas bonificações na
            plataforma oficial do Instituto Experiência do Cliente.
          </p>

          {configError ? (
            <p role="alert" className="mt-10 text-sm text-white/70">
              Não foi possível carregar os valores de bonificação.
            </p>
          ) : configLoading || !config ? (
            <div className="mt-10 grid max-w-md grid-cols-2 gap-5">
              {[0, 1].map((i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl bg-white/10" />
              ))}
            </div>
          ) : (
            <div className="mt-10 grid max-w-md grid-cols-2 gap-5">
              <div
                className="iec-card group rounded-2xl bg-[#FFC400] p-5 text-black shadow-[6px_6px_0_0_rgba(255,255,255,0.18)] transition-shadow duration-300 hover:shadow-[10px_10px_0_0_rgba(255,255,255,0.28)]"
                style={{ ["--r" as string]: "-1.5deg", animationDelay: "800ms, 1.6s" }}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-black text-[#FFC400] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  <Users className="size-5" />
                </span>
                <p className="mt-4 font-display text-3xl font-extrabold leading-none tabular-nums">
                  {brl(valorPesquisador)}
                </p>
                <p className="mt-2 text-sm font-medium text-black/70">por pesquisador indicado</p>
              </div>

              <div
                className="iec-card group mt-6 rounded-2xl border-2 border-white bg-black p-5 shadow-[6px_6px_0_0_#FFC400] transition-shadow duration-300 hover:shadow-[10px_10px_0_0_#FFC400]"
                style={{ ["--r" as string]: "1.5deg", animationDelay: "950ms, 2.1s" }}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-[#FFC400] text-black transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Building2 className="size-5" />
                </span>
                <p className="mt-4 font-display text-3xl font-extrabold leading-none tabular-nums text-[#FFC400]">
                  {brl(valorEmpresa)}
                </p>
                <p className="mt-2 text-sm font-medium text-white/70">por empresa fechada</p>
              </div>
            </div>
          )}
        </div>

        <p className="iec-fade relative text-xs text-white/50" style={{ animationDelay: "1200ms" }}>
          © {new Date().getFullYear()} Instituto Experiência do Cliente
        </p>
      </aside>

      {/* ===================== FORMULÁRIO ===================== */}
      <main className="relative flex flex-col bg-[linear-gradient(180deg,#fff_0%,#fffdf5_100%)]">
        {/* Header mobile */}
        <header className="iec-fade border-b-4 border-[#FFC400] bg-black px-5 py-3 lg:hidden">
          <Link to="/" aria-label="Eco Indica — início" className="block w-fit">
            <img src="/logo.png" alt="Eco Indica" className="h-8 w-auto object-contain" />
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-12">
          <div className="w-full max-w-sm">
            <Link
              to="/"
              className="iec-rise group mb-8 inline-flex items-center gap-2 text-sm font-medium text-black/60 transition hover:text-black"
            >
              <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
              Voltar ao início
            </Link>

            <div className="iec-draw mb-4 h-1 w-10 rounded bg-[#FFC400]" style={{ animationDelay: "150ms" }} />

            {/* key força re-animação ao trocar o modo */}
            <div key={modo} className="iec-rise">
              <h1 className="font-display text-3xl font-extrabold tracking-tight">
                {modo === "login" ? "Acessar sua conta" : "Criar conta de indicador"}
              </h1>
              <p className="mt-2 text-sm text-black/60">
                {modo === "login"
                  ? "Entre com seu e-mail e senha."
                  : "Preencha seus dados para começar a indicar."}
              </p>
            </div>

            {/* Valores (mobile) */}
            <div
              className="iec-rise mt-6 grid grid-cols-2 gap-3 lg:hidden"
              style={{ animationDelay: "150ms" }}
            >
              {configError ? (
                <p role="alert" className="col-span-2 text-sm text-red-600">
                  Não foi possível carregar os valores de bonificação.
                </p>
              ) : configLoading || !config ? (
                <>
                  <div className="h-20 animate-pulse rounded-xl bg-black/10" />
                  <div className="h-20 animate-pulse rounded-xl bg-black/10" />
                </>
              ) : (
                <>
                  <div className="rounded-xl bg-black p-3 text-white shadow-[3px_3px_0_0_#FFC400]">
                    <p className="font-display text-lg font-extrabold tabular-nums text-[#FFC400]">
                      {brl(valorPesquisador)}
                    </p>
                    <p className="text-xs text-white/70">por pesquisador indicado</p>
                  </div>
                  <div className="rounded-xl border-2 border-black bg-[#FFC400] p-3 text-black shadow-[3px_3px_0_0_#000]">
                    <p className="font-display text-lg font-extrabold tabular-nums">
                      {brl(valorEmpresa)}
                    </p>
                    <p className="text-xs text-black/70">por empresa fechada</p>
                  </div>
                </>
              )}
            </div>

            {/* Alternador login / cadastro com indicador deslizante */}
            <div
              role="tablist"
              aria-label="Modo de acesso"
              className="iec-rise relative mt-8 grid grid-cols-2 rounded-xl bg-black/5 p-1"
              style={{ animationDelay: "250ms" }}
            >
              <span
                aria-hidden
                className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-black shadow-md transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
                style={{ transform: modo === "login" ? "translateX(0)" : "translateX(100%)" }}
              />
              {(["login", "cadastro"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={modo === m}
                  onClick={() => trocarModo(m)}
                  className={`relative z-10 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC400] ${
                    modo === m ? "text-[#FFC400]" : "text-black/60 hover:text-black"
                  }`}
                >
                  {m === "login" ? "Entrar" : "Cadastrar"}
                </button>
              ))}
            </div>

            <form
              onSubmit={onSubmit}
              className="iec-rise mt-6 space-y-4"
              style={{ animationDelay: "350ms" }}
              noValidate
            >
              {modo === "cadastro" && (
                <>
                  <div className="iec-field-in space-y-1.5">
                    <Label htmlFor="nome" className="font-semibold">
                      Nome completo
                    </Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      autoComplete="name"
                      maxLength={120}
                      className={INPUT}
                    />
                  </div>
                  <div className="iec-field-in space-y-1.5" style={{ animationDelay: "70ms" }}>
                    <Label htmlFor="cpf" className="font-semibold">
                      CPF
                    </Label>
                    <Input
                      id="cpf"
                      value={cpf}
                      onChange={(e) => setCpf(maskCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                      className={INPUT}
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-semibold">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  maxLength={255}
                  placeholder="voce@exemplo.com"
                  className={INPUT}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="senha" className="font-semibold">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={verSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete={modo === "login" ? "current-password" : "new-password"}
                    className={`${INPUT} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setVerSenha((v) => !v)}
                    aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-black/50 transition hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC400]"
                  >
                    {verSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {modo === "cadastro" && (
                  <p className="text-xs text-black/50">Mínimo de 6 caracteres.</p>
                )}
              </div>

              {erro && (
                <p
                  key={erroKey}
                  role="alert"
                  className="iec-shake rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                >
                  {erro}
                </p>
              )}

              <Button
                type="submit"
                disabled={enviando}
                className="iec-btn h-12 w-full rounded-xl bg-[#FFC400] text-sm font-bold text-black shadow-[0_4px_0_0_#000] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ffd633] hover:shadow-[0_6px_0_0_#000] active:translate-y-1 active:shadow-[0_0_0_0_#000] focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-70"
              >
                {enviando && <Loader2 className="mr-2 size-4 animate-spin" />}
                {modo === "login" ? "Entrar" : "Criar conta"}
              </Button>
            </form>

            <p
              className="iec-fade mt-6 text-center text-sm text-black/60"
              style={{ animationDelay: "600ms" }}
            >
              {modo === "login" ? "Ainda não tem conta?" : "Já possui cadastro?"}{" "}
              <button
                type="button"
                className="font-bold text-black underline decoration-[#FFC400] decoration-2 underline-offset-4 transition hover:decoration-4"
                onClick={() => trocarModo(modo === "login" ? "cadastro" : "login")}
              >
                {modo === "login" ? "Cadastre-se" : "Entrar"}
              </button>
            </p>

            <p className="mt-10 text-center text-xs text-black/40 lg:hidden">
              © {new Date().getFullYear()} Instituto Experiência do Cliente
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}