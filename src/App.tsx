import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "@/providers/WagmiProvider";
import { CommandProvider } from "@/contexts";
import { ProtectedRoute } from "@/components/auth";
import { ToastProvider, ErrorBoundary } from "@/components/ui";
import {
  Dashboard,
  ProjectDetail,
  ViewWorkspace,
  IssueDetail,
  Login,
  Signup,
  AcceptInvitation,
  Settings,
} from "@/pages";

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/invitation/:id" element={<AcceptInvitation />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:id"
        element={
          <ProtectedRoute>
            <ProjectDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/view/:id"
        element={
          <ProtectedRoute>
            <ViewWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/issue/:id"
        element={
          <ProtectedRoute>
            <IssueDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <WagmiProvider>
        <BrowserRouter>
          <ToastProvider>
            <CommandProvider>
              <AppRoutes />
            </CommandProvider>
          </ToastProvider>
        </BrowserRouter>
      </WagmiProvider>
    </ErrorBoundary>
  );
}

export default App;
