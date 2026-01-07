import { useNavigate, useLocation } from "react-router-dom";
import { LoginForm } from "@/components/auth";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const handleLoginSuccess = () => {
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/sloth.svg"
            alt="Sloth.app"
            className="w-16 h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-semibold text-primary">
            Welcome back to Sloth.app
          </h1>
          <p className="text-secondary mt-2">Connect your wallet to continue</p>
        </div>

        <div className="bg-surface border border-default rounded-lg p-6">
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>

        <p className="text-center text-sm text-muted mt-6">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-teal-400 hover:text-teal-300 transition-colors"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
