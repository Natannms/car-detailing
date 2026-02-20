import type { AuthContext } from "../domain/entities";

/**
 * Regra de negócio: unidade para filtrar listagens (agendamentos, pacientes, médicos, kanban, etc.).
 * - Não-admin: usa sempre a unidade do usuário (auth.unitId).
 * - Admin: usa o unitId passado na requisição (requestUnitId); se não passado, retorna null (todas as unidades).
 */
export function getFilterUnitId(auth: AuthContext, requestUnitId?: string | null): string | null {
  if (auth.roles.includes("ORG_ADMIN")) return requestUnitId ?? null;
  return auth.unitId ?? null;
}
