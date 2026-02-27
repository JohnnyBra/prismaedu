import { AvatarItem } from './types';
import React from 'react';

// Avatar Assets Data
// SVGs are designed for a 100x100 viewBox humanoid body:
// Head center: (50, 22), r=16. Neck: (50, 38-44). Torso: (30-70, 44-68).
// Arms: (18-30, 46-66) and (70-82, 46-66). Legs: (34-46, 68-90) and (54-66, 68-90). Feet: (32-48, 90-98) and (52-68, 90-98).

export const AVATAR_ITEMS: AvatarItem[] = [
  // ═══════════════════════════════════════
  // BASES (skin/body colors) — rendered as the body fill
  // IDs base_1, base_2, base_3 MUST keep original meaning for existing users
  // ═══════════════════════════════════════
  { id: 'base_1', type: 'base', name: 'Piel Clara', cost: 0,
    svg: '<circle cx="50" cy="22" r="16" fill="#FDCFA1"/><rect x="46" y="36" width="8" height="8" rx="2" fill="#FDCFA1"/><ellipse cx="50" cy="56" rx="20" ry="14" fill="#FDCFA1"/><ellipse cx="24" cy="54" rx="6" ry="12" fill="#FDCFA1"/><ellipse cx="76" cy="54" rx="6" ry="12" fill="#FDCFA1"/><rect x="36" y="68" width="12" height="22" rx="4" fill="#FDCFA1"/><rect x="52" y="68" width="12" height="22" rx="4" fill="#FDCFA1"/>' },
  { id: 'base_2', type: 'base', name: 'Piel Oscura', cost: 0,
    svg: '<circle cx="50" cy="22" r="16" fill="#8D5524"/><rect x="46" y="36" width="8" height="8" rx="2" fill="#8D5524"/><ellipse cx="50" cy="56" rx="20" ry="14" fill="#8D5524"/><ellipse cx="24" cy="54" rx="6" ry="12" fill="#8D5524"/><ellipse cx="76" cy="54" rx="6" ry="12" fill="#8D5524"/><rect x="36" y="68" width="12" height="22" rx="4" fill="#8D5524"/><rect x="52" y="68" width="12" height="22" rx="4" fill="#8D5524"/>' },
  { id: 'base_3', type: 'base', name: 'Robot', cost: 100,
    svg: '<rect x="34" y="6" width="32" height="32" rx="6" fill="#9CA3AF" stroke="#6B7280" stroke-width="1.5"/><circle cx="42" cy="20" r="4" fill="#60A5FA"/><circle cx="58" cy="20" r="4" fill="#60A5FA"/><rect x="44" y="28" width="12" height="2" rx="1" fill="#6B7280"/><rect x="46" y="36" width="8" height="6" rx="2" fill="#9CA3AF"/><rect x="30" y="42" width="40" height="28" rx="6" fill="#9CA3AF" stroke="#6B7280" stroke-width="1.5"/><rect x="52" y="48" width="8" height="3" rx="1" fill="#34D399"/><rect x="40" y="48" width="8" height="3" rx="1" fill="#34D399"/><rect x="18" y="44" width="10" height="22" rx="4" fill="#9CA3AF" stroke="#6B7280" stroke-width="1"/><rect x="72" y="44" width="10" height="22" rx="4" fill="#9CA3AF" stroke="#6B7280" stroke-width="1"/><rect x="34" y="70" width="14" height="22" rx="4" fill="#9CA3AF" stroke="#6B7280" stroke-width="1"/><rect x="52" y="70" width="14" height="22" rx="4" fill="#9CA3AF" stroke="#6B7280" stroke-width="1"/>' },
  { id: 'base_4', type: 'base', name: 'Piel Media', cost: 0,
    svg: '<circle cx="50" cy="22" r="16" fill="#D4A574"/><rect x="46" y="36" width="8" height="8" rx="2" fill="#D4A574"/><ellipse cx="50" cy="56" rx="20" ry="14" fill="#D4A574"/><ellipse cx="24" cy="54" rx="6" ry="12" fill="#D4A574"/><ellipse cx="76" cy="54" rx="6" ry="12" fill="#D4A574"/><rect x="36" y="68" width="12" height="22" rx="4" fill="#D4A574"/><rect x="52" y="68" width="12" height="22" rx="4" fill="#D4A574"/>' },
  { id: 'base_5', type: 'base', name: 'Alien Verde', cost: 150,
    svg: '<ellipse cx="50" cy="22" rx="18" ry="18" fill="#86EFAC"/><ellipse cx="40" cy="18" r="6" fill="#000"/><ellipse cx="40" cy="18" r="3" fill="#22C55E"/><ellipse cx="60" cy="18" r="6" fill="#000"/><ellipse cx="60" cy="18" r="3" fill="#22C55E"/><ellipse cx="50" cy="30" rx="3" ry="1.5" fill="#166534"/><rect x="46" y="36" width="8" height="8" rx="2" fill="#86EFAC"/><ellipse cx="50" cy="56" rx="18" ry="13" fill="#86EFAC"/><ellipse cx="24" cy="54" rx="5" ry="11" fill="#86EFAC"/><ellipse cx="76" cy="54" rx="5" ry="11" fill="#86EFAC"/><rect x="36" y="68" width="12" height="22" rx="4" fill="#86EFAC"/><rect x="52" y="68" width="12" height="22" rx="4" fill="#86EFAC"/>' },

  // ═══════════════════════════════════════
  // HAIR — rendered above body, below accessories
  // ═══════════════════════════════════════
  { id: 'hair_1', type: 'hair', name: 'Pelo Corto', cost: 0,
    svg: '<path d="M34 22 Q34 6 50 6 Q66 6 66 22 Q66 14 50 12 Q34 14 34 22Z" fill="#4A3728"/>' },
  { id: 'hair_2', type: 'hair', name: 'Pelo Largo', cost: 30,
    svg: '<path d="M33 22 Q33 4 50 4 Q67 4 67 22 L68 42 Q68 46 64 44 L64 26 Q64 14 50 12 Q36 14 36 26 L36 44 Q32 46 32 42Z" fill="#8B5E3C"/>' },
  { id: 'hair_3', type: 'hair', name: 'Cresta Punk', cost: 80,
    svg: '<path d="M34 22 Q34 8 50 8 Q66 8 66 22 Q64 16 50 14 Q36 16 34 22Z" fill="#1E1E1E"/><path d="M44 12 L44 0 Q48 4 50 0 Q52 4 56 0 L56 12 Q52 10 50 12 Q48 10 44 12Z" fill="#EF4444"/>' },
  { id: 'hair_4', type: 'hair', name: 'Coletas', cost: 50,
    svg: '<path d="M34 22 Q34 6 50 6 Q66 6 66 22 Q64 14 50 12 Q36 14 34 22Z" fill="#F59E0B"/><ellipse cx="30" cy="26" rx="5" ry="8" fill="#F59E0B"/><ellipse cx="70" cy="26" rx="5" ry="8" fill="#F59E0B"/><circle cx="30" cy="18" r="3" fill="#EC4899"/><circle cx="70" cy="18" r="3" fill="#EC4899"/>' },
  { id: 'hair_5', type: 'hair', name: 'Afro', cost: 100,
    svg: '<ellipse cx="50" cy="18" rx="24" ry="22" fill="#3D2B1F"/><circle cx="50" cy="22" r="16" fill="none"/>' },
  { id: 'hair_6', type: 'hair', name: 'Melena Lisa', cost: 40,
    svg: '<path d="M32 22 Q32 4 50 4 Q68 4 68 22 L70 38 Q70 42 66 40 L66 24 Q64 10 50 10 Q36 10 34 24 L34 40 Q30 42 30 38Z" fill="#1A1A2E"/>' },
  { id: 'hair_7', type: 'hair', name: 'Pelo Arcoíris', cost: 300,
    svg: '<path d="M33 24 Q33 4 50 4 Q67 4 67 24 L68 40 Q68 44 64 42 L64 26 Q64 12 50 10 Q36 12 36 26 L36 42 Q32 44 32 40Z" fill="url(#rainbowHair)"/><defs><linearGradient id="rainbowHair" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#EF4444"/><stop offset="25%" stop-color="#F59E0B"/><stop offset="50%" stop-color="#22C55E"/><stop offset="75%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#A855F7"/></linearGradient></defs>' },
  { id: 'hair_8', type: 'hair', name: 'Calvo con Gorra', cost: 50,
    svg: '<path d="M30 22 L70 22 L72 26 L28 26Z" fill="#1E40AF"/><path d="M32 22 Q32 8 50 8 Q68 8 68 22Z" fill="#1E40AF"/><rect x="26" y="22" width="48" height="4" rx="1" fill="#1E3A8A"/><rect x="62" y="14" width="10" height="10" rx="2" fill="#1E3A8A"/>' },

  // ═══════════════════════════════════════
  // TOPS (shirts/jackets) — rendered over torso
  // IDs top_1, top_2, top_3 MUST keep original meaning for existing users
  // ═══════════════════════════════════════
  { id: 'top_1', type: 'top', name: 'Camiseta Roja', cost: 0,
    svg: '<path d="M30 44 Q30 42 34 40 L46 38 L54 38 L66 40 Q70 42 70 44 L70 68 Q70 70 68 70 L32 70 Q30 70 30 68Z" fill="#EF4444"/><path d="M34 40 L18 48 L18 60 Q18 62 20 62 L30 58 L30 44Z" fill="#DC2626"/><path d="M66 40 L82 48 L82 60 Q82 62 80 62 L70 58 L70 44Z" fill="#DC2626"/><path d="M42 38 Q50 42 58 38" fill="none" stroke="#B91C1C" stroke-width="1.5"/>' },
  { id: 'top_2', type: 'top', name: 'Camisa Azul', cost: 50,
    svg: '<path d="M30 44 Q30 42 34 40 L46 38 L54 38 L66 40 Q70 42 70 44 L70 68 Q70 70 68 70 L32 70 Q30 70 30 68Z" fill="#3B82F6"/><path d="M34 40 L18 48 L18 60 Q18 62 20 62 L30 58 L30 44Z" fill="#2563EB"/><path d="M66 40 L82 48 L82 60 Q82 62 80 62 L70 58 L70 44Z" fill="#2563EB"/><line x1="50" y1="40" x2="50" y2="70" stroke="#1D4ED8" stroke-width="1"/><circle cx="50" cy="48" r="1.5" fill="#DBEAFE"/><circle cx="50" cy="56" r="1.5" fill="#DBEAFE"/><circle cx="50" cy="64" r="1.5" fill="#DBEAFE"/><path d="M42 38 L46 42 L50 38 L54 42 L58 38" fill="none" stroke="#1E40AF" stroke-width="1"/>' },
  { id: 'top_3', type: 'top', name: 'Armadura Dorada', cost: 500,
    svg: '<path d="M28 44 Q28 40 34 38 L46 36 L54 36 L66 38 Q72 40 72 44 L72 70 Q72 72 70 72 L30 72 Q28 72 28 70Z" fill="#EAB308" stroke="#A16207" stroke-width="1.5"/><path d="M34 38 L14 46 L14 62 Q14 64 16 64 L28 60 L28 44Z" fill="#CA8A04" stroke="#A16207" stroke-width="1"/><path d="M66 38 L86 46 L86 62 Q86 64 84 64 L72 60 L72 44Z" fill="#CA8A04" stroke="#A16207" stroke-width="1"/><path d="M40 44 L50 40 L60 44 L56 52 L50 48 L44 52Z" fill="#FDE047" stroke="#A16207" stroke-width="0.8"/><line x1="50" y1="52" x2="50" y2="70" stroke="#A16207" stroke-width="1"/><rect x="34" y="62" width="32" height="4" rx="1" fill="#CA8A04" stroke="#A16207" stroke-width="0.8"/>' },
  { id: 'top_4', type: 'top', name: 'Sudadera Verde', cost: 40,
    svg: '<path d="M28 44 Q28 42 34 40 L46 38 L54 38 L66 40 Q72 42 72 44 L72 70 Q72 72 70 72 L30 72 Q28 72 28 70Z" fill="#22C55E"/><path d="M34 40 L16 48 L16 62 Q16 64 18 64 L28 60 L28 44Z" fill="#16A34A"/><path d="M66 40 L84 48 L84 62 Q84 64 82 64 L72 60 L72 44Z" fill="#16A34A"/><path d="M40 56 Q50 60 60 56 L60 68 Q50 72 40 68Z" fill="#15803D" opacity="0.5"/><path d="M42 38 Q50 42 58 38" fill="none" stroke="#166534" stroke-width="2"/>' },
  { id: 'top_5', type: 'top', name: 'Camiseta Rayas', cost: 30,
    svg: '<path d="M30 44 Q30 42 34 40 L46 38 L54 38 L66 40 Q70 42 70 44 L70 68 Q70 70 68 70 L32 70 Q30 70 30 68Z" fill="#FFF"/><path d="M34 40 L18 48 L18 60 Q18 62 20 62 L30 58 L30 44Z" fill="#EEE"/><path d="M66 40 L82 48 L82 60 Q82 62 80 62 L70 58 L70 44Z" fill="#EEE"/><rect x="30" y="46" width="40" height="4" fill="#1E40AF"/><rect x="30" y="54" width="40" height="4" fill="#1E40AF"/><rect x="30" y="62" width="40" height="4" fill="#1E40AF"/>' },
  { id: 'top_6', type: 'top', name: 'Chaleco Vaquero', cost: 80,
    svg: '<path d="M30 44 L46 38 L54 38 L70 44 L70 68 L32 68Z" fill="#6B7280"/><path d="M30 44 L46 38 L46 68 L30 68Z" fill="#4B5563"/><path d="M54 38 L70 44 L70 68 L54 68Z" fill="#4B5563"/><line x1="46" y1="38" x2="46" y2="68" stroke="#374151" stroke-width="1"/><line x1="54" y1="38" x2="54" y2="68" stroke="#374151" stroke-width="1"/><circle cx="36" cy="50" r="1.5" fill="#9CA3AF"/><circle cx="64" cy="50" r="1.5" fill="#9CA3AF"/>' },
  { id: 'top_7', type: 'top', name: 'Jersey Navideño', cost: 150,
    svg: '<path d="M28 44 Q28 42 34 40 L46 38 L54 38 L66 40 Q72 42 72 44 L72 70 Q72 72 70 72 L30 72 Q28 72 28 70Z" fill="#DC2626"/><path d="M34 40 L16 48 L16 62 Q16 64 18 64 L28 60 L28 44Z" fill="#B91C1C"/><path d="M66 40 L84 48 L84 62 Q84 64 82 64 L72 60 L72 44Z" fill="#B91C1C"/><path d="M36 50 L40 46 L44 50 L48 46 L52 50 L56 46 L60 50 L64 46" fill="none" stroke="#FFF" stroke-width="1.5"/><path d="M36 58 L40 54 L44 58 L48 54 L52 58 L56 54 L60 58 L64 54" fill="none" stroke="#22C55E" stroke-width="1.5"/><circle cx="50" cy="64" r="3" fill="#FDE047"/><polygon points="50,61 51.2,63.5 53.8,63.8 51.9,65.5 52.4,68 50,66.7 47.6,68 48.1,65.5 46.2,63.8 48.8,63.5" fill="#FDE047"/>' },
  { id: 'top_8', type: 'top', name: 'Camiseta Espacial', cost: 200,
    svg: '<path d="M30 44 Q30 42 34 40 L46 38 L54 38 L66 40 Q70 42 70 44 L70 68 Q70 70 68 70 L32 70 Q30 70 30 68Z" fill="#1E1B4B"/><path d="M34 40 L18 48 L18 60 Q18 62 20 62 L30 58 L30 44Z" fill="#312E81"/><path d="M66 40 L82 48 L82 60 Q82 62 80 62 L70 58 L70 44Z" fill="#312E81"/><circle cx="40" cy="52" r="1" fill="#FDE047"/><circle cx="56" cy="48" r="1.5" fill="#FDE047"/><circle cx="48" cy="60" r="0.8" fill="#FDE047"/><circle cx="62" cy="56" r="1" fill="#FDE047"/><circle cx="36" cy="62" r="0.8" fill="#FDE047"/><path d="M45 54 L50 46 L55 54 L52 52 L50 58 L48 52Z" fill="#A855F7"/><circle cx="50" cy="64" r="4" fill="none" stroke="#6366F1" stroke-width="1"/><ellipse cx="50" cy="64" rx="6" ry="2" fill="none" stroke="#6366F1" stroke-width="0.8"/>' },
  { id: 'top_9', type: 'top', name: 'Túnica de Mago', cost: 400,
    svg: '<path d="M26 40 Q26 38 34 36 L46 34 L54 34 L66 36 Q74 38 74 40 L76 78 Q76 80 74 80 L26 80 Q24 80 24 78Z" fill="#7C3AED"/><path d="M34 36 L12 46 L12 66 Q12 68 14 68 L26 62 L26 40Z" fill="#6D28D9"/><path d="M66 36 L88 46 L88 66 Q88 68 86 68 L74 62 L74 40Z" fill="#6D28D9"/><circle cx="42" cy="52" r="2" fill="#FDE047"/><circle cx="58" cy="58" r="2" fill="#FDE047"/><circle cx="50" cy="46" r="2.5" fill="#FDE047"/><path d="M42 52 L50 46 L58 58" fill="none" stroke="#FDE047" stroke-width="0.5" stroke-dasharray="2,2"/>' },
  { id: 'top_10', type: 'top', name: 'Uniforme Superhéroe', cost: 750,
    svg: '<path d="M30 44 Q30 42 34 40 L46 38 L54 38 L66 40 Q70 42 70 44 L70 68 Q70 70 68 70 L32 70 Q30 70 30 68Z" fill="#DC2626"/><path d="M34 40 L18 48 L18 60 Q18 62 20 62 L30 58 L30 44Z" fill="#1E40AF"/><path d="M66 40 L82 48 L82 60 Q82 62 80 62 L70 58 L70 44Z" fill="#1E40AF"/><path d="M44 48 L50 42 L56 48 L56 62 L44 62Z" fill="#FDE047" stroke="#EAB308" stroke-width="1"/><path d="M47 52 L50 48 L53 52 L53 58 L47 58Z" fill="#DC2626"/>' },

  // ═══════════════════════════════════════
  // BOTTOMS (pants/skirts) — rendered over legs
  // ═══════════════════════════════════════
  { id: 'bot_1', type: 'bottom', name: 'Vaqueros', cost: 0,
    svg: '<path d="M30 66 L70 66 L70 70 L58 70 L58 90 Q58 92 56 92 L54 92 L54 70 L46 70 L46 92 L44 92 Q42 92 42 90 L42 70 L30 70Z" fill="#3B82F6"/><line x1="50" y1="66" x2="50" y2="70" stroke="#1D4ED8" stroke-width="1"/><rect x="44" y="66" width="12" height="4" rx="1" fill="none" stroke="#1D4ED8" stroke-width="0.5"/>' },
  { id: 'bot_2', type: 'bottom', name: 'Pantalón Chándal', cost: 25,
    svg: '<path d="M28 66 L72 66 L72 70 L60 70 L60 92 Q60 94 58 94 L52 94 L52 70 L48 70 L48 94 L42 94 Q40 94 40 92 L40 70 L28 70Z" fill="#374151"/><line x1="30" y1="68" x2="72" y2="68" stroke="#4B5563" stroke-width="1"/><line x1="44" y1="70" x2="44" y2="90" stroke="#4B5563" stroke-width="0.8"/><line x1="56" y1="70" x2="56" y2="90" stroke="#4B5563" stroke-width="0.8"/>' },
  { id: 'bot_3', type: 'bottom', name: 'Falda', cost: 40,
    svg: '<path d="M30 66 L70 66 L74 86 Q74 88 72 88 L28 88 Q26 88 26 86Z" fill="#EC4899"/><line x1="40" y1="66" x2="36" y2="88" stroke="#DB2777" stroke-width="0.8"/><line x1="50" y1="66" x2="50" y2="88" stroke="#DB2777" stroke-width="0.8"/><line x1="60" y1="66" x2="64" y2="88" stroke="#DB2777" stroke-width="0.8"/>' },
  { id: 'bot_4', type: 'bottom', name: 'Shorts Deportivos', cost: 20,
    svg: '<path d="M30 66 L70 66 L70 70 L60 70 L60 80 Q60 82 58 82 L52 82 L52 70 L48 70 L48 82 L42 82 Q40 82 40 80 L40 70 L30 70Z" fill="#F97316"/><line x1="50" y1="66" x2="50" y2="70" stroke="#EA580C" stroke-width="1"/><line x1="30" y1="68" x2="70" y2="68" stroke="#EA580C" stroke-width="0.8"/>' },
  { id: 'bot_5', type: 'bottom', name: 'Pantalón Camuflaje', cost: 120,
    svg: '<path d="M30 66 L70 66 L70 70 L58 70 L58 90 Q58 92 56 92 L54 92 L54 70 L46 70 L46 92 L44 92 Q42 92 42 90 L42 70 L30 70Z" fill="#4D7C0F"/><ellipse cx="38" cy="72" rx="4" ry="3" fill="#365314"/><ellipse cx="62" cy="74" rx="5" ry="3" fill="#365314"/><ellipse cx="44" cy="82" rx="3" ry="4" fill="#365314"/><ellipse cx="56" cy="86" rx="3" ry="3" fill="#365314"/><ellipse cx="50" cy="68" rx="6" ry="2" fill="#365314"/>' },
  { id: 'bot_6', type: 'bottom', name: 'Falda Tutú', cost: 200,
    svg: '<path d="M28 66 L72 66 L78 84 Q80 90 72 88 L50 92 L28 88 Q20 90 22 84Z" fill="#F0ABFC" opacity="0.8"/><path d="M30 66 L70 66 L76 82 Q78 88 70 86 L50 90 L30 86 Q22 88 24 82Z" fill="#E879F9" opacity="0.6"/><path d="M32 66 L68 66 L72 78 Q74 84 66 82 L50 86 L34 82 Q26 84 28 78Z" fill="#D946EF" opacity="0.7"/>' },

  // ═══════════════════════════════════════
  // SHOES — rendered over feet
  // ═══════════════════════════════════════
  { id: 'shoes_1', type: 'shoes', name: 'Zapatillas Blancas', cost: 0,
    svg: '<path d="M34 88 L48 88 Q52 88 52 92 L52 96 Q52 98 48 98 L30 98 Q28 98 28 96 L28 92 Q28 88 34 88Z" fill="#F9FAFB" stroke="#D1D5DB" stroke-width="1"/><path d="M52 88 L66 88 Q72 88 72 92 L72 96 Q72 98 68 98 L48 98 Q48 98 48 96 L48 92 Q48 88 52 88Z" fill="#F9FAFB" stroke="#D1D5DB" stroke-width="1"/><line x1="32" y1="92" x2="46" y2="92" stroke="#3B82F6" stroke-width="1.5"/><line x1="54" y1="92" x2="68" y2="92" stroke="#3B82F6" stroke-width="1.5"/>' },
  { id: 'shoes_2', type: 'shoes', name: 'Botas de Aventura', cost: 80,
    svg: '<path d="M32 84 L48 84 Q52 84 52 88 L52 96 Q52 98 48 98 L26 98 Q24 98 24 96 L24 92 Q24 88 28 86Z" fill="#92400E" stroke="#78350F" stroke-width="1"/><path d="M52 84 L68 84 Q72 84 72 88 L72 96 Q72 98 68 98 L48 98 Q48 98 48 96 L48 92 Q48 84 52 84Z" fill="#92400E" stroke="#78350F" stroke-width="1"/><line x1="34" y1="86" x2="34" y2="96" stroke="#78350F" stroke-width="0.8"/><line x1="40" y1="86" x2="40" y2="96" stroke="#78350F" stroke-width="0.8"/><line x1="56" y1="86" x2="56" y2="96" stroke="#78350F" stroke-width="0.8"/><line x1="62" y1="86" x2="62" y2="96" stroke="#78350F" stroke-width="0.8"/>' },
  { id: 'shoes_3', type: 'shoes', name: 'Chanclas', cost: 20,
    svg: '<rect x="30" y="92" width="18" height="6" rx="3" fill="#F59E0B"/><rect x="52" y="92" width="18" height="6" rx="3" fill="#F59E0B"/><path d="M36 92 L39 86 M42 92 L39 86" stroke="#D97706" stroke-width="1.5" fill="none"/><path d="M58 92 L61 86 M64 92 L61 86" stroke="#D97706" stroke-width="1.5" fill="none"/>' },
  { id: 'shoes_4', type: 'shoes', name: 'Zapatos de Payaso', cost: 300,
    svg: '<ellipse cx="34" cy="94" rx="18" ry="6" fill="#EF4444"/><ellipse cx="66" cy="94" rx="18" ry="6" fill="#3B82F6"/><circle cx="20" cy="92" r="4" fill="#FDE047"/><circle cx="80" cy="92" r="4" fill="#FDE047"/><circle cx="34" cy="92" r="2" fill="#FFF"/><circle cx="66" cy="92" r="2" fill="#FFF"/>' },
  { id: 'shoes_5', type: 'shoes', name: 'Patines', cost: 200,
    svg: '<path d="M32 86 L48 86 Q50 86 50 88 L50 94 L30 94 L30 88 Q30 86 32 86Z" fill="#FFF" stroke="#D1D5DB" stroke-width="1"/><path d="M52 86 L68 86 Q70 86 70 88 L70 94 L50 94 L50 88 Q50 86 52 86Z" fill="#FFF" stroke="#D1D5DB" stroke-width="1"/><rect x="28" y="94" width="24" height="3" rx="1" fill="#6B7280"/><rect x="48" y="94" width="24" height="3" rx="1" fill="#6B7280"/><circle cx="32" cy="98" r="2" fill="#EF4444"/><circle cx="40" cy="98" r="2" fill="#EF4444"/><circle cx="48" cy="98" r="2" fill="#EF4444"/><circle cx="52" cy="98" r="2" fill="#EF4444"/><circle cx="60" cy="98" r="2" fill="#EF4444"/><circle cx="68" cy="98" r="2" fill="#EF4444"/>' },
  { id: 'shoes_6', type: 'shoes', name: 'Botas Espaciales', cost: 400,
    svg: '<path d="M30 82 L50 82 Q54 82 54 86 L54 96 Q54 98 50 98 L26 98 Q22 98 22 96 L22 90 Q22 84 30 82Z" fill="#E5E7EB" stroke="#9CA3AF" stroke-width="1.5"/><path d="M50 82 L70 82 Q74 82 74 86 L74 96 Q74 98 70 98 L46 98 Q46 98 46 96 L46 90 Q46 84 50 82Z" fill="#E5E7EB" stroke="#9CA3AF" stroke-width="1.5"/><rect x="28" y="86" width="22" height="3" rx="1" fill="#60A5FA"/><rect x="50" y="86" width="22" height="3" rx="1" fill="#60A5FA"/><circle cx="36" cy="92" r="1.5" fill="#34D399"/><circle cx="58" cy="92" r="1.5" fill="#34D399"/>' },

  // ═══════════════════════════════════════
  // ACCESSORIES — rendered on top of everything
  // ═══════════════════════════════════════
  { id: 'acc_1', type: 'accessory', name: 'Gafas', cost: 30,
    svg: '<ellipse cx="40" cy="22" rx="8" ry="6" fill="none" stroke="#1E293B" stroke-width="2"/><ellipse cx="60" cy="22" rx="8" ry="6" fill="none" stroke="#1E293B" stroke-width="2"/><line x1="48" y1="22" x2="52" y2="22" stroke="#1E293B" stroke-width="2"/><line x1="32" y1="20" x2="28" y2="18" stroke="#1E293B" stroke-width="1.5"/><line x1="68" y1="20" x2="72" y2="18" stroke="#1E293B" stroke-width="1.5"/>' },
  { id: 'acc_2', type: 'accessory', name: 'Corona', cost: 1000,
    svg: '<path d="M34 10 L38 2 L44 8 L50 0 L56 8 L62 2 L66 10 L66 16 Q66 18 64 18 L36 18 Q34 18 34 16Z" fill="#FDE047" stroke="#EAB308" stroke-width="1.5"/><circle cx="44" cy="12" r="2" fill="#EF4444"/><circle cx="50" cy="8" r="2" fill="#3B82F6"/><circle cx="56" cy="12" r="2" fill="#22C55E"/>' },
  { id: 'acc_3', type: 'accessory', name: 'Sombrero Pirata', cost: 150,
    svg: '<path d="M28 18 Q28 4 50 2 Q72 4 72 18Z" fill="#1E1E1E"/><rect x="26" y="18" width="48" height="4" rx="1" fill="#1E1E1E"/><path d="M40 10 L50 6 L60 10 L56 14 L44 14Z" fill="#FFF" opacity="0.9"/><path d="M47 9 L50 7 L53 9 L53 12 L47 12Z" fill="#1E1E1E"/>' },
  { id: 'acc_4', type: 'accessory', name: 'Auriculares', cost: 80,
    svg: '<path d="M30 22 Q30 8 50 8 Q70 8 70 22" fill="none" stroke="#374151" stroke-width="3"/><rect x="26" y="18" width="8" height="12" rx="3" fill="#6B7280" stroke="#374151" stroke-width="1"/><rect x="66" y="18" width="8" height="12" rx="3" fill="#6B7280" stroke="#374151" stroke-width="1"/><rect x="28" y="20" width="4" height="6" rx="1" fill="#A855F7"/><rect x="68" y="20" width="4" height="6" rx="1" fill="#A855F7"/>' },
  { id: 'acc_5', type: 'accessory', name: 'Bufanda', cost: 50,
    svg: '<path d="M36 34 Q50 38 64 34 L66 36 Q50 42 34 36Z" fill="#EF4444"/><path d="M36 36 Q50 40 64 36 L66 38 Q50 44 34 38Z" fill="#DC2626"/><path d="M62 36 L66 48 Q66 50 64 50 L60 50 Q58 50 58 48 L58 38" fill="#EF4444"/><line x1="60" y1="40" x2="64" y2="40" stroke="#B91C1C" stroke-width="0.8"/><line x1="60" y1="44" x2="64" y2="44" stroke="#B91C1C" stroke-width="0.8"/>' },
  { id: 'acc_6', type: 'accessory', name: 'Alas de Ángel', cost: 500,
    svg: '<path d="M30 44 Q10 36 6 52 Q4 62 16 58 Q8 66 20 62 Q14 72 28 66 L30 60Z" fill="#FFF" opacity="0.7" stroke="#E2E8F0" stroke-width="0.8"/><path d="M70 44 Q90 36 94 52 Q96 62 84 58 Q92 66 80 62 Q86 72 72 66 L70 60Z" fill="#FFF" opacity="0.7" stroke="#E2E8F0" stroke-width="0.8"/>' },
  { id: 'acc_7', type: 'accessory', name: 'Capa de Superhéroe', cost: 350,
    svg: '<path d="M34 38 L30 40 L22 80 Q20 86 28 84 L40 78 L50 82 L60 78 L72 84 Q80 86 78 80 L70 40 L66 38" fill="#DC2626" opacity="0.85"/><path d="M34 38 L30 40 L24 74" fill="none" stroke="#B91C1C" stroke-width="0.8"/><path d="M66 38 L70 40 L76 74" fill="none" stroke="#B91C1C" stroke-width="0.8"/>' },
  { id: 'acc_8', type: 'accessory', name: 'Antena Alien', cost: 100,
    svg: '<line x1="42" y1="8" x2="38" y2="-4" stroke="#22C55E" stroke-width="2"/><line x1="58" y1="8" x2="62" y2="-4" stroke="#22C55E" stroke-width="2"/><circle cx="38" cy="-6" r="3" fill="#86EFAC"/><circle cx="62" cy="-6" r="3" fill="#86EFAC"/><circle cx="38" cy="-6" r="1.5" fill="#22C55E"/><circle cx="62" cy="-6" r="1.5" fill="#22C55E"/>' },
  { id: 'acc_9', type: 'accessory', name: 'Máscara de Ninja', cost: 200,
    svg: '<rect x="32" y="16" width="36" height="12" rx="4" fill="#1E1E1E"/><rect x="36" y="20" width="10" height="4" rx="1" fill="#FFF"/><rect x="54" y="20" width="10" height="4" rx="1" fill="#FFF"/><path d="M32 22 L24 24 L22 20" fill="none" stroke="#1E1E1E" stroke-width="2"/><path d="M68 22 L76 24 L78 20" fill="none" stroke="#1E1E1E" stroke-width="2"/>' },
  { id: 'acc_10', type: 'accessory', name: 'Varita Mágica', cost: 250,
    svg: '<line x1="80" y1="64" x2="88" y2="40" stroke="#92400E" stroke-width="2.5" stroke-linecap="round"/><polygon points="88,40 86,34 90,32 94,34 92,40" fill="#FDE047" stroke="#EAB308" stroke-width="0.8"/><circle cx="86" cy="32" r="1" fill="#FFF"/><circle cx="92" cy="30" r="1" fill="#FFF"/><circle cx="90" cy="36" r="0.8" fill="#FFF"/>' },
];

export const INITIAL_CLASSES = [
  { id: 'classA', name: '4º A - Primaria' },
  { id: 'classB', name: '4º B - Primaria' },
];

// Initial Tasks
export const INITIAL_TASKS = [
  { id: 't1', title: 'Completar ficha de Mates', points: 15, icon: 'Calculator', context: 'SCHOOL', assignedTo: [], createdBy: 'tutor1', isPriority: true },
  { id: 't2', title: 'Ayudar a un compañero', points: 10, icon: 'Users', context: 'SCHOOL', assignedTo: [], createdBy: 'tutor1', isPriority: false },
  { id: 't3', title: 'Limpiar tu habitación', points: 20, icon: 'Home', context: 'HOME', assignedTo: [], createdBy: 'parent1', isPriority: false },
  { id: 't4', title: 'Leer 20 minutos', points: 15, icon: 'BookOpen', context: 'HOME', assignedTo: [], createdBy: 'parent1', isPriority: false },
];

export const INITIAL_REWARDS = [
  { id: 'r1', title: 'Sentarse con un amigo', cost: 50, icon: 'Users', context: 'SCHOOL', stock: 10 },
  { id: 'r2', title: 'Pase sin deberes', cost: 100, icon: 'FileCheck', context: 'SCHOOL', stock: 5 },
  { id: 'r3', title: '30 Minutos TV', cost: 40, icon: 'Tv', context: 'HOME' },
  { id: 'r4', title: 'Salida a por Helado', cost: 200, icon: 'IceCream', context: 'HOME' },
];