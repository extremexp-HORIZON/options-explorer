import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Contact } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export default function Layout({ children, isLoggedIn: isLoggedInProp, onLogout }: LayoutProps) {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const actuallyLoggedIn = isLoggedInProp !== undefined ? isLoggedInProp : isLoggedIn;
  const handleLogout = onLogout || logout;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
  const navItems = actuallyLoggedIn
    ? [
        { path: "/explorer", label: "Explorer" },
        { path: "/create-experiment", label: "Create experiment" },
      ]
    : [];
  const handleLogoutClick = () => {
    handleLogout();
    navigate("/");
  };
  const handleProfileClick = () => {
    navigate("/profile");
  };
   const handleContactClick = () => {
    navigate("/contact");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button className="flex items-center gap-2 focus:outline-none">
              <img
                src="/extremexp-logo.png"
                alt="ExtremeXP Logo"
                className="object-contain"
                style={{ width: "8rem", height: "6rem" }}
              />
            </button>
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive(item.path)
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-4">
              {actuallyLoggedIn ? (
                 <div className="flex gap-2">
                  <button
                  onClick={handleContactClick}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Contact className="w-4 h-4" />
                  Contact
                </button>
                 <button
                  onClick={handleProfileClick}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-accent rounded-lg"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border px-4 py-3 space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "block px-4 py-2 rounded-lg transition-colors",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-border space-y-2">
              {actuallyLoggedIn ? (
                <button
                  onClick={() => {
                    handleLogoutClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block text-center px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block text-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
      <main className="flex-1">{children}</main>
      <footer
        className="py-8 px-4 text-white"
        style={{
        backgroundImage:
          "linear-gradient(90deg, #006dff 0%, #1ff19f 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6">
          <img
            width="810"
            height="540"
            src="https://extremexp.eu/wp-content/uploads/2025/07/Flag_of_Europe-white.svg"
            className="w-20 h-auto"
            alt="EU Flag"
          />
          <p className="text-center text-sm md:text-base text-white">
            The ExtremeXP project is co-funded by the European Union Horizon Program
            HORIZON CL4-2022-DATA-01-01, under Grant Agreement No. 101093164
          </p>
        </div>
      </footer> 
    </div>
  );
}
