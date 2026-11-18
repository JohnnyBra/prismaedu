import React from 'react';

// Una cara del prisma por app de la Suite: Intranet, Excursiones, Biblioteca, Aulas y Prisma
const PRISM_FACES = ['var(--hs-e1)', 'var(--hs-e2)', 'var(--hs-e3)', 'var(--hs-e4)', 'var(--hs-e5)'];

/** El prisma de cristal con el escudo, la luz que lo atraviesa y el título «Prisma».
 *  Lo usan el login y la entrada al volver con la sesión iniciada. */
const EscenaPrisma: React.FC = () => (
  <div className="text-center flex flex-col items-center">
    <div className="lp-escena" aria-hidden="true">
      <div className="lp-haz" />
      <div className="lp-abanico" />
      <div className="lp-nucleo" />
      <div className="lp-prisma">
        <div className="lp-giro">
          {PRISM_FACES.map((color, i) => (
            <div key={i} className="lp-cara" style={{ '--ry': `${i * 72}deg`, '--c': color } as React.CSSProperties} />
          ))}
          <div className="lp-tapa lp-tapa--arriba" />
          <div className="lp-tapa lp-tapa--abajo" />
        </div>
      </div>
      <img src="/suite/escudo.png" alt="" className="lp-escudo" />
    </div>
    <h1 className="lp-titulo gradient-text mb-3">Prisma</h1>
    <p className="text-white/60 text-xs sm:text-sm font-semibold tracking-[0.18em] uppercase">Colegio La Hispanidad · Huelva</p>
  </div>
);

export default EscenaPrisma;
