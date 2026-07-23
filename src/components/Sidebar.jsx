import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import supabase from "../utils/supabase";
import {

  Globe,

  FileText as LeaveIcon,
  User as ProfileIcon,
  LogOut as LogOutIcon,
  X,
  User,
  Menu,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const Sidebar = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const [showLanguageHint, setShowLanguageHint] = useState(false);
  const [pendingEnquiryCount, setPendingEnquiryCount] = useState(0);
  const [pendingCallCount, setPendingCallCount] = useState(0);
  const [pendingJoiningCount, setPendingJoiningCount] = useState(0);
  const [pendingOnboardingCount, setPendingOnboardingCount] = useState(0);
  const [pendingLeavingCount, setPendingLeavingCount] = useState(0);
  const [pendingOfferCount, setPendingOfferCount] = useState(0);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);

  const pendingCountForPath = (path) => {
    switch (path) {
      case "/find-enquiry":
        return pendingEnquiryCount;
      case "/call-tracker":
        return pendingCallCount;
      case "/joining":
        return pendingJoiningCount;
      case "/after-joining-work":
        return pendingOnboardingCount;
      case "/after-resignation-work":
        return pendingLeavingCount;
      case "/offer-letter":
        return pendingOfferCount;
      case "/leave-management":
        return pendingApprovalCount;
      default:
        return 0;
    }
  };

  const fetchPendingCounts = async () => {
    try {
      // 1. Find Enquiry
      const { data: indentRows, error: indentError } = await supabase
        .from("indent")
        .select("id, indent_number, number_of_posts, status");

      if (indentError) throw indentError;

      const { data: enquiryRows, error: enquiryError } = await supabase
        .from("enquiry")
        .select("indent_number, tracker_status, candidate_enquiry_number, planned_1, actual_1, actual_2");

      if (enquiryError) throw enquiryError;

      const needMoreIndents = indentRows.filter(row => row.status === "NeedMore");

      const completedEnquiriesCount = {};
      enquiryRows.forEach(row => {
        if (row.indent_number && row.tracker_status === "Complete") {
          completedEnquiriesCount[row.indent_number] = (completedEnquiriesCount[row.indent_number] || 0) + 1;
        }
      });

      const enquiryPending = needMoreIndents.filter(task => {
        const requiredPosts = parseInt(task.number_of_posts) || 0;
        const completed = completedEnquiriesCount[task.indent_number] || 0;
        return completed < requiredPosts;
      }).length;

      setPendingEnquiryCount(enquiryPending);

      // 2. Call Tracker & Joining
      const { data: followUps, error: followError } = await supabase
        .from("follow_up")
        .select("enquiry_number, status");
      if (followError) throw followError;

      const callPending = (enquiryRows || [])
        .filter((row) => row.planned_1 && !row.actual_1)
        .filter(item => {
          const hasFinalStatus = (followUps || []).some(followUp =>
            followUp.enquiry_number === item.candidate_enquiry_number &&
            (followUp.status?.includes('Joining') || followUp.status?.includes('Reject'))
          );
          return !hasFinalStatus;
        }).length;

      setPendingCallCount(callPending);

      const itemsWithJoiningStatus = (enquiryRows || [])
        .filter((row) => row.actual_1 && row.actual_1.toString().trim() !== "")
        .filter((item) => {
          return (followUps || []).some(
            (followUp) =>
              followUp.enquiry_number === item.candidate_enquiry_number &&
              followUp.status?.includes("Joining"),
          );
        });

      const joiningPending = itemsWithJoiningStatus.filter(
        (item) => !item.actual_2 || item.actual_2.toString().trim() === ""
      ).length;

      setPendingJoiningCount(joiningPending);

      // 3. On Boarding (After Joining Work)
      const { data: onboardingRows, error: onboardingError } = await supabase
        .from("joining")
        .select("rbp_joining_id, planned_date, actual_date");
      if (onboardingError) throw onboardingError;

      const onboardingPending = (onboardingRows || []).filter(
        (task) => task.planned_date && !task.actual_date
      ).length;

      setPendingOnboardingCount(onboardingPending);

      // 4. After Resignation Work
      const { data: leavingRows, error: leavingError } = await supabase
        .from("employee_leaving")
        .select("resignation_letter_received, resignation_acceptance, handover_of_assets, cancellation_of_email_id, remove_benefit_enrollment, final_release_date");
      if (leavingError) throw leavingError;

      const leavingPending = (leavingRows || []).filter(
        (task) =>
          !(
            task.resignation_letter_received &&
            task.resignation_acceptance &&
            task.handover_of_assets &&
            task.cancellation_of_email_id &&
            task.remove_benefit_enrollment &&
            task.final_release_date
          )
      ).length;

      setPendingLeavingCount(leavingPending);

      // 5. Offer & Confirmation Letter Management (Offer Letter Pending)
      const { data: followUpsJoining, error: followJoinErr } = await supabase
        .from("follow_up")
        .select("id")
        .eq("status", "Joining");
      if (followJoinErr) throw followJoinErr;

      const { data: offerLettersList, error: offerLettersErr } = await supabase
        .from("offer_letters")
        .select("follow_up_id, status");
      if (offerLettersErr) throw offerLettersErr;

      const offerPending = (followUpsJoining || []).filter(followUp => {
        const matchingOffer = (offerLettersList || []).find(o => o.follow_up_id === followUp.id);
        return !matchingOffer || matchingOffer.status === "Pending" || matchingOffer.status === "Draft";
      }).length;

      setPendingOfferCount(offerPending);

      // 6. Approval Management (Leave, Attendance, Resignation Pending)
      const { data: leaves, error: leavesErr } = await supabase
        .from('emp_leaving_holiday')
        .select('status');
      if (leavesErr) throw leavesErr;
      const leavePending = (leaves || []).filter(leave =>
        leave.status?.toString().toLowerCase() === 'pending'
      ).length;

      const { data: punchRows, error: punchErr } = await supabase
        .from("offline_biometric_punch")
        .select("employee_id, attendance_date, approval_status")
        .not("approval_status", "is", null);
      if (punchErr) throw punchErr;

      const uniquePunchData = Object.values(
        (punchRows || []).reduce((acc, item) => {
          const key = `${item.employee_id}_${item.attendance_date}`;
          acc[key] = item;
          return acc;
        }, {})
      );
      const attendancePending = uniquePunchData.filter(x => x.approval_status === "pending").length;

      const { data: resignationRows, error: resignationErr } = await supabase
        .from('employee_leaving')
        .select('resignation_acceptance');
      if (resignationErr) throw resignationErr;

      const resignationPending = (resignationRows || []).filter(item =>
        !item.resignation_acceptance
      ).length;

      setPendingApprovalCount(leavePending + attendancePending + resignationPending);

    } catch (error) {
      console.error("Error fetching pending counts:", error);
    }
  };

  useEffect(() => {
    fetchPendingCounts();
    
    // Periodically fetch counts to handle changes on the same page
    const interval = setInterval(fetchPendingCounts, 5000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const hasSeenLanguageHint = localStorage.getItem("hasSeenLanguageHint");
    if (!hasSeenLanguageHint && currentLang === "en") {
      setShowLanguageHint(true);
    } else {
      setShowLanguageHint(false);
    }
  }, [currentLang]);

  useEffect(() => {
    const hideStyles = document.createElement("style");
    hideStyles.innerHTML = `
    .goog-te-banner-frame.skiptranslate { display: none !important; }
    body { top: 0 !important; }
    #google_translate_element { display: none !important; }
  `;
    document.head.appendChild(hideStyles);

    window.googleTranslateElementInit = () => {
      if (
        window.google &&
        window.google.translate &&
        window.google.translate.TranslateElement
      ) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi",
            autoDisplay: false,
          },
          "google_translate_element",
        );
      }
    };

    if (!document.querySelector('script[src*="translate_a/element.js"]')) {
      const script = document.createElement("script");
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }

    return () => { };
  }, []);

  const toggleLanguage = () => {
    const next = currentLang === "en" ? "hi" : "en";
    setCurrentLang(next);

    // Hide the hint when switching to Hindi or when language is toggled
    if (showLanguageHint) {
      setShowLanguageHint(false);
      localStorage.setItem("hasSeenLanguageHint", "true");
    }

    const cookieValue = `/en/${next}`;
    const hostname = location.hostname;
    const domainPart =
      hostname === "localhost" || !hostname ? "" : `;domain=.${hostname}`;
    document.cookie = `googtrans=${cookieValue}${domainPart};path=/;max-age=31536000`;
    document.cookie = `googtrans=${cookieValue};path=/;max-age=31536000`;

    try {
      if (typeof window.doGTranslate === "function") {
        window.doGTranslate(`en|${next}`);
        return;
      }

      const sel = document.querySelector("#google_translate_element select");
      if (sel) {
        sel.value = next;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      }
    } catch (e) { }
    window.location.reload();
  };

  const adminMenuItems = [
    {
      path: "/",
      icon: "🏠",
      label: "Dashboard",
      color: "from-blue-500 to-indigo-600",
    },

    {
      path: "/indent",
      icon: "📝",
      label: "Indent",
      color: "from-orange-500 to-amber-600",
    },

    {
      path: "/find-enquiry",
      icon: "🔍",
      label: "Find Enquiry",
      color: "from-cyan-500 to-sky-600",
    },

    {
      path: "/call-tracker",
      icon: "📞",
      label: "Call Tracker",
      color: "from-green-500 to-emerald-600",
    },

    {
      path: "/offer-letter",
      icon: "📄",
      label: "Formate",
      color: "from-pink-500 to-rose-600",
    },

    {
      path: "/joining",
      icon: "✍️",
      label: "Joining",
      color: "from-violet-500 to-purple-600",
    },

    {
      path: "/after-joining-work",
      icon: "✅",
      label: "On Boarding",
      color: "from-teal-500 to-cyan-600",
    },

    {
      path: "/employee",
      icon: "👨‍💼",
      label: "Employee",
      color: "from-yellow-500 to-orange-600",
    },


    {
      path: "/attendancedaily",
      icon: "📅",
      label: "Attendance",
      color: "from-indigo-500 to-blue-700",
    },
    {
      path: "/leave-management",
      icon: "🌴",
      label: "Approval",
      color: "from-red-500 to-pink-600",
    },


    {
      path: "/attendancedaily_management",
      icon: "🕒",
      label: "Manage Attendance",
      color: "from-lime-500 to-green-700",
    },

    {
      path: "/payroll",
      icon: "💰",
      label: "Payroll",
      color: "from-emerald-500 to-teal-700",
    },
    {
      path: "/after-payment",
      icon: "💳",
      label: "After Payment",
      color: "from-emerald-500 to-teal-700",
    },
    {
      path: "/birthday-wish",
      icon: "🎂",
      label: "Birthday Wish",
      color: "from-pink-500 to-rose-600",
    },

    {
      path: "/add_users",
      icon: "👥",
      label: "Add Users",
      color: "from-fuchsia-500 to-purple-700",
    },

    {
      path: "/master_hr",
      icon: "⚙️",
      label: "Master",
      color: "from-gray-600 to-slate-800",
    },


    {
      path: "/after-resignation-work",
      icon: "🚪",
      label: "After Resignation Work",
    },
  ];

  const menuItems = adminMenuItems;

  const handleScroll = (e) => {
    if (e.target && e.target.scrollTop !== undefined) {
      sessionStorage.setItem("sidebar_scroll_position", e.target.scrollTop);
    }
  };

  useEffect(() => {
    const savedScroll = sessionStorage.getItem("sidebar_scroll_position");
    const navElements = document.querySelectorAll("nav.scrollbar-hide");
    navElements.forEach((nav) => {
      if (savedScroll !== null) {
        nav.scrollTop = parseInt(savedScroll, 10);
      } else {
        const activeLink = nav.querySelector(".bg-gradient-to-r");
        if (activeLink) {
          activeLink.scrollIntoView({ block: "nearest" });
        }
      }
    });
  }, [location.pathname]);

  return (
    <>
      {/* Mobile menu button - visible only on mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-gradient-to-r from-[#065F46] to-[#0F766E] text-white rounded-xl shadow-lg hover:shadow-emerald-950/20 active:scale-[0.98] transition-all"
        onClick={() => setIsOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Tablet menu button - visible on tablet (hidden on mobile and desktop) */}
      <button
        className="hidden md:block lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-gradient-to-r from-[#065F46] to-[#0F766E] text-white rounded-xl shadow-lg hover:shadow-emerald-950/20 active:scale-[0.98] transition-all"
        onClick={() => setIsOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Desktop Sidebar - full width on desktop */}
      <div className="hidden lg:block fixed left-0 top-0 h-full">
        <SidebarContent
          currentLang={currentLang}
          showLanguageHint={showLanguageHint}
          setShowLanguageHint={setShowLanguageHint}
          toggleLanguage={toggleLanguage}
          user={user}
          handleLogout={handleLogout}
          menuItems={menuItems}
          pendingCountForPath={pendingCountForPath}
          location={location}
          handleScroll={handleScroll}
          setIsOpen={setIsOpen}
        />
      </div>

      {/* Tablet Sidebar - collapsible */}
      <div
        className={`hidden md:block lg:hidden fixed inset-0 z-40 transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)}
        />
        <div
          className={`fixed left-0 top-0 h-full z-50 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out`}
        >
          <SidebarContent
            onClose={() => setIsOpen(false)}
            currentLang={currentLang}
            showLanguageHint={showLanguageHint}
            setShowLanguageHint={setShowLanguageHint}
            toggleLanguage={toggleLanguage}
            user={user}
            handleLogout={handleLogout}
            menuItems={menuItems}
            pendingCountForPath={pendingCountForPath}
            location={location}
            handleScroll={handleScroll}
            setIsOpen={setIsOpen}
          />
        </div>
      </div>

      {/* Mobile Sidebar - collapsible */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)}
        />
        <div
          className={`fixed left-0 top-0 h-full z-50 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out`}
        >
          <SidebarContent
            onClose={() => setIsOpen(false)}
            currentLang={currentLang}
            showLanguageHint={showLanguageHint}
            setShowLanguageHint={setShowLanguageHint}
            toggleLanguage={toggleLanguage}
            user={user}
            handleLogout={handleLogout}
            menuItems={menuItems}
            pendingCountForPath={pendingCountForPath}
            location={location}
            handleScroll={handleScroll}
            setIsOpen={setIsOpen}
          />
        </div>
      </div>

      {/* Add padding to main content when sidebar is open on desktop */}
      <div className="lg:pl-64"></div>
    </>
  );
};

// SidebarContent defined outside Sidebar to ensure stable component reference
const SidebarContent = ({
  onClose,
  isCollapsed = false,
  currentLang,
  showLanguageHint,
  setShowLanguageHint,
  toggleLanguage,
  user,
  handleLogout,
  menuItems,
  pendingCountForPath,
  location,
  handleScroll,
  setIsOpen
}) => (
  <div
    className={`flex flex-col h-full ${isCollapsed ? "w-16" : "w-64"} bg-white border-r border-slate-200/80 text-slate-800`}
  >
    {/* Header */}
    <div className="flex items-center justify-between p-4 border-b border-slate-100">
      {!isCollapsed && (
        <h1 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          <div className="w-12 h-12 overflow-hidden rounded-xl border border-slate-100 shadow-sm p-1.5 bg-white">
            <img
              src="/Logo.PNG"
              alt="RBP Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <span className="text-[#0F766E] font-extrabold tracking-tight">HR FMS</span>
          <div className="relative">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-[#0F766E] transition relative"
              aria-label="Toggle language"
              title={
                currentLang === "en" ? "Switch to Hindi" : "Switch to English"
              }
            >
              <Globe size={18} />
            </button>

            {/* Language hint tooltip */}
            {showLanguageHint && currentLang === "en" && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50">
                {/* Arrow pointing up */}
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-orange-500"></div>
                </div>

                {/* Tooltip content */}
                <div className="bg-orange-500 text-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap text-sm font-medium">
                  हिंदी के लिए क्लिक करें
                  <button
                    onClick={() => {
                      setShowLanguageHint(false);
                      localStorage.setItem("hasSeenLanguageHint", "true");
                    }}
                    className="ml-2 text-orange-200 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
          <div id="google_translate_element" style={{ display: "none" }} />
          {user?.role === "employee" && (
            <span className="text-xs bg-emerald-50 text-[#0F766E] px-2 py-1 rounded-md border border-emerald-100 font-semibold">
              Employee
            </span>
          )}
        </h1>
      )}
      {onClose && (
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none"
        >
          <span className="sr-only">Close sidebar</span>
          <X className="h-5 w-5" />
        </button>
      )}
    </div>

    {/* Menu */}
    <nav
      onScroll={handleScroll}
      className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-hide"
    >
      {menuItems.map((item) => {
        if (item.type === "dropdown") {
          return (
            <div key={item.label}>
              <button
                onClick={item.toggle}
                className={`flex items-center justify-between w-full py-2.5 px-4 rounded-xl transition-all duration-200 ${item.isOpen
                  ? "bg-slate-100 text-slate-800 font-semibold"
                  : "text-slate-600 hover:bg-emerald-50/50 hover:text-[#0F766E]"
                  }`}
              >
                <div className="flex items-center">
                  <span
                    className={`
    ${isCollapsed ? "mx-auto" : "mr-3"}
    text-xl flex items-center justify-center
  `}
                  >
                    {typeof item.icon === "string" ? (
                      item.icon
                    ) : (
                      <item.icon size={18} />
                    )}
                  </span>

                  {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </div>
                {!isCollapsed &&
                  (item.isOpen ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  ))}
              </button>

              {item.isOpen && !isCollapsed && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.items.map((subItem) => (
                    <NavLink
                      key={subItem.path}
                      to={subItem.path}
                      className={({ isActive }) =>
                        `flex items-center py-2 px-3 rounded-xl transition-all duration-200
  ${isActive
                           ? `bg-gradient-to-r from-[#065F46] to-[#0F766E] text-white shadow-md shadow-emerald-950/10 font-semibold`
                           : "text-slate-500 hover:bg-emerald-50/50 hover:text-[#0F766E] text-sm font-medium"
                        }`
                      }
                      onClick={() => {
                        onClose?.();
                        setIsOpen?.(false);
                      }}
                    >
                      <span
                        className={`
    ${isCollapsed ? "mx-auto" : "mr-3"}
    text-xl flex items-center justify-center
  `}
                      >
                        {item.icon}
                      </span>

                      {!isCollapsed && (
                        <span className="font-medium tracking-wide">
                          {item.label}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center py-2.5 px-4 rounded-xl transition-all duration-200 relative ${isActive
                ? `bg-gradient-to-r from-[#065F46] to-[#0F766E] text-white shadow-md shadow-emerald-950/10 font-semibold`
                : "text-slate-600 hover:bg-emerald-50/60 hover:text-[#0F766E]"
              }`
            }
            onClick={() => {
              onClose?.();
              setIsOpen?.(false);
            }}
          >
            <div className="relative flex items-center justify-center">
              <span
                className={`
                  ${isCollapsed ? "mx-auto" : "mr-3"}
                  text-xl flex items-center justify-center
                `}
              >
                {typeof item.icon === "string" ? (
                  item.icon
                ) : (
                  React.createElement(item.icon, { size: 18 })
                )}
              </span>
              {isCollapsed && pendingCountForPath(item.path) > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                  {pendingCountForPath(item.path)}
                </span>
              )}
            </div>

            {!isCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-medium tracking-wide">
                  {item.label}
                </span>
                {pendingCountForPath(item.path) > 0 && (
                  <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-sm transition-all duration-200 ${
                    location.pathname === item.path ? "bg-white text-[#0F766E]" : "bg-red-500 text-white"
                  }`}>
                    {pendingCountForPath(item.path)}
                  </span>
                )}
              </div>
            )}
          </NavLink>
        );
      })}
    </nav>

    {/* Footer - Always visible */}
    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2 cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <User size={18} className="text-[#0F766E]" />
          </div>
          {/* Show user info in mobile view regardless of collapsed state */}
          <div className={`${isCollapsed ? "hidden" : "block"} md:block`}>
            <p className="text-sm font-semibold text-slate-700">
              {user?.Name || user?.Username || "Guest"}
            </p>
            <p className="text-xs text-slate-500">
              {user?.role === "ADMIN" ? "Administrator" : "Employee"}
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          handleLogout();
          onClose?.();
          setIsOpen?.(false);
        }}
        className="flex items-center justify-center py-2 px-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer font-semibold transition-colors duration-200 w-full text-sm border border-red-100"
      >
        <LogOutIcon className={isCollapsed ? "mx-auto" : "mr-2"} size={16} />
        {!isCollapsed && <span>Logout</span>}
      </button>
    </div>
  </div>
);

export default Sidebar;
