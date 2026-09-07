import { AccessGate } from "@/components/AccessGate";
import { InterviewFlow } from "@/components/InterviewFlow";
import { hasValidSession } from "@/lib/auth";

/** Session is checked on the server, so the gate cannot be skipped client-side. */
export default async function InterviewPage() {
  const authorized = await hasValidSession();

  return (
    <main className="mx-auto w-full max-w-3xl px-6">
      {authorized ? <InterviewFlow /> : <AccessGate />}
    </main>
  );
}
