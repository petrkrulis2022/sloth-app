import { useNavigate } from "react-router-dom";
import { SignupForm } from "@/components/auth";

export function Signup() {
  const navigate = useNavigate();

  const handleSignupSuccess = () => {
    navigate("/", { replace: true });
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
            Create your account
          </h1>
          <p className="text-secondary mt-2">
            Link your email and wallet to get started
          </p>
        </div>

        <div className="bg-surface border border-default rounded-lg p-6">
          <SignupForm onSuccess={handleSignupSuccess} />
        </div>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-teal-400 hover:text-teal-300 transition-colors"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
