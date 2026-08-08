import { Outlet } from "react-router-dom";

import Navbar from "./Navbar.jsx";

function AppLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950">
      <Navbar />

      <main className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;