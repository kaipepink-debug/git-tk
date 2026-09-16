/**
 * @file tiktokClickId.ts
 * @description Compatibilidade: a captura de identificadores passou a viver em
 * `src/lib/tracking/attribution.ts` (que também guarda UTMs e IDs de campanha).
 * Este arquivo apenas reexporta as funções para não quebrar importações antigas.
 */

export {
  captureAttribution as captureTikTokClickId,
  getTikTokClickId,
  getTikTokTtp,
} from "@/lib/tracking/attribution";
