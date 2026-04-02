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
          {/* Claude AI Integration Section */}
          <section className="bg-surface rounded-lg border border-default p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Claude AI Integration
            </h3>
            <p className="text-sm text-secondary mb-6">
              Your Claude (Anthropic) API key is configured via the
              <code className="mx-1 px-1 bg-muted rounded text-xs">
                VITE_ANTHROPIC_API_KEY
              </code>
              environment variable. No additional setup required.
            </p>
            <PerplexitySettings userId={session.userId} />
          </section>

          {/* Future settings sections can be added here */}
        </div>
      </div>
    </AppLayout>
  );
}
