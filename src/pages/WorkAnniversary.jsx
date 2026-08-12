import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Search,
  Filter,
  Award,
  Gift,
  Users,
  Calendar,
  MessageSquare,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Mail,
  AlertCircle,
  Clock,
  PartyPopper,
  History,
  Trash2,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Eye,
  Share2,
  Briefcase
} from "lucide-react";
import toast from "react-hot-toast";
import supabase from "../utils/supabase";

// Helper to parse dates in DD/MM/YYYY or YYYY-MM-DD or string formats
const parseDateString = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  const str = String(dateStr).trim();

  if (str.includes("/")) {
    const parts = str.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  if (str.includes("-")) {
    const parts = str.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
      } else {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;

  return null;
};

// Formats date into "15 Jul 2021"
const formatDisplayDate = (dateObj) => {
  if (!dateObj) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = dateObj.getDate();
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}`;
};

// Converts numbers to words (1 -> "one", 5 -> "five", etc.)
const numberToWords = (num) => {
  const words = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"
  ];
  return words[num] || String(num);
};

// Initial-based avatar component
const InitialAvatar = ({ name, size = "w-16 h-16 text-xl" }) => {
  const initials = name
    ? name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "WA";

  const gradients = [
    "from-amber-500 to-yellow-600",
    "from-teal-500 to-emerald-600",
    "from-indigo-500 to-blue-600",
    "from-rose-500 to-pink-600",
    "from-purple-500 to-violet-600",
  ];

  const charSum = name ? name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
  const gradient = gradients[charSum % gradients.length];

  return (
    <div className={`${size} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold shadow-inner ring-4 ring-white/60`}>
      {initials}
    </div>
  );
};

// Canvas Renderer for Work Anniversary Card matching reference image
const drawWorkAnniversaryCardCanvas = (canvas, employeeName, yearsCount = 5, logoImg = null) => {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = 1000;
  const height = 1300;
  canvas.width = width;
  canvas.height = height;

  // 1. Warm Ivory Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, "#FAF7EE");
  bgGrad.addColorStop(1, "#F4EFE3");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Outer Gold Metallic Border
  ctx.strokeStyle = "#C9A050";
  ctx.lineWidth = 14;
  ctx.strokeRect(28, 28, width - 56, height - 56);

  // 3. Inner Thin Gold Accent Frame
  ctx.strokeStyle = "rgba(201, 160, 80, 0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, width - 84, height - 84);

  // 4. Decorative Corner Brackets
  const pad = 48;
  const bracketLen = 22;
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#C9A050";

  // Top Left
  ctx.beginPath();
  ctx.moveTo(pad - 8, pad + bracketLen);
  ctx.lineTo(pad - 8, pad - 8);
  ctx.lineTo(pad + bracketLen, pad - 8);
  ctx.stroke();

  // Top Right
  ctx.beginPath();
  ctx.moveTo(width - pad + 8 - bracketLen, pad - 8);
  ctx.lineTo(width - pad + 8, pad - 8);
  ctx.lineTo(width - pad + 8, pad + bracketLen);
  ctx.stroke();

  // Bottom Left
  ctx.beginPath();
  ctx.moveTo(pad - 8, height - pad - bracketLen);
  ctx.lineTo(pad - 8, height - pad + 8);
  ctx.lineTo(pad + bracketLen, height - pad + 8);
  ctx.stroke();

  // Bottom Right
  ctx.beginPath();
  ctx.moveTo(width - pad + 8 - bracketLen, height - pad + 8);
  ctx.lineTo(width - pad + 8, height - pad + 8);
  ctx.lineTo(width - pad + 8, height - pad - bracketLen);
  ctx.stroke();

  // 5. Header RBP Logo (public/logo_2.jpg)
  const logoY = 125;
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
    const imgWidth = 240;
    const imgHeight = (logoImg.naturalHeight / logoImg.naturalWidth) * imgWidth;
    ctx.drawImage(
      logoImg,
      width / 2 - imgWidth / 2,
      logoY - imgHeight / 2,
      imgWidth,
      imgHeight
    );
  } else {
    const img = new Image();
    img.src = "/logo_2.jpg";
    if (img.complete && img.naturalWidth > 0) {
      const imgWidth = 240;
      const imgHeight = (img.naturalHeight / img.naturalWidth) * imgWidth;
      ctx.drawImage(
        img,
        width / 2 - imgWidth / 2,
        logoY - imgHeight / 2,
        imgWidth,
        imgHeight
      );
    }
  }
  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 6. Subtitle: A MILESTONE WORTH CELEBRATING
  ctx.fillStyle = "#0C7B83";
  ctx.font = "700 16px 'Inter', sans-serif";
  ctx.letterSpacing = "6px";
  ctx.fillText("A MILESTONE WORTH CELEBRATING", width / 2, 212);

  // Small Gold Dot below header subtitle
  ctx.fillStyle = "#C9A050";
  ctx.beginPath();
  ctx.arc(width / 2, 236, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // 7. Faint Sunburst Rays radiating from behind Years Seal
  ctx.save();
  const rayCenterX = width / 2;
  const rayCenterY = 310;
  ctx.strokeStyle = "rgba(201, 160, 80, 0.14)";
  ctx.lineWidth = 1.5;
  const numRays = 17;
  const startAngle = Math.PI * 0.1;
  const endAngle = Math.PI * 0.9;
  for (let i = 0; i < numRays; i++) {
    const angle = startAngle + (i / (numRays - 1)) * (endAngle - startAngle);
    const length = 250;
    ctx.beginPath();
    ctx.moveTo(rayCenterX, rayCenterY);
    ctx.lineTo(
      rayCenterX + Math.cos(angle) * length,
      rayCenterY + Math.sin(angle) * length
    );
    ctx.stroke();
  }
  ctx.restore();

  // 8. Gold "Years Seal" (Concentric Circular Emblem)
  const sealY = 310;
  // Outer Gold Circle
  ctx.strokeStyle = "#C9A050";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(width / 2, sealY, 66, 0, Math.PI * 2);
  ctx.stroke();

  // Inner Accent Circle
  ctx.strokeStyle = "rgba(201, 160, 80, 0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(width / 2, sealY, 58, 0, Math.PI * 2);
  ctx.stroke();

  // Inside Seal Number
  ctx.fillStyle = "#0F2228";
  ctx.font = "700 48px 'Playfair Display', Georgia, serif";
  ctx.fillText(String(yearsCount), width / 2, sealY - 8);

  // Inside Seal "YEARS" Text
  ctx.fillStyle = "#8C6D2B";
  ctx.font = "700 12px 'Inter', sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText("YEARS", width / 2, sealY + 26);

  // 9. Main Title: Work Anniversary
  ctx.letterSpacing = "0px";
  ctx.fillStyle = "#096B74";
  ctx.font = "italic 700 84px 'Playfair Display', Georgia, serif";
  ctx.fillText("Work Anniversary", width / 2, 425);

  // 10. Tagline: CELEBRATING YEARS OF SHINING TOGETHER
  ctx.fillStyle = "#78716C";
  ctx.font = "600 15px 'Inter', sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText("CELEBRATING YEARS OF SHINING TOGETHER", width / 2, 495);

  // 11. Employee Name
  ctx.letterSpacing = "0px";
  ctx.fillStyle = "#0F2228";
  ctx.font = "700 54px 'Playfair Display', Georgia, serif";
  const nameToDraw = employeeName || "Valued Team Member";
  ctx.fillText(nameToDraw, width / 2, 565);

  // 12. Body Wish Paragraph with dynamic Years in words
  const yearWord = numberToWords(yearsCount);
  const line1Part1 = "For ";
  const line1Highlight = `${yearWord} wonderful years`;
  const line1Part2 = ", you have helped RBP shine brighter. Thank";
  const line2 = "you for your dedication, energy and commitment to our journey. Here's to";
  const line3 = "many more milestones and successes ahead.";

  // Measure Line 1 for centered mixed styling
  ctx.font = "400 21px 'Inter', sans-serif";
  const w1 = ctx.measureText(line1Part1).width;
  ctx.font = "700 21px 'Inter', sans-serif";
  const wH = ctx.measureText(line1Highlight).width;
  ctx.font = "400 21px 'Inter', sans-serif";
  const w2 = ctx.measureText(line1Part2).width;
  const totalW1 = w1 + wH + w2;

  let startX = (width - totalW1) / 2;
  const line1Y = 650;

  ctx.textAlign = "left";
  ctx.fillStyle = "#374151";
  ctx.font = "400 21px 'Inter', sans-serif";
  ctx.fillText(line1Part1, startX, line1Y);
  startX += w1;

  ctx.fillStyle = "#C9A050";
  ctx.font = "700 21px 'Inter', sans-serif";
  ctx.fillText(line1Highlight, startX, line1Y);
  startX += wH;

  ctx.fillStyle = "#374151";
  ctx.font = "400 21px 'Inter', sans-serif";
  ctx.fillText(line1Part2, startX, line1Y);

  // Line 2
  ctx.textAlign = "center";
  ctx.fillStyle = "#374151";
  ctx.font = "400 21px 'Inter', sans-serif";
  ctx.fillText(line2, width / 2, line1Y + 38);

  // Line 3
  ctx.fillText(line3, width / 2, line1Y + 76);

  // 13. Sign-off: With warm wishes, Team RBP
  ctx.fillStyle = "#78716C";
  ctx.font = "400 16px 'Inter', sans-serif";
  ctx.fillText("With warm wishes,", width / 2, 815);

  ctx.fillStyle = "#0F2228";
  ctx.font = "800 20px 'Inter', sans-serif";
  ctx.fillText("Team RBP", width / 2, 845);

  // 14. 3 Emblems (STRONG LEGACY, SERVICE EXCELLENCE, ENGINEERING INNOVATION)
  const emblems = [
    { title: "STRONG LEGACY", x: width / 2 - 230, symbol: "👑" },
    { title: "SERVICE EXCELLENCE", x: width / 2, symbol: "🏆" },
    { title: "ENGINEERING INNOVATION", x: width / 2 + 230, symbol: "⚙️" },
  ];

  const iconY = 965;
  emblems.forEach((emb) => {
    // Outer Gold Ring
    ctx.strokeStyle = "#C9A050";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(emb.x, iconY, 30, 0, Math.PI * 2);
    ctx.stroke();

    // Emblem Badge Fill
    const goldGrad = ctx.createRadialGradient(emb.x - 8, iconY - 8, 4, emb.x, iconY, 28);
    goldGrad.addColorStop(0, "#FBE3AD");
    goldGrad.addColorStop(0.5, "#D4AF37");
    goldGrad.addColorStop(1, "#996515");
    ctx.fillStyle = goldGrad;
    ctx.beginPath();
    ctx.arc(emb.x, iconY, 26, 0, Math.PI * 2);
    ctx.fill();

    // Icon symbol
    ctx.fillStyle = "#3D2600";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emb.symbol, emb.x, iconY);

    // Emblem Text Lines
    ctx.fillStyle = "#0C7B83";
    ctx.font = "700 12px 'Inter', sans-serif";
    ctx.letterSpacing = "1.5px";
    const words = emb.title.split(" ");
    ctx.fillText(words[0], emb.x, iconY + 54);
    if (words[1]) {
      ctx.fillText(words[1], emb.x, iconY + 72);
    }
  });

  // 15. Footer Dot
  ctx.fillStyle = "#C9A050";
  ctx.beginPath();
  ctx.arc(width / 2, 1105, 4, 0, Math.PI * 2);
  ctx.fill();

  // 16. Footer Tagline: COMMITTED TO EMPOWER & SHINE
  ctx.fillStyle = "#0C7B83";
  ctx.font = "700 15px 'Inter', sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText("COMMITTED TO EMPOWER & SHINE", width / 2, 1138);

  // 17. Footer Domain
  ctx.fillStyle = "#78716C";
  ctx.font = "400 14px 'Inter', sans-serif";
  ctx.letterSpacing = "1px";
  ctx.fillText("www.rbpindia.com", width / 2, 1168);
};

export default function WorkAnniversary() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming"); // 'upcoming', 'today'

  // Selected Employee Modal state
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [customName, setCustomName] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [customYears, setCustomYears] = useState(1);
  const [sending, setSending] = useState(false);

  const canvasRef = useRef(null);
  const [cardPreviewUrl, setCardPreviewUrl] = useState(null);

  // History state
  const [wishHistory, setWishHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("joining")
        .select("*")
        .eq("status", "Active");

      if (fetchErr) throw fetchErr;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentYear = today.getFullYear();

      const processed = (data || []).map((emp) => {
        const doj = parseDateString(emp.date_of_joining);
        if (!doj) return null;

        const dojMonth = doj.getMonth();
        const dojDate = doj.getDate();

        let nextAnniv = new Date(currentYear, dojMonth, dojDate);
        nextAnniv.setHours(0, 0, 0, 0);

        let isToday = false;
        let remainingDays = 0;

        if (dojMonth === today.getMonth() && dojDate === today.getDate()) {
          isToday = true;
          remainingDays = 0;
        } else {
          if (nextAnniv < today) {
            nextAnniv.setFullYear(currentYear + 1);
          }
          const diffTime = nextAnniv - today;
          remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // Calculate completed years
        let yearsCompleted = today.getFullYear() - doj.getFullYear();
        const mDiff = today.getMonth() - doj.getMonth();
        if (mDiff < 0 || (mDiff === 0 && today.getDate() < doj.getDate())) {
          yearsCompleted--;
        }
        yearsCompleted = Math.max(1, yearsCompleted);

        return {
          id: emp.id,
          employeeId: emp.rbp_joining_id || "",
          punchId: emp.punch_id || "",
          name: emp.name_as_per_aadhar || "",
          designation: emp.designation || "Employee",
          department: emp.department || "General",
          employeeCategory: emp.employee_category || "Unassigned",
          photo: emp.aadhar_front_photo || "",
          dateOfJoining: doj,
          yearsCompleted,
          isToday,
          remainingDays,
          nextAnniversaryDate: nextAnniv,
          mobileNumber: emp.mobile_number || "",
          familyNumber: emp.family_number || "",
          familyPersonName: emp.family_person_name || "",
          familyRelationship: emp.family_relationship || "",
        };
      }).filter(Boolean);

      setEmployees(processed);
    } catch (err) {
      console.error("Error fetching employee joining records:", err);
      setError(err.message || "Failed to load employee work anniversary records.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Wish History from `work_anniversary_wish` table
  const fetchWishHistory = async () => {
    try {
      setHistoryLoading(true);
      const { data, error: fetchErr } = await supabase
        .from("work_anniversary_wish")
        .select("*")
        .order("timestamp", { ascending: false });

      if (fetchErr) {
        // Fallback to birthday_wish table if work_anniversary_wish doesn't exist yet
        const { data: bData } = await supabase
          .from("birthday_wish")
          .select("*")
          .order("timestamp", { ascending: false });
        setWishHistory(bData || []);
      } else {
        setWishHistory(data || []);
      }
    } catch (err) {
      console.error("Error fetching anniversary history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const deleteHistoryRecord = async (id) => {
    if (!window.confirm("Are you sure you want to delete this anniversary wish record?")) return;
    try {
      const { error: delErr } = await supabase.from("work_anniversary_wish").delete().eq("id", id);
      if (delErr) {
        await supabase.from("birthday_wish").delete().eq("id", id);
      }
      toast.success("Anniversary wish record deleted");
      fetchWishHistory();
    } catch (err) {
      toast.error(err.message || "Failed to delete record");
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchWishHistory();
  }, []);

  // When selectedEmp changes, render the card canvas and generate data URL
  useEffect(() => {
    if (selectedEmp) {
      const logoImg = new Image();
      logoImg.src = "/logo_2.jpg";

      const renderCard = () => {
        if (canvasRef.current) {
          drawWorkAnniversaryCardCanvas(canvasRef.current, customName || selectedEmp.name, customYears, logoImg);
          const dataUrl = canvasRef.current.toDataURL("image/png");
          setCardPreviewUrl(dataUrl);
        }
      };

      if (logoImg.complete && logoImg.naturalWidth > 0) {
        renderCard();
      } else {
        logoImg.onload = renderCard;
        setTimeout(renderCard, 150);
      }
    } else {
      setCardPreviewUrl(null);
    }
  }, [selectedEmp, customName, customYears]);

  const departmentsList = useMemo(() => {
    const depts = employees.map((e) => e.department).filter(Boolean);
    return Array.from(new Set(depts)).sort();
  }, [employees]);

  const categoriesList = useMemo(() => {
    const cats = employees.map((e) => e.employeeCategory).filter(Boolean);
    return Array.from(new Set(cats)).sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        searchTerm === "" ||
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.designation.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDept = selectedDept === "" || emp.department === selectedDept;
      const matchesCategory = selectedCategory === "" || emp.employeeCategory === selectedCategory;

      if (!matchesSearch || !matchesDept || !matchesCategory) return false;

      if (activeTab === "today") return emp.isToday;
      return emp.remainingDays >= 0 && emp.remainingDays <= 15;
    });
  }, [employees, searchTerm, selectedDept, selectedCategory, activeTab]);

  const historyFiltered = useMemo(() => {
    if (!historySearch.trim()) return wishHistory;
    const q = historySearch.toLowerCase();
    return wishHistory.filter(
      (item) =>
        (item.employee_name && item.employee_name.toLowerCase().includes(q)) ||
        (item.mobile_number && item.mobile_number.includes(q)) ||
        (item.sent_by && item.sent_by.toLowerCase().includes(q))
    );
  }, [wishHistory, historySearch]);

  const todayAnniversariesCount = useMemo(() => {
    return employees.filter((e) => e.isToday).length;
  }, [employees]);

  const upcomingAnniversariesCount = useMemo(() => {
    return employees.filter((e) => e.remainingDays >= 0 && e.remainingDays <= 15).length;
  }, [employees]);

  const openWishModal = (emp) => {
    setSelectedEmp(emp);
    setCustomName(emp.name);
    setCustomYears(emp.yearsCompleted || 1);
    setCustomMessage(
      `🎉 Happy Work Anniversary, ${emp.name}!\n${emp.yearsCompleted || 1} years of shining together — thank you for your dedication, energy and commitment to RBP.\nHere’s to many more milestones ahead.\nWarm wishes, Team RBP — Committed to Empower & Shine`
    );
  };

  const closeWishModal = () => {
    setSelectedEmp(null);
    setCardPreviewUrl(null);
  };

  // Upload canvas image to Supabase storage
  const uploadCanvasToStorage = async (employeeName) => {
    if (!canvasRef.current) return null;
    return new Promise((resolve) => {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        try {
          const cleanName = (employeeName || "employee").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
          let fileName = `anniversary_${cleanName}_${Date.now()}.png`;

          let { error: upErr } = await supabase.storage
            .from("birthday-wishes")
            .upload(fileName, blob, { contentType: "image/png", upsert: true });

          let targetBucket = "birthday-wishes";

          if (upErr) {
            fileName = `anniversary/${fileName}`;
            const { error: fbErr } = await supabase.storage
              .from("joining-documents")
              .upload(fileName, blob, { contentType: "image/png", upsert: true });

            if (!fbErr) {
              targetBucket = "joining-documents";
            } else {
              console.error("Storage upload failed:", fbErr);
              resolve(null);
              return;
            }
          }

          const { data } = supabase.storage.from(targetBucket).getPublicUrl(fileName);
          resolve(data?.publicUrl || null);
        } catch (err) {
          console.error("Error uploading card canvas:", err);
          resolve(null);
        }
      }, "image/png");
    });
  };

  // Save wish log to database
  const saveWishToDatabase = async (recipientPhone, recipientName, empCode, msgText, imageUrl, years) => {
    try {
      const payload = {
        employee_name: recipientName,
        employee_code: empCode || "",
        mobile_number: recipientPhone,
        joining_date: selectedEmp?.dateOfJoining ? formatDisplayDate(selectedEmp.dateOfJoining) : "",
        years_completed: years,
        wish_date: new Date().toISOString().split("T")[0],
        message: msgText,
        image_url: imageUrl,
        template_name: "work_anniversary_wish",
        sent_by: "WhatsApp",
        timestamp: new Date().toISOString(),
      };

      const { error: insertErr } = await supabase.from("work_anniversary_wish").insert([payload]);
      if (insertErr) {
        // Fallback to birthday_wish if table doesn't exist
        await supabase.from("birthday_wish").insert([payload]);
      }
      fetchWishHistory();
    } catch (err) {
      console.error("Error logging anniversary wish:", err);
    }
  };

  // Send Work Anniversary Wish (Edge Function call)
  const sendWish = async () => {
    if (!selectedEmp) return;

    let targetNumber = selectedEmp.mobileNumber || selectedEmp.familyNumber;

    if (!targetNumber || String(targetNumber).trim().toUpperCase() === "NA" || String(targetNumber).trim().toUpperCase() === "N/A") {
      toast.error("Employee mobile number is missing or invalid!");
      return;
    }

    setSending(true);

    try {
      let uploadedImageUrl = null;
      toast.loading("Generating high-resolution Work Anniversary Card...", { id: "sendProgress" });

      uploadedImageUrl = await uploadCanvasToStorage(customName);

      toast.loading("Sending Meta WhatsApp Work Anniversary Wish...", { id: "sendProgress" });

      const templateName = "work_anniversary_wish";

      const payload = {
        phone: targetNumber,
        name: customName,
        years: String(customYears),
        message: customMessage,
        templateName: templateName,
        languageCode: "en_US",
        imageUrl: uploadedImageUrl,
      };

      const response = await supabase.functions.invoke("send-work-anniversary-wish", {
        body: payload,
      });

      if (response.error) {
        let errMessage = response.error.message;
        try {
          if (response.error.context) {
            const ctxBody = await response.error.context.json();
            if (ctxBody && ctxBody.error) {
              errMessage = ctxBody.error;
            }
          }
        } catch (e) { }
        throw new Error(errMessage || "Failed to invoke send-work-anniversary-wish function.");
      }

      await saveWishToDatabase(targetNumber, customName, selectedEmp.employeeId, customMessage, uploadedImageUrl, customYears);

      toast.success(`Work Anniversary Wish sent successfully to ${customName}!`, { id: "sendProgress" });
      closeWishModal();
    } catch (err) {
      console.error("Error in sendWish:", err);
      toast.error(err.message || "Could not send Work Anniversary wish via WhatsApp.", { id: "sendProgress" });
    } finally {
      setSending(false);
    }
  };

  // Download Card as PNG
  const downloadCardImage = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `Work_Anniversary_${(customName || "Card").replace(/[^a-zA-Z0-9]/g, "_")}.png`;
    link.href = dataUrl;
    link.click();
    toast.success("Card downloaded successfully!");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-600 p-6 md:p-8 text-white shadow-xl shadow-amber-900/10">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-100 text-xs font-semibold">
              <Award className="w-4 h-4 text-amber-200" />
              <span>Employee Work Anniversary Portal</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              Work Anniversary Wishes 🏅
            </h1>
            <p className="text-amber-100/90 text-sm max-w-xl">
              Celebrate employee milestones and send custom branded Work Anniversary greetings with dynamic years completed.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[110px]">
              <span className="block text-2xl font-bold">{todayAnniversariesCount}</span>
              <span className="text-xs text-amber-100">Today's Milestone</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[110px]">
              <span className="block text-2xl font-bold">{upcomingAnniversariesCount}</span>
              <span className="text-xs text-amber-100">Next 15 Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Control Bar */}
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          {/* Tab Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition flex items-center justify-center gap-1.5 ${activeTab === "upcoming"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Upcoming 15 Days ({upcomingAnniversariesCount})</span>
            </button>
            <button
              onClick={() => setActiveTab("today")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition flex items-center justify-center gap-1.5 ${activeTab === "today"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <PartyPopper className="w-4 h-4" />
              <span>Today ({todayAnniversariesCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter By:</span>
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">All Departments ({departmentsList.length})</option>
            {departmentsList.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">All Categories ({categoriesList.length})</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {(selectedDept || selectedCategory || searchTerm) && (
            <button
              onClick={() => {
                setSelectedDept("");
                setSelectedCategory("");
                setSearchTerm("");
              }}
              className="text-amber-600 hover:underline font-semibold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Employee List Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-slate-500">Loading employee work anniversary records...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-semibold text-rose-800">{error}</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Award className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-700">No Work Anniversary Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No active employee records matched your filter criteria or search keyword.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className={`relative bg-white rounded-2xl p-5 border transition duration-200 hover:shadow-md flex flex-col justify-between ${emp.isToday
                  ? "border-amber-400 ring-2 ring-amber-400/20 bg-gradient-to-b from-amber-50/40 to-white"
                  : "border-slate-200/80 hover:border-amber-200"
                }`}
            >
              {/* Card Header Tag */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {emp.department}
                </span>

                {emp.isToday ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                    <Sparkles className="w-3 h-3" /> Today's Anniversary!
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {emp.remainingDays} Days Left
                  </span>
                )}
              </div>

              {/* Employee Avatar & Details */}
              <div className="flex items-start gap-3 mb-4">
                {emp.photo ? (
                  <img
                    src={emp.photo}
                    alt={emp.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-amber-100 shadow-sm"
                  />
                ) : (
                  <InitialAvatar name={emp.name} size="w-14 h-14 text-lg" />
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm truncate" title={emp.name}>
                    {emp.name}
                  </h4>
                  <p className="text-xs text-slate-500 truncate" title={emp.designation}>
                    {emp.designation}
                  </p>
                  <p className="text-[11px] font-medium text-amber-700 mt-1">
                    ID: {emp.employeeId || "N/A"}
                  </p>
                </div>
              </div>

              {/* Joining Date & Completed Years */}
              <div className="bg-slate-50 rounded-xl p-2.5 mb-4 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" /> Date of Joining:
                  </span>
                  <span className="font-bold text-slate-700">
                    {formatDisplayDate(emp.dateOfJoining)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Award className="w-3.5 h-3.5 text-amber-600" /> Completed Tenure:
                  </span>
                  <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                    {emp.yearsCompleted} {emp.yearsCompleted === 1 ? "Year" : "Years"}
                  </span>
                </div>
              </div>

              {/* Send Button */}
              <button
                onClick={() => openWishModal(emp)}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition duration-200 ${emp.isToday
                    ? "bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white shadow-md shadow-amber-500/20"
                    : "bg-slate-800 hover:bg-slate-900 text-white"
                  }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Create & Send Anniversary Wish</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden Working Canvas */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Modal Popup for Preview & Sending */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-yellow-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                  <Award className="w-6 h-6 text-amber-200" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Send Work Anniversary Wish</h3>
                  <p className="text-xs text-amber-100/90">
                    Preview branded anniversary card & customize WhatsApp message payload.
                  </p>
                </div>
              </div>

              <button
                onClick={closeWishModal}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Grid */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[80vh] overflow-y-auto">
              {/* Left Column: Image Canvas Preview */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-600" /> Generated Branded Card:
                  </span>
                  <button
                    onClick={downloadCardImage}
                    className="text-amber-700 hover:text-amber-800 flex items-center gap-1 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PNG
                  </button>
                </div>

                <div className="relative bg-slate-100 rounded-2xl border border-slate-200 p-3 flex items-center justify-center min-h-[420px] shadow-inner">
                  {cardPreviewUrl ? (
                    <img
                      src={cardPreviewUrl}
                      alt="Work Anniversary Card Preview"
                      className="max-h-[460px] w-auto rounded-xl object-contain shadow-md border border-slate-200"
                    />
                  ) : (
                    <div className="text-center space-y-2">
                      <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-xs text-slate-500 font-medium">Rendering Canvas Card...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Customization Controls */}
              {(() => {
                const targetNumber = selectedEmp.mobileNumber || selectedEmp.familyNumber || "";
                const hasNumber =
                  targetNumber &&
                  String(targetNumber).trim() !== "" &&
                  String(targetNumber).trim().toUpperCase() !== "NA" &&
                  String(targetNumber).trim().toUpperCase() !== "N/A";

                return (
                  <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Recipient Contact Box */}
                      <div
                        className={`p-3.5 rounded-2xl text-xs space-y-1.5 transition ${!hasNumber
                            ? "bg-red-50/90 border-2 border-red-400 text-red-900 shadow-md animate-pulse"
                            : "bg-amber-50/80 border border-amber-200 text-amber-900"
                          }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>Send WhatsApp To:</span>
                          <span className="font-mono text-xs">
                            {hasNumber ? targetNumber : "NOT AVAILABLE"}
                          </span>
                        </div>

                        {!hasNumber && (
                          <div className="mt-1 pt-1 border-t border-red-200 text-[11px] font-bold text-red-700 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>⚠️ Employee Mobile Number is Missing / Not Available!</span>
                          </div>
                        )}
                      </div>

                      {/* Employee Name & Years Edit */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Employee Name
                          </label>
                          <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            disabled
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Completed Years (Seal)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            disabled
                            value={customYears}
                            onChange={(e) => setCustomYears(parseInt(e.target.value, 10) || 1)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      {/* Custom WhatsApp Message */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          WhatsApp Message Text
                        </label>
                        <textarea
                          rows="6"
                          value={customMessage}
                          disabled
                          onChange={(e) => setCustomMessage(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none bg-slate-50"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={closeWishModal}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={sendWish}
                        disabled={sending || !hasNumber}
                        className={`flex-1 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition duration-200 ${!hasNumber
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none"
                            : sending
                              ? "opacity-75 cursor-not-allowed bg-amber-600 text-white"
                              : "bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white shadow-md shadow-amber-200"
                          }`}
                        title={!hasNumber ? "Cannot send wish: Mobile number is missing" : "Send WhatsApp Work Anniversary Wish"}
                      >
                        {sending ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Sending Image & Message...</span>
                          </div>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Wish (Image + Text)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Sent Work Anniversary Wishes Log Table */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <History className="w-5 h-5 text-amber-600" />
              <span>Sent Work Anniversary Wishes Log</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical record of sent work anniversary wishes and uploaded card images.
            </p>
          </div>

          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search wish log..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {historyLoading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading wish history...</div>
        ) : historyFiltered.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No sent anniversary wish logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Joining Date / Tenure</th>
                  <th className="py-3 px-4">Card Image</th>
                  <th className="py-3 px-4">Sent Via / Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyFiltered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {row.employee_name || "N/A"}
                      <span className="block text-[10px] font-normal text-slate-400">
                        {row.employee_code || ""}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {row.mobile_number || "N/A"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700">
                        {row.joining_date || "N/A"}
                      </span>
                      {row.years_completed && (
                        <span className="ml-2 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {row.years_completed} Yrs
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {row.image_url ? (
                        <a
                          href={row.image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200 text-[10px] transition"
                        >
                          <Eye className="w-3 h-3" /> View Card
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[10px]">No Image</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                        {row.sent_by || "WhatsApp"}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        {row.timestamp ? new Date(row.timestamp).toLocaleString() : row.wish_date || ""}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => deleteHistoryRecord(row.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete log entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
