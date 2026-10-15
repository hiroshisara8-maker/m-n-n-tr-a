import React, { useState } from 'react';
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
  ExternalLink,
} from 'lucide-react';

export interface AuthAccount {
  id: string;
  provider: 'google' | 'facebook' | 'email' | 'guest';
  email: string;
  displayName: string;
  avatarUrl: string;
  handle: string;
  bio?: string;
  loggedInAt: string;
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

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentAccount,
  onLoginSuccess,
  onLogout,
  primaryColor = '#2D6A4F',
  defaultEmail = 'vyt371953@gmail.com',
}) => {
  const [activeStep, setActiveStep] = useState<'portal' | 'google_dialog' | 'facebook_dialog' | 'email_form'>('portal');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Handle Google Login Simulation
  const handleStartGoogleLogin = () => {
    setActiveStep('google_dialog');
  };

  const handleConfirmGoogleLogin = (chosenEmail: string, chosenName: string) => {
    setIsLoading(true);
    setErrorMessage('');
    setTimeout(() => {
      const account: AuthAccount = {
        id: `google-${Date.now()}`,
        provider: 'google',
        email: chosenEmail,
        displayName: chosenName,
        handle: `@${chosenEmail.split('@')[0]}`,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(chosenName)}&backgroundColor=b6e3f4`,
        bio: 'Thành viên Món Khôn · Đăng nhập qua Google',
        loggedInAt: new Date().toISOString(),
      };
      setIsLoading(false);
      onLoginSuccess(account);
      onClose();
    }, 700);
  };

  // Handle Facebook Login Simulation
  const handleStartFacebookLogin = () => {
    setActiveStep('facebook_dialog');
  };

  const handleConfirmFacebookLogin = () => {
    setIsLoading(true);
    setErrorMessage('');
    setTimeout(() => {
      const fbName = defaultEmail ? defaultEmail.split('@')[0] : 'Người dùng Facebook';
      const cleanName = fbName.charAt(0).toUpperCase() + fbName.slice(1);
      const account: AuthAccount = {
        id: `fb-${Date.now()}`,
        provider: 'facebook',
        email: defaultEmail || 'user.facebook@example.com',
        displayName: `${cleanName} (Facebook)`,
        handle: `@${fbName}.fb`,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fbName)}&backgroundColor=c0aede`,
        bio: 'Thành viên Món Khôn · Đăng nhập qua Facebook',
        loggedInAt: new Date().toISOString(),
      };
      setIsLoading(false);
      onLoginSuccess(account);
      onClose();
    }, 700);
  };

  // Handle Email Direct Login
  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ!');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const cleanName = nameInput.trim() || emailInput.split('@')[0];
      const account: AuthAccount = {
        id: `email-${Date.now()}`,
        provider: 'email',
        email: emailInput.trim(),
        displayName: cleanName,
        handle: `@${emailInput.split('@')[0]}`,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=ffdfbf`,
        bio: 'Thành viên Món Khôn · Xác thực qua Email',
        loggedInAt: new Date().toISOString(),
      };
      setIsLoading(false);
      onLoginSuccess(account);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-3xl border border-[#DCE5D8] w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          aria-label="Đóng cửa sổ"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ======================================================== */}
        {/* VIEW: LOGGED IN ACCOUNT DETAILS (IF ALREADY LOGGED IN) */}
        {/* ======================================================== */}
        {currentAccount && activeStep === 'portal' ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-20 h-20 rounded-full mx-auto relative overflow-hidden border-3 border-[#2D6A4F] shadow-md">
              <img
                src={currentAccount.avatarUrl}
                alt={currentAccount.displayName}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EEF5EE] text-[#2D6A4F] mb-1">
                {currentAccount.provider === 'google' && 'Đăng nhập với Google'}
                {currentAccount.provider === 'facebook' && 'Đăng nhập với Facebook'}
                {currentAccount.provider === 'email' && 'Tài khoản Email'}
                {currentAccount.provider === 'guest' && 'Khách dùng thử'}
              </div>
              <h3 className="text-xl font-bold font-serif text-[#1B2A22]">
                {currentAccount.displayName}
              </h3>
              <p className="text-xs text-[#5C7467] font-mono">{currentAccount.email}</p>
            </div>

            <div className="p-4 bg-[#F6F9F5] rounded-2xl border border-[#DCE5D8] text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#385747]">
                <span>Trạng thái kết nối:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã xác thực
                </span>
              </div>
              <div className="flex items-center justify-between text-[#385747]">
                <span>Đồng bộ thực đơn & ngân sách:</span>
                <span className="font-semibold text-[#1B2A22]">Tự động (Real-time)</span>
              </div>
              <div className="flex items-center justify-between text-[#385747]">
                <span>Thời gian đăng nhập:</span>
                <span className="text-[#5C7467]">
                  {new Date(currentAccount.loggedInAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveStep('portal')}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[#1B2A22] bg-[#F1F5F0] hover:bg-[#E6EFE2] transition-colors cursor-pointer"
              >
                Đăng nhập tài khoản khác
              </button>

              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất khỏi thiết bị
              </button>
            </div>
          </div>
        ) : null}

        {/* ======================================================== */}
        {/* VIEW 1: PORTAL CHÍNH - LỰA CHỌN GOOGLE / FACEBOOK / EMAIL */}
        {/* ======================================================== */}
        {(!currentAccount || activeStep !== 'portal') && activeStep === 'portal' && (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF5EE] text-[#2D6A4F] flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1B2A22]">
                Cổng Đăng Nhập Món Khôn
              </h2>
              <p className="text-xs sm:text-sm text-[#5C7467] leading-relaxed max-w-xs mx-auto">
                Đồng bộ kế hoạch ăn, lưu trữ ngân sách và chia sẻ công thức cùng cộng đồng yêu bếp.
              </p>
            </div>

            {/* Social OAuth Buttons */}
            <div className="space-y-3 pt-2">
              {/* GOOGLE BUTTON */}
              <button
                type="button"
                onClick={handleStartGoogleLogin}
                className="w-full py-3 px-4 rounded-2xl border-2 border-[#DCE5D8] hover:border-[#4285F4] bg-white hover:bg-[#F8FAFC] text-sm font-semibold text-[#1F2937] flex items-center justify-center gap-3 transition-all shadow-2xs hover:shadow-sm cursor-pointer group"
              >
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
                <span>Đăng nhập với Google</span>
              </button>

              {/* FACEBOOK BUTTON */}
              <button
                type="button"
                onClick={handleStartFacebookLogin}
                className="w-full py-3 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-semibold flex items-center justify-center gap-3 transition-all shadow-2xs hover:shadow-sm cursor-pointer"
              >
                {/* Official Facebook Logo */}
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Đăng nhập với Facebook</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#DCE5D8] w-full" />
              <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-[#7A9283] font-semibold shrink-0">
                hoặc dùng Email
              </span>
            </div>

            {/* Email Quick Action */}
            <button
              type="button"
              onClick={() => setActiveStep('email_form')}
              className="w-full py-2.5 px-4 rounded-xl border border-[#DCE5D8] hover:border-[#2D6A4F] text-xs font-semibold text-[#385747] hover:text-[#1B2A22] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              Đăng nhập bằng Email & Mật khẩu
            </button>

            {/* Security Guarantee Note */}
            <div className="pt-2 text-center flex items-center justify-center gap-1.5 text-[11px] text-[#5C7467]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>Bảo mật 100% · Không thu thập dữ liệu cá nhân nhạy cảm</span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: GOOGLE POPUP AUTHENTICATION DIALOG SIMULATOR */}
        {/* ======================================================== */}
        {activeStep === 'google_dialog' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
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
                <span className="text-sm font-semibold text-gray-700">Đăng nhập bằng Google</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveStep('portal')}
                className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
              >
                Quay lại
              </button>
            </div>

            <div className="space-y-1 text-center">
              <h3 className="text-lg font-bold text-gray-900">Chọn tài khoản</h3>
              <p className="text-xs text-gray-500">để tiếp tục đến ứng dụng Món Khôn</p>
            </div>

            {/* List of Available Google Accounts */}
            <div className="space-y-2">
              {/* Primary Detected Google Account from Current User Session */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  handleConfirmGoogleLogin(
                    defaultEmail,
                    defaultEmail.split('@')[0]
                  )
                }
                className="w-full p-3.5 rounded-2xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/40 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {defaultEmail.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600">
                      {defaultEmail.split('@')[0]}
                    </h4>
                    <p className="text-xs text-gray-500">{defaultEmail}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Secondary Demo Account */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  handleConfirmGoogleLogin('chef.monkhon@gmail.com', 'Đầu Bếp Gia Đình')
                }
                className="w-full p-3.5 rounded-2xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/40 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    MK
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600">
                      Đầu Bếp Gia Đình
                    </h4>
                    <p className="text-xs text-gray-500">chef.monkhon@gmail.com</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>

            {isLoading && (
              <div className="py-2 flex items-center justify-center gap-2 text-xs font-semibold text-blue-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang kết nối và xác thực tài khoản Google...</span>
              </div>
            )}

            <div className="pt-2 text-[11px] text-gray-500 text-center leading-relaxed">
              Để tiếp tục, Google sẽ chia sẻ tên, địa chỉ email, tùy chọn ngôn ngữ và ảnh hồ sơ của
              bạn với ứng dụng Món Khôn.
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: FACEBOOK AUTHORIZATION DIALOG SIMULATOR */}
        {/* ======================================================== */}
        {activeStep === 'facebook_dialog' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-xs">
                  f
                </span>
                <span className="text-sm font-semibold text-[#1877F2]">Đăng nhập với Facebook</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveStep('portal')}
                className="text-xs text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
              >
                Quay lại
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-[#1877F2] flex items-center justify-center mx-auto shadow-inner text-2xl font-bold">
                f
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Ủy quyền tài khoản Facebook
              </h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Ứng dụng <strong>Món Khôn</strong> sẽ nhận được tên và ảnh đại diện công khai của bạn.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-2 text-gray-600">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Quyền truy cập tên và ảnh đại diện</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đồng bộ thực đơn và bài viết cộng đồng</span>
              </div>
              <p className="text-[11px] text-gray-400 pt-1 border-t border-gray-200">
                Ứng dụng sẽ không bao giờ đăng bài viết lên dòng thời gian Facebook mà không có sự
                đồng ý của bạn.
              </p>
            </div>

            {isLoading ? (
              <div className="py-2 flex items-center justify-center gap-2 text-xs font-semibold text-[#1877F2]">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang hoàn tất đăng nhập Facebook...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmFacebookLogin}
                  className="w-full py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Tiếp tục dưới tên Facebook</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep('portal')}
                  className="w-full py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  Hủy bỏ
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 4: EMAIL LOGIN FORM */}
        {/* ======================================================== */}
        {activeStep === 'email_form' && (
          <form onSubmit={handleEmailLogin} className="p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-[#1B2A22]">Đăng nhập bằng Email</h3>
              <button
                type="button"
                onClick={() => setActiveStep('portal')}
                className="text-xs text-[#2D6A4F] hover:underline font-semibold cursor-pointer"
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1B2A22] block">Địa chỉ Email</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="VD: ban@monkhon.vn hoặc vyt371953@gmail.com"
                className="w-full px-3.5 py-2.5 text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl focus:outline-none focus:border-[#2D6A4F]"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1B2A22] block">
                Tên hiển thị (Tùy chọn)
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="VD: Anh Tuấn, Chị Lan..."
                className="w-full px-3.5 py-2.5 text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl focus:outline-none focus:border-[#2D6A4F]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1B2A22] block">Mật khẩu</label>
              <input
                type="password"
                placeholder="••••••••"
                defaultValue="password123"
                className="w-full px-3.5 py-2.5 text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl focus:outline-none focus:border-[#2D6A4F]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{ backgroundColor: primaryColor }}
              className="w-full py-3 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Xác nhận đăng nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
