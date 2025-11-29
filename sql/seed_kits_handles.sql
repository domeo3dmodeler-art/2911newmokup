INSERT INTO kits (id,name,price_rrc,price_opt) VALUES
  ('KIT_STD','Базовый комплект',5000,0),
  ('KIT_SOFT','SoftClose',2400,0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO handles (id,name_web,price_opt,price_group_multiplier) VALUES
  ('HNDL_PRO','Pro',900,1.15),
  ('HNDL_SIL','Silver',1100,1.15)
ON CONFLICT (id) DO NOTHING;
