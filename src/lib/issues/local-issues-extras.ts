const NS = "statsupal.issues.";

export type IssueTemplate = {
  id: string;
  title: string;
  body: string;
  kind: "incident" | "maintenance";
  createdAt: string;
  updatedAt: string;
};

export type OnCallSlot = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  contact: string;
  createdAt: string;
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadTemplates(workspaceId: string): IssueTemplate[] {
  if (typeof localStorage === "undefined") {
    return [];
  }
  return safeParse(
    localStorage.getItem(`${NS}templates.${workspaceId}`),
    [] as IssueTemplate[],
  );
}

export function saveTemplates(workspaceId: string, items: IssueTemplate[]) {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(`${NS}templates.${workspaceId}`, JSON.stringify(items));
}

export function loadOnCall(workspaceId: string): OnCallSlot[] {
  if (typeof localStorage === "undefined") {
    return [];
  }
  return safeParse(
    localStorage.getItem(`${NS}oncall.${workspaceId}`),
    [] as OnCallSlot[],
  );
}

export function saveOnCall(workspaceId: string, items: OnCallSlot[]) {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(`${NS}oncall.${workspaceId}`, JSON.stringify(items));
}
