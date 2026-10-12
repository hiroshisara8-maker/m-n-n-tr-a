import React from 'react';
import {
  Home,
  Compass,
  Refrigerator,
  ShoppingCart,
  Users,
  Menu,
} from 'lucide-react';
import { NavTab } from '../types';

interface MobileBottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenMobileDrawer: () => void;
  pantryCount: number;
  expiringCount: number;
  shoppingMissingCount: number;
  primaryColor?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenMobileDrawer,
  pantryCount,
  expiringCount,
  shoppingMissingCount,
  primaryColor = '#D85A7F',
}) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DCE5D8] px-1.5 py-1 flex items-center justify-around shadow-lg pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      aria-label="Thanh điều hướng nhanh dưới màn hình"
    >
      {/* 1. Trang chủ */}
      <button
        type="button"
        onClick={() => onSelectTab('home')}
        style={activeTab === 'home' ? { color: primaryColor } : undefined}
        className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-colors cursor-pointer min-h-[44px] ${
          activeTab === 'home' ? 'font-semibold' : 'text-[#5C7467] hover:text-[#1B2A22]'
        }`}
      >
        <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">Trang chủ</span>
      </button>

      {/* 2. Khám phá món */}
      <button
        type="button"
        onClick={() => onSelectTab('explore')}
        style={activeTab === 'explore' ? { color: primaryColor } : undefined}
        className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-colors cursor-pointer min-h-[44px] ${
          activeTab === 'explore' ? 'font-semibold' : 'text-[#5C7467] hover:text-[#1B2A22]'
        }`}
      >
        <Compass className={`w-5 h-5 ${activeTab === 'explore' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">Khám phá</span>
      </button>

      {/* 3. Kho đồ ăn */}
      <button
        type="button"
        onClick={() => onSelectTab('pantry')}
        style={activeTab === 'pantry' ? { color: primaryColor } : undefined}
        className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-colors cursor-pointer min-h-[44px] ${
          activeTab === 'pantry' ? 'font-semibold' : 'text-[#5C7467] hover:text-[#1B2A22]'
        }`}
      >
        <div className="relative">
          <Refrigerator
            className={`w-5 h-5 ${activeTab === 'pantry' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`}
          />
          {pantryCount > 0 && (
            <span
              className={`absolute -top-1 -right-2 px-1 text-[9px] font-bold rounded-full text-white min-w-[14px] h-[14px] flex items-center justify-center leading-none ${
                expiringCount > 0 ? 'bg-[#E07A5F]' : 'bg-[#2D6A4F]'
              }`}
            >
              {pantryCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 whitespace-nowrap">Tủ lạnh</span>
      </button>

      {/* 4. Cộng đồng & Profile */}
      <button
        type="button"
        onClick={() => onSelectTab('community')}
        style={activeTab === 'community' ? { color: primaryColor } : undefined}
        className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-colors cursor-pointer min-h-[44px] ${
          activeTab === 'community' ? 'font-semibold' : 'text-[#5C7467] hover:text-[#1B2A22]'
        }`}
      >
        <Users
          className={`w-5 h-5 ${activeTab === 'community' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`}
        />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">Cộng đồng</span>
      </button>

      {/* 5. Menu khác (Đi chợ, Kế hoạch, Chi phí, Random) */}
      <button
        type="button"
        onClick={onOpenMobileDrawer}
        style={
          ['shopping', 'meal_plan', 'random', 'expenses'].includes(activeTab)
            ? { color: primaryColor }
            : undefined
        }
        className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-colors cursor-pointer min-h-[44px] ${
          ['shopping', 'meal_plan', 'random', 'expenses'].includes(activeTab)
            ? 'font-semibold'
            : 'text-[#5C7467] hover:text-[#1B2A22]'
        }`}
      >
        <div className="relative">
          <Menu className="w-5 h-5 stroke-[1.8]" />
          {shoppingMissingCount > 0 && (
            <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold rounded-full bg-[#B45309] text-white min-w-[14px] h-[14px] flex items-center justify-center leading-none">
              {shoppingMissingCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 whitespace-nowrap">Thêm...</span>
      </button>
    </nav>
  );
};
