import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, ChevronDown, Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { categories, products } from "@/lib/catalogue";
import { PageFrame, PageIntro } from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";

export default function Products() {
  const productsQuery = trpc.content.products.useQuery();
  const activeProducts = productsQuery.data ?? products;
  const activeCategories = useMemo(() => ["Toutes les catégories", ...Array.from(new Set(activeProducts.map((product) => product.category)))], [activeProducts]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [sort, setSort] = useState("pertinence");
  const [filterOpen, setFilterOpen] = useState(false);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = activeProducts.filter((product) => {
      const matchQuery = !q || `${product.name} ${product.reference} ${product.category} ${product.description}`.toLowerCase().includes(q);
      const matchCategory = category === activeCategories[0] || product.category === category;
      return matchQuery && matchCategory;
    });
    return [...list].sort((a, b) => sort === "az" ? a.name.localeCompare(b.name) : sort === "za" ? b.name.localeCompare(a.name) : 0);
  }, [activeCategories, activeProducts, query, category, sort]);
  return <PageFrame>
    <PageIntro eyebrow="Catalogue professionnel" title="Des produits qui travaillent aussi dur que vos équipes." text="Explorez une sélection de solutions Quimxel pour l’hygiène, le nettoyage et l’entretien des environnements professionnels." />
    <section className="products-section container">
      <div className="catalog-toolbar">
        <div className="search-field"><Search size={19} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher par nom, référence ou usage…" aria-label="Rechercher un produit" />{query && <button onClick={() => setQuery("")} aria-label="Effacer la recherche"><X size={16} /></button>}</div>
        <button className="filter-toggle" onClick={() => setFilterOpen(!filterOpen)}><SlidersHorizontal size={17} /> Filtres</button>
        <div className="sort-select"><span>Trier :</span><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="pertinence">Pertinence</option><option value="az">Nom A–Z</option><option value="za">Nom Z–A</option></select><ChevronDown size={15} /></div>
      </div>
      <div className={`catalog-layout ${filterOpen ? "filters-visible" : ""}`}>
        <aside className="catalog-filters"><div className="filter-heading"><strong>Affiner la recherche</strong><button onClick={() => setFilterOpen(false)}><X size={17} /></button></div><p className="filter-caption">Catégories</p>{activeCategories.map((item) => <button key={item} className={`filter-option ${category === item ? "filter-option-active" : ""}`} onClick={() => setCategory(item)}><span>{item}</span><span>{item === activeCategories[0] ? activeProducts.length : activeProducts.filter((p) => p.category === item).length}</span></button>)}<div className="filter-note"><Filter size={18} /><p>Les informations techniques et conditionnements sont à confirmer avec notre équipe.</p></div></aside>
        <div className="catalog-results"><div className="results-meta"><span><strong>{filtered.length}</strong> produit{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}</span>{category !== activeCategories[0] && <button className="active-filter" onClick={() => setCategory(activeCategories[0])}>{category} <X size={14} /></button>}</div>{filtered.length ? <div className="product-grid">{filtered.map((product) => <article className="product-card" key={product.slug}><Link href={`/products/${product.slug}`} className="product-image-wrap"><img src={product.image} alt={product.name} loading="lazy" /><span className="product-arrow"><ArrowUpRight size={17} /></span></Link><div className="product-card-body"><div className="product-card-top"><span className="product-category">{product.category}</span><span className="product-ref">Réf. {product.reference}</span></div><h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3><p>{product.description}</p><Link href={`/products/${product.slug}`} className="text-link">Voir le produit <ArrowUpRight size={15} /></Link></div></article>)}</div> : <div className="empty-state"><Search size={30} /><h3>Aucun produit trouvé</h3><p>Essayez un autre terme ou réinitialisez les filtres.</p><button className="button button-secondary" onClick={() => { setQuery(""); setCategory(activeCategories[0]); }}>Réinitialiser</button></div>}</div>
      </div>
    </section>
  </PageFrame>;
}
