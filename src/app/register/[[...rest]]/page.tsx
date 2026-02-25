import { RegisterClient } from "./RegisterClient";

type SearchParams = Record<string, string | string[] | undefined>;

export default function RegisterPage({ searchParams }: { searchParams?: SearchParams }) {
  const rawInvite = searchParams?.invite;
  const rawPlan = searchParams?.plan;
  const inviteToken = (Array.isArray(rawInvite) ? rawInvite[0] : rawInvite) || "";
  const planId = (Array.isArray(rawPlan) ? rawPlan[0] : rawPlan) || "";
  return <RegisterClient inviteToken={inviteToken} planId={planId} />;
}

