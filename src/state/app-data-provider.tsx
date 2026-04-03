"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { defaultWorkspace } from "@/lib/mock/workspace-data";
import type {
  CheckType,
  Incident,
  IncidentSeverity,
  IncidentStatus,
  Service,
} from "@/lib/models/monitoring";
import type { Project, Workspace } from "@/lib/models/workspace";
import { createClient } from "@/lib/supabase/client";
import {
  deleteService as deleteServiceRow,
  getSupabaseErrorDetails,
  getOrCreateWorkspaceId,
  loadUserAppData,
  persistIncident,
  persistService,
  persistWorkspaceInfo,
} from "@/lib/supabase/app-data";
import { toSlug } from "@/lib/utils/slug";

type AddServiceInput = {
  name: string;
  url: string;
  checkType: CheckType;
  checkInterval: string;
  description?: string;
};

type UpdateServiceInput = {
  id: string;
  name: string;
  url: string;
  checkType: CheckType;
  checkInterval: string;
  description?: string;
};

type CreateIncidentInput = {
  title: string;
  description?: string;
  source?: "manual" | "monitoring";
  affectedServiceId: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
};

type AppDataState = {
  authUserId: string | null;
  isHydrated: boolean;
  isHydrating: boolean;
  dataError: string | null;
  workspace: Workspace;
  currentProjectId: string;
  onboarding: {
    profileCompleted: boolean;
    statusPageCreated: boolean;
    alertsConfigured: boolean;
  };
  services: Service[];
  incidents: Incident[];
};

type AppDataAction =
  | { type: "HYDRATION_START" }
  | { type: "HYDRATION_FINISH" }
  | {
      type: "SET_HYDRATED_DATA";
      payload: {
        authUserId: string;
        workspace: Workspace;
        currentProjectId: string;
        services: Service[];
        incidents: Incident[];
      };
    }
  | { type: "HYDRATION_NO_USER" }
  | { type: "HYDRATION_FAILED"; payload: { message: string } }
  | { type: "SET_DATA_ERROR"; payload: { message: string | null } }
  | {
      type: "SET_CURRENT_PROJECT";
      payload: { projectId: string };
    }
  | {
      type: "UPDATE_WORKSPACE_INFO";
      payload: { workspaceName?: string; projectName?: string; projectSlug?: string };
    }
  | {
      type: "SET_ONBOARDING_STATE";
      payload: Partial<AppDataState["onboarding"]>;
    }
  | {
      type: "HYDRATE_FROM_AUTH_USER";
      payload: {
        fullName?: string;
        companyName?: string;
        statusPageName?: string;
        statusPageSlug?: string;
        onboardingCompleted?: boolean;
      };
    }
  | { type: "ADD_SERVICE"; payload: Service }
  | { type: "UPDATE_SERVICE"; payload: UpdateServiceInput }
  | { type: "DELETE_SERVICE"; payload: { serviceId: string } }
  | { type: "CREATE_INCIDENT"; payload: CreateIncidentInput }
  | {
      type: "UPDATE_INCIDENT_STATUS";
      payload: { incidentId: string; status: IncidentStatus };
    }
  | {
      type: "RESOLVE_INCIDENT";
      payload: { incidentId: string; resolutionSummary?: string };
    }
  | {
      type: "UPDATE_SERVICE_STATUS";
      payload: {
        serviceId: string;
        status: Service["status"];
        responseTimeMs: number;
        lastChecked: string;
      };
    };

type AppDataContextValue = {
  isHydrated: boolean;
  isHydrating: boolean;
  dataError: string | null;
  workspace: Workspace;
  currentProject: Project | null;
  onboarding: AppDataState["onboarding"];
  services: Service[];
  incidents: Incident[];
  isAddServiceModalOpen: boolean;
  isCreateIncidentModalOpen: boolean;
  setCurrentProject: (projectId: string) => void;
  updateWorkspaceInfo: (payload: {
    workspaceName?: string;
    projectName?: string;
    projectSlug?: string;
  }) => void;
  setOnboardingState: (payload: Partial<AppDataState["onboarding"]>) => void;
  openAddServiceModal: () => void;
  closeAddServiceModal: () => void;
  openCreateIncidentModal: () => void;
  closeCreateIncidentModal: () => void;
  addService: (input: AddServiceInput) => Promise<void>;
  updateService: (input: UpdateServiceInput) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  createIncident: (input: CreateIncidentInput) => void;
  updateIncidentStatus: (incidentId: string, status: IncidentStatus) => void;
  resolveIncident: (incidentId: string, resolutionSummary?: string) => void;
  updateServiceStatus: (
    serviceId: string,
    payload: {
      status: Service["status"];
      responseTimeMs: number;
      lastChecked: string;
    },
  ) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function createServiceId(): string {
  const random = crypto.randomUUID().split("-")[0];
  return `svc_${random}`;
}

function createIncidentId(): string {
  const random = crypto.randomUUID().split("-")[0];
  return `inc_${random}`;
}

function reducer(state: AppDataState, action: AppDataAction): AppDataState {
  if (action.type === "HYDRATION_START") {
    return {
      ...state,
      isHydrating: true,
      dataError: null,
    };
  }

  if (action.type === "HYDRATION_FINISH") {
    return {
      ...state,
      isHydrated: true,
      isHydrating: false,
    };
  }

  if (action.type === "SET_HYDRATED_DATA") {
    return {
      ...state,
      authUserId: action.payload.authUserId,
      isHydrated: true,
      isHydrating: false,
      dataError: null,
      workspace: action.payload.workspace,
      currentProjectId: action.payload.currentProjectId,
      services: action.payload.services,
      incidents: action.payload.incidents,
    };
  }

  if (action.type === "HYDRATION_NO_USER") {
    return {
      ...state,
      authUserId: null,
      isHydrated: true,
      isHydrating: false,
      dataError: null,
      services: [],
      incidents: [],
      workspace: defaultWorkspace,
      currentProjectId: defaultWorkspace.projects[0]?.id ?? "",
    };
  }

  if (action.type === "HYDRATION_FAILED") {
    return {
      ...state,
      authUserId: null,
      isHydrated: true,
      isHydrating: false,
      dataError: action.payload.message,
    };
  }

  if (action.type === "SET_DATA_ERROR") {
    return {
      ...state,
      dataError: action.payload.message,
    };
  }

  if (action.type === "SET_CURRENT_PROJECT") {
    const projectExists = state.workspace.projects.some(
      (project) => project.id === action.payload.projectId,
    );

    if (!projectExists) {
      return state;
    }

    return {
      ...state,
      currentProjectId: action.payload.projectId,
    };
  }

  if (action.type === "UPDATE_WORKSPACE_INFO") {
    const firstProject = state.workspace.projects[0];
    const nextProjectName = action.payload.projectName || firstProject?.name || "";
    const nextProjectSlug =
      action.payload.projectSlug ||
      (nextProjectName ? toSlug(nextProjectName) : firstProject?.slug || "main-status-page");

    return {
      ...state,
      workspace: {
        ...state.workspace,
        name: action.payload.workspaceName || state.workspace.name,
        projects: firstProject
          ? [
              {
                ...firstProject,
                name: nextProjectName || firstProject.name,
                slug: nextProjectSlug,
              },
              ...state.workspace.projects.slice(1),
            ]
          : state.workspace.projects,
      },
    };
  }

  if (action.type === "SET_ONBOARDING_STATE") {
    return {
      ...state,
      onboarding: {
        ...state.onboarding,
        ...action.payload,
      },
    };
  }

  if (action.type === "HYDRATE_FROM_AUTH_USER") {
    const companyWorkspaceName = action.payload.companyName
      ? `${action.payload.companyName} Workspace`
      : state.workspace.name;
    const firstProject = state.workspace.projects[0];
    const nextProjectName = action.payload.statusPageName || firstProject?.name;
    const nextProjectSlug =
      action.payload.statusPageSlug ||
      (nextProjectName ? toSlug(nextProjectName) : firstProject?.slug || "main-status-page");
    const nextOnboardingState =
      action.payload.onboardingCompleted === true
        ? {
            profileCompleted: true,
            statusPageCreated: true,
            alertsConfigured: state.onboarding.alertsConfigured,
          }
        : {
            profileCompleted: Boolean(action.payload.fullName || action.payload.companyName),
            statusPageCreated: Boolean(action.payload.statusPageName),
            alertsConfigured: state.onboarding.alertsConfigured,
          };

    return {
      ...state,
      workspace: {
        ...state.workspace,
        name: companyWorkspaceName,
        projects: firstProject
          ? [
              {
                ...firstProject,
                name: nextProjectName || firstProject.name,
                slug: nextProjectSlug,
              },
              ...state.workspace.projects.slice(1),
            ]
          : state.workspace.projects,
      },
      onboarding: nextOnboardingState,
    };
  }

  if (action.type === "ADD_SERVICE") {
    return {
      ...state,
      services: [action.payload, ...state.services],
    };
  }

  if (action.type === "UPDATE_SERVICE") {
    return {
      ...state,
      services: state.services.map((service) => {
        if (service.id !== action.payload.id) {
          return service;
        }

        return {
          ...service,
          name: action.payload.name,
          url: action.payload.url,
          checkType: action.payload.checkType,
          checkInterval: action.payload.checkInterval,
          description: action.payload.description,
        };
      }),
    };
  }

  if (action.type === "DELETE_SERVICE") {
    return {
      ...state,
      services: state.services.filter((service) => service.id !== action.payload.serviceId),
    };
  }

  if (action.type === "UPDATE_SERVICE_STATUS") {
    return {
      ...state,
      services: state.services.map((service) => {
        if (service.id !== action.payload.serviceId) {
          return service;
        }

        return {
          ...service,
          status: action.payload.status,
          responseTimeMs: action.payload.responseTimeMs,
          lastChecked: action.payload.lastChecked,
        };
      }),
    };
  }

  if (action.type === "CREATE_INCIDENT") {
    const now = new Date().toISOString();
    const incident: Incident = {
      id: createIncidentId(),
      title: action.payload.title,
      description: action.payload.description || undefined,
      source: action.payload.source ?? "manual",
      affectedServiceId: action.payload.affectedServiceId,
      severity: action.payload.severity,
      status: action.payload.status,
      startedAt: now,
      updatedAt: now,
    };

    return {
      ...state,
      incidents: [incident, ...state.incidents],
    };
  }

  if (action.type === "UPDATE_INCIDENT_STATUS") {
    const now = new Date().toISOString();
    return {
      ...state,
      incidents: state.incidents.map((incident) => {
        if (incident.id !== action.payload.incidentId) {
          return incident;
        }

        return {
          ...incident,
          status: action.payload.status,
          updatedAt: now,
          resolvedAt:
            action.payload.status === "resolved" ? now : incident.resolvedAt,
          resolutionSummary:
            action.payload.status === "resolved"
              ? incident.resolutionSummary ?? "Incident resolved by operations team."
              : incident.resolutionSummary,
        };
      }),
    };
  }

  if (action.type === "RESOLVE_INCIDENT") {
    const now = new Date().toISOString();
    return {
      ...state,
      incidents: state.incidents.map((incident) => {
        if (incident.id !== action.payload.incidentId) {
          return incident;
        }

        return {
          ...incident,
          status: "resolved",
          updatedAt: now,
          resolvedAt: now,
          resolutionSummary:
            action.payload.resolutionSummary ||
            incident.resolutionSummary ||
            "Incident resolved by operations team.",
        };
      }),
    };
  }

  return state;
}

const initialState: AppDataState = {
  authUserId: null,
  isHydrated: false,
  isHydrating: false,
  dataError: null,
  workspace: defaultWorkspace,
  currentProjectId: defaultWorkspace.projects[0]?.id ?? "",
  onboarding: {
    profileCompleted: false,
    statusPageCreated: false,
    alertsConfigured: false,
  },
  services: [],
  incidents: [],
};

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isCreateIncidentModalOpen, setIsCreateIncidentModalOpen] =
    useState(false);
  const supabase = useMemo(() => createClient(), []);
  const browserMonitoringFallbackEnabled =
    process.env.NEXT_PUBLIC_ENABLE_BROWSER_MONITORING === "true" &&
    process.env.NODE_ENV !== "production";

  const setCurrentProject = useCallback(
    (projectId: string) =>
      dispatch({ type: "SET_CURRENT_PROJECT", payload: { projectId } }),
    [],
  );

  const updateWorkspaceInfo = useCallback(
    (payload: { workspaceName?: string; projectName?: string; projectSlug?: string }) =>
      dispatch({ type: "UPDATE_WORKSPACE_INFO", payload }),
    [],
  );

  const setOnboardingState = useCallback(
    (payload: Partial<AppDataState["onboarding"]>) =>
      dispatch({ type: "SET_ONBOARDING_STATE", payload }),
    [],
  );

  const reloadFromSupabase = useCallback(
    async (userId: string) => {
      if (!supabase) {
        return;
      }

      try {
        const appData = await loadUserAppData(supabase, userId);
        dispatch({
          type: "SET_HYDRATED_DATA",
          payload: {
            authUserId: userId,
            workspace: appData.workspace,
            currentProjectId: appData.currentProjectId,
            services: appData.services,
            incidents: appData.incidents,
          },
        });
        console.log("[app-data] reloaded persisted state from Supabase", {
          services: appData.services.length,
          incidents: appData.incidents.length,
        });
      } catch (error) {
        console.error("[app-data] reload from Supabase failed", error);
      }
    },
    [supabase],
  );

  const addService = useCallback(
    async (input: AddServiceInput) => {
      console.log("[AddService] submit start", {
        input,
      });
      const now = new Date().toISOString();
      const service: Service = {
        id: createServiceId(),
        name: input.name.trim(),
        url: input.url.trim(),
        checkType: input.checkType,
        checkInterval: input.checkInterval.trim(),
        description: input.description?.trim() || undefined,
        status: "pending",
        responseTimeMs: 0,
        lastChecked: "",
        createdAt: now,
      };

      if (!supabase || !state.authUserId) {
        throw new Error("Supabase is not ready yet. Please try again.");
      }

      const userId = state.authUserId;
      console.log("[AddService] current user", { userId });
      let workspaceId = state.workspace.id;

      try {
        workspaceId = await getOrCreateWorkspaceId(supabase, userId);
        console.log("[AddService] current workspace", { workspaceId });

        const insertPayload = {
          id: service.id,
          user_id: userId,
          workspace_id: workspaceId,
          name: service.name,
          url: service.url,
          status: service.status,
          check_type: service.checkType,
          check_interval: service.checkInterval,
          last_checked: service.lastChecked,
          response_time_ms: service.responseTimeMs,
          description: service.description || null,
          created_at: service.createdAt,
        };
        console.log("[AddService] insert payload", insertPayload);

        await persistService(supabase, userId, workspaceId, service);
        console.log("[AddService] insert success", {
          serviceId: service.id,
          workspaceId,
        });

        dispatch({
          type: "ADD_SERVICE",
          payload: service,
        });
      } catch (error) {
        const details = getSupabaseErrorDetails(error);
        console.error("[AddService] insert failure", {
          message: details.message,
          code: details.code,
          details: details.details,
          hint: details.hint,
          stack: details.stack,
        });
        throw new Error(
          [
            details.message,
            details.code ? `(code: ${details.code})` : "",
            details.details ? `Details: ${details.details}` : "",
            details.hint ? `Hint: ${details.hint}` : "",
          ]
            .filter(Boolean)
            .join(" "),
        );
      }
    },
    [state.authUserId, state.workspace.id, supabase],
  );

  const updateService = useCallback(
    async (input: UpdateServiceInput) => {
      if (!supabase || !state.authUserId || !state.workspace.id) {
        throw new Error("Supabase is not ready yet. Please try again.");
      }

      const existing = state.services.find((service) => service.id === input.id);
      if (!existing) {
        throw new Error("Service not found.");
      }

      const updatedService: Service = {
        ...existing,
        name: input.name.trim(),
        url: input.url.trim(),
        checkType: input.checkType,
        checkInterval: input.checkInterval.trim(),
        description: input.description?.trim() || undefined,
      };

      await persistService(
        supabase,
        state.authUserId,
        state.workspace.id,
        updatedService,
      );
      console.log("[AppData] service persisted (update)", {
        serviceId: updatedService.id,
        status: updatedService.status,
      });

      dispatch({
        type: "UPDATE_SERVICE",
        payload: {
          id: updatedService.id,
          name: updatedService.name,
          url: updatedService.url,
          checkType: updatedService.checkType,
          checkInterval: updatedService.checkInterval,
          description: updatedService.description,
        },
      });
    },
    [state.authUserId, state.services, state.workspace.id, supabase],
  );

  const deleteService = useCallback(
    async (serviceId: string) => {
      if (!supabase || !state.authUserId) {
        throw new Error("Supabase is not ready yet. Please try again.");
      }

      console.log("[AppData] delete started", { serviceId });
      try {
        await deleteServiceRow(supabase, state.authUserId, serviceId);
        dispatch({ type: "DELETE_SERVICE", payload: { serviceId } });
        console.log("[AppData] delete success", { serviceId });
      } catch (error) {
        console.error("[AppData] delete failure", { serviceId, error });
        throw error;
      }
    },
    [state.authUserId, supabase],
  );

  const createIncident = useCallback(
    (input: CreateIncidentInput) =>
      dispatch({ type: "CREATE_INCIDENT", payload: input }),
    [],
  );

  const updateIncidentStatus = useCallback(
    (incidentId: string, status: IncidentStatus) =>
      dispatch({
        type: "UPDATE_INCIDENT_STATUS",
        payload: { incidentId, status },
      }),
    [],
  );

  const resolveIncident = useCallback(
    (incidentId: string, resolutionSummary?: string) =>
      dispatch({
        type: "RESOLVE_INCIDENT",
        payload: { incidentId, resolutionSummary },
      }),
    [],
  );

  const updateServiceStatus = useCallback(
    (
      serviceId: string,
      payload: {
        status: Service["status"];
        responseTimeMs: number;
        lastChecked: string;
      },
    ) =>
      dispatch({
        type: "UPDATE_SERVICE_STATUS",
        payload: { serviceId, ...payload },
      }),
    [],
  );


  useEffect(() => {
    const hydrateForUser = async () => {
      dispatch({ type: "HYDRATION_START" });
      console.log("HYDRATION START");
      try {
        if (!supabase) {
          dispatch({
            type: "SET_DATA_ERROR",
            payload: {
              message:
                "Supabase is not configured. Please set environment variables and refresh.",
            },
          });
          return;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          const details = getSupabaseErrorDetails(sessionError);
          throw new Error(
            [
              details.message,
              details.code ? `code=${details.code}` : "",
              details.details ? `details=${details.details}` : "",
              details.hint ? `hint=${details.hint}` : "",
            ]
              .filter(Boolean)
              .join(" "),
          );
        }

        const user = session?.user;
        console.log("USER:", user?.id ?? null);

        if (!user) {
          dispatch({ type: "HYDRATION_NO_USER" });
          return;
        }

        const appData = await loadUserAppData(supabase, user.id);
        console.info("[AppData] workspace loaded", {
          workspaceId: appData.workspace.id,
          workspaceName: appData.workspace.name,
        });
        console.log("SERVICES LOADED:", appData.services.length);
        console.log("INCIDENTS LOADED:", appData.incidents.length);
        for (const service of appData.services) {
          console.log("[AppData] row reloaded from Supabase", {
            type: "service",
            id: service.id,
            status: service.status,
            responseTimeMs: service.responseTimeMs,
            lastChecked: service.lastChecked,
          });
        }
        for (const incident of appData.incidents) {
          console.log("[AppData] row reloaded from Supabase", {
            type: "incident",
            id: incident.id,
            status: incident.status,
          });
        }

        dispatch({
          type: "SET_HYDRATED_DATA",
          payload: {
            authUserId: user.id,
            workspace: appData.workspace,
            currentProjectId: appData.currentProjectId,
            services: appData.services,
            incidents: appData.incidents,
          },
        });

        dispatch({
          type: "HYDRATE_FROM_AUTH_USER",
          payload: {
            fullName:
              typeof user.user_metadata?.full_name === "string"
                ? user.user_metadata.full_name
                : undefined,
            companyName:
              typeof user.user_metadata?.company_name === "string"
                ? user.user_metadata.company_name
                : undefined,
            statusPageName:
              typeof user.user_metadata?.status_page_name === "string"
                ? user.user_metadata.status_page_name
                : undefined,
            statusPageSlug:
              typeof user.user_metadata?.status_page_slug === "string"
                ? user.user_metadata.status_page_slug
                : undefined,
            onboardingCompleted: Boolean(user.user_metadata?.onboarding_completed),
          },
        });
        console.info("[AppData] hydration success");
      } catch (error) {
        const details = getSupabaseErrorDetails(error);
        console.error("HYDRATION ERROR:", JSON.stringify(details, null, 2));
        const uiError = [
          `Could not load your workspace data.`,
          details.message,
          details.hint ? `Hint: ${details.hint}` : "",
        ]
          .filter(Boolean)
          .join(" ");
        dispatch({ type: "SET_DATA_ERROR", payload: { message: uiError } });
        console.error("[AppData] hydration failure");
      } finally {
        dispatch({ type: "HYDRATION_FINISH" });
        console.log("HYDRATION END");
      }
    };

    void hydrateForUser();
    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void hydrateForUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (
      !supabase ||
      !state.authUserId ||
      !state.workspace.id ||
      !state.isHydrated ||
      state.dataError
    ) {
      return;
    }

    const userId = state.authUserId;
    if (!userId) {
      return;
    }

    const syncWorkspace = async () => {
      try {
        await persistWorkspaceInfo(supabase, userId, {
          workspaceName: state.workspace.name,
          projectName: state.workspace.projects[0]?.name,
          projectSlug: state.workspace.projects[0]?.slug,
        });
        console.log("[AppData] workspace persisted", {
          workspaceId: state.workspace.id,
          workspaceName: state.workspace.name,
        });
      } catch (error) {
        console.error("[AppData] workspace persist failed", error);
      }
    };

    void syncWorkspace();
  }, [
    supabase,
    state.authUserId,
    state.workspace,
    state.isHydrated,
    state.dataError,
  ]);

  useEffect(() => {
    if (
      !supabase ||
      !state.authUserId ||
      !state.workspace.id ||
      !state.isHydrated ||
      state.dataError
    ) {
      return;
    }

    const userId = state.authUserId;
    const workspaceId = state.workspace.id;
    if (!userId || !workspaceId) {
      return;
    }

    const syncServices = async () => {
      for (const service of state.services) {
        try {
          await persistService(supabase, userId, workspaceId, service);
          console.log("[AppData] service status persisted", {
            serviceId: service.id,
            status: service.status,
            responseTimeMs: service.responseTimeMs,
            lastChecked: service.lastChecked,
          });
        } catch (error) {
          console.error("[AppData] service persist failed", {
            serviceId: service.id,
            error,
          });
        }
      }
    };

    void syncServices();
  }, [
    supabase,
    state.authUserId,
    state.workspace.id,
    state.services,
    state.isHydrated,
    state.dataError,
  ]);

  useEffect(() => {
    if (
      !supabase ||
      !state.authUserId ||
      !state.workspace.id ||
      !state.isHydrated ||
      state.dataError
    ) {
      return;
    }

    const userId = state.authUserId;
    const workspaceId = state.workspace.id;
    if (!userId || !workspaceId) {
      return;
    }

    const syncIncidents = async () => {
      for (const incident of state.incidents) {
        try {
          await persistIncident(supabase, userId, workspaceId, incident);
        } catch (error) {
          console.error("[AppData] incident persist failed", {
            incidentId: incident.id,
            error,
          });
        }
      }
    };

    void syncIncidents();
  }, [
    supabase,
    state.authUserId,
    state.workspace.id,
    state.incidents,
    state.isHydrated,
    state.dataError,
  ]);

  useEffect(() => {
    console.log("[monitoring] mode", {
      source: browserMonitoringFallbackEnabled ? "browser-dev-fallback" : "server-only",
      nodeEnv: process.env.NODE_ENV,
    });
  }, [browserMonitoringFallbackEnabled]);

  useEffect(() => {
    if (!supabase || !state.isHydrated || !state.authUserId || state.dataError) {
      return;
    }

    const userId = state.authUserId;
    let cancelled = false;

    const runCycle = async () => {
      await reloadFromSupabase(userId);
      if (cancelled) {
        return;
      }
    };

    void runCycle();
    const intervalId = setInterval(() => {
      void runCycle();
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [
    reloadFromSupabase,
    supabase,
    state.authUserId,
    state.dataError,
    state.isHydrated,
  ]);

  useEffect(() => {
    if (
      !browserMonitoringFallbackEnabled ||
      !supabase ||
      !state.isHydrated ||
      !state.authUserId ||
      state.dataError
    ) {
      return;
    }

    const userId = state.authUserId;
    console.log("[monitoring] dev fallback enabled: triggering /api/monitor from browser");
    let cancelled = false;

    const runDevFallbackCycle = async () => {
      try {
        const response = await fetch("/api/monitor", {
          method: "GET",
          cache: "no-store",
          headers: { "x-monitor-source": "browser-dev-fallback" },
        });
        const body = await response.json();
        if (!response.ok || !body?.success) {
          throw new Error(body?.message || "Monitoring API call failed.");
        }

        if (cancelled) {
          return;
        }

        await reloadFromSupabase(userId);
      } catch (error) {
        console.error("[monitoring] browser dev fallback cycle failed", error);
      }
    };

    void runDevFallbackCycle();
    const intervalId = setInterval(() => {
      void runDevFallbackCycle();
    }, 60_000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [
    browserMonitoringFallbackEnabled,
    reloadFromSupabase,
    supabase,
    state.authUserId,
    state.dataError,
    state.isHydrated,
  ]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      isHydrated: state.isHydrated,
      isHydrating: state.isHydrating,
      dataError: state.dataError,
      workspace: state.workspace,
      currentProject:
        state.workspace.projects.find(
          (project) => project.id === state.currentProjectId,
        ) ?? state.workspace.projects[0] ?? null,
      onboarding: state.onboarding,
      services: state.services,
      incidents: state.incidents,
      isAddServiceModalOpen,
      isCreateIncidentModalOpen,
      setCurrentProject,
      updateWorkspaceInfo,
      setOnboardingState,
      openAddServiceModal: () => setIsAddServiceModalOpen(true),
      closeAddServiceModal: () => setIsAddServiceModalOpen(false),
      openCreateIncidentModal: () => setIsCreateIncidentModalOpen(true),
      closeCreateIncidentModal: () => setIsCreateIncidentModalOpen(false),
      addService,
      updateService,
      deleteService,
      createIncident,
      updateIncidentStatus,
      resolveIncident,
      updateServiceStatus,
    }),
    [
      setCurrentProject,
      updateWorkspaceInfo,
      setOnboardingState,
      addService,
      updateService,
      deleteService,
      createIncident,
      updateIncidentStatus,
      resolveIncident,
      updateServiceStatus,
      state.services,
      state.incidents,
      state.isHydrated,
      state.isHydrating,
      state.dataError,
      state.workspace,
      state.currentProjectId,
      state.onboarding,
      isAddServiceModalOpen,
      isCreateIncidentModalOpen,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }

  return context;
}
