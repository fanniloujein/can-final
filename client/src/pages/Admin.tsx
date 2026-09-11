import {
  BarChart3,
  Bell,
  Boxes,
  ChevronRight,
  FileText,
  GalleryHorizontal,
  Image,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  MessageSquare,
  Palette,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCog,
  Video,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { products, categories, services } from "@/lib/catalogue";

const nav = [
  { label: "Vue d’ensemble", icon: LayoutDashboard },
  { label: "Produits", icon: Boxes },
  { label: "Catégories", icon: SlidersHorizontal },
  { label: "Services", icon: ShieldCheck },
  { label: "Pages", icon: FileText },
  { label: "Médiathèque", icon: Image },
  { label: "Hero Slider", icon: GalleryHorizontal },
  { label: "Messages", icon: MessageSquare },
  { label: "Demandes de devis", icon: Bell },
  { label: "Marketing", icon: Megaphone },
  { label: "Apparence", icon: Palette },
  { label: "Utilisateurs", icon: UserCog },
] as const;
type ActiveSection = (typeof nav)[number]["label"];
type MessageStatus = "new" | "read" | "treated" | "archived";
type QuoteStatus =
  | "new"
  | "in_progress"
  | "contacted"
  | "quote_sent"
  | "won"
  | "lost"
  | "archived";
type ProductStatus = "draft" | "published" | "archived";
type AdminProduct = {
  id: number;
  slug: string;
  name: string;
  reference: string;
  category: string;
  description: string;
  imageUrl: string;
  sourceUrl: string | null;
  status: ProductStatus;
  sortOrder: number;
};
type ProductFormValue = Omit<AdminProduct, "id" | "sourceUrl"> & {
  id?: number;
  sourceUrl?: string;
};
type UploadPayload = {
  filename: string;
  contentType: "image/png" | "image/jpeg" | "image/webp";
  data: string;
};
type MediaUploadPayload = {
  filename: string;
  contentType:
    | "video/mp4"
    | "video/webm"
    | "image/png"
    | "image/jpeg"
    | "image/webp";
  data: string;
};
type AdminUser = {
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  lastSignedIn: Date;
  createdAt: Date;
};
type AdminInvite = {
  id: number;
  email: string;
  name: string | null;
  role: "user" | "admin";
  status: "pending" | "accepted" | "revoked";
  createdAt: Date;
};
type CollectionItem = {
  id: string;
  title: string;
  text: string;
  enabled: boolean;
};
type HeroSlide = {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  eyebrow: string;
  ctaLabel: string;
  ctaUrl: string;
  status: "draft" | "published";
  sortOrder: number;
};
type HeroSlideInput = Omit<HeroSlide, "id">;

const messageStatusLabels: Record<MessageStatus, string> = {
  new: "Nouveau",
  read: "Lu",
  treated: "Traité",
  archived: "Archivé",
};
const quoteStatusLabels: Record<QuoteStatus, string> = {
  new: "Nouveau",
  in_progress: "En cours",
  contacted: "Contacté",
  quote_sent: "Devis envoyé",
  won: "Gagné",
  lost: "Perdu",
  archived: "Archivé",
};
const productStatusLabels: Record<ProductStatus, string> = {
  draft: "Brouillon",
  published: "Publié",
  archived: "Archivé",
};
const fallbackProducts: AdminProduct[] = products.map((product, index) => ({
  id: index + 1,
  slug: product.slug,
  name: product.name,
  reference: product.reference,
  category: product.category,
  description: product.description,
  imageUrl: product.image,
  sourceUrl: product.sourceUrl,
  status: "published",
  sortOrder: index + 1,
}));

export default function Admin() {
  const { user, loading, isAuthenticated } = useAuth();
  const isAdmin = Boolean(user?.role === "admin");
  const [active, setActive] = useState<ActiveSection>(() => {
    const requested = new URLSearchParams(window.location.search).get("section");
    return nav.some(item => item.label === requested)
      ? (requested as ActiveSection)
      : "Vue d’ensemble";
  });
  const summaryQuery = trpc.admin.summary.useQuery(undefined, {
    enabled: isAdmin,
    retry: false,
  });
  const utils = trpc.useUtils();
  const saveSetting = trpc.admin.saveSetting.useMutation({
    onSuccess: () => {
      summaryQuery.refetch();
      utils.content.settings.invalidate();
      toast.success("Modification enregistrée");
    },
    onError: error => toast.error(error.message || "Impossible d’enregistrer la modification"),
  });
  const updateMessage = trpc.admin.updateMessageStatus.useMutation({
    onSuccess: () => summaryQuery.refetch(),
  });
  const updateQuote = trpc.admin.updateQuoteStatus.useMutation({
    onSuccess: () => summaryQuery.refetch(),
  });
  const createProduct = trpc.admin.createProduct.useMutation({
    onSuccess: () => summaryQuery.refetch(),
  });
  const updateProduct = trpc.admin.updateProduct.useMutation({
    onSuccess: () => summaryQuery.refetch(),
  });
  const deleteProduct = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => summaryQuery.refetch(),
  });
  const uploadProductImage = trpc.admin.uploadProductImage.useMutation();
  const uploadMedia = trpc.admin.uploadMedia.useMutation();
  const createHeroSlide = trpc.admin.createHeroSlide.useMutation({ onSuccess: () => summaryQuery.refetch() });
  const updateHeroSlide = trpc.admin.updateHeroSlide.useMutation({ onSuccess: () => summaryQuery.refetch() });
  const deleteHeroSlide = trpc.admin.deleteHeroSlide.useMutation({ onSuccess: () => summaryQuery.refetch() });
  const createInvite = trpc.admin.createInvite.useMutation({
    onSuccess: () => summaryQuery.refetch(),
  });
  const revokeInvite = trpc.admin.revokeInvite.useMutation({
    onSuccess: () => summaryQuery.refetch(),
  });
  const updateUserRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => summaryQuery.refetch(),
  });
  const data = summaryQuery.data;
  const settings = useMemo(
    () =>
      Object.fromEntries(
        (data?.settings ?? []).map(item => [item.settingKey, item.value])
      ),
    [data?.settings]
  );
  const managedProducts =
    (data?.products as AdminProduct[] | undefined) ?? fallbackProducts;
  const categoryOptions = useMemo(() => {
    const fromProducts = managedProducts.map(product => product.category);
    let fromSettings: string[] = [];
    try {
      const parsed = settings.admin_categories
        ? JSON.parse(settings.admin_categories)
        : [];
      if (Array.isArray(parsed))
        fromSettings = parsed.filter(item => typeof item === "string");
    } catch {
      fromSettings = [];
    }
    return Array.from(new Set([...fromSettings, ...fromProducts])).filter(Boolean);
  }, [managedProducts, settings.admin_categories]);
  if (loading) return <AdminGate title="Chargement de l’espace sécurisé…" />;
  if (!isAuthenticated)
    return (
      <AdminGate
        title="Accès administrateur"
        text="Connectez-vous avec votre compte CAN LIGNE BLEUE pour ouvrir le back-office."
        action="Se connecter"
        onAction={startLogin}
      />
    );
  if (!isAdmin)
    return (
      <AdminGate
        title="Accès refusé"
        text="Ce compte ne dispose pas des permissions administrateur nécessaires."
        action="Retourner au site"
        onAction={() => {
          window.location.href = "/";
        }}
      />
    );
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <img src="/manus-storage/can-ligne-bleu-icon_2ba82fd4.png" alt="" />
          <div>
            <strong>CAN LIGNE BLEUE</strong>
            <small>Administration</small>
          </div>
        </div>
        <div className="admin-nav-label">Workspace</div>
        <nav>
          {nav.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={
                active === label ? "admin-nav-item active" : "admin-nav-item"
              }
              onClick={() => setActive(label)}
            >
              <Icon size={17} />
              <span>{label}</span>
              {active === label && <ChevronRight size={15} />}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link href="/" className="admin-nav-item">
            <LogOut size={17} />
            <span>Retour au site</span>
          </Link>
          <div className="admin-user">
            <span className="admin-avatar">
              {(user?.name || "CL").slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>{user?.name || "Administrateur"}</strong>
              <small>Super Admin</small>
            </div>
            <Settings2 size={16} />
          </div>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-breadcrumb">
              Workspace <ChevronRight size={14} /> {active}
            </span>
            <h1>{active}</h1>
          </div>
          <div className="admin-top-actions">
            <button className="admin-icon" aria-label="Notifications">
              <Bell size={18} />
              <i />
            </button>
            <button className="admin-avatar">
              {(user?.name || "CL").slice(0, 2).toUpperCase()}
            </button>
          </div>
        </header>
        {active === "Vue d’ensemble" && (
          <Dashboard data={data} products={managedProducts} />
        )}{" "}
        {active === "Produits" && (
          <ProductManager
            rows={managedProducts}
            categories={categoryOptions}
            saving={
              createProduct.isPending ||
              updateProduct.isPending ||
              deleteProduct.isPending ||
              uploadProductImage.isPending
            }
            onUpload={async payload =>
              (await uploadProductImage.mutateAsync(payload)).url
            }
            onCreate={input => createProduct.mutate(input)}
            onUpdate={input =>
              updateProduct.mutate(input as ProductFormValue & { id: number })
            }
            onDelete={id => deleteProduct.mutate({ id })}
          />
        )}{" "}
        {active === "Catégories" && (
          <CategoryManager
            products={managedProducts}
            categories={categoryOptions}
            settings={settings}
            onSave={(key, value) =>
              saveSetting.mutate({ settingKey: key, value })
            }
            saving={saveSetting.isPending}
            onManageCategory={category => {
              setActive("Produits");
              window.history.replaceState(
                null,
                "",
                `/admin?section=Produits&category=${encodeURIComponent(category)}`
              );
            }}
          />
        )}{" "}
        {active === "Services" && (
          <ServicesManager
            settings={settings}
            onSave={(key, value) =>
              saveSetting.mutate({ settingKey: key, value })
            }
            saving={saveSetting.isPending}
          />
        )}{" "}
        {active === "Pages" && (
          <PagesManager
            settings={settings}
            onSave={(key, value) =>
              saveSetting.mutate({ settingKey: key, value })
            }
            saving={saveSetting.isPending}
          />
        )}{" "}
        {active === "Médiathèque" && (
          <MediaManager
            settings={settings}
            onSave={(key, value) =>
              saveSetting.mutate({ settingKey: key, value })
            }
            onUpload={async payload =>
              (await uploadMedia.mutateAsync(payload)).url
            }
            saving={saveSetting.isPending || uploadMedia.isPending}
          />
        )} {" "}
        {active === "Hero Slider" && (
          <HeroSliderManager
            slides={(data?.heroSlides as HeroSlide[] | undefined) ?? []}
            onUpload={async (payload: MediaUploadPayload) => (await uploadMedia.mutateAsync(payload)).url}
            onCreate={(input: HeroSlideInput) => createHeroSlide.mutate(input)}
            onUpdate={(input: HeroSlide) => updateHeroSlide.mutate(input)}
            onDelete={(id: number) => deleteHeroSlide.mutate({ id })}
            saving={createHeroSlide.isPending || updateHeroSlide.isPending || deleteHeroSlide.isPending || uploadMedia.isPending}
          />
        )} {" "}
        {active === "Messages" && (
          <MessagesManager
            messages={data?.messages ?? []}
            onStatus={(id, status) => updateMessage.mutate({ id, status })}
          />
        )}{" "}
        {active === "Demandes de devis" && (
          <QuotesManager
            quotes={data?.quotes ?? []}
            onStatus={(id, status) => updateQuote.mutate({ id, status })}
          />
        )}{" "}
        {active === "Marketing" && (
          <MarketingManager
            settings={settings}
            onSave={(key, value) =>
              saveSetting.mutate({ settingKey: key, value })
            }
            saving={saveSetting.isPending}
          />
        )}{" "}
        {active === "Apparence" && (
          <AppearanceManager
            settings={settings}
            onSave={(key, value) =>
              saveSetting.mutate({ settingKey: key, value })
            }
            saving={saveSetting.isPending}
          />
        )}{" "}
        {active === "Utilisateurs" && (
          <UsersManager
            users={data?.users ?? []}
            invites={data?.invites ?? []}
            currentUserId={user?.id}
            onRole={(id, role) => updateUserRole.mutate({ id, role })}
            onCreateInvite={input => createInvite.mutate(input)}
            onRevokeInvite={id => revokeInvite.mutate({ id })}
          />
        )}
      </main>
    </div>
  );
}

function AdminGate({
  title,
  text,
  action,
  onAction,
}: {
  title: string;
  text?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="admin-gate">
      <div className="admin-gate-mark">
        <img
          src="/manus-storage/can-ligne-bleu-icon_2ba82fd4.png"
          alt="CAN LIGNE BLEUE"
        />
      </div>
      <span className="panel-eyebrow">CAN LIGNE BLEUE · ESPACE PRIVÉ</span>
      <h1>{title}</h1>
      {text && <p>{text}</p>}
      {action && onAction && (
        <button className="button button-primary" onClick={onAction}>
          {action} <ChevronRight size={16} />
        </button>
      )}
      <Link href="/" className="admin-gate-link">
        Retour au site public
      </Link>
    </div>
  );
}
function Dashboard({
  data,
  products: managedProducts,
}: {
  data?: {
    messages: Array<{ status: MessageStatus }>;
    quotes: Array<{ status: QuoteStatus }>;
    settings: Array<unknown>;
    users: AdminUser[];
  };
  products: AdminProduct[];
}) {
  const unread =
    data?.messages.filter(item => item.status === "new").length ?? 0;
  const newQuotes =
    data?.quotes.filter(item => item.status === "new").length ?? 0;
  return (
    <div className="admin-content">
      <div className="dashboard-kpis">
        <Kpi
          label="Produits"
          value={String(managedProducts.length)}
          delta={`${managedProducts.filter(p => p.status === "published").length} publiés`}
          icon={Boxes}
        />
        <Kpi
          label="Demandes de devis"
          value={String(data?.quotes.length ?? 0).padStart(2, "0")}
          delta={`${newQuotes} nouvelle${newQuotes > 1 ? "s" : ""} à traiter`}
          icon={FileText}
        />
        <Kpi
          label="Messages"
          value={String(data?.messages.length ?? 0).padStart(2, "0")}
          delta={`${unread} non lu${unread > 1 ? "s" : ""}`}
          icon={MessageSquare}
        />
        <Kpi
          label="Utilisateurs"
          value={String(data?.users.length ?? 0).padStart(2, "0")}
          delta="Comptes autorisés"
          icon={UserCog}
        />
      </div>
      <div className="admin-grid">
        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-eyebrow">Pilotage</span>
              <h2>Votre site en un regard</h2>
            </div>
            <span className="admin-live">
              <i /> Données en direct
            </span>
          </div>
          <div className="admin-overview-list">
            <OverviewLink
              icon={Boxes}
              label="Catalogue produits"
              value={`${managedProducts.length} références`}
            />
            <OverviewLink
              icon={MessageSquare}
              label="Messages entrants"
              value={`${unread} nouveau${unread > 1 ? "x" : ""}`}
            />
            <OverviewLink
              icon={FileText}
              label="Demandes commerciales"
              value={`${newQuotes} nouvelle${newQuotes > 1 ? "s" : ""}`}
            />
            <OverviewLink
              icon={Video}
              label="Vidéos"
              value="2 emplacements prêts"
            />
          </div>
        </section>
        <section className="admin-panel quick-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-eyebrow">Actions rapides</span>
              <h2>À configurer</h2>
            </div>
          </div>
          <Quick label="Renseigner les coordonnées" status="Pages → Contact" />
          <Quick label="Ajouter les vidéos IA" status="Médiathèque" />
          <Quick
            label="Traiter les demandes"
            status={`${newQuotes} en attente`}
          />
          <Quick label="Préparer une campagne" status="Marketing" />
        </section>
      </div>
      <section className="admin-panel table-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-eyebrow">Derniers produits</span>
            <h2>Catalogue administrable</h2>
          </div>
          <Link href="/products" className="panel-action">
            Voir le site <ChevronRight size={15} />
          </Link>
        </div>
        <ProductTable rows={managedProducts.slice(0, 5)} />
      </section>
    </div>
  );
}
function Kpi({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: string;
  icon: typeof Boxes;
}) {
  return (
    <div className="kpi-card">
      <span className="kpi-icon">
        <Icon size={18} />
      </span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{delta}</small>
    </div>
  );
}
function OverviewLink({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Boxes;
  label: string;
  value: string;
}) {
  return (
    <div className="overview-link">
      <span className="kpi-icon">
        <Icon size={17} />
      </span>
      <strong>{label}</strong>
      <span>{value}</span>
      <ChevronRight size={16} />
    </div>
  );
}
function Quick({ label, status }: { label: string; status: string }) {
  return (
    <div className="quick-item">
      <span className="quick-check" />
      <div>
        <strong>{label}</strong>
        <small>{status}</small>
      </div>
      <ChevronRight size={16} />
    </div>
  );
}
function ProductManager({
  rows,
  categories,
  saving,
  onUpload,
  onCreate,
  onUpdate,
  onDelete,
}: {
  rows: AdminProduct[];
  categories: string[];
  saving: boolean;
  onUpload: (payload: UploadPayload) => Promise<string>;
  onCreate: (input: ProductFormValue) => void;
  onUpdate: (input: ProductFormValue & { id: number }) => void;
  onDelete: (id: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(() => new URLSearchParams(window.location.search).get("category") || "");
  const [editor, setEditor] = useState<ProductFormValue | null>(null);
  const filtered = rows.filter(p =>
    `${p.name} ${p.reference} ${p.category}`
      .toLowerCase()
      .includes(search.toLowerCase()) &&
    (!categoryFilter || p.category === categoryFilter)
  );
  const blank: ProductFormValue = {
    slug: "",
    name: "",
    reference: "",
    category: categories[0] || "",
    description: "",
    imageUrl: "",
    sourceUrl: "",
    status: "draft",
    sortOrder: rows.length + 1,
  };
  return (
    <div className="admin-content">
      <div className="manager-toolbar">
        <div className="admin-search">
          <Search size={17} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un produit…"
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X size={15} />
            </button>
          )}
        </div>
        <select
          className="admin-select"
          value={categoryFilter}
          onChange={event => setCategoryFilter(event.target.value)}
          aria-label="Filtrer les produits par catégorie"
        >
          <option value="">Toutes les catégories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <button
          className="button button-primary"
          onClick={() => setEditor(blank)}
        >
          <Boxes size={15} /> Ajouter un produit
        </button>
      </div>
      <section className="admin-panel table-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-eyebrow">Gestion catalogue</span>
            <h2>{filtered.length} produits</h2>
          </div>
          <span className="admin-readonly">
            CRUD complet · publication · archivage
          </span>
        </div>
        <ProductTable
          rows={filtered}
          onEdit={product =>
            setEditor({ ...product, sourceUrl: product.sourceUrl || "" })
          }
          onDelete={onDelete}
        />
      </section>
      {editor && (
        <ProductEditor
          value={editor}
          categories={categories}
          saving={saving}
          onUpload={onUpload}
          onClose={() => setEditor(null)}
          onSubmit={value => {
            const normalized = {
              ...value,
              sourceUrl: value.sourceUrl || undefined,
            };
            if (value.id)
              onUpdate(normalized as ProductFormValue & { id: number });
            else onCreate(normalized);
            setEditor(null);
          }}
        />
      )}
    </div>
  );
}
function ProductTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: AdminProduct[];
  onEdit?: (product: AdminProduct) => void;
  onDelete?: (id: number) => void;
}) {
  return (
    <div className="admin-table">
      <div className="table-row table-head">
        <span>Produit</span>
        <span>Référence</span>
        <span>Catégorie</span>
        <span>Statut</span>
        {onEdit && <span>Actions</span>}
      </div>
      {rows.map(product => (
        <div
          className={`table-row ${product.status === "archived" ? "product-row-archived" : ""}`}
          key={product.id}
        >
          <span className="table-product">
            <img src={product.imageUrl} alt="" />
            <strong>{product.name}</strong>
          </span>
          <span>#{product.reference}</span>
          <span>{product.category}</span>
          <span>
            <b
              className={`status-pill ${product.status === "published" ? "status-live" : product.status === "archived" ? "status-archived" : "status-draft"}`}
            >
              {productStatusLabels[product.status]}
            </b>
          </span>
          {onEdit && (
            <span className="table-actions">
              <button className="table-action" onClick={() => onEdit(product)}>
                Modifier
              </button>
              <button
                className="table-action table-action-danger"
                onClick={() => {
                  if (
                    window.confirm(`Supprimer ${product.name} définitivement ?`)
                  )
                    onDelete?.(product.id);
                }}
              >
                <Trash2 size={13} />
              </button>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
function ProductEditor({
  value,
  categories,
  saving,
  onUpload,
  onClose,
  onSubmit,
}: {
  value: ProductFormValue;
  categories: string[];
  saving: boolean;
  onUpload: (payload: UploadPayload) => Promise<string>;
  onClose: () => void;
  onSubmit: (value: ProductFormValue) => void;
}) {
  const [form, setForm] = useState(value);
  const [uploading, setUploading] = useState(false);
  const set = (key: keyof ProductFormValue, next: string | number) =>
    setForm(current => ({ ...current, [key]: next }));
  const handleImage = (file?: File) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      window.alert("Format accepté : PNG, JPG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.alert("La photo doit faire moins de 5 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result).split(",")[1] || "";
      setUploading(true);
      onUpload({
        filename: file.name,
        contentType: file.type as UploadPayload["contentType"],
        data,
      })
        .then(url => set("imageUrl", url))
        .catch(() => window.alert("Impossible d’importer cette photo."))
        .finally(() => setUploading(false));
    };
    reader.readAsDataURL(file);
  };
  return (
    <div className="admin-modal-backdrop">
      <form
        className="admin-modal"
        onSubmit={event => {
          event.preventDefault();
          onSubmit({ ...form, sortOrder: Number(form.sortOrder) || 0 });
        }}
      >
        <div className="admin-modal-head">
          <div>
            <span className="panel-eyebrow">
              {form.id ? "Modifier la référence" : "Nouvelle référence"}
            </span>
            <h2>{form.id ? form.name : "Ajouter un produit"}</h2>
          </div>
          <button type="button" className="admin-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="admin-form-grid">
          <label>
            Nom du produit
            <input
              required
              value={form.name}
              onChange={e => set("name", e.target.value)}
            />
          </label>
          <label>
            Slug URL
            <input
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              value={form.slug}
              onChange={e => set("slug", e.target.value)}
            />
          </label>
          <label>
            Référence
            <input
              required
              value={form.reference}
              onChange={e => set("reference", e.target.value)}
            />
          </label>
          <label>
            Catégorie
            <select
              required
              value={form.category}
              onChange={e => set("category", e.target.value)}
            >
              <option value="" disabled>
                Choisir une catégorie
              </option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-form-wide">
            Description
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={e => set("description", e.target.value)}
            />
          </label>
          <label className="admin-form-wide">
            Photo du produit
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={e => handleImage(e.target.files?.[0])}
            />
            <small>
              {uploading
                ? "Import de la photo en cours…"
                : "PNG, JPG ou WebP · 5 Mo maximum. La photo est envoyée vers le stockage sécurisé."}
            </small>
            <input
              required
              placeholder="/manus-storage/mon-image.png"
              value={form.imageUrl}
              onChange={e => set("imageUrl", e.target.value)}
            />
          </label>
          <label>
            Fiche source
            <input
              type="url"
              value={form.sourceUrl || ""}
              onChange={e => set("sourceUrl", e.target.value)}
            />
          </label>
          <label>
            Ordre d’affichage
            <input
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={e => set("sortOrder", Number(e.target.value))}
            />
          </label>
          <label>
            Visibilité
            <select
              value={form.status}
              onChange={e => set("status", e.target.value as ProductStatus)}
            >
              <option value="published">Publié · visible</option>
              <option value="draft">Brouillon · masqué</option>
              <option value="archived">Archivé · masqué</option>
            </select>
          </label>
        </div>
        <div className="admin-modal-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="button button-primary"
            disabled={saving || uploading}
          >
            {uploading
              ? "Import de la photo…"
              : saving
                ? "Enregistrement…"
                : form.id
                  ? "Enregistrer les modifications"
                  : "Créer le produit"}
          </button>
        </div>
      </form>
    </div>
  );
}
function CategoryManager({
  products: managedProducts,
  categories,
  settings,
  onSave,
  saving,
  onManageCategory,
}: {
  products: AdminProduct[];
  categories: string[];
  settings: Record<string, string>;
  onSave: (key: string, value: string) => void;
  saving: boolean;
  onManageCategory: (category: string) => void;
}) {
  const productCategories = useMemo(
    () => Array.from(new Set(managedProducts.map(product => product.category))),
    [managedProducts]
  );
  const [categoryList, setCategoryList] = useState<string[]>(productCategories);
  const [newCategory, setNewCategory] = useState("");
  useEffect(() => {
    try {
      const stored = settings.admin_categories
        ? (JSON.parse(settings.admin_categories) as unknown)
        : null;
      setCategoryList(
        Array.isArray(stored) && stored.every(item => typeof item === "string")
          ? stored
          : categories
      );
    } catch {
      setCategoryList(categories);
    }
  }, [settings.admin_categories, productCategories, categories]);
  const persist = (next: string[]) => {
    setCategoryList(next);
    onSave("admin_categories", JSON.stringify(next));
  };
  const addCategory = () => {
    const value = newCategory.trim();
    if (
      !value ||
      categoryList.some(item => item.toLowerCase() === value.toLowerCase())
    )
      return;
    persist([...categoryList, value]);
    setNewCategory("");
  };
  return (
    <div className="admin-content">
      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-eyebrow">Organisation</span>
            <h2>Catégories produits</h2>
          </div>
          <span className="admin-readonly">
            {categoryList.length} catégories
          </span>
        </div>
        <div className="admin-inline-form">
          <input
            value={newCategory}
            onChange={event => setNewCategory(event.target.value)}
            placeholder="Nom de la nouvelle catégorie"
            onKeyDown={event => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCategory();
              }
            }}
          />
          <button
            type="button"
            className="button button-primary"
            onClick={addCategory}
            disabled={saving || !newCategory.trim()}
          >
            Ajouter
          </button>
        </div>
        <div className="category-grid">
          {categoryList.map((category, index) => (
            <div className="category-card category-card-managed" key={category}>
              <span>0{index + 1}</span>
              <strong>{category}</strong>
              <small>
                {
                  managedProducts.filter(
                    product => product.category === category
                  ).length
                }{" "}
                références
              </small>
              <button
                type="button"
                className="table-action"
                onClick={() => onManageCategory(category)}
              >
                Voir les produits
              </button>
              <button
                type="button"
                className="table-action table-action-danger"
                onClick={() =>
                  persist(categoryList.filter(item => item !== category))
                }
                disabled={saving}
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
        <p className="editor-intro category-note">
          Les nouvelles catégories sont disponibles immédiatement dans
          l’organisation du catalogue. Vous pouvez ensuite les affecter aux
          produits depuis Produits.
        </p>
      </section>
    </div>
  );
}
function ContentShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-content">
      <section className="admin-panel editor-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
          </div>
        </div>
        {children}
      </section>
    </div>
  );
}
function SettingField({
  settingKey,
  label,
  help,
  initial,
  onSave,
  saving,
  multiline = false,
}: {
  settingKey: string;
  label: string;
  help: string;
  initial?: string;
  onSave: (key: string, value: string) => void;
  saving: boolean;
  multiline?: boolean;
}) {
  const [value, setValue] = useState(initial ?? "");
  useEffect(() => setValue(initial ?? ""), [initial]);
  return (
    <div className="setting-field">
      <div>
        <label>{label}</label>
        <small>{help}</small>
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          rows={4}
        />
      ) : (
        <input value={value} onChange={e => setValue(e.target.value)} />
      )}
      <button
        className="button button-small"
        disabled={saving || value === (initial ?? "")}
        onClick={() => onSave(settingKey, value)}
      >
        Enregistrer
      </button>
    </div>
  );
}
function ServicesManager({
  settings,
  onSave,
  saving,
}: {
  settings: Record<string, string>;
  onSave: (key: string, value: string) => void;
  saving: boolean;
}) {
  const fallback = services.map(service => ({
    id: service.number,
    title: service.title,
    text: service.text,
    enabled: true,
  }));
  const [items, setItems] = useState<CollectionItem[]>(fallback);
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  useEffect(() => {
    try {
      const stored = settings.admin_services
        ? (JSON.parse(settings.admin_services) as unknown)
        : null;
      setItems(Array.isArray(stored) ? (stored as CollectionItem[]) : fallback);
    } catch {
      setItems(fallback);
    }
  }, [settings.admin_services]);
  const persist = (next: CollectionItem[]) => {
    setItems(next);
    onSave("admin_services", JSON.stringify(next));
  };
  const add = () => {
    if (!newTitle.trim()) return;
    persist([
      ...items,
      {
        id: `service-${Date.now()}`,
        title: newTitle.trim(),
        text: newText.trim(),
        enabled: true,
      },
    ]);
    setNewTitle("");
    setNewText("");
  };
  return (
    <ContentShell eyebrow="Contenu éditorial" title="Services & expertise">
      <p className="editor-intro">
        Ajoutez, modifiez, activez ou désactivez les services présentés sur le
        site. Chaque changement est enregistré dans la base.
      </p>
      <SettingField
        settingKey="services_intro"
        label="Introduction des services"
        help="Texte de présentation sous le titre de la page."
        initial={
          settings.services_intro ||
          "CAN LIGNE BLEUE vous aide à structurer vos achats et vos protocoles d’hygiène."
        }
        onSave={onSave}
        saving={saving}
        multiline
      />
      <div className="admin-collection-list">
        {items.map((item, index) => (
          <div className="admin-collection-row" key={item.id}>
            <span className="collection-index">0{index + 1}</span>
            <div className="collection-fields">
              <input
                value={item.title}
                onChange={event =>
                  setItems(
                    items.map(current =>
                      current.id === item.id
                        ? { ...current, title: event.target.value }
                        : current
                    )
                  )
                }
                onBlur={() => persist(items)}
              />
              <textarea
                rows={2}
                value={item.text}
                onChange={event =>
                  setItems(
                    items.map(current =>
                      current.id === item.id
                        ? { ...current, text: event.target.value }
                        : current
                    )
                  )
                }
                onBlur={() => persist(items)}
              />
            </div>
            <label className="collection-toggle">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={event =>
                  persist(
                    items.map(current =>
                      current.id === item.id
                        ? { ...current, enabled: event.target.checked }
                        : current
                    )
                  )
                }
              />{" "}
              Actif
            </label>
            <button
              type="button"
              className="table-action table-action-danger"
              onClick={() =>
                persist(items.filter(current => current.id !== item.id))
              }
              disabled={saving}
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>
      <div className="admin-add-card">
        <input
          value={newTitle}
          onChange={event => setNewTitle(event.target.value)}
          placeholder="Nom du nouveau service"
        />
        <textarea
          rows={2}
          value={newText}
          onChange={event => setNewText(event.target.value)}
          placeholder="Description du service"
        />
        <button
          type="button"
          className="button button-primary"
          onClick={add}
          disabled={saving || !newTitle.trim()}
        >
          Ajouter le service
        </button>
      </div>
    </ContentShell>
  );
}
function PagesManager({
  settings,
  onSave,
  saving,
}: {
  settings: Record<string, string>;
  onSave: (key: string, value: string) => void;
  saving: boolean;
}) {
  const defaultPages: CollectionItem[] = [
    {
      id: "home",
      title: "Accueil",
      text: "Page principale et présentation de CAN LIGNE BLEUE",
      enabled: true,
    },
    {
      id: "products",
      title: "Produits",
      text: "Catalogue professionnel Quimxel",
      enabled: true,
    },
    {
      id: "catalogue",
      title: "Catalogue",
      text: "Catalogue digital interactif",
      enabled: true,
    },
    {
      id: "services",
      title: "Services",
      text: "Solutions et accompagnement professionnel",
      enabled: true,
    },
    {
      id: "contact",
      title: "Contact",
      text: "Coordonnées et formulaire de contact",
      enabled: true,
    },
  ];
  const [pages, setPages] = useState<CollectionItem[]>(defaultPages);
  const [newPage, setNewPage] = useState("");
  useEffect(() => {
    try {
      const stored = settings.admin_pages
        ? (JSON.parse(settings.admin_pages) as unknown)
        : null;
      setPages(
        Array.isArray(stored) ? (stored as CollectionItem[]) : defaultPages
      );
    } catch {
      setPages(defaultPages);
    }
  }, [settings.admin_pages]);
  const persistPages = (next: CollectionItem[]) => {
    setPages(next);
    onSave("admin_pages", JSON.stringify(next));
  };
  return (
    <ContentShell eyebrow="Contenu éditorial" title="Pages du site">
      <p className="editor-intro">
        Gérez les textes, l’ordre éditorial et l’activation des pages
        principales. Les champs ci-dessous alimentent les pages publiques
        existantes.
      </p>
      <SettingField
        settingKey="site_name"
        label="Nom de l’entreprise"
        help="Ce nom sera affiché dans l’en-tête et le pied de page du site."
        initial={settings.site_name || "CAN LIGNE BLEUE"}
        onSave={onSave}
        saving={saving}
      />
      <SettingField
        settingKey="home_hero_title"
        label="Titre principal accueil"
        help="Accroche affichée dans le hero."
        initial={
          settings.home_hero_title || "La propreté qui inspire confiance."
        }
        onSave={onSave}
        saving={saving}
        multiline
      />
      <SettingField
        settingKey="home_hero_text"
        label="Description accueil"
        help="Texte court sous l’accroche principale."
        initial={
          settings.home_hero_text ||
          "Des produits, équipements et solutions de nettoyage conçus pour les environnements professionnels."
        }
        onSave={onSave}
        saving={saving}
        multiline
      />
      <SettingField
        settingKey="contact_address"
        label="Adresse commerciale"
        help="Coordonnée affichée sur la page Contact."
        initial={settings.contact_address || "Adresse commerciale, Tunisie"}
        onSave={onSave}
        saving={saving}
      />
      <SettingField
        settingKey="contact_email"
        label="Email de contact"
        help="Email affiché sur la page Contact."
        initial={settings.contact_email || "contact@canlignebleu.tn"}
        onSave={onSave}
        saving={saving}
      />
      <SettingField
        settingKey="contact_phone"
        label="Téléphone"
        help="Numéro affiché sur le site."
        initial={settings.contact_phone || "+216"}
        onSave={onSave}
        saving={saving}
      />
      <div className="admin-collection-list">
        {pages.map(page => (
          <div className="admin-collection-row" key={page.id}>
            <span className="collection-index">
              <FileText size={16} />
            </span>
            <div className="collection-fields">
              <input
                value={page.title}
                onChange={event =>
                  setPages(
                    pages.map(current =>
                      current.id === page.id
                        ? { ...current, title: event.target.value }
                        : current
                    )
                  )
                }
                onBlur={() => persistPages(pages)}
              />
              <textarea
                rows={2}
                value={page.text}
                onChange={event =>
                  setPages(
                    pages.map(current =>
                      current.id === page.id
                        ? { ...current, text: event.target.value }
                        : current
                    )
                  )
                }
                onBlur={() => persistPages(pages)}
              />
            </div>
            <label className="collection-toggle">
              <input
                type="checkbox"
                checked={page.enabled}
                onChange={event =>
                  persistPages(
                    pages.map(current =>
                      current.id === page.id
                        ? { ...current, enabled: event.target.checked }
                        : current
                    )
                  )
                }
              />{" "}
              Active
            </label>
            <button
              type="button"
              className="table-action table-action-danger"
              onClick={() =>
                persistPages(pages.filter(current => current.id !== page.id))
              }
              disabled={saving}
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>
      <div className="admin-add-card">
        <input
          value={newPage}
          onChange={event => setNewPage(event.target.value)}
          placeholder="Nom d’une nouvelle page"
        />
        <button
          type="button"
          className="button button-primary"
          onClick={() => {
            if (!newPage.trim()) return;
            persistPages([
              ...pages,
              {
                id: `page-${Date.now()}`,
                title: newPage.trim(),
                text: "Nouvelle page à compléter",
                enabled: true,
              },
            ]);
            setNewPage("");
          }}
          disabled={saving || !newPage.trim()}
        >
          Ajouter la page
        </button>
      </div>
    </ContentShell>
  );
}
function MediaManager({
  settings,
  onSave,
  onUpload,
  saving,
}: {
  settings: Record<string, string>;
  onSave: (key: string, value: string) => void;
  onUpload: (payload: MediaUploadPayload) => Promise<string>;
  saving: boolean;
}) {
  const [destination, setDestination] = useState<
    | "video_hero_url"
    | "video_services_url"
    | "home_hero_image_url"
    | "video_hero_poster_url"
    | "video_services_poster_url"
    | "logo_horizontal_url"
    | "logo_icon_url"
  >("video_hero_url");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const handleVideo = (file?: File) => {
    if (!file) return;
    if (!["video/mp4", "video/webm"].includes(file.type)) {
      window.alert("Format accepté : MP4 ou WebM.");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      window.alert("La vidéo doit faire moins de 30 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result).split(",")[1] || "";
      setUploading(true);
      setMessage("");
      onUpload({
        filename: file.name,
        contentType: file.type as MediaUploadPayload["contentType"],
        data,
      })
        .then(url => {
          onSave(destination, url);
          setMessage(
            "Vidéo importée. Elle est maintenant liée à cet emplacement."
          );
        })
        .catch(() => setMessage("Impossible d’importer la vidéo."))
        .finally(() => setUploading(false));
    };
    reader.readAsDataURL(file);
  };
  const handleImage = (file?: File) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      window.alert("Format accepté : PNG, JPG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.alert("L’image doit faire moins de 5 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result).split(",")[1] || "";
      setUploading(true);
      setMessage("");
      onUpload({
        filename: file.name,
        contentType: file.type as MediaUploadPayload["contentType"],
        data,
      })
        .then(url => {
          onSave(destination, url);
          setMessage("Photo remplacée. La modification est active sur le site.");
        })
        .catch(() => setMessage("Impossible d’importer la photo."))
        .finally(() => setUploading(false));
    };
    reader.readAsDataURL(file);
  };
  return (
    <ContentShell eyebrow="Assets & vidéos" title="Médiathèque">
      <p className="editor-intro">
        Importez une image ou une vidéo depuis votre ordinateur. Le fichier est
        placé dans le stockage sécurisé puis relié à l’emplacement choisi du site.
      </p>
      <div className="media-upload-card">
        <div>
            <strong>Importer ou remplacer un média</strong>
            <small>Vidéo MP4/WebM · 30 Mo ou image PNG/JPG/WebP · 5 Mo</small>
        </div>
        <select
          value={destination}
          onChange={event =>
            setDestination(event.target.value as typeof destination)
          }
        >
          <option value="video_hero_url">Emplacement Hero</option>
          <option value="video_services_url">Emplacement Services</option>
          <option value="home_hero_image_url">Photo principale de l’accueil</option>
          <option value="video_hero_poster_url">Image d’aperçu vidéo Hero</option>
          <option value="video_services_poster_url">Image d’aperçu vidéo Services</option>
          <option value="logo_horizontal_url">Logo horizontal du site</option>
          <option value="logo_icon_url">Icône du logo</option>
        </select>
        <input
          type="file"
          accept={destination.startsWith("video_") ? "video/mp4,video/webm" : "image/png,image/jpeg,image/webp"}
          onChange={event => destination.startsWith("video_") ? handleVideo(event.target.files?.[0]) : handleImage(event.target.files?.[0])}
          disabled={uploading}
        />
        <span className="upload-status">
          {uploading ? "Import en cours…" : message}
        </span>
      </div>
      <p className="editor-intro">
        Remplacez les photos déjà utilisées sur le site sans modifier le code. Sélectionnez un emplacement, importez une image, puis la nouvelle version devient active automatiquement.
      </p>
      {[
        ["home_hero_image_url", "Photo principale actuelle"],
        ["video_hero_poster_url", "Aperçu vidéo Hero actuel"],
        ["video_services_poster_url", "Aperçu vidéo Services actuel"],
        ["logo_horizontal_url", "Logo horizontal actuel"],
        ["logo_icon_url", "Icône actuelle"],
      ].map(([key, label]) => (
        <div className="media-brand-row" key={key}>
          {settings[key] ? <img src={settings[key]} alt={label} /> : <span>{label} par défaut</span>}
          <span>{label}</span>
          <b className={`status-pill ${settings[key] ? "status-live" : "status-draft"}`}>
            {settings[key] ? "Personnalisée" : "Par défaut"}
          </b>
        </div>
      ))}
      <SettingField
        settingKey="video_hero_url"
        label="Vidéo Hero MP4"
        help="Vous pouvez aussi coller un chemin /manus-storage/..."
        initial={settings.video_hero_url}
        onSave={onSave}
        saving={saving || uploading}
      />
      <SettingField
        settingKey="video_services_url"
        label="Vidéo Services MP4"
        help="Vous pouvez aussi coller un chemin /manus-storage/..."
        initial={settings.video_services_url}
        onSave={onSave}
        saving={saving || uploading}
      />
      <div className="media-brand-row">
        <img
          src="/manus-storage/logofinal-removebg-preview_63c556eb.png"
          alt="CAN LIGNE BLEUE"
        />
        <span>Logo officiel actif dans le site</span>
        <b className="status-pill status-live">Actif</b>
      </div>
    </ContentShell>
  );
}
function MessagesManager({
  messages,
  onStatus,
}: {
  messages: Array<{
    id: number;
    name: string;
    email: string;
    company: string | null;
    subject: string | null;
    message: string;
    status: MessageStatus;
    createdAt: Date;
  }>;
  onStatus: (id: number, status: MessageStatus) => void;
}) {
  return (
    <div className="admin-content">
      <section className="admin-panel table-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-eyebrow">Relation client</span>
            <h2>{messages.length} messages reçus</h2>
          </div>
          <span className="admin-live">
            <i /> Persistants
          </span>
        </div>
        {messages.length === 0 ? (
          <EmptyState icon={Mail} text="Aucun message reçu pour le moment." />
        ) : (
          <div className="inbox-list">
            {messages.map(message => (
              <article className="inbox-item" key={message.id}>
                <div className="inbox-avatar">
                  {message.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="inbox-content">
                  <div className="inbox-head">
                    <strong>{message.name}</strong>
                    <small>
                      {new Date(message.createdAt).toLocaleString("fr-FR")}
                    </small>
                  </div>
                  <span>
                    {message.company || message.email}
                    {message.subject ? ` · ${message.subject}` : ""}
                  </span>
                  <p>{message.message}</p>
                </div>
                <select
                  className="admin-select"
                  value={message.status}
                  onChange={e =>
                    onStatus(message.id, e.target.value as MessageStatus)
                  }
                >
                  {Object.entries(messageStatusLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
function QuotesManager({
  quotes,
  onStatus,
}: {
  quotes: Array<{
    id: number;
    name: string;
    company: string;
    email: string;
    phone: string;
    city: string | null;
    quantity: string | null;
    products: string;
    status: QuoteStatus;
    createdAt: Date;
  }>;
  onStatus: (id: number, status: QuoteStatus) => void;
}) {
  return (
    <div className="admin-content">
      <section className="admin-panel table-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-eyebrow">Commercial</span>
            <h2>{quotes.length} demandes de devis</h2>
          </div>
          <span className="admin-live">
            <i /> Persistantes
          </span>
        </div>
        {quotes.length === 0 ? (
          <EmptyState
            icon={FileText}
            text="Aucune demande de devis reçue pour le moment."
          />
        ) : (
          <div className="quote-admin-list">
            {quotes.map(quote => {
              let productCount = 0;
              try {
                productCount = JSON.parse(quote.products).length;
              } catch {
                productCount = 1;
              }
              return (
                <article className="quote-admin-item" key={quote.id}>
                  <div>
                    <span className="panel-eyebrow">Demande #{quote.id}</span>
                    <h3>
                      {quote.name} <em>· {quote.company}</em>
                    </h3>
                    <p>
                      {quote.email} · {quote.phone}
                      {quote.city ? ` · ${quote.city}` : ""}
                    </p>
                  </div>
                  <div className="quote-admin-meta">
                    <strong>
                      {productCount} référence{productCount > 1 ? "s" : ""}
                    </strong>
                    <small>{quote.quantity || "Quantité à préciser"}</small>
                    <span>
                      {new Date(quote.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <select
                    className="admin-select"
                    value={quote.status}
                    onChange={e =>
                      onStatus(quote.id, e.target.value as QuoteStatus)
                    }
                  >
                    {Object.entries(quoteStatusLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
function MarketingManager({
  settings,
  onSave,
  saving,
}: {
  settings: Record<string, string>;
  onSave: (key: string, value: string) => void;
  saving: boolean;
}) {
  return (
    <ContentShell eyebrow="Acquisition" title="Marketing & conversion">
      <p className="editor-intro">
        Gérez les points de contact et les appels à l’action visibles sur le
        site.
      </p>
      <SettingField
        settingKey="whatsapp_url"
        label="Lien WhatsApp"
        help="URL complète wa.me avec le message prérempli."
        initial={settings.whatsapp_url || "https://wa.me/21600000000"}
        onSave={onSave}
        saving={saving}
      />
      <SettingField
        settingKey="footer_cta"
        label="Message CTA footer"
        help="Accroche affichée au bas des pages."
        initial={
          settings.footer_cta || "Construisons la bonne solution ensemble."
        }
        onSave={onSave}
        saving={saving}
        multiline
      />
      <div className="marketing-check">
        <Megaphone size={19} />
        <div>
          <strong>Tracking analytics</strong>
          <small>
            À connecter lorsque vos identifiants de mesure seront disponibles.
          </small>
        </div>
        <span className="status-pill status-draft">À configurer</span>
      </div>
    </ContentShell>
  );
}
function AppearanceManager({
  settings,
  onSave,
  saving,
}: {
  settings: Record<string, string>;
  onSave: (key: string, value: string) => void;
  saving: boolean;
}) {
  return (
    <ContentShell eyebrow="Identité visuelle" title="Apparence">
      <p className="editor-intro">
        Les couleurs principales suivent déjà le logo officiel. Les couleurs
        enregistrées ici documentent la charte et pourront piloter les prochains
        composants.
      </p>
      <div className="color-swatches">
        <span style={{ background: "#0b4ea2" }} />
        <span style={{ background: "#16b9df" }} />
        <span style={{ background: "#c9cbd0" }} />
        <span style={{ background: "#062b57" }} />
      </div>
      <SettingField
        settingKey="brand_primary"
        label="Bleu royal"
        help="Couleur principale de la marque."
        initial={settings.brand_primary || "#0B4EA2"}
        onSave={onSave}
        saving={saving}
      />
      <SettingField
        settingKey="brand_accent"
        label="Cyan accent"
        help="Couleur d’accent et des boutons."
        initial={settings.brand_accent || "#16B9DF"}
        onSave={onSave}
        saving={saving}
      />
    </ContentShell>
  );
}
function UsersManager({
  users,
  invites,
  currentUserId,
  onRole,
  onCreateInvite,
  onRevokeInvite,
}: {
  users: AdminUser[];
  invites: AdminInvite[];
  currentUserId?: number;
  onRole: (id: number, role: "user" | "admin") => void;
  onCreateInvite: (input: {
    email: string;
    name?: string;
    role: "user" | "admin";
  }) => void;
  onRevokeInvite: (id: number) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const submitInvite = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    onCreateInvite({
      email: email.trim(),
      name: name.trim() || undefined,
      role,
    });
    setEmail("");
    setName("");
    setRole("user");
  };
  return (
    <div className="admin-content">
      <section className="admin-panel table-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-eyebrow">Accès & permissions</span>
            <h2>{users.length} comptes</h2>
          </div>
          <span className="admin-live">
            <i /> Authentification OAuth
          </span>
        </div>
        <form className="admin-invite-form" onSubmit={submitInvite}>
          <div>
            <strong>Ajouter un utilisateur</strong>
            <small>
              Créez un accès par email. À sa prochaine connexion Manus avec cette
              adresse, le rôle choisi sera appliqué automatiquement.
            </small>
          </div>
          <input
            type="text"
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="Nom (facultatif)"
          />
          <input
            required
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="email@entreprise.tn"
          />
          <select
            value={role}
            onChange={event => setRole(event.target.value as typeof role)}
          >
            <option value="user">Utilisateur</option>
            <option value="admin">Administrateur</option>
          </select>
          <button type="submit" className="button button-primary">
            Créer l’accès
          </button>
        </form>
        {users.length === 0 ? (
          <EmptyState
            icon={UserCog}
            text="Aucun compte n’est encore enregistré."
          />
        ) : (
          <div className="user-list">
            {users.map(item => (
              <article className="user-item" key={item.id}>
                <div className="inbox-avatar">
                  {(item.name || item.email || "U").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <strong>{item.name || "Utilisateur sans nom"}</strong>
                  <small>{item.email || "Email non renseigné"}</small>
                </div>
                <span>
                  {item.id === currentUserId
                    ? "Votre compte"
                    : `Dernière connexion : ${new Date(item.lastSignedIn).toLocaleDateString("fr-FR")}`}
                </span>
                <select
                  className="admin-select"
                  value={item.role}
                  disabled={item.id === currentUserId}
                  onChange={event =>
                    onRole(item.id, event.target.value as "user" | "admin")
                  }
                >
                  <option value="admin">Administrateur</option>
                  <option value="user">Utilisateur</option>
                </select>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="admin-panel table-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-eyebrow">Invitations</span>
            <h2>{invites.length} invitations</h2>
          </div>
          <span className="admin-readonly">Connexion requise pour activer</span>
        </div>
        {invites.length === 0 ? (
          <EmptyState icon={Send} text="Aucune invitation en attente." />
        ) : (
          <div className="user-list">
            {invites.map(invite => (
              <article className="user-item" key={invite.id}>
                <div className="inbox-avatar">
                  <Send size={16} />
                </div>
                <div>
                  <strong>{invite.name || invite.email}</strong>
                  <small>{invite.email}</small>
                </div>
                <span>
                  Rôle :{" "}
                  {invite.role === "admin" ? "Administrateur" : "Utilisateur"}
                </span>
                <b
                  className={`status-pill ${invite.status === "pending" ? "status-draft" : invite.status === "accepted" ? "status-live" : "status-archived"}`}
                >
                  {invite.status === "pending"
                    ? "En attente"
                    : invite.status === "accepted"
                      ? "Acceptée"
                      : "Révoquée"}
                </b>
                {invite.status === "pending" && (
                  <button
                    type="button"
                    className="table-action table-action-danger"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Révoquer l’invitation de ${invite.email} ?`
                        )
                      )
                        onRevokeInvite(invite.id);
                    }}
                  >
                    Révoquer
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
function HeroSliderManager({
  slides,
  onUpload,
  onCreate,
  onUpdate,
  onDelete,
  saving,
}: {
  slides: HeroSlide[];
  onUpload: (payload: MediaUploadPayload) => Promise<string>;
  onCreate: (input: HeroSlideInput) => void;
  onUpdate: (input: HeroSlide) => void;
  onDelete: (id: number) => void;
  saving: boolean;
}) {
  const empty: HeroSlideInput = { title: "", subtitle: "", imageUrl: "", eyebrow: "Sélection professionnelle", ctaLabel: "Découvrir nos produits", ctaUrl: "/products", status: "published", sortOrder: slides.length + 1 };
  const [form, setForm] = useState<HeroSlideInput>(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title || !form.subtitle || !form.imageUrl) return toast.error("Ajoutez un titre, un texte et une image");
    if (editingId) onUpdate({ ...form, id: editingId });
    else onCreate(form);
    setForm({ ...empty, sortOrder: slides.length + 2 });
    setEditingId(null);
  };
  const chooseImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choisissez une image PNG, JPG ou WebP");
    const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] || ""); reader.onerror = reject; reader.readAsDataURL(file); });
    const url = await onUpload({ filename: file.name, contentType: file.type as MediaUploadPayload["contentType"], data });
    setForm(current => ({ ...current, imageUrl: url }));
  };
  return <div className="admin-content">
    <section className="admin-panel">
      <div className="panel-heading"><div><span className="panel-eyebrow">Accueil · visuels dynamiques</span><h2>{editingId ? "Modifier le slide" : "Ajouter un slide Hero"}</h2></div><span className="admin-readonly">{slides.length} slide{slides.length > 1 ? "s" : ""}</span></div>
      <form className="admin-form-grid" onSubmit={submit}>
        <label>Titre<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="La propreté qui inspire confiance" /></label>
        <label>Accroche<input value={form.eyebrow} onChange={e => setForm({ ...form, eyebrow: e.target.value })} /></label>
        <label className="admin-form-full">Texte<textarea value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} rows={3} placeholder="Présentez votre solution professionnelle…" /></label>
        <label>Image du slide<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => void chooseImage(e.target.files?.[0])} /><small>{form.imageUrl ? "Image importée" : "PNG, JPG ou WebP"}</small></label>
        <label>URL du bouton<input value={form.ctaUrl} onChange={e => setForm({ ...form, ctaUrl: e.target.value })} /></label>
        <label>Libellé du bouton<input value={form.ctaLabel} onChange={e => setForm({ ...form, ctaLabel: e.target.value })} /></label>
        <label>Ordre<input type="number" min={0} value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} /></label>
        <label>Statut<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as HeroSlideInput["status"] })}><option value="published">Publié</option><option value="draft">Brouillon</option></select></label>
        <div className="admin-form-actions"><button className="button button-primary" disabled={saving} type="submit">{editingId ? "Enregistrer les modifications" : "Ajouter le slide"}</button>{editingId && <button type="button" className="button button-secondary" onClick={() => { setEditingId(null); setForm({ ...empty, sortOrder: slides.length + 1 }); }}>Annuler</button>}</div>
      </form>
    </section>
    <section className="admin-panel table-panel"><div className="panel-heading"><div><span className="panel-eyebrow">Ordre de diffusion</span><h2>Slides de la page d’accueil</h2></div></div>{slides.length === 0 ? <EmptyState icon={GalleryHorizontal} text="Aucun slide personnalisé pour le moment." /> : <div className="media-grid">{slides.map(slide => <article className="media-card" key={slide.id}><img src={slide.imageUrl} alt="" /><div className="media-card-body"><strong>{slide.title}</strong><small>{slide.eyebrow} · position {slide.sortOrder}</small><span className={`status-pill ${slide.status === "published" ? "status-live" : "status-draft"}`}>{slide.status === "published" ? "Publié" : "Brouillon"}</span><div className="table-actions"><button className="table-action" onClick={() => { setEditingId(slide.id); setForm({ title: slide.title, subtitle: slide.subtitle, imageUrl: slide.imageUrl, eyebrow: slide.eyebrow, ctaLabel: slide.ctaLabel, ctaUrl: slide.ctaUrl, status: slide.status, sortOrder: slide.sortOrder }); }}>Modifier</button><button className="table-action table-action-danger" onClick={() => window.confirm(`Supprimer « ${slide.title} » ?`) && onDelete(slide.id)}>Supprimer</button></div></div></article>)}</div>}</section>
  </div>;
}

function EmptyState({ icon: Icon, text }: { icon: typeof Mail; text: string }) {
  return (
    <div className="admin-empty">
      <Icon size={25} />
      <strong>{text}</strong>
      <small>
        Les formulaires publics alimenteront automatiquement cette section.
      </small>
    </div>
  );
}
