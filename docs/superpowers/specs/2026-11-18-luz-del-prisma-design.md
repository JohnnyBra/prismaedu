# «La luz del prisma» — nuevo aspecto de Prisma y de la Suite La Hispanidad

Aprobado por Javi el 2026-11-18.

## Objetivo
Rediseñar el aspecto de Prisma con efecto WOW, con una identidad **propia** (no la del gremio de los juegos) y con el **escudo del cole como protagonista**. La identidad debe poder **reproducirse en Aulas, Excursiones, Biblioteca e Intranet**, como mínimo la cabecera y lo básico.

## Restricciones
- No se pierde ninguna función. No se tocan `server/`, `context/DataContext.tsx` ni la lógica de las vistas: solo clases, marcado visual y CSS.
- El login de Google sigue siendo un enlace a `/auth/google`. No se cambia nada en el servidor.
- «Creado por Javi Barrero» visible pero discreto en el login, en el centro de accesos y en la cabecera de cada perfil.
- Se mantiene la esencia del **prisma pentagonal**: 5 caras = 5 apps (Biblioteca, Reservas Aulas, Excursiones, Intranet y Prisma Aula).
- Modo claro y oscuro (`html[data-theme]` y la cookie compartida `HISPA_THEME`, que ya existen). Se respeta `prefers-reduced-motion`.
- Nada de violeta ni lavanda en el diseño propio.

## Identidad visual
- **Colores del escudo:** marino `#0a4a8c` (clase `primary`/`school`) y celeste `#0aa0dc` (clase `accent`). Fondo oscuro tinta `#06121f→#0b223d`; fondo claro papel `#f5f3ee`.
- **Espectro:** la luz que sale del prisma, en 5 colores, uno por app: rojo coral `#ef5b4c`, ámbar `#f2a93b`, verde `#2fb47c`, celeste `#0aa0dc` y marino `#2563c9`. Se usa en momentos especiales (login, prisma, línea de la cabecera), no como relleno.
- **Firma de la Suite:** una línea espectral de 3 px bajo cada cabecera.
- **Tipografía:** Bricolage Grotesque (titulares) + Figtree (texto), de Google Fonts.
- **Escudo:** `public/suite/escudo.png` (solo el emblema) y `escudo-completo.png` (con el nombre y el 50 aniversario).

## Piezas
1. **Kit portátil** `public/suite/hispanidad-suite.css`: CSS puro, sin dependencias. Incluye tokens `--hs-*`, el tema claro y el oscuro, `.hs-header`, `.hs-marca`, `.hs-firma`, `.hs-espectro`, `.hs-boton`, `.hs-tarjeta` y `.hs-prisma` (pentágono). Se acompaña de `public/suite/ejemplo.html` (cabecera de referencia, para abrir y copiar) y de `docs/suite-visual.md` (cómo adoptarlo: enlazar `https://<prisma>/suite/hispanidad-suite.css` o copiar la carpeta `suite/`). Prisma usa el mismo kit, así que el kit queda probado en uso real.
2. **Sistema de Prisma**: en `index.html` se cambia la paleta de Tailwind (primary/school → marino, accent → celeste; indigo/violet/purple/pink se redirigen a la paleta del cole) y las fuentes. En `design-system.css`, los fondos por rol, el cristal, los botones y los inputs pasan a la nueva identidad. Las clases se llaman igual, así que las ~7.000 líneas de vistas cambian de aspecto sin tocarlas.
3. **Login (AuthView)**: el WOW. Un prisma pentagonal de cristal en 3D (CSS) gira despacio con el escudo dentro de un núcleo de luz; un haz entra por un lado y sale abierto en el espectro. Debajo, «Prisma», el nombre del cole y las opciones de acceso. Los pasos y la lógica no cambian.
4. **Centro de accesos del tutor**: se mantiene la animación de las 5 caras que se abren; las caras pasan a cristal teñido con el espectro (una por app) y el escudo sustituye al icono de 4 cuadrados en la tapa y en el móvil.
5. **Cabeceras de los 4 paneles**: escudo + «Prisma» + línea espectral + firma.

## Pruebas
- `npm run build` (tsc + vite) en verde.
- Recorrido en navegador real con capturas, a 1440 y 390 y en claro y oscuro: login (todos los pasos), centro de accesos, panel del tutor, del alumno, de la familia y de administración.
- Se comprueba que el enlace de Google sigue siendo `href="/auth/google"`.
- Revisión con web-design-guidelines (accesibilidad y contraste).

## Fuera de alcance
Adaptar Aulas, Excursiones, Biblioteca e Intranet: se hará en cada app con el kit y su guía.
