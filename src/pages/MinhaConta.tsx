import { useState } from "react";
import { ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MinhaConta = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-secondary max-w-lg mx-auto" style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif" }}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background flex items-center px-3 py-3 border-b" style={{ borderColor: "#E8E8E8" }}>
        <button onClick={() => navigate(-1)} className="p-1" style={{ color: "#222" }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="flex-1 text-center font-semibold" style={{ fontSize: 16, color: "#222" }}>Minha Conta</span>
        <div className="w-7" />
      </div>

      {/* Content */}
      <div className="bg-background mx-0 mt-2 px-6 py-10 flex flex-col items-center">
        {/* Avatar icon */}
        <div className="mb-4">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="#222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 20C20 17.7909 16.4183 16 12 16C7.58172 16 4 17.7909 4 20" stroke="#222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h2 className="font-bold mb-1" style={{ fontSize: 20, color: "#222" }}>Acessar Minha Conta</h2>
        <p className="mb-6" style={{ fontSize: 14, color: "#777" }}>Digite seu email ou CPF para continuar</p>

        {/* Form */}
        <div className="w-full">
          <label className="block mb-1.5" style={{ fontSize: 13, color: "#555", fontWeight: 500 }}>Email ou CPF</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="exemplo@email.com ou 000.000.000-00"
            className="w-full border rounded-lg px-4 py-3 outline-none transition-colors"
            style={{
              fontSize: 14,
              color: "#222",
              borderColor: "#ddd",
              background: "#fff",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#FF2B56")}
            onBlur={(e) => (e.target.style.borderColor = "#ddd")}
          />
        </div>

        <button
          className="w-full mt-4 py-3 rounded-lg font-semibold"
          style={{
            background: "#FF2B56",
            color: "#fff",
            fontSize: 15,
            border: "none",
            cursor: "pointer",
          }}
        >
          Entrar
        </button>

        <p className="mt-6 mb-3" style={{ fontSize: 13, color: "#777" }}>Não tem uma conta? Faça sua primeira compra!</p>

        <button
          onClick={() => navigate("/")}
          className="w-full py-3 rounded-lg font-semibold"
          style={{
            background: "transparent",
            color: "#FF2B56",
            fontSize: 15,
            border: "1px solid #FF2B56",
            cursor: "pointer",
          }}
        >
          Ir para a Loja
        </button>
      </div>
    </div>
  );
};

export default MinhaConta;
