import { InviteClient } from "./InviteClient";

type SearchParams = Record<string, string | string[] | undefined>;

export default function DashboardInvitePage({ searchParams }: { searchParams?: SearchParams }) {
  const raw = searchParams?.invite;
  const token = Array.isArray(raw) ? raw[0] : raw;
  return <InviteClient token={token || ""} />;
}
