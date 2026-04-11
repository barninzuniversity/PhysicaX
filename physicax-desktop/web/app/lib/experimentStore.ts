export type ExperimentRun = {
  id: string;
  title: string;
  model: string;
  inputs: Record<string, number>;
  outputs: Record<string, number>;
  timestamp?: string;
  createdAt?: string;
  notes?: string;
  tags?: string[] | string;
  visibility?: "private" | "public";
  version?: number;
  parentId?: string | null;
  collectionId?: string | null;
  folderId?: string | null;
  forkedFromId?: string | null;
  authorId?: string | null;
  authorName?: string | null;
  likesCount?: number;
  commentsCount?: number;
  featured?: boolean;
  trendingScore?: number;
};

const RUNS_KEY = "physicax-experiments";
const GALLERY_KEY = "physicax-gallery";

const safeParse = (raw: string | null) => {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const readRuns = (): ExperimentRun[] => {
  if (typeof window === "undefined") {
    return [];
  }
  return safeParse(localStorage.getItem(RUNS_KEY)) as ExperimentRun[];
};

export const writeRuns = (runs: ExperimentRun[]) => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
};

export const readGallery = (): ExperimentRun[] => {
  if (typeof window === "undefined") {
    return [];
  }
  return safeParse(localStorage.getItem(GALLERY_KEY)) as ExperimentRun[];
};

export const writeGallery = (runs: ExperimentRun[]) => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(GALLERY_KEY, JSON.stringify(runs));
};

export const publishRun = (run: ExperimentRun) => {
  const gallery = readGallery();
  const next = [run, ...gallery].slice(0, 40);
  writeGallery(next);
  return next;
};

export const exportRunAsJson = (run: ExperimentRun) => {
  if (typeof window === "undefined") {
    return;
  }
  const blob = new Blob([JSON.stringify(run, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${run.model}-${run.id}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
