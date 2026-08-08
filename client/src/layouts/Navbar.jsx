import { useEffect, useState } from "react";
import {
  BrainCircuit,
  Menu,
  MessageSquareText,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Interview", to: "/interview" },
  { label: "Feedback", to: "/feedback" },
];

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <NavLink
          to="/"
          onClick={closeMenu}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
            <BrainCircuit
              size={23}
              className="text-cyan-300"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-base font-bold text-white">
              ABTalks
            </p>
            <p className="truncate text-xs text-slate-500">
              AI Interviewer
            </p>
          </div>
        </NavLink>

        <nav className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/40 ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 text-sm text-slate-500 lg:flex">
          <MessageSquareText size={17} />
          Technical Interview
        </div>

        <button
          type="button"
          aria-label={
            isMenuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40 md:hidden"
        >
          {isMenuOpen ? (
            <X size={21} />
          ) : (
            <Menu size={21} />
          )}
        </button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-white/10 bg-slate-950 px-4 py-3 md:hidden">
          <nav className="mx-auto flex w-full max-w-7xl flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;