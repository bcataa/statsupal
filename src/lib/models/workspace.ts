export type Project = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type Workspace = {
  id: string;
  name: string;
  projects: Project[];
};
