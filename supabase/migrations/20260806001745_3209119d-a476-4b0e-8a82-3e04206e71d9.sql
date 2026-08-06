DO $$
DECLARE
    pid uuid;
BEGIN
    SELECT id INTO pid FROM products WHERE is_active = true LIMIT 1;
    
    DELETE FROM product_reviews WHERE product_id = pid;

    INSERT INTO product_reviews (product_id, reviewer_name, reviewer_initial, rating, review_text, days_ago, display_order, photos)
    VALUES 
    (pid, 'Ricardo S.', 'R', 5, 'O Chunta 6.0 superou minhas expectativas. A placa interna realmente dá uma estabilidade que eu não sentia em outros modelos. Uso pra correr 10km e o amortecimento é nota 10.', 2, 1, '[]'),
    (pid, 'Carla M.', 'C', 5, 'Gente, esse tênis é muito leve! Parece que estou descalça, mas com uma proteção incrível. A cor menta é linda demais, pessoalmente é ainda mais vibrante.', 3, 2, '[]'),
    (pid, 'Marcos Oliveira', 'M', 5, 'Comprei para treinar na academia e acabei usando pra tudo. Conforto absurdo e o ajuste no pé é perfeito. Peçam o número que usam mesmo, deu certinho.', 5, 3, '[]'),
    (pid, 'Juliana Costa', 'J', 4, 'Entrega super rápida, chegou em 3 dias aqui em SP. O tênis é tecnológico mesmo, dá pra sentir a qualidade do material.', 7, 4, '[]'),
    (pid, 'Fernando P.', 'F', 5, 'Melhor custo-benefício que já encontrei. Um tênis desse nível costuma custar o triplo. Recomendo muito para quem está começando a correr.', 10, 5, '[]');
END $$;