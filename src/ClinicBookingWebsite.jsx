import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Languages,
  LayoutDashboard,
  MessageCircle,
  MoonStar,
  PhoneCall,
  ShieldCheck,
  SunMedium,
  Upload,
  Wallet,
  MapPinned,
  Stethoscope,
  Star,
  BadgeInfo,
  Activity,
  FileText,
  BellRing,
  UserRound,
  ArrowRight,
  Menu,
  X,
  Plus,
  Loader2,
  Lock,
  Search,
  LogOut,
  AlertCircle,
  RotateCcw,
  CreditCard,
  AlertTriangle
} from "lucide-react";

const INITIAL_DOCTORS = [
  {
    name: "Dr Ajay Kumar",
    specialty: "MBBS, MD (Medicine)",
    time: "Mon-Sat • 8:30 AM - 11:00 AM • 4:30 PM - 9:00 PM | Sunday • 9:00 AM - 3:00 PM",
    rating: 4.9,
  },
];

const generateSlots = () => {
  const allSlots = [];
  const createSlots = (startHour, startMinute, endHour, endMinute) => {
    let current = new Date();
    current.setHours(startHour, startMinute, 0, 0);

    const end = new Date();
    end.setHours(endHour, endMinute, 0, 0);

    while (current < end) {
      allSlots.push(
        current.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      current.setMinutes(current.getMinutes() + 15);
    }
  };

  createSlots(9, 0, 10, 30);
  createSlots(17, 0, 20, 0);
  return allSlots;
};

const initialGeneratedSlots = generateSlots();

const reviews = [
  { name: "Rahul Kumar", rating: 5.0, text: "Extremely professional consultation. The digital booking and queue system is seamlessly organized." },
  { name: "Anjali Singh", rating: 4.8, text: "A premium clinical experience. Instant receipt verification and very friendly clinic assistance." },
  { name: "Amit Raj", rating: 4.7, text: "State of the art digital system. Dr. Ajay Kumar provides deep, attentive clinical guidance." },
  { name: "Pooja Verma", rating: 4.9, text: "Clean, high-end medical setup. The automated queue removes standard medical waiting room anxieties." },
];

const faqs = [
  ["How do I register a slot?", "Select your provider, choose an active clinical slot, fill out the patient registry, and secure your position with the ₹99 commitment deposit via Cashfree Payments."],
  ["Is the ₹99 fee mandatory?", "Yes. The ₹99 commitment deposit secures your queue position on the active doctor's daily roster, helping us minimize schedule overlap."],
  ["Can I choose a language?", "Yes. We offer fully native UI switches for English and Hindi situated cleanly in the navigation row."],
  ["How are queue numbers tracked?", "Once confirmed, your token is processed instantly and updated on the dashboard. It will reset automatically every 24 hours."],
];

const QUEUE_START = 1;
const QUEUE_RESET_MS = 24 * 60 * 60 * 1000;

// Production API Base URL pointing directly to your live Render backend
const API_BASE_URL = "https://clinic-backend-px0v.onrender.com";

export default function ClinicBookingWebsite() {
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
  const todayLabel = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const [adminPassword, setAdminPassword] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [lang, setLang] = useState("EN");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [page, setPage] = useState("home");
  const [selectedDoctor, setSelectedDoctor] = useState(INITIAL_DOCTORS[0].name);
  
  const [slots, setSlots] = useState(initialGeneratedSlots);
  const [newSlotInput, setNewSlotInput] = useState("");
  const [showAddSlotRow, setShowAddSlotRow] = useState(false);
  const [adminSearchTerm, setAdminSearchTerm] = useState("");
  
  const [selectedSlot, setSelectedSlot] = useState(initialGeneratedSlots[3]);
  const [bookingStatus, setBookingStatus] = useState("pending");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Cashfree Architectural Step-by-Step State Controllers
  const [paymentLifecycle, setPaymentLifecycle] = useState("PENDING_PAYMENT"); 
  const [gatewaySimMode, setGatewaySimMode] = useState("CLIENT_CONFIRM_FIRST"); 
  const [simulatedOrderId, setSimulatedOrderId] = useState("");
  const [paymentSessionId, setPaymentSessionId] = useState("");
  const [paymentErrorMessage, setPaymentErrorMessage] = useState("");
  const [slotLockTimeLeft, setSlotLockTimeLeft] = useState(300); 
  const timerRef = useRef(null);
  
  const [lastConfirmedBooking, setLastConfirmedBooking] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", slot: "", status: "" });

  // Patient Registration state hook values
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    reason: "",
  });

  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem("clinicBookings");
    if (saved) return JSON.parse(saved);
    return [
      { name: "Aman", doctor: "Dr Ajay Kumar", slot: "09:45 AM", status: "Confirmed", phone: "9835012345", age: "25", gender: "Male", reason: "Annual Health Assessment", date: todayLabel, token: 1, timeline: [{ status: "BOOKING_CONFIRMED", notes: "Created with Roster token #1", timestamp: new Date().toLocaleTimeString() }] },
      { name: "Riya", doctor: "Dr Ajay Kumar", slot: "10:15 AM", status: "Pending", phone: "8210345678", age: "22", gender: "Female", reason: "Persistent Migraine Consultation", date: todayLabel, token: 2, timeline: [{ status: "BOOKING_CONFIRMED", notes: "Created with Roster token #2", timestamp: new Date().toLocaleTimeString() }] },
      { name: "Kabir", doctor: "Dr Ajay Kumar", slot: "05:15 PM", status: "Completed", phone: "7004123456", age: "30", gender: "Male", reason: "Cardiovascular Review", date: todayLabel, token: 3, timeline: [{ status: "BOOKING_CONFIRMED", notes: "Created with Roster token #3", timestamp: new Date().toLocaleTimeString() }] },
    ];
  });

  // Calculate live next token sequentially from active backend sync records
  const queueNo = useMemo(() => {
    const confirmedCount = bookings.filter(b => b.status === "Confirmed" || b.status === "Completed").length;
    return confirmedCount > 0 ? confirmedCount + 1 : QUEUE_START;
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem("clinicBookings", JSON.stringify(bookings));
  }, [bookings]);

  // Clean mount-only daily roster expiration validation
  useEffect(() => {
    const savedResetAt = Number(localStorage.getItem("clinicQueueResetAt"));
    const now = Date.now();

    if (!Number.isFinite(savedResetAt) || savedResetAt <= 0) {
      localStorage.setItem("clinicQueueResetAt", String(now));
      return;
    }

    if (now - savedResetAt >= QUEUE_RESET_MS) {
      setBookings([]);
      setLastConfirmedBooking(null);
      setBookingStatus("pending");
      localStorage.setItem("clinicBookings", JSON.stringify([]));
      localStorage.setItem("clinicQueueResetAt", String(now));
    }
  }, []);

  // Highly optimized slot timer countdown side effect: Prevents interval rebuilding
  useEffect(() => {
    let interval = null;
    if (showPaymentModal && paymentLifecycle !== "BOOKING_CONFIRMED") {
      interval = setInterval(() => {
        setSlotLockTimeLeft((prev) => {
          if (prev <= 1) {
            setPaymentLifecycle("PAYMENT_FAILED");
            setPaymentErrorMessage("Checkout lock timer expired. Slot released back to public availability.");
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showPaymentModal, paymentLifecycle]);

  const theme = darkMode ? "bg-zinc-950 text-zinc-100" : "bg-slate-50 text-slate-900";
  const card = darkMode ? "bg-zinc-900/60 border-zinc-800/80 text-zinc-100 shadow-xl shadow-black/20" : "bg-white border-slate-200/90 text-slate-900 shadow-sm";
  const muted = darkMode ? "text-zinc-400" : "text-slate-500";
  const glass = darkMode ? "backdrop-blur-md bg-zinc-950/70 border border-zinc-900" : "backdrop-blur-md bg-white/90 border border-slate-200 shadow-sm";

  const getStatusStyles = (status) => {
    switch (status) {
      case "Confirmed":
        return darkMode 
          ? "bg-teal-500/10 text-teal-400 border-teal-500/20" 
          : "bg-teal-100 text-teal-800 border-teal-200";
      case "Rejected":
        return darkMode 
          ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
          : "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return darkMode 
          ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
          : "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const inputClass = `w-full px-4 py-3 rounded-xl outline-none border transition-all duration-300 text-sm font-medium focus:ring-2 focus:ring-teal-500/20 ${
    darkMode 
      ? "bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-teal-500 focus:bg-zinc-900" 
      : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-slate-50"
  }`;

  const translation = useMemo(() => {
    if (lang === "EN") {
      return {
        heroTitle: "Sanjivani Clinic",
        heroDesc: "Official medical scheduler and patient administration platform for Dr Ajay Kumar, MBBS, MD (Medicine). Fast consultation registry and secure queue management.",
        book: "Schedule Appointment",
        contact: "Contact Registry Desk",
      };
    }
    return {
      heroTitle: "संजीवनी क्लिनिक",
      heroDesc: "डॉ अजय कुमार (MBBS, MD Medicine) के लिए आधिकारिक चिकित्सा शेड्यूलर और रोगी प्रशासन मंच। त्वरित परामर्श रजिस्ट्री और सुरक्षित कतार प्रबंधन।",
      book: "अपॉइंटमेंट शेड्यूलर",
      contact: "रजिस्ट्री डेस्क से संपर्क करें",
    };
  }, [lang]);

  const unlockAdmin = () => {
    const pass = adminPassword.trim();
    if (!pass) {
      setAdminError("Please enter your secure access code.");
      return;
    }
    if (pass === ADMIN_PASSWORD) {
      setAdminUnlocked(true);
      setAdminError("");
      setPage("admin");
      return;
    }
    setAdminError("Invalid security credential");
  };

  const handleAdminLogout = () => {
    setAdminUnlocked(false);
    setAdminPassword("");
    setPage("home");
    setToastMessage("Session cleared successfully");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const executeResetQueue = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/payments/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: { order_id: "reset" },
          payment: { payment_status: "RESET" }
        })
      });
    } catch (err) {
      console.error(err);
    }

    setBookings([]);
    setLastConfirmedBooking(null);
    setBookingStatus("pending");
    localStorage.setItem("clinicQueueNo", "1");
    localStorage.setItem("clinicBookings", JSON.stringify([]));
    localStorage.setItem("clinicQueueResetAt", String(Date.now()));
    setShowResetConfirmModal(false);
    
    setToastMessage("Daily session reset. Next token: #1 ✅");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const validateForm = () => {
    const errors = {};
    const phonePattern = /^[6-9][0-9]{9}$/;

    if (!form.name.trim()) {
      errors.name = "Patient legal name is required.";
    }
    if (!form.age.trim()) {
      errors.age = "Patient age is required.";
    } else {
      const parsedAge = Number(form.age);
      if (!Number.isFinite(parsedAge) || parsedAge < 1 || parsedAge > 120) {
        errors.age = "Please provide an age range between 1 and 120.";
      }
    }
    if (!form.phone.trim()) {
      errors.phone = "Primary contact number is required.";
    } else if (!phonePattern.test(form.phone.trim())) {
      errors.phone = "Please provide a valid 10-digit mobile number.";
    }
    if (!selectedSlot) {
      errors.slot = "An appointment slot selection is required.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 1. Initialise Checkout on Backend (Establishes Concurrency Hold & Lock)
  const handleBookingClick = async () => {
    if (!validateForm()) return;

    setPaymentLoading(true);
    setPaymentErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/initialize-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: form.name.trim(),
          age: Number(form.age),
          gender: form.gender,
          phone: form.phone.trim(),
          reason: form.reason.trim() || "No symptoms specified",
          doctor: selectedDoctor,
          slot: selectedSlot,
          date: todayLabel
        })
      });

      const data = await response.json();

      if (data.success) {
        setSimulatedOrderId(data.orderId);
        setPaymentSessionId(data.paymentSessionId);
        setPaymentLifecycle("PENDING_PAYMENT");

        // Set lock countdown dynamically based on database response
        const lockSeconds = Math.max(0, Math.floor((new Date(data.lockedUntil).getTime() - Date.now()) / 1000));
        setSlotLockTimeLeft(lockSeconds > 0 ? lockSeconds : 300);
        setShowPaymentModal(true);
      } else {
        alert(data.message || "Failed to initialize booking session hold.");
      }
    } catch (err) {
      console.error(err);
      alert("Error establishing connection with Sanjivani Clinic payment APIs.");
    } finally {
      setPaymentLoading(false);
    }
  };

  // 2. Client Payment Verification Lifecycle Execution
  const executeConfirmedBooking = async () => {
    setPaymentLoading(true);
    setPaymentErrorMessage("");
    setPaymentLifecycle("PAYMENT_PROCESSING");

    // CASHFREE CHECKOUT START
    // To trigger the official checkout modal on production using Cashfree JS SDK:
    // 1. Load the JavaScript SDK library in index.html: <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
    // 2. Setup SDK client in code: const cashfree = Cashfree({ mode: "sandbox" });
    // 3. Trigger modal pay session:
    //    await cashfree.checkout({
    //      paymentSessionId: paymentSessionId,
    //      redirectTarget: "_self" 
    //    });
    // CASHFREE CHECKOUT END

    const stampNow = () => new Date().toLocaleTimeString();

    try {
      // Simulate gateway operational delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (gatewaySimMode === "CLIENT_CANCEL") {
        setPaymentLoading(false);
        setPaymentLifecycle("PAYMENT_CANCELLED");
        setPaymentErrorMessage("Checkout Dismissed: Patient aborted Checkout overlay session.");
        return;
      }

      if (gatewaySimMode === "WEBHOOK_CONFIRM_FIRST") {
        try {
          await fetch(`${API_BASE_URL}/api/payments/webhook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order: { order_id: simulatedOrderId },
              payment: { payment_status: "SUCCESS", cf_payment_id: `tx_cf_async_${Date.now()}` }
            })
          });
        } catch (webhookErr) {
          console.error("Asynchronous webhook simulation failure:", webhookErr);
        }
      }

      // Hit backend API to securely verify gateway state
      const response = await fetch(`${API_BASE_URL}/api/payments/verify-transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId: simulatedOrderId
        })
      });

      const data = await response.json();

      if (data.success) {
        setPaymentLifecycle("PAYMENT_VERIFIED");

        const auditTimeline = [
          { status: "PENDING_PAYMENT", notes: "Roster lock initialized on server.", timestamp: stampNow() },
          { status: "PAYMENT_PROCESSING", notes: "Cashfree verification requested.", timestamp: stampNow() },
          { status: "BOOKING_CONFIRMED", notes: `Server verified payment securely. Token #${data.token} generated.`, timestamp: stampNow() }
        ];

        const confirmedBooking = {
          name: form.name.trim(),
          age: form.age,
          gender: form.gender,
          phone: form.phone.trim(),
          reason: form.reason.trim() || "No symptoms specified",
          doctor: selectedDoctor,
          slot: selectedSlot,
          status: "Confirmed",
          createdAt: new Date().toISOString(),
          date: todayLabel,
          token: data.token, // Uses exact token returned by backend APIs
          timeline: auditTimeline
        };

        setBookings((prev) => [confirmedBooking, ...prev]);
        setLastConfirmedBooking(confirmedBooking);
        setBookingStatus("confirmed");
        setPaymentLifecycle("BOOKING_CONFIRMED");

        // Clear input form fields
        setForm({ name: "", age: "", gender: "Male", phone: "", reason: "" });
        setFormErrors({});

        setToastMessage(`Booking Confirmed! Token: #${data.token} ✅`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        setShowPaymentModal(false);
      } else {
        setPaymentLifecycle("PAYMENT_FAILED");
        setPaymentErrorMessage(data.message || "Gateway declined transaction validation.");
      }
    } catch (err) {
      console.error(err);
      setPaymentLifecycle("PAYMENT_FAILED");
      setPaymentErrorMessage("Network latency error verifying transaction with server.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleApprove = (index) => {
    setBookings((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: "Confirmed" };
      return updated;
    });
    setToastMessage("Patient verified and queue active");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleReject = (index) => {
    setBookings((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: "Rejected" };
      return updated;
    });
    setToastMessage("Slot release sequence complete");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleStartEdit = (index, b) => {
    setEditingIndex(index);
    setEditForm({ name: b.name, slot: b.slot, status: b.status });
  };

  const handleSaveEdit = (index) => {
    setBookings((prev) => {
      const updated = [...prev];
      updated[index] = { 
        ...updated[index], 
        name: editForm.name, 
        slot: editForm.slot, 
        status: editForm.status 
      };
      return updated;
    });
    setEditingIndex(null);
    setToastMessage("Roster profile updated");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleAddSlot = () => {
    if (!newSlotInput.trim()) return;
    setSlots((prev) => [...prev, newSlotInput.trim()].sort());
    setNewSlotInput("");
    setShowAddSlotRow(false);
    setToastMessage("Roster block successfully published");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const filteredBookings = useMemo(() => {
    if (!adminSearchTerm.trim()) return bookings;
    const term = adminSearchTerm.toLowerCase();
    return bookings.filter(b => 
      b.name.toLowerCase().includes(term) ||
      b.phone.toLowerCase().includes(term) ||
      b.slot.toLowerCase().includes(term) ||
      b.status.toLowerCase().includes(term)
    );
  }, [bookings, adminSearchTerm]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const Button = ({ active, children, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl transition-all duration-300 text-xs font-bold tracking-wide uppercase ${
        active 
          ? (darkMode ? "bg-zinc-100 text-zinc-950" : "bg-teal-600 text-white") 
          : (darkMode ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50" : "text-slate-650 hover:text-slate-900 hover:bg-slate-100")
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className={`min-h-screen flex flex-col justify-between overflow-x-hidden ${theme} transition-colors duration-300 font-sans`}>
      
      {/* SaaS subtle ambient backdrop */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 h-[500px] w-[500px] rounded-full bg-teal-50/[0.04] blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-10 h-[600px] w-[600px] rounded-full bg-indigo-50/[0.03] blur-3xl" />
      </div>

      <header className={`sticky top-0 z-30 border-b transition-colors duration-300 ${darkMode ? "border-zinc-900 bg-zinc-950/80 backdrop-blur-md" : "border-slate-200 bg-white/90 backdrop-blur-md"}`}>
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          
          {/* Logo Brand Frame */}
          <div className="flex items-center gap-3 cursor-pointer select-none shrink-0" onClick={() => setPage("home")}>
            <div className="h-10 w-10 flex-shrink-0 bg-teal-600 rounded-lg overflow-hidden border border-teal-500/20 shadow-sm relative hover:scale-105 transition-transform duration-300">
              <img 
                src="https://i.ibb.co/ZRhN4prd/image.png" 
                alt="Clinic Emblem" 
                className="h-full w-full object-cover" 
              />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight leading-none text-black dark:text-zinc-50 transition-colors duration-300">Sanjivani Clinic</div>
              <div className="text-[10px] font-bold tracking-wider uppercase mt-1 text-teal-600 dark:text-teal-400">Medical Portal</div>
            </div>
          </div>

          {/* Quick Access Theme & Lang controls */}
          <div className="flex items-center gap-1.5 ml-auto md:ml-0">
            <button 
              onClick={() => setLang((v) => (v === "EN" ? "HI" : "EN"))} 
              className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all ${
                darkMode ? "bg-zinc-900/50 border-zinc-800 text-zinc-300" : "bg-white border-slate-200 text-slate-700"
              }`}
              aria-label="Toggle language profile"
            >
              <Languages size={13} className="text-teal-600 dark:text-teal-400 animate-spin-slow" /> <span className="font-bold text-[10px] tracking-wider uppercase">{lang}</span>
            </button>
            <button 
              onClick={() => setDarkMode((v) => !v)} 
              className={`p-2 rounded-lg border hover:scale-105 active:scale-95 transition-all ${
                darkMode ? "bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-805" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
              aria-label="Toggle visual theme"
            >
              {darkMode ? <SunMedium size={13} className="text-amber-400" /> : <MoonStar size={13} className="text-indigo-600" />}
            </button>
          </div>

          <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl border bg-zinc-900/50 border-zinc-800 dark:bg-zinc-900/40">
            <Button active={page === "home"} onClick={() => setPage("home")}>
              Dashboard
            </Button>
            <Button active={page === "booking"} onClick={() => setPage("booking")}>
              Book Appointment
            </Button>
            <Button active={page === "admin-login" || page === "admin"} onClick={() => setPage("admin-login")}>
              Admin Portal
            </Button>
          </nav>

          <button className="md:hidden p-2 rounded-lg border border-slate-200 dark:border-zinc-800" onClick={() => setMobileMenu((v) => !v)}>
            {mobileMenu ? <X size={18} className="text-black dark:text-white" /> : <Menu size={18} className="text-black dark:text-white" />}
          </button>
        </div>

        {mobileMenu && (
          <div className={`md:hidden px-6 pb-4 pt-2 space-y-1.5 border-t transition-all ${darkMode ? "border-zinc-900 bg-zinc-950" : "border-slate-200 bg-white"}`}>
            {[
              ["home", "Dashboard"],
              ["booking", "Book Appointment"],
              ["admin-login", "Admin Portal"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => {
                  setPage(k);
                  setMobileMenu(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold tracking-wide uppercase transition-all duration-200 ${
                  page === k 
                    ? "bg-teal-600 text-white border-teal-500" 
                    : (darkMode ? "text-zinc-400 border-transparent hover:bg-zinc-900/50" : "text-slate-650 border-transparent hover:bg-slate-100")
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-6 py-8 relative z-10 w-full">
        {page === "home" && (
          <div className="space-y-10 animate-fade-in">
            
            {/* Premium SaaS Hero Row */}
            <section className={`rounded-[1.5rem] p-6 md:p-10 border transition-all ${
              darkMode ? "bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border-zinc-800/80" : "bg-white border-slate-200 shadow-md"
            } overflow-hidden relative shadow-lg`}>
              <div className="grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7">
                  
                  {/* Pulse Activity Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/20 bg-teal-500/[0.05] text-teal-600 dark:text-teal-400 text-[10px] font-bold uppercase tracking-wider mb-6">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Live Booking Active
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-none text-zinc-900 dark:text-zinc-50">{translation.heroTitle}</h1>
                  <p className={`mt-4 text-sm md:text-base leading-relaxed max-w-xl ${muted}`}>{translation.heroDesc}</p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <button onClick={() => setPage("booking")} className="px-5 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs tracking-wider uppercase shadow-md shadow-teal-500/10 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                      {translation.book} <ArrowRight size={14} />
                    </button>
                    
                    <a href="tel:9631146327" className={`px-5 py-3.5 rounded-xl border text-xs font-bold tracking-wider uppercase transition-colors flex items-center gap-2 justify-center hover:scale-105 active:scale-95 ${
                      darkMode ? "bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}>
                      <PhoneCall size={14} className="text-teal-600 dark:text-teal-400" /> {translation.contact}
                    </a>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-zinc-900 grid grid-cols-2 gap-4">
                    {[["24/7", "Clinical Registry"], ["UPI", "Cashfree Secured"]].map(([a, b]) => (
                      <div key={a}>
                        <div className="text-lg font-bold text-teal-600 dark:text-teal-400">{a}</div>
                        <div className={`text-[11px] font-semibold ${muted}`}>{b}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dashboard SaaS Status Overview */}
                <div className="lg:col-span-5">
                  <div className={`rounded-2xl p-5 border ${darkMode ? "bg-zinc-950/80 border-zinc-900" : "bg-zinc-50 border-slate-200"}`}>
                    <div className={`text-xs font-bold tracking-wider uppercase mb-4 pb-2 border-b ${darkMode ? "text-zinc-400 border-zinc-900/60" : "text-slate-500 border-slate-200"}`}>Live Dashboard Overview</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`rounded-xl p-4 border transition-all duration-300 hover:scale-105 ${darkMode ? "bg-zinc-900/40 border-zinc-900/80" : "bg-white border-slate-200"}`}>
                        <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-[10px] uppercase tracking-wider"><Stethoscope size={13} /> Consulting Specialist</div>
                        <div className="text-lg font-bold mt-2 text-zinc-900 dark:text-zinc-100">01 Active</div>
                        <p className={`text-[10px] mt-1 ${muted}`}>MD Physician</p>
                      </div>
                      <div className={`rounded-xl p-4 border transition-all duration-300 hover:scale-105 ${darkMode ? "bg-zinc-900/40 border-zinc-900/80" : "bg-white border-slate-200"}`}>
                        <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-wider"><Clock3 size={13} /> Token Counter</div>
                        <div className="text-lg font-bold mt-2 text-zinc-900 dark:text-zinc-100">#{queueNo}</div>
                        <p className={`text-[10px] mt-1 ${muted}`}>Active Token</p>
                      </div>
                      <div className={`rounded-xl p-4 border transition-all duration-300 hover:scale-105 ${darkMode ? "bg-zinc-900/40 border-zinc-900/80" : "bg-white border-slate-200"}`}>
                        <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-[10px] uppercase tracking-wider"><Wallet size={13} /> Deposit commitment</div>
                        <div className="text-lg font-bold mt-2 text-zinc-900 dark:text-zinc-100 font-mono">₹99</div>
                        <p className={`text-[10px] mt-1 ${muted}`}>Cashfree Sec</p>
                      </div>
                      <div className={`rounded-xl p-4 border transition-all duration-300 hover:scale-105 ${darkMode ? "bg-zinc-900/40 border-zinc-900/80" : "bg-white border-slate-200"}`}>
                        <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-wider"><ShieldCheck size={13} /> Safety Protocols</div>
                        <div className="text-lg font-bold mt-2 text-zinc-900 dark:text-zinc-100">ISO Standards</div>
                        <p className={`text-[10px] mt-1 ${muted}`}>System Protected</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Provider Section */}
            <section className="grid lg:grid-cols-1 gap-5">
              {INITIAL_DOCTORS.map((doc) => (
                <div key={doc.name} className={`rounded-[1.5rem] p-6 border transition-all hover:shadow-lg ${darkMode ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-slate-200"} flex flex-col md:flex-row gap-6 items-start md:items-center justify-between`}>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-zinc-800 shadow-inner">
                      <img 
                        src="https://i.ibb.co/zHff4NrF/Screenshot-2026-06-04-221109.png" 
                        alt="Dr Ajay Kumar" 
                        className="h-full w-full object-cover" 
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">{doc.name} 
                        <span className="text-[9px] font-bold tracking-wider bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded uppercase">Active status</span>
                      </h3>
                      <p className={`mt-1 text-xs font-semibold tracking-wide ${muted}`}>{doc.specialty}</p>
                      <p className="mt-2 text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1 font-bold"><Star size={12} fill="currentColor" /> {doc.rating} verified reviews</p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border max-w-md w-full ${darkMode ? "bg-zinc-950/80 border-zinc-900" : "bg-slate-50 border-slate-200"}`}>
                    <div className="text-[10px] tracking-wider text-teal-600 dark:text-teal-400 uppercase font-bold mb-1">Operational Hours</div>
                    <div className={`text-xs leading-relaxed ${muted}`}>{doc.time}</div>
                  </div>
                </div>
              ))}
            </section>

            {/* General Info / Patient Trust Review */}
            <section className="grid lg:grid-cols-2 gap-6">
              <div className={`rounded-[1.5rem] p-6 border ${darkMode ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-slate-200"}`}>
                <h2 className="text-lg font-bold mb-4 tracking-tight text-slate-900 dark:text-zinc-100">Clinical Infrastructure</h2>
                <p className={`text-xs md:text-sm leading-relaxed ${muted}`}>
                  Sanjivani Portal integrates secure hosting standards to deliver continuous scheduling services for patients.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[ ["Secure Desk", "Instant Logs"], ["Direct Contact", "WhatsApp link"], ["E-Records", "Fully encrypted"] ].map(([a, b]) => (
                    <div key={a} className={`rounded-xl p-4 border transition-colors ${darkMode ? "bg-zinc-950/40 border-zinc-900" : "bg-slate-100 border-slate-200"}`}>
                      <div className="font-bold text-xs text-zinc-800 dark:text-zinc-200">{a}</div>
                      <div className={`text-[10px] mt-1 ${muted}`}>{b}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-[1.5rem] p-6 border ${darkMode ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-slate-200"}`}>
                <h2 className="text-lg font-bold mb-4 tracking-tight text-slate-900 dark:text-zinc-100">Verified Patient Feedback</h2>
                <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2">
                  {reviews.map((r, index) => (
                    <div key={`${r.name}-${index}`} className={`rounded-xl p-4 border transition-transform duration-300 hover:scale-[1.01] ${darkMode ? "bg-zinc-950/50 border-zinc-900" : "bg-slate-50 border-slate-150"}`}>
                      <div className="flex items-center gap-1 text-amber-500 mb-2">
                        {[...Array(5)].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                        <span className="text-[10px] font-bold ml-1 opacity-75">{r.rating}</span>
                      </div>
                      <p className={`text-xs italic leading-relaxed ${muted}`}>“{r.text}”</p>
                      <div className="mt-2 text-[10px] font-bold tracking-wide uppercase text-zinc-700 dark:text-zinc-300">— {r.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Quick Consultation Banner */}
            <section className={`rounded-[1.5rem] p-6 border ${darkMode ? "bg-zinc-900/50 border-zinc-800" : "bg-teal-50/50 border-teal-100"}`}>
              <div className="grid lg:grid-cols-2 gap-5 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-bold text-[10px] uppercase tracking-wider mb-2"><BellRing size={12} className="text-teal-600 dark:text-teal-400 animate-bounce" /> Broadcast Channel</div>
                  <h2 className="text-xl md:text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-50">Physical Registry Protection</h2>
                  <p className={`mt-2 text-xs md:text-sm leading-relaxed ${muted}`}>Active roster allocations are updated immediately. Secure your token by processing the commitment deposit via Cashfree.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-start lg:justify-end">
                  <button onClick={() => setPage("booking")} className="px-5 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs tracking-wider uppercase transition-colors">Request Booking Slot</button>
                  <a href="tel:9631146327" className={`px-5 py-3.5 rounded-xl border text-center font-bold text-xs tracking-wider uppercase transition-all ${
                    darkMode ? "bg-zinc-955/80 border-zinc-855 text-zinc-300 hover:bg-zinc-900" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}>Call Registry Desk</a>
                </div>
              </div>
            </section>

            {/* Clinic Gallery */}
            <section className={`rounded-[1.5rem] p-6 border ${darkMode ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-slate-200"}`}>
              <h2 className="text-lg font-bold mb-4 tracking-tight text-slate-900 dark:text-zinc-100">Facility Environment</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  "https://i.ibb.co/ZRhN4prd/image.png",
                  "https://i.ibb.co/WNJnm3ZP/image.png",
                  "https://i.ibb.co/hFHz3KjQ/image.png",
                  "https://i.ibb.co/ZzMPTrNX/image.png"
                ].map((img, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-slate-100 dark:border-zinc-900 shadow-sm hover:scale-[1.03] transition-transform duration-300">
                    <img src={img} alt="Clinical Suite" className="h-40 w-full object-cover filter brightness-95 hover:brightness-100 transition-all duration-300" />
                  </div>
                ))}
              </div>
            </section>

            {/* Premium FAQ Layout */}
            <section className={`rounded-[1.5rem] p-6 border ${darkMode ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-slate-200"}`}>
              <h2 className="text-lg font-bold mb-4 tracking-tight text-slate-900 dark:text-zinc-100">Frequently Asked Questions</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {faqs.map(([q, a]) => (
                  <div key={q} className={`rounded-xl p-4 border transition-all duration-300 hover:border-teal-500/35 ${darkMode ? "bg-zinc-950/40 border-zinc-900" : "bg-slate-50 border-slate-200"}`}>
                    <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2"><BadgeInfo size={14} className="text-teal-600 dark:text-teal-400" /> {q}</div>
                    <p className={`text-xs leading-relaxed ${muted}`}>{a}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {page === "booking" && (
          <section className="grid lg:grid-cols-12 gap-6 animate-fade-in">
            
            {/* Left booking form column */}
            <div className={`rounded-[1.5rem] p-6 border lg:col-span-7 ${darkMode ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-slate-200"}`}>
              <h2 className="text-xl font-bold mb-4 tracking-tight text-slate-900 dark:text-zinc-100">Patient Registration</h2>
              
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] tracking-wider uppercase block mb-1.5 opacity-80 text-slate-700 dark:text-zinc-300 font-bold">Consulting Doctor</label>
                  <select 
                    value={selectedDoctor} 
                    onChange={(e) => setSelectedDoctor(e.target.value)} 
                    className={`w-full p-3 rounded-xl outline-none text-xs font-bold border ${darkMode ? "bg-zinc-900/50 border-zinc-800 text-zinc-100" : "bg-white border-slate-200 text-slate-900"}`}
                  >
                    {INITIAL_DOCTORS.map((d) => <option key={d.name} className="dark:bg-zinc-900 text-xs">{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] tracking-wider uppercase block mb-1.5 opacity-80 text-zinc-700 dark:text-zinc-300 font-bold">Select Appointment Slot</label>
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                    {slots.map((slot) => (
                      <button 
                        type="button" 
                        key={slot} 
                        onClick={() => setSelectedSlot(slot)} 
                        className={`p-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border ${
                          selectedSlot === slot 
                            ? "bg-teal-600 text-white border-teal-500 shadow-md scale-[0.98]" 
                            : `${card} hover:bg-teal-500/5 hover:border-teal-500/30`
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  {formErrors.slot && (
                    <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1 animate-scale-up"><AlertCircle size={12} /> {formErrors.slot}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] tracking-wider uppercase block mb-1.5 opacity-80 text-slate-700 dark:text-zinc-300 font-bold">Patient Full Name <span className="text-rose-500">*</span></label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={`${inputClass} ${formErrors.name ? "border-rose-500 focus:border-rose-500" : ""}`}
                      placeholder="e.g. Ramesh Kumar"
                      type="text"
                    />
                    {formErrors.name && (
                      <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1 animate-scale-up"><AlertCircle size={12} /> {formErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] tracking-wider uppercase block mb-1.5 opacity-80 text-slate-700 dark:text-zinc-300 font-bold">Patient Age (Years) <span className="text-rose-500">*</span></label>
                    <input
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                      className={`${inputClass} ${formErrors.age ? "border-rose-500 focus:border-rose-500" : ""}`}
                      placeholder="e.g. 28"
                      type="number"
                      min="1"
                      max="120"
                    />
                    {formErrors.age && (
                      <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1 animate-scale-up"><AlertCircle size={12} /> {formErrors.age}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] tracking-wider uppercase block mb-1.5 opacity-80 text-zinc-700 dark:text-zinc-300 font-bold">Phone Number (For Booking Updates) <span className="text-rose-500">*</span></label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className={`${inputClass} ${formErrors.phone ? "border-rose-500 focus:border-rose-500" : ""}`}
                      placeholder="Enter 10-digit primary contact"
                      type="tel"
                    />
                    {formErrors.phone && (
                      <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1 animate-scale-up"><AlertCircle size={12} /> {formErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] tracking-wider uppercase block mb-1.5 opacity-80 text-zinc-700 dark:text-zinc-300 font-bold">Gender Identifier</label>
                    <select 
                      value={form.gender} 
                      onChange={(e) => setForm({ ...form, gender: e.target.value })} 
                      className={`w-full p-3.5 rounded-xl outline-none text-xs font-bold border ${darkMode ? "bg-zinc-900/50 border-zinc-800 text-zinc-100" : "bg-white border-slate-200 text-slate-900"}`}
                    >
                      <option className="dark:bg-zinc-900">Male</option>
                      <option className="dark:bg-zinc-900">Female</option>
                      <option className="dark:bg-zinc-900">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] tracking-wider uppercase block mb-1.5 opacity-80 text-zinc-700 dark:text-zinc-300 font-bold">Symptom Notes / Clinical Description (Optional)</label>
                  <textarea 
                    rows="2" 
                    value={form.reason} 
                    onChange={(e) => setForm({ ...form, reason: e.target.value })} 
                    className={inputClass} 
                    placeholder="Provide optional notes regarding active clinical symptoms or diagnosis references..." 
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button 
                  onClick={handleBookingClick} 
                  className="px-6 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs tracking-wider uppercase shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all w-full"
                >
                  Confirm Slot & Secure ₹99 Deposit
                </button>
                <button className={`px-5 py-3 rounded-xl border hover:scale-[1.01] active:scale-[0.99] transition-all ${darkMode ? "bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800" : "bg-white border-slate-200 text-slate-700"} flex items-center justify-center gap-2 text-xs font-bold tracking-wider uppercase w-full`}>
                  <Upload size={14} className="text-teal-600 dark:text-teal-400" /> Upload Documents or Old Prescriptions
                </button>
              </div>
            </div>

            {/* Right Booking receipt summary column - Fixed Post-Confirmation View Bug */}
            <div className={`rounded-[1.5rem] p-6 border lg:col-span-5 ${darkMode ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-slate-200"} flex flex-col justify-between`}>
              <div>
                <h2 className="text-xl font-bold mb-4 tracking-tight text-slate-900 dark:text-zinc-100">Appointment Receipt</h2>
                <div className={`rounded-2xl p-5 border ${darkMode ? "bg-zinc-950/80 border-zinc-900" : "bg-slate-50 border-slate-200"}`}>
                  <div className={`flex items-center justify-between border-b pb-4 mb-4 ${darkMode ? "border-zinc-900/60" : "border-slate-200"}`}>
                    <div>
                      <div className="text-[9px] tracking-wider uppercase text-slate-500 dark:text-zinc-400 font-bold">Provider Assigned</div>
                      <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {bookingStatus === "confirmed" && lastConfirmedBooking ? lastConfirmedBooking.doctor : selectedDoctor}
                      </div>
                    </div>
                    <Stethoscope size={20} className="text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[9px] tracking-wider uppercase text-slate-500 dark:text-zinc-400 font-bold">Schedule Date</div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5 mt-1">
                        <CalendarDays size={13} /> {todayLabel}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] tracking-wider uppercase text-slate-500 dark:text-zinc-400 font-bold">Reserved Slot</div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5 mt-1">
                        <Clock3 size={13} /> {bookingStatus === "confirmed" && lastConfirmedBooking ? lastConfirmedBooking.slot : (selectedSlot || "None Selected")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] tracking-wider uppercase text-slate-500 dark:text-zinc-400 font-bold">Queue Token</div>
                      <div className="text-sm font-bold text-teal-600 dark:text-teal-400 mt-1 font-mono">
                        {/* Dynamic Token Mapping - Solved summary race condition */}
                        {bookingStatus === "confirmed" && lastConfirmedBooking ? `#${lastConfirmedBooking.token}` : "Awaiting Authorization"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] tracking-wider uppercase text-slate-500 dark:text-zinc-400 font-bold">Booking Status</div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-200 mt-1 flex items-center gap-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${bookingStatus === "confirmed" ? "bg-teal-500 animate-pulse" : "bg-amber-500"}`}></span>
                        {bookingStatus === "confirmed" ? " Roster Confirmed" : "Awaiting Deposit"}
                      </div>
                    </div>
                  </div>
                  
                  {/* Dynamic Audit Trail Timeline rendering for Confirmed Appointments */}
                  {bookingStatus === "confirmed" && lastConfirmedBooking?.timeline && (
                    <div className="mt-4 pt-4 border-t border-zinc-900/60 text-left">
                      <div className="text-[9px] tracking-wider uppercase text-slate-500 dark:text-zinc-400 font-bold mb-2">Audit trail events</div>
                      <div className="space-y-2">
                        {lastConfirmedBooking.timeline.map((event, idx) => (
                          <div key={idx} className="flex gap-2 text-[10px] leading-relaxed animate-fade-in">
                            <span className="text-teal-400 font-mono shrink-0">[{event.timestamp}]</span>
                            <span className="text-slate-700 dark:text-zinc-300">{event.notes}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={`mt-5 p-4 rounded-xl border text-[11px] leading-relaxed ${darkMode ? "bg-zinc-900/50 border-zinc-800 text-zinc-400" : "bg-white border-slate-200 text-slate-655"}`}>
                    Sanjivani Clinic runs an automated patient intake. Once the commitment deposit is cleared via Cashfree, your slot and SMS update tracker are registered.
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-6">
                <div className={`rounded-xl p-3 border ${darkMode ? "bg-zinc-950/60 border-zinc-900" : "bg-slate-50 border-slate-200"} flex items-center gap-3`}>
                  <MapPinned className="shrink-0 text-teal-600 dark:text-teal-400" size={16} />
                  <div>
                    <div className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Physical Registry</div>
                    <div className={`text-[10px] ${muted}`}>Main clinic address near central network</div>
                  </div>
                </div>
                <div className={`rounded-xl p-3 border ${darkMode ? "bg-zinc-950/60 border-zinc-900" : "bg-slate-50 border-slate-200"} flex items-center gap-3`}>
                  <MessageCircle className="shrink-0 text-emerald-500" size={16} />
                  <div>
                    <div className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Roster Desk Help</div>
                    <div className={`text-[10px] ${muted}`}>Operational support channels available</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {page === "admin-login" && (
          <section className="max-w-md mx-auto animate-fade-in">
            <div className={`rounded-[1.5rem] p-6 border ${darkMode ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-slate-200"}`}>
              <div className="h-10 w-10 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center mb-4 border border-teal-500/20">
                <Lock size={18} />
              </div>
              <h2 className="text-xl font-bold mb-1 tracking-tight text-slate-900 dark:text-zinc-100">Staff Portal Access</h2>
              <p className={`${muted} text-xs mb-5`}>Roster administration login portal.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] tracking-wider uppercase block mb-1.5 opacity-80 text-zinc-700 dark:text-zinc-300 font-bold">Roster Security Key</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={adminPassword} 
                    onChange={(e) => setAdminPassword(e.target.value)} 
                    className={inputClass} 
                  />
                </div>
                <button onClick={unlockAdmin} className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs tracking-wider uppercase hover:scale-[1.01] active:scale-[0.99] transition-all">Authorize Console</button>
                {adminError && <p className="text-xs text-rose-400 font-bold">{adminError}</p>}
                <p className="text-[10px] text-zinc-500 leading-normal">This console handles patient medical files and appointments. Please safeguard active credentials.</p>
              </div>
            </div>
          </section>
        )}

        {page === "admin" && adminUnlocked && (
          <section className="space-y-6 animate-fade-in">
            <div className={`rounded-[1.5rem] p-6 border ${darkMode ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-slate-200"} flex flex-col md:flex-row gap-4 items-start md:items-center justify-between`}>
              <div>
                <h2 className="text-xl font-bold mb-1 tracking-tight text-slate-900 dark:text-zinc-100">Staff Workspace Console</h2>
                <p className={`text-xs ${muted}`}>Monitor patient profiles, publish roster slots, and manage active scheduling tables.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button 
                  onClick={() => setShowAddSlotRow((v) => !v)}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
                >
                  <Plus size={14} /> Add Slot
                </button>
                
                {/* Reset Queue Button */}
                <button 
                  onClick={() => setShowResetConfirmModal(true)}
                  className="px-4 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
                >
                  <RotateCcw size={14} /> Reset Queue
                </button>

                <button 
                  onClick={handleAdminLogout}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </div>

            {showAddSlotRow && (
              <div className={`rounded-[1.5rem] p-5 border ${darkMode ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-slate-200"} max-w-md space-y-3 animate-scale-up`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-750 dark:text-zinc-300">Create Operational Time Segment</h4>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="e.g. 11:45 AM" 
                    value={newSlotInput} 
                    onChange={(e) => setNewSlotInput(e.target.value)} 
                    className={inputClass}
                  />
                  <button 
                    onClick={handleAddSlot} 
                    className="px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs transition-colors"
                  >
                    Publish
                  </button>
                </div>
              </div>
            )}

            <div className={`rounded-[1.5rem] p-6 border ${darkMode ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-slate-200"}`}>
              <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-6 pb-4 border-b ${darkMode ? "border-zinc-900/60" : "border-slate-200"}`}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                  </span>
                  Roster Activity Registry
                </h3>
                <div className="flex items-center gap-2 max-w-xs w-full bg-slate-100 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 p-2 rounded-xl text-xs">
                  <Search size={14} className="text-zinc-400" />
                  <input 
                    placeholder="Filter active rosters..." 
                    value={adminSearchTerm}
                    onChange={(e) => setAdminSearchTerm(e.target.value)}
                    className={`bg-transparent outline-none w-full text-xs ${darkMode ? "text-white" : "text-slate-900"}`} 
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className={muted}>
                    <tr className={`border-b ${darkMode ? "border-zinc-900" : "border-slate-200"}`}>
                      <th className="text-[10px] uppercase tracking-wider pb-3 px-2 font-bold">Patient Records</th>
                      <th className="text-[10px] uppercase tracking-wider pb-3 px-2 font-bold">Intake Symptom</th>
                      <th className="text-[10px] uppercase tracking-wider pb-3 px-2 font-bold">Roster Block</th>
                      <th className="text-[10px] uppercase tracking-wider pb-3 px-2 font-bold">Billing Status</th>
                      <th className="text-[10px] uppercase tracking-wider pb-3 px-2 text-right font-bold">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-zinc-500">No appointments found.</td>
                      </tr>
                    ) : (
                      filteredBookings.map((booking, index) => (
                        <tr key={`${booking.name}-${index}`} className={`border-b hover:bg-teal-500/[0.02] transition-all ${darkMode ? "border-zinc-900/40" : "border-slate-100"}`}>
                          <td className="py-4 px-2">
                            <div className="font-bold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                              {booking.name} 
                              <span className="text-[9px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.25 rounded">#{booking.token || index + 1}</span>
                            </div>
                            <div className="text-[10px] tracking-wide uppercase text-zinc-500 dark:text-zinc-505 mt-1">
                              Ph: {booking.phone} • {booking.gender} • Age {booking.age}
                            </div>
                          </td>
                          <td className="py-4 px-2 text-xs italic text-zinc-600 dark:text-zinc-400">{booking.reason || "Scheduled Consultation"}</td>
                          <td className="py-4 px-2 text-xs tracking-wider font-bold text-teal-600 dark:text-teal-400">{booking.slot}</td>
                          <td className="py-4 px-2 text-[10px]">
                            <span className={`px-2 py-0.5 rounded-full font-bold tracking-widest uppercase border ${getStatusStyles(booking.status)}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-right">
                            {editingIndex === index ? (
                              <div className="flex flex-col gap-2 p-2 bg-zinc-950/60 rounded-xl max-w-xs ml-auto border border-zinc-900 animate-scale-up">
                                <input 
                                  value={editForm.name} 
                                  onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
                                  className="p-1.5 text-xs rounded bg-zinc-900 border border-zinc-800 text-white font-medium" 
                                />
                                <input 
                                  value={editForm.slot} 
                                  onChange={(e) => setEditForm({...editForm, slot: e.target.value})} 
                                  className="p-1.5 text-xs rounded bg-zinc-900 border border-zinc-800 text-white font-medium" 
                                />
                                <select 
                                  value={editForm.status} 
                                  onChange={(e) => setEditForm({...editForm, status: e.target.value})} 
                                  className="p-1.5 text-xs rounded bg-zinc-900 border border-zinc-800 text-white font-medium"
                                >
                                  <option>Pending</option>
                                  <option>Confirmed</option>
                                  <option>Completed</option>
                                  <option>Rejected</option>
                                </select>
                                <div className="flex gap-1.5 justify-end mt-1">
                                  <button onClick={() => handleSaveEdit(index)} className="px-3 py-1 bg-teal-600 text-white font-bold rounded-lg text-[9px] uppercase tracking-wider">Save</button>
                                  <button onClick={() => setEditingIndex(null)} className="px-3 py-1 bg-zinc-800 text-zinc-300 font-bold rounded-lg text-[9px] uppercase tracking-wider">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-1.5 justify-end flex-wrap animate-fade-in">
                                <button 
                                  onClick={() => handleApprove(index)} 
                                  className="px-2.5 py-1.5 rounded-lg border border-teal-500/20 bg-teal-500/10 hover:bg-teal-600 text-teal-600 hover:text-white font-bold text-[10px] uppercase tracking-wide transition-all duration-200"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleStartEdit(index, booking)} 
                                  className="px-2.5 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 hover:bg-amber-400 text-amber-600 hover:text-white font-bold text-[10px] uppercase tracking-wide transition-all duration-200"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleReject(index)} 
                                  className="px-2.5 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white font-bold text-[10px] uppercase tracking-wide transition-all duration-200"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {page === "business-info" && (
          <section className="max-w-3xl mx-auto py-8 md:py-12 animate-fade-in">
            <div className={`rounded-[1.5rem] p-6 md:p-10 border ${darkMode ? "bg-zinc-900/30 border-zinc-800 text-zinc-100" : "bg-white border-slate-200 text-slate-900"} shadow-lg`}>
              <h2 className="text-2xl md:text-3xl font-bold mb-6 tracking-tight">Business Information</h2>
              <div className="space-y-6 text-sm md:text-base leading-relaxed">
                <p className="font-semibold text-lg text-teal-600 dark:text-teal-400">
                  This platform is operated by AJAY KUMAR SECURITY AGENCY.
                </p>
                <p className={muted}>
                  AJAY KUMAR SECURITY AGENCY is the legal entity responsible for operating and managing the Sanjivani Clinic booking platform. Sanjivani Clinic is the public-facing brand used for healthcare and appointment booking services, while the platform's operations, administration, and related business activities are conducted under AJAY KUMAR SECURITY AGENCY. This disclosure is provided for transparency, compliance, and business identification purposes.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-zinc-800">
                <button
                  onClick={() => { setPage("home"); window.scrollTo(0, 0); }}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs tracking-wider uppercase transition-all"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* FOOTER SECTION: Dynamic Contrast and Always Stick to Bottom */}
      <footer className={`mt-auto border-t py-8 transition-colors duration-300 ${darkMode ? "border-zinc-900 bg-zinc-950/40" : "border-slate-200 bg-white/60"}`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 flex-shrink-0 bg-teal-600 rounded overflow-hidden border border-teal-500/20 relative shadow-sm">
              <img 
                src="https://i.ibb.co/ZRhN4prd/image.png" 
                alt="Clinic Emblem" 
                className="h-full w-full object-cover" 
              />
            </div>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">Sanjivani Clinic</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium">
            <button 
              onClick={() => { setPage("home"); window.scrollTo(0, 0); }}
              className="text-slate-600 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              Dashboard
            </button>
            <button 
              onClick={() => { setPage("booking"); window.scrollTo(0, 0); }}
              className="text-slate-600 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              Book Appointment
            </button>
            <button 
              onClick={() => { setPage("business-info"); window.scrollTo(0, 0); }}
              className="text-slate-600 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-bold"
            >
              Business Information
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-500">
            &copy; {new Date().getFullYear()} Sanjivani Clinic. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Floating WhatsApp Care Link */}
      <a 
        href="https://wa.me/919631146327" 
        target="_blank" 
        rel="noreferrer" 
        className="hidden md:grid fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white place-items-center shadow-lg shadow-emerald-500/10 hover:scale-105 transition-transform"
        title="Active Support Chat"
      >
        <MessageCircle size={20} />
      </a>
    </div>
  );
}
