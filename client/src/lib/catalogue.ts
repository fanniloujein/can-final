export type Product = {
  name: string;
  slug: string;
  reference: string;
  category: string;
  description: string;
  image: string;
  sourceUrl: string;
  note?: string;
};

export const products: Product[] = [
  { name: "SILK", slug: "silk", reference: "2771", category: "Nettoyants sols et surfaces", description: "Effectively cleans all types of washable surfaces, leaving a pleasant floral scent. Formulated with bio-alcohols for a quick cleaning and fast-drying.", image: "/manus-storage/silk-2771_941d3567.png", sourceUrl: "https://www.quimxel.es/en/producto/silk-2771/" },
  { name: "BRIXOL T107", slug: "brixol-t107", reference: "2578", category: "Nettoyants sols et surfaces", description: "Product recommended for cleaning floors of any material, such as marble, terrazzo, stoneware, wood, etc. Provides a pleasant perfume to the environment.", image: "/manus-storage/brixol-t107-2578_e3ee70b7.png", sourceUrl: "https://www.quimxel.es/en/producto/brixol-t107-2578/" },
  { name: "ED 30", slug: "ed-30", reference: "2679", category: "Nettoyants sols et surfaces", description: "Highly concentrated neutral cleaner with Bio-alcohol, indicated to clean hard floors (marble, terrazzo, granite, etc.), synthetic soils (PVC, linoleum).", image: "/manus-storage/ed-30-2679_7966753f.png", sourceUrl: "https://www.quimxel.es/en/producto/ed-30-2679/" },
  { name: "JABA", slug: "jaba", reference: "2715", category: "Entretien du bois", description: "Ideal product for cleaning all types of wood and parquet surfaces. It contains diverse soaps and nourishing agents for the wood, managing to clean and protect it.", image: "/manus-storage/jaba-2715_0a12190c.png", sourceUrl: "https://www.quimxel.es/en/producto/jaba-2715/" },
  { name: "DENGRAS", slug: "dengras", reference: "2623", category: "Dégraissants professionnels", description: "Degreaser and emulsifier for a wide variety of greases, oils and soils. Wetting agents facilitate penetration and attack on dirt.", image: "/manus-storage/dengras-2623_431b320b.png", sourceUrl: "https://www.quimxel.es/en/producto/dengras-2623/" },
  { name: "DENGRAS C", slug: "dengras-c", reference: "2627", category: "Dégraissants professionnels", description: "High performance degreaser for cleaning grease and very encrusted dirt. Can be used under cold or hot temperatures as it is a non-flammable product.", image: "/manus-storage/dengras-c-2627_89613489.png", sourceUrl: "https://www.quimxel.es/en/producto/dengras-c-2627/" },
  { name: "DENGRAS CL", slug: "dengras-cl", reference: "2629", category: "Dégraissants professionnels", description: "Degreaser for heavy-duty cleaning of machinery, heavily soiled surfaces, heavy vehicles, kitchens, utensils, filters, grills and slaughterhouses.", image: "/manus-storage/dengras-cl-2629_75cbbde9.png", sourceUrl: "https://www.quimxel.es/en/producto/dengras-cl-2629/" },
  { name: "DENGRAS FOOD", slug: "dengras-food", reference: "3202", category: "Dégraissants professionnels", description: "Multi-purpose disinfectant degreaser with a quaternary ammonium formula. Suitable for surfaces in kitchens and food industries.", image: "/manus-storage/dengras-food-3202_2d70e918.png", sourceUrl: "https://www.quimxel.es/en/producto/dengras-food-3202/" },
  { name: "DENGRAS 57", slug: "dengras-57", reference: "2626", category: "Dégraissants professionnels", description: "Degreaser for heavy-duty cleaning of machinery, heavily soiled surfaces, heavy vehicles, kitchens, utensils, filters, grills and industrial environments.", image: "/manus-storage/dengras-57-2626_3e1186d7.png", sourceUrl: "https://www.quimxel.es/en/producto/dengras-57-2626/" },
  { name: "DENGRAS F", slug: "dengras-f", reference: "2630", category: "Dégraissants professionnels", description: "High-performance degreaser suitable for cleaning griddles and ovens, also recommended for fryers when diluted. Ideal for greasy residues.", image: "/manus-storage/dengras-f-2630_86c9f5c6.png", sourceUrl: "https://www.quimxel.es/en/producto/dengras-f-2630/" },
  { name: "DESCRUST MNF", slug: "descrust-mnf", reference: "2646", category: "Détartrants et désincrustants", description: "Product with high acidity level, indicated for eliminating residues and calcareous incrustations, plaster, cement or other mineral residues.", image: "/manus-storage/descrust-mnf-2646_927959a2.png", sourceUrl: "https://www.quimxel.es/en/producto/descrust-mnf-2646/" },
  { name: "BASIC", slug: "basic", reference: "2552", category: "Traitement des sols", description: "Product for the preparation of floors to be crystallized. Quick application. Cleans thoroughly and covers all pores before vitrification.", image: "/manus-storage/basic-2552_08cc27f5.png", sourceUrl: "https://www.quimxel.es/en/producto/basic-2552/" },
  { name: "MOQUET S", slug: "moquet-s", reference: "2738", category: "Entretien des textiles", description: "Effective dry-foam type degreaser cleaner. Applicable to fabrics, upholstery, carpets and rugs without altering their appearance.", image: "/manus-storage/moquet-s-2738_52769ff3.png", sourceUrl: "https://www.quimxel.es/en/producto/moquet-s-2738/" },
  { name: "DS INOX", slug: "ds-inox", reference: "2657", category: "Entretien de l’inox", description: "Product designed for cleaning and removing rust stains on stainless steel. Its use helps to regenerate treated surfaces.", image: "/manus-storage/ds-inox-2657_eb5e975e.png", sourceUrl: "https://www.quimxel.es/en/producto/ds-inox-2657/" },
  { name: "DUST WC", slug: "dust-wc", reference: "2660", category: "Détartrants et désincrustants", description: "Powerful cleaner with descaling and deodorizing power for toilets and urinals. Removes limescale, minerals, salt residues and rust.", image: "/manus-storage/dust-wc-2660_73425163.png", sourceUrl: "https://www.quimxel.es/en/producto/dust-wc-2660/" },
];

export const categories = ["Toutes les catégories", ...Array.from(new Set(products.map((product) => product.category)))];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export const sectors = [
  { title: "Hôtels & hospitality", detail: "Des protocoles propres, efficaces et adaptés aux chambres, espaces communs et back-office." },
  { title: "Restaurants & métiers de bouche", detail: "Des solutions dégraissantes et d’hygiène pensées pour les cuisines professionnelles." },
  { title: "Bureaux & entreprises", detail: "Une qualité de propreté constante pour les espaces de travail et les visiteurs." },
  { title: "Institutions & commerces", detail: "Un accompagnement fiable pour les sites à fort passage et les environnements exigeants." },
];

export const services = [
  { number: "01", title: "Produits professionnels", text: "Un catalogue sélectionné pour le nettoyage, l’hygiène et la maintenance des environnements professionnels." },
  { number: "02", title: "Conseil d’usage", text: "Une approche orientée résultat pour choisir les références, protocoles et formats adaptés." },
  { number: "03", title: "Solutions sur mesure", text: "Des réponses structurées pour les hôtels, restaurants, bureaux, commerces et institutions." },
  { number: "04", title: "Suivi commercial", text: "Une relation de proximité et des demandes de devis traitées avec clarté et réactivité." },
];

export const navItems = [
  { label: "Accueil", href: "/" },
  { label: "Catalogue", href: "/catalogue" },
  { label: "Produits", href: "/products" },
  { label: "Services", href: "/services" },
  { label: "À propos", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const whatsappUrl = "https://wa.me/21600000000?text=Bonjour%20CAN%20LIGNE%20BLEU%2C%20je%20souhaite%20obtenir%20des%20informations%20sur%20vos%20solutions.";
