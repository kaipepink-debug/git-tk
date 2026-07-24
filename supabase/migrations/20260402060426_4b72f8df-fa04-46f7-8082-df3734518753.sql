-- Set all reviews to 5 stars
UPDATE product_reviews SET rating = 5 WHERE rating != 5;

-- Update review texts for the first 9 reviews (keeping their media)
UPDATE product_reviews SET review_text = 'Meu marido ainda estava montando ela. A montagem é bem simples. Veio completa, como está no anúncio. Chegou dentro do prazo, tudo certinho! Indico o vendedor e o produto!', display_order = 1 WHERE id = 'af74e3a9-7665-42fa-8e04-620dde56602c';

UPDATE product_reviews SET review_text = 'Produto chegou conforme a descrição, ainda não testei, a entrega foi rápida parabéns ao vendedor, agora vamos testar', display_order = 2 WHERE id = '5c4372c0-ca05-48f9-8128-827fbc80f7a3';

UPDATE product_reviews SET review_text = 'Chegou antes do prazo. Vendedor antecioso. Recomendo o produto. Adorei', display_order = 3 WHERE id = '49f10c6e-8a00-4506-b2c1-9191814c0798';

UPDATE product_reviews SET review_text = 'Muito boa a máquina, recomendo ☺️, chegou antes da data prevista, o valor compensa muito. Chegou tudo certinho e bem embalado.👍🏼', display_order = 4 WHERE id = 'bcdd4d0a-134d-438d-bd59-655853b16fc7';

UPDATE product_reviews SET review_text = 'Ótimo produto, vendedor rápido e eficiente. Mercadoria chegou antes do esperado, recomendo a todos.....', display_order = 5 WHERE id = '492ed06f-09ae-4c73-8592-2c2a6ed3c915';

UPDATE product_reviews SET review_text = 'Produto chegou rápido e bem embalado, é bem pequena, mais me surpreendeu com a qualidade, potência e praticidade na montagem da mesma, q não perde em nada para modelos maiores, pode comprar q produto é top, vonder é vonder né...', display_order = 6 WHERE id = 'd02b56c8-04b9-4aac-95b2-0888c3c3ae4c';

UPDATE product_reviews SET review_text = 'Chegou antes do prazo, produto pequeno mas com ótima pressão. Recomendo.', display_order = 7 WHERE id = '46538541-bb49-4718-8298-46c3da95c4cd';

UPDATE product_reviews SET review_text = 'O desempenho dela é excelente, tem uma ótima potência, e cumpre muito bem o serviço, aproveitei um bom cupom, então compensou muito, amei a compra. Recomendo.', display_order = 8 WHERE id = '52865385-26a3-47f8-9957-f50efe5a2cdc';

UPDATE product_reviews SET review_text = 'Chegou no prazo correto, na embalagem da própria máquina, bem embalado. É muito boa, leve e potente! Meu pai amou! Recomendo!', display_order = 9 WHERE id = '2d41d96e-0ba9-485d-80d3-4628041f25e2';