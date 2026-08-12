import React, { useEffect, useState, useMemo, useRef } from "react";
import { Search, Filter, Cake, Gift, Users, Calendar, MessageSquare, Send, X, ChevronLeft, ChevronRight, Sparkles, Mail, AlertCircle,Clock,PartyPopper,History,Trash2,CheckCircle2,Download,Image as ImageIcon,Eye,Share2, Award
} from "lucide-react";
import toast from "react-hot-toast";
import supabase from "../utils/supabase";
import WorkAnniversary from "./WorkAnniversary";

// Robust DOB parsing supporting DD/MM/YYYY, YYYY-MM-DD, and ISO strings
const parseDOB = (dobStr) => {
  if (!dobStr) return null;
  if (dobStr instanceof Date) return dobStr;

  const str = String(dobStr).trim();
  
  // Format: DD/MM/YYYY or D/M/YYYY
  const slashParts = str.split('/');
  if (slashParts.length === 3) {
    const day = parseInt(slashParts[0], 10);
    const month = parseInt(slashParts[1], 10) - 1; // 0-indexed month
    const year = parseInt(slashParts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const fullYear = year < 100 ? (year > 30 ? 1900 + year : 2000 + year) : year;
      return new Date(fullYear, month, day);
    }
  }

  // Format: YYYY-MM-DD or DD-MM-YYYY
  const hyphenParts = str.split('-');
  if (hyphenParts.length === 3) {
    if (hyphenParts[0].length === 4) {
      // YYYY-MM-DD
      const year = parseInt(hyphenParts[0], 10);
      const month = parseInt(hyphenParts[1], 10) - 1;
      const day = parseInt(hyphenParts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    } else {
      // DD-MM-YYYY
      const day = parseInt(hyphenParts[0], 10);
      const month = parseInt(hyphenParts[1], 10) - 1;
      const year = parseInt(hyphenParts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const fullYear = year < 100 ? (year > 30 ? 1900 + year : 2000 + year) : year;
        return new Date(fullYear, month, day);
      }
    }
  }

  // Fallback to standard JS parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
};

// Formats date into a nice string: "15 Jul 1995"
const formatBdayDate = (dateObj) => {
  if (!dateObj) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = dateObj.getDate();
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}`;
};

// Formats birthday month/day only: "15 July"
const formatBdayShort = (dateObj) => {
  if (!dateObj) return "";
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const day = dateObj.getDate();
  const month = months[dateObj.getMonth()];
  
  const j = day % 10, k = day % 100;
  let suffix = "th";
  if (j === 1 && k !== 11) suffix = "st";
  else if (j === 2 && k !== 12) suffix = "nd";
  else if (j === 3 && k !== 13) suffix = "rd";
  
  return `${day}${suffix} ${month}`;
};

// Helper for generating initial-based avatars
const InitialAvatar = ({ name, size = "w-16 h-16 text-xl" }) => {
  const initials = name
    ? name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "EE";
  
  const gradients = [
    "from-pink-500 to-rose-500",
    "from-purple-500 to-indigo-500",
    "from-teal-500 to-emerald-500",
    "from-blue-500 to-indigo-600",
    "from-orange-500 to-amber-500",
  ];
  
  const charSum = name ? name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
  const gradient = gradients[charSum % gradients.length];

  return (
    <div className={`${size} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold shadow-inner ring-4 ring-white/60`}>
      {initials}
    </div>
  );
};

// Draws high-definition 1000x1300 RBP Birthday Card matching exact template image
const drawBirthdayCardCanvas = (canvas, employeeName, logoImg = null) => {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = 1000;
  const height = 1300;
  canvas.width = width;
  canvas.height = height;

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, "#FAF7EE");
  bgGrad.addColorStop(1, "#F4EFE3");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Outer Gold Metallic Border
  ctx.strokeStyle = "#C9A050";
  ctx.lineWidth = 14;
  ctx.strokeRect(28, 28, width - 56, height - 56);

  // Inner Thin Gold Accent Frame
  ctx.strokeStyle = "rgba(201, 160, 80, 0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, width - 84, height - 84);

  // Decorative Corner Brackets
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

  // Faint Sunburst Light Rays radiating down
  ctx.save();
  const rayCenterX = width / 2;
  const rayCenterY = 280;
  ctx.strokeStyle = "rgba(201, 160, 80, 0.14)";
  ctx.lineWidth = 1.5;
  const numRays = 15;
  const startAngle = Math.PI * 0.12;
  const endAngle = Math.PI * 0.88;
  for (let i = 0; i < numRays; i++) {
    const angle = startAngle + (i / (numRays - 1)) * (endAngle - startAngle);
    const length = 230;
    ctx.beginPath();
    ctx.moveTo(rayCenterX, rayCenterY);
    ctx.lineTo(
      rayCenterX + Math.cos(angle) * length,
      rayCenterY + Math.sin(angle) * length
    );
    ctx.stroke();
  }
  ctx.restore();

  // RBP Logo Image (from public/logo_2.jpg)
  const logoY = 145;
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

  // Reset alignment for header text elements
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Header Subtitle: TEAM RBP CELEBRATES YOU
  ctx.fillStyle = "#0C7B83";
  ctx.font = "700 16px 'Inter', sans-serif";
  ctx.letterSpacing = "6px";
  ctx.fillText("TEAM RBP CELEBRATES YOU", width / 2, 252);

  // Small Gold Dot below header tagline
  ctx.fillStyle = "#C9A050";
  ctx.beginPath();
  ctx.arc(width / 2, 285, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Heading: Happy Birthday
  ctx.letterSpacing = "0px";
  ctx.fillStyle = "#096B74";
  ctx.font = "italic 700 84px 'Playfair Display', Georgia, serif";
  ctx.fillText("Happy Birthday", width / 2, 365);

  // Sub-heading: WISHING A WONDERFUL YEAR TO
  ctx.fillStyle = "#78716C";
  ctx.font = "600 15px 'Inter', sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText("WISHING A WONDERFUL YEAR TO", width / 2, 445);

  // Employee Name
  ctx.letterSpacing = "0px";
  ctx.fillStyle = "#0F2228";
  ctx.font = "700 54px 'Playfair Display', Georgia, serif";
  const nameToDraw = employeeName || "Valued Team Member";
  ctx.fillText(nameToDraw, width / 2, 520);

  // Body Wish Text
  const line1Part1 = "May the year ahead ";
  const line1Highlight = "shine";
  const line1Part2 = " as brightly as the energy you bring to RBP";
  const line2 = "every single day. Thank you for being a valued part of our journey —";
  const line3 = "here's to your health, happiness and continued success.";

  // Measure Line 1 for centered mixed styling
  ctx.font = "400 21px 'Inter', sans-serif";
  const w1 = ctx.measureText(line1Part1).width;
  ctx.font = "700 21px 'Inter', sans-serif";
  const wH = ctx.measureText(line1Highlight).width;
  ctx.font = "400 21px 'Inter', sans-serif";
  const w2 = ctx.measureText(line1Part2).width;
  const totalW1 = w1 + wH + w2;

  let startX = (width - totalW1) / 2;
  const line1Y = 605;

  ctx.textAlign = "left";
  ctx.fillStyle = "#374151";
  ctx.font = "400 21px 'Inter', sans-serif";
  ctx.fillText(line1Part1, startX, line1Y);

  startX += w1;
  ctx.fillStyle = "#D97706";
  ctx.font = "700 21px 'Inter', sans-serif";
  ctx.fillText(line1Highlight, startX, line1Y);

  startX += wH;
  ctx.fillStyle = "#374151";
  ctx.font = "400 21px 'Inter', sans-serif";
  ctx.fillText(line1Part2, startX, line1Y);

  // Line 2 & Line 3
  ctx.textAlign = "center";
  ctx.fillText(line2, width / 2, 645);
  ctx.fillText(line3, width / 2, 685);

  // Sign-off
  ctx.fillStyle = "#6B7280";
  ctx.font = "400 16px 'Inter', sans-serif";
  ctx.fillText("With warm wishes,", width / 2, 765);

  ctx.fillStyle = "#0F383E";
  ctx.font = "800 20px 'Inter', sans-serif";
  ctx.fillText("Team RBP", width / 2, 796);

  // Bottom Emblems (STRONG LEGACY, SERVICE EXCELLENCE, ENGINEERING INNOVATION)
  const iconY = 965;
  const emblems = [
    { x: 300, line1: "STRONG", line2: "LEGACY", type: "legacy" },
    { x: 500, line1: "SERVICE", line2: "EXCELLENCE", type: "service" },
    { x: 700, line1: "ENGINEERING", line2: "INNOVATION", type: "innovation" },
  ];

  emblems.forEach((emb) => {
    const rad = 35;
    const gGrad = ctx.createRadialGradient(
      emb.x - 10,
      iconY - 10,
      5,
      emb.x,
      iconY,
      rad
    );
    gGrad.addColorStop(0, "#FEF3C7");
    gGrad.addColorStop(0.3, "#F59E0B");
    gGrad.addColorStop(0.8, "#D97706");
    gGrad.addColorStop(1, "#78350F");

    ctx.save();
    ctx.fillStyle = gGrad;
    ctx.beginPath();
    ctx.arc(emb.x, iconY, rad, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#FEF3C7";
    ctx.lineWidth = 2;

    if (emb.type === "legacy") {
      ctx.beginPath();
      ctx.arc(emb.x, iconY, 19, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(emb.x, iconY, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#FEF3C7";
      ctx.beginPath();
      ctx.arc(emb.x, iconY, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (emb.type === "service") {
      const sGrad = ctx.createRadialGradient(
        emb.x - 12,
        iconY - 12,
        2,
        emb.x,
        iconY,
        rad
      );
      sGrad.addColorStop(0, "#FFFFFF");
      sGrad.addColorStop(0.4, "#FBBF24");
      sGrad.addColorStop(1, "#92400E");
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(emb.x, iconY, rad - 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (emb.type === "innovation") {
      ctx.translate(emb.x, iconY);
      const teeth = 8;
      ctx.fillStyle = "#FEF3C7";
      for (let t = 0; t < teeth; t++) {
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-4.5, -27, 9, 8);
      }
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.strokeStyle = "#78350F";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = "#0C7B83";
    ctx.font = "700 12px 'Inter', sans-serif";
    ctx.letterSpacing = "1.5px";
    ctx.fillText(emb.line1, emb.x, iconY + 56);
    ctx.fillText(emb.line2, emb.x, iconY + 74);
  });

  // Footer Dot
  ctx.fillStyle = "#C9A050";
  ctx.beginPath();
  ctx.arc(width / 2, 1115, 4, 0, Math.PI * 2);
  ctx.fill();

  // Footer Tagline
  ctx.fillStyle = "#0C7B83";
  ctx.font = "700 15px 'Inter', sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText("COMMITTED TO EMPOWER & SHINE", width / 2, 1148);

  // Footer Domain
  ctx.fillStyle = "#78716C";
  ctx.font = "400 14px 'Inter', sans-serif";
  ctx.letterSpacing = "1px";
  ctx.fillText("www.rbpindia.com", width / 2, 1178);
};

function BirthdayWishContent() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Pagination for upcoming birthdays
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modal State
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("official");
  const [confettiActive, setConfettiActive] = useState(false);
  const [sending, setSending] = useState(false);
  const [cardPreviewUrl, setCardPreviewUrl] = useState(null);
  const [activeTab, setActiveTab] = useState("card"); // 'card' or 'text'

  const canvasRef = useRef(null);

  // Wish History State (`birthday_wish` table)
  const [wishHistory, setWishHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  // Templates definition
  const messageTemplates = {
    official: (name) => `Happy Birthday, ${name}!
On your special day, the entire Team RBP wishes you joy, good health and a year that shines as bright as the energy you bring every day. Thank you for being part of our journey.
Warm wishes, Team RBP — Committed to Empower & Shine`,
    simple: (name) => `On behalf of the *RBP Group*, we extend our warmest wishes to you on your special day. May this birthday bring you good health, happiness, success, and many new opportunities in the year ahead. We truly appreciate your dedication and valuable contributions to our organization, and we wish you continued growth and achievement. Have a wonderful birthday and a fantastic year ahead!`,
    professional: (name) => `Wishing you a very Happy Birthday on behalf of the entire team! Thank you for your hard work and dedication. May this year bring you continued success, good health, and happiness. Have a wonderful day!`,
    warm: (name) => `Happy Birthday, Wishing you a day filled with laughter, joy, and all your favorite things. We are so glad to have you in our team. Have an amazing year ahead!`,
    creative: (name) => `Cheers to another fantastic trip around the sun! May your special day be as bright, inspiring, and awesome as you are to work with. Have a blast celebrating!`,
  };

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
        const dob = parseDOB(emp.date_of_birth);
        if (!dob) return null;

        const bdayMonth = dob.getMonth();
        const bdayDate = dob.getDate();

        let nextBday = new Date(currentYear, bdayMonth, bdayDate);
        nextBday.setHours(0, 0, 0, 0);

        let isToday = false;
        let remainingDays = 0;

        if (bdayMonth === today.getMonth() && bdayDate === today.getDate()) {
          isToday = true;
          remainingDays = 0;
        } else {
          if (nextBday < today) {
            nextBday.setFullYear(currentYear + 1);
          }
          const diffTime = nextBday - today;
          remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        let currentAge = today.getFullYear() - dob.getFullYear();
        const mDiff = today.getMonth() - dob.getMonth();
        if (mDiff < 0 || (mDiff === 0 && today.getDate() < dob.getDate())) {
          currentAge--;
        }

        const nextAge = nextBday.getFullYear() - dob.getFullYear();

        return {
          id: emp.id,
          employeeId: emp.rbp_joining_id || "",
          punchId: emp.punch_id || "",
          name: emp.name_as_per_aadhar || "",
          designation: emp.designation || "Employee",
          department: emp.department || "General",
          employeeCategory: emp.employee_category || "Unassigned",
          photo: emp.aadhar_front_photo || "",
          dateOfBirth: dob,
          isToday,
          remainingDays,
          currentAge,
          nextAge,
          nextBirthdayDate: nextBday,
          mobileNumber: emp.mobile_number || "",
          familyNumber: emp.family_number || "",
          familyPersonName: emp.family_person_name || "",
          familyRelationship: emp.family_relationship || "",
        };
      }).filter(Boolean);

      setEmployees(processed);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError(err.message || "Failed to load employee birthday records.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Wish History from `birthday_wish` table
  const fetchWishHistory = async () => {
    try {
      setHistoryLoading(true);
      const { data, error: fetchErr } = await supabase
        .from("birthday_wish")
        .select("*")
        .order("timestamp", { ascending: false });

      if (fetchErr) {
        console.warn("birthday_wish table fetch notice:", fetchErr.message);
      } else {
        setWishHistory(data || []);
      }
    } catch (err) {
      console.error("Error fetching birthday_wish history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Save Sent Wish to `birthday_wish` table
  const saveWishToDatabase = async (emp, phone, wishMessage, imageUrl = null, templateName = "new_emp_birthday_wish") => {
    try {
      const payload = {
        employee_name: emp.name,
        employee_code: emp.employeeId,
        mobile_number: phone,
        wish_date: new Date().toISOString().split("T")[0],
        message: wishMessage,
        image_url: imageUrl,
        template_name: templateName,
        sent_by: "WhatsApp",
        timestamp: new Date().toISOString(),
      };

      const { error: insertErr } = await supabase.from("birthday_wish").insert([payload]);
      if (insertErr) {
        console.error("Error inserting into birthday_wish table:", insertErr);
      } else {
        fetchWishHistory();
      }
    } catch (err) {
      console.error("Failed to log birthday wish to database:", err);
    }
  };

  const deleteWishLog = async (id) => {
    if (!confirm("Are you sure you want to delete this wish record?")) return;
    try {
      const { error: delErr } = await supabase.from("birthday_wish").delete().eq("id", id);
      if (delErr) throw delErr;
      toast.success("Wish record deleted");
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
          drawBirthdayCardCanvas(canvasRef.current, selectedEmp.name, logoImg);
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
  }, [selectedEmp]);

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

      return matchesSearch && matchesDept && matchesCategory;
    });
  }, [employees, searchTerm, selectedDept, selectedCategory]);

  const todaysBirthdays = useMemo(() => {
    return filteredEmployees.filter((emp) => emp.isToday);
  }, [filteredEmployees]);

  const upcomingBirthdays = useMemo(() => {
    return filteredEmployees
      .filter((emp) => !emp.isToday && emp.remainingDays <= 15)
      .sort((a, b) => a.remainingDays - b.remainingDays);
  }, [filteredEmployees]);

  const filteredHistory = useMemo(() => {
    return wishHistory.filter((item) => {
      if (!historySearch) return true;
      const term = historySearch.toLowerCase();
      return (
        item.employee_name?.toLowerCase().includes(term) ||
        item.employee_code?.toLowerCase().includes(term) ||
        item.mobile_number?.toLowerCase().includes(term) ||
        item.wish_date?.toLowerCase().includes(term)
      );
    });
  }, [wishHistory, historySearch]);

  const totalPages = Math.ceil(upcomingBirthdays.length / itemsPerPage);
  const paginatedUpcoming = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return upcomingBirthdays.slice(startIdx, startIdx + itemsPerPage);
  }, [upcomingBirthdays, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDept, selectedCategory]);

  const openWishModal = (emp) => {
    setSelectedEmp(emp);
    setSelectedTemplate("official");
    setMessage(messageTemplates.official(emp.name));
    setActiveTab("card");
  };



  // Helper to upload canvas to Supabase Storage
  const uploadCanvasToStorage = async (canvas, employeeName) => {
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        try {
          const cleanName = (employeeName || "employee").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
          let fileName = `bday_${cleanName}_${Date.now()}.png`;

          // Attempt upload to 'birthday-wishes' bucket
          let { error: upErr } = await supabase.storage
            .from("birthday-wishes")
            .upload(fileName, blob, { contentType: "image/png", upsert: true });

          let targetBucket = "birthday-wishes";

          if (upErr) {
            console.warn("birthday-wishes bucket upload note:", upErr.message);
            // Fallback to joining-documents bucket
            fileName = `birthday/${fileName}`;
            const { error: fbErr } = await supabase.storage
              .from("joining-documents")
              .upload(fileName, blob, { contentType: "image/png", upsert: true });

            if (!fbErr) {
              targetBucket = "joining-documents";
            } else {
              console.error("Storage upload failed on both buckets:", fbErr);
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

  // Download Card Image as PNG
  const downloadCardImage = () => {
    if (!canvasRef.current || !selectedEmp) return;
    const link = document.createElement("a");
    const cleanName = selectedEmp.name.replace(/[^a-zA-Z0-9]/g, "_");
    link.download = `RBP_Birthday_Wish_${cleanName}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    toast.success("Birthday Card Image downloaded!");
  };

  const sendWish = async () => {
    if (!selectedEmp) return;
    
    const targetPhone = selectedEmp.mobileNumber && selectedEmp.mobileNumber.trim() !== ""
      ? selectedEmp.mobileNumber.trim()
      : selectedEmp.familyNumber && selectedEmp.familyNumber.trim() !== ""
        ? selectedEmp.familyNumber.trim()
        : null;

    if (!targetPhone) {
      toast.error("No contact number (Personal or Family) found for this employee!");
      return;
    }

    setSending(true);
    try {
      // 1. Upload card image canvas to Supabase storage
      let imageUrl = null;
      if (canvasRef.current) {
        imageUrl = await uploadCanvasToStorage(canvasRef.current, selectedEmp.name);
      }

      // 2. Call Edge Function with imageUrl and parameters
      const { data, error: funcErr } = await supabase.functions.invoke("send-birthday-wish", {
        body: {
          phone: targetPhone,
          name: selectedEmp.name,
          message: message,
          imageUrl: imageUrl,
          templateName: "new_emp_birthday_wish",
          languageCode: "en_US"
        },
      });

      if (funcErr) {
        let displayError = funcErr.message;
        if (funcErr.context && typeof funcErr.context.json === 'function') {
          try {
            const errBody = await funcErr.context.json();
            if (errBody && errBody.error) {
              displayError = errBody.error;
            }
          } catch (e) {}
        }
        throw new Error(displayError);
      }

      // Save wish record to database table `birthday_wish`
      await saveWishToDatabase(selectedEmp, targetPhone, message, imageUrl, "new_emp_birthday_wish");

      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 3000);

      toast.success(`Birthday Wish (Image + Message) sent to ${selectedEmp.name} via WhatsApp!`, {
        icon: "🎉",
        duration: 4000,
      });
      setSelectedEmp(null);
    } catch (err) {
      console.error("Error sending birthday wish via Edge Function:", err);
      
      // Save wish record to database table `birthday_wish` even when using web fallback
      await saveWishToDatabase(selectedEmp, targetPhone, message, imageUrl, "new_emp_birthday_wish");

      toast.error(`WhatsApp Dispatch Notice: ${err.message || "Opening WhatsApp Web..."}`, {
        duration: 5000,
      });

      let cleanPhone = targetPhone.replace(/\D/g, "");
      if (cleanPhone.length === 10) {
        cleanPhone = "91" + cleanPhone;
      }
      
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

      // Auto download card image so user can easily attach it in WhatsApp web
      downloadCardImage();

      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 3000);

      setSelectedEmp(null);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-6 px-4 md:px-8 space-y-6">
      
      {/* Title Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-teal-50 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-pink-50 rounded-full blur-xl"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl text-white shadow-md shadow-rose-200">
              <Cake className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                Birthday Wish <span className="text-sm font-normal px-2.5 py-0.5 bg-rose-50 text-rose-500 border border-rose-100 rounded-full font-semibold animate-pulse">Celebrations</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Generate personalized RBP Birthday Cards, send WhatsApp images & text wishes, and track history.
              </p>
            </div>
          </div>
          
          {/* Quick Stats overview */}
          <div className="flex gap-4 w-full md:w-auto">
            <div className="bg-rose-50/60 border border-rose-100/80 rounded-2xl px-5 py-3 flex-1 md:flex-initial min-w-[110px]">
              <div className="text-xs text-rose-500 font-bold uppercase tracking-wider">Today</div>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {todaysBirthdays.length}
              </div>
            </div>
            <div className="bg-indigo-50/60 border border-indigo-100/80 rounded-2xl px-5 py-3 flex-1 md:flex-initial min-w-[110px]">
              <div className="text-xs text-indigo-500 font-bold uppercase tracking-wider">Upcoming</div>
              <div className="text-2xl font-black text-indigo-600 mt-1">
                {upcomingBirthdays.length}
              </div>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-100/80 rounded-2xl px-5 py-3 flex-1 md:flex-initial min-w-[110px]">
              <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Wishes Sent</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {wishHistory.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Search Employee</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, ID, or post..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:border-teal-600 text-sm py-2.5"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm py-2.5"
            >
              <option value="">All Departments</option>
              {departmentsList.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm py-2.5"
            >
              <option value="">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedDept("");
                setSelectedCategory("");
                toast.success("Filters cleared");
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm py-2.5 rounded-xl border border-slate-200 transition duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main sections */}
      {loading ? (
        <div className="space-y-8">
          <div>
            <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white border border-slate-100 rounded-3xl p-5 h-48 animate-pulse flex flex-col justify-between">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
                    <div className="space-y-2 flex-1 pt-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-xl mx-auto space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-red-800">Something went wrong</h2>
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchEmployees}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition"
          >
            Retry Fetching
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* TODAY'S BIRTHDAYS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-pink-100 pb-2">
              <PartyPopper className="w-5 h-5 text-pink-500" />
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                Today's Birthdays
              </h2>
              <span className="bg-pink-100 text-pink-600 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {todaysBirthdays.length} Active
              </span>
            </div>

            {todaysBirthdays.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {todaysBirthdays.map((emp) => (
                  <div 
                    key={emp.id}
                    className="relative bg-gradient-to-br from-pink-500/5 via-rose-500/5 to-amber-500/5 hover:from-pink-500/10 hover:via-rose-500/10 hover:to-amber-500/10 border-2 border-rose-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between overflow-hidden group"
                  >
                    <div className="absolute -top-3 -right-3 w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-400 rotate-12 opacity-20 blur-md rounded-full"></div>
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full shadow-sm shadow-rose-200">
                      TODAY 🎉
                    </div>

                    <div className="flex gap-4 items-start relative z-10 mb-4">
                      <InitialAvatar name={emp.name} size="w-16 h-16 text-xl ring-4 ring-pink-300/50" />
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-slate-800 leading-tight group-hover:text-pink-600 transition">
                          {emp.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                          ID: {emp.employeeId}
                        </p>
                        <div className="text-xs text-slate-600 font-medium">
                          {emp.designation} • <span className="text-slate-500">{emp.department}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3.5 space-y-2 relative z-10">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Birthday:</span>
                        <span className="text-slate-800 font-bold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-rose-500" />
                          {formatBdayShort(emp.dateOfBirth)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Turning Age:</span>
                        <span className="bg-pink-100 text-pink-700 font-bold px-2 py-0.5 rounded text-[11px]">
                          {emp.nextAge} Years Old
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-1 relative z-10">
                      <button
                        onClick={() => openWishModal(emp)}
                        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-rose-200 group-hover:shadow-lg transition duration-200"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Wish Birthday
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center max-w-lg mx-auto shadow-sm">
                <Cake className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
                <h3 className="text-md font-bold text-slate-700">No birthdays today</h3>
                <p className="text-xs text-slate-500 mt-1">
                  There are no employee birthdays falling on today's date. Take a look at the upcoming list below to schedule cards.
                </p>
              </div>
            )}
          </div>

          {/* UPCOMING BIRTHDAYS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
              <Gift className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                Upcoming Birthdays
              </h2>
              <span className="bg-indigo-100 text-indigo-600 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {upcomingBirthdays.length} Total
              </span>
            </div>

            {upcomingBirthdays.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedUpcoming.map((emp) => (
                    <div 
                      key={emp.id}
                      className="bg-white border border-slate-100 hover:border-indigo-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between overflow-hidden group"
                    >
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div className="flex gap-3 items-start">
                          <InitialAvatar name={emp.name} size="w-14 h-14 text-lg ring-4 ring-indigo-50" />
                          <div className="space-y-0.5">
                            <h3 className="font-extrabold text-slate-800 leading-tight group-hover:text-indigo-600 transition">
                              {emp.name}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                              ID: {emp.employeeId}
                            </p>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {emp.designation}
                            </div>
                            <div className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded w-max font-semibold">
                              {emp.department}
                            </div>
                          </div>
                        </div>

                        <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm ${
                          emp.remainingDays === 1 
                            ? 'bg-amber-100 text-amber-700 border border-amber-200 animate-pulse' 
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                        }`}>
                          {emp.remainingDays === 1 ? "Tomorrow" : `In ${emp.remainingDays} Days`}
                        </div>
                      </div>

                      <div className="border-t border-slate-50 pt-3.5 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium">Birthday Date:</span>
                          <span className="text-slate-700 font-bold">
                            {formatBdayShort(emp.dateOfBirth)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium">Age to be completed:</span>
                          <span className="text-slate-700 font-semibold">
                            Turning <span className="font-extrabold text-indigo-600">{emp.nextAge}</span>
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-1">
                        <button
                          onClick={() => openWishModal(emp)}
                          className="w-full bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-700 border border-slate-200 hover:border-indigo-600 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200"
                        >
                          <Send className="w-3 h-3" />
                          Prepare Wish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-200 pt-6 mt-4">
                    <p className="text-xs text-slate-500 font-semibold">
                      Showing page {currentPage} of {totalPages} ({upcomingBirthdays.length} entries)
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center max-w-lg mx-auto shadow-sm">
                <Gift className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-md font-bold text-slate-700">No upcoming birthdays</h3>
                <p className="text-xs text-slate-500 mt-1">
                  We couldn't find any upcoming birthdays that match your current search and filter settings.
                </p>
              </div>
            )}
          </div>

          {/* SENT BIRTHDAY WISHES HISTORY TABLE (`birthday_wish` database table) */}
          <div className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#0F766E]" />
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                  Sent Birthday Wishes Log
                </h2>
                <span className="bg-emerald-100 text-[#0F766E] text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {filteredHistory.length} Sent Records
                </span>
              </div>

              {/* History Search Box */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Filter sent history..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                />
              </div>

            </div>

            {/* Table Container - Fixed 400px height with sticky header */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="max-h-[400px] overflow-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm">
                    <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                      <th className="px-6 py-3.5 bg-slate-100">ID</th>
                      <th className="px-4 py-3.5 bg-slate-100">Employee Name</th>
                      <th className="px-4 py-3.5 bg-slate-100">Employee ID</th>
                      <th className="px-4 py-3.5 text-center bg-slate-100">Mobile Number</th>
                      <th className="px-4 py-3.5 text-center bg-slate-100">Wish Date</th>
                      <th className="px-4 py-3.5 text-center bg-slate-100">Card Image</th>
                      <th className="px-4 py-3.5 bg-slate-100">Message Sent</th>
                      <th className="px-4 py-3.5 text-center bg-slate-100">Channel</th>
                      <th className="px-4 py-3.5 text-center bg-slate-100">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {historyLoading ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-slate-400">
                          Loading sent wishes history...
                        </td>
                      </tr>
                    ) : filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-slate-400">
                          No birthday wishes sent yet.
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-3.5 font-mono font-bold text-slate-400">
                            #{item.id}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-800">
                            {item.employee_name}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-indigo-600">
                            {item.employee_code || "-"}
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono text-slate-600">
                            {item.mobile_number || "-"}
                          </td>
                          <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                            <div>{item.wish_date || "-"}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {item.image_url ? (
                              <a
                                href={item.image_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 rounded-lg text-[10px] font-bold transition shadow-xs"
                                title="Click to view high-res Birthday Card Image"
                              >
                                <ImageIcon className="w-3 h-3 text-amber-600" />
                                View Card
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[10px] italic">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate" title={item.message}>
                            {item.message || "-"}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                              {item.sent_by || "WhatsApp"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => deleteWishLog(item.id)}
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                              title="Delete log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* BIRTHDAY WISH MODAL WITH RBP CARD TEMPLATE PREVIEW & WHATSAPP DISPATCH */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setSelectedEmp(null)}
          ></div>
          
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden relative z-10 transform transition-all duration-300 animate-[fadeIn_0.2s_ease-out]">
            
            <div className="bg-gradient-to-r from-teal-600 via-rose-500 to-pink-500 p-5 text-white relative">
              <button 
                onClick={() => setSelectedEmp(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex gap-4 items-center">
                <InitialAvatar name={selectedEmp.name} size="w-14 h-14 text-xl ring-4 ring-white/30" />
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">{selectedEmp.name}</h3>
                  <p className="text-xs text-white/90 mt-0.5">
                    {selectedEmp.designation} • ID: {selectedEmp.employeeId} • Dept: {selectedEmp.department}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("card")}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === "card"
                    ? "border-rose-500 text-rose-600 bg-white shadow-sm"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                RBP Card Template Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("text")}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === "text"
                    ? "border-rose-500 text-rose-600 bg-white shadow-sm"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp Message
              </button>
            </div>

            {/* Hidden HTML Canvas element used to draw ultra high-res image */}
            <canvas ref={canvasRef} className="hidden" />

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* TAB 1: RBP CARD TEMPLATE PREVIEW */}
              {activeTab === "card" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Generated RBP Birthday Image Card
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Exact branded design generated with employee name. Ready to attach or send via WhatsApp.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={downloadCardImage}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-600" />
                      Download PNG
                    </button>
                  </div>

                  {/* Card Preview Container */}
                  <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200/60 flex justify-center items-center shadow-inner min-h-[320px]">
                    {cardPreviewUrl ? (
                      <img
                        src={cardPreviewUrl}
                        alt="RBP Birthday Wish Card"
                        className="max-h-[380px] rounded-xl shadow-lg border border-amber-200/80 object-contain hover:scale-[1.01] transition-transform duration-200"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-amber-700 space-y-2">
                        <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-semibold">Generating Birthday Card...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: WHATSAPP MESSAGE */}
              {activeTab === "text" && (
                <div className="space-y-4">
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customize Greeting Text</label>
                    </div>
                    <textarea
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-2xl text-xs p-3.5 focus:border-rose-500 focus:bg-white resize-none shadow-inner"
                      placeholder="Type a custom greeting message here..."
                    ></textarea>
                  </div>

                </div>
              )}

              {/* Helper variables for phone validation */}
              {(() => {
                const mob = selectedEmp.mobileNumber ? String(selectedEmp.mobileNumber).trim() : "";
                const fam = selectedEmp.familyNumber ? String(selectedEmp.familyNumber).trim() : "";
                const invalid = ["", "null", "undefined", "na", "n/a", "none"];

                const validMob = mob && !invalid.includes(mob.toLowerCase()) ? mob : null;
                const validFam = fam && !invalid.includes(fam.toLowerCase()) ? fam : null;
                const hasNumber = !!(validMob || validFam);

                return (
                  <>
                    {/* Employee Contact Number Info */}
                    <div className={`rounded-2xl p-3.5 grid grid-cols-2 gap-3 text-xs border transition-all ${
                      !hasNumber
                        ? "bg-red-50/90 border-2 border-red-400 shadow-md text-red-900"
                        : "bg-slate-50 border-slate-100"
                    }`}>
                      <div>
                        <span className={!hasNumber ? "text-red-600 font-semibold" : "text-slate-400 font-medium"}>Birthday Date:</span>
                        <p className="text-slate-800 font-bold mt-0.5">{formatBdayDate(selectedEmp.dateOfBirth)}</p>
                      </div>
                      <div>
                        <span className={!hasNumber ? "text-red-600 font-semibold" : "text-slate-400 font-medium"}>Turning Age:</span>
                        <p className="text-slate-800 font-bold mt-0.5">{selectedEmp.nextAge} Years Old</p>
                      </div>
                      <div className="col-span-2 border-t border-slate-200/60 pt-2">
                        <span className={!hasNumber ? "text-red-600 font-bold uppercase tracking-wider" : "text-slate-400 font-medium"}>Send WhatsApp To:</span>
                        <p className="text-slate-800 font-bold mt-0.5 flex items-center gap-1.5">
                          <span className="text-emerald-600 font-extrabold">📞</span>
                          {validMob ? (
                            <span>{validMob} <span className="text-[10px] font-normal text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded ml-1">Personal</span></span>
                          ) : validFam ? (
                            <span>
                              {validFam}{" "}
                              <span className="text-[10px] font-normal text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded ml-1">
                                Family ({selectedEmp.familyRelationship || selectedEmp.familyPersonName || "Contact"})
                              </span>
                            </span>
                          ) : (
                            <span className="text-red-600 font-extrabold flex items-center gap-1 bg-red-100 border border-red-300 px-2 py-0.5 rounded-lg text-xs animate-pulse">
                              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                              Employee Mobile Number is Missing / Not Available!
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Dispatch Channel Note */}
                    <div className="flex items-center justify-between py-2 px-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-600 animate-pulse" />
                        <span>Meta WhatsApp Template: Image Header + Dynamic Message</span>
                      </div>
                      <span className="text-[10px] bg-emerald-200/80 px-2 py-0.5 rounded-md font-bold text-emerald-900 uppercase">
                        Active (new_emp_birthday_wish)
                      </span>
                    </div>

                    {/* Modal Buttons */}
                    <div className="flex gap-3 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedEmp(null)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs py-2.5 px-4 rounded-xl border border-slate-200 transition duration-200"
                      >
                        Cancel
                      </button>
                      
                      <button
                        type="button"
                        onClick={downloadCardImage}
                        className="px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition duration-200"
                        title="Download Birthday Card PNG"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download Card</span>
                      </button>

                      <button
                        type="button"
                        onClick={sendWish}
                        disabled={sending || !hasNumber}
                        className={`flex-1 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition duration-200 ${
                          !hasNumber
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none"
                            : sending
                              ? "opacity-75 cursor-not-allowed bg-rose-500 text-white"
                              : "bg-gradient-to-r from-emerald-600 via-teal-600 to-rose-500 hover:from-emerald-700 hover:to-rose-600 text-white shadow-md shadow-rose-200"
                        }`}
                        title={!hasNumber ? "Cannot send wish: Mobile number is missing" : "Send WhatsApp Birthday Wish"}
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
                  </>
                );
              })()}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function BirthdayWish() {
  const [mainTab, setMainTab] = useState("birthday");

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-6">
      {/* Main Feature Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm max-w-md">
        <button
          type="button"
          onClick={() => setMainTab("birthday")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition duration-200 ${
            mainTab === "birthday"
              ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-200"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Cake className="w-4 h-4" />
          <span>Birthday Wish</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab("anniversary")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition duration-200 ${
            mainTab === "anniversary"
              ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md shadow-amber-200"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Work Anniversary</span>
        </button>
      </div>

      {mainTab === "birthday" ? <BirthdayWishContent /> : <WorkAnniversary />}
    </div>
  );
}
