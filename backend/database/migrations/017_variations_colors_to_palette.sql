-- ==============================================================================
-- 017. Cores antigas das variações → paleta de cores
-- ==============================================================================
-- Variações cadastradas antes da paleta guardam hex livres, que não batem com o
-- filtro de cores do catálogo. Cada cor vira a mais próxima da paleta (distância
-- RGB); cores que já estão na paleta ficam iguais. Carvalho, Off White e
-- Cinamomo vão por nome, porque a distância RGB os levaria a outro tom.

WITH palette(hex) AS (
    VALUES ('#FFFFFF'),('#F4F4F0'),('#EBEEF0'),('#F4EFE6'),('#EFEAE1'),('#EADFC8'),('#DDD2BE'),('#E6D29A'),('#D4C3A3'),('#C9C0B3'),('#C8B496'),('#B5A897'),('#A88B65'),('#9E8B76'),('#8C7B6B'),('#E5D2AE'),('#DEC39B'),('#CEAF82'),('#C49E6E'),('#C29B6B'),('#B98D5B'),('#B88642'),('#B08456'),('#9E7656'),('#9C7A45'),('#A16440'),('#A96234'),('#8E6743'),('#945435'),('#7A5C44'),('#7F5539'),('#7E4532'),('#6E4B33'),('#5E402D'),('#543B2E'),('#4B3224'),('#4F2420'),('#3D281E'),('#2B1D16'),('#F1E3B3'),('#E5B53A'),('#C7B07B'),('#C89635'),('#A88B3F'),('#B4703E'),('#EBCFC8'),('#D4A79E'),('#C08A85'),('#E07A5F'),('#D2692A'),('#B85941'),('#9C4A2F'),('#6E2A33'),('#5C1426'),('#B8DAD0'),('#A9C2B3'),('#879B82'),('#5B5E3B'),('#4E6044'),('#235A4A'),('#2E4636'),('#C9DCE8'),('#9BB2C4'),('#4FA3A0'),('#5B7A99'),('#2D5868'),('#2F4E8C'),('#223654'),('#1B2537'),('#E1E2E0'),('#D0D2D3'),('#B2B6BA'),('#A3A39E'),('#8E9194'),('#7A8590'),('#7D7F7D'),('#55585B'),('#3B3D40'),('#242424'),('#121212')
), fixed(old, hex) AS (
    VALUES ('#B8860B', '#B88642'), ('#F5F5EC', '#F4EFE6'), ('#A0522D', '#A16440')
)
UPDATE product_variations v
SET colors_hex = (
    SELECT array_agg(COALESCE((SELECT f.hex FROM fixed f WHERE f.old = c.hex), (
        SELECT p.hex FROM palette p
        ORDER BY power(('x' || substr(c.hex, 2, 2))::bit(8)::int - ('x' || substr(p.hex, 2, 2))::bit(8)::int, 2)
               + power(('x' || substr(c.hex, 4, 2))::bit(8)::int - ('x' || substr(p.hex, 4, 2))::bit(8)::int, 2)
               + power(('x' || substr(c.hex, 6, 2))::bit(8)::int - ('x' || substr(p.hex, 6, 2))::bit(8)::int, 2)
        LIMIT 1
    ))::varchar(7) ORDER BY c.ord)
    FROM unnest(v.colors_hex) WITH ORDINALITY AS c(hex, ord)
)
WHERE cardinality(v.colors_hex) > 0;
