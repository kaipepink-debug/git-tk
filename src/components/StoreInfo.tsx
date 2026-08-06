/**
 * Componente que exibe a seção "Nossa História" da loja Zyro,
 * apresentando a fachada da loja e informações institucionais de confiança.
 */
const StoreInfo = () => {
  return (
    <section className="border-t border-border py-10">
      <h2 className="text-2xl font-extrabold text-foreground mb-6">Nossa História</h2>
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <img
          src="https://zyroofc.lovable.app/assets/fachada-loja-BL_6rAq4.png"
          alt="Fachada da loja Zyro"
          className="w-full rounded-2xl object-cover"
          loading="lazy"
        />
        <div>
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            Desde 2018 no mercado, a Chiqueb nasceu da paixão pelo estilo e conforto. São mais de 80.000 clientes atendidos com
            excelência e compromisso em oferecer os melhores calçados tecnológicos do Brasil.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-muted text-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
              9 anos de tradição
            </span>
            <span className="bg-muted text-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
              São Paulo, SP
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StoreInfo;
