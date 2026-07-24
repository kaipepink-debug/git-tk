const relatedProducts = [
  {
    title: "Kit 5 Toalhas Banhão Lumina Karsten Fio Penteado 100% Algodão",
    image: "https://down-br.img.susercontent.com/file/br-11134207-7r98o-m7qgglb1tjk222@resize_w300_nl",
    price: "R$ 75,00",
    oldPrice: "R$ 279,99",
    discount: "73% OFF",
    sold: "2375 vendido(s)",
  },
  {
    title: "Jogo de Panelas 6 Peças Brinox Antiaderente Ceramic Life Sirius",
    image: "https://hotsite.fun/images/9dd48c19adf3404710d2e4fa628dcd22_1771479769.webp",
    price: "R$ 79,90",
    oldPrice: "R$ 469,90",
    discount: "83% OFF",
    sold: "1873 vendido(s)",
  },
  {
    title: "Cooktop Itatiaia Essencial 5 Bocas Preto Bivolt 127V/220V",
    image: "https://hotsite.fun/images/b3347953e0dc5412978920c8288b2c35_1771625918.webp",
    price: "R$ 89,57",
    oldPrice: "R$ 369,90",
    discount: "76% OFF",
    sold: "2493 vendido(s)",
  },
  {
    title: "Fritadeira Air Fryer Gaabor Elétrica Digital Touch Jumbo 5,5L",
    image: "https://down-br.img.susercontent.com/file/br-11134207-7r98o-lwzuntelr3cvd0@resize_w300_nl",
    price: "R$ 89,97",
    oldPrice: "R$ 299,00",
    discount: "70% OFF",
    sold: "1093 vendido(s)",
  },
];

const RelatedProducts = () => {
  return (
    <div className="bg-background px-4 py-4 mt-2">
      <h3 className="text-base font-bold text-foreground mb-3">Você também pode gostar</h3>
      <div className="grid grid-cols-2 gap-3">
        {relatedProducts.map((product, i) => (
          <div key={i} className="border border-border rounded overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
            <img
              src={product.image}
              alt={product.title}
              className="w-full aspect-square object-cover"
              loading="lazy"
            />
            <div className="p-2 space-y-1">
              <p className="text-xs text-foreground line-clamp-2 font-medium leading-tight">
                {product.title}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-sale text-sm font-bold">{product.price}</span>
                <span className="text-muted-foreground text-xs line-through">{product.oldPrice}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-sale/10 text-sale px-1.5 py-0.5 rounded font-semibold">
                  {product.discount}
                </span>
                <span className="text-success text-xs font-medium">Frete grátis</span>
              </div>
              <p className="text-xs text-muted-foreground">{product.sold}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
