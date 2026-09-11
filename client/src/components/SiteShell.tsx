import { Link, useLocation } from "wouter";
import { ArrowUpRight, Menu, Search, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import { navItems, whatsappUrl } from "@/lib/catalogue";
import { trpc } from "@/lib/trpc";

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  const settingsQuery = trpc.content.settings.useQuery();
  const settings = settingsQuery.data ?? {};
  const siteName = settings.site_name || "CAN LIGNE BLEUE";
  return (
    <Link href="/" className="brand-mark" aria-label="CAN LIGNE BLEUE, accueil">
      {inverse ? <><img className="official-logo-icon" src={settings.logo_icon_url || "/manus-storage/can-ligne-bleu-icon_2ba82fd4.png"} alt="" /><span className="text-white">{siteName}</span></> : <img className="official-logo-horizontal" src={settings.logo_horizontal_url || "/manus-storage/logofinal-removebg-preview_63c556eb.png"} alt="CAN LIGNE BLEU" />}
    </Link>
  );
}

export function SiteHeader() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const settingsQuery = trpc.content.settings.useQuery();
  const visibleNav = useMemo(() => configuredNav(settingsQuery.data), [settingsQuery.data]);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <BrandMark />
        <nav className="desktop-nav" aria-label="Navigation principale">
          {visibleNav.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-link ${location === item.href ? "nav-link-active" : ""}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link href="/products" className="icon-button" aria-label="Rechercher un produit"><Search size={18} /></Link>
          <Link href="/devis" className="button button-primary header-cta">Demander un devis <ArrowUpRight size={16} /></Link>
          <button className="mobile-menu-button" onClick={() => setOpen(!open)} aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="mobile-nav container">
          {visibleNav.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="mobile-nav-link">{item.label}</Link>)}
          <Link href="/devis" onClick={() => setOpen(false)} className="button button-primary">Demander un devis <ArrowUpRight size={16} /></Link>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const settingsQuery = trpc.content.settings.useQuery();
  const siteSettings = settingsQuery.data ?? {};
  const visibleNav = useMemo(() => configuredNav(settingsQuery.data), [settingsQuery.data]);
  const contactWhatsapp = siteSettings.whatsapp_url || whatsappUrl;
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <BrandMark inverse />
          <p>Solutions professionnelles d’hygiène, de nettoyage et de maintenance pour les environnements exigeants.</p>
          <div className="footer-status"><span className="status-dot" /> Une équipe à votre écoute</div>
        </div>
        <div><p className="footer-label">Navigation</p>{visibleNav.map((item) => <Link key={item.href} href={item.href} className="footer-link">{item.label}</Link>)}</div>
        <div><p className="footer-label">Expertise</p><Link href="/products" className="footer-link">Catalogue produits</Link><Link href="/services" className="footer-link">Solutions professionnelles</Link><Link href="/devis" className="footer-link">Demande de devis</Link><a href={contactWhatsapp} target="_blank" rel="noreferrer" className="footer-link">WhatsApp</a></div>
        <div><p className="footer-label">Contact</p><p className="footer-contact">Tunisie<br />{siteSettings.contact_phone || "+216 · Coordonnées à compléter"}<br />{siteSettings.contact_email || "contact@canlignebleu.tn"}</p><Link href="/contact" className="footer-link footer-link-accent">Parlons de votre besoin <ArrowUpRight size={14} /></Link></div>
      </div>
      <div className="container footer-bottom"><span>© 2026 {siteSettings.site_name || "CAN LIGNE BLEUE"}. Tous droits réservés.</span><span>Politique de confidentialité · Mentions légales</span></div>
    </footer>
  );
}

export function WhatsAppFloat() {
  const settingsQuery = trpc.content.settings.useQuery();
  const contactWhatsapp = settingsQuery.data?.whatsapp_url || whatsappUrl;
  return <a className="whatsapp-float" href={contactWhatsapp} target="_blank" rel="noreferrer" aria-label="Contacter CAN LIGNE BLEUE via WhatsApp"><span>WA</span></a>;
}

export function PageFrame({ children }: { children: React.ReactNode }) {
  return <div className="site-frame"><SiteHeader /><main>{children}</main><SiteFooter /><WhatsAppFloat /></div>;
}

export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <div className={`eyebrow ${light ? "eyebrow-light" : ""}`}><span className="eyebrow-line" />{children}</div>;
}

export function SectionHeading({ eyebrow, title, text, light = false }: { eyebrow?: string; title: React.ReactNode; text?: string; light?: boolean }) {
  return <div className={`section-heading ${light ? "section-heading-light" : ""}`}>{eyebrow && <Eyebrow light={light}>{eyebrow}</Eyebrow>}<h2>{title}</h2>{text && <p>{text}</p>}</div>;
}

export function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <section className="page-intro"><div className="container page-intro-inner"><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1><p>{text}</p></div></section>;
}

export function AdminBadge() {
  return <Link href="/admin" className="admin-badge"><ShieldCheck size={15} /> Espace admin</Link>;
}

function configuredNav(settings?: Record<string, string>) {
  try {
    const stored = settings?.admin_pages ? JSON.parse(settings.admin_pages) : null;
    if (!Array.isArray(stored)) return navItems;
    const byId = new Map(stored.filter((item) => item && typeof item.id === "string").map((item) => [item.id, item]));
    const ids: Record<string, string> = { "/": "home", "/catalogue": "catalogue", "/products": "products", "/services": "services", "/about": "about", "/contact": "contact" };
    return navItems.filter((item) => byId.get(ids[item.href])?.enabled !== false).map((item) => ({ ...item, label: byId.get(ids[item.href])?.title || item.label }));
  } catch {
    return navItems;
  }
}
