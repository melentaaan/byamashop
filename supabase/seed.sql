-- Généré par scripts/generate-seed.ts — ne pas modifier à la main.

-- Contenu de DÉMONSTRATION (is_demo = true) : supprimable depuis l’administration.

begin;

insert into public.store_settings (id, data) values (1, '{"business_name":"Byamashop","tagline":"Élégance, piété & belles trouvailles","announcement":"Livraison à Dakar et partout au Sénégal · Paiement Wave, Orange Money ou à la livraison","whatsapp":"221764091727","phone":"+221 76 409 17 27","email":"","address":"Dakar, Sénégal","opening_hours":"","socials":{"instagram":"","tiktok":"","facebook":"","snapchat":""},"payments":{"wave":{"enabled":true,"account_number":"","account_name":"","payment_link":"","instructions":"Envoyez le montant total par Wave en indiquant votre référence de commande. Votre paiement est validé dès que nous l''avons vérifié — vous recevez alors une confirmation."},"orange_money":{"enabled":true,"account_number":"","account_name":"","payment_link":"","instructions":"Envoyez le montant total par Orange Money en indiquant votre référence de commande. Votre paiement est validé dès que nous l''avons vérifié — vous recevez alors une confirmation."},"cash_on_delivery":{"enabled":true,"account_number":"","account_name":"","payment_link":"","instructions":"Vous réglez en espèces au moment de la livraison. Merci de préparer le montant exact si possible."}},"hero":{"eyebrow":"Boutique en ligne · Dakar","title":"Élégance, piété & *belles trouvailles*","subtitle":"Robes et tapis de prière, parfums, ensembles, friperie choisie et produits du Maroc — une sélection soignée, livrée chez vous partout au Sénégal.","cta_label":"Découvrir la boutique","cta_href":"/boutique","image_url":"/demo/editorial/hero.svg"},"banners":[{"id":"banner-parfums","enabled":true,"eyebrow":"L’univers parfum","title":"Ouds, muscs & eaux de parfum","text":"Des notes boisées, ambrées ou florales, en flacon, en huile ou en coffret à offrir.","cta_label":"Découvrir les parfums","cta_href":"/categorie/parfums","image_url":"/demo/editorial/promo.svg"}],"about":"Byamashop est une boutique sénégalaise qui réunit l''essentiel de la vie quotidienne et spirituelle : des robes et tapis de prière, des parfums, une friperie sélectionnée, les ensembles chez Cathy, des produits du Maroc et des articles importés.\n\nNotre ambition : de beaux produits, des prix justes et un service humain, du premier message jusqu''à la livraison.","wholesale":{"enabled":true,"title":"Revendeurs & commandes en gros","text":"Vous êtes revendeuse, association ou organisez un événement ? Demandez-nous un devis pour des quantités : tapis, robes de prière, parfums et produits importés."},"returns_summary":"Conditions de retour et d’échange détaillées sur notre page dédiée.","shipping_summary":"Dakar et banlieue, régions du Sénégal, ou retrait sur place.","newsletter_enabled":true,"low_stock_threshold":3,"legal":{"raison_sociale":"","forme_juridique":"","ninea":"","rccm":"","responsable_publication":""},"site_url":"https://byamashop.netlify.app"}'::jsonb)
  on conflict (id) do update set data = excluded.data;

insert into public.delivery_zones (id, name, description, fee, free_from, estimate, is_pickup, is_active, sort_order) values

('4b74ecd9-166c-4130-bd30-add31cff0ce2', 'Dakar (centre & banlieue)', '', 1500, null, '24 h', false, true, 0),
('ec5f5c6a-fbef-45e1-993d-2774a317b74b', 'Pikine / Guédiawaye / Rufisque', '', 2000, null, '24 à 48 h', false, true, 1),
('cfd717e5-1af7-4844-ab6c-a343c56e362a', 'Thiès / Mbour', '', 3000, null, '48 à 72 h', false, true, 2),
('778fab32-3913-4fad-bc41-40acbe9c286f', 'Autres régions', 'Expédition par transporteur', 4000, null, '48 à 72 h', false, true, 3),
('9cd2fbd7-6b79-44a6-a320-e96d8e71b6d4', 'Retrait sur place', 'Nous vous indiquons le lieu de retrait à la confirmation', 0, null, 'Sur rendez-vous', true, true, 4)
on conflict (id) do nothing;

insert into public.categories (id, slug, name, description, image_url, sort_order, is_published) values

('256aeaaa-8f04-4857-8b3d-07389b3e4bbd', 'robes-de-priere', 'Robes de prière', 'Robes deux pièces, abayas et jilbabs : des coupes amples et des tissus agréables pour prier en toute sérénité.', '/demo/categories/robes-de-priere.svg', 0, true),
('b9dc5028-60cd-4a1d-9317-be129b7e0817', 'tapis-de-priere', 'Tapis de prière', 'Tapis en velours, modèles de voyage, tapis épais confort et coffrets à offrir.', '/demo/categories/tapis-de-priere.svg', 1, true),
('82fa91c5-8e37-4be8-a486-67c7f90a1daa', 'parfums', 'Parfums', 'Eaux de parfum, huiles parfumées, brumes et thiouraye pour parfumer la maison.', '/demo/categories/parfums.svg', 2, true),
('e8a3b719-c24f-4492-8f11-dc4f9c805688', 'friperie', 'Friperie', 'Des pièces de seconde main choisies une à une. L’état de chaque article est précisé sur sa fiche.', '/demo/categories/friperie.svg', 3, true),
('ede69820-7d7d-4373-be0f-1b9eb6153539', 'ensembles-chez-cathy', 'Ensembles chez Cathy', 'Ensembles en wax, lin et tissus brodés pour femmes et enfants.', '/demo/categories/ensembles-chez-cathy.svg', 4, true),
('3f60feaa-a957-4603-b8ac-e30814709cb1', 'produits-du-maroc', 'Produits du Maroc', 'Savon noir, huile d’argan, ghassoul, caftans et art de la table marocain.', '/demo/categories/produits-du-maroc.svg', 5, true),
('2b49927f-3e07-43f6-9cf4-a065087f0be4', 'produits-importes', 'Produits importés', 'Petits équipements pratiques, rangement et accessoires sélectionnés pour le quotidien.', '/demo/categories/produits-importes.svg', 6, true),
('5d3c7100-93fc-4313-8071-84ee2a48a651', 'lasalmah', 'Lasalmah', 'La sélection Lasalmah. Description à compléter par la boutique.', '/demo/categories/lasalmah.svg', 7, true)
on conflict (id) do nothing;

insert into public.products (id, slug, name, category_id, short_description, description, details, price, compare_at_price,
  status, is_featured, is_new, condition_note, tags, option1_name, option2_name, sort_order, is_demo, published_at, created_at) values

('6b42fe0d-8481-49b2-9364-9ba3feedc580', 'robe-priere-deux-pieces-lilas', 'Robe de prière deux pièces « Lilas »', '256aeaaa-8f04-4857-8b3d-07389b3e4bbd', 'Voile long et jupe ample, tissu fluide et léger.', 'Une robe de prière deux pièces pensée pour le confort : un voile long qui couvre les épaules et les bras, et une jupe ample à taille élastique. Le tissu est fluide, léger et se glisse facilement dans un sac.', 'Composition : à préciser par la boutique
Entretien : lavage à 30 °C, repassage doux
Taille unique ajustable', 12000, 15000, 'published', true, false, null, array['prière', 'deux pièces', 'voile']::text[], 'Taille', 'Couleur', 0, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:00:00.000Z'),
('8e12d846-09e2-40d9-bcc3-9040b1e220ab', 'robe-priere-enfant-petite-perle', 'Robe de prière enfant « Petite perle »', '256aeaaa-8f04-4857-8b3d-07389b3e4bbd', 'Deux pièces pour fillette, finitions dentelle.', 'La version enfant de notre robe de prière deux pièces : un voile facile à enfiler et une jupe à taille élastique, avec une fine bordure en dentelle.', 'Entretien : lavage à 30 °C
Tailles indicatives par âge', 7000, null, 'published', false, true, null, array['enfant', 'prière']::text[], 'Taille', 'Couleur', 1, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:01:00.000Z'),
('4a015189-f810-49e0-aa8e-36a7e90e42b6', 'abaya-priere-brodee-nour', 'Abaya de prière brodée « Nour »', '256aeaaa-8f04-4857-8b3d-07389b3e4bbd', 'Abaya longue, broderies fines aux manches.', 'Une abaya longue et fluide, rehaussée de broderies délicates aux manches et aux poignets. Élégante pour la mosquée comme pour les cérémonies.', 'Entretien : lavage délicat à 30 °C, sur l’envers
Longueur : à préciser par la boutique', 18000, null, 'published', true, false, null, array['abaya', 'broderie', 'cérémonie']::text[], 'Taille', 'Couleur', 2, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:02:00.000Z'),
('7ed781e4-fec2-4425-9ec4-cb220861ff5b', 'jilbab-capuche-une-piece', 'Jilbab une pièce à capuche', '256aeaaa-8f04-4857-8b3d-07389b3e4bbd', 'Une seule pièce, capuche intégrée, tombé ample.', 'Un jilbab une pièce qui s’enfile en quelques secondes, avec capuche intégrée et manches larges. Idéal pour la prière à la maison comme à l’extérieur.', 'Entretien : lavage à 30 °C
Taille unique', 14000, null, 'published', false, false, null, array['jilbab', 'prière']::text[], 'Taille', 'Couleur', 3, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:03:00.000Z'),
('60acd6e6-8383-4909-8cd3-822816d6c133', 'robe-priere-zippee-serenite', 'Robe de prière zippée « Sérénité »', '256aeaaa-8f04-4857-8b3d-07389b3e4bbd', 'Une pièce zippée sur le devant, pratique au quotidien.', 'Une robe de prière une pièce avec fermeture éclair sur le devant, pour s’habiller rapidement. Coupe ample et tissu doux.', 'Entretien : lavage à 30 °C
Fermeture éclair sur le devant', 13500, null, 'published', false, false, null, array['prière', 'zip']::text[], 'Taille', 'Couleur', 4, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:04:00.000Z'),
('cda5428d-3c8d-4852-9425-9f7be0a69fd8', 'tapis-priere-velours-medine', 'Tapis de prière velours « Médine »', 'b9dc5028-60cd-4a1d-9317-be129b7e0817', 'Velours épais, motif mihrab et franges.', 'Un tapis de prière en velours épais au motif de mihrab traditionnel, bordé de franges. Moelleux sous les genoux et facile à rouler.', 'Dimensions : environ 70 × 110 cm (à confirmer)
Entretien : brossage, nettoyage à sec recommandé', 8000, null, 'published', true, false, null, array['tapis', 'velours']::text[], 'Taille', 'Couleur', 5, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:05:00.000Z'),
('bb99a011-d762-4fbe-9fa3-febbaee80440', 'tapis-priere-voyage-pliable', 'Tapis de prière de voyage pliable', 'b9dc5028-60cd-4a1d-9317-be129b7e0817', 'Léger et pliable, avec pochette et boussole.', 'Un tapis fin et léger qui se plie dans sa pochette zippée, accompagné d’une petite boussole pour trouver la qibla en déplacement.', 'Livré avec pochette et boussole
Dimensions dépliées : à préciser', 5000, null, 'published', false, false, null, array['voyage', 'tapis']::text[], 'Taille', 'Couleur', 6, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:06:00.000Z'),
('af4659d6-33eb-48b5-8069-95b4bf9ef27b', 'tapis-priere-mousse-confort', 'Tapis de prière mousse confort', 'b9dc5028-60cd-4a1d-9317-be129b7e0817', 'Rembourrage épais pour soulager genoux et dos.', 'Un tapis matelassé avec rembourrage en mousse, conçu pour plus de confort lors des longues prières, notamment pour les personnes âgées.', 'Épaisseur : à préciser
Entretien : housse lavable (à confirmer)', 12000, null, 'published', false, true, null, array['confort', 'tapis']::text[], 'Taille', 'Couleur', 7, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:07:00.000Z'),
('3319c6ba-1a7d-4321-b666-6d5833329697', 'tapis-priere-enfant', 'Tapis de prière enfant', 'b9dc5028-60cd-4a1d-9317-be129b7e0817', 'Petit format aux motifs étoiles et croissants.', 'Un tapis de petit format aux motifs d’étoiles et de croissants, pour accompagner les enfants dans l’apprentissage de la prière.', 'Petit format adapté aux enfants', 4500, null, 'published', false, false, null, array['enfant', 'tapis']::text[], 'Taille', 'Couleur', 8, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:08:00.000Z'),
('35f50970-4f7c-44a1-85f3-154e5c753c27', 'coffret-tapis-chapelet', 'Coffret tapis & chapelet', 'b9dc5028-60cd-4a1d-9317-be129b7e0817', 'Un tapis, un chapelet et un joli coffret à offrir.', 'Un coffret cadeau réunissant un tapis de prière et un chapelet assorti, présentés dans une boîte rigide avec ruban. Une attention appréciée pour un mariage, un baptême ou un retour de pèlerinage.', 'Contenu : 1 tapis + 1 chapelet
Boîte cadeau incluse', 15000, 17500, 'published', false, false, null, array['cadeau', 'coffret']::text[], 'Taille', 'Couleur', 9, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:09:00.000Z'),
('3f52718e-f735-4d15-ba5c-00e00f0a0daf', 'eau-de-parfum-oud-royal', 'Eau de parfum « Oud Royal »', '82fa91c5-8e37-4be8-a486-67c7f90a1daa', 'Notes boisées d’oud, d’ambre et de musc.', 'Un parfum oriental aux notes boisées d’oud, réchauffées par l’ambre et le musc. Un sillage présent, à porter le soir ou pour les grandes occasions.', 'Famille : orientale boisée
Usage externe uniquement', 9000, null, 'published', true, false, null, array['oud', 'oriental']::text[], 'Contenance', 'Couleur', 10, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:10:00.000Z'),
('2a37e6ff-e7af-4fa8-99d8-7d216883c412', 'huile-parfumee-musc-blanc', 'Huile parfumée musc blanc', '82fa91c5-8e37-4be8-a486-67c7f90a1daa', 'Huile sans alcool en roll-on de 12 ml.', 'Une huile parfumée douce au musc blanc, sans alcool, en flacon roll-on à glisser dans le sac.', 'Contenance : 12 ml
Sans alcool', 3500, null, 'published', false, false, null, array['musc', 'sans alcool']::text[], 'Taille', 'Couleur', 11, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:11:00.000Z'),
('ee361ef0-212b-465d-8414-1f0e564d172b', 'coffret-trio-parfums-femme', 'Coffret trio parfums femme', '82fa91c5-8e37-4be8-a486-67c7f90a1daa', 'Trois parfums floraux dans un coffret cadeau.', 'Trois flacons de parfums floraux réunis dans un coffret prêt à offrir. Une jolie façon de découvrir plusieurs senteurs.', 'Contenu : 3 flacons (contenances à préciser)
Boîte cadeau incluse', 25000, 30000, 'published', false, false, null, array['coffret', 'cadeau', 'floral']::text[], 'Taille', 'Couleur', 12, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:12:00.000Z'),
('23770357-90a2-4c3e-892c-7cc9ffcb2ca8', 'brume-corporelle-fleur-oranger', 'Brume corporelle « Fleur d’oranger »', '82fa91c5-8e37-4be8-a486-67c7f90a1daa', 'Une brume fraîche et légère pour le corps.', 'Une brume légère aux notes de fleur d’oranger, à vaporiser sur la peau ou les vêtements pour une sensation de fraîcheur.', 'Contenance : à préciser
Usage externe uniquement', 6000, null, 'published', false, true, null, array['brume', 'fleur d’oranger']::text[], 'Taille', 'Couleur', 13, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:13:00.000Z'),
('958b4751-5764-4ff2-a6d8-1563e42e4094', 'thiouraye-nuit-de-dakar', 'Thiouraye « Nuit de Dakar »', '82fa91c5-8e37-4be8-a486-67c7f90a1daa', 'Encens traditionnel pour parfumer la maison.', 'Un thiouraye aux notes chaudes et enveloppantes, à faire brûler sur du charbon dans un encensoir pour parfumer la maison et le linge.', 'Conditionnement : sachet (poids à préciser)
Ne jamais laisser un encensoir allumé sans surveillance', 4000, null, 'published', true, false, null, array['thiouraye', 'encens', 'maison']::text[], 'Taille', 'Couleur', 14, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:14:00.000Z'),
('e4de1008-eecd-455d-9231-5f2e6e8e1c3b', 'jean-droit-femme', 'Jean droit femme', 'e8a3b719-c24f-4492-8f11-dc4f9c805688', 'Coupe droite, denim épais. Pièce de seconde main.', 'Un jean coupe droite en denim épais, sélectionné pour son très bon état. Chaque pièce de friperie est unique : la teinte peut légèrement varier.', 'Article de seconde main
État : très bon', 6000, null, 'published', false, false, 'Très bon état — sélectionné et lavé', array['friperie', 'jean']::text[], 'Taille', 'Couleur', 15, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:15:00.000Z'),
('0ba0f38b-e3b8-4188-b8cb-84dd4ce3a192', 'chemise-homme-coton', 'Chemise homme en coton', 'e8a3b719-c24f-4492-8f11-dc4f9c805688', 'Chemise de seconde main, lavée et repassée.', 'Une chemise en coton de seconde main, sélectionnée, lavée et repassée. Pièce unique.', 'Article de seconde main
État : très bon', 4000, null, 'published', false, false, 'Très bon état — lavée et repassée', array['friperie', 'homme']::text[], 'Taille', 'Couleur', 16, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:16:00.000Z'),
('c8e4636b-9411-4132-b802-5009281d88e8', 'veste-jean-vintage', 'Veste en jean vintage', 'e8a3b719-c24f-4492-8f11-dc4f9c805688', 'Veste en jean au style intemporel.', 'Une veste en jean vintage, coupe classique. Les légères traces d’usure font partie de son charme : voir l’état précisé ci-dessous.', 'Article de seconde main
État : bon, légères traces d’usure', 9000, null, 'published', false, true, 'Bon état — légères traces d’usure', array['friperie', 'vintage']::text[], 'Taille', 'Couleur', 17, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:17:00.000Z'),
('aa4b8184-3119-4cc9-8f0f-3a4ab7f2cbef', 'robe-ete-fleurie', 'Robe d’été fleurie', 'e8a3b719-c24f-4492-8f11-dc4f9c805688', 'Robe midi légère à imprimé fleuri.', 'Une robe midi fluide à imprimé fleuri, idéale pour les journées chaudes. Pièce de seconde main en très bon état.', 'Article de seconde main
État : très bon', 7000, null, 'published', false, false, 'Très bon état', array['friperie', 'robe']::text[], 'Taille', 'Couleur', 18, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:18:00.000Z'),
('8258ebab-33fc-4f66-8916-41c50072d3e0', 'ensemble-wax-deux-pieces', 'Ensemble wax deux pièces', 'ede69820-7d7d-4373-be0f-1b9eb6153539', 'Haut et jupe en wax, coupe moderne.', 'Un ensemble haut + jupe en tissu wax aux motifs graphiques, coupé pour un tombé moderne. À porter ensemble ou séparément.', 'Tissu : wax
Entretien : lavage à l’envers à 30 °C', 20000, null, 'published', true, true, null, array['wax', 'ensemble']::text[], 'Taille', 'Couleur', 19, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:19:00.000Z'),
('d798aefa-ae2b-4c7f-b1b3-33bc7b65f1a1', 'ensemble-lin-ete', 'Ensemble lin été', 'ede69820-7d7d-4373-be0f-1b9eb6153539', 'Chemise ample et pantalon large en lin.', 'Un ensemble léger composé d’une chemise ample et d’un pantalon large, parfait pour la chaleur.', 'Tissu : lin (composition à préciser)
Entretien : lavage à 30 °C', 17000, null, 'published', false, false, null, array['lin', 'été']::text[], 'Taille', 'Couleur', 20, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:20:00.000Z'),
('2c61b578-48af-4c4f-b665-5f06581cccad', 'ensemble-tunique-pantalon-brode', 'Ensemble tunique & pantalon brodé', 'ede69820-7d7d-4373-be0f-1b9eb6153539', 'Tunique longue à encolure brodée et pantalon assorti.', 'Une tunique longue à l’encolure brodée, accompagnée d’un pantalon droit assorti. Une tenue élégante pour les fêtes et les visites.', 'Entretien : lavage délicat', 22000, null, 'published', false, false, null, array['brodé', 'ensemble', 'fête']::text[], 'Taille', 'Couleur', 21, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:21:00.000Z'),
('6af68761-01d7-4892-957b-e71b383343f4', 'ensemble-enfant-wax', 'Ensemble enfant wax', 'ede69820-7d7d-4373-be0f-1b9eb6153539', 'Haut et short en wax pour enfant.', 'Un ensemble haut + short en wax coloré pour les enfants, confortable pour jouer comme pour les fêtes.', 'Tailles indicatives par âge', 9000, null, 'published', false, false, null, array['enfant', 'wax']::text[], 'Taille', 'Couleur', 22, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:22:00.000Z'),
('198da229-1220-4e2c-968c-244b75e761ce', 'savon-noir-beldi', 'Savon noir beldi', '3f60feaa-a957-4603-b8ac-e30814709cb1', 'Savon noir traditionnel pour le rituel du hammam.', 'Le savon noir beldi s’utilise lors du rituel du hammam : appliqué sur peau humide, il prépare la peau au gommage avec un gant kessa.', 'Contenance : à préciser
Usage externe uniquement', 3000, null, 'published', false, false, null, array['hammam', 'soin']::text[], 'Taille', 'Couleur', 23, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:23:00.000Z'),
('25a877c7-24ae-4606-9645-e4a9b340ffd8', 'huile-argan-cosmetique', 'Huile d’argan cosmétique', '3f60feaa-a957-4603-b8ac-e30814709cb1', 'Pour la peau et les cheveux, flacon compte-gouttes.', 'Une huile d’argan à usage cosmétique, à appliquer en quelques gouttes sur la peau, les cheveux ou les ongles.', 'Contenance : 100 ml (à confirmer)
Usage externe uniquement', 8000, null, 'published', true, false, null, array['argan', 'soin', 'cheveux']::text[], 'Taille', 'Couleur', 24, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:24:00.000Z'),
('56463018-e1c8-4dc1-acc0-4eb279d00bc3', 'caftan-brode', 'Caftan brodé', '3f60feaa-a957-4603-b8ac-e30814709cb1', 'Caftan satiné orné d’une sfifa et de boutons.', 'Un caftan au tissu satiné, orné d’une sfifa (passementerie) le long du devant et de petits boutons. Une pièce de fête.', 'Entretien : nettoyage à sec recommandé', 35000, null, 'published', false, false, null, array['caftan', 'fête']::text[], 'Taille', 'Couleur', 25, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:25:00.000Z'),
('39fb6be9-319d-4952-8d1d-f1e7b0d80ed8', 'ghassoul-argile', 'Ghassoul (argile du Maroc)', '3f60feaa-a957-4603-b8ac-e30814709cb1', 'Argile lavante pour masques visage et cheveux.', 'Le ghassoul est une argile traditionnellement utilisée au Maroc en masque pour le visage et les cheveux. À mélanger avec de l’eau tiède.', 'Poids : à préciser
Usage externe uniquement', 3500, null, 'published', false, false, null, array['argile', 'soin']::text[], 'Taille', 'Couleur', 26, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:26:00.000Z'),
('93bdd4b6-11b7-45c1-ad09-fd38cecadcb3', 'theiere-marocaine', 'Théière marocaine & verres', '3f60feaa-a957-4603-b8ac-e30814709cb1', 'Théière ciselée et deux verres décorés.', 'Une théière marocaine au métal ciselé, accompagnée de deux verres décorés, pour servir le thé dans les règles de l’art.', 'Contenu : 1 théière + 2 verres
Matériau : à préciser', 16000, 18000, 'published', false, false, null, array['thé', 'art de la table', 'cadeau']::text[], 'Taille', 'Couleur', 27, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:27:00.000Z'),
('11315759-b54c-4bba-bdb0-10abd553b834', 'mini-ventilateur-rechargeable', 'Mini ventilateur rechargeable', '2b49927f-3e07-43f6-9cf4-a065087f0be4', 'Ventilateur portable USB, 3 vitesses.', 'Un petit ventilateur rechargeable par USB, avec trois vitesses, à poser sur un bureau ou à tenir en main.', 'Recharge : USB (câble inclus, à confirmer)
Autonomie : à préciser', 5000, null, 'published', false, false, null, array['chaleur', 'pratique']::text[], 'Taille', 'Couleur', 28, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:28:00.000Z'),
('b718d125-48fe-4218-bc36-e0ab9b47ac66', 'organisateur-cosmetiques-rotatif', 'Organisateur cosmétiques rotatif', '2b49927f-3e07-43f6-9cf4-a065087f0be4', 'Présentoir transparent rotatif pour maquillage.', 'Un présentoir rotatif en matière transparente pour ranger rouges à lèvres, pinceaux et petits flacons.', 'Dimensions : à préciser', 7500, null, 'published', false, false, null, array['rangement', 'beauté']::text[], 'Taille', 'Couleur', 29, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:29:00.000Z'),
('946561ef-0ecc-4292-8f5c-aaa503373b38', 'sac-main-structure', 'Sac à main structuré', '2b49927f-3e07-43f6-9cf4-a065087f0be4', 'Sac à anse avec fermoir doré.', 'Un sac à main structuré avec anse supérieure et fermoir doré, assez grand pour l’essentiel de la journée.', 'Matière : à préciser
Dimensions : à préciser', 14000, null, 'published', false, true, null, array['accessoire', 'sac']::text[], 'Taille', 'Couleur', 30, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:30:00.000Z'),
('bdb82a95-f880-46b8-85d6-d4ef860ab062', 'gourde-isotherme', 'Gourde isotherme', '2b49927f-3e07-43f6-9cf4-a065087f0be4', 'Gourde en inox à double paroi.', 'Une gourde en acier inoxydable à double paroi, pratique pour garder sa boisson au frais toute la journée.', 'Contenance : à préciser', 6500, null, 'published', false, false, null, array['pratique', 'eau']::text[], 'Taille', 'Couleur', 31, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:31:00.000Z'),
('0ca7f26c-1ce2-44dd-8199-c14e12ba0097', 'lasalmah-coffret-signature', 'Lasalmah — Coffret signature (exemple)', '5d3c7100-93fc-4313-8071-84ee2a48a651', 'Article d’exemple : contenu à définir par la boutique.', 'Fiche d’exemple pour la sélection Lasalmah. Remplacez ce texte par la description réelle du produit depuis l’administration.', 'À compléter', 22000, null, 'published', false, false, null, array['lasalmah', 'coffret']::text[], 'Taille', 'Couleur', 32, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:32:00.000Z'),
('80386f08-e3b7-4def-ac63-e056ca941665', 'lasalmah-coffret-decouverte', 'Lasalmah — Coffret découverte (exemple)', '5d3c7100-93fc-4313-8071-84ee2a48a651', 'Article d’exemple : contenu à définir par la boutique.', 'Fiche d’exemple pour la sélection Lasalmah. Remplacez ce texte par la description réelle du produit depuis l’administration.', 'À compléter', 10000, null, 'published', false, false, null, array['lasalmah', 'coffret']::text[], 'Taille', 'Couleur', 33, true, '2026-11-01T09:00:00.000Z', '2026-11-01T09:33:00.000Z')
on conflict (id) do nothing;

insert into public.product_variants (id, product_id, sku, option1, option2, color_hex, price_override, stock, is_active, position) values

('a9d0920a-4b7a-4621-90b8-bb083fda487f', '6b42fe0d-8481-49b2-9364-9ba3feedc580', null, 'Taille unique', 'Lilas', '#C4B5FD', null, 8, true, 0),
('edf68ed3-b10c-42c8-b423-8e199d62c066', '6b42fe0d-8481-49b2-9364-9ba3feedc580', null, 'Taille unique', 'Rose poudré', '#E8A5C0', null, 8, true, 1),
('6f9e0307-5d2a-4c18-9c6f-3aa1cf03b2ea', '6b42fe0d-8481-49b2-9364-9ba3feedc580', null, 'Taille unique', 'Prune', '#5B2150', null, 10, true, 2),
('2acafd47-e2ab-4318-830c-eaf58c84425e', '8e12d846-09e2-40d9-bcc3-9040b1e220ab', null, '4-6 ans', 'Rose pâle', '#F9C6DA', null, 14, true, 0),
('1d34a4b3-f5c7-4d8e-8250-e4f96d5695a4', '8e12d846-09e2-40d9-bcc3-9040b1e220ab', null, '4-6 ans', 'Ivoire', '#F5F0E6', null, 8, true, 1),
('78f89e83-70cc-4744-9bcc-83813c36875a', '8e12d846-09e2-40d9-bcc3-9040b1e220ab', null, '7-9 ans', 'Rose pâle', '#F9C6DA', null, 7, true, 2),
('de303c9f-9481-40ea-bc50-0d755b316730', '8e12d846-09e2-40d9-bcc3-9040b1e220ab', null, '7-9 ans', 'Ivoire', '#F5F0E6', null, 10, true, 3),
('130ae987-ee2f-4150-9bfc-3135ad5cf31e', '8e12d846-09e2-40d9-bcc3-9040b1e220ab', null, '10-12 ans', 'Rose pâle', '#F9C6DA', null, 6, true, 4),
('ae28f273-d00f-4dc6-b2fb-f0b98e0cdbe4', '8e12d846-09e2-40d9-bcc3-9040b1e220ab', null, '10-12 ans', 'Ivoire', '#F5F0E6', null, 3, true, 5),
('7e3e5a2c-1ea0-4901-ab63-bd422edf92af', '4a015189-f810-49e0-aa8e-36a7e90e42b6', null, 'M', 'Prune', '#4A1650', null, 0, true, 0),
('eafb2f31-69f8-479a-8363-48b70d596728', '4a015189-f810-49e0-aa8e-36a7e90e42b6', null, 'M', 'Anthracite', '#2E2A33', null, 2, true, 1),
('cfa9f493-7c24-4eea-bb6e-a6f9d55069e8', '4a015189-f810-49e0-aa8e-36a7e90e42b6', null, 'L', 'Prune', '#4A1650', null, 13, true, 2),
('ce49f44c-5059-462f-b220-784253dc7c4d', '4a015189-f810-49e0-aa8e-36a7e90e42b6', null, 'L', 'Anthracite', '#2E2A33', null, 5, true, 3),
('fe5deb61-244c-47ba-8589-15b3d4c1277c', '4a015189-f810-49e0-aa8e-36a7e90e42b6', null, 'XL', 'Prune', '#4A1650', null, 7, true, 4),
('84c57f7a-579f-44df-902c-22ecdc560b21', '4a015189-f810-49e0-aa8e-36a7e90e42b6', null, 'XL', 'Anthracite', '#2E2A33', null, 10, true, 5),
('71f7f72e-54c5-43a3-8583-5cf4f7f8ef79', '7ed781e4-fec2-4425-9ec4-cb220861ff5b', null, 'Taille unique', 'Mauve', '#9D7BB0', null, 8, true, 0),
('8996a383-0ba7-4e98-b02c-68d992e2cdc6', '7ed781e4-fec2-4425-9ec4-cb220861ff5b', null, 'Taille unique', 'Gris perle', '#C9C3CF', null, 9, true, 1),
('f9f3be88-07e1-4803-b0e8-d5aed81b6229', '60acd6e6-8383-4909-8cd3-822816d6c133', null, 'S/M', 'Violet doux', '#A78BFA', null, 14, true, 0),
('55977ec2-0497-4019-81f9-ec5c22b3c853', '60acd6e6-8383-4909-8cd3-822816d6c133', null, 'S/M', 'Sauge', '#A3AFA0', null, 13, true, 1),
('7ec8ede8-09dc-46f5-9428-9c160ade92eb', '60acd6e6-8383-4909-8cd3-822816d6c133', null, 'L/XL', 'Violet doux', '#A78BFA', null, 2, true, 2),
('fbd3e9a2-74c5-4ff7-a7f9-74f4591582d1', '60acd6e6-8383-4909-8cd3-822816d6c133', null, 'L/XL', 'Sauge', '#A3AFA0', null, 10, true, 3),
('a78dcf26-bb42-4e33-b463-dc0ca3eb4611', 'cda5428d-3c8d-4852-9425-9f7be0a69fd8', null, null, 'Bordeaux', '#7A1F3D', null, 0, true, 0),
('223508a8-a78b-42e9-90e9-7c769cbf01d7', 'cda5428d-3c8d-4852-9425-9f7be0a69fd8', null, null, 'Émeraude', '#1F5E4E', null, 6, true, 1),
('f1a89bf4-ab31-4fa3-906f-2bfaf3401999', 'cda5428d-3c8d-4852-9425-9f7be0a69fd8', null, null, 'Bleu nuit', '#24325E', null, 9, true, 2),
('43fa4fda-7ccc-4ead-b585-1ad846aa27bb', 'bb99a011-d762-4fbe-9fa3-febbaee80440', null, null, 'Bleu marine', '#24325E', null, 8, true, 0),
('791ead10-ca71-4993-9d04-14ea4ef67bd5', 'bb99a011-d762-4fbe-9fa3-febbaee80440', null, null, 'Prune', '#5B2150', null, 3, true, 1),
('bf1d8c7f-3ca7-4c34-82c0-a3b97b8d12a6', 'af4659d6-33eb-48b5-8069-95b4bf9ef27b', null, null, 'Gris violet', '#6B5B8C', null, 5, true, 0),
('c619c8e2-b631-4b0d-aa1a-20e0df004f8b', 'af4659d6-33eb-48b5-8069-95b4bf9ef27b', null, null, 'Taupe', '#8C7A6B', null, 6, true, 1),
('fe289862-3263-4e8b-9f96-cab040990b01', '3319c6ba-1a7d-4321-b666-6d5833329697', null, null, 'Rose', '#F9A8D4', null, 11, true, 0),
('833f1632-87ed-4871-ab04-1dd04d32312f', '3319c6ba-1a7d-4321-b666-6d5833329697', null, null, 'Bleu ciel', '#93C5FD', null, 10, true, 1),
('36ee3c70-d332-41af-8939-302afd13fe09', '35f50970-4f7c-44a1-85f3-154e5c753c27', null, null, 'Violet', '#5B21B6', null, 2, true, 0),
('3470ee72-980e-4adb-9e14-95e0febbb899', '35f50970-4f7c-44a1-85f3-154e5c753c27', null, null, 'Magenta', '#C026D3', null, 14, true, 1),
('f3b3f9d9-8c73-448e-92a2-97fbe64e4258', '3f52718e-f735-4d15-ba5c-00e00f0a0daf', null, '50 ml', null, null, null, 12, true, 0),
('f8ea8d23-c445-488e-9755-16910a45e2a4', '3f52718e-f735-4d15-ba5c-00e00f0a0daf', null, '100 ml', null, null, 15000, 7, true, 1),
('eb683a38-710f-4e51-a7a5-f91aa33192e3', '2a37e6ff-e7af-4fa8-99d8-7d216883c412', null, null, 'Musc blanc', '#F3EEE6', null, 14, true, 0),
('b71cc645-0ff0-4a8e-b385-29ab2ae28754', '2a37e6ff-e7af-4fa8-99d8-7d216883c412', null, null, 'Musc rose', '#F7C6D9', null, 5, true, 1),
('fb0cc472-2920-4ccf-9fa0-df8014f95fb5', 'ee361ef0-212b-465d-8414-1f0e564d172b', null, null, null, null, null, 0, true, 0),
('cb7ce62d-86a5-474c-8c37-47475f7a42a6', '23770357-90a2-4c3e-892c-7cc9ffcb2ca8', null, null, null, null, null, 6, true, 0),
('48cbc80f-153e-4708-aed1-36a929b4074a', '958b4751-5764-4ff2-a6d8-1563e42e4094', null, null, null, null, null, 5, true, 0),
('8f4ef844-1465-4797-9e69-abf6e46e5cf9', 'e4de1008-eecd-455d-9231-5f2e6e8e1c3b', null, '36', null, null, null, 1, true, 0),
('05b50e86-43f8-4f29-a803-95b474dac0a7', 'e4de1008-eecd-455d-9231-5f2e6e8e1c3b', null, '38', null, null, null, 1, true, 1),
('75bef561-a2a9-4c7e-aa43-bdfbd90a26c8', 'e4de1008-eecd-455d-9231-5f2e6e8e1c3b', null, '40', null, null, null, 1, true, 2),
('cc20f363-18f7-4528-b51e-c219e3f97c1e', 'e4de1008-eecd-455d-9231-5f2e6e8e1c3b', null, '42', null, null, null, 1, true, 3),
('527da7e1-5ee4-4dee-b32f-8dcbbbf61788', '0ba0f38b-e3b8-4188-b8cb-84dd4ce3a192', null, 'M', null, null, null, 1, true, 0),
('3f0b2dda-7257-47f5-9fa8-c28caf54d777', '0ba0f38b-e3b8-4188-b8cb-84dd4ce3a192', null, 'L', null, null, null, 1, true, 1),
('71378364-1658-47bd-9774-36aa4b9aaa0b', '0ba0f38b-e3b8-4188-b8cb-84dd4ce3a192', null, 'XL', null, null, null, 1, true, 2),
('3036fa73-cb73-4ede-b912-901d49e046a8', 'c8e4636b-9411-4132-b802-5009281d88e8', null, 'S', null, null, null, 1, true, 0),
('1543a60d-d798-429c-b17a-e823eaa5a712', 'c8e4636b-9411-4132-b802-5009281d88e8', null, 'M', null, null, null, 1, true, 1),
('41c80f0c-0f94-4b1d-8ced-c6b60f89068f', 'aa4b8184-3119-4cc9-8f0f-3a4ab7f2cbef', null, 'S', null, null, null, 1, true, 0),
('d82e57ae-87fd-4323-8542-32443b550921', 'aa4b8184-3119-4cc9-8f0f-3a4ab7f2cbef', null, 'M', null, null, null, 1, true, 1),
('eba0d1b5-5477-4f04-b8c8-666327e28f1a', 'aa4b8184-3119-4cc9-8f0f-3a4ab7f2cbef', null, 'L', null, null, null, 1, true, 2),
('ec6fc891-f798-4d2e-8f99-01bf06485b14', '8258ebab-33fc-4f66-8916-41c50072d3e0', null, 'S', 'Magenta & orange', '#C026D3', null, 5, true, 0),
('31512a3b-61a5-4444-89fd-e1358c506afe', '8258ebab-33fc-4f66-8916-41c50072d3e0', null, 'S', 'Bleu & jaune', '#2747A8', null, 8, true, 1),
('dc05d9ab-d634-4874-9fa1-898dfc2de54e', '8258ebab-33fc-4f66-8916-41c50072d3e0', null, 'M', 'Magenta & orange', '#C026D3', null, 11, true, 2),
('a0c62209-0f2a-415e-8d63-b19f828e22e4', '8258ebab-33fc-4f66-8916-41c50072d3e0', null, 'M', 'Bleu & jaune', '#2747A8', null, 12, true, 3),
('329cf20a-41d6-4a3d-ac4c-aac4faa33b2f', '8258ebab-33fc-4f66-8916-41c50072d3e0', null, 'L', 'Magenta & orange', '#C026D3', null, 8, true, 4),
('9cd973f8-312b-47cf-a416-07ee13f65465', '8258ebab-33fc-4f66-8916-41c50072d3e0', null, 'L', 'Bleu & jaune', '#2747A8', null, 4, true, 5),
('37f04e9c-3526-4879-972a-d35a0a985077', '8258ebab-33fc-4f66-8916-41c50072d3e0', null, 'XL', 'Magenta & orange', '#C026D3', null, 8, true, 6),
('ee9caeb6-f053-4273-8526-30c823a2ba5d', '8258ebab-33fc-4f66-8916-41c50072d3e0', null, 'XL', 'Bleu & jaune', '#2747A8', null, 5, true, 7),
('6ddd89d0-cd36-4ced-8b66-ceaed22561b3', 'd798aefa-ae2b-4c7f-b1b3-33bc7b65f1a1', null, 'S', 'Sable', '#D8C7A8', null, 6, true, 0),
('2b636748-1ca7-42ad-a047-c1122f0f86df', 'd798aefa-ae2b-4c7f-b1b3-33bc7b65f1a1', null, 'S', 'Lilas', '#C9B6E4', null, 13, true, 1),
('e7e22c76-a1d1-466f-b9fc-83d8e4ce0409', 'd798aefa-ae2b-4c7f-b1b3-33bc7b65f1a1', null, 'M', 'Sable', '#D8C7A8', null, 14, true, 2),
('a0bcbd5a-9100-4dab-96ed-6390558f3f99', 'd798aefa-ae2b-4c7f-b1b3-33bc7b65f1a1', null, 'M', 'Lilas', '#C9B6E4', null, 9, true, 3),
('6136bb09-a163-460c-8128-3e9b6b797576', 'd798aefa-ae2b-4c7f-b1b3-33bc7b65f1a1', null, 'L', 'Sable', '#D8C7A8', null, 6, true, 4),
('d1f7f699-0de3-4934-8234-15672454065a', 'd798aefa-ae2b-4c7f-b1b3-33bc7b65f1a1', null, 'L', 'Lilas', '#C9B6E4', null, 7, true, 5),
('ddc81a7f-74ac-496a-be30-9d95769831a8', '2c61b578-48af-4c4f-b665-5f06581cccad', null, 'M', 'Émeraude', '#1F6B57', null, 4, true, 0),
('8d2a1929-cc5d-4c7a-b9f8-d31f4a5ebbb0', '2c61b578-48af-4c4f-b665-5f06581cccad', null, 'M', 'Prune', '#5B2150', null, 9, true, 1),
('17e27422-0b21-4687-9521-dd905ea191ed', '2c61b578-48af-4c4f-b665-5f06581cccad', null, 'L', 'Émeraude', '#1F6B57', null, 14, true, 2),
('95d707b2-03dc-4551-ac62-e3d8c28e3e37', '2c61b578-48af-4c4f-b665-5f06581cccad', null, 'L', 'Prune', '#5B2150', null, 11, true, 3),
('b2095a12-69e2-4509-91be-b08c9ad8435b', '2c61b578-48af-4c4f-b665-5f06581cccad', null, 'XL', 'Émeraude', '#1F6B57', null, 8, true, 4),
('56d56662-0de4-482b-a46e-306c5fc9b9dd', '2c61b578-48af-4c4f-b665-5f06581cccad', null, 'XL', 'Prune', '#5B2150', null, 3, true, 5),
('0d04cc0c-b883-478d-8343-e74e5ad5cc47', '6af68761-01d7-4892-957b-e71b383343f4', null, '2-4 ans', 'Rose & jaune', '#EC4899', null, 14, true, 0),
('5a168a40-c1e8-4657-9788-5c325328d5c9', '6af68761-01d7-4892-957b-e71b383343f4', null, '2-4 ans', 'Vert & violet', '#3F8F5A', null, 5, true, 1),
('54725810-8293-4ac1-9bc2-e8bad1be8d43', '6af68761-01d7-4892-957b-e71b383343f4', null, '5-7 ans', 'Rose & jaune', '#EC4899', null, 8, true, 2),
('c3e6f284-fd68-4c4b-a748-182e970f5275', '6af68761-01d7-4892-957b-e71b383343f4', null, '5-7 ans', 'Vert & violet', '#3F8F5A', null, 0, true, 3),
('f3399251-92ef-42d2-bfa6-9bbbe3fb3514', '6af68761-01d7-4892-957b-e71b383343f4', null, '8-10 ans', 'Rose & jaune', '#EC4899', null, 14, true, 4),
('63a8027b-2e86-4af6-a714-62dde6e70218', '6af68761-01d7-4892-957b-e71b383343f4', null, '8-10 ans', 'Vert & violet', '#3F8F5A', null, 2, true, 5),
('b10657d7-e348-450a-83e3-ed11656e760c', '198da229-1220-4e2c-968c-244b75e761ce', null, null, null, null, null, 3, true, 0),
('fbf3216d-1578-4a3c-97d0-b65ff45163b6', '25a877c7-24ae-4606-9645-e4a9b340ffd8', null, null, null, null, null, 9, true, 0),
('e2476297-13e5-4cdc-9058-e4e5756ce47a', '56463018-e1c8-4dc1-acc0-4eb279d00bc3', null, 'M', 'Violet royal', '#5B21B6', null, 8, true, 0),
('ccbde403-b368-4948-b5eb-06a53b907512', '56463018-e1c8-4dc1-acc0-4eb279d00bc3', null, 'M', 'Émeraude', '#1F6B57', null, 10, true, 1),
('6596911e-ad91-4d2d-af0f-67d40b30c283', '56463018-e1c8-4dc1-acc0-4eb279d00bc3', null, 'L', 'Violet royal', '#5B21B6', null, 5, true, 2),
('d3522116-7f18-400d-8bbc-7f2037228cef', '56463018-e1c8-4dc1-acc0-4eb279d00bc3', null, 'L', 'Émeraude', '#1F6B57', null, 11, true, 3),
('8b4537c6-b94e-464f-ad47-ed70d448c401', '56463018-e1c8-4dc1-acc0-4eb279d00bc3', null, 'XL', 'Violet royal', '#5B21B6', null, 11, true, 4),
('2099c2de-d110-4abb-963e-d6dcd528df71', '56463018-e1c8-4dc1-acc0-4eb279d00bc3', null, 'XL', 'Émeraude', '#1F6B57', null, 3, true, 5),
('62ea3f03-5f7c-431c-b5e6-fce942010782', '39fb6be9-319d-4952-8d1d-f1e7b0d80ed8', null, null, null, null, null, 8, true, 0),
('ba0816c4-69ee-4467-82b7-d61ec79ea1b9', '93bdd4b6-11b7-45c1-ad09-fd38cecadcb3', null, null, null, null, null, 8, true, 0),
('0cc6c5e3-8ce6-4318-b1a3-2f8596566062', '11315759-b54c-4bba-bdb0-10abd553b834', null, null, 'Blanc lilas', '#E9E1F7', null, 0, true, 0),
('c7fd29c7-89a4-4826-8814-c811872b9708', '11315759-b54c-4bba-bdb0-10abd553b834', null, null, 'Rose', '#F9A8D4', null, 0, true, 1),
('201da2f7-a3aa-4cd2-a6dd-541d41b51458', 'b718d125-48fe-4218-bc36-e0ab9b47ac66', null, null, null, null, null, 8, true, 0),
('e928746a-899f-44cb-8cd4-f1c03da99e01', '946561ef-0ecc-4292-8f5c-aaa503373b38', null, null, 'Prune', '#5B2150', null, 4, true, 0),
('bbafe51c-cd78-4685-92f9-194aedd660f3', '946561ef-0ecc-4292-8f5c-aaa503373b38', null, null, 'Blush', '#EBB7C8', null, 11, true, 1),
('1f56fbd5-b5fd-4466-9e34-7ebbbbe7b464', 'bdb82a95-f880-46b8-85d6-d4ef860ab062', null, null, 'Violet mat', '#6D4AA8', null, 9, true, 0),
('5170b6e1-ccbd-4396-837f-e1f33eb8e2f8', 'bdb82a95-f880-46b8-85d6-d4ef860ab062', null, null, 'Rose mat', '#E58BB4', null, 7, true, 1),
('ff816f52-9ff8-49eb-a97c-8214cb77e84d', '0ca7f26c-1ce2-44dd-8199-c14e12ba0097', null, null, null, null, null, 14, true, 0),
('5b762eba-72e0-4c21-96eb-d380195ab927', '80386f08-e3b7-4def-ac63-e056ca941665', null, null, null, null, null, 12, true, 0)
on conflict (id) do nothing;

insert into public.product_images (id, product_id, url, thumb_url, alt, width, height, position) values

('1d490c2a-0b6d-4e49-b031-0c7ccde8435b', '6b42fe0d-8481-49b2-9364-9ba3feedc580', '/demo/products/robe-priere-deux-pieces-lilas-1.svg', null, 'Robe de prière deux pièces lilas sur cintre (illustration de démonstration)', 800, 1000, 0),
('1c490a97-086d-4990-b331-1135cee844ee', '6b42fe0d-8481-49b2-9364-9ba3feedc580', '/demo/products/robe-priere-deux-pieces-lilas-2.svg', null, 'Robe de prière deux pièces « Lilas » — détail (illustration de démonstration)', 800, 1000, 1),
('1b490904-096d-4b23-b231-0fa2cfe84681', '6b42fe0d-8481-49b2-9364-9ba3feedc580', '/demo/products/robe-priere-deux-pieces-lilas-3.svg', null, 'Robe de prière deux pièces « Lilas » — autre vue (illustration de démonstration)', 800, 1000, 2),
('bc8921b1-d57b-429a-a2ac-81cf100dd768', '8e12d846-09e2-40d9-bcc3-9040b1e220ab', '/demo/products/robe-priere-enfant-petite-perle-1.svg', null, 'Robe de prière pour enfant rose pâle (illustration de démonstration)', 800, 1000, 0),
('b9891cf8-d47b-4107-a3ac-8362130ddc21', '8e12d846-09e2-40d9-bcc3-9040b1e220ab', '/demo/products/robe-priere-enfant-petite-perle-2.svg', null, 'Robe de prière enfant « Petite perle » — détail (illustration de démonstration)', 800, 1000, 1),
('ba891e8b-d37b-4f74-a4ac-84f5120dda8e', '8e12d846-09e2-40d9-bcc3-9040b1e220ab', '/demo/products/robe-priere-enfant-petite-perle-3.svg', null, 'Robe de prière enfant « Petite perle » — autre vue (illustration de démonstration)', 800, 1000, 2),
('fd71478e-320e-427b-8511-96185f8835bd', '4a015189-f810-49e0-aa8e-36a7e90e42b6', '/demo/products/abaya-priere-brodee-nour-1.svg', null, 'Abaya prune brodée sur cintre (illustration de démonstration)', 800, 1000, 0),
('fc7145fb-330e-440e-8811-9ad15c883104', '4a015189-f810-49e0-aa8e-36a7e90e42b6', '/demo/products/abaya-priere-brodee-nour-2.svg', null, 'Abaya de prière brodée « Nour » — détail (illustration de démonstration)', 800, 1000, 1),
('fb714468-340e-45a1-8711-993e5d883297', '4a015189-f810-49e0-aa8e-36a7e90e42b6', '/demo/products/abaya-priere-brodee-nour-3.svg', null, 'Abaya de prière brodée « Nour » — autre vue (illustration de démonstration)', 800, 1000, 2),
('34ca5daf-f9fa-414a-886d-f0618a942244', '7ed781e4-fec2-4425-9ec4-cb220861ff5b', '/demo/products/jilbab-capuche-une-piece-1.svg', null, 'Jilbab mauve à capuche sur cintre (illustration de démonstration)', 800, 1000, 0),
('35ca5f42-f8fa-4fb7-856d-eba88d9426fd', '7ed781e4-fec2-4425-9ec4-cb220861ff5b', '/demo/products/jilbab-capuche-une-piece-2.svg', null, 'Jilbab une pièce à capuche — détail (illustration de démonstration)', 800, 1000, 1),
('36ca60d5-f7fa-4e24-866d-ed3b8c94256a', '7ed781e4-fec2-4425-9ec4-cb220861ff5b', '/demo/products/jilbab-capuche-une-piece-3.svg', null, 'Jilbab une pièce à capuche — autre vue (illustration de démonstration)', 800, 1000, 2),
('1177e7c9-2385-4aa2-8e1a-b02fcce513d8', '60acd6e6-8383-4909-8cd3-822816d6c133', '/demo/products/robe-priere-zippee-serenite-1.svg', null, 'Robe de prière zippée violette pliée avec un chapelet (illustration de démonstration)', 800, 1000, 0),
('0e77e310-2285-490f-8f1a-b1c2cfe51891', '60acd6e6-8383-4909-8cd3-822816d6c133', '/demo/products/robe-priere-zippee-serenite-2.svg', null, 'Robe de prière zippée « Sérénité » — détail (illustration de démonstration)', 800, 1000, 1),
('0f77e4a3-2185-477c-901a-b355cee516fe', '60acd6e6-8383-4909-8cd3-822816d6c133', '/demo/products/robe-priere-zippee-serenite-3.svg', null, 'Robe de prière zippée « Sérénité » — autre vue (illustration de démonstration)', 800, 1000, 2),
('e06c586a-cab8-4759-b06b-fd5cfdae9ddb', 'cda5428d-3c8d-4852-9425-9f7be0a69fd8', '/demo/products/tapis-priere-velours-medine-1.svg', null, 'Tapis de prière en velours bordeaux à motif de mihrab (illustration de démonstration)', 800, 1000, 0),
('df6c56d7-c7b8-42a0-b36c-0215feae9f6e', 'cda5428d-3c8d-4852-9425-9f7be0a69fd8', '/demo/products/tapis-priere-velours-medine-2.svg', null, 'Tapis de prière velours « Médine » — détail (illustration de démonstration)', 800, 1000, 1),
('de6c5544-c8b8-4433-b26c-0082ffaea101', 'cda5428d-3c8d-4852-9425-9f7be0a69fd8', '/demo/products/tapis-priere-velours-medine-3.svg', null, 'Tapis de prière velours « Médine » — autre vue (illustration de démonstration)', 800, 1000, 2),
('3dad1c92-06ad-4029-81bf-27d0abc668d7', 'bb99a011-d762-4fbe-9fa3-febbaee80440', '/demo/products/tapis-priere-voyage-pliable-1.svg', null, 'Tapis de prière de voyage plié avec sa pochette et une boussole (illustration de démonstration)', 800, 1000, 0),
('3cad1aff-03ad-4b70-84bf-2c89acc66a6a', 'bb99a011-d762-4fbe-9fa3-febbaee80440', '/demo/products/tapis-priere-voyage-pliable-2.svg', null, 'Tapis de prière de voyage pliable — détail (illustration de démonstration)', 800, 1000, 1),
('3bad196c-04ad-4d03-83bf-2af6adc66bfd', 'bb99a011-d762-4fbe-9fa3-febbaee80440', '/demo/products/tapis-priere-voyage-pliable-3.svg', null, 'Tapis de prière de voyage pliable — autre vue (illustration de démonstration)', 800, 1000, 2),
('dfc9cf4d-9dbc-41c2-ad99-ed3f7a34f214', 'af4659d6-33eb-48b5-8069-95b4bf9ef27b', '/demo/products/tapis-priere-mousse-confort-1.svg', null, 'Tapis de prière matelassé gris violet (illustration de démonstration)', 800, 1000, 0),
('dcc9ca94-9cbc-402f-ae99-eed27d34f6cd', 'af4659d6-33eb-48b5-8069-95b4bf9ef27b', '/demo/products/tapis-priere-mousse-confort-2.svg', null, 'Tapis de prière mousse confort — détail (illustration de démonstration)', 800, 1000, 1),
('ddc9cc27-9bbc-4e9c-af99-f0657c34f53a', 'af4659d6-33eb-48b5-8069-95b4bf9ef27b', '/demo/products/tapis-priere-mousse-confort-3.svg', null, 'Tapis de prière mousse confort — autre vue (illustration de démonstration)', 800, 1000, 2),
('2becaae9-474e-42b6-b6cd-677311ff6660', '3319c6ba-1a7d-4321-b666-6d5833329697', '/demo/products/tapis-priere-enfant-1.svg', null, 'Petit tapis de prière rose pour enfant (illustration de démonstration)', 800, 1000, 0),
('28eca630-464e-4123-b7cd-690614ff6b19', '3319c6ba-1a7d-4321-b666-6d5833329697', '/demo/products/tapis-priere-enfant-2.svg', null, 'Tapis de prière enfant — détail (illustration de démonstration)', 800, 1000, 1),
('29eca7c3-454e-4f90-b8cd-6a9913ff6986', '3319c6ba-1a7d-4321-b666-6d5833329697', '/demo/products/tapis-priere-enfant-3.svg', null, 'Tapis de prière enfant — autre vue (illustration de démonstration)', 800, 1000, 2),
('fcac7c13-2726-411e-a848-a9cdf3f84c80', '35f50970-4f7c-44a1-85f3-154e5c753c27', '/demo/products/coffret-tapis-chapelet-1.svg', null, 'Coffret ouvert contenant un tapis de prière et un chapelet (illustration de démonstration)', 800, 1000, 0),
('fdac7da6-2626-4f8b-a548-a514f6f85139', '35f50970-4f7c-44a1-85f3-154e5c753c27', '/demo/products/coffret-tapis-chapelet-2.svg', null, 'Coffret tapis & chapelet — détail (illustration de démonstration)', 800, 1000, 1),
('feac7f39-2526-4df8-a648-a6a7f5f84fa6', '35f50970-4f7c-44a1-85f3-154e5c753c27', '/demo/products/coffret-tapis-chapelet-3.svg', null, 'Coffret tapis & chapelet — autre vue (illustration de démonstration)', 800, 1000, 2),
('0fa5e941-0079-44de-bf35-a1a722f5d8f4', '3f52718e-f735-4d15-ba5c-00e00f0a0daf', '/demo/products/eau-de-parfum-oud-royal-1.svg', null, 'Flacon carré de parfum ambré au bouchon sombre (illustration de démonstration)', 800, 1000, 0),
('0ca5e488-ff79-434b-8035-a33a25f5ddad', '3f52718e-f735-4d15-ba5c-00e00f0a0daf', '/demo/products/eau-de-parfum-oud-royal-2.svg', null, 'Eau de parfum « Oud Royal » — détail (illustration de démonstration)', 800, 1000, 1),
('0da5e61b-fe79-41b8-8135-a4cd24f5dc1a', '3f52718e-f735-4d15-ba5c-00e00f0a0daf', '/demo/products/eau-de-parfum-oud-royal-3.svg', null, 'Eau de parfum « Oud Royal » — autre vue (illustration de démonstration)', 800, 1000, 2),
('6e5f8e3c-e6a8-4cc7-8e92-eada396ae855', '2a37e6ff-e7af-4fa8-99d8-7d216883c412', '/demo/products/huile-parfumee-musc-blanc-1.svg', null, 'Petit flacon roll-on d’huile parfumée (illustration de démonstration)', 800, 1000, 0),
('715f92f5-e7a8-4e5a-8d92-e947366ae39c', '2a37e6ff-e7af-4fa8-99d8-7d216883c412', '/demo/products/huile-parfumee-musc-blanc-2.svg', null, 'Huile parfumée musc blanc — détail (illustration de démonstration)', 800, 1000, 1),
('705f9162-e8a8-4fed-8c92-e7b4376ae52f', '2a37e6ff-e7af-4fa8-99d8-7d216883c412', '/demo/products/huile-parfumee-musc-blanc-3.svg', null, 'Huile parfumée musc blanc — autre vue (illustration de démonstration)', 800, 1000, 2),
('1a20e1e3-5903-44c2-bd55-3b6d83d76e4c', 'ee361ef0-212b-465d-8414-1f0e564d172b', '/demo/products/coffret-trio-parfums-femme-1.svg', null, 'Coffret ouvert avec trois flacons de parfum (illustration de démonstration)', 800, 1000, 0),
('1b20e376-5803-432f-ba55-36b486d77305', 'ee361ef0-212b-465d-8414-1f0e564d172b', '/demo/products/coffret-trio-parfums-femme-2.svg', null, 'Coffret trio parfums femme — détail (illustration de démonstration)', 800, 1000, 1),
('1c20e509-5703-419c-bb55-384785d77172', 'ee361ef0-212b-465d-8414-1f0e564d172b', '/demo/products/coffret-trio-parfums-femme-3.svg', null, 'Coffret trio parfums femme — autre vue (illustration de démonstration)', 800, 1000, 2),
('8e789774-ca36-4211-ac17-4782805b7837', '23770357-90a2-4c3e-892c-7cc9ffcb2ca8', '/demo/products/brume-corporelle-fleur-oranger-1.svg', null, 'Flacon vaporisateur de brume corporelle avec une branche de fleur d’oranger (illustration de démonstration)', 800, 1000, 0),
('91789c2d-c736-4d58-ab17-45ef815b79ca', '23770357-90a2-4c3e-892c-7cc9ffcb2ca8', '/demo/products/brume-corporelle-fleur-oranger-2.svg', null, 'Brume corporelle « Fleur d’oranger » — détail (illustration de démonstration)', 800, 1000, 1),
('90789a9a-c836-4eeb-aa17-445c825b7b5d', '23770357-90a2-4c3e-892c-7cc9ffcb2ca8', '/demo/products/brume-corporelle-fleur-oranger-3.svg', null, 'Brume corporelle « Fleur d’oranger » — autre vue (illustration de démonstration)', 800, 1000, 2),
('9fc4b40a-aeff-4a6d-aa8c-a6505772f45b', '958b4751-5764-4ff2-a6d8-1563e42e4094', '/demo/products/thiouraye-nuit-de-dakar-1.svg', null, 'Encensoir en terre cuite avec fumée et sachet d’encens (illustration de démonstration)', 800, 1000, 0),
('9ec4b277-abff-45b4-ad8c-ab095872f5ee', '958b4751-5764-4ff2-a6d8-1563e42e4094', '/demo/products/thiouraye-nuit-de-dakar-2.svg', null, 'Thiouraye « Nuit de Dakar » — détail (illustration de démonstration)', 800, 1000, 1),
('9dc4b0e4-acff-4747-ac8c-a9765972f781', '958b4751-5764-4ff2-a6d8-1563e42e4094', '/demo/products/thiouraye-nuit-de-dakar-3.svg', null, 'Thiouraye « Nuit de Dakar » — autre vue (illustration de démonstration)', 800, 1000, 2),
('123dd3b3-4a88-4432-876f-ed950774fccc', 'e4de1008-eecd-455d-9231-5f2e6e8e1c3b', '/demo/products/jean-droit-femme-1.svg', null, 'Jean droit bleu plié (illustration de démonstration)', 800, 1000, 0),
('133dd546-4988-429f-846f-e8dc0a750185', 'e4de1008-eecd-455d-9231-5f2e6e8e1c3b', '/demo/products/jean-droit-femme-2.svg', null, 'Jean droit femme — détail (illustration de démonstration)', 800, 1000, 1),
('143dd6d9-4888-410c-856f-ea6f0974fff2', 'e4de1008-eecd-455d-9231-5f2e6e8e1c3b', '/demo/products/jean-droit-femme-3.svg', null, 'Jean droit femme — autre vue (illustration de démonstration)', 800, 1000, 2),
('2d41fa78-0261-4907-8a17-ab46606cbb75', '0ba0f38b-e3b8-4188-b8cb-84dd4ce3a192', '/demo/products/chemise-homme-coton-1.svg', null, 'Chemise homme rayée pliée (illustration de démonstration)', 800, 1000, 0),
('3041ff31-0361-4a9a-8917-a9b35d6cb6bc', '0ba0f38b-e3b8-4188-b8cb-84dd4ce3a192', '/demo/products/chemise-homme-coton-2.svg', null, 'Chemise homme en coton — détail (illustration de démonstration)', 800, 1000, 1),
('2f41fd9e-0461-4c2d-8817-a8205e6cb84f', '0ba0f38b-e3b8-4188-b8cb-84dd4ce3a192', '/demo/products/chemise-homme-coton-3.svg', null, 'Chemise homme en coton — autre vue (illustration de démonstration)', 800, 1000, 2),
('b40aeb7c-290d-4849-aba2-d8e688340b7b', 'c8e4636b-9411-4132-b802-5009281d88e8', '/demo/products/veste-jean-vintage-1.svg', null, 'Veste en jean sur cintre (illustration de démonstration)', 800, 1000, 0),
('b70af035-260d-4390-aaa2-d75389340d0e', 'c8e4636b-9411-4132-b802-5009281d88e8', '/demo/products/veste-jean-vintage-2.svg', null, 'Veste en jean vintage — détail (illustration de démonstration)', 800, 1000, 1),
('b60aeea2-270d-4523-a9a2-d5c08a340ea1', 'c8e4636b-9411-4132-b802-5009281d88e8', '/demo/products/veste-jean-vintage-3.svg', null, 'Veste en jean vintage — autre vue (illustration de démonstration)', 800, 1000, 2),
('81d263df-ed6c-4016-9d70-a4c16841f5f8', 'aa4b8184-3119-4cc9-8f0f-3a4ab7f2cbef', '/demo/products/robe-ete-fleurie-1.svg', null, 'Robe d’été ivoire à fleurs sur cintre (illustration de démonstration)', 800, 1000, 0),
('82d26572-ec6c-4e83-9a70-a0086b41fab1', 'aa4b8184-3119-4cc9-8f0f-3a4ab7f2cbef', '/demo/products/robe-ete-fleurie-2.svg', null, 'Robe d’été fleurie — détail (illustration de démonstration)', 800, 1000, 1),
('83d26705-eb6c-4cf0-9b70-a19b6a41f91e', 'aa4b8184-3119-4cc9-8f0f-3a4ab7f2cbef', '/demo/products/robe-ete-fleurie-3.svg', null, 'Robe d’été fleurie — autre vue (illustration de démonstration)', 800, 1000, 2),
('5f2e8fe8-d2d3-4501-8f54-b4669dc0106f', '8258ebab-33fc-4f66-8916-41c50072d3e0', '/demo/products/ensemble-wax-deux-pieces-1.svg', null, 'Ensemble wax deux pièces magenta et orange sur cintre (illustration de démonstration)', 800, 1000, 0),
('622e94a1-cfd3-4048-8e54-b2d39ec01202', '8258ebab-33fc-4f66-8916-41c50072d3e0', '/demo/products/ensemble-wax-deux-pieces-2.svg', null, 'Ensemble wax deux pièces — détail (illustration de démonstration)', 800, 1000, 1),
('612e930e-d0d3-41db-8d54-b1409fc01395', '8258ebab-33fc-4f66-8916-41c50072d3e0', '/demo/products/ensemble-wax-deux-pieces-3.svg', null, 'Ensemble wax deux pièces — autre vue (illustration de démonstration)', 800, 1000, 2),
('3428f55d-f58f-41d4-b25c-cb7390e9337a', 'd798aefa-ae2b-4c7f-b1b3-33bc7b65f1a1', '/demo/products/ensemble-lin-ete-1.svg', null, 'Ensemble en lin couleur sable plié (illustration de démonstration)', 800, 1000, 0),
('3128f0a4-f88f-468d-b35c-cd068fe931e7', 'd798aefa-ae2b-4c7f-b1b3-33bc7b65f1a1', '/demo/products/ensemble-lin-ete-2.svg', null, 'Ensemble lin été — détail (illustration de démonstration)', 800, 1000, 1),
('3228f237-f78f-44fa-b45c-ce998ee93054', 'd798aefa-ae2b-4c7f-b1b3-33bc7b65f1a1', '/demo/products/ensemble-lin-ete-3.svg', null, 'Ensemble lin été — autre vue (illustration de démonstration)', 800, 1000, 2),
('365c1ad3-0961-4650-ad68-ed25e87c0fea', '2c61b578-48af-4c4f-b665-5f06581cccad', '/demo/products/ensemble-tunique-pantalon-brode-1.svg', null, 'Tunique émeraude brodée et pantalon sur cintre (illustration de démonstration)', 800, 1000, 0),
('375c1c66-0c61-4b09-aa68-e86ce77c0e57', '2c61b578-48af-4c4f-b665-5f06581cccad', '/demo/products/ensemble-tunique-pantalon-brode-2.svg', null, 'Ensemble tunique & pantalon brodé — détail (illustration de démonstration)', 800, 1000, 1),
('385c1df9-0b61-4976-ab68-e9ffe67c0cc4', '2c61b578-48af-4c4f-b665-5f06581cccad', '/demo/products/ensemble-tunique-pantalon-brode-3.svg', null, 'Ensemble tunique & pantalon brodé — autre vue (illustration de démonstration)', 800, 1000, 2),
('b3e6bc8a-5634-4155-ab4e-05c091f17b9b', '6af68761-01d7-4892-957b-e71b383343f4', '/demo/products/ensemble-enfant-wax-1.svg', null, 'Ensemble enfant en wax rose et jaune posé à plat (illustration de démonstration)', 800, 1000, 0),
('b2e6baf7-5333-4c9c-ae4e-0a7992f17d2e', '6af68761-01d7-4892-957b-e71b383343f4', '/demo/products/ensemble-enfant-wax-2.svg', null, 'Ensemble enfant wax — détail (illustration de démonstration)', 800, 1000, 1),
('b1e6b964-5433-4e2f-ad4e-08e693f17ec1', '6af68761-01d7-4892-957b-e71b383343f4', '/demo/products/ensemble-enfant-wax-3.svg', null, 'Ensemble enfant wax — autre vue (illustration de démonstration)', 800, 1000, 2),
('c7456762-0a5e-4e13-857e-00f86845db19', '198da229-1220-4e2c-968c-244b75e761ce', '/demo/products/savon-noir-beldi-1.svg', null, 'Pot de savon noir et gant kessa (illustration de démonstration)', 800, 1000, 0),
('c64565cf-0b5e-4fa6-887e-05b16545d660', '198da229-1220-4e2c-968c-244b75e761ce', '/demo/products/savon-noir-beldi-2.svg', null, 'Savon noir beldi — détail (illustration de démonstration)', 800, 1000, 1),
('c545643c-0c5e-4139-877e-041e6645d7f3', '198da229-1220-4e2c-968c-244b75e761ce', '/demo/products/savon-noir-beldi-3.svg', null, 'Savon noir beldi — autre vue (illustration de démonstration)', 800, 1000, 2),
('de0bf8bc-0622-4c79-9ec8-1512dfefcfef', '25a877c7-24ae-4606-9645-e4a9b340ffd8', '/demo/products/huile-argan-cosmetique-1.svg', null, 'Flacon compte-gouttes d’huile d’argan et noix d’argan (illustration de démonstration)', 800, 1000, 0),
('e10bfd75-0322-47c0-9dc8-137fe0efd182', '25a877c7-24ae-4606-9645-e4a9b340ffd8', '/demo/products/huile-argan-cosmetique-2.svg', null, 'Huile d’argan cosmétique — détail (illustration de démonstration)', 800, 1000, 1),
('e00bfbe2-0422-4953-9cc8-11ece1efd315', '25a877c7-24ae-4606-9645-e4a9b340ffd8', '/demo/products/huile-argan-cosmetique-3.svg', null, 'Huile d’argan cosmétique — autre vue (illustration de démonstration)', 800, 1000, 2),
('b67baf9f-1eb6-41f2-b2fd-ae2517369380', '56463018-e1c8-4dc1-acc0-4eb279d00bc3', '/demo/products/caftan-brode-1.svg', null, 'Caftan violet brodé sur cintre (illustration de démonstration)', 800, 1000, 0),
('b77bb132-1db6-405f-affd-a96c1a369839', '56463018-e1c8-4dc1-acc0-4eb279d00bc3', '/demo/products/caftan-brode-2.svg', null, 'Caftan brodé — détail (illustration de démonstration)', 800, 1000, 1),
('b87bb2c5-1cb6-4ecc-b0fd-aaff193696a6', '56463018-e1c8-4dc1-acc0-4eb279d00bc3', '/demo/products/caftan-brode-3.svg', null, 'Caftan brodé — autre vue (illustration de démonstration)', 800, 1000, 2),
('ccd9f2b6-df94-48c9-a0ce-32388b47169b', '39fb6be9-319d-4952-8d1d-f1e7b0d80ed8', '/demo/products/ghassoul-argile-1.svg', null, 'Bol de ghassoul et cuillère en bois (illustration de démonstration)', 800, 1000, 0),
('cbd9f123-dc94-4410-a3ce-36f18c47182e', '39fb6be9-319d-4952-8d1d-f1e7b0d80ed8', '/demo/products/ghassoul-argile-2.svg', null, 'Ghassoul (argile du Maroc) — détail (illustration de démonstration)', 800, 1000, 1),
('cad9ef90-dd94-45a3-a2ce-355e8d4719c1', '39fb6be9-319d-4952-8d1d-f1e7b0d80ed8', '/demo/products/ghassoul-argile-3.svg', null, 'Ghassoul (argile du Maroc) — autre vue (illustration de démonstration)', 800, 1000, 2),
('e1d7e731-b5d2-46da-8e61-4edf006964c0', '93bdd4b6-11b7-45c1-ad09-fd38cecadcb3', '/demo/products/theiere-marocaine-1.svg', null, 'Théière marocaine argentée et deux verres à thé (illustration de démonstration)', 800, 1000, 0),
('ded7e278-b4d2-4547-8f61-507203696979', '93bdd4b6-11b7-45c1-ad09-fd38cecadcb3', '/demo/products/theiere-marocaine-2.svg', null, 'Théière marocaine & verres — détail (illustration de démonstration)', 800, 1000, 1),
('dfd7e40b-b3d2-43b4-9061-5205026967e6', '93bdd4b6-11b7-45c1-ad09-fd38cecadcb3', '/demo/products/theiere-marocaine-3.svg', null, 'Théière marocaine & verres — autre vue (illustration de démonstration)', 800, 1000, 2),
('ba089c82-0ebc-4b3d-bc30-fc4891bae433', '11315759-b54c-4bba-bdb0-10abd553b834', '/demo/products/mini-ventilateur-rechargeable-1.svg', null, 'Mini ventilateur portable blanc et lilas (illustration de démonstration)', 800, 1000, 0),
('b9089aef-0bbc-4684-bf31-010192bae5c6', '11315759-b54c-4bba-bdb0-10abd553b834', '/demo/products/mini-ventilateur-rechargeable-2.svg', null, 'Mini ventilateur rechargeable — détail (illustration de démonstration)', 800, 1000, 1),
('b808995c-0cbc-4817-be30-ff6e93bae759', '11315759-b54c-4bba-bdb0-10abd553b834', '/demo/products/mini-ventilateur-rechargeable-3.svg', null, 'Mini ventilateur rechargeable — autre vue (illustration de démonstration)', 800, 1000, 2),
('f19fdc52-f59a-4f9b-9117-2ae499c23145', 'b718d125-48fe-4218-bc36-e0ab9b47ac66', '/demo/products/organisateur-cosmetiques-rotatif-1.svg', null, 'Organisateur de maquillage rotatif transparent (illustration de démonstration)', 800, 1000, 0),
('f09fdabf-f69a-412e-9417-2f9d96c22c8c', 'b718d125-48fe-4218-bc36-e0ab9b47ac66', '/demo/products/organisateur-cosmetiques-rotatif-2.svg', null, 'Organisateur cosmétiques rotatif — détail (illustration de démonstration)', 800, 1000, 1),
('ef9fd92c-f79a-42c1-9317-2e0a97c22e1f', 'b718d125-48fe-4218-bc36-e0ab9b47ac66', '/demo/products/organisateur-cosmetiques-rotatif-3.svg', null, 'Organisateur cosmétiques rotatif — autre vue (illustration de démonstration)', 800, 1000, 2),
('fef106e8-5573-4489-9351-deea2870473b', '946561ef-0ecc-4292-8f5c-aaa503373b38', '/demo/products/sac-main-structure-1.svg', null, 'Sac à main structuré prune avec fermoir doré (illustration de démonstration)', 800, 1000, 0),
('01f10ba1-5273-4fd0-9251-dd57297048ce', '946561ef-0ecc-4292-8f5c-aaa503373b38', '/demo/products/sac-main-structure-2.svg', null, 'Sac à main structuré — détail (illustration de démonstration)', 800, 1000, 1),
('00f10a0e-5373-4163-9151-dbc42a704a61', '946561ef-0ecc-4292-8f5c-aaa503373b38', '/demo/products/sac-main-structure-3.svg', null, 'Sac à main structuré — autre vue (illustration de démonstration)', 800, 1000, 2),
('b7fb8aae-8698-439f-9124-3c543e5068a5', 'bdb82a95-f880-46b8-85d6-d4ef860ab062', '/demo/products/gourde-isotherme-1.svg', null, 'Gourde isotherme violette (illustration de démonstration)', 800, 1000, 0),
('b6fb891b-8798-4532-9424-410d3b5063ec', 'bdb82a95-f880-46b8-85d6-d4ef860ab062', '/demo/products/gourde-isotherme-2.svg', null, 'Gourde isotherme — détail (illustration de démonstration)', 800, 1000, 1),
('b5fb8788-8898-46c5-9324-3f7a3c50657f', 'bdb82a95-f880-46b8-85d6-d4ef860ab062', '/demo/products/gourde-isotherme-3.svg', null, 'Gourde isotherme — autre vue (illustration de démonstration)', 800, 1000, 2),
('f8bce00b-e564-4756-97bb-aa99902c502c', '0ca7f26c-1ce2-44dd-8199-c14e12ba0097', '/demo/products/lasalmah-coffret-signature-1.svg', null, 'Coffret cadeau violet fermé par un ruban (illustration de démonstration)', 800, 1000, 0),
('f9bce19e-e464-45c3-94bb-a5e0932c54e5', '0ca7f26c-1ce2-44dd-8199-c14e12ba0097', '/demo/products/lasalmah-coffret-signature-2.svg', null, 'Lasalmah — Coffret signature (exemple) — détail (illustration de démonstration)', 800, 1000, 1),
('fabce331-e364-4430-95bb-a773922c5352', '0ca7f26c-1ce2-44dd-8199-c14e12ba0097', '/demo/products/lasalmah-coffret-signature-3.svg', null, 'Lasalmah — Coffret signature (exemple) — autre vue (illustration de démonstration)', 800, 1000, 2),
('de318273-6169-4178-8919-109515347f2a', '80386f08-e3b7-4def-ac63-e056ca941665', '/demo/products/lasalmah-coffret-decouverte-1.svg', null, 'Petit coffret ouvert garni de papier de soie (illustration de démonstration)', 800, 1000, 0),
('df318406-6469-4631-8619-0bdc14347d97', '80386f08-e3b7-4def-ac63-e056ca941665', '/demo/products/lasalmah-coffret-decouverte-2.svg', null, 'Lasalmah — Coffret découverte (exemple) — détail (illustration de démonstration)', 800, 1000, 1),
('e0318599-6369-449e-8719-0d6f13347c04', '80386f08-e3b7-4def-ac63-e056ca941665', '/demo/products/lasalmah-coffret-decouverte-3.svg', null, 'Lasalmah — Coffret découverte (exemple) — autre vue (illustration de démonstration)', 800, 1000, 2)
on conflict (id) do nothing;

insert into public.collections (id, slug, name, description, image_url, is_featured, is_published, sort_order, is_demo) values

('340564fe-f9ea-4043-814c-4f704f8bdb15', 'essentiels-de-la-priere', 'Les essentiels de la prière', 'Robes, tapis et thiouraye : tout pour un coin prière apaisant.', '/demo/categories/tapis-de-priere.svg', true, true, 0, true),
('acea98c5-afe1-4d98-b1ca-7de7e61a91fa', 'idees-cadeaux', 'Idées cadeaux', 'Coffrets, parfums et douceurs du Maroc à offrir.', '/demo/categories/parfums.svg', true, true, 1, true),
('265405e2-a9d3-4343-b8d6-cbe865979e79', 'rituel-hammam', 'Rituel hammam', 'Savon noir, ghassoul et huile d’argan pour un moment de soin à la maison.', '/demo/categories/produits-du-maroc.svg', true, true, 2, true)
on conflict (id) do nothing;

insert into public.collection_products (collection_id, product_id, position) values

('340564fe-f9ea-4043-814c-4f704f8bdb15', '6b42fe0d-8481-49b2-9364-9ba3feedc580', 0),
('340564fe-f9ea-4043-814c-4f704f8bdb15', '7ed781e4-fec2-4425-9ec4-cb220861ff5b', 1),
('340564fe-f9ea-4043-814c-4f704f8bdb15', 'cda5428d-3c8d-4852-9425-9f7be0a69fd8', 2),
('340564fe-f9ea-4043-814c-4f704f8bdb15', 'af4659d6-33eb-48b5-8069-95b4bf9ef27b', 3),
('340564fe-f9ea-4043-814c-4f704f8bdb15', 'bb99a011-d762-4fbe-9fa3-febbaee80440', 4),
('340564fe-f9ea-4043-814c-4f704f8bdb15', '958b4751-5764-4ff2-a6d8-1563e42e4094', 5),
('acea98c5-afe1-4d98-b1ca-7de7e61a91fa', '35f50970-4f7c-44a1-85f3-154e5c753c27', 0),
('acea98c5-afe1-4d98-b1ca-7de7e61a91fa', 'ee361ef0-212b-465d-8414-1f0e564d172b', 1),
('acea98c5-afe1-4d98-b1ca-7de7e61a91fa', '3f52718e-f735-4d15-ba5c-00e00f0a0daf', 2),
('acea98c5-afe1-4d98-b1ca-7de7e61a91fa', '93bdd4b6-11b7-45c1-ad09-fd38cecadcb3', 3),
('acea98c5-afe1-4d98-b1ca-7de7e61a91fa', '0ca7f26c-1ce2-44dd-8199-c14e12ba0097', 4),
('acea98c5-afe1-4d98-b1ca-7de7e61a91fa', '946561ef-0ecc-4292-8f5c-aaa503373b38', 5),
('265405e2-a9d3-4343-b8d6-cbe865979e79', '198da229-1220-4e2c-968c-244b75e761ce', 0),
('265405e2-a9d3-4343-b8d6-cbe865979e79', '39fb6be9-319d-4952-8d1d-f1e7b0d80ed8', 1),
('265405e2-a9d3-4343-b8d6-cbe865979e79', '25a877c7-24ae-4606-9645-e4a9b340ffd8', 2),
('265405e2-a9d3-4343-b8d6-cbe865979e79', '23770357-90a2-4c3e-892c-7cc9ffcb2ca8', 3)
on conflict do nothing;

insert into public.pages (slug, title, body, is_published) values

('conditions-generales-de-vente', 'Conditions générales de vente', '> **Modèle à faire vérifier par un professionnel du droit avant la mise en ligne.** Ce texte est un modèle de départ : complétez les passages marqués « À COMPLÉTER » et vérifiez sa conformité avec la réglementation sénégalaise en vigueur.

# Conditions générales de vente

*Dernière mise à jour : [À COMPLÉTER : date de la dernière mise à jour]*

## 1. Objet et champ d''application

Les présentes conditions générales de vente (les « CGV ») régissent les ventes de produits conclues sur le site {{site_url}} (le « Site ») entre {{raison_sociale}}, exploitant la boutique {{nom_boutique}} (le « Vendeur »), et toute personne qui passe commande (le « Client »).

Les informations d''identification du Vendeur figurent dans les [mentions légales](/mentions-legales).

Toute commande implique l''acceptation des CGV en vigueur au moment de la commande. Le Vendeur peut les modifier à tout moment ; la version applicable est celle affichée sur le Site au jour de la commande.

Les ventes réalisées à distance sont notamment encadrées par la loi n° 2008-08 du 25 janvier 2008 sur les transactions électroniques et par la réglementation sénégalaise relative à la protection du consommateur.

## 2. Produits

Le Vendeur propose notamment : robes de prière, tapis de prière, parfums, vêtements de seconde main (friperie), tenues pour femmes (« Ensembles chez Cathy »), produits du Maroc, produits importés et produits de la gamme « Lasalmah ».

Chaque produit est présenté avec une description, un prix et, si possible, des photos. Les photos sont aussi fidèles que possible mais de légères différences (couleur, rendu des matières) peuvent exister selon l''écran utilisé.

Les produits sont proposés dans la limite des stocks disponibles. Si un produit devient indisponible après la commande, le Vendeur en informe le Client et lui propose un autre produit, un report ou le remboursement des sommes déjà versées.

### Articles de friperie (seconde main)

Les articles de friperie sont des **articles d''occasion**. Leur état (traces d''usure, défauts éventuels, taille) est décrit sur chaque fiche produit. Le Client achète l''article dans l''état décrit. Les conditions particulières de retour de ces articles sont précisées dans la page [Retours et remboursements](/retours-et-remboursements).

## 3. Prix

Les prix sont indiqués en francs CFA (FCFA / XOF), [À COMPLÉTER : préciser « toutes taxes comprises » ou le régime de TVA applicable au Vendeur].

Les frais de livraison ne sont pas inclus dans le prix des produits. Ils dépendent de la zone de livraison choisie, sont indiqués sur la page [Livraison](/livraison) et affichés avant la validation de la commande.

Le prix applicable est celui affiché au moment de la validation de la commande. En cas d''erreur manifeste de prix (par exemple une erreur de saisie évidente), le Vendeur peut annuler la commande après en avoir informé le Client, qui sera remboursé des sommes éventuellement versées.

## 4. Commande

### 4.1 Passation de la commande

Le Client peut commander sans créer de compte. Il indique :

- son nom ;
- son numéro de téléphone ;
- son adresse e-mail (facultative) ;
- sa zone de livraison et son adresse ;
- son mode de paiement.

Avant de valider, le Client peut vérifier le récapitulatif de sa commande (produits, quantités, prix, frais de livraison, total) et corriger d''éventuelles erreurs.

### 4.2 Référence et confirmation

À la validation, une **référence de commande** est affichée au Client. Il est conseillé de la conserver : elle sera demandée pour tout échange concernant la commande.

La commande n''est définitivement acceptée qu''après confirmation par le Vendeur (par téléphone, WhatsApp, SMS ou e-mail). Le Vendeur peut refuser ou annuler une commande pour un motif légitime (produit indisponible, adresse non desservie, informations incomplètes, impossibilité de joindre le Client, litige antérieur, etc.).

### 4.3 Échanges par WhatsApp

Le Client peut contacter le Vendeur par WhatsApp au {{whatsapp}} pour poser des questions ou discuter de sa commande. **L''ouverture d''une conversation WhatsApp ou l''envoi d''un message ne vaut pas confirmation de commande** : seule la confirmation expresse du Vendeur engage celui-ci.

## 5. Paiement

Les moyens de paiement acceptés sont :

- **Wave** ;
- **Orange Money** ;
- **paiement à la livraison** (en espèces), lorsque cette option est proposée pour la zone choisie.

Les paiements par Wave et Orange Money sont **vérifiés et confirmés manuellement** par le Vendeur ; ils ne sont pas validés automatiquement par le Site. **Le paiement n''est considéré comme reçu qu''une fois confirmé par le Vendeur.** Le Client doit indiquer sa référence de commande lors du paiement, ou la communiquer au Vendeur, afin de faciliter le rapprochement.

[À COMPLÉTER : délai dans lequel le paiement doit être effectué avant annulation de la commande, ex. 24 heures]

[À COMPLÉTER : préciser si un acompte est exigé pour certaines commandes ou certaines zones]

Le Vendeur ne collecte ni ne conserve les codes ou identifiants de paiement du Client. Ne communiquez jamais votre code secret Wave ou Orange Money.

## 6. Livraison

Les modalités de livraison (zones, frais, délais indicatifs, remise du colis) sont décrites sur la page [Livraison](/livraison), qui fait partie intégrante des présentes CGV.

## 7. Retours, échanges et remboursements

Les conditions de retour, d''échange et de remboursement sont décrites sur la page [Retours et remboursements](/retours-et-remboursements), qui fait partie intégrante des présentes CGV.

## 8. Garanties

Le Vendeur s''engage à livrer des produits conformes à leur description. Le Client bénéficie des garanties prévues par la réglementation applicable, notamment en cas de défaut de conformité ou de vice caché.

[À COMPLÉTER : préciser toute garantie commerciale éventuelle offerte par la boutique, ou indiquer qu''aucune garantie commerciale n''est proposée en plus des garanties légales]

Pour les articles de friperie, les défauts décrits sur la fiche produit ne constituent pas un défaut de conformité.

## 9. Responsabilité

Le Vendeur n''est pas responsable de l''inexécution de ses obligations lorsqu''elle est due au fait du Client (adresse erronée, absence lors de la livraison, etc.), au fait d''un tiers ou à un cas de force majeure.

Les parfums, huiles et cosmétiques doivent être utilisés conformément à leur notice. Il est recommandé de faire un test sur une petite zone de peau avant la première utilisation.

## 10. Données personnelles

Les données collectées lors de la commande sont traitées conformément à notre [politique de confidentialité](/confidentialite).

## 11. Service client et réclamations

Pour toute question ou réclamation :

- téléphone : {{telephone}} ;
- WhatsApp : {{whatsapp}} ;
- e-mail : {{email}} ;
- formulaire : [page Contact](/contact).

Merci d''indiquer votre référence de commande. [À COMPLÉTER : délai de réponse indicatif aux réclamations, ex. 48 heures ouvrables]

## 12. Droit applicable et litiges

Les présentes CGV sont soumises au droit sénégalais.

En cas de litige, le Client est invité à contacter d''abord le service client afin de rechercher une solution amiable. À défaut d''accord, le litige sera porté devant les juridictions compétentes [À COMPLÉTER : préciser la juridiction compétente, ex. tribunaux de Dakar, sous réserve des règles protectrices du consommateur]. Le Client peut également s''adresser aux associations de consommateurs ou aux services administratifs compétents en matière de protection du consommateur.
', true),
('confidentialite', 'Politique de confidentialité', '> **Modèle à faire vérifier par un professionnel du droit avant la mise en ligne.** Ce texte est un modèle de départ : complétez les passages marqués « À COMPLÉTER » et vérifiez sa conformité avec la réglementation sénégalaise en vigueur.

# Politique de confidentialité

*Dernière mise à jour : [À COMPLÉTER : date de la dernière mise à jour]*

{{nom_boutique}} accorde une grande importance à la protection de vos données personnelles. Cette politique explique quelles données nous collectons, pourquoi, combien de temps nous les conservons et quels sont vos droits.

Elle s''applique au site {{site_url}} et s''inscrit dans le cadre de la loi n° 2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel.

## 1. Responsable du traitement

Le responsable du traitement est {{raison_sociale}} ({{forme_juridique}}), {{adresse}}.

Contact pour toute question relative à vos données : {{email}} — téléphone {{telephone}}.

## 2. Données collectées

Nous collectons uniquement les données nécessaires :

- **Commande** : nom, numéro de téléphone, adresse e-mail (facultative), zone et adresse de livraison, produits commandés, montants, mode de paiement choisi, référence de commande, statut de la commande et du paiement.
- **Paiement** : les informations permettant de rapprocher un paiement Wave ou Orange Money de votre commande (ex. numéro ayant payé, montant, référence de transaction). Nous ne collectons jamais vos codes secrets.
- **Messages de contact** : nom, coordonnées et contenu du message envoyé via le formulaire de contact.
- **Newsletter** : adresse e-mail, uniquement si vous avez coché la case de consentement, ainsi que la date de ce consentement.
- **Échanges WhatsApp** : si vous choisissez de nous contacter par WhatsApp, les messages et informations que vous y partagez.
- **Données techniques** : données de connexion nécessaires au fonctionnement et à la sécurité du site, traitées par nos hébergeurs (ex. adresse IP dans les journaux techniques).

## 3. Finalités et bases légales

- **Traiter et livrer vos commandes**, vérifier les paiements, assurer le service après-vente : exécution du contrat conclu avec vous.
- **Répondre à vos messages** : votre demande et notre intérêt légitime à vous répondre.
- **Vous envoyer la newsletter** : votre consentement, que vous pouvez retirer à tout moment.
- **Respecter nos obligations légales**, notamment comptables et fiscales : obligation légale.
- **Assurer la sécurité du site** et prévenir la fraude : intérêt légitime.

Nous ne vendons pas vos données et ne les utilisons pas à des fins de publicité ciblée.

## 4. Durées de conservation

- Données de commande : [À COMPLÉTER : durée, ex. durée nécessaire à la gestion de la commande et du service après-vente, puis archivage pendant la durée légale de conservation des pièces comptables, à vérifier]
- Messages de contact : [À COMPLÉTER : durée, ex. 1 an après le dernier échange]
- Adresse e-mail newsletter : jusqu''à votre désinscription, puis [À COMPLÉTER : durée de conservation de la preuve du consentement, ex. 3 ans]
- Journaux techniques : selon la politique de nos hébergeurs [À COMPLÉTER : vérifier les durées appliquées]

## 5. Destinataires et sous-traitants

Vos données sont accessibles uniquement aux personnes de la boutique qui en ont besoin, et aux prestataires suivants, dans la limite de leur mission :

- **Netlify** (hébergement du site, États-Unis) [À COMPLÉTER : à vérifier — conditions contractuelles et localisation des données] ;
- **Supabase** (base de données, authentification de l''administration et stockage de fichiers) — région d''hébergement : [À COMPLÉTER : région choisie, à vérifier] ;
- **livreurs** ou sociétés de livraison : nom, téléphone et adresse, uniquement pour la livraison [À COMPLÉTER : nom du prestataire de livraison le cas échéant] ;
- **Wave** et **Orange Money** : lorsque vous payez par ces services, vos données sont traitées par ces opérateurs selon leurs propres politiques de confidentialité ;
- **WhatsApp (Meta)** : uniquement si vous choisissez de nous contacter par WhatsApp ; vos échanges sont alors soumis aux conditions et à la politique de confidentialité de WhatsApp ;
- [À COMPLÉTER : service d''envoi d''e-mails ou de newsletter utilisé, le cas échéant] ;
- les autorités, lorsque la loi l''exige.

## 6. Transferts hors du Sénégal

Certains prestataires (notamment Netlify, Supabase selon la région choisie, et Meta pour WhatsApp) peuvent traiter des données en dehors du Sénégal. La loi sénégalaise encadre ces transferts, qui peuvent nécessiter un niveau de protection suffisant ou une autorisation de la CDP. [À COMPLÉTER : à vérifier avec un professionnel — garanties mises en place et formalités éventuelles auprès de la CDP pour ces transferts]

## 7. Stockage dans votre navigateur (localStorage)

Le site enregistre votre **panier** et vos **favoris** dans le stockage local de votre navigateur (localStorage). Ces informations restent sur votre appareil, ne nous sont pas transmises tant que vous ne passez pas commande et servent uniquement au fonctionnement du site. Vous pouvez les supprimer en vidant les données de navigation de votre navigateur.

Par défaut, **le site n''utilise aucun cookie publicitaire ni outil de suivi publicitaire**. [À COMPLÉTER : si un outil de mesure d''audience ou autre service tiers est ajouté, le mentionner ici et recueillir le consentement si nécessaire]

## 8. Newsletter

L''inscription à la newsletter est facultative et nécessite votre consentement explicite. Vous pouvez vous désinscrire à tout moment [À COMPLÉTER : moyen de désinscription, ex. lien présent dans chaque e-mail] ou en nous écrivant à {{email}}.

## 9. Sécurité

Nous prenons des mesures raisonnables pour protéger vos données : connexion chiffrée (HTTPS), accès à l''administration réservé aux personnes autorisées et protégé par authentification, règles d''accès à la base de données, choix de prestataires reconnus. Aucun système n''étant infaillible, nous vous informerons, lorsque la loi l''exige, de toute violation de données susceptible de vous concerner.

## 10. Vos droits

Conformément à la loi n° 2008-12, vous disposez notamment des droits suivants :

- **droit d''accès** à vos données ;
- **droit de rectification** des données inexactes ou incomplètes ;
- **droit d''opposition**, pour des motifs légitimes, et à tout moment pour la prospection (newsletter) ;
- **droit de suppression** des données qui ne sont plus nécessaires ou dont le traitement n''est pas justifié.

Pour exercer vos droits, écrivez à {{email}} ou contactez-nous via la [page Contact](/contact), en précisant votre demande et, si possible, votre référence de commande. Nous pourrons vous demander de justifier votre identité. Nous répondons dans les meilleurs délais [À COMPLÉTER : délai de réponse, à vérifier au regard de la loi].

Certaines données doivent être conservées pour respecter une obligation légale (par exemple comptable) et ne peuvent pas être supprimées immédiatement.

## 11. Réclamation auprès de la CDP

Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la **Commission de Protection des Données Personnelles (CDP)** du Sénégal. [À COMPLÉTER : coordonnées à jour de la CDP, à vérifier sur son site officiel]

## 12. Formalités auprès de la CDP

Les traitements de données personnelles peuvent devoir faire l''objet d''une déclaration ou d''une demande d''autorisation préalable auprès de la CDP.

Statut : [À COMPLÉTER : déclaration effectuée (numéro et date) ou en cours, à vérifier avec la CDP]

## 13. Modifications

Nous pouvons modifier cette politique. La date de mise à jour figure en haut de la page. En cas de changement important, nous vous en informerons par un moyen approprié.

Voir aussi : [mentions légales](/mentions-legales) et [conditions générales de vente](/conditions-generales-de-vente).
', true),
('livraison', 'Politique de livraison', '> **Modèle à faire vérifier par un professionnel du droit avant la mise en ligne.** Ce texte est un modèle de départ : complétez les passages marqués « À COMPLÉTER » et vérifiez sa conformité avec la réglementation sénégalaise en vigueur.

# Politique de livraison

*Dernière mise à jour : [À COMPLÉTER : date de la dernière mise à jour]*

Cette page explique comment {{nom_boutique}} livre vos commandes. Elle complète les [conditions générales de vente](/conditions-generales-de-vente).

## 1. Zones desservies

Nous livrons dans les zones proposées lors de la commande. La liste des zones et les frais correspondants sont affichés **sur cette page et au moment de la commande**, avant sa validation.

[À COMPLÉTER : préciser les zones couvertes, ex. Dakar et banlieue, autres régions du Sénégal, et indiquer si des livraisons hors du Sénégal sont possibles]

Si votre adresse n''est pas couverte, contactez-nous avant de commander via la [page Contact](/contact) ou par WhatsApp au {{whatsapp}}.

## 2. Frais de livraison

Les frais de livraison dépendent de la zone choisie. Ils sont indiqués en francs CFA (FCFA) et ajoutés au total de la commande avant validation. Le montant affiché lors de la commande est celui qui s''applique.

[À COMPLÉTER : conditions éventuelles de livraison gratuite, ex. à partir d''un certain montant d''achat]

[À COMPLÉTER : préciser qui paie les frais en cas de seconde présentation ou de changement d''adresse demandé par le client]

## 3. Délais de livraison

Les délais sont **indicatifs** et courent à partir de la confirmation de la commande par la boutique et, pour les paiements Wave ou Orange Money, de la confirmation de la réception du paiement.

[À COMPLÉTER : délais de livraison par zone, ex. Dakar en 24 heures, régions en 48 à 72 heures]

[À COMPLÉTER : préciser les jours et horaires de livraison, ex. du lundi au samedi, hors jours fériés]

Des retards peuvent survenir pendant les périodes de forte demande (fêtes religieuses, Tabaski, Korité, Ramadan, fin d''année), en cas d''intempéries, de difficultés de circulation ou de tout événement indépendant de notre volonté. Nous vous prévenons dès que possible en cas de retard.

[À COMPLÉTER : préciser ce que le client peut faire en cas de retard important, ex. annulation et remboursement au-delà d''un certain délai]

Les produits importés ou provenant du Maroc peuvent nécessiter un délai supplémentaire lorsqu''ils ne sont pas en stock. Ce délai est indiqué sur la fiche produit ou communiqué avant la confirmation de la commande. [À COMPLÉTER : délai indicatif pour les produits sur commande]

## 4. Préparation et suivi de la commande

Après la validation de votre commande, une **référence de commande** vous est communiquée. Conservez-la : elle vous sera demandée pour tout suivi.

Nous vous contactons par téléphone ou WhatsApp pour confirmer la commande et organiser la livraison. Une conversation WhatsApp ne vaut pas, à elle seule, confirmation de commande.

## 5. Remise du colis

Le livreur vous contacte au numéro indiqué lors de la commande. Merci de veiller à ce que ce numéro soit joignable et que l''adresse soit précise (quartier, repères utiles).

Si vous avez choisi le **paiement à la livraison**, prévoyez le montant exact en espèces lorsque c''est possible. [À COMPLÉTER : préciser si le paiement à la livraison peut aussi se faire par Wave ou Orange Money au moment de la remise]

[À COMPLÉTER : préciser si une autre personne peut réceptionner le colis à la place du client]

En cas d''absence ou si vous êtes injoignable, nous tenterons de reprogrammer la livraison. [À COMPLÉTER : nombre de tentatives et conséquences après échec, ex. annulation de la commande]

**Retrait** : [À COMPLÉTER : indiquer si le retrait est possible, où et à quelles conditions, ou supprimer ce paragraphe].

## 6. Vérification à la réception

Nous vous recommandons de vérifier votre colis en présence du livreur : nombre d''articles, état de l''emballage, conformité des produits.

En cas de colis endommagé, d''article manquant ou de produit non conforme, signalez-le immédiatement au livreur et contactez-nous [À COMPLÉTER : délai pour signaler un problème, ex. dans les 24 heures suivant la réception], avec votre référence de commande et, si possible, des photos.

## 7. Transfert des risques

[À COMPLÉTER : préciser le moment du transfert des risques, généralement la remise effective du colis au client ou à la personne désignée par lui]

## 8. Contact

Pour toute question sur une livraison :

- téléphone : {{telephone}} ;
- WhatsApp : {{whatsapp}} ;
- e-mail : {{email}} ;
- formulaire : [page Contact](/contact).

Voir aussi notre politique de [retours et remboursements](/retours-et-remboursements).
', true),
('mentions-legales', 'Mentions légales', '> **Modèle à faire vérifier par un professionnel du droit avant la mise en ligne.** Ce texte est un modèle de départ : complétez les passages marqués « À COMPLÉTER » et vérifiez sa conformité avec la réglementation sénégalaise en vigueur.

# Mentions légales

*Dernière mise à jour : [À COMPLÉTER : date de la dernière mise à jour]*

Conformément à la loi n° 2008-08 du 25 janvier 2008 sur les transactions électroniques, les informations suivantes sont portées à la connaissance des utilisateurs du site {{site_url}}.

## 1. Éditeur du site

- **Nom commercial** : {{nom_boutique}}
- **Raison sociale / nom de l''exploitant** : {{raison_sociale}}
- **Forme juridique** : {{forme_juridique}}
- **NINEA** : {{ninea}}
- **RCCM** : {{rccm}}
- **Adresse** : {{adresse}}
- **Téléphone** : {{telephone}}
- **WhatsApp** : {{whatsapp}}
- **E-mail** : {{email}}
- [À COMPLÉTER : capital social, si la forme juridique en comporte un]
- [À COMPLÉTER : régime fiscal ou numéro d''identification fiscale complémentaire, le cas échéant]

Le numéro RCCM correspond à l''immatriculation au Registre du Commerce et du Crédit Mobilier prévue par l''Acte uniforme OHADA relatif au droit commercial général. Le NINEA est le numéro d''identification national des entreprises et associations.

## 2. Directeur de la publication

{{responsable_publication}}

## 3. Hébergement

Le site est hébergé par :

- **Netlify, Inc.** — hébergement du site — États-Unis. [À COMPLÉTER : adresse postale et coordonnées de l''hébergeur, à vérifier sur le site de Netlify]
- **Supabase, Inc.** — base de données, authentification et stockage de fichiers — région d''hébergement : [À COMPLÉTER : région choisie]. [À COMPLÉTER : adresse postale et coordonnées, à vérifier sur le site de Supabase]

## 4. Activité

{{nom_boutique}} est une boutique en ligne basée à Dakar (Sénégal) proposant notamment des robes de prière, tapis de prière, parfums, vêtements de seconde main (friperie), tenues pour femmes (« Ensembles chez Cathy »), produits du Maroc, produits importés et produits de la gamme « Lasalmah ».

Les conditions de vente sont détaillées dans les [conditions générales de vente](/conditions-generales-de-vente).

## 5. Propriété intellectuelle

Les contenus du site (textes, photos, logos, visuels, mise en page) sont la propriété de {{raison_sociale}} ou de leurs auteurs respectifs et sont protégés par la législation applicable en matière de propriété intellectuelle. Toute reproduction ou réutilisation sans autorisation écrite préalable est interdite.

Les marques et noms de produits de tiers cités sur le site appartiennent à leurs titulaires respectifs. [À COMPLÉTER : préciser, si besoin, le statut des noms « Lasalmah » et « Ensembles chez Cathy » (marque déposée, partenariat, etc.)]

## 6. Données personnelles

Le traitement de vos données personnelles est décrit dans notre [politique de confidentialité](/confidentialite).

## 7. Responsabilité

Nous faisons notre possible pour que les informations présentes sur le site soient exactes et à jour. Des erreurs ou omissions peuvent toutefois survenir ; n''hésitez pas à nous les signaler.

Le site peut contenir des liens vers des sites tiers (par exemple WhatsApp, Wave ou Orange Money). Nous ne sommes pas responsables du contenu ni des pratiques de ces sites.

## 8. Contact

Pour toute question : {{email}} — {{telephone}} — [page Contact](/contact).

## 9. Droit applicable

Les présentes mentions légales sont soumises au droit sénégalais.
', true),
('retours-et-remboursements', 'Retours et remboursements', '> **Modèle à faire vérifier par un professionnel du droit avant la mise en ligne.** Ce texte est un modèle de départ : complétez les passages marqués « À COMPLÉTER » et vérifiez sa conformité avec la réglementation sénégalaise en vigueur.

# Retours et remboursements

*Dernière mise à jour : [À COMPLÉTER : date de la dernière mise à jour]*

Cette page décrit les conditions dans lesquelles vous pouvez retourner ou échanger un produit acheté chez {{nom_boutique}}. Elle complète les [conditions générales de vente](/conditions-generales-de-vente).

## 1. Produit défectueux, endommagé ou non conforme

Si vous recevez un produit endommagé, défectueux, différent de celui commandé ou ne correspondant pas à sa description, contactez-nous [À COMPLÉTER : délai pour signaler le problème, ex. dans les 24 ou 48 heures suivant la réception] en indiquant votre référence de commande et en joignant, si possible, des photos.

Après vérification, nous vous proposons, selon le cas et la disponibilité :

- le remplacement du produit ;
- l''échange contre un autre produit ;
- le remboursement du produit concerné.

Dans ce cas, [À COMPLÉTER : préciser qui prend en charge les frais de retour, normalement la boutique en cas de produit défectueux ou non conforme].

Ces dispositions s''appliquent sans préjudice des garanties légales dont vous bénéficiez en tant que consommateur.

## 2. Retour ou échange pour convenance personnelle

Si le produit ne vous convient pas (taille, couleur, goût), un retour ou un échange peut être possible aux conditions suivantes.

### 2.1 Délai

[À COMPLÉTER : délai de retour ou d''échange, ex. 48 heures ou 7 jours à compter de la réception — le site d''origine indiquait « Échange possible sous 48h »]

[À COMPLÉTER : préciser s''il s''agit uniquement d''un échange, d''un avoir, ou aussi d''un remboursement]

### 2.2 État du produit

Le produit doit être retourné :

- non porté, non lavé et non utilisé ;
- dans son état d''origine, avec ses étiquettes et son emballage lorsqu''il en a un ;
- accompagné de la référence de commande.

Nous nous réservons le droit de refuser un retour qui ne respecte pas ces conditions.

### 2.3 Frais de retour

[À COMPLÉTER : préciser qui paie les frais de retour pour un retour de convenance, et si les frais de livraison initiaux sont remboursés]

## 3. Produits exclus ou soumis à conditions particulières

### 3.1 Produits d''hygiène et cosmétiques

*Clause proposée, [À COMPLÉTER : confirmer ou modifier].* Pour des raisons d''hygiène et de sécurité, **ne peuvent être ni repris ni échangés** une fois ouverts ou descellés : les parfums, cosmétiques, savons, huiles et produits de soin, sauf s''ils sont défectueux ou non conformes à la livraison.

### 3.2 Articles de friperie (seconde main)

Les articles de friperie sont des articles d''occasion dont l''état est décrit sur chaque fiche produit. Les défauts ou traces d''usure mentionnés dans la description ne peuvent pas justifier un retour.

[À COMPLÉTER : conditions de retour spécifiques à la friperie, ex. échange uniquement, retour non accepté pour convenance personnelle, ou mêmes conditions que les articles neufs]

### 3.3 Autres exclusions

[À COMPLÉTER : autres produits exclus, ex. articles soldés, produits commandés spécialement ou personnalisés, tenues ajustées sur mesure]

## 4. Comment faire une demande

1. Contactez-nous par WhatsApp au {{whatsapp}}, par téléphone au {{telephone}}, par e-mail à {{email}} ou via la [page Contact](/contact).
2. Indiquez votre référence de commande, le produit concerné et le motif de la demande (avec photos si le produit est abîmé ou non conforme).
3. Attendez notre accord et nos instructions avant de renvoyer ou de déposer le produit.
4. Retournez le produit selon les modalités convenues : [À COMPLÉTER : modalités de retour, ex. dépôt à l''adresse de la boutique, récupération par un livreur].

Tout produit renvoyé sans accord préalable pourra être refusé.

## 5. Remboursement

Après réception et vérification du produit retourné, nous vous confirmons l''acceptation ou le refus du retour.

En cas d''acceptation :

- **mode de remboursement** : [À COMPLÉTER : ex. par Wave ou Orange Money au numéro utilisé pour le paiement, en espèces, ou sous forme d''avoir] ;
- **délai de remboursement** : [À COMPLÉTER : délai de remboursement après acceptation du retour, ex. 7 jours] ;
- **montant remboursé** : [À COMPLÉTER : préciser si les frais de livraison sont inclus selon le motif du retour].

Pour une commande payée à la livraison, le remboursement se fait [À COMPLÉTER : mode de remboursement pour les commandes payées en espèces].

## 6. Annulation d''une commande

Vous pouvez demander l''annulation d''une commande tant qu''elle n''a pas été expédiée, en nous contactant avec votre référence de commande. Si vous avez déjà payé et que l''annulation est acceptée, le remboursement est effectué selon les modalités de la section 5.

[À COMPLÉTER : conditions d''annulation une fois la commande expédiée ou pour les produits commandés spécialement]

## 7. Contact

Pour toute question : {{telephone}} — WhatsApp {{whatsapp}} — {{email}} — [page Contact](/contact).

Voir aussi notre [politique de livraison](/livraison).
', true)
on conflict (slug) do nothing;

commit;
