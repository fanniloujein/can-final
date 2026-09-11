import { z } from "zod";
import { COOKIE_NAME, NOT_ADMIN_ERR_MSG } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { createAdminInvite, createContactMessage, createHeroSlide, createManagedProduct, createQuoteRequest, deleteHeroSlide, deleteManagedProduct, getManagedProduct, listAdminInvites, listContactMessages, listHeroSlides, listManagedProducts, listQuoteRequests, listSiteSettings, listUsers, revokeAdminInvite, saveSiteSetting, updateContactMessageStatus, updateHeroSlide, updateManagedProduct, updateQuoteRequestStatus, updateUserRole } from "./db";
import { storagePut } from "./storage";

const contactInput = z.object({ name: z.string().trim().min(2).max(160), email: z.string().trim().email().max(320), phone: z.string().trim().max(50).optional(), company: z.string().trim().max(180).optional(), subject: z.string().trim().max(180).optional(), message: z.string().trim().min(5).max(5000) });
const quoteInput = z.object({ name: z.string().trim().min(2).max(160), company: z.string().trim().min(2).max(180), email: z.string().trim().email().max(320), phone: z.string().trim().min(5).max(50), city: z.string().trim().max(120).optional(), quantity: z.string().trim().max(120).optional(), products: z.array(z.string().trim().min(1)).min(1).max(50), message: z.string().trim().max(5000).optional() });
const productFields = z.object({ slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), name: z.string().trim().min(2).max(160), reference: z.string().trim().min(1).max(80), category: z.string().trim().min(2).max(160), description: z.string().trim().min(5).max(10000), imageUrl: z.string().trim().min(1).max(2000), sourceUrl: z.string().trim().url().max(2000).optional(), status: z.enum(["draft", "published", "archived"]), sortOrder: z.number().int().min(0).max(100000) });
const messageStatus = z.enum(["new", "read", "treated", "archived"]);
const quoteStatus = z.enum(["new", "in_progress", "contacted", "quote_sent", "won", "lost", "archived"]);
const collectionKey = z.enum(["admin_categories", "admin_services", "admin_pages", "admin_media", "admin_invites"]);
const heroSlideFields = z.object({ title: z.string().trim().min(2).max(180), subtitle: z.string().trim().min(5).max(5000), imageUrl: z.string().trim().min(1).max(2000), eyebrow: z.string().trim().min(2).max(160), ctaLabel: z.string().trim().min(1).max(120), ctaUrl: z.string().trim().min(1).max(500), status: z.enum(["draft", "published"]), sortOrder: z.number().int().min(0).max(100000) });
const serializeProduct = (product: Awaited<ReturnType<typeof listManagedProducts>>[number]) => ({ name: product.name, slug: product.slug, reference: product.reference, category: product.category, description: product.description, image: product.imageUrl, sourceUrl: product.sourceUrl || "", status: product.status, sortOrder: product.sortOrder });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  contact: router({ submit: publicProcedure.input(contactInput).mutation(async ({ input }) => { const result = await createContactMessage({ ...input, phone: input.phone || null, company: input.company || null, subject: input.subject || null }); return { success: true, id: result.id }; }) }),
  quote: router({ submit: publicProcedure.input(quoteInput).mutation(async ({ input }) => { const result = await createQuoteRequest({ ...input, products: JSON.stringify(input.products), city: input.city || null, quantity: input.quantity || null, message: input.message || null }); return { success: true, id: result.id }; }) }),
  content: router({
    settings: publicProcedure.query(async () => Object.fromEntries((await listSiteSettings()).map((item) => [item.settingKey, item.value]))),
    products: publicProcedure.query(async () => (await listManagedProducts(false)).map(serializeProduct)),
    heroSlides: publicProcedure.query(() => listHeroSlides(false)),
    product: publicProcedure.input(z.object({ slug: z.string().min(2).max(160) })).query(async ({ input }) => { const product = await getManagedProduct(input.slug); return product ? serializeProduct(product) : null; }),
  }),
  admin: router({
    summary: adminProcedure.query(async () => { const [messages, quotes, settings, products, users, invites, heroSlides] = await Promise.all([listContactMessages(), listQuoteRequests(), listSiteSettings(), listManagedProducts(true), listUsers(), listAdminInvites(), listHeroSlides(true)]); return { messages, quotes, settings, products, users, invites, heroSlides }; }),
    createHeroSlide: adminProcedure.input(heroSlideFields).mutation(({ input }) => createHeroSlide(input)),
    updateHeroSlide: adminProcedure.input(heroSlideFields.extend({ id: z.number().int().positive() })).mutation(({ input }) => { const { id, ...values } = input; return updateHeroSlide(id, values); }),
    deleteHeroSlide: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteHeroSlide(input.id)),
    createProduct: adminProcedure.input(productFields).mutation(async ({ input }) => createManagedProduct({ ...input, sourceUrl: input.sourceUrl || null })),
    updateProduct: adminProcedure.input(productFields.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => { const { id, ...values } = input; return updateManagedProduct(id, { ...values, sourceUrl: values.sourceUrl || null }); }),
    uploadProductImage: adminProcedure.input(z.object({ filename: z.string().trim().min(1).max(160), contentType: z.enum(["image/png", "image/jpeg", "image/webp"]), data: z.string().min(20).max(8000000) })).mutation(async ({ input, ctx }) => { const safeName = input.filename.toLowerCase().replace(/[^a-z0-9._-]+/g, "-"); const buffer = Buffer.from(input.data, "base64"); const uploaded = await storagePut(`products/${ctx.user.id}-${safeName}`, buffer, input.contentType); return { url: uploaded.url, key: uploaded.key }; }),
    uploadMedia: adminProcedure.input(z.object({ filename: z.string().trim().min(1).max(160), contentType: z.enum(["video/mp4", "video/webm", "image/png", "image/jpeg", "image/webp"]), data: z.string().min(20).max(40000000) })).mutation(async ({ input, ctx }) => { const safeName = input.filename.toLowerCase().replace(/[^a-z0-9._-]+/g, "-"); const uploaded = await storagePut(`media/${ctx.user.id}-${safeName}`, Buffer.from(input.data, "base64"), input.contentType); return { url: uploaded.url, key: uploaded.key }; }),
    deleteProduct: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteManagedProduct(input.id)),
    updateMessageStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: messageStatus })).mutation(({ input }) => updateContactMessageStatus(input.id, input.status)),
    updateQuoteStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: quoteStatus })).mutation(({ input }) => updateQuoteRequestStatus(input.id, input.status)),
    saveSetting: adminProcedure.input(z.object({ settingKey: z.string().trim().min(2).max(100), value: z.string().max(10000) })).mutation(({ input }) => saveSiteSetting(input)),
    saveCollection: adminProcedure.input(z.object({ settingKey: collectionKey, value: z.string().max(50000) })).mutation(({ input }) => saveSiteSetting(input)),
    createInvite: adminProcedure.input(z.object({ email: z.string().trim().email().max(320), name: z.string().trim().max(160).optional(), role: z.enum(["user", "admin"]) })).mutation(({ input }) => createAdminInvite({ ...input, name: input.name || null })),
    revokeInvite: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => revokeAdminInvite(input.id)),
    updateUserRole: adminProcedure.input(z.object({ id: z.number().int().positive(), role: z.enum(["user", "admin"]) })).mutation(({ ctx, input }) => { if (input.id === ctx.user.id && input.role === "user") throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG }); return updateUserRole(input.id, input.role); }),
  }),
});

export type AppRouter = typeof appRouter;
