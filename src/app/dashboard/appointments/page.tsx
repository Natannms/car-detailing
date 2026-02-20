import { AppointmentsClient } from "./AppointmentsClient";

export default function AppointmentsPage() {
  const flag = (process.env.APP_RUNTIME_MODE || "").toUpperCase();
  const tourEnabled = flag.includes("DEVELOPMENT_TOUR");
  return <AppointmentsClient tourEnabled={tourEnabled} />;
}
