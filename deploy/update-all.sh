#!/bin/bash
# =============================================================================
#  La Hispanidad — Script de Actualización Global
#
#  Actualiza una o todas las aplicaciones del ecosistema educativo.
#  Uso:
#    bash update-all.sh          # Menú interactivo
#    bash update-all.sh --all    # Actualizar todo sin preguntar
#    bash update-all.sh 1 3 5    # Actualizar apps específicas por número
#
#  Nota: La actualización de Intranet pedirá contraseña de sudo.
# =============================================================================
set -uo pipefail

# ── Colores ──────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'
YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}[✓]${NC} $1"; }
info() { echo -e "  ${BLUE}[→]${NC} $1"; }
warn() { echo -e "  ${YELLOW}[!]${NC} $1"; }
fail() { echo -e "  ${RED}[✗]${NC} $1"; }

separator() { echo -e "${CYAN}──────────────────────────────────────────────────────${NC}"; }

# ── Configuración de aplicaciones ────────────────────────────
# Formato: DIR|PM2_NAME|BUILD_CMD|INSTALL_CMD|POST_CMD|LABEL

APPS=(
  "/home/javier/prisma/prismaedu|prismaedu|npm run build|npm install|pm2 restart prismaedu|PrismaEdu (Central)"
  "/home/javier/aulas/aulas|hispanidad-reservas|npm run build|npm install|pm2 restart hispanidad-reservas|Aulas (Reservas)"
  "/var/www/BiblioHispaApp|biblioteca|npm run build|npm install|pm2 restart biblioteca|BiblioHispa (Biblioteca)"
  "/home/javier/excursiones/excursionesv2|schooltrip-api|npm run build|npm run install:all|pm2 restart schooltrip-api && pm2 restart schooltrip-web"
  "/home/javier/intranet/intranet|intranet-hispa|npm run build|npm install|pm2 reload ecosystem.config.cjs --update-env|Intranet (Docentes)"
)

TOTAL=${#APPS[@]}

# ── Funciones ────────────────────────────────────────────────

print_header() {
  echo ""
  echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${CYAN}║     La Hispanidad — Actualización de Aplicaciones   ║${NC}"
  echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_menu() {
  echo -e "${BOLD}Aplicaciones disponibles:${NC}"
  echo ""
  for i in "${!APPS[@]}"; do
    IFS='|' read -r dir pm2name _ _ _ label <<< "${APPS[$i]}"
    num=$((i + 1))
    if [ -d "$dir" ]; then
      echo -e "  ${GREEN}${num})${NC} ${label}"
    else
      echo -e "  ${RED}${num})${NC} ${label}  ${RED}(no encontrada en ${dir})${NC}"
    fi
  done
  echo ""
  echo -e "  ${GREEN}A)${NC} Actualizar TODAS"
  echo -e "  ${RED}Q)${NC} Salir"
  echo ""
}

update_app() {
  local index=$1
  IFS='|' read -r dir pm2name build_cmd install_cmd post_cmd label <<< "${APPS[$index]}"

  echo ""
  separator
  echo -e "${BOLD}${BLUE}  Actualizando: ${label}${NC}"
  echo -e "  ${CYAN}Directorio: ${dir}${NC}"
  separator

  # Verificar que existe
  if [ ! -d "$dir" ]; then
    fail "Directorio no encontrado: ${dir}"
    return 1
  fi

  cd "$dir"

  local sudo_prefix=""
  if [[ "$pm2name" == "intranet-hispa" ]]; then
    sudo_prefix="sudo "
  fi

  # 1. Git pull
  info "Descargando últimos cambios..."
  if ${sudo_prefix}git pull origin main 2>/dev/null; then
    ok "Código actualizado: $(${sudo_prefix}git log -1 --format='%h %s' 2>/dev/null || echo 'OK')"
  else
    # Intentar sin especificar remote/branch
    if ${sudo_prefix}git pull 2>/dev/null; then
      ok "Código actualizado"
    else
      fail "Error en git pull"
      return 1
    fi
  fi

  # 2. Instalar dependencias
  info "Instalando dependencias..."
  if eval "${sudo_prefix}$install_cmd" --silent 2>/dev/null || eval "${sudo_prefix}$install_cmd" 2>/dev/null; then
    ok "Dependencias OK"
  else
    fail "Error instalando dependencias"
    return 1
  fi

  # 3. Build
  info "Compilando..."
  if eval "${sudo_prefix}$build_cmd" 2>&1 | tail -5; then
    ok "Build completado"
  else
    fail "Error en build"
    return 1
  fi

  # 4. Reiniciar PM2
  info "Reiniciando PM2 (${pm2name})..."
  if ${sudo_prefix}pm2 describe "$pm2name" &>/dev/null; then
    eval "${sudo_prefix}$post_cmd" 2>/dev/null
    ok "Proceso reiniciado"
  else
    warn "Proceso '${pm2name}' no encontrado en PM2. Intentando arrancar..."
    if [ -f "$dir/ecosystem.config.cjs" ]; then
      ${sudo_prefix}pm2 start "$dir/ecosystem.config.cjs"
    else
      # Buscar el script principal
      if [ -f "$dir/server.js" ]; then
        ${sudo_prefix}pm2 start "$dir/server.js" --name "$pm2name"
      elif [ -f "$dir/server/index.js" ]; then
        ${sudo_prefix}pm2 start "$dir/server/index.js" --name "$pm2name"
      elif [ -f "$dir/backend/server.js" ]; then
        ${sudo_prefix}pm2 start "$dir/backend/server.js" --name "$pm2name"
      else
        fail "No se encontró script para arrancar"
        return 1
      fi
    fi
    ${sudo_prefix}pm2 save
    ok "Proceso arrancado y guardado"
  fi

  ok "${label} actualizada correctamente"
  return 0
}

# ── Verificaciones previas ───────────────────────────────────

if ! command -v pm2 &>/dev/null; then
  echo -e "${RED}[✗] PM2 no encontrado. Instala con: npm install -g pm2${NC}"
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo -e "${RED}[✗] Node.js no encontrado.${NC}"
  exit 1
fi

# ── Lógica principal ─────────────────────────────────────────

print_header

SUCCEEDED=0
FAILED=0
SKIPPED=0
UPDATED_NAMES=()

run_updates() {
  local indices=("$@")
  local start_time=$(date +%s)

  for idx in "${indices[@]}"; do
    IFS='|' read -r _ _ _ _ _ label <<< "${APPS[$idx]}"
    if update_app "$idx"; then
      ((SUCCEEDED++))
      UPDATED_NAMES+=("$label")
    else
      ((FAILED++))
    fi
  done

  local end_time=$(date +%s)
  local elapsed=$((end_time - start_time))

  # Resumen final
  echo ""
  separator
  echo -e "${BOLD}${CYAN}  Resumen de actualización${NC}"
  separator
  echo ""
  if [ $SUCCEEDED -gt 0 ]; then
    ok "${SUCCEEDED} aplicación(es) actualizada(s) correctamente"
    for name in "${UPDATED_NAMES[@]}"; do
      echo -e "    ${GREEN}•${NC} ${name}"
    done
  fi
  [ $FAILED -gt 0 ] && fail "${FAILED} aplicación(es) con errores"
  echo ""
  info "Tiempo total: ${elapsed}s"
  echo ""

  # Guardar estado PM2
  pm2 save --force 2>/dev/null
  ok "Estado PM2 guardado"
  
  # Verificar si se actualizó intranet para guardar su PM2 también
  local includes_intranet=0
  for name in "${UPDATED_NAMES[@]}"; do
    if [[ "$name" == *"Intranet"* ]]; then
      includes_intranet=1
    fi
  done

  if [ "$includes_intranet" -eq 1 ]; then
    sudo pm2 save --force 2>/dev/null
    ok "Estado PM2 (root) guardado"
  fi
  echo ""

  # Mostrar estado PM2
  pm2 status
  if [ "$includes_intranet" -eq 1 ]; then
    echo ""
    info "Estado de PM2 (root):"
    sudo pm2 status
  fi
  echo ""
}

# ── Modo por argumentos ──────────────────────────────────────

if [ $# -gt 0 ]; then
  if [ "$1" = "--all" ] || [ "$1" = "-a" ]; then
    # Actualizar todo
    indices=()
    for i in "${!APPS[@]}"; do
      indices+=("$i")
    done
    run_updates "${indices[@]}"
    exit 0
  fi

  # Números específicos como argumentos
  indices=()
  for arg in "$@"; do
    if [[ "$arg" =~ ^[1-5]$ ]]; then
      indices+=($((arg - 1)))
    else
      warn "Argumento ignorado: $arg (usa 1-${TOTAL})"
    fi
  done

  if [ ${#indices[@]} -gt 0 ]; then
    run_updates "${indices[@]}"
  else
    fail "No se especificaron apps válidas."
    exit 1
  fi
  exit 0
fi

# ── Modo interactivo ─────────────────────────────────────────

print_menu

read -rp "$(echo -e "${BOLD}Selecciona (números separados por espacio, A=todas, Q=salir): ${NC}")" choice

case "$choice" in
  [qQ])
    echo ""
    info "Saliendo sin cambios."
    exit 0
    ;;
  [aA])
    indices=()
    for i in "${!APPS[@]}"; do
      indices+=("$i")
    done
    run_updates "${indices[@]}"
    ;;
  *)
    indices=()
    for num in $choice; do
      if [[ "$num" =~ ^[1-5]$ ]]; then
        indices+=($((num - 1)))
      else
        warn "Opción ignorada: $num"
      fi
    done

    if [ ${#indices[@]} -eq 0 ]; then
      fail "No se seleccionaron apps válidas."
      exit 1
    fi

    run_updates "${indices[@]}"
    ;;
esac
