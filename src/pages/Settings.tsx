import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { PerplexitySettings } from "@/components/settings";
import { useCommand } from "@/contexts";
import { getCurrentSession } from "@/services";

export function Settings() {
  const navigate = useNavigate();
  const { setAppContext } = useCommand();
  const session = getCurrentSession();

  useEffect(() => {
    if (!session) {
      navigate("/login");
      return;
    }
    setAppContext("settings");
  }, [session, navigate, setAppContext]);

  if (!session) {
    return null;
  }

  return (
    <AppLayout>
      <div className="max-w-4xl">
        <h2 className="text-2xl font-semibold text-primary mb-6">Settings</h2>

        <div className="space-y-6">
          {/* Perplexity Integration Section */}
          <section className="bg-surface rounded-lg border border-default p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Perplexity Integration
            </h3>
            <p className="text-sm text-secondary mb-6">
              Configure your personal Perplexity API key to enable AI chat
              features in your projects and issues.
            </p>
            <PerplexitySettings userId={session.userId} />
          </section>

          {/* Future settings sections can be added here */}
        </div>
      </div>
    </AppLayout>
  );
}
