import { ArrowUpRight, Check, Layers3, Route, Sparkles, Wrench } from "lucide-react";
import { Link } from "wouter";
import { useMemo } from "react";
import { services } from "@/lib/catalogue";
import { PageFrame, PageIntro, SectionHeading } from "@/components/SiteShell";
import { VideoShowcase } from "@/components/VideoShowcase";
import { trpc } from "@/lib/trpc";

const icons = [Sparkles, Layers3, Route, Wrench];
export default function Services() {
  const settingsQuery = trpc.content.settings.useQuery();
  const siteSettings = settingsQuery.data ?? {};
  const managedServices = useMemo(() => {
    try {
      const value = siteSettings.admin_services ? JSON.parse(siteSettings.admin_services) : null;
      return Array.isArray(value) ? value.filter(item => item && item.enabled !== false && typeof item.title === "string") : services;
    } catch {
      return services;
    }
  }, [siteSettings.admin_services]);
  return <PageFrame><PageIntro eyebrow="Notre expertise" title="Des solutions propres, claires et adaptées à votre terrain." text={siteSettings.services_intro || "CAN LIGNE BLEUE vous aide à structurer vos achats et vos protocoles d’hygiène avec une approche professionnelle, de la sélection à la mise en œuvre."} /><VideoShowcase compact eyebrow="Le geste professionnel" title={<>Une méthode claire.<br /><span>Un résultat constant.</span></>} text="Le futur clip Services illustrera nos gestes, nos protocoles et la qualité attendue dans les espaces professionnels." poster={siteSettings.video_services_poster_url || "/manus-storage/moquet-s-2738_52769ff3.png"} label="Protocoles professionnels" videoSrc={siteSettings.video_services_url || undefined} /><section className="section service-list-section container"><div className="service-list">{managedServices.map((service, index) => { const Icon = icons[index % icons.length]; return <article className={`service-row ${index === 0 ? "service-row-dark" : ""}`} key={service.id || service.number || service.title}><span className="service-number">{String(index + 1).padStart(2, "0")}</span><Icon size={30} /><div><h2>{service.title}</h2><p>{service.text}</p><ul><li><Check size={15} /> Réponse adaptée à votre activité</li><li><Check size={15} /> Références professionnelles</li></ul></div><Link href="/contact" className="round-arrow"><ArrowUpRight size={19} /></Link></article>; })}</div></section><section className="section service-sectors"><div className="container service-sectors-grid"><div><SectionHeading eyebrow="Votre environnement" title={<>La bonne méthode,<br /><span>au bon endroit.</span></>} text="Hôtels, restaurants, bureaux, commerces ou institutions : nous partons de vos contraintes réelles pour construire une réponse utile." /><Link href="/devis" className="button button-primary">Parler de votre besoin <ArrowUpRight size={17} /></Link></div><div className="sector-quote"><p>“</p><blockquote>La performance d’une solution d’hygiène se mesure à sa capacité à simplifier le quotidien des équipes.</blockquote><span>— CAN LIGNE BLEUE</span></div></div></section><section className="dark-cta"><div className="container dark-cta-inner"><div><div className="eyebrow eyebrow-light"><span className="eyebrow-line" />Une question sur nos services ?</div><h2>Parlons de votre<br /><em>prochain besoin.</em></h2></div><Link href="/contact" className="button button-light">Nous contacter <ArrowUpRight size={17} /></Link></div></section></PageFrame>;
}
