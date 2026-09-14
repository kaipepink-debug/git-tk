/**
 * @file ConsentBanner.tsx
 * @description Aviso de cookies exibido apenas a visitantes de regiões que exigem
 * consentimento prévio (EEE, Reino Unido, Suíça ou região não identificada).
 *
 * Recusar é tão fácil quanto aceitar, e a escolha pode ser alterada depois pelo
 * link "Cookies" (evento global "open-cookie-settings").
 */

import { useEffect, useState } from "react";
import {
  getConsentRecord,
  onConsentChange,
  regionRequiresConsent,
  setConsentChoice,
} from "@/lib/consent";

/**
 * Componente do aviso de consentimento.
 *
 * @returns {JSX.Element | null} O aviso, ou null quando não deve ser exibido.
 */
const ConsentBanner = () => {
  const [visible, setVisible] = useState(false);

  // Decide a exibição: só aparece em região regulada e sem escolha registrada.
  useEffect(() => {
    let active = true;

    const evaluate = async () => {
      const record = getConsentRecord();
      if (record) {
        if (active) setVisible(false);
        return;
      }
      const required = await regionRequiresConsent();
      if (active) setVisible(required);
    };

    evaluate();

    // Permite reabrir o aviso a partir de um link "Cookies" na página.
    const openSettings = () => setVisible(true);
    window.addEventListener("open-cookie-settings", openSettings);
    const unsubscribe = onConsentChange(() => setVisible(false));

    return () => {
      active = false;
      window.removeEventListener("open-cookie-settings", openSettings);
      unsubscribe();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] p-3"
      role="dialog"
      aria-label="Aviso de cookies"
    >
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-background p-4 shadow-lg">
        <p className="text-sm text-foreground font-semibold mb-1">Cookies e publicidade</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Usamos cookies para medir os resultados dos nossos anúncios. Com a sua permissão,
          enviamos dados de navegação e de compra (páginas vistas, itens do carrinho e valor
          do pedido) ao TikTok, para medição e otimização dos anúncios. Você pode recusar e
          mudar de opinião quando quiser.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setConsentChoice("denied")}
            className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-semibold text-foreground"
          >
            Recusar
          </button>
          <button
            onClick={() => setConsentChoice("granted")}
            className="flex-1 rounded-lg px-3 py-2 text-sm font-semibold text-background"
            style={{ background: "#FF2B56" }}
          >
            Aceitar
          </button>
        </div>
        <a
          href="/politica-privacidade"
          className="mt-2 block text-center text-[11px] underline text-muted-foreground"
        >
          Política de Privacidade
        </a>
      </div>
    </div>
  );
};

export default ConsentBanner;
