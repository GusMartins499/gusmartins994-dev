// Camada decorativa da hero: traços de pipeline nas margens laterais, com um
// pulso descendo de tempos em tempos. Inspiração confessa na hero da Woovi —
// lá é um canvas three.js desenhando um esquemático de PCB com pulsos e
// rótulos de transação. Aqui não precisa de WebGL: SVG estático + duas
// animações de CSS entregam a mesma leitura ("tem coisa acontecendo atrás")
// por zero byte de JavaScript e sem gastar bateria.
//
// Regras que o fundo tem de respeitar (DESIGN.md): sustentar o conteúdo, não
// competir. Por isso — sem texto (monoespaçada atrás de monoespaçada vira
// ruído), traço no mesmo peso das linhas fortes da grade, pulso visível em
// ~1/4 do ciclo e nada disso abaixo de `lg`, onde não há margem sobrando.

const LEFT_TRACES = [
  "M192 56 H136 Q128 56 128 64 V192 Q128 200 120 200 H40",
  "M192 152 H168 Q160 152 160 160 V296 Q160 304 152 304 H88 Q80 304 80 312 V408",
  "M192 248 H104 Q96 248 96 256 V344",
];

const RIGHT_TRACES = [
  "M0 88 H64 Q72 88 72 96 V224 Q72 232 80 232 H152",
  "M0 200 H32 Q40 200 40 208 V352 Q40 360 48 360 H112 Q120 360 120 368 V424",
  "M0 304 H88 Q96 304 96 312 V392",
];

// Dessincronizados de propósito: durações primas entre si e atrasos
// diferentes, pra os três pulsos nunca caírem no mesmo compasso.
const PULSES = [
  { dur: "11s", delay: "0s" },
  { dur: "13s", delay: "3.5s" },
  { dur: "17s", delay: "7s" },
];

// Nó = quadradinho, não bolinha: no escuro a grade lê como grade de
// caracteres, e um traço que termina em célula combina mais que um pino.
function Node({ x, y }: { x: number; y: number }) {
  return <rect x={x - 2.5} y={y - 2.5} width="5" height="5" />;
}

function Panel({ side }: { side: "left" | "right" }) {
  const traces = side === "left" ? LEFT_TRACES : RIGHT_TRACES;
  const nodes =
    side === "left"
      ? [
          { x: 40, y: 200 },
          { x: 80, y: 408 },
          { x: 96, y: 344 },
        ]
      : [
          { x: 152, y: 232 },
          { x: 120, y: 424 },
          { x: 96, y: 392 },
        ];

  return (
    <div
      className={`hero-circuit ${
        side === "left"
          ? "right-full mr-8 justify-end"
          : "hero-circuit-right left-full ml-8 justify-start"
      }`}
      aria-hidden="true"
    >
      <svg
        width="192"
        height="440"
        viewBox="0 0 192 440"
        fill="none"
        className="hero-circuit-svg shrink-0"
      >
        <g stroke="var(--circuit)" strokeWidth="1">
          {traces.map((d) => (
            <path key={d} d={d} />
          ))}
          <rect
            x={side === "left" ? 24 : 120}
            y={side === "left" ? 240 : 280}
            width="48"
            height="24"
            rx="4"
          />
          {/* coto curto: o traço que sai de cena sem destino, como na planta */}
          <path d={side === "left" ? "M192 344 H160" : "M0 392 H32"} />
        </g>

        <g fill="var(--circuit)">
          {nodes.map((n) => (
            <Node key={`${n.x}-${n.y}`} {...n} />
          ))}
        </g>

        {/* O pulso é o mesmo traço redesenhado com um risco curto correndo por
            cima. `pathLength` normaliza o caminho em 600, então a conta do
            dash vale igual pros três, independente do comprimento real.
            Duas passadas: halo largo embaixo, risco nítido em cima. */}
        {(
          [
            { cls: "circuit-pulse-halo", width: 7 },
            { cls: "circuit-pulse-core", width: 2 },
          ] as const
        ).map((layer) => (
          <g
            key={layer.cls}
            stroke="var(--color-primary)"
            strokeWidth={layer.width}
            strokeLinecap="round"
          >
            {traces.map((d, i) => (
              <path
                key={d}
                d={d}
                pathLength="600"
                className={`circuit-pulse ${layer.cls}`}
                style={
                  {
                    "--pulse-dur": PULSES[i].dur,
                    "--pulse-delay": PULSES[i].delay,
                  } as React.CSSProperties
                }
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

export function HeroCircuit() {
  return (
    <>
      <Panel side="left" />
      <Panel side="right" />
    </>
  );
}
