import * as React from "react";

export function F1TrackIllustration() {
  return (
    <div className="relative flex h-full min-h-[320px] w-full max-w-[340px] items-center justify-center select-none">
      <svg
        viewBox="0 0 340 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full drop-shadow-xl"
      >
        <defs>
          {/* Gradiente da Pista de Asfalto */}
          <linearGradient id="asphaltGradient" x1="170" y1="0" x2="170" y2="420" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E2024" />
            <stop offset="60%" stopColor="#2A2D34" />
            <stop offset="100%" stopColor="#32363E" />
          </linearGradient>

          {/* Gradiente da Chassi do Carro F1 (Azul Genesis Racing) */}
          <linearGradient id="carBodyGradient" x1="170" y1="130" x2="170" y2="290" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="40%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          {/* Gradiente do Pneu Slick */}
          <linearGradient id="tireGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#111215" />
            <stop offset="50%" stopColor="#2D3036" />
            <stop offset="100%" stopColor="#111215" />
          </linearGradient>

          {/* Fumaça e nuvens de velocidade na base */}
          <linearGradient id="smokeGradient" x1="170" y1="360" x2="170" y2="420" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.95" />
          </linearGradient>

          {/* Padrão da Zebra de Circuito (Vermelho e Branco) */}
          <pattern id="curbPattern" width="12" height="24" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill="#EF4444" />
            <rect y="12" width="12" height="12" fill="#FFFFFF" />
          </pattern>
        </defs>

        {/* 1. Pista de Asfalto vindo de cima para baixo em perspectiva */}
        <path
          d="M100 0 L240 0 L275 420 L65 420 Z"
          fill="url(#asphaltGradient)"
        />

        {/* 2. Zebras Laterais de Circuito (Curbs F1) */}
        {/* Zebra Esquerda */}
        <path
          d="M90 0 L100 0 L65 420 L52 420 Z"
          fill="url(#curbPattern)"
        />
        {/* Zebra Direita */}
        <path
          d="M240 0 L250 0 L288 420 L275 420 Z"
          fill="url(#curbPattern)"
        />

        {/* 3. Linhas Tracejadas Centrais da Pista com visual de alta velocidade */}
        <line
          x1="170"
          y1="10"
          x2="170"
          y2="60"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="18 16"
          opacity="0.85"
        />
        <line
          x1="170"
          y1="75"
          x2="170"
          y2="135"
          stroke="#FFFFFF"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray="22 16"
          opacity="0.9"
        />

        {/* 4. Marcas de Frenagem / Pneu no Asfalto */}
        <path
          d="M128 170 Q130 260 132 370"
          stroke="#111215"
          strokeWidth="7"
          opacity="0.35"
          strokeLinecap="round"
        />
        <path
          d="M212 170 Q210 260 208 370"
          stroke="#111215"
          strokeWidth="7"
          opacity="0.35"
          strokeLinecap="round"
        />

        {/* 5. Carro de F1 em Miniatura (Top-Down Detalhado) */}
        <g id="f1-car" transform="translate(0, 30)">
          {/* Sombra Dinâmica do Carro */}
          <ellipse cx="170" cy="245" rx="52" ry="78" fill="#000000" opacity="0.45" filter="blur(7px)" />

          {/* Pneus Dianteiros (Esquerda & Direita) */}
          {/* Pneu Dianteiro Esquerdo */}
          <rect x="122" y="172" width="14" height="34" rx="4" fill="url(#tireGradient)" />
          <rect x="125" y="176" width="8" height="26" rx="2" fill="#E5E7EB" opacity="0.8" />
          {/* Pneu Dianteiro Direito */}
          <rect x="204" y="172" width="14" height="34" rx="4" fill="url(#tireGradient)" />
          <rect x="207" y="176" width="8" height="26" rx="2" fill="#E5E7EB" opacity="0.8" />

          {/* Braços da Suspensão Dianteira */}
          <line x1="136" y1="184" x2="158" y2="186" stroke="#4B5563" strokeWidth="2.5" />
          <line x1="136" y1="194" x2="158" y2="192" stroke="#4B5563" strokeWidth="2.5" />
          <line x1="204" y1="184" x2="182" y2="186" stroke="#4B5563" strokeWidth="2.5" />
          <line x1="204" y1="194" x2="182" y2="192" stroke="#4B5563" strokeWidth="2.5" />

          {/* Pneus Traseiros Mais Largos (Esquerda & Direita) */}
          {/* Pneu Traseiro Esquerdo */}
          <rect x="116" y="260" width="18" height="42" rx="5" fill="url(#tireGradient)" />
          <rect x="119" y="265" width="10" height="32" rx="3" fill="#E5E7EB" opacity="0.8" />
          {/* Pneu Traseiro Direito */}
          <rect x="206" y="260" width="18" height="42" rx="5" fill="url(#tireGradient)" />
          <rect x="209" y="265" width="10" height="32" rx="3" fill="#E5E7EB" opacity="0.8" />

          {/* Braços da Suspensão Traseira */}
          <line x1="134" y1="275" x2="154" y2="280" stroke="#4B5563" strokeWidth="3" />
          <line x1="206" y1="275" x2="186" y2="280" stroke="#4B5563" strokeWidth="3" />

          {/* Aerofólio Traseiro F1 com Placas Laterais */}
          <rect x="130" y="296" width="80" height="14" rx="3" fill="#1E293B" />
          <rect x="127" y="292" width="6" height="22" rx="2" fill="#0F172A" />
          <rect x="207" y="292" width="6" height="22" rx="2" fill="#0F172A" />

          {/* Corpo / Monocoque Principal do Carro F1 */}
          <path
            d="M170 148 
               C164 165, 158 185, 154 210 
               C150 230, 148 255, 146 292 
               L194 292 
               C192 255, 190 230, 186 210 
               C182 185, 176 165, 170 148 Z"
            fill="url(#carBodyGradient)"
          />

          {/* Bico e Asas Dianteiras F1 */}
          <path
            d="M125 156 L215 156 L212 163 L128 163 Z"
            fill="#0F172A"
          />
          <path
            d="M165 146 L175 146 L174 158 L166 158 Z"
            fill="#3B82F6"
          />

          {/* Sidepods com Entradas de Ar Aerodinâmicas */}
          <path
            d="M152 216 C144 220, 142 235, 144 260 L154 260 Z"
            fill="#1E293B"
          />
          <path
            d="M188 216 C196 220, 198 235, 196 260 L186 260 Z"
            fill="#1E293B"
          />

          {/* Cockpit com Proteção Halo e Capacete do Piloto */}
          {/* Abertura do Cockpit */}
          <ellipse cx="170" cy="226" rx="9" ry="16" fill="#0F172A" />
          {/* Halo em Arco de Titânio */}
          <path
            d="M164 218 C164 212, 176 212, 176 218 L170 232 Z"
            fill="#334155"
            stroke="#1E293B"
            strokeWidth="1.5"
          />
          {/* Capacete do Piloto com Viseira Espelhada */}
          <circle cx="170" cy="227" r="6" fill="#F59E0B" />
          <path d="M167 225 Q170 223 173 225 L173 227 Q170 226 167 227 Z" fill="#111827" />

          {/* Número de Corrida no Bico */}
          <text
            x="170"
            y="180"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="10"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            01
          </text>

          {/* Faixas Aerodinâmicas / Patrocínio Gênesis Racing */}
          <path d="M168 190 L172 190 L173 210 L167 210 Z" fill="#60A5FA" opacity="0.8" />
        </g>

        {/* 6. Nuvem estilizada de fumaça e arrancada na base (similar à referência) */}
        <g id="smoke-clouds" transform="translate(0, 310)">
          <path
            d="M20 100 
               C40 70, 75 75, 95 90 
               C115 65, 150 68, 170 85 
               C190 60, 230 65, 250 85 
               C275 70, 310 75, 330 100 
               L340 120 L0 120 Z"
            fill="url(#smokeGradient)"
          />
          <path
            d="M40 105 
               C60 85, 90 85, 110 98 
               C135 80, 165 82, 185 96 
               C205 78, 240 80, 260 98 
               C280 88, 305 90, 320 108 
               L330 120 L20 120 Z"
            fill="#FFFFFF"
            opacity="0.8"
          />
        </g>
      </svg>
    </div>
  );
}
