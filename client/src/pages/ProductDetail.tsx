import { ArrowLeft, ArrowUpRight, Check, FileText, MessageCircle, ShieldCheck } from "lucide-react";
import { Link, useParams } from "wouter";
import { useMemo } from "react";
import { getProduct, products } from "@/lib/catalogue";
import { PageFrame, PageIntro, SectionHeading } from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const productInput = useMemo(() => ({ slug: slug || "" }), [slug]);
  const productQuery = trpc.content.product.useQuery(productInput, { enabled: Boolean(slug) });
  const productsQuery = trpc.content.products.useQuery();
  const product = productQuery.data || getProduct(slug || "");
  if (!product) return <PageFrame><PageIntro eyebrow="Catalogue" title="Produit introuvable" text="Cette référence n’est pas disponible dans le catalogue actuel." /><div className="container not-found-actions"><Link href="/products" className="button button-primary"><ArrowLeft size={17} /> Retour au catalogue</Link></div></PageFrame>;
  const activeProducts = productsQuery.data ?? products;
  const similar = activeProducts.filter((item) => item.category === product.category && item.slug !== product.slug).slice(0, 3);
  return <PageFrame>
    <div className="container breadcrumb"><Link href="/products"><ArrowLeft size={16} /> Catalogue</Link><span>/</span><span>{product.name}</span></div>
    <section className="product-detail container"><div className="product-detail-image"><img src={product.image} alt={product.name} /><span className="product-detail-stamp">Réf. {product.reference}</span></div><div className="product-detail-copy"><span className="product-category">{product.category}</span><h1>{product.name}</h1><p className="product-detail-lead">{product.description}</p><div className="detail-note"><ShieldCheck size={18} /><span>Produit professionnel à sélectionner selon votre protocole et votre environnement.</span></div><div className="detail-actions"><Link href={`/devis?product=${product.slug}`} className="button button-primary">Demander un devis <ArrowUpRight size={17} /></Link><Link href="/contact" className="button button-outline"><MessageCircle size={17} /> Nous contacter</Link></div><div className="detail-meta"><div><span>Référence</span><strong>{product.reference}</strong></div><div><span>Disponibilité</span><strong>Sur demande</strong></div><div><span>Fiche source</span><a href={product.sourceUrl} target="_blank" rel="noreferrer"><FileText size={15} /> Quimxel</a></div></div></div></section>
    <section className="detail-benefits"><div className="container"><div className="benefits-grid"><div><span className="benefit-icon"><Check size={17} /></span><strong>Une sélection métier</strong><p>Une référence intégrée à un catalogue pensé pour les professionnels.</p></div><div><span className="benefit-icon"><Check size={17} /></span><strong>Un accompagnement clair</strong><p>Notre équipe vous aide à confirmer l’usage, le format et le protocole adapté.</p></div><div><span className="benefit-icon"><Check size={17} /></span><strong>Une demande simple</strong><p>Décrivez votre besoin et recevez une réponse structurée.</p></div></div></div></section>
    {similar.length > 0 && <section className="section related-section container"><SectionHeading eyebrow="À découvrir également" title={<>Des références de la même<br /><span>famille d’usage.</span></>} /><div className="related-grid">{similar.map((item) => <Link href={`/products/${item.slug}`} className="related-card" key={item.slug}><img src={item.image} alt={item.name} /><div><span>{item.category}</span><strong>{item.name}</strong></div><ArrowUpRight size={18} /></Link>)}</div></section>}
  </PageFrame>;
}
