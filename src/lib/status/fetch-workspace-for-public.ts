import { logApi } from "@/lib/logging/server-log";
import { toSlug } from "@/lib/utils/slug";

/** Columns that exist on all production schemas; avoid new columns that require pending migrations. */
const WORKSPACE_PUBLIC_COLUMNS =
  "id,name,project_name,public_description,support_email,brand_color,operational_color,brand_logo_url,brand_favicon_url,status_page_published,status_page_style";

type SupabaseResponse<T> = { data: T | null; error: { message?: string; code?: string } | null };

/**
 * Resolves a workspace for `/status/[slug]`.
 * - Tries exact slug, normalized slug, lowercase, and case-insensitive match.
 * - Does not require `status_page_extra_theme` on the main row (optional follow-up when present).
 */
/**
 * @param admin - Supabase client with service role (e.g. createAdminClient()).
 */
export async function fetchWorkspaceForPublicStatusPage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  resolvedProjectSlug: string,
): Promise<{ row: Record<string, unknown> | null; error: { message?: string; code?: string } | null }> {
  const trySelect = (slug: string) =>
    admin
      .from("workspaces")
      .select(WORKSPACE_PUBLIC_COLUMNS)
      .eq("project_slug", slug)
      .maybeSingle() as Promise<SupabaseResponse<Record<string, unknown>>>;

  const candidates = Array.from(
    new Set(
      [resolvedProjectSlug, resolvedProjectSlug.toLowerCase(), toSlug(resolvedProjectSlug)].filter(
        (s) => s.length > 0,
      ),
    ),
  );

  for (const slug of candidates) {
    const res = await trySelect(slug);
    if (res.error) {
      logApi.warn("public status workspace lookup failed", { slug, error: res.error });
      return { row: null, error: res.error };
    }
    if (res.data) {
      const extra = await tryLoadExtraTheme(admin, String(res.data.id));
      return { row: { ...res.data, ...extra }, error: null };
    }
  }

  const res = (await admin
    .from("workspaces")
    .select(WORKSPACE_PUBLIC_COLUMNS)
    .ilike("project_slug", resolvedProjectSlug)
    .maybeSingle()) as SupabaseResponse<Record<string, unknown>>;

  if (res.error) {
    logApi.warn("public status workspace ilike failed", { resolvedProjectSlug, error: res.error });
    return { row: null, error: res.error };
  }
  if (res.data) {
    const extra = await tryLoadExtraTheme(admin, String(res.data.id));
    return { row: { ...res.data, ...extra }, error: null };
  }

  return { row: null, error: null };
}

/** Load optional json column when migration is applied; any error → no theme. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function tryLoadExtraTheme(admin: any, workspaceId: string): Promise<{ status_page_extra_theme?: unknown }> {
  const res = (await admin
    .from("workspaces")
    .select("status_page_extra_theme")
    .eq("id", workspaceId)
    .maybeSingle()) as SupabaseResponse<Record<string, unknown>>;

  if (res.error) {
    return {};
  }
  if (res.data && "status_page_extra_theme" in res.data) {
    return { status_page_extra_theme: res.data.status_page_extra_theme };
  }
  return {};
}
