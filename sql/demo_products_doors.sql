-- Доп. демо-SKU для витрины Doors (идемпотентно)
INSERT INTO products (model,finish,color,type,width,height,rrc_price,sku_1c,style,model_photo) VALUES
  ('PG Base 1','Нанотекс','Белый','Распашная',700,2000,14900,'SKU-PG1-700x2000-BEL','Современная',NULL),
  ('PG Base 1','Нанотекс','Белый','Распашная',800,2100,16900,'SKU-PG1-800x2100-BEL','Современная',NULL),
  ('PG Base 1','Эмаль','Белый','Распашная',800,2000,17900,'SKU-PG1-800x2000-EM-BEL','Современная',NULL),
  ('PG Base 1','Эмаль','Чёрный','Распашная',800,2000,18900,'SKU-PG1-800x2000-EM-BLK','Современная',NULL),
  ('PG Base 2','Нанотекс','Белый','Распашная',800,2000,18900,'SKU-PG2-800x2000-BEL','Современная',NULL),
  ('PG Base 2','Нанотекс','Серый','Распашная',900,2000,19900,'SKU-PG2-900x2000-SER','Современная',NULL),
  ('PO Base 1/1','Нанотекс','Белый','Распашная',800,2000,22900,'SKU-PO11-800x2000-BEL','Современная',NULL),
  ('PO Base 1/2','Нанотекс','Белый','Распашная',900,2000,23900,'SKU-PO12-900x2000-BEL','Современная',NULL),
  ('Neo-1','Эмаль','Слоновая кость','Распашная',800,2000,27900,'SKU-NEO1-800x2000-IV','Неоклассика',NULL)
ON CONFLICT (model,finish,color,type,width,height) DO UPDATE
SET rrc_price=EXCLUDED.rrc_price, sku_1c=EXCLUDED.sku_1c, style=EXCLUDED.style, model_photo=EXCLUDED.model_photo;
