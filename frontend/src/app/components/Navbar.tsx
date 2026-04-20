import { Link, NavLink } from "react-router";
import { Leaf, Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export default function Navbar() {
  const { isDarkTheme, toggleTheme } = useTheme();

  return (
    <div className="w-full flex justify-center pt-8 px-4 z-50 relative">
      <nav className={`${isDarkTheme ? "bg-[#111E11]/80 border-[#64B43C]/20" : "bg-white/80 border-[#1A3A1A]/10"} backdrop-blur-md rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.1)] px-3 py-2 flex items-center justify-between w-full max-w-[1200px] relative z-50 transition-colors duration-500`}>
        
        <Link to="/" className="flex items-center gap-2 pl-3 z-10 transition-transform hover:scale-105 duration-300">
          <img src="/logo.png" alt="KisanTrust Logo" className="w-8 h-8 object-contain" />
          <span className={`font-heading text-[20px] font-bold transition-colors duration-500 ${isDarkTheme ? "text-white" : "text-[#1A3A1A]"}`}>
            KisanTrust
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-[15px] font-medium z-10">
          <NavLink 
            to="/how-it-works" 
            className={({ isActive }) => 
              `${isActive ? "text-[#64B43C] font-bold" : (isDarkTheme ? "text-white/70 hover:text-white" : "text-[#1A3A1A]/70 hover:text-[#1A3A1A]")} transition-all duration-300`
            }
          >
            How it Works
          </NavLink>
          <NavLink 
            to="/for-farmers" 
            className={({ isActive }) => 
              `${isActive ? "text-[#64B43C] font-bold" : (isDarkTheme ? "text-white/70 hover:text-white" : "text-[#1A3A1A]/70 hover:text-[#1A3A1A]")} transition-all duration-300`
            }
          >
            For Farmers
          </NavLink>
          <NavLink 
            to="/for-lenders" 
            className={({ isActive }) => 
              `${isActive ? "text-[#64B43C] font-bold" : (isDarkTheme ? "text-white/70 hover:text-white" : "text-[#1A3A1A]/70 hover:text-[#1A3A1A]")} transition-all duration-300`
            }
          >
            For Lenders
          </NavLink>
        </div>

        <div className="flex items-center gap-2 z-10">
          <button 
            onClick={toggleTheme} 
            className={`p-2 rounded-full border transition-all flex items-center justify-center mr-1 ${isDarkTheme ? 'bg-[#1A3A1A] text-[#FAFBF7] border-[#64B43C]/30 hover:bg-[#64B43C]/20' : 'bg-white text-[#1A3A1A] border-gray-200 hover:bg-gray-50'}`}
            title="Toggle Theme"
          >
            {isDarkTheme ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <Link to="/login" className={`hidden sm:flex px-4 py-2 rounded-full transition-colors text-[14px] font-medium items-center justify-center ${isDarkTheme ? "text-white border border-white/20 hover:bg-white/10" : "text-[#1A3A1A] border border-gray-200 hover:bg-gray-50"}`}>
            Farmer Login
          </Link>
          <Link to="/lender-login" className={`px-5 py-2 rounded-full shadow-sm transition-all text-[14px] font-bold flex items-center justify-center ${isDarkTheme ? "bg-[#64B43C] text-[#1A3A1A] hover:bg-[#5AA44E]" : "bg-[#64B43C] text-white hover:bg-[#5AA44E]"}`}>
            Lender Login
          </Link>
        </div>
      </nav>
    </div>
  );
}
