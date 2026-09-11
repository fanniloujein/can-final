import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { adminInvites, contactMessages, InsertAdminInvite, InsertContactMessage, InsertQuoteRequest, quoteRequests, InsertUser, users, siteSettings, InsertSiteSetting, managedProducts, InsertManagedProduct, heroSlides, InsertHeroSlide } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = values[field]; } }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  const matchingInvite = user.email ? (await db.select().from(adminInvites).where(eq(adminInvites.email, user.email)).limit(1))[0] : undefined;
  if (matchingInvite?.status === "pending") { values.role = matchingInvite.role; updateSet.role = matchingInvite.role; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  if (matchingInvite) await db.update(adminInvites).set({ status: "accepted" }).where(eq(adminInvites.id, matchingInvite.id));
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn, createdAt: users.createdAt }).from(users).orderBy(desc(users.lastSignedIn));
}

export async function updateUserRole(id: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(users).set({ role }).where(eq(users.id, id));
  return { success: true };
}

export async function listAdminInvites() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminInvites).orderBy(desc(adminInvites.createdAt));
}

export async function createAdminInvite(input: InsertAdminInvite) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(adminInvites).values(input).onDuplicateKeyUpdate({ set: { name: input.name || null, role: input.role, status: "pending" } });
  return { success: true };
}

export async function revokeAdminInvite(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(adminInvites).set({ status: "revoked" }).where(eq(adminInvites.id, id));
  return { success: true };
}

export async function createContactMessage(input: InsertContactMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(contactMessages).values(input);
  return { id: result[0].insertId };
}

export async function createQuoteRequest(input: InsertQuoteRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(quoteRequests).values(input);
  return { id: result[0].insertId };
}

export async function listContactMessages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
}

export async function listQuoteRequests() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt));
}

export async function updateContactMessageStatus(id: number, status: "new" | "read" | "treated" | "archived") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
  return { success: true };
}

export async function updateQuoteRequestStatus(id: number, status: "new" | "in_progress" | "contacted" | "quote_sent" | "won" | "lost" | "archived") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(quoteRequests).set({ status }).where(eq(quoteRequests.id, id));
  return { success: true };
}

export async function listSiteSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteSettings).orderBy(siteSettings.settingKey);
}

export async function saveSiteSetting(input: InsertSiteSetting) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(siteSettings).values(input).onDuplicateKeyUpdate({ set: { value: input.value } });
  return { success: true };
}

export async function listManagedProducts(includeArchived = true) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(managedProducts).orderBy(managedProducts.sortOrder, managedProducts.name);
  return includeArchived ? rows : rows.filter((product) => product.status === "published");
}

export async function getManagedProduct(slug: string, includeArchived = false) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(managedProducts).where(eq(managedProducts.slug, slug)).limit(1);
  const product = result[0];
  if (!product || (!includeArchived && product.status !== "published")) return undefined;
  return product;
}

export async function createManagedProduct(input: InsertManagedProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(managedProducts).values(input);
  return { success: true };
}

export async function updateManagedProduct(id: number, input: Partial<InsertManagedProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(managedProducts).set({ ...input, updatedAt: new Date() }).where(eq(managedProducts.id, id));
  return { success: true };
}

export async function deleteManagedProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(managedProducts).where(eq(managedProducts.id, id));
  return { success: true };
}

export async function listHeroSlides(includeDraft = false) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(heroSlides).orderBy(heroSlides.sortOrder, heroSlides.id);
  return includeDraft ? rows : rows.filter((slide) => slide.status === "published");
}

export async function createHeroSlide(input: InsertHeroSlide) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(heroSlides).values(input);
  return { success: true };
}

export async function updateHeroSlide(id: number, input: Partial<InsertHeroSlide>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(heroSlides).set({ ...input, updatedAt: new Date() }).where(eq(heroSlides.id, id));
  return { success: true };
}

export async function deleteHeroSlide(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(heroSlides).where(eq(heroSlides.id, id));
  return { success: true };
}
