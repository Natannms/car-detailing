import { json } from "../_lib/response";

export async function GET() {
  return json({ status: "ok" });
}

