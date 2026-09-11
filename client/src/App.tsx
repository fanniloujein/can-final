import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import About from "./pages/About";
import Admin from "./pages/Admin";
import Catalogue from "./pages/Catalogue";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";
import Quote from "./pages/Quote";
import Services from "./pages/Services";
import { trpc } from "./lib/trpc";

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/catalogue" component={Catalogue} /><Route path="/products" component={Products} /><Route path="/products/:slug" component={ProductDetail} /><Route path="/services" component={Services} /><Route path="/about" component={About} /><Route path="/contact" component={Contact} /><Route path="/devis" component={Quote} /><Route path="/admin" component={Admin} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}
function RuntimeTheme() { const settingsQuery = trpc.content.settings.useQuery(); useEffect(() => { const root = document.documentElement; const primary = settingsQuery.data?.brand_primary; const accent = settingsQuery.data?.brand_accent; if (primary && /^#[0-9a-f]{6}$/i.test(primary)) { root.style.setProperty("--navy", primary); root.style.setProperty("--navy-2", primary); root.style.setProperty("--ink", primary); } if (accent && /^#[0-9a-f]{6}$/i.test(accent)) { root.style.setProperty("--lagoon", accent); root.style.setProperty("--lagoon-dark", accent); } }, [settingsQuery.data]); return null; }
function OpeningIntro() { const [visible, setVisible] = useState(() => !sessionStorage.getItem("can-opening-seen")); useEffect(() => { if (!visible) return; const timer = window.setTimeout(() => { sessionStorage.setItem("can-opening-seen", "1"); setVisible(false); }, 1700); return () => window.clearTimeout(timer); }, [visible]); if (!visible) return null; return <div className="opening-intro" role="status" aria-label="CAN LIGNE BLEUE"><div className="opening-intro-inner"><img src="/manus-storage/logofinal-removebg-preview_63c556eb.png" alt="CAN LIGNE BLEUE" /><p>Solutions professionnelles d’hygiène, de nettoyage et de maintenance</p></div></div>; }
export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><RuntimeTheme /><OpeningIntro /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
