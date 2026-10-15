import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { PasswordForm } from "./PasswordForm";

export const metadata = { title: "Akun" };

export default async function AkunPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-xl p-4 sm:p-8">
      <PageHeader title="Akun saya" subtitle={`${user.name} (${user.username})`} />
      <PasswordForm />
    </div>
  );
}
