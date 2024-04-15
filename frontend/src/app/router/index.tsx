import { AppLayout } from "@/views/layouts/AppLayout";
import { AuthLayout } from "@/views/layouts/AuthLayout";
import { Dashboard } from "@/views/pages/Dashboard";
import { Login } from "@/views/pages/Login";
import { NotFound } from "@/views/pages/NotFound";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthGuard } from "./AuthGuard";

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthGuard isPrivate={false} />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>
        </Route>

        <Route element={<AuthGuard isPrivate />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />

            <Route path='*' element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}