import { NewClientPageClient } from "./NewClientPageClient";

type SearchParams = Record<string, string | string[] | undefined>;

export default function NewClientPage({ searchParams }: { searchParams?: SearchParams }) {
  const raw = searchParams?.returnTo;
  const returnTo = Array.isArray(raw) ? raw[0] : raw;
  return <NewClientPageClient returnTo={returnTo || "/dashboard/projects"} />;
}
