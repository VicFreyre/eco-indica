import { useEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronRight,
  CircleCheck,
  Coins,
  Building2,
  Database,
  FileText,
  ShieldCheck,
  Star,
  TrendingUp,
  UserPlus,
  Users,
  UsersRound,
  Search,
  Instagram,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { brl } from "@/lib/domain";
import { useBonificacaoConfig } from "@/lib/bonificacao";

export const Route = createFileRoute("/")({
  ssr: false,

  head: () => ({
    meta: [
      {
        title: "Eco Indica — Programa de Indicações do Cliente Oculto IEC",
      },
      {
        name: "description",
        content:
          "Indique pesquisadores e empresas para o Cliente Oculto IEC e seja recompensado por isso.",
      },
      {
        property: "og:title",
        content: "Eco Indica — Indique e ganhe comissões",
      },
      {
        property: "og:description",
        content:
          "Indique pessoas e empresas, acompanhe cada indicação e receba suas comissões.",
      },
    ],
  }),

  component: LandingPage,
});

const BTN_Y =
  "inline-flex items-center justify-center rounded-lg bg-[#FFC400] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-[#ffd633]";

const BTN_O =
  "inline-flex items-center justify-center rounded-lg border border-[#FFC400] px-5 py-2.5 text-sm font-semibold text-[#FFC400] transition hover:bg-[#FFC400] hover:text-black";

const nav = [
  ["Como funciona", "#como-funciona"],
  ["Vantagens", "#vantagens"],
  ["Marcas", "#marcas"],
] as const;

const passos = [
  {
    icon: UserPlus,
    title: "Crie sua conta",
    text: "Faça o cadastro na plataforma e acesse o seu painel de indicações.",
  },
  {
    icon: FileText,
    title: "Envie a indicação",
    text: "Informe os dados do pesquisador ou da empresa que você quer conectar ao IEC.",
  },
  {
    icon: CircleCheck,
    title: "Acompanhe a análise",
    text: "Veja o andamento de cada indicação e o histórico completo no mesmo lugar.",
  },
  {
    icon: Database,
    title: "Receba a bonificação",
    text: "Com a indicação aprovada, o valor correspondente fica disponível na sua conta.",
  },
];

const vantagens = [
  {
    icon: Coins,
    a: "Comissões",
    b: "atrativas",
  },
  {
    icon: UsersRound,
    a: "Indique",
    b: "pessoas e empresas",
  },
  {
    icon: ShieldCheck,
    a: "Processo seguro",
    b: "e transparente",
  },
  {
    icon: Star,
    a: "Faça parte de um",
    b: "mercado que cresce cada vez mais",
  },
];

const marcas = Array.from({ length: 14 }, (_, index) => ({
  nome: `Marca parceira ${index + 1}`,
  logo: `/logos/${index + 1}.png`,
}));

/* =========================================================
   VIEWPORT DESKTOP (mesmo layout no mobile)
========================================================= */

const DESKTOP_WIDTH = 1280;

function useDesktopViewport() {
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="viewport"]',
    );

    const created = !meta;
    const previous = meta?.getAttribute("content") ?? null;

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", `width=${DESKTOP_WIDTH}`);

    return () => {
      if (!meta) return;

      if (created) {
        meta.remove();
      } else if (previous !== null) {
        meta.setAttribute("content", previous);
      }
    };
  }, []);
}

/* =========================================================
   ANIMAÇÃO DE ENTRADA
========================================================= */

function Reveal({
  children,
  className = "",
  delay = 0,
  from = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  from?: "up" | "left" | "right" | "fade";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -60px 0px",
      },
    );

    io.observe(el);

    return () => io.disconnect();
  }, []);

  const hidden = {
    up: "translate-y-10",
    left: "-translate-x-10",
    right: "translate-x-10",
    fade: "",
  }[from];

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
      }}
      className={`transform-gpu transition-all duration-700 ease-out ${
        visible
          ? "translate-x-0 translate-y-0 opacity-100"
          : `${hidden} opacity-0`
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* =========================================================
   CONTADOR
========================================================= */

function CountUp({
  value,
  format,
}: {
  value: number;
  format: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }

    let raf = 0;

    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;

      io.disconnect();

      const t0 = performance.now();

      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 1400);

        setN(value * (1 - Math.pow(1 - k, 3)));

        if (k < 1) {
          raf = requestAnimationFrame(tick);
        }
      };

      raf = requestAnimationFrame(tick);
    });

    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return <span ref={ref}>{format(n)}</span>;
}

/* =========================================================
   ESTILOS
========================================================= */

const localStyles = `
@keyframes iec-marquee {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-50%);
  }
}

.iec-marquee {
  animation: iec-marquee 40s linear infinite;
}

.iec-marquee-wrap:hover .iec-marquee {
  animation-play-state: paused;
}

.iec-fade {
  -webkit-mask-image: linear-gradient(
    to right,
    transparent,
    #000 10%,
    #000 90%,
    transparent
  );

  mask-image: linear-gradient(
    to right,
    transparent,
    #000 10%,
    #000 90%,
    transparent
  );
}

@media (prefers-reduced-motion: reduce) {
  .iec-marquee {
    animation: none;
  }
}
`;

/* =========================================================
   LANDING PAGE
========================================================= */

function LandingPage() {
  useDesktopViewport();

  const { session } = useAuth();

  const {
    data: config,
    isLoading,
    error,
  } = useBonificacaoConfig();

  const destino = session ? "/dashboard" : "/auth";

  const cadastrar = session
    ? "Acessar meu painel"
    : "Quero me cadastrar";

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white text-[#1a1a1a]">
      <style>{localStyles}</style>

      {/* =========================================================
          HEADER
      ========================================================= */}

      <header className="sticky top-0 z-40 bg-black text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
          <Link
            to="/"
            aria-label="Eco Indica — início"
            className="shrink-0"
          >
            <img
              src="/logo.png"
              alt="Eco Indica"
              className="h-7   w-auto object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-7 text-xs font-medium text-white/85 lg:flex">
            {nav.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="hover:text-[#FFC400]"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {session ? (
              <Link to="/dashboard" className={BTN_Y}>
                Acessar meu painel
              </Link>
            ) : (
              <>
                <Link to="/auth" className={BTN_Y}>
                  Entrar
                </Link>

                <Link
                  to="/auth"
                  className={`${BTN_O} hidden sm:inline-flex`}
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================
          HERO
      ========================================================= */}

      <section className="bg-black text-white">
        <div
          className="
            mx-auto
            grid
            max-w-7xl
            items-stretch
            gap-10
            px-5
            pt-14
            sm:px-8
            sm:pt-20
            lg:grid-cols-2
            lg:gap-6
            lg:pt-20
          "
        >
          {/* TEXTO */}

          <Reveal
            from="left"
            className="flex items-center pb-14 lg:pb-20"
          >
            <div>
              <span
                className="
                  inline-block
                  rounded-full
                  border
                  border-[#FFC400]
                  px-3
                  py-1
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-wide
                  text-[#FFC400]
                "
              >
                Programa de indicações do Cliente Oculto IEC
              </span>

              <h1
                className="
                  mt-6
                  font-display
                  text-5xl
                  font-extrabold
                  leading-[1.05]
                  tracking-tight
                  sm:text-6xl
                "
              >
                Indique pessoas e empresas.

                <span className="block text-[#FFC400]">
                  Ganhe comissões.
                </span>
              </h1>

              <p className="mt-6 max-w-md text-base leading-relaxed text-white/85">
                Com o <strong>Eco Indica</strong>, você indica pesquisadores
                e empresas para fazerem Cliente Oculto na plataforma do IEC e
                ainda é <strong>recompensado</strong> por isso.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={destino} className={BTN_Y}>
                  {cadastrar}
                </Link>

                <a
                  href="#como-funciona"
                  className="
                    inline-flex
                    items-center
                    rounded-lg
                    border
                    border-white/80
                    px-5
                    py-2.5
                    text-sm
                    font-semibold
                    hover:bg-white
                    hover:text-black
                  "
                >
                  Como funciona
                </a>
              </div>
            </div>
          </Reveal>

          {/* VÍDEO */}

          <Reveal
            from="right"
            delay={200}
            className="
              relative
              flex
              items-end
              justify-center
              self-end
            "
          >
            <video
              src="/motion.mp4"
              autoPlay
              muted
              playsInline
              preload="auto"
              aria-label="Vídeo sobre o programa Eco Indica"
              className="
                block
                h-auto
                w-auto
                max-w-[690px]
                translate-x-20
                object-contain
                shadow-2xl
              "
            />
          </Reveal>
        </div>
      </section>

      {/* =========================================================
          COMO FUNCIONA
      ========================================================= */}

      <section
        id="como-funciona"
        className="bg-white py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal className="text-center">
            <h2
              className="
                mx-auto
                max-w-3xl
                font-display
                text-4xl
                font-extrabold
                leading-[1.08]
                tracking-tight
                sm:text-5xl
              "
            >
              Da indicação à bonificação, em quatro passos.
            </h2>

            <p
              className="
                mx-auto
                mt-6
                max-w-xl
                text-base
                leading-relaxed
                text-black/70
                sm:text-lg
              "
            >
              O processo é o mesmo para pesquisadores e empresas. O que muda
              são os critérios de aprovação de cada tipo de indicação.
            </p>

            <Link
              to={destino}
              className="
                mt-8
                inline-flex
                items-center
                rounded-lg
                bg-black
                px-5
                py-2.5
                text-sm
                font-bold
                text-white
                transition
                hover:bg-[#FFC400]
                hover:text-black
              "
            >
              {session ? "Acessar meu painel" : "Quero me cadastrar"}

              <ArrowRight className="ml-3 size-4" />
            </Link>
          </Reveal>

          <ol className="mt-16 grid gap-12 md:grid-cols-4 md:gap-0">
            {passos.map((p, i) => (
              <li
                key={p.title}
                className="
                  relative
                  flex
                  flex-col
                  items-center
                  px-6
                  pt-2
                  text-center
                "
              >
                <Reveal
                  delay={i * 100}
                  className="flex flex-col items-center"
                >
                  <span
                    className="
                      absolute
                      left-2
                      top-0
                      z-10
                      grid
                      size-10
                      place-items-center
                      rounded-full
                      bg-[#FFC400]
                      font-display
                      text-base
                      font-extrabold
                      text-black
                      md:left-4
                    "
                  >
                    {i + 1}
                  </span>

                  <p.icon
                    className="size-14 text-black"
                    strokeWidth={1.6}
                    aria-hidden="true"
                  />

                  <h3
                    className="
                      mt-4
                      font-display
                      text-lg
                      font-extrabold
                      leading-snug
                      text-black
                    "
                  >
                    {p.title}
                  </h3>

                  <p
                    className="
                      mx-auto
                      mt-2
                      max-w-[15rem]
                      text-[15px]
                      leading-relaxed
                      text-black/60
                    "
                  >
                    {p.text}
                  </p>
                </Reveal>

                {i < passos.length - 1 && (
                  <ChevronRight
                    className="
                      absolute
                      right-[-12px]
                      top-8
                      hidden
                      size-6
                      text-black/60
                      md:block
                    "
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* =========================================================
          POR QUE PARTICIPAR
      ========================================================= */}

      <section
        id="vantagens"
        className="relative overflow-hidden bg-[#FFE27A]"
      >
        <div
          className="
            pointer-events-none
            absolute
            -right-32
            -top-32
            size-[480px]
            rounded-full
            bg-[#FFC400]/60
          "
        />

        <div
          className="
            relative
            mx-auto
            grid
            max-w-7xl
            items-center
            gap-12
            px-5
            py-16
            sm:px-8
            sm:py-20
            lg:grid-cols-[0.9fr_1.1fr]
          "
        >
          <Reveal from="left">
            <div className="mb-3 h-1 w-8 rounded bg-black" />

            <h2
              className="
                font-display
                text-3xl
                font-extrabold
                sm:text-4xl
                lg:text-5xl
              "
            >
              Por que participar?
            </h2>

            <p className="mt-4 max-w-md text-base leading-relaxed">
              Cada indicação aprovada vira{" "}
              <strong>bonificação na sua conta</strong>. Além da renda extra,
              você ajuda mais empresas a melhorar a experiência do cliente.
            </p>

            <ul className="mt-8 grid gap-5 sm:grid-cols-2">
              {vantagens.map((v) => (
                <li
                  key={v.a}
                  className="flex items-center gap-3 text-sm"
                >
                  <span
                    className="
                      grid
                      size-11
                      shrink-0
                      place-items-center
                      rounded-full
                      bg-black
                      text-[#FFC400]
                    "
                  >
                    <v.icon className="size-5" />
                  </span>

                  <span>
                    {v.a}

                    <strong className="block font-bold">
                      {v.b}
                    </strong>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal from="right" delay={150}>
            <div
              className="
                mb-4
                inline-flex
                items-center
                gap-2
                rounded-full
                bg-black
                px-4
                py-2
                text-xs
                font-bold
                text-[#FFC400]
              "
            >
              <TrendingUp className="size-4" />
              Quanto você ganha por indicação aprovada
            </div>

            {isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="
                      h-56
                      animate-pulse
                      rounded-2xl
                      bg-black/10
                    "
                  />
                ))}
              </div>
            ) : error ? (
              <p
                role="alert"
                className="
                  rounded-xl
                  border-2
                  border-black
                  bg-white
                  p-4
                  text-sm
                  font-medium
                "
              >
                Não foi possível carregar os valores de bonificação. Tente
                atualizar a página.
              </p>
            ) : config ? (
              <div className="grid gap-6 sm:grid-cols-2">
                <div
                  className="
                    group
                    relative
                    rounded-2xl
                    bg-black
                    p-7
                    text-white
                    shadow-[8px_8px_0_0_rgba(0,0,0,0.25)]
                    transition
                    duration-300
                    hover:-translate-y-2
                    sm:-rotate-1
                    sm:hover:rotate-0
                  "
                >
                  <span
                    className="
                      grid
                      size-12
                      place-items-center
                      rounded-xl
                      bg-[#FFC400]
                      text-black
                    "
                  >
                    <Users className="size-6" />
                  </span>

                  <p className="mt-6 text-sm font-medium text-white/70">
                    Indicação de pesquisador
                  </p>

                  <p
                    className="
                      mt-1
                      font-display
                      text-5xl
                      font-extrabold
                      leading-none
                      text-[#FFC400]
                    "
                  >
                    <CountUp
                      value={config.valorPesquisador}
                      format={brl}
                    />
                  </p>

                  <p
                    className="
                      mt-4
                      border-t
                      border-white/15
                      pt-4
                      text-xs
                      leading-relaxed
                      text-white/70
                    "
                  >
                    Conforme critérios de aprovação do programa.
                  </p>
                </div>

                <div
                  className="
                    group
                    relative
                    rounded-2xl
                    border-2
                    border-black
                    bg-white
                    p-7
                    shadow-[8px_8px_0_0_#000]
                    transition
                    duration-300
                    hover:-translate-y-2
                    sm:mt-8
                    sm:rotate-1
                    sm:hover:rotate-0
                  "
                >
                  <span
                    className="
                      grid
                      size-12
                      place-items-center
                      rounded-xl
                      bg-black
                      text-[#FFC400]
                    "
                  >
                    <Building2 className="size-6" />
                  </span>

                  <p className="mt-6 text-sm font-medium text-black/60">
                    Indicação de empresa
                  </p>

                  <p
                    className="
                      mt-1
                      font-display
                      text-5xl
                      font-extrabold
                      leading-none
                    "
                  >
                    <CountUp
                      value={config.valorEmpresa}
                      format={brl}
                    />
                  </p>

                  <p
                    className="
                      mt-4
                      border-t
                      border-black/15
                      pt-4
                      text-xs
                      leading-relaxed
                      text-black/70
                    "
                  >
                    Após validação e contratação de serviço IEC.
                  </p>
                </div>
              </div>
            ) : null}

            <p className="mt-6 text-xs leading-relaxed text-black/65">
              Valores definidos pela administração e sujeitos a mudança.
              Aplicam-se as condições de elegibilidade e aprovação de cada
              indicação.
            </p>
          </Reveal>
        </div>
      </section>

      {/* =========================================================
          MARCAS
      ========================================================= */}

      <section
        id="marcas"
        className="overflow-hidden py-16 sm:py-20"
      >
        <Reveal className="mx-auto max-w-7xl px-5 text-center sm:px-8">
          <div className="mx-auto mb-3 h-1 w-8 rounded bg-[#FFC400]" />

          <h2
            className="
              mx-auto
              max-w-3xl
              font-display
              text-3xl
              font-extrabold
              leading-tight
              sm:text-4xl
              lg:text-5xl
            "
          >
            Grandes marcas confiam no Cliente Oculto IEC.
          </h2>

          <p
            className="
              mx-auto
              mt-4
              max-w-xl
              text-base
              leading-relaxed
              text-black/65
            "
          >
            Ao indicar, você apresenta pesquisadores e empresas a uma
            plataforma que já faz parte da rotina de quem leva a experiência
            do cliente a sério.
          </p>
        </Reveal>

        <div
          className="
            iec-marquee-wrap
            iec-fade
            mt-12
          "
          aria-label="Marcas que confiam no Cliente Oculto IEC"
        >
          <div
            className="iec-marquee flex w-max"
            style={{
              animationDuration: `${Math.max(
                20,
                marcas.length * 6,
              )}s`,
            }}
          >
            {[0, 1].map((grupo) => (
              <div
                key={grupo}
                className="flex"
                aria-hidden={grupo === 1}
              >
                {[...marcas, ...marcas].map((m, i) => (
                  <div
                    key={`${grupo}-${i}`}
                    className="
                      mr-4
                      grid
                      h-24
                      w-44
                      shrink-0
                      place-items-center
                      px-4
                      sm:w-52
                    "
                  >
                    <img
                      src={m.logo}
                      alt={grupo === 0 ? m.nome : ""}
                      loading="lazy"
                      className="
                        max-h-14
                        w-auto
                        max-w-full
                        object-contain
                      "
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          CTA
      ========================================================= */}

      <section
        id="comecar"
        className="overflow-hidden bg-black text-white"
      >
        <Reveal
          className="
            mx-auto
            grid
            max-w-7xl
            items-end
            gap-8
            px-5
            pt-14
            sm:px-8
            md:grid-cols-[1fr_2fr]
          "
        >
          {/* TEXTO */}

          <div className="pb-14 md:pb-16">
            <div className="mb-3 h-1 w-8 rounded bg-[#FFC400]" />

            <h2 className="font-display text-3xl font-extrabold">
              Pronto para começar?
            </h2>

            <p className="mt-1 font-display text-xl font-extrabold text-[#FFC400]">
              Indique agora e ganhe com o Eco Indica!
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={destino} className={BTN_Y}>
                {session
                  ? "Acessar meu painel"
                  : "Criar minha conta"}
              </Link>

              {!session && (
                <Link
                  to="/auth"
                  className="
                    inline-flex
                    items-center
                    rounded-lg
                    border
                    border-white/80
                    px-5
                    py-2.5
                    text-sm
                    font-semibold
                    hover:bg-white
                    hover:text-black
                  "
                >
                  Fazer login
                </Link>
              )}
            </div>
          </div>

          {/* =====================================================
              IMAGEM PHONE
          ===================================================== */}

          <div
            className="
              flex
              items-end
              justify-end
              md:translate-x-2
              lg:translate-x-4
              xl:translate-x-8
            "
          >
            <img
              src="/phone.png"
              alt="Eco Indica"
              className="
                block
                h-auto
                max-w-none
                object-contain
                w-[550px]
                md:w-[600px]
                lg:w-[680px]
                xl:w-[750px]
              "
            />
          </div>
        </Reveal>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}

      <footer className="border-t border-white/10 bg-black text-white">
        <div
          className="
            mx-auto
            flex
            max-w-7xl
            items-center
            justify-between
            gap-8
            px-5
            py-6
            sm:px-8
          "
        >
          <Link
            to="/"
            aria-label="Eco Indica — início"
            className="shrink-0"
          >
            <img
              src="/logo.png"
              alt="Eco Indica"
              className="h-6 w-auto object-contain"
            />
          </Link>

          <nav className="flex flex-1 items-center justify-center gap-8 text-sm text-white/85">
            <a
              href="https://app.clienteocultoiec.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 whitespace-nowrap transition hover:text-[#FFC400]"
            >
              <Search className="size-5" strokeWidth={2} />
              <span>Cliente Oculto IEC</span>
            </a>

            <a
              href="https://www.instagram.com/institutoexperienciadocliente/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 whitespace-nowrap transition hover:text-[#FFC400]"
            >
              <Instagram className="size-5" strokeWidth={2} />
              <span>IEC</span>
            </a>

            <a
              href="https://www.instagram.com/coelhofernandofalou/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 whitespace-nowrap transition hover:text-[#FFC400]"
            >
              <Instagram className="size-5" strokeWidth={2} />
              <span>Dr. Fernando Coelho</span>
            </a>
          </nav>

          <p className="shrink-0 whitespace-nowrap text-xs text-white/60">
            © {new Date().getFullYear()} 
          </p>
        </div>
      </footer>
    </main>
  );
}