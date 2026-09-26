/**
 * Rota: /adicionar-endereco
 * Propósito: Permite ao usuário cadastrar ou editar informações de entrega e contato
 * antes de finalizar a compra. Inclui validações de CPF, E-mail e busca automática de CEP.
 */

import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";

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
    <>{label}<span style={{ color: "#FF2B56" }}> *</span></>
  );

  return (
    <div className="min-h-screen w-full bg-secondary max-w-lg mx-auto flex flex-col overflow-x-hidden" style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif" }}>
      {/* Header com botão de voltar */}
      <div className="sticky top-0 z-50 bg-background flex items-center px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="mr-3">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground flex-1 text-center pr-9">Adicionar o novo endereço</h1>
      </div>

      {/* Informações de contato — Nome, Tel, Email e CPF */}
      <div className="bg-background mt-2 px-4 py-4">
        <h2 className="text-sm font-bold text-foreground mb-3">Informações de contato</h2>
        <div className="space-y-0">
          <div>
            <label className="text-xs text-muted-foreground">Nome e sobrenome<span className="text-[#FF2B56]"> *</span></label>
            <input
              type="text"
              placeholder="Nome e sobrenome"
              value={nome}
              onChange={(e) => { setNome(e.target.value); setErrors(p => ({ ...p, nome: "" })); }}
              className={`w-full py-2 border-b text-base text-foreground placeholder:text-muted-foreground outline-none bg-transparent ${errors.nome ? "border-[#FF2B56]" : "border-border"}`}
            />
            {errors.nome && <p className="text-xs py-0.5" style={{ color: "#FF2B56" }}>{errors.nome}</p>}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mt-2 block">Telefone<span className="text-[#FF2B56]"> *</span></label>
            <div className={`flex items-center border-b ${errors.telefone ? "border-[#FF2B56]" : "border-border"}`}>
              <span className="shrink-0 text-sm text-muted-foreground pr-3 py-2">BR +55</span>
              <input
                type="tel"
                inputMode="tel"
                placeholder="Número de telefone"
                value={telefone}
                onChange={(e) => { setTelefone(formatarTelefone(e.target.value)); setErrors(p => ({ ...p, telefone: "" })); }}
                className="flex-1 min-w-0 w-0 py-2 text-base text-foreground placeholder:text-muted-foreground outline-none bg-transparent"
              />
            </div>
            {errors.telefone && <p className="text-xs py-0.5" style={{ color: "#FF2B56" }}>{errors.telefone}</p>}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mt-2 block">E-mail<span className="text-[#FF2B56]"> *</span></label>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }}
              className={`w-full py-2 border-b text-base text-foreground placeholder:text-muted-foreground outline-none bg-transparent ${errors.email ? "border-[#FF2B56]" : "border-border"}`}
            />
            {errors.email && <p className="text-xs py-0.5" style={{ color: "#FF2B56" }}>{errors.email}</p>}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mt-2 block">CPF<span className="text-[#FF2B56]"> *</span></label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => { setCpf(formatarCpf(e.target.value)); setErrors(p => ({ ...p, cpf: "" })); }}
              className={`w-full py-2 text-base text-foreground placeholder:text-muted-foreground outline-none bg-transparent ${errors.cpf ? "border-b border-[#FF2B56]" : ""}`}
            />
            {errors.cpf && <p className="text-xs py-0.5" style={{ color: "#FF2B56" }}>{errors.cpf}</p>}
          </div>
        </div>
      </div>

      {/* Busca de CEP */}
      <div className="bg-background mt-2 px-4 py-4">
        <h2 className="text-sm font-bold text-foreground mb-3">Endereço de entrega</h2>
        <div className="space-y-0">
          <div>
            <label className="text-xs text-muted-foreground">CEP/Código postal<span className="text-[#FF2B56]"> *</span></label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="00000-000"
              value={cep}
              onChange={(e) => { handleCepChange(e.target.value); setErrors(p => ({ ...p, cep: "" })); }}
              className={`w-full py-2 border-b text-base text-foreground placeholder:text-muted-foreground outline-none bg-transparent ${errors.cep ? "border-[#FF2B56]" : "border-border"}`}
            />
          </div>
          {errors.cep && <p className="text-xs py-0.5" style={{ color: "#FF2B56" }}>{errors.cep}</p>}
          {loadingCep && <p className="text-xs text-muted-foreground py-1">Buscando endereço...</p>}
        </div>
      </div>

      {/* Detalhes do endereço — Só são exibidos quando o CEP é preenchido */}
      {cepFilled && (
        <div className="bg-background mt-2 px-4 py-4">
          <h2 className="text-sm font-bold text-foreground mb-3">Detalhes do endereço</h2>
          <div className="space-y-0">
            <div>
              <div className="flex gap-2">
                <label className="text-xs text-muted-foreground flex-1">Estado/UF<span className="text-[#FF2B56]"> *</span></label>
                <label className="text-xs text-muted-foreground flex-1 pl-3">Cidade<span className="text-[#FF2B56]"> *</span></label>
              </div>
              <div className={`flex border-b ${errors.estado || errors.cidade ? "border-[#FF2B56]" : "border-border"}`}>
                <input
                  type="text"
                  placeholder="UF"
                  value={estado}
                  onChange={(e) => { setEstado(e.target.value.toUpperCase().slice(0, 2)); setErrors(p => ({ ...p, estado: "" })); }}
                  maxLength={2}
                  className="flex-1 min-w-0 w-0 py-2 text-base text-foreground placeholder:text-muted-foreground outline-none bg-transparent border-r border-border pr-3"
                />
                <input
                  type="text"
                  placeholder="Cidade"
                  value={cidade}
                  onChange={(e) => { setCidade(e.target.value); setErrors(p => ({ ...p, cidade: "" })); }}
                  className="flex-1 min-w-0 w-0 py-2 pl-3 text-base text-foreground placeholder:text-muted-foreground outline-none bg-transparent"
                />
              </div>
              {(errors.estado || errors.cidade) && <p className="text-xs py-0.5" style={{ color: "#FF2B56" }}>{errors.estado || errors.cidade}</p>}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mt-2 block">Bairro/Distrito<span className="text-[#FF2B56]"> *</span></label>
              <input
                type="text"
                placeholder="Bairro/Distrito"
                value={bairro}
                onChange={(e) => { setBairro(e.target.value); setErrors(p => ({ ...p, bairro: "" })); }}
                className={`w-full py-2 border-b text-base text-foreground placeholder:text-muted-foreground outline-none bg-transparent ${errors.bairro ? "border-[#FF2B56]" : "border-border"}`}
              />
              {errors.bairro && <p className="text-xs py-0.5" style={{ color: "#FF2B56" }}>{errors.bairro}</p>}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mt-2 block">Endereço<span className="text-[#FF2B56]"> *</span></label>
              <input
                type="text"
                placeholder="Endereço"
                value={endereco}
                onChange={(e) => { setEndereco(e.target.value); setErrors(p => ({ ...p, endereco: "" })); }}
                className={`w-full py-2 border-b text-base text-foreground placeholder:text-muted-foreground outline-none bg-transparent ${errors.endereco ? "border-[#FF2B56]" : "border-border"}`}
              />
              {errors.endereco && <p className="text-xs py-0.5" style={{ color: "#FF2B56" }}>{errors.endereco}</p>}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mt-2 block">Nº da residência<span className="text-[#FF2B56]"> *</span></label>
              <input
                type="text"
                placeholder='Use "s/n" se nenhum'
                value={numero}
                onChange={(e) => { setNumero(e.target.value); setErrors(p => ({ ...p, numero: "" })); }}
                className={`w-full py-2 border-b text-base text-foreground placeholder:text-muted-foreground outline-none bg-transparent ${errors.numero ? "border-[#FF2B56]" : "border-border"}`}
              />
              {errors.numero && <p className="text-xs py-0.5" style={{ color: "#FF2B56" }}>{errors.numero}</p>}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mt-2 block">Complemento <span className="text-muted-foreground text-[10px]">(opcional)</span></label>
              <input
                type="text"
                placeholder="Apartamento, bloco, unidade etc."
                className="w-full py-2 text-base text-foreground placeholder:text-muted-foreground outline-none bg-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Configuração de endereço padrão */}
      <div className="bg-background mt-2 px-4 py-4">
        <h2 className="text-sm font-bold text-foreground mb-3">Configurações</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">Definir como padrão</span>
          <button
            onClick={() => setPadrao(!padrao)}
            className="w-11 h-6 rounded-full transition-colors relative"
            style={{ background: padrao ? "#FF2B56" : "#ccc" }}
          >
            <div
              className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow"
              style={{ left: padrao ? 22 : 2 }}
            />
          </button>
        </div>
      </div>

      {/* Rodapé com botão de salvar e validação final */}
      <div className="flex-1" />
      <div className="bg-background px-4 py-3 text-center">
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
          className="w-full py-3 rounded-lg text-base font-bold text-white"
          style={{ background: "#FF2B56" }}
        >
          Salvar
        </button>
      </div>
    </div>
  );
};

export default AdicionarEndereco;
