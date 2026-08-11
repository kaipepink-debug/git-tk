/**
 * Componente que exibe a seção "Nossa História" da loja Zyro,
 * apresentando a fachada da loja e informações institucionais de confiança.
 */
const StoreInfo = () => {
  return (
    <section className="border-t border-border py-10 px-4 sm:px-0">
      <h2 className="text-2xl font-extrabold text-foreground mb-6">Nossa História</h2>
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <img
          src="https://minasescadas.cdn.magazord.com.br/img/2025/03/produto/1308/telescolica-16-degraus-capa.jpg?ims=fit-in/600x600/filters:fill(white)"
          alt="Fachada da loja Minas Escadas"
          className="w-full rounded-2xl object-cover"
          loading="lazy"
        />
        <div>
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            A Minas Escadas é especialista em soluções de acesso em altura. Oferecemos as melhores escadas telescópicas e articuladas do mercado, com foco total na segurança e durabilidade para nossos clientes.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-muted text-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
              Qualidade Garantida
            </span>
            <span className="bg-muted text-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
              Atendimento Especializado
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StoreInfo;
