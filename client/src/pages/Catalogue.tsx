import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Search, Sparkles, X } from "lucide-react";
import { Link } from "wouter";
import { PageFrame } from "@/components/SiteShell";
import { products as fallbackProducts } from "@/lib/catalogue";
import { trpc } from "@/lib/trpc";

const officialLogo = "/manus-storage/logofinal-removebg-preview_63c556eb.png";

function InfiniteProductCarousel({ products }: { products: typeof fallbackProducts }) {
  const loopProducts = [...products, ...products];
  return <section className="infinite-carousel" aria-label="Sélection de produits professionnels">
    <div className="infinite-carousel-heading"><span><Sparkles size={14} /> Sélection CAN LIGNE BLEUE</span><small>Défilement continu · Survolez pour mettre en pause</small></div>
    <div className="carousel-viewport">
      <div className="carousel-track">
        {loopProducts.map((product, index) => <Link className="carousel-product" href={`/products/${product.slug}`} key={`${product.slug}-${index}`} aria-label={`Voir ${product.name}`}><span className="carousel-image"><img src={product.image} loading="lazy" alt={product.name} /></span><span className="carousel-product-info"><strong>{product.name}</strong><small>Réf. {product.reference}</small></span></Link>)}
      </div>
    </div>
  </section>;
}

export default function Catalogue() {
  const query = trpc.content.products.useQuery();
  const settingsQuery = trpc.content.settings.useQuery();
  const products = query.data ?? fallbackProducts;
  const settings = settingsQuery.data ?? {};
  const [page, setPage] = useState(0);
  const [turnDirection, setTurnDirection] = useState<"next" | "previous">("next");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Toutes les catégories");
  const startX = useRef<number | null>(null);
  const categories = useMemo(() => ["Toutes les catégories", ...Array.from(new Set(products.map(item => item.category)))], [products]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(item => (!q || `${item.name} ${item.reference} ${item.category} ${item.description}`.toLowerCase().includes(q)) && (filter === categories[0] || item.category === filter));
  }, [categories, filter, products, search]);
  const totalPages = Math.max(1, 1 + Math.ceil(filtered.length / 4));
  const safePage = Math.min(page, totalPages - 1);
  const go = (next: number) => {
    const bounded = Math.max(0, Math.min(totalPages - 1, next));
    if (bounded === page) return;
    setTurnDirection(bounded > page ? "next" : "previous");
    setPage(bounded);
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "ArrowRight") go(safePage + 1); if (event.key === "ArrowLeft") go(safePage - 1); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [safePage, totalPages]);
  const coverLogo = settings.logo_horizontal_url || officialLogo;
  return <PageFrame>
    <main className="catalogue-book" onTouchStart={event => { startX.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={event => { if (startX.current === null) return; const delta = event.changedTouches[0].clientX - startX.current; if (Math.abs(delta) > 45) go(safePage + (delta < 0 ? 1 : -1)); startX.current = null; }}>
      <div className="catalogue-topbar container"><div><span className="eyebrow"><span className="eyebrow-line" />Catalogue digital</span><h1>Catalogue professionnel</h1></div><div className="catalogue-progress"><span>{String(safePage + 1).padStart(2, "0")}</span><i><b style={{ width: `${((safePage + 1) / totalPages) * 100}%` }} /></i><span>{String(totalPages).padStart(2, "0")}</span></div></div>
      <section key={`cover-${safePage}`} className={`catalogue-page catalogue-cover ${safePage === 0 ? `is-current page-turn-${turnDirection}` : "is-hidden"}`} aria-hidden={safePage !== 0}>
        <div className="catalogue-cover-inner"><img src={coverLogo} alt="CAN LIGNE BLEUE" className="catalogue-cover-logo catalogue-cover-logo-original" /><span className="catalogue-kicker">ÉDITION PROFESSIONNELLE · 2026</span><h2>Produits <em>•</em> Équipements <em>•</em><br />Solutions d’hygiène</h2><p>Une sélection pensée pour les environnements qui exigent efficacité, précision et constance.</p><div className="catalogue-cover-strip">{products.slice(0, 3).map(product => <img key={product.slug} src={product.image} alt={product.name} />)}</div><div className="catalogue-cover-footer"><span><Sparkles size={15} /> CAN LIGNE BLEUE</span><span>Tunisie · Solutions B2B</span></div></div>
      </section>
      <InfiniteProductCarousel products={products} />
      <section key={`products-${safePage}`} className={`catalogue-page catalogue-products ${safePage > 0 ? `is-current page-turn-${turnDirection}` : "is-hidden"}`} aria-hidden={safePage === 0}>
        <div className="catalogue-tools"><div className="catalogue-search"><Search size={17} /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Rechercher un produit, une référence…" aria-label="Rechercher dans le catalogue" />{search && <button onClick={() => setSearch("")} aria-label="Effacer"><X size={15} /></button>}</div><select value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }} aria-label="Filtrer par catégorie">{categories.map(category => <option key={category}>{category}</option>)}</select></div>
        {safePage === 1 && <div className="catalogue-category-row"><div><span className="catalogue-kicker">01 · Familles disponibles</span><h2>Nos solutions par catégorie</h2><p>Parcourez les références réellement disponibles dans notre catalogue professionnel.</p></div><BookOpen size={42} /></div>}
        {safePage > 1 && <div className="catalogue-category-row catalogue-category-compact"><div><span className="catalogue-kicker">{String(safePage - 1).padStart(2, "0")} · Sélection produits</span><h2>{filter === categories[0] ? "Références professionnelles" : filter}</h2><p>{filtered.length} produit{filtered.length > 1 ? "s" : ""} dans cette sélection.</p></div><Link href="/devis" className="button button-primary">Demander un devis <ArrowRight size={16} /></Link></div>}
        {safePage === 1 ? <div className="catalogue-categories">{categories.slice(1).map((category, index) => { const count = products.filter(product => product.category === category).length; return <button key={category} onClick={() => { setFilter(category); setPage(2); }}><span>{String(index + 1).padStart(2, "0")}</span><strong>{category}</strong><small>{count} référence{count > 1 ? "s" : ""}</small><ArrowRight size={17} /></button>; })}</div> : <div className="catalogue-product-grid">{filtered.slice((safePage - 2) * 4, (safePage - 1) * 4).map(product => <article className="catalogue-product" key={product.slug}><Link href={`/products/${product.slug}`}><img src={product.image} loading="lazy" alt={product.name} /><span className="catalogue-product-number">{product.reference}</span></Link><div><span>{product.category}</span><h3>{product.name}</h3><p>{product.description}</p><Link href={`/products/${product.slug}`} className="text-link">Voir la fiche <ArrowRight size={14} /></Link></div></article>)}</div>}
        {safePage > 1 && filtered.length === 0 && <div className="catalogue-empty"><Check size={28} /><h3>Aucun produit trouvé</h3><p>Modifiez votre recherche ou choisissez une autre catégorie.</p></div>}
      </section>
      <div className="catalogue-controls container"><button onClick={() => go(safePage - 1)} disabled={safePage === 0} aria-label="Page précédente"><ArrowLeft size={18} /> Précédent</button><span>Faites défiler, utilisez les flèches ou glissez sur mobile</span><button onClick={() => go(safePage + 1)} disabled={safePage === totalPages - 1} aria-label="Page suivante">Suivant <ArrowRight size={18} /></button></div>
    </main>
  </PageFrame>;
}
