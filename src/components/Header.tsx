
import { ThemeSwitcher } from "./ThemeSwitcher";
// import { Link } from "react-router-dom"; // No specific routes for Link here yet

const Header = () => {
  return (
    <header className="py-4 px-6 border-b border-border bg-card text-card-foreground shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">
          TextTrack 📸✨
        </h1>
        <ThemeSwitcher />
      </div>
    </header>
  );
};

export default Header;
