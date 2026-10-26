import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  LogOut,
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Check,
  Shuffle,
  Users,
  ChevronRight,
  KeyRound,
  UserCheck,
  UtensilsCrossed,
} from 'lucide-react';

export interface AuthAccount {
  id: string;
  provider: 'google' | 'email' | 'guest';
  email: string;
  displayName: string;
  avatarUrl: string;
  handle: string;
  bio?: string;
  loggedInAt: string;
  role?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAccount: AuthAccount | null;
  onLoginSuccess: (account: AuthAccount) => void;
  onLogout: () => void;
  primaryColor?: string;
  defaultEmail?: string;
}

// Storage keys
const SAVED_ACCOUNTS_STORAGE_KEY = 'mon_khon_saved_accounts_v1';

// Rich diverse avatar presets organized by category
export interface AvatarPreset {
  id: string;
  name: string;
  category: 'chef' | 'youth' | 'healthy' | 'family' | 'pets' | 'creative';
  categoryLabel: string;
  url: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  // 👨‍🍳 Bếp & Nấu ăn
  {
    id: 'chef-pro',
    name: 'Bếp Trưởng Đẳng Cấp',
    category: 'chef',
    categoryLabel: 'Đầu Bếp',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ChefHoang&accessories=prescription02&clothing=collarAndSweater&backgroundColor=b6e3f4',
  },
  {
    id: 'chef-mom',
    name: 'Mẹ Yêu Bếp',
    category: 'chef',
    categoryLabel: 'Đầu Bếp',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CoHaiBaoBao&clothing=overall&hairColor=auburn&backgroundColor=ffd5dc',
  },
  {
    id: 'chef-street',
    name: 'Bác Ba Bán Cơm Tấm',
    category: 'chef',
    categoryLabel: 'Đầu Bếp',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BacBaComTam&facialHair=beardLight&backgroundColor=ffdfbf',
  },
  {
    id: 'chef-baking',
    name: 'Bếp Bánh Ngọt Ngào',
    category: 'chef',
    categoryLabel: 'Đầu Bếp',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=SweetDessertChef&backgroundColor=fde047',
  },

  // 🎓 Sinh viên & Trẻ tuổi
  {
    id: 'student-bk',
    name: 'Sinh Viên Tiết Kiệm',
    category: 'youth',
    categoryLabel: 'Sinh Viên & Trẻ',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MinhStudentBK&clothing=hoodie&backgroundColor=d1d4f9',
  },
  {
    id: 'genz-foodie',
    name: 'Cô Nàng Gen Z Ăn Vặt',
    category: 'youth',
    categoryLabel: 'Sinh Viên & Trẻ',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LinhGenZFood&accessories=sunglasses&backgroundColor=ffdfbf',
  },
  {
    id: 'office-pro',
    name: 'Dân Văn Phòng Bận Rộn',
    category: 'youth',
    categoryLabel: 'Sinh Viên & Trẻ',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DuyOfficeWorker&clothing=blazerAndShirt&backgroundColor=c0aede',
  },
  {
    id: 'notion-minimal',
    name: 'Người Yêu Tối Giản',
    category: 'youth',
    categoryLabel: 'Sinh Viên & Trẻ',
    url: 'https://api.dicebear.com/7.x/notionists/svg?seed=MinimalistVibe&backgroundColor=e0f2fe',
  },

  // 🥑 Healthy & Ăn Chay
  {
    id: 'vegan-zen',
    name: 'Ăn Chay Thanh Tịnh',
    category: 'healthy',
    categoryLabel: 'Healthy & Chay',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LanHealthyVegan&accessories=round&backgroundColor=dcfce7',
  },
  {
    id: 'gym-fitness',
    name: 'Tập Gym Giữ Dáng',
    category: 'healthy',
    categoryLabel: 'Healthy & Chay',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GymFitnessMeal&clothing=graphicShirt&backgroundColor=bbf7d0',
  },
  {
    id: 'smoothie-lover',
    name: 'Mê Sinh Tố & Nước Ép',
    category: 'healthy',
    categoryLabel: 'Healthy & Chay',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=GreenSmoothie&backgroundColor=a7f3d0',
  },

  // 👨‍👩‍👧 Gia đình
  {
    id: 'dad-cooks',
    name: 'Bố Đảm Vào Bếp',
    category: 'family',
    categoryLabel: 'Gia Đình',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BoTuanNauCom&accessories=eyepatch&clothing=shirtCrewNeck&backgroundColor=fed7aa',
  },
  {
    id: 'baby-food',
    name: 'Bé Con Ăn Dặm Món Khôn',
    category: 'family',
    categoryLabel: 'Gia Đình',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=BabyFoodieCute&backgroundColor=fce7f3',
  },
  {
    id: 'grandma-recipe',
    name: 'Bà Ngoại Nấu Cỗ',
    category: 'family',
    categoryLabel: 'Gia Đình',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BaNgoaiYeuChau&clothing=collarAndSweater&backgroundColor=fef3c7',
  },

  // 🐱 Thú cưng vui vẻ
  {
    id: 'cat-chef',
    name: 'Mèo Đầu Bếp Cute',
    category: 'pets',
    categoryLabel: 'Thú Cưng & Vui Nhộn',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CatChefKitchen&backgroundColor=fef08a',
  },
  {
    id: 'dog-foodie',
    name: 'Cún Cưng Mê Xúc Xích',
    category: 'pets',
    categoryLabel: 'Thú Cưng & Vui Nhộn',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=DogFoodLover&backgroundColor=e9d5ff',
  },
  {
    id: 'bear-cook',
    name: 'Gấu Trúc Mê Ăn Ngon',
    category: 'pets',
    categoryLabel: 'Thú Cưng & Vui Nhộn',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=PandaKitchen&backgroundColor=bae6fd',
  },

  // 🎨 Sáng tạo & Phiêu lưu
  {
    id: 'food-explorer',
    name: 'Food Reviewer Khám Phá',
    category: 'creative',
    categoryLabel: 'Sáng Tạo',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=FoodExplorerTravel&backgroundColor=fbcfe8',
  },
  {
    id: 'master-recipe',
    name: 'Chuyên Gia Tủ Lạnh',
    category: 'creative',
    categoryLabel: 'Sáng Tạo',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SmartFridgeGuru&backgroundColor=c7d2fe',
  },
  {
    id: 'star-foodie',
    name: 'Ngôi Sao Ẩm Thực',
    category: 'creative',
    categoryLabel: 'Sáng Tạo',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MasterStarChef&backgroundColor=fed7aa',
  },
];

// Preloaded demo Google accounts for immediate multi-user switching
const INITIAL_DEMO_ACCOUNTS: AuthAccount[] = [
  {
    id: 'google-vyt',
    provider: 'google',
    email: 'vyt371953@gmail.com',
    displayName: 'Vy Thảo · Bếp Trưởng Gia Đình',
    avatarUrl:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=VyThaoChef&clothing=collarAndSweater&backgroundColor=b6e3f4',
    handle: '@vythao.monkhon',
    bio: 'Bếp trưởng gia đình · Tối ưu mâm cơm ngon dưới 35k/người',
    loggedInAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    role: 'Gia đình',
  },
  {
    id: 'google-minh',
    provider: 'google',
    email: 'minh.student@gmail.com',
    displayName: 'Minh Quang · Sinh Viên Bách Khoa',
    avatarUrl:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=MinhStudentBK&clothing=hoodie&backgroundColor=d1d4f9',
    handle: '@minhquang.bk',
    bio: 'Sinh viên năm 3 · Chuyên săn đồ rẻ và nấu ăn trọ siêu tốc',
    loggedInAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    role: 'Sinh viên',
  },
  {
    id: 'google-lan',
    provider: 'google',
    email: 'lan.healthy@gmail.com',
    displayName: 'Chị Lan · Ăn Chay & Sống Xanh',
    avatarUrl:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=LanHealthyVegan&accessories=round&backgroundColor=dcfce7',
    handle: '@lan.songxanh',
    bio: 'Thực dưỡng thuần chay · Mâm cơm thanh nhẹ, giàu chất xơ',
    loggedInAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    role: 'Ăn chay',
  },
  {
    id: 'email-chef',
    provider: 'email',
    email: 'chef.monkhon@gmail.com',
    displayName: 'Bác Ba · Đầu Bếp Chuyên Nghiệp',
    avatarUrl:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=ChefHoang&accessories=prescription02&clothing=collarAndSweater&backgroundColor=b6e3f4',
    handle: '@bacba.chef',
    bio: 'Đầu bếp 15 năm kinh nghiệm · Mẹo bảo quản đồ ăn cực chuẩn',
    loggedInAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    role: 'Chuyên gia',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentAccount,
  onLoginSuccess,
  onLogout,
  primaryColor = '#2D6A4F',
  defaultEmail = 'vyt371953@gmail.com',
}) => {
  // Navigation tabs in Auth Modal
  // 'portal' = main view with Multi-User Switcher & Google Login
  // 'email_auth' = email & password login or signup
  // 'google_picker' = Google account switcher & custom Google account
  // 'avatar_picker' = modal to choose diverse avatar
  const [activeStep, setActiveStep] = useState<
    'portal' | 'google_picker' | 'email_auth' | 'avatar_picker'
  >('portal');

  // Saved accounts list on this device
  const [savedAccounts, setSavedAccounts] = useState<AuthAccount[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_ACCOUNTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_DEMO_ACCOUNTS;
  });

  // Email & Password form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Avatar selection state
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(AVATAR_PRESETS[0].url);
  const [avatarCategoryFilter, setAvatarCategoryFilter] = useState<string>('all');
  const [customAvatarInput, setCustomAvatarInput] = useState('');

  // Custom Google Account addition inside Google Picker
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomGoogleForm, setShowCustomGoogleForm] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Persist saved accounts
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(savedAccounts));
    } catch {
      // ignore
    }
  }, [savedAccounts]);

  // Keep savedAccounts synchronized when currentAccount logs in
  useEffect(() => {
    if (currentAccount) {
      setSavedAccounts((prev) => {
        const exists = prev.some((acc) => acc.id === currentAccount.id || acc.email === currentAccount.email);
        if (exists) {
          return prev.map((acc) =>
            acc.id === currentAccount.id || acc.email === currentAccount.email ? currentAccount : acc
          );
        }
        return [currentAccount, ...prev];
      });
    }
  }, [currentAccount]);

  if (!isOpen) return null;

  // Helper to complete login and save account
  const finalizeLogin = (account: AuthAccount, notice: string) => {
    setIsLoading(true);
    setLoadingMessage('Đang đồng bộ hồ sơ và dữ liệu mâm cơm...');
    setErrorMessage('');

    setTimeout(() => {
      // Update saved accounts list
      setSavedAccounts((prev) => {
        const filtered = prev.filter((a) => a.id !== account.id && a.email !== account.email);
        return [account, ...filtered];
      });

      setIsLoading(false);
      setSuccessNotice(notice);
      onLoginSuccess(account);

      setTimeout(() => {
        setSuccessNotice('');
        onClose();
        setActiveStep('portal');
      }, 700);
    }, 600);
  };

  // Switch to another saved account with 1 tap
  const handleSwitchAccount = (account: AuthAccount) => {
    finalizeLogin(
      {
        ...account,
        loggedInAt: new Date().toISOString(),
      },
      `Đã chuyển sang tài khoản ${account.displayName}!`
    );
  };

  // Remove account from device
  const handleRemoveSavedAccount = (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation();
    setSavedAccounts((prev) => prev.filter((a) => a.id !== accountId));
    if (currentAccount && currentAccount.id === accountId) {
      onLogout();
    }
  };

  // Handle Google Login from picker
  const handleSelectGoogleAccount = (email: string, displayName: string, avatarUrl?: string) => {
    const cleanAvatar =
      avatarUrl ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        displayName
      )}&backgroundColor=b6e3f4`;

    const account: AuthAccount = {
      id: `google-${Date.now()}`,
      provider: 'google',
      email,
      displayName,
      avatarUrl: cleanAvatar,
      handle: `@${email.split('@')[0]}`,
      bio: 'Thành viên Món Khôn · Đăng nhập qua tài khoản Google',
      loggedInAt: new Date().toISOString(),
      role: 'Google User',
    };

    finalizeLogin(account, `Chào mừng ${displayName} đăng nhập thành công!`);
  };

  // Handle Custom Google Login
  const handleConfirmCustomGoogle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail.trim() || !customGoogleEmail.includes('@')) {
      setErrorMessage('Vui lòng nhập địa chỉ Google Email hợp lệ (có @)!');
      return;
    }
    const cleanName =
      customGoogleName.trim() || customGoogleEmail.split('@')[0].toUpperCase();
    handleSelectGoogleAccount(customGoogleEmail.trim(), cleanName);
  };

  // Handle Email & Password Login / Registration
  const handleEmailAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailInput.trim() || !emailInput.includes('@')) {
      setErrorMessage('Vui lòng nhập địa chỉ Email hợp lệ!');
      return;
    }

    if (!passwordInput || passwordInput.length < 6) {
      setErrorMessage('Mật khẩu cần tối thiểu 6 ký tự để bảo mật!');
      return;
    }

    if (authMode === 'register') {
      if (passwordInput !== confirmPasswordInput) {
        setErrorMessage('Mật khẩu xác nhận không khớp, vui lòng kiểm tra lại!');
        return;
      }
    }

    const cleanName =
      nameInput.trim() ||
      (authMode === 'register' ? 'Thành viên Món Khôn' : emailInput.split('@')[0]);

    const account: AuthAccount = {
      id: `email-${Date.now()}`,
      provider: 'email',
      email: emailInput.trim(),
      displayName: cleanName,
      avatarUrl: selectedAvatarUrl,
      handle: `@${emailInput.split('@')[0]}`,
      bio:
        authMode === 'register'
          ? 'Thành viên mới · Tự nấu ăn thông minh cùng Món Khôn'
          : 'Thành viên Món Khôn · Xác thực qua Email & Mật khẩu',
      loggedInAt: new Date().toISOString(),
      role: authMode === 'register' ? 'Thành viên mới' : 'Người dùng thân thiết',
    };

    finalizeLogin(
      account,
      authMode === 'register'
        ? `Đăng ký thành công! Chào mừng ${cleanName} gia nhập Món Khôn!`
        : `Đăng nhập thành công! Chào mừng ${cleanName} quay trở lại!`
    );
  };

  // Generate a random avatar
  const handleGenerateRandomAvatar = () => {
    const randomSeed = 'Random-' + Math.random().toString(36).substring(2, 8);
    const styles = ['avataaars', 'bottts', 'fun-emoji', 'lorelei', 'notionists'];
    const chosenStyle = styles[Math.floor(Math.random() * styles.length)];
    const bgColors = ['b6e3f4', 'ffd5dc', 'd1d4f9', 'ffdfbf', 'dcfce7', 'fed7aa', 'fef08a'];
    const chosenBg = bgColors[Math.floor(Math.random() * bgColors.length)];
    const newAvatar = `https://api.dicebear.com/7.x/${chosenStyle}/svg?seed=${randomSeed}&backgroundColor=${chosenBg}`;
    setSelectedAvatarUrl(newAvatar);
  };

  // Filtered avatars
  const filteredAvatars =
    avatarCategoryFilter === 'all'
      ? AVATAR_PRESETS
      : AVATAR_PRESETS.filter((p) => p.category === avatarCategoryFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div
        className="bg-white rounded-3xl border border-[#DCE5D8] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col relative animate-scale-up my-auto max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-[#E6EFE2] flex items-center justify-between bg-gradient-to-r from-[#F6F9F5] to-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif text-[#1B2A22] leading-tight">
                Cổng Đăng Nhập Món Khôn
              </h2>
              <p className="text-[11px] text-[#5C7467]">
                Hỗ trợ nhiều tài khoản · Email & Mật khẩu · Avatar đa dạng
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Success / Notice Banner */}
        {successNotice && (
          <div className="bg-emerald-500 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 animate-fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Global Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-30 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div
              className="w-12 h-12 rounded-full border-3 border-t-transparent animate-spin"
              style={{ borderColor: `${primaryColor} transparent ${primaryColor} ${primaryColor}` }}
            />
            <p className="text-sm font-bold text-[#1B2A22]">{loadingMessage}</p>
            <span className="text-xs text-[#5C7467]">Vui lòng chờ trong giây lát...</span>
          </div>
        )}

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ======================================================== */}
          {/* VIEW: PORTAL (MULTI-USER SWITCHER + GOOGLE + EMAIL BTN)  */}
          {/* ======================================================== */}
          {activeStep === 'portal' && (
            <div className="space-y-6">
              {/* CURRENT ACTIVE ACCOUNT BANNER */}
              {currentAccount && (
                <div className="p-4 rounded-2xl bg-[#EEF5EE] border border-[#CFE0D2] flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={currentAccount.avatarUrl}
                        alt={currentAccount.displayName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600 shadow-xs"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-[#1B2A22] truncate">
                          {currentAccount.displayName}
                        </span>
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md">
                          Đang dùng
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5C7467] font-mono truncate">
                        {currentAccount.email}
                      </p>
                      <p className="text-[10px] text-[#385747] mt-0.5 truncate">
                        {currentAccount.bio || 'Thành viên Món Khôn'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setSuccessNotice('Đã đăng xuất khỏi tài khoản hiện tại.');
                      setTimeout(() => setSuccessNotice(''), 1500);
                    }}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Đăng xuất khỏi tài khoản này"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* MULTI-USER ACCOUNT LIST (DÀNH CHO NHIỀU NGƯỜI ĐĂNG NHẬP) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#2D6A4F]" />
                    <h3 className="text-xs font-bold text-[#1B2A22] uppercase tracking-wider">
                      Tài khoản trên thiết bị này ({savedAccounts.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#5C7467]">Chạm để chuyển đổi</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {savedAccounts.map((acc) => {
                    const isSelected = currentAccount?.email === acc.email;
                    return (
                      <div
                        key={acc.id}
                        onClick={() => handleSwitchAccount(acc)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#F0F7EE] border-[#2D6A4F] ring-1 ring-[#2D6A4F] shadow-xs'
                            : 'bg-white border-[#E6EFE2] hover:border-[#2D6A4F] hover:bg-[#F9FCF8]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={acc.avatarUrl}
                            alt={acc.displayName}
                            className="w-10 h-10 rounded-full object-cover border border-[#DCE5D8] shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-[#1B2A22] truncate">
                                {acc.displayName}
                              </span>
                              {acc.provider === 'google' && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-medium">
                                  Google
                                </span>
                              )}
                              {acc.provider === 'email' && (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium">
                                  Email
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#5C7467] font-mono truncate">
                              {acc.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2D6A4F] bg-white px-2.5 py-1 rounded-full border border-[#CFE0D2]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đang dùng
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-[#2D6A4F] hover:underline flex items-center gap-0.5">
                              Chuyển <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          )}

                          {savedAccounts.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleRemoveSavedAccount(e, acc.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa tài khoản khỏi máy này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PRIMARY ACTION BUTTONS: GOOGLE & EMAIL */}
              <div className="space-y-3 pt-2">
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-[#DCE5D8] w-full" />
                  <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-[#7A9283] font-semibold shrink-0">
                    Đăng nhập hoặc thêm tài khoản mới
                  </span>
                </div>

                {/* GOOGLE MULTI-ACCOUNT LOGIN BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setActiveStep('google_picker');
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl border-2 border-[#DCE5D8] hover:border-[#4285F4] bg-white hover:bg-[#F8FAFC] text-sm font-bold text-[#1F2937] flex items-center justify-between gap-3 transition-all shadow-xs hover:shadow-md cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    {/* Official Google G Logo */}
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <div className="text-left">
                      <div className="leading-tight group-hover:text-[#4285F4]">
                        Tiếp tục với Google
                      </div>
                      <div className="text-[11px] font-normal text-gray-500">
                        Chọn tài khoản Google nhanh chóng
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#4285F4] group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* EMAIL & PASSWORD LOGIN BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setActiveStep('email_auth');
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl border border-[#DCE5D8] hover:border-[#2D6A4F] bg-[#F6F9F5] hover:bg-white text-sm font-bold text-[#1B2A22] flex items-center justify-between gap-3 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#DCE5D8] flex items-center justify-center text-[#2D6A4F] group-hover:bg-[#2D6A4F] group-hover:text-white transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="leading-tight">Đăng nhập bằng Email & Mật khẩu</div>
                      <div className="text-[11px] font-normal text-gray-500">
                        Điền email, mật khẩu hoặc tạo tài khoản mới
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#2D6A4F] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Security info note */}
              <div className="pt-2 text-center flex items-center justify-center gap-1.5 text-[11px] text-[#5C7467]">
                <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
                <span>Bảo mật an toàn · Dữ liệu lưu cục bộ trên thiết bị của bạn</span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: GOOGLE ACCOUNT PICKER & CUSTOM GOOGLE FORM         */}
          {/* ======================================================== */}
          {activeStep === 'google_picker' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Đăng nhập bằng Google</h3>
                    <p className="text-[11px] text-gray-500">Chọn tài khoản để tiếp tục đến Món Khôn</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep('portal')}
                  className="text-xs font-semibold text-[#2D6A4F] hover:underline cursor-pointer"
                >
                  Quay lại
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* LIST OF AVAILABLE GOOGLE ACCOUNTS */}
              <div className="space-y-2">
                {/* Default User Requested Account */}
                <button
                  type="button"
                  onClick={() =>
                    handleSelectGoogleAccount(
                      defaultEmail,
                      'Vy Thảo (Bếp Trưởng)',
                      'https://api.dicebear.com/7.x/avataaars/svg?seed=VyThaoChef&clothing=collarAndSweater&backgroundColor=b6e3f4'
                    )
                  }
                  className="w-full p-3 rounded-2xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/40 flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=VyThaoChef&clothing=collarAndSweater&backgroundColor=b6e3f4"
                      alt={defaultEmail}
                      className="w-10 h-10 rounded-full border border-blue-200 object-cover shrink-0"
                    />
                    <div>
                      <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600">
                        Vy Thảo (Bếp Trưởng)
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{defaultEmail}</div>
                      <div className="text-[10px] text-blue-600 font-medium">Tài khoản chính</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Additional Pre-configured Google Profiles */}
                <button
                  type="button"
                  onClick={() =>
                    handleSelectGoogleAccount(
                      'minh.student@gmail.com',
                      'Minh Quang (Sinh Viên)',
                      'https://api.dicebear.com/7.x/avataaars/svg?seed=MinhStudentBK&clothing=hoodie&backgroundColor=d1d4f9'
                    )
                  }
                  className="w-full p-3 rounded-2xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/40 flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=MinhStudentBK&clothing=hoodie&backgroundColor=d1d4f9"
                      alt="Minh Quang"
                      className="w-10 h-10 rounded-full border border-blue-200 object-cover shrink-0"
                    />
                    <div>
                      <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600">
                        Minh Quang (Sinh Viên Bách Khoa)
                      </div>
                      <div className="text-xs text-gray-500 font-mono">minh.student@gmail.com</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSelectGoogleAccount(
                      'lan.healthy@gmail.com',
                      'Chị Lan (Ăn Chay & Sống Xanh)',
                      'https://api.dicebear.com/7.x/avataaars/svg?seed=LanHealthyVegan&accessories=round&backgroundColor=dcfce7'
                    )
                  }
                  className="w-full p-3 rounded-2xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/40 flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=LanHealthyVegan&accessories=round&backgroundColor=dcfce7"
                      alt="Chị Lan"
                      className="w-10 h-10 rounded-full border border-emerald-200 object-cover shrink-0"
                    />
                    <div>
                      <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600">
                        Chị Lan (Ăn Chay & Sống Xanh)
                      </div>
                      <div className="text-xs text-gray-500 font-mono">lan.healthy@gmail.com</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* TOGGLE FORM: SỬ DỤNG TÀI KHOẢN GOOGLE KHÁC */}
              <div className="pt-2">
                {!showCustomGoogleForm ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomGoogleForm(true)}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-gray-300 hover:border-blue-500 text-xs font-semibold text-blue-600 hover:bg-blue-50/50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Sử dụng một tài khoản Google khác...</span>
                  </button>
                ) : (
                  <form
                    onSubmit={handleConfirmCustomGoogle}
                    className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">
                        Nhập tài khoản Google của bạn
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCustomGoogleForm(false)}
                        className="text-[11px] text-gray-500 hover:text-gray-800"
                      >
                        Thu gọn
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-700 block">
                        Địa chỉ Email Google
                      </label>
                      <input
                        type="email"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        placeholder="VD: nguyenvanan@gmail.com"
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-700 block">
                        Họ và Tên hiển thị
                      </label>
                      <input
                        type="text"
                        value={customGoogleName}
                        onChange={(e) => setCustomGoogleName(e.target.value)}
                        placeholder="VD: Nguyễn Văn An"
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Đăng nhập với Google này</span>
                    </button>
                  </form>
                )}
              </div>

              <div className="text-[11px] text-gray-500 text-center leading-relaxed pt-2">
                Google sẽ chia sẻ tên, địa chỉ email, tùy chọn ngôn ngữ và ảnh hồ sơ của bạn với ứng
                dụng Món Khôn để đồng bộ mâm cơm.
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: EMAIL & PASSWORD LOGIN + REGISTRATION FORM         */}
          {/* ======================================================== */}
          {activeStep === 'email_auth' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#EEF5EE] text-[#2D6A4F] flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1B2A22]">
                    {authMode === 'login' ? 'Đăng Nhập Bằng Email' : 'Tạo Tài Khoản Mới'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep('portal')}
                  className="text-xs font-semibold text-[#2D6A4F] hover:underline cursor-pointer"
                >
                  Quay lại
                </button>
              </div>

              {/* Mode Toggle: Đăng Nhập vs Tạo Tài Khoản */}
              <div className="flex p-1 bg-[#EEF5EE] rounded-xl border border-[#DCE5D8]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white text-[#1B2A22] shadow-xs'
                      : 'text-[#5C7467] hover:text-[#1B2A22]'
                  }`}
                >
                  Đăng Nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-white text-[#1B2A22] shadow-xs'
                      : 'text-[#5C7467] hover:text-[#1B2A22]'
                  }`}
                >
                  Tạo Tài Khoản Mới
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* AVATAR SELECTOR PREVIEW (NỔI BẬT TRONG MỤC TẠO TÀI KHOẢN HOẶC ĐỔI AVATAR) */}
              <div className="p-3.5 bg-[#F6F9F5] border border-[#DCE5D8] rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={selectedAvatarUrl}
                      alt="Avatar được chọn"
                      className="w-13 h-13 rounded-full object-cover border-2 border-[#2D6A4F] shadow-sm bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateRandomAvatar}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-gray-300 text-gray-700 hover:text-[#2D6A4F] flex items-center justify-center shadow-xs cursor-pointer"
                      title="Đổi ngẫu nhiên avatar khác"
                    >
                      <Shuffle className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1B2A22] block">
                      Ảnh đại diện của bạn
                    </span>
                    <span className="text-[11px] text-[#5C7467]">
                      Kho avatar đa dạng hoặc tạo ngẫu nhiên
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveStep('avatar_picker')}
                  className="px-3 py-1.5 bg-white border border-[#DCE5D8] hover:border-[#2D6A4F] text-[#2D6A4F] text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
                >
                  Chọn Avatar →
                </button>
              </div>

              <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
                {/* Field: Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1B2A22] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#2D6A4F]" />
                    <span>Địa chỉ Email</span>
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="VD: ban@monkhon.vn hoặc vyt371953@gmail.com"
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl focus:outline-none focus:border-[#2D6A4F] focus:bg-white transition-all font-mono"
                    autoFocus
                  />
                </div>

                {/* Field: Name (When Registering or Optional) */}
                {authMode === 'register' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label className="text-xs font-bold text-[#1B2A22] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#2D6A4F]" />
                      <span>Họ & Tên / Biệt danh hiển thị</span>
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="VD: Vy Thảo, Bác Ba Cơm Tấm, Minh BK..."
                      required
                      className="w-full px-3.5 py-2.5 text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl focus:outline-none focus:border-[#2D6A4F] focus:bg-white transition-all"
                    />
                  </div>
                )}

                {/* Field: Password with Eye Toggle */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#1B2A22] flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#2D6A4F]" />
                      <span>Mật khẩu</span>
                    </label>
                    {authMode === 'login' && (
                      <span className="text-[11px] text-[#2D6A4F] hover:underline cursor-pointer">
                        Quên mật khẩu?
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl focus:outline-none focus:border-[#2D6A4F] focus:bg-white transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Field: Confirm Password (When Registering) */}
                {authMode === 'register' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label className="text-xs font-bold text-[#1B2A22] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#2D6A4F]" />
                      <span>Nhập lại mật khẩu</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="Xác nhận lại mật khẩu vừa nhập"
                      required
                      className="w-full px-3.5 py-2.5 text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl focus:outline-none focus:border-[#2D6A4F] focus:bg-white transition-all font-mono"
                    />
                  </div>
                )}

                {/* Remember Me Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="remember_checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#2D6A4F] rounded border-gray-300 focus:ring-[#2D6A4F] cursor-pointer"
                  />
                  <label
                    htmlFor="remember_checkbox"
                    className="text-xs text-[#385747] cursor-pointer select-none"
                  >
                    Ghi nhớ đăng nhập trên thiết bị này để chuyển tài khoản nhanh
                  </label>
                </div>

                {/* Quick Fill Demo Credentials */}
                {authMode === 'login' && (
                  <div className="p-2.5 bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl text-[11px] text-[#5C7467] flex items-center justify-between">
                    <span>💡 Gợi ý nhanh tài khoản mẫu:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailInput('vyt371953@gmail.com');
                        setPasswordInput('123456');
                      }}
                      className="text-[#2D6A4F] font-bold hover:underline cursor-pointer"
                    >
                      Điền vyt371953
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{ backgroundColor: primaryColor }}
                  className="w-full py-3.5 text-white text-sm font-bold rounded-2xl cursor-pointer shadow-md hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : authMode === 'login' ? (
                    <>
                      <span>Đăng nhập ngay</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Hoàn tất đăng ký & Đăng nhập</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: DIVERSE AVATAR PICKER (BỘ SƯU TẬP AVATAR ĐA DẠNG)  */}
          {/* ======================================================== */}
          {activeStep === 'avatar_picker' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="text-sm font-bold text-[#1B2A22]">Bộ Sưu Tập Avatar Đa Dạng</h3>
                    <p className="text-[11px] text-[#5C7467]">
                      Chọn hình tượng phù hợp với phong cách ăn uống của bạn
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep('email_auth')}
                  className="text-xs font-semibold text-[#2D6A4F] hover:underline cursor-pointer"
                >
                  Xong
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'chef', label: '👨‍🍳 Đầu bếp' },
                  { id: 'youth', label: '🎓 Trẻ & Sinh viên' },
                  { id: 'healthy', label: '🥑 Healthy & Chay' },
                  { id: 'family', label: '👨‍👩‍👧 Gia đình' },
                  { id: 'pets', label: '🐱🐶 Thú cưng' },
                  { id: 'creative', label: '🎨 Sáng tạo' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAvatarCategoryFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium text-xs transition-colors cursor-pointer shrink-0 ${
                      avatarCategoryFilter === tab.id
                        ? 'bg-[#1B2A22] text-white shadow-xs'
                        : 'bg-[#EEF5EE] text-[#385747] hover:bg-[#E6EFE2]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Selected Avatar Banner with Actions */}
              <div className="p-3 bg-[#EEF5EE] rounded-2xl border border-[#CFE0D2] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedAvatarUrl}
                    alt="Đang chọn"
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600 bg-white shadow-xs"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#1B2A22] block">
                      Avatar đang được chọn
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Sẵn sàng áp dụng cho hồ sơ
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateRandomAvatar}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#CFE0D2] text-[#2D6A4F] hover:bg-emerald-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>🎲 Ngẫu nhiên</span>
                </button>
              </div>

              {/* Grid of Avatars */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {filteredAvatars.map((preset) => {
                  const isChosen = selectedAvatarUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedAvatarUrl(preset.url)}
                      className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer relative group ${
                        isChosen
                          ? 'border-[#2D6A4F] bg-[#F0F7EE] ring-2 ring-[#2D6A4F] shadow-xs'
                          : 'border-gray-200 bg-white hover:border-[#2D6A4F] hover:bg-gray-50'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-12 h-12 rounded-full object-cover border border-gray-100 group-hover:scale-105 transition-transform"
                      />
                      <span className="text-[10px] font-bold text-gray-800 line-clamp-1 leading-tight">
                        {preset.name}
                      </span>
                      <span className="text-[9px] text-gray-500 line-clamp-1">
                        {preset.categoryLabel}
                      </span>

                      {isChosen && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Image URL Option */}
              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                <span className="text-[11px] font-semibold text-gray-700 block">
                  Hoặc dán liên kết ảnh đại diện tùy chỉnh (URL):
                </span>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customAvatarInput}
                    onChange={(e) => setCustomAvatarInput(e.target.value)}
                    placeholder="https://example.com/my-photo.jpg"
                    className="flex-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2D6A4F]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customAvatarInput.trim()) {
                        setSelectedAvatarUrl(customAvatarInput.trim());
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-[#1B2A22] rounded-xl hover:bg-black transition-colors cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setActiveStep('email_auth')}
                  style={{ backgroundColor: primaryColor }}
                  className="w-full py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:opacity-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác nhận dùng avatar này</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
