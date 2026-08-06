/**
 * Rota: /adicionar-endereco
 * Propósito: Permite ao usuário cadastrar ou editar informações de entrega e contato
 * antes de finalizar a compra. Inclui validações de CPF, E-mail e busca automática de CEP.
 */

import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSessionTracker } from "@/hooks/useSessionTracker";
import CheckoutHeader from "@/components/CheckoutHeader";
import CheckoutTrustRow from "@/components/CheckoutTrustRow";

/**
 * Valida se uma string é um e-mail válido usando expressão regular.
 * @param email - String do e-mail a ser validado.
 * @returns Booleano indicando se o e-mail é válido.
 */
const validarEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Valida se o telefone tem pelo menos 10 dígitos numéricos.
 * @param tel - String do telefone.
 * @returns Booleano indicando se o telefone é válido.
 */
const validarTelefone = (tel: string) => tel.replace(/\D/g, "").length >= 10;

/**
 * Formata uma string numérica para o padrão de CPF (000.000.000-00).
 * @param value - String contendo números.
 * @returns String formatada como CPF.
 */
const formatarCpf = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

/**
 * Valida se o CPF é matematicamente válido (algoritmo de dígitos verificadores).
 * @param cpf - String do CPF formatado ou não.
 * @returns Booleano indicando se o CPF é legítimo.
 */
const validarCpf = (cpf: string) => {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(digits[10]);
};

/**
 * Formata uma string numérica para o padrão de telefone brasileiro (00 00000-0000).
 * @param value - String contendo números.
 * @returns String formatada como telefone.
 */
const formatarTelefone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

/**
 * Componente da página de Adicionar Endereço.
 * Gerencia o formulário de entrega, integração com API de CEP e persistência local.
 */
const AdicionarEndereco = () => {
  // Rastreia a sessão do usuário nesta página
  useSessionTracker("/adicionar-endereco");
  const navigate = useNavigate();
  
  // Estados para os campos do formulário
  const [padrao, setPadrao] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [cep, setCep] = useState("");
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Efeito para carregar dados salvos anteriormente no localStorage
  useEffect(() => {
    const saved = localStorage.getItem("endereco");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setNome(data.nome || "");
        setTelefone(data.telefone || "");
        setCep(data.cep || "");
        setEstado(data.estado || "");
        setCidade(data.cidade || "");
        setBairro(data.bairro || "");
        setEndereco(data.endereco || "");
        setNumero(data.numero || "");
        setEmail(data.email || "");
        setCpf(data.cpf || localStorage.getItem("cpfSalvo") || "");
      } catch { /* ignore */ }
    } else {
      const savedCpf = localStorage.getItem("cpfSalvo");
      if (savedCpf) setCpf(savedCpf);
    }
  }, []);

  /**
   * Manipula a mudança no campo de CEP e busca o endereço automaticamente.
   * Fornece feedback claro em caso de CEP não encontrado ou falha de rede.
   * @param value - Valor digitado pelo usuário.
   */
  const handleCepChange = async (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    const formatted = digits.length > 5 ? digits.replace(/(\d{5})(\d)/, "$1-$2") : digits;
    setCep(formatted);

    // Se o CEP estiver completo, busca na BrasilAPI
    if (digits.length === 8) {
      setLoadingCep(true);
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${digits}`);
        if (!res.ok) {
          setErrors(p => ({ ...p, cep: "CEP não encontrado. Preencha manualmente." }));
        } else {
          const data = await res.json();
          if (data?.errors) {
            setErrors(p => ({ ...p, cep: "CEP não encontrado. Preencha manualmente." }));
          } else {
            setEstado(data.state || "");
            setCidade(data.city || "");
            setBairro(data.neighborhood || "");
            setEndereco(data.street || "");
          }
        }
      } catch (err) {
        console.error("[AdicionarEndereco] Erro ao buscar CEP:", err);
        setErrors(p => ({ ...p, cep: "Não foi possível buscar o CEP. Verifique sua conexão." }));
      } finally {
        setLoadingCep(false);
      }
    }
  };
  
  const cepFilled = cep.replace(/\D/g, "").length === 8;

  /**
   * Renderiza um label com asterisco indicando campo obrigatório.
   * @param label - Texto do label.
   */
  const req = (label: string) => (
    <>{label}<span className="text-destructive"> *</span></>
  );

  const inputClass = (hasError?: string) =>
    `w-full py-2.5 px-3 rounded-xl border text-sm text-foreground placeholder:text-muted-foreground outline-none bg-background focus:ring-2 focus:ring-primary transition-shadow ${hasError ? "border-destructive" : "border-border"}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CheckoutHeader onBack={() => navigate(-1)} step="dados" />

      <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Adicionar o novo endereço</h1>

        {/* Informações de contato — Nome, Tel, Email e CPF */}
        <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Informações de contato</h2>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{req("Nome e sobrenome")}</label>
            <input
              type="text"
              placeholder="Nome e sobrenome"
              value={nome}
              onChange={(e) => { setNome(e.target.value); setErrors(p => ({ ...p, nome: "" })); }}
              className={inputClass(errors.nome)}
            />
            {errors.nome && <p className="text-xs py-0.5 text-destructive">{errors.nome}</p>}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{req("Telefone")}</label>
            <div className={`flex items-center rounded-xl border overflow-hidden focus-within:ring-2 focus-within:ring-primary ${errors.telefone ? "border-destructive" : "border-border"}`}>
              <span className="text-sm text-muted-foreground pl-3 pr-2">BR +55</span>
              <input
                type="tel"
                placeholder="Número de telefone"
                value={telefone}
                onChange={(e) => { setTelefone(formatarTelefone(e.target.value)); setErrors(p => ({ ...p, telefone: "" })); }}
                className="flex-1 py-2.5 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none bg-background"
              />
            </div>
            {errors.telefone && <p className="text-xs py-0.5 text-destructive">{errors.telefone}</p>}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{req("E-mail")}</label>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }}
              className={inputClass(errors.email)}
            />
            {errors.email && <p className="text-xs py-0.5 text-destructive">{errors.email}</p>}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{req("CPF")}</label>
            <input
              type="text"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => { setCpf(formatarCpf(e.target.value)); setErrors(p => ({ ...p, cpf: "" })); }}
              className={inputClass(errors.cpf)}
            />
            {errors.cpf && <p className="text-xs py-0.5 text-destructive">{errors.cpf}</p>}
          </div>
        </div>

        {/* Busca de CEP */}
        <div className="rounded-2xl bg-card border border-border p-4 sm:p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Endereço de entrega</h2>
          <label className="text-xs text-muted-foreground mb-1 block">{req("CEP/Código postal")}</label>
          <input
            type="text"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => { handleCepChange(e.target.value); setErrors(p => ({ ...p, cep: "" })); }}
            className={inputClass(errors.cep)}
          />
          {errors.cep && <p className="text-xs py-0.5 text-destructive">{errors.cep}</p>}
          {loadingCep && <p className="text-xs text-muted-foreground py-1">Buscando endereço...</p>}
        </div>

        {/* Detalhes do endereço — Só são exibidos quando o CEP é preenchido */}
        {cepFilled && (
          <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Detalhes do endereço</h2>
            <div className="flex gap-3">
              <div className="w-24">
                <label className="text-xs text-muted-foreground mb-1 block">{req("UF")}</label>
                <input
                  type="text"
                  placeholder="UF"
                  value={estado}
                  onChange={(e) => { setEstado(e.target.value.toUpperCase().slice(0, 2)); setErrors(p => ({ ...p, estado: "" })); }}
                  maxLength={2}
                  className={inputClass(errors.estado)}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">{req("Cidade")}</label>
                <input
                  type="text"
                  placeholder="Cidade"
                  value={cidade}
                  onChange={(e) => { setCidade(e.target.value); setErrors(p => ({ ...p, cidade: "" })); }}
                  className={inputClass(errors.cidade)}
                />
              </div>
            </div>
            {(errors.estado || errors.cidade) && <p className="text-xs py-0.5 text-destructive">{errors.estado || errors.cidade}</p>}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{req("Bairro/Distrito")}</label>
              <input
                type="text"
                placeholder="Bairro/Distrito"
                value={bairro}
                onChange={(e) => { setBairro(e.target.value); setErrors(p => ({ ...p, bairro: "" })); }}
                className={inputClass(errors.bairro)}
              />
              {errors.bairro && <p className="text-xs py-0.5 text-destructive">{errors.bairro}</p>}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{req("Endereço")}</label>
              <input
                type="text"
                placeholder="Endereço"
                value={endereco}
                onChange={(e) => { setEndereco(e.target.value); setErrors(p => ({ ...p, endereco: "" })); }}
                className={inputClass(errors.endereco)}
              />
              {errors.endereco && <p className="text-xs py-0.5 text-destructive">{errors.endereco}</p>}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{req("Nº da residência")}</label>
              <input
                type="text"
                placeholder='Use "s/n" se nenhum'
                value={numero}
                onChange={(e) => { setNumero(e.target.value); setErrors(p => ({ ...p, numero: "" })); }}
                className={inputClass(errors.numero)}
              />
              {errors.numero && <p className="text-xs py-0.5 text-destructive">{errors.numero}</p>}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Complemento <span className="text-muted-foreground text-[10px]">(opcional)</span></label>
              <input
                type="text"
                placeholder="Apartamento, bloco, unidade etc."
                className={inputClass()}
              />
            </div>
          </div>
        )}

        {/* Configuração de endereço padrão */}
        <div className="rounded-2xl bg-card border border-border p-4 sm:p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Configurações</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Definir como padrão</span>
            <button
              onClick={() => setPadrao(!padrao)}
              className={`w-11 h-6 rounded-full transition-colors relative ${padrao ? "bg-primary" : "bg-muted"}`}
            >
              <div
                className="w-5 h-5 rounded-full bg-card absolute top-0.5 transition-all shadow"
                style={{ left: padrao ? 22 : 2 }}
              />
            </button>
          </div>
        </div>

        {/* Rodapé com botão de salvar e validação final */}
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground mb-4">
            Leia a para saber mais sobre como usamos suas informações pessoais.
            <span className="text-primary underline ml-0.5">Política de privacidade</span>
          </p>
          <button
            onClick={() => {
              const newErrors: Record<string, string> = {};
              // Validações antes de prosseguir
              if (!nome.trim()) newErrors.nome = "Informe seu nome e sobrenome";
              if (!validarTelefone(telefone)) newErrors.telefone = "Informe um telefone válido (mín. 10 dígitos)";
              if (!validarEmail(email)) newErrors.email = "Informe um e-mail válido";
              if (!validarCpf(cpf)) newErrors.cpf = "Informe um CPF válido";
              if (cep.replace(/\D/g, "").length !== 8) newErrors.cep = "Informe um CEP válido";
              if (!estado.trim()) newErrors.estado = "Informe o estado";
              if (!cidade.trim()) newErrors.cidade = "Informe a cidade";
              if (!bairro.trim()) newErrors.bairro = "Informe o bairro";
              if (!endereco.trim()) newErrors.endereco = "Informe o endereço";
              if (!numero.trim()) newErrors.numero = "Informe o número";

              setErrors(newErrors);
              if (Object.keys(newErrors).length > 0) return;

              // Salva no localStorage para persistência entre sessões
              const data = { nome, telefone, email, cpf, cep, estado, cidade, bairro, endereco, numero };
              localStorage.setItem("endereco", JSON.stringify(data));
              localStorage.setItem("cpfSalvo", cpf);
              navigate("/finalizar-compra");
            }}
            className="w-full py-4 rounded-full text-base font-bold bg-ink text-ink-foreground hover:bg-black transition-colors shadow-lg shadow-black/10"
          >
            Salvar
          </button>
        </div>

        <CheckoutTrustRow />
      </div>
    </div>
  );
};

export default AdicionarEndereco;
