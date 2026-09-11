import { Play, Sparkles } from "lucide-react";

type VideoShowcaseProps = {
  eyebrow?: string;
  title: React.ReactNode;
  text: string;
  poster: string;
  label?: string;
  videoSrc?: string;
  compact?: boolean;
};

export function VideoShowcase({ eyebrow = "Notre univers", title, text, poster, label = "Vidéo de présentation", videoSrc, compact = false }: VideoShowcaseProps) {
  return <section className={`video-showcase ${compact ? "video-showcase-compact" : ""}`}><div className="container video-showcase-inner"><div className="video-showcase-copy"><div className="eyebrow"><span className="eyebrow-line" />{eyebrow}</div><h2>{title}</h2><p>{text}</p><div className="video-status"><span className="video-status-dot" /> Clip vidéo IA prêt à intégrer après activation</div></div><div className="video-frame">{videoSrc ? <video autoPlay muted loop playsInline poster={poster} controls><source src={videoSrc} type="video/mp4" /></video> : <><img src={poster} alt="Aperçu de l’univers professionnel CAN LIGNE BLEUE" /><div className="video-overlay" /><div className="video-coming"><span className="play-circle"><Play size={19} fill="currentColor" /></span><div><strong>{label}</strong><small>Vidéo disponible après activation de la génération IA</small></div></div><div className="video-spark"><Sparkles size={17} /></div></>}</div></div></section>;
}
