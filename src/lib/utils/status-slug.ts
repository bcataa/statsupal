import type { Project, Workspace } from "@/lib/models/workspace";

/** Stable slug for URLs; avoids empty `/status/` links when project data is still loading. */
export function resolveWorkspaceStatusSlug(
  workspace: Workspace,
  currentProject: Project | null | undefined,
): string {
  const candidates = [
    currentProject?.slug,
    workspace.projects[0]?.slug,
    workspace.domainSettings.statusPageSlug,
  ].map((s) => (typeof s === "string" ? s.trim() : ""));
  const found = candidates.find((s) => s.length > 0);
  return found ?? "main-status-page";
}

export function loggedInStatusPageHref(
  workspace: Workspace,
  currentProject: Project | null | undefined,
): string {
  const slug = resolveWorkspaceStatusSlug(workspace, currentProject);
  return `/dashboard/status/${encodeURIComponent(slug)}`;
}
