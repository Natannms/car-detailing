type AsaasCustomerCreateInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  mobilePhone?: string | null;
  cpfCnpj?: string | null;
  postalCode?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  province?: string | null;
  city?: string | null;
  state?: string | null;
};

type AsaasSubscriptionCreateInput = {
  customer: string;
  billingType: "PIX" | "CREDIT_CARD";
  nextDueDate: string;
  value: number;
  cycle: "MONTHLY";
  description: string;
  externalReference?: string | null;
};

export class AsaasClient {
  constructor(
    private readonly baseUrl: string,
    private readonly accessToken: string,
  ) {}

  static fromEnv() {
    const raw = process.env.ASAAS_TOKEN_API ?? process.env.TOKEN_GATEWAY;
    const token =
      typeof raw === "string"
        ? raw
            .trim()
            .replace(/^"(.*)"$/, "$1")
            .replace(/^'(.*)'$/, "$1")
            .trim()
        : "";
    if (!token) throw new Error("ASAAS_TOKEN_API ausente");
    const rawBase = process.env.ASAAS_BASE_URL || "https://api-sandbox.asaas.com/v3";
    const baseUrl = String(rawBase)
      .trim()
      .replace(/^`(.*)`$/, "$1")
      .replace(/^"(.*)"$/, "$1")
      .replace(/^'(.*)'$/, "$1")
      .trim()
      .replace(/\/$/, "");
    return new AsaasClient(baseUrl, token);
  }

  private async request<T>(method: string, path: string, body?: unknown) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        access_token: this.accessToken,
      },
      body: typeof body === "undefined" ? undefined : JSON.stringify(body),
    });

    const data = (await res.json().catch(() => null)) as any;
    if (!res.ok) {
      const message = data?.errors?.[0]?.description ?? data?.message ?? "Erro Asaas";
      throw new Error(`Asaas ${res.status}: ${message}`);
    }
    return data as T;
  }

  createCustomer(input: AsaasCustomerCreateInput) {
    return this.request<{ id: string }>("POST", "/customers", input);
  }

  createSubscription(input: AsaasSubscriptionCreateInput) {
    return this.request<{ id: string }>("POST", "/subscriptions", input);
  }

  listSubscriptionPayments(subscriptionId: string) {
    return this.request<{ data: any[] }>("GET", `/subscriptions/${encodeURIComponent(subscriptionId)}/payments`);
  }
}
