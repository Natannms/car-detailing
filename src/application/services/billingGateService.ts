import { PaymentRequiredError } from "../../domain/errors";
import type { OrganizationBillingRepository } from "../../domain/repositories";

export class BillingGateService {
  constructor(private readonly billing: OrganizationBillingRepository) {}

  async assertActiveOrganization(organizationId: string) {
    const b = await this.billing.getByOrganizationId(organizationId);
    const now = Date.now();
    if (!b) throw new PaymentRequiredError("Assinatura pendente. Acesse Billing para regularizar.");
    if (b.status !== "ACTIVE") throw new PaymentRequiredError("Assinatura pendente. Acesse Billing para regularizar.");
    if (!b.validUntil) throw new PaymentRequiredError("Assinatura pendente. Acesse Billing para regularizar.");
    if (b.validUntil.getTime() < now) throw new PaymentRequiredError("Assinatura expirada. Acesse Billing para regularizar.");
  }
}

