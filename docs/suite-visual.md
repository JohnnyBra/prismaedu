# Suite La Hispanidad — «La luz del prisma»

La identidad visual que comparten Prisma, Aulas, Excursiones, Biblioteca e Intranet. Vive en `public/suite/` de Prisma y se publica en **https://prisma.bibliohispa.es/suite/**.

| Archivo | Para qué |
|---|---|
| `hispanidad-suite.css` | Colores, letras, tema claro y oscuro, cabecera, firma, botones, tarjetas y la marca del prisma. CSS puro, sin dependencias. |
| `escudo.png` | El emblema del cole (sin texto), para cabeceras e iconos. |
| `escudo-completo.png` | El escudo con «La Hispanidad · Colegio» y el 50 aniversario. |
| `ejemplo.html` | Una página de referencia que se puede abrir y copiar. |
| `iconos/` | Iconos de cristal hechos en Canva: `biblioteca`, `aulas`, `excursiones`, `intranet`, `prisma-aula`, `profesor`, `familia`, `admin` (`.webp` 512 px con transparencia), más `<app>-64.png` (favicon) y `<app>-180.png` (icono de acceso directo de iOS, sobre blanco). |

## Adoptarlo en otra app (Aulas, Excursiones, Biblioteca, Intranet)

1. **Enlazar el kit** en el `<head>`, antes de los estilos propios de la app:
   ```html
   <link rel="stylesheet" href="https://prisma.bibliohispa.es/suite/hispanidad-suite.css">
   <link rel="icon" type="image/png" href="https://prisma.bibliohispa.es/suite/escudo.png">
   ```
   Si se prefiere no depender de Prisma, se copia la carpeta `suite/` en la carpeta pública de la app y se enlaza en local.
2. **Cabecera:** se copia la de `ejemplo.html` y se cambia el nombre de la app en `.hs-marca-nombre`. Si la app ya tiene cabecera propia, basta con añadirle la clase `hs-luz` (pinta la línea de luz debajo; la cabecera tiene que estar posicionada: `sticky`, `fixed` o `relative`), poner el escudo con la clase `hs-escudo` y añadir la firma `<span class="hs-firma">Creado por Javi Barrero</span>`.
3. **Tema:** el kit sigue a `html[data-theme="light"|"dark"]`. Las apps del dominio comparten la cookie `HISPA_THEME` (`light`, `dark` o `system`); cada app la lee y pone el atributo. Sin atributo, sigue al sistema.
4. **Favicon de la app:** `<link rel="icon" type="image/png" href="https://prisma.bibliohispa.es/suite/iconos/<app>-64.png">` y `<link rel="apple-touch-icon" href="https://prisma.bibliohispa.es/suite/iconos/<app>-180.png">`.
5. **Fondo, botones y tarjetas (opcional):** `<body class="hs-cuerpo">`, `.hs-boton`, `.hs-boton--suave` y `.hs-tarjeta`. Para colores propios hay variables: `var(--hs-marino)`, `var(--hs-celeste)`, `var(--hs-texto)`, `var(--hs-superficie)`…

## Reglas de la identidad

- **El escudo manda.** Siempre visible en la cabecera, a la izquierda.
- **Marino `#0a4a8c` y celeste `#0aa0dc`** para todo lo que se pulsa y se destaca. Fondo tinta `#06121f` en oscuro y papel `#f5f3ee` en claro.
- **El espectro es la luz del prisma.** Un color por app: Intranet coral `--hs-e1`, Excursiones ámbar `--hs-e2`, Biblioteca verde `--hs-e3`, Aulas celeste `--hs-e4`, Prisma azul `--hs-e5`. Se usa en la línea de la cabecera, en el prisma y en los detalles de cada app; nunca como fondo de página.
- **Nada de violeta ni lavanda.**
- **Letras:** Bricolage Grotesque para los titulares y Figtree para el texto (el kit las carga).
- **Firma:** «Creado por Javi Barrero», discreta pero visible, en la cabecera de cada app.
- **Movimiento:** suave y con sentido; si el sistema pide reducir movimiento, se respeta.

## Iconos nuevos

Mismo estilo: un objeto 3D de **cristal translúcido** teñido del color de su app, con brillos y reflejos de arcoíris, sobre fondo blanco, sin texto. En Canva, con `generate-image` usando como referencia los ids `MAHbQ8xZtVo` (libro) y `MAHbQ3XLOB8` (birrete). Después: página con `create-design`, exportación PNG de 1024 y recorte con `python3 herramientas/recorta-icono.py export.png salida.webp`. Hay que revisarlos sobre fondo claro y oscuro.
