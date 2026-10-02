import { useNavigate } from "react-router-dom";
import { useProduct } from "@/contexts/ProductContext";

/**
 * Componente de barra inferior fixa para navegação rápida e compra.
 * Exibe ícones de navegação, botão de chat (visual, sem função) e botão de compra com preço atual.
 */
const BottomBar = () => {
  const navigate = useNavigate();
  const { priceDisplay, price, product } = useProduct();

  return (
    <>
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-lg w-full bg-background z-50 flex items-center"
        style={{
          padding: "8px 12px 12px",
          borderTop: "1px solid #E8E8E8",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.05)",
          fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif",
          gap: 0,
        }}
      >
        {/* Lado esquerdo: ícones de navegação rápida */}
        <div className="flex items-end" style={{ gap: 12 }}>
          {/* Link para a Home/Loja */}
          <a href="/" className="flex flex-col items-center justify-center" style={{ color: "#222", textDecoration: "none", minWidth: 40 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 11V17C5 18.8856 5 19.8284 5.58579 20.4142C6.17157 21 7.11438 21 9 21H15C16.8856 21 17.8284 21 18.4142 20.4142C19 19.8284 19 18.8856 19 17V11" stroke="#333" strokeWidth="1.8"/>
              <path d="M4.62127 4.51493C4.80316 3.78737 4.8941 3.42359 5.16536 3.21179C5.43663 3 5.8116 3 6.56155 3H17.4384C18.1884 3 18.5634 3 18.8346 3.21179C19.1059 3.42359 19.1968 3.78737 19.3787 4.51493L20.5823 9.32938C20.6792 9.71675 20.7276 9.91044 20.7169 10.0678C20.6892 10.4757 20.416 10.8257 20.0269 10.9515C19.8769 11 19.6726 11 19.2641 11C18.7309 11 18.4644 11 18.2405 10.9478C17.6133 10.8017 17.0948 10.3625 16.8475 9.76781C16.7593 9.55555 16.7164 9.29856 16.6308 8.78457C16.6068 8.64076 16.5948 8.56886 16.5812 8.54994C16.5413 8.49439 16.4587 8.49439 16.4188 8.54994C16.4052 8.56886 16.3932 8.64076 16.3692 8.78457L16.2877 9.27381C16.2791 9.32568 16.2747 9.35161 16.2704 9.37433C16.0939 10.3005 15.2946 10.9777 14.352 10.9995C14.3289 11 14.3026 11 14.25 11C14.1974 11 14.1711 11 14.148 10.9995C13.2054 10.9777 12.4061 10.3005 12.2296 9.37433C12.2253 9.35161 12.2209 9.32568 12.2123 9.27381L12.1308 8.78457C12.1068 8.64076 12.0948 8.56886 12.0812 8.54994C12.0413 8.49439 11.9587 8.49439 11.9188 8.54994C11.9052 8.56886 11.8932 8.64076 11.8692 8.78457L11.7877 9.27381C11.7791 9.32568 11.7747 9.35161 11.7704 9.37433C11.5939 10.3005 10.7946 10.9777 9.85199 10.9995C9.82887 11 9.80258 11 9.75 11C9.69742 11 9.67113 11 9.64801 10.9995C8.70541 10.9777 7.90606 10.3005 7.7296 9.37433C7.72527 9.35161 7.72095 9.32568 7.7123 9.27381L7.63076 8.78457C7.60679 8.64076 7.59481 8.56886 7.58122 8.54994C7.54132 8.49439 7.45868 8.49439 7.41878 8.54994C7.40519 8.56886 7.39321 8.64076 7.36924 8.78457C7.28357 9.29856 7.24074 9.55555 7.15249 9.76781C6.90524 10.3625 6.38675 10.8017 5.75951 10.9478C5.53563 11 5.26905 11 4.73591 11C4.32737 11 4.12309 11 3.97306 10.9515C3.58403 10.8257 3.31078 10.4757 3.28307 10.0678C3.27239 9.91044 3.32081 9.71675 3.41765 9.32938L4.62127 4.51493Z" stroke="#333" strokeWidth="1.8"/>
            </svg>
            <span style={{ fontSize: 10, color: "#555", marginTop: 2 }}>Loja</span>
          </a>

          {/* Botão de chat (apenas visual — o atendimento por IA foi desativado) */}
          <button type="button" aria-label="Chat" className="flex flex-col items-center justify-center" style={{ color: "#222", background: "none", border: "none", cursor: "pointer", minWidth: 40 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.81,16.23,20,21l-4.95-2.48A9.84,9.84,0,0,1,12,19c-5,0-9-3.58-9-8s4-8,9-8,9,3.58,9,8A7.49,7.49,0,0,1,18.81,16.23Z" fill="none" stroke="#333" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
            </svg>
            <span style={{ fontSize: 10, color: "#555", marginTop: 2 }}>Chat</span>
          </button>

          {/* Botão de Carrinho (atualmente decorativo/placeholder) */}
          <button
            className="flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#f6d6d8",
              border: "none",
              cursor: "pointer",
            }}
          >
            <svg fill="none" width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M11,20.5h.1m5.9,0h.1" style={{ fill: "none", stroke: "#E91E63", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2 }}/>
              <path d="M14,5v6m3-3H11" style={{ fill: "none", stroke: "#E91E63", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2 }}/>
              <path d="M3,3H5.2a1,1,0,0,1,1,.78L8.82,15.22a1,1,0,0,0,1,.78h8.42a1,1,0,0,0,1-.76L21,8" style={{ fill: "none", stroke: "#E91E63", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2 }}/>
            </svg>
          </button>
        </div>

        {/* Botão de CTA principal: Comprar Agora */}
        <button
          onClick={() => {
            navigate("/carrinho");
          }}
          className="flex-1 flex flex-col items-center justify-center"
          style={{
            background: "#FF2B56",
            borderRadius: 8,
            padding: "10px 20px",
            color: "#fff",
            border: "none",
            marginLeft: 12,
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, fontFamily: "'Segoe UI',Roboto,sans-serif" }}>R$ {priceDisplay}</span>
          <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.9, lineHeight: 1.3 }}>Comprar agora | {product.delivery_text ? "Frete incluso" : "Frete grátis"}</span>
        </button>
      </div>
    </>
  );
};

export default BottomBar;
