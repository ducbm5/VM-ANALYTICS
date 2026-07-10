import React, { useEffect, useState, useMemo } from "react";
import { Participant } from "./types";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Calendar as CalendarIcon, 
  Filter, 
  Search, 
  Activity, 
  DollarSign,
  Trash2,
  PieChart as PieIcon,
  Globe,
  MapPin,
  Users,
  Brain,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { format, parse, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

const DEFAULT_TOKEN = "898989";

const isVietnam = (nat: string) => {
  const n = nat.toLowerCase().trim();
  return n === "việt nam" || n === "vietnam" || n === "vn" || n.includes("viet");
};

const isHanoi = (prov: string) => {
  const p = prov.toLowerCase().trim();
  return p.includes("hà nội") || p.includes("hanoi") || p === "hn";
};

const isHcm = (prov: string) => {
  const p = prov.toLowerCase().trim();
  return p.includes("hồ chí minh") || p.includes("ho chi minh") || p.includes("hcm") || p.includes("sài gòn") || p.includes("sai gon");
};

interface DashboardSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  description?: string;
  rightElement?: React.ReactNode;
}

function DashboardSection({ title, icon, children, description, rightElement }: DashboardSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 border border-[var(--line)]/20 bg-white/30">
            {icon}
          </div>
          <div>
            <h2 className="text-2xl font-serif italic uppercase tracking-tight leading-none">{title}</h2>
            {description && <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest mt-1">{description}</p>}
          </div>
        </div>
        {rightElement}
      </div>
      <div className="border border-[var(--line)] overflow-hidden bg-white/20 backdrop-blur-sm">
        {children}
      </div>
    </section>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const [data, setData] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Auth State
  const [validToken, setValidToken] = useState(DEFAULT_TOKEN);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Filters
  const [selectedRaces, setSelectedRaces] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedDistance, setSelectedDistance] = useState<string>("all");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    "Đang tổng hợp dữ liệu BIB và cơ cấu giải chạy...",
    "Đang tính toán chi tiết doanh thu theo cự ly...",
    "Đang phân tích hành vi mua vé qua các giai đoạn...",
    "Đang phác họa chân dung runner mục tiêu...",
    "Đang lập đề xuất chiến lược du lịch địa phương & B2B...",
    "Đang biên soạn báo cáo phân tích toàn diện..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (aiLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [aiLoading]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput === validToken) {
      localStorage.setItem("marathon_auth_token", validToken);
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("marathon_auth_token");
    setIsAuthenticated(false);
    setTokenInput("");
  };

  const resetFilters = () => {
    setSelectedRaces([]);
    setSelectedYear("all");
    setSelectedDistance("all");
    setSelectedStage("all");
    setSelectedGender("all");
    setSearchTerm("");
  };

  const generateAiAnalysis = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const racesSummary: Record<string, any> = {};
      
      filteredData.forEach(p => {
        const r = p.RACE || "Unknown";
        if (!racesSummary[r]) {
          racesSummary[r] = {
            name: r,
            participantsCount: 0,
            revenue: 0,
            distances: {} as Record<string, number>,
            stages: {} as Record<string, number>,
          };
        }
        racesSummary[r].participantsCount += 1;
        const amt = parseFloat(p.TXNAMOUNT?.replace(/,/g, "") || "0");
        racesSummary[r].revenue += amt;

        const dist = p.DISTANCE || "Unknown";
        racesSummary[r].distances[dist] = (racesSummary[r].distances[dist] || 0) + 1;

        const stg = p.STAGE || "Unknown";
        racesSummary[r].stages[stg] = (racesSummary[r].stages[stg] || 0) + 1;
      });

      const formattedRaces = Object.values(racesSummary).map((r: any) => ({
        raceName: r.name,
        participantsCount: r.participantsCount,
        revenue: `${r.revenue.toLocaleString()} VND`,
        distances: r.distances,
        stages: r.stages
      }));

      const topProvinces = provinceStats.slice(0, 8).map(p => ({
        name: p.name,
        participants: p.count,
        revenue: `${p.revenue.toLocaleString()} VND`
      }));

      const ageGroups = ageGroupStats.map(a => ({
        group: a.name,
        participants: a.count,
        revenue: `${a.revenue.toLocaleString()} VND`
      }));

      const gender = genderStats.map(g => ({
        gender: g.name,
        participants: g.value,
        percentage: `${g.percentage}%`,
        revenue: `${g.revenue.toLocaleString()} VND`
      }));

      const registrationTypes = registrationTypeStats.map(r => ({
        type: r.name,
        participants: r.value,
        percentage: `${r.percentage}%`,
        revenue: `${r.revenue.toLocaleString()} VND`
      }));

      const statsPayload = {
        totalParticipants: filteredData.length,
        totalRevenue: `${filteredData.reduce((acc, curr) => acc + parseFloat(curr.TXNAMOUNT?.replace(/,/g, "") || "0"), 0).toLocaleString()} VND`,
        races: formattedRaces,
        topProvinces,
        ageGroups,
        genderStats: gender,
        registrationTypeStats: registrationTypes,
        currentFilters: {
          races: selectedRaces.length === 0 ? "All" : selectedRaces.join(", "),
          year: selectedYear,
          distance: selectedDistance,
          stage: selectedStage,
          gender: selectedGender,
          search: searchTerm || "None"
        }
      };

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats: statsPayload }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const textText = await res.text();
        console.error("Non-JSON response:", textText);
        throw new Error(
          "Máy chủ trả về phản hồi không hợp lệ (Không phải JSON). " +
          "Nếu bạn chạy trên Vercel, nguyên nhân thường do: " +
          "1. Chưa cấu hình GEMINI_API_KEY trong Environment Variables của Vercel. " +
          "2. Vercel không tự động chạy file backend Express server.ts (Vercel cần cấu hình vercel.json hoặc chuyển tiếp API sang Serverless Functions). " +
          "Hãy kiểm tra Vercel logs để biết chi tiết!"
        );
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Phân tích thất bại");
      }

      const responseData = await res.json();
      setAiAnalysis(responseData.analysis);
    } catch (err: any) {
      console.error("Analysis generation failed:", err);
      setAiError(err.message || "Đã xảy ra lỗi trong quá trình phân tích số liệu.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const token = "898989";
      setValidToken(token);
      const saved = localStorage.getItem("marathon_auth_token");
      if (saved === token) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        if (saved) {
          localStorage.removeItem("marathon_auth_token");
          setAuthError(true);
        }
      }
      setIsAuthChecking(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchSheetData = async () => {
        try {
          const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQxuhrc5QjBVqXjzOMvqpUil3_hdl_eX2sqrsTKZPkEs-UBrTqSJUn3fNsB2nJvgggXajcS9bepcRiU/pub?gid=0&single=true&output=tsv";
          // Add cache buster to prevent stale data
          const cacheBuster = `&t=${Date.now()}`;
          const response = await fetch(url + cacheBuster);
          if (!response.ok) throw new Error("Network response was not ok");
          const tsvData = await response.text();
          
          const lines = tsvData.split("\n");
          const result: Participant[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const currentLine = lines[i].split("\t");
            if (currentLine.length === 0 || !currentLine[0]?.trim()) continue;
            
            const obj: Participant = {
              RACE: currentLine[0]?.trim() || "",
              DISTANCE: currentLine[1]?.trim() || "",
              GENDER: currentLine[2]?.trim() || "",
              TXNAMOUNT: currentLine[3]?.trim() || "0",
              AGE: currentLine[4]?.trim() || "",
              AGE_GROUP: currentLine[5]?.trim() || "",
              NATIONALITY: currentLine[6]?.trim() || "",
              PROVINCE_CITY: currentLine[7]?.trim() || "",
              REGISTRATION_TYPE: currentLine[8]?.trim() || "",
              PARTNER: currentLine[9]?.trim() || "",
              STAGE: currentLine[10]?.trim() || "",
              PARTNER_2: currentLine[11]?.trim() || ""
            };
            result.push(obj);
          }
          
          setData(result);
          setLoading(false);
        } catch (err) {
          console.error("Error fetching marathon data:", err);
          setError("Failed to load data from Google Sheets. Please check your internet connection or the sheet's public access.");
          setLoading(false);
        }
      };

      fetchSheetData();
    }
  }, [isAuthenticated]);

  const filteredData = useMemo(() => {
    return data.filter((p) => {
      const matchesRace = selectedRaces.length === 0 || (p.RACE && selectedRaces.includes(p.RACE));
      const matchesDistance = selectedDistance === "all" || p.DISTANCE === selectedDistance;
      const matchesStage = selectedStage === "all" || p.STAGE === selectedStage;
      
      const matchesYear = selectedYear === "all" || (() => {
        if (!p.RACE) return false;
        const match = p.RACE.match(/\d{2}$/);
        const yr = match ? "20" + match[0] : "Khác";
        return yr === selectedYear;
      })();

      const matchesGender = selectedGender === "all" || (() => {
        const g = p.GENDER?.toUpperCase().trim();
        if (selectedGender === "Nam") return g === "M" || g === "NAM";
        if (selectedGender === "Nữ") return g === "F" || g === "NU" || g === "NỮ";
        if (selectedGender === "Khác") return g !== "M" && g !== "NAM" && g !== "F" && g !== "NU" && g !== "NỮ" && g !== undefined && g !== "";
        return false;
      })();

      const matchesSearch = 
        !searchTerm ||
        p.RACE?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesRace && matchesYear && matchesDistance && matchesStage && matchesGender && matchesSearch;
    });
  }, [data, selectedRaces, selectedYear, selectedDistance, selectedStage, selectedGender, searchTerm]);

  // Revenue Calculation
  const revenueStats = useMemo(() => {
    const stats: Record<string, Record<string, number>> = {};
    
    filteredData.forEach((p) => {
      const raceName = p.RACE || "Unknown";
      const distance = p.DISTANCE || "Unknown";
      const amount = parseFloat(p.TXNAMOUNT?.replace(/,/g, "") || "0");

      if (!stats[raceName]) stats[raceName] = {};
      stats[raceName][distance] = (stats[raceName][distance] || 0) + amount;
    });

    return stats;
  }, [filteredData]);

  // BIB Stats by Stage
  const bibStageStats = useMemo(() => {
    const stats: Record<string, Record<string, number>> = {};
    filteredData.forEach((p) => {
      const raceName = p.RACE || "Unknown";
      const stage = p.STAGE || "Unknown";
      if (!stats[raceName]) stats[raceName] = {};
      stats[raceName][stage] = (stats[raceName][stage] || 0) + 1;
    });
    return stats;
  }, [filteredData]);

  // BIB Stats by Distance
  const bibDistanceStats = useMemo(() => {
    const stats: Record<string, Record<string, number>> = {};
    filteredData.forEach((p) => {
      const raceName = p.RACE || "Unknown";
      const distance = p.DISTANCE || "Unknown";
      if (!stats[raceName]) stats[raceName] = {};
      stats[raceName][distance] = (stats[raceName][distance] || 0) + 1;
    });
    return stats;
  }, [filteredData]);

  // Nationality Statistics (Viet Nam vs International grouping)
  const nationalityGroupStats = useMemo(() => {
    let vnCount = 0;
    let vnRevenue = 0;
    let intlCount = 0;
    let intlRevenue = 0;

    filteredData.forEach((p) => {
      const nat = p.NATIONALITY?.trim() || "";
      const amount = parseFloat(p.TXNAMOUNT?.replace(/,/g, "") || "0");
      
      if (isVietnam(nat)) {
        vnCount += 1;
        vnRevenue += amount;
      } else {
        intlCount += 1;
        intlRevenue += amount;
      }
    });

    const total = vnCount + intlCount;

    return {
      vietnam: {
        count: vnCount,
        revenue: vnRevenue,
        percentage: total > 0 ? ((vnCount / total) * 100).toFixed(1) : "0",
      },
      international: {
        count: intlCount,
        revenue: intlRevenue,
        percentage: total > 0 ? ((intlCount / total) * 100).toFixed(1) : "0",
      },
      total,
    };
  }, [filteredData]);

  // Nationality Statistics
  const nationalityStats = useMemo(() => {
    const stats: Record<string, { count: number; revenue: number }> = {};
    filteredData.forEach((p) => {
      const nationality = p.NATIONALITY?.trim() || "Chưa xác định";
      const amount = parseFloat(p.TXNAMOUNT?.replace(/,/g, "") || "0");
      if (!stats[nationality]) {
        stats[nationality] = { count: 0, revenue: 0 };
      }
      stats[nationality].count += 1;
      stats[nationality].revenue += amount;
    });
    return Object.entries(stats)
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // Province/City Statistics
  const provinceStats = useMemo(() => {
    const stats: Record<string, { count: number; revenue: number }> = {};
    filteredData.forEach((p) => {
      let province = p.PROVINCE_CITY?.trim() || "Chưa xác định";
      if (province === "") province = "Chưa xác định";
      const amount = parseFloat(p.TXNAMOUNT?.replace(/,/g, "") || "0");
      if (!stats[province]) {
        stats[province] = { count: 0, revenue: 0 };
      }
      stats[province].count += 1;
      stats[province].revenue += amount;
    });
    return Object.entries(stats)
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // Province/City Group Statistics (HN, HCM, Others)
  const provinceGroupStats = useMemo(() => {
    let hnCount = 0;
    let hnRevenue = 0;
    let hcmCount = 0;
    let hcmRevenue = 0;
    let otherCount = 0;
    let otherRevenue = 0;

    filteredData.forEach((p) => {
      const province = p.PROVINCE_CITY?.trim() || "Chưa xác định";
      const amount = parseFloat(p.TXNAMOUNT?.replace(/,/g, "") || "0");

      if (isHanoi(province)) {
        hnCount += 1;
        hnRevenue += amount;
      } else if (isHcm(province)) {
        hcmCount += 1;
        hcmRevenue += amount;
      } else {
        otherCount += 1;
        otherRevenue += amount;
      }
    });

    const total = hnCount + hcmCount + otherCount;

    return {
      hanoi: {
        count: hnCount,
        revenue: hnRevenue,
        percentage: total > 0 ? ((hnCount / total) * 100).toFixed(1) : "0",
      },
      hcm: {
        count: hcmCount,
        revenue: hcmRevenue,
        percentage: total > 0 ? ((hcmCount / total) * 100).toFixed(1) : "0",
      },
      others: {
        count: otherCount,
        revenue: otherRevenue,
        percentage: total > 0 ? ((otherCount / total) * 100).toFixed(1) : "0",
      },
      total,
    };
  }, [filteredData]);

  // Age Group Statistics
  const ageGroupStats = useMemo(() => {
    const stats: Record<string, { count: number; revenue: number }> = {};
    filteredData.forEach((p) => {
      const ageGroup = p.AGE_GROUP?.trim() || "Chưa xác định";
      const amount = parseFloat(p.TXNAMOUNT?.replace(/,/g, "") || "0");
      if (!stats[ageGroup]) {
        stats[ageGroup] = { count: 0, revenue: 0 };
      }
      stats[ageGroup].count += 1;
      stats[ageGroup].revenue += amount;
    });
    return Object.entries(stats)
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // Gender Statistics and Chart Data
  const genderStats = useMemo(() => {
    let maleCount = 0;
    let maleRevenue = 0;
    let femaleCount = 0;
    let femaleRevenue = 0;
    let otherCount = 0;
    let otherRevenue = 0;

    filteredData.forEach((p) => {
      const gender = p.GENDER?.toUpperCase().trim();
      const amount = parseFloat(p.TXNAMOUNT?.replace(/,/g, "") || "0");
      
      if (gender === "M" || gender === "NAM") {
        maleCount += 1;
        maleRevenue += amount;
      } else if (gender === "F" || gender === "NU" || gender === "NỮ") {
        femaleCount += 1;
        femaleRevenue += amount;
      } else {
        otherCount += 1;
        otherRevenue += amount;
      }
    });

    const total = maleCount + femaleCount + otherCount;

    return [
      { name: "Nam", value: maleCount, revenue: maleRevenue, percentage: total > 0 ? ((maleCount / total) * 100).toFixed(1) : "0" },
      { name: "Nữ", value: femaleCount, revenue: femaleRevenue, percentage: total > 0 ? ((femaleCount / total) * 100).toFixed(1) : "0" },
      { name: "Khác/Chưa rõ", value: otherCount, revenue: otherRevenue, percentage: total > 0 ? ((otherCount / total) * 100).toFixed(1) : "0" },
    ].filter(item => item.value > 0);
  }, [filteredData]);

  // Registration Type Statistics (Group vs Individual)
  const registrationTypeStats = useMemo(() => {
    let individualCount = 0;
    let individualRevenue = 0;
    let groupCount = 0;
    let groupRevenue = 0;
    let otherCount = 0;
    let otherRevenue = 0;

    filteredData.forEach((p) => {
      const type = p.REGISTRATION_TYPE?.toUpperCase().trim() || "";
      const amount = parseFloat(p.TXNAMOUNT?.replace(/,/g, "") || "0");

      if (type === "CÁ NHÂN" || type === "CA NHAN" || type === "INDIVIDUAL" || type === "CÂN NHÂN" || type === "CÁNHÂN") {
        individualCount += 1;
        individualRevenue += amount;
      } else if (type === "NHÓM" || type === "NHOM" || type === "GROUP" || type.includes("NHÓM") || type.includes("NHOM") || type.includes("GROUP")) {
        groupCount += 1;
        groupRevenue += amount;
      } else if (type !== "") {
        // Any specific partner registration code or non-individual is considered a group registration
        groupCount += 1;
        groupRevenue += amount;
      } else {
        otherCount += 1;
        otherRevenue += amount;
      }
    });

    const total = individualCount + groupCount + otherCount;

    return [
      { name: "Cá nhân", value: individualCount, revenue: individualRevenue, percentage: total > 0 ? ((individualCount / total) * 100).toFixed(1) : "0" },
      { name: "Nhóm / Doanh nghiệp", value: groupCount, revenue: groupRevenue, percentage: total > 0 ? ((groupCount / total) * 100).toFixed(1) : "0" },
      { name: "Khác/Chưa xác định", value: otherCount, revenue: otherRevenue, percentage: total > 0 ? ((otherCount / total) * 100).toFixed(1) : "0" },
    ].filter(item => item.value > 0);
  }, [filteredData]);

  const allDistances = useMemo(() => {
    const dists = new Set<string>();
    data.forEach(p => { if (p.DISTANCE) dists.add(p.DISTANCE); });
    return Array.from(dists).sort((a, b) => parseFloat(a) - parseFloat(b));
  }, [data]);

  const allStages = useMemo(() => {
    const stages = new Set<string>();
    data.forEach(p => { if (p.STAGE) stages.add(p.STAGE); });
    return Array.from(stages).sort();
  }, [data]);

  const allRaceNames = useMemo(() => {
    const names = new Set<string>();
    data.forEach(p => { if (p.RACE) names.add(p.RACE); });
    return Array.from(names).sort();
  }, [data]);

  const allYears = useMemo(() => {
    const years = new Set<string>();
    data.forEach(p => {
      if (p.RACE) {
        const match = p.RACE.match(/\d{2}$/);
        if (match) {
          years.add("20" + match[0]);
        } else {
          years.add("Khác");
        }
      }
    });
    return Array.from(years).sort().reverse();
  }, [data]);

  if (isAuthChecking) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg)]">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="font-mono text-sm uppercase tracking-widest">Verifying Security...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="inline-block p-3 border border-[var(--line)] mb-4">
              <Activity className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-serif italic uppercase tracking-tighter">Security Access</h1>
            <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Authorized Personnel Only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="col-header">Access Token</Label>
              <Input 
                type="password"
                placeholder="Enter security token..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className={cn(
                  "rounded-none border-[var(--line)] bg-white/50 font-mono text-center text-lg tracking-[0.5em]",
                  authError && "border-red-500 ring-1 ring-red-500"
                )}
              />
              {authError && (
                <p className="text-[10px] font-mono text-red-600 uppercase text-center">Invalid Token. Access Denied.</p>
              )}
            </div>
            <Button type="submit" className="w-full rounded-none bg-[var(--ink)] text-[var(--bg)] font-mono uppercase py-6 text-sm tracking-widest">
              Verify & Enter
            </Button>
          </form>

          <div className="pt-8 border-t border-[var(--line)] opacity-20 text-center">
            <p className="text-[9px] font-mono uppercase tracking-widest">Marathon Revenue Intelligence v2.2.0</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg)]">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="font-mono text-sm uppercase tracking-widest">Synchronizing Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[var(--line)] pb-8 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="rounded-none border-[var(--line)] font-mono text-[10px] uppercase">Live Feed</Badge>
            <span className="text-[10px] font-mono opacity-40 uppercase tracking-widest">v2.2.0</span>
          </div>
          <h1 className="text-5xl font-serif italic tracking-tighter uppercase leading-none">Marathon Analytics</h1>
          <p className="text-xs opacity-50 font-mono mt-2 uppercase tracking-wider">Financial & Registration Performance</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleLogout} className="text-[10px] font-mono uppercase opacity-40 hover:opacity-100">Logout</Button>
          <div className="h-12 w-[1px] bg-[var(--line)] opacity-20 hidden md:block" />
          <div className="text-right">
            <p className="text-[10px] font-mono opacity-40 uppercase">Total Filtered Revenue</p>
            <p className="text-2xl font-serif italic">
              {Object.values(revenueStats).reduce((acc, curr) => acc + Object.values(curr).reduce((a, b) => a + b, 0), 0).toLocaleString()} VND
            </p>
          </div>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-white/40 backdrop-blur-md p-6 border border-[var(--line)] shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)]">
          <div className="space-y-2">
            <Label className="col-header flex items-center gap-2">
              <Activity className="w-3 h-3" /> Race Name
            </Label>
            <Popover>
              <PopoverTrigger 
                className="w-full justify-between rounded-none border border-[var(--line)] bg-transparent font-mono text-xs h-10 px-3 hover:bg-white/50 cursor-pointer text-left flex items-center"
              >
                <span className="truncate">
                  {selectedRaces.length === 0 
                    ? "All Races" 
                    : selectedRaces.length === 1 
                      ? selectedRaces[0] 
                      : `${selectedRaces.length} races selected`}
                </span>
                <Filter className="w-4 h-4 ml-2 opacity-50 shrink-0" />
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-4 bg-white/95 backdrop-blur-md rounded-none border border-[var(--line)] font-mono text-xs max-h-[350px] overflow-y-auto space-y-2 shadow-lg" align="start">
                <div className="flex items-center justify-between border-b border-[var(--line)]/10 pb-2 mb-2">
                  <span className="font-bold uppercase tracking-wider">Select Races</span>
                  {selectedRaces.length > 0 && (
                    <button 
                      onClick={() => setSelectedRaces([])} 
                      className="text-[10px] uppercase underline opacity-60 hover:opacity-100"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-1 hover:bg-black/5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedRaces.length === 0}
                      onChange={() => setSelectedRaces([])}
                      className="rounded-none border-[var(--line)] accent-black"
                    />
                    <span className={cn(selectedRaces.length === 0 && "font-bold")}>ALL RACES</span>
                  </label>
                  {allRaceNames.map(name => {
                    const isChecked = selectedRaces.includes(name);
                    return (
                      <label key={name} className="flex items-center gap-2 p-1 hover:bg-black/5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedRaces(selectedRaces.filter(r => r !== name));
                            } else {
                              setSelectedRaces([...selectedRaces, name]);
                            }
                          }}
                          className="rounded-none border-[var(--line)] accent-black"
                        />
                        <span className={cn(isChecked && "font-bold")}>{name}</span>
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="col-header flex items-center gap-2">
              <CalendarIcon className="w-3 h-3" /> Year
            </Label>
            <select 
              className="w-full bg-transparent border border-[var(--line)] px-3 py-2 text-sm font-mono focus:outline-none focus:bg-white/50 h-10 transition-colors"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="all">All Years</option>
              {allYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="col-header flex items-center gap-2">
              <Filter className="w-3 h-3" /> Distance
            </Label>
            <select 
              className="w-full bg-transparent border border-[var(--line)] px-3 py-2 text-sm font-mono focus:outline-none focus:bg-white/50 h-10 transition-colors"
              value={selectedDistance}
              onChange={(e) => setSelectedDistance(e.target.value)}
            >
              <option value="all">All Distances</option>
              {allDistances.map(d => <option key={d} value={d}>{d}km</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="col-header flex items-center gap-2">
              <Activity className="w-3 h-3" /> Stage
            </Label>
            <select 
              className="w-full bg-transparent border border-[var(--line)] px-3 py-2 text-sm font-mono focus:outline-none focus:bg-white/50 h-10 transition-colors"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
            >
              <option value="all">All Stages</option>
              {allStages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="col-header flex items-center gap-2">
              <Users className="w-3 h-3" /> Gender
            </Label>
            <select 
              className="w-full bg-transparent border border-[var(--line)] px-3 py-2 text-sm font-mono focus:outline-none focus:bg-white/50 h-10 transition-colors"
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
            >
              <option value="all">All Genders</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác/Chưa rõ</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label className="col-header flex items-center gap-2">
              <Search className="w-3 h-3" /> Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
              <Input 
                placeholder="Search by Race..." 
                className="pl-10 rounded-none border-[var(--line)] bg-transparent focus:ring-0 focus:bg-white/50 font-mono text-sm h-10 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetFilters}
            className="rounded-none border-[var(--line)] font-mono text-[10px] uppercase gap-2 hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-all"
          >
            <Trash2 className="w-3 h-3" /> Reset Filters
          </Button>
        </div>
      </div>

      {/* Revenue Table */}
      <DashboardSection 
        title="Revenue Breakdown" 
        icon={<DollarSign className="w-5 h-5" />}
        description="Total revenue split by race and distance"
      >
        <Table>
          <TableHeader className="bg-[var(--ink)]">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="col-header text-[var(--bg)] py-4">Race Name</TableHead>
              {allDistances.map(d => (
                <TableHead key={d} className="col-header text-[var(--bg)] text-right">{d.toLowerCase().includes("k") ? d : `${d}km`}</TableHead>
              ))}
              <TableHead className="col-header text-[var(--bg)] text-right">Total (VND)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(revenueStats).map(([race, dists]) => {
              const rowTotal = Object.values(dists).reduce((a, b) => a + b, 0);
              return (
                <TableRow key={race} className="data-row">
                  <TableCell className="font-serif italic text-lg">{race}</TableCell>
                  {allDistances.map(d => (
                    <TableCell key={d} className="data-value text-right">
                      {dists[d] ? dists[d].toLocaleString() : "-"}
                    </TableCell>
                  ))}
                  <TableCell className="data-value text-right font-bold bg-black/5">
                    {rowTotal.toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DashboardSection>

      {/* BIB by Stage */}
      <DashboardSection 
        title="BIBs by Stage" 
        icon={<Activity className="w-5 h-5" />}
        description="Registration count per sales stage"
      >
        <Table>
          <TableHeader className="bg-[var(--ink)]">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="col-header text-[var(--bg)] py-4">Race</TableHead>
              {allStages.map(s => (
                <TableHead key={s} className="col-header text-[var(--bg)] text-right">{s}</TableHead>
              ))}
              <TableHead className="col-header text-[var(--bg)] text-right">Total BIB</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(bibStageStats).map(([race, stages]) => {
              const rowTotal = Object.values(stages).reduce((a, b) => a + b, 0);
              return (
                <TableRow key={race} className="data-row">
                  <TableCell className="font-serif italic text-base">{race}</TableCell>
                  {allStages.map(s => (
                    <TableCell key={s} className="data-value text-right">
                      {stages[s] || 0}
                    </TableCell>
                  ))}
                  <TableCell className="data-value text-right font-bold bg-black/5">
                    {rowTotal}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DashboardSection>

      {/* BIB by Distance */}
      <DashboardSection 
        title="BIBs by Distance" 
        icon={<Filter className="w-5 h-5" />}
        description="Participant distribution across distances"
      >
        <Table>
          <TableHeader className="bg-[var(--ink)]">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="col-header text-[var(--bg)] py-4">Race</TableHead>
              {allDistances.map(d => (
                <TableHead key={d} className="col-header text-[var(--bg)] text-center">{d.toLowerCase().includes("k") ? d : `${d}km`} (Count | %)</TableHead>
              ))}
              <TableHead className="col-header text-[var(--bg)] text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(bibDistanceStats).map(([race, dists]) => {
              const rowTotal = Object.values(dists).reduce((a, b) => a + b, 0);
              return (
                <TableRow key={race} className="data-row">
                  <TableCell className="font-serif italic text-base">{race}</TableCell>
                  {allDistances.map(d => {
                    const count = dists[d] || 0;
                    const percentage = rowTotal > 0 ? (count / rowTotal * 100).toFixed(1) : 0;
                    return (
                      <TableCell key={d} className="data-value text-center">
                        {count} <span className="opacity-40 text-[10px]">| {percentage}%</span>
                      </TableCell>
                    );
                  })}
                  <TableCell className="data-value text-right font-bold bg-black/5">
                    {rowTotal}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DashboardSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Nationality Stats */}
        <DashboardSection 
          title="Nationality Statistics" 
          icon={<Globe className="w-5 h-5" />}
          description="Distribution and revenue by runner nationality"
        >
          {/* Vietnam vs International Segment Summary Cards */}
          <div className="grid grid-cols-2 gap-4 p-4 border-b border-[var(--line)]/10 bg-white/40">
            <div className="p-3 border border-[var(--line)]/10 bg-white/60">
              <div className="text-[10px] font-mono uppercase opacity-50 tracking-wider">Việt Nam (Domestic)</div>
              <div className="flex items-baseline justify-between mt-1">
                <div className="text-lg font-serif italic">{nationalityGroupStats.vietnam.count.toLocaleString()} <span className="text-xs font-mono opacity-60">BIBs</span></div>
                <div className="text-xs font-mono font-bold text-slate-700">{nationalityGroupStats.vietnam.percentage}%</div>
              </div>
              <div className="text-[10px] font-mono mt-1 opacity-60 font-medium">{nationalityGroupStats.vietnam.revenue.toLocaleString()} VND</div>
            </div>
            <div className="p-3 border border-[var(--line)]/10 bg-white/60">
              <div className="text-[10px] font-mono uppercase opacity-50 tracking-wider">Quốc Tế (International)</div>
              <div className="flex items-baseline justify-between mt-1">
                <div className="text-lg font-serif italic">{nationalityGroupStats.international.count.toLocaleString()} <span className="text-xs font-mono opacity-60">BIBs</span></div>
                <div className="text-xs font-mono font-bold text-slate-700">{nationalityGroupStats.international.percentage}%</div>
              </div>
              <div className="text-[10px] font-mono mt-1 opacity-60 font-medium">{nationalityGroupStats.international.revenue.toLocaleString()} VND</div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto border border-[var(--line)]/10">
            <Table>
              <TableHeader className="bg-[var(--ink)] sticky top-0 z-10">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="col-header text-[var(--bg)] py-3">Quốc tịch</TableHead>
                  <TableHead className="col-header text-[var(--bg)] text-center">BIBs</TableHead>
                  <TableHead className="col-header text-[var(--bg)] text-center">Ratio</TableHead>
                  <TableHead className="col-header text-[var(--bg)] text-right">Revenue (VND)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nationalityStats.map((item) => {
                  const percentage = filteredData.length > 0 ? ((item.count / filteredData.length) * 100).toFixed(1) : "0";
                  return (
                    <TableRow key={item.name} className="data-row">
                      <TableCell className="font-serif italic font-medium">{item.name}</TableCell>
                      <TableCell className="data-value text-center font-bold">{item.count}</TableCell>
                      <TableCell className="data-value text-center opacity-60 text-[10px]">{percentage}%</TableCell>
                      <TableCell className="data-value text-right font-mono">{item.revenue.toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DashboardSection>

        {/* Province Stats */}
        <DashboardSection 
          title="Province/City Statistics" 
          icon={<MapPin className="w-5 h-5" />}
          description="Regional runner participation and sales volume"
        >
          {/* Hanoi vs HCM vs Others Segment Summary Cards */}
          <div className="grid grid-cols-3 gap-3 p-4 border-b border-[var(--line)]/10 bg-white/40">
            <div className="p-3 border border-[var(--line)]/10 bg-white/60">
              <div className="text-[10px] font-mono uppercase opacity-50 tracking-wider">Hà Nội</div>
              <div className="flex items-baseline justify-between mt-1">
                <div className="text-base md:text-lg font-serif italic">{provinceGroupStats.hanoi.count.toLocaleString()} <span className="text-[10px] font-mono opacity-60">BIBs</span></div>
                <div className="text-[10px] font-mono font-bold text-slate-700">{provinceGroupStats.hanoi.percentage}%</div>
              </div>
              <div className="text-[10px] font-mono mt-1 opacity-60 font-medium">{provinceGroupStats.hanoi.revenue.toLocaleString()} VND</div>
            </div>
            <div className="p-3 border border-[var(--line)]/10 bg-white/60">
              <div className="text-[10px] font-mono uppercase opacity-50 tracking-wider">TP. Hồ Chí Minh</div>
              <div className="flex items-baseline justify-between mt-1">
                <div className="text-base md:text-lg font-serif italic">{provinceGroupStats.hcm.count.toLocaleString()} <span className="text-[10px] font-mono opacity-60">BIBs</span></div>
                <div className="text-[10px] font-mono font-bold text-slate-700">{provinceGroupStats.hcm.percentage}%</div>
              </div>
              <div className="text-[10px] font-mono mt-1 opacity-60 font-medium">{provinceGroupStats.hcm.revenue.toLocaleString()} VND</div>
            </div>
            <div className="p-3 border border-[var(--line)]/10 bg-white/60">
              <div className="text-[10px] font-mono uppercase opacity-50 tracking-wider">Tỉnh thành khác</div>
              <div className="flex items-baseline justify-between mt-1">
                <div className="text-base md:text-lg font-serif italic">{provinceGroupStats.others.count.toLocaleString()} <span className="text-[10px] font-mono opacity-60">BIBs</span></div>
                <div className="text-[10px] font-mono font-bold text-slate-700">{provinceGroupStats.others.percentage}%</div>
              </div>
              <div className="text-[10px] font-mono mt-1 opacity-60 font-medium">{provinceGroupStats.others.revenue.toLocaleString()} VND</div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto border border-[var(--line)]/10">
            <Table>
              <TableHeader className="bg-[var(--ink)] sticky top-0 z-10">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="col-header text-[var(--bg)] py-3">Tỉnh / Thành phố</TableHead>
                  <TableHead className="col-header text-[var(--bg)] text-center">BIBs</TableHead>
                  <TableHead className="col-header text-[var(--bg)] text-center">Ratio</TableHead>
                  <TableHead className="col-header text-[var(--bg)] text-right">Revenue (VND)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {provinceStats.map((item) => {
                  const percentage = filteredData.length > 0 ? ((item.count / filteredData.length) * 100).toFixed(1) : "0";
                  return (
                    <TableRow key={item.name} className="data-row">
                      <TableCell className="font-serif italic font-medium">{item.name}</TableCell>
                      <TableCell className="data-value text-center font-bold">{item.count}</TableCell>
                      <TableCell className="data-value text-center opacity-60 text-[10px]">{percentage}%</TableCell>
                      <TableCell className="data-value text-right font-mono">{item.revenue.toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DashboardSection>
      </div>

      {/* Age Group Statistics - Full Width for high visibility and clean typography */}
      <div className="w-full">
        <DashboardSection 
          title="Age Group Statistics" 
          icon={<Users className="w-5 h-5" />}
          description="Participation stats grouped by age categories"
        >
          <div className="max-h-96 overflow-y-auto border border-[var(--line)]/10">
            <Table>
              <TableHeader className="bg-[var(--ink)] sticky top-0 z-10">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="col-header text-[var(--bg)] py-3">Nhóm tuổi</TableHead>
                  <TableHead className="col-header text-[var(--bg)] text-center">BIBs</TableHead>
                  <TableHead className="col-header text-[var(--bg)] text-center">Ratio</TableHead>
                  <TableHead className="col-header text-[var(--bg)] text-right">Revenue (VND)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ageGroupStats.map((item) => {
                  const percentage = filteredData.length > 0 ? ((item.count / filteredData.length) * 100).toFixed(1) : "0";
                  return (
                    <TableRow key={item.name} className="data-row">
                      <TableCell className="font-serif italic font-medium">{item.name}</TableCell>
                      <TableCell className="data-value text-center font-bold">{item.count}</TableCell>
                      <TableCell className="data-value text-center opacity-60 text-[10px]">{percentage}%</TableCell>
                      <TableCell className="data-value text-right font-mono">{item.revenue.toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DashboardSection>
      </div>

      {/* Visual Charts Row: Gender and Registration Type Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gender Donut Chart */}
        <DashboardSection 
          title="Gender Demographics" 
          icon={<PieIcon className="w-5 h-5" />}
          description="Gender distribution of registered runners"
        >
          <div className="p-6 bg-white/20 backdrop-blur-sm min-h-[24rem] flex flex-col justify-center">
            {genderStats.length === 0 ? (
              <div className="text-center font-mono text-sm opacity-40 uppercase py-12">
                No Gender Data Available
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {genderStats.map((entry, index) => {
                          const colors = ["#0f172a", "#475569", "#94a3b8"];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ 
                          background: "rgba(255, 255, 255, 0.95)", 
                          border: "1px solid var(--line)", 
                          fontFamily: "monospace", 
                          fontSize: "11px",
                          borderRadius: "0px"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4 font-mono text-xs uppercase tracking-wider">
                  {genderStats.map((entry, index) => {
                    const colors = ["bg-[#0f172a]", "bg-[#475569]", "bg-[#94a3b8]"];
                    return (
                      <div key={entry.name} className="flex flex-col p-3 border border-[var(--line)]/10 bg-white/30 hover:bg-white/50 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-3.5 h-3.5 ${colors[index % colors.length]}`} />
                            <span className="font-bold text-sm tracking-tight">{entry.name}</span>
                          </div>
                          <span className="font-bold text-sm">{entry.value} BIBs</span>
                        </div>
                        <div className="flex justify-between text-[10px] opacity-60">
                          <span>Ratio: {entry.percentage}%</span>
                          <span>{entry.revenue.toLocaleString()} VND</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DashboardSection>

        {/* Ticket Sales by Registration Type (Group vs Individual) */}
        <DashboardSection 
          title="Registration Type Statistics" 
          icon={<PieIcon className="w-5 h-5" />}
          description="Ticket sales distribution (Group vs Individual)"
        >
          <div className="p-6 bg-white/20 backdrop-blur-sm min-h-[24rem] flex flex-col justify-center">
            {registrationTypeStats.length === 0 ? (
              <div className="text-center font-mono text-sm opacity-40 uppercase py-12">
                No Registration Type Data Available
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={registrationTypeStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {registrationTypeStats.map((entry, index) => {
                          const colors = ["#0f172a", "#334155", "#94a3b8"];
                          return <Cell key={`cell-reg-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ 
                          background: "rgba(255, 255, 255, 0.95)", 
                          border: "1px solid var(--line)", 
                          fontFamily: "monospace", 
                          fontSize: "11px",
                          borderRadius: "0px"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4 font-mono text-xs uppercase tracking-wider">
                  {registrationTypeStats.map((entry, index) => {
                    const colors = ["bg-[#0f172a]", "bg-[#334155]", "bg-[#94a3b8]"];
                    return (
                      <div key={entry.name} className="flex flex-col p-3 border border-[var(--line)]/10 bg-white/30 hover:bg-white/50 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-3.5 h-3.5 ${colors[index % colors.length]}`} />
                            <span className="font-bold text-sm tracking-tight">{entry.name}</span>
                          </div>
                          <span className="font-bold text-sm">{entry.value} BIBs</span>
                        </div>
                        <div className="flex justify-between text-[10px] opacity-60">
                          <span>Ratio: {entry.percentage}%</span>
                          <span>{entry.revenue.toLocaleString()} VND</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DashboardSection>
      </div>

      {/* AI Analysis Section */}
      <DashboardSection
        title="AI Business Analysis & Strategy Report"
        icon={<Brain className="w-5 h-5" />}
        description="Báo cáo phân tích hiệu suất kinh doanh & Đề xuất chiến lược vận hành từ AI"
        rightElement={
          <Button
            onClick={generateAiAnalysis}
            disabled={aiLoading}
            className="rounded-none bg-[var(--ink)] text-[var(--bg)] hover:bg-[var(--ink)]/80 font-mono text-xs uppercase py-2 px-4 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {aiLoading ? "Đang phân tích..." : "Phân tích dữ liệu bằng AI"}
          </Button>
        }
      >
        <div className="p-6 md:p-8 bg-white/20 backdrop-blur-sm min-h-[12rem] flex flex-col justify-center">
          {aiLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Activity className="w-10 h-10 animate-spin opacity-60" />
              <div className="text-center font-mono text-xs uppercase tracking-wider space-y-1">
                <p className="font-bold text-slate-800">{loadingSteps[loadingStep]}</p>
                <p className="opacity-40">Mô hình AI đang xử lý dữ liệu...</p>
              </div>
            </div>
          ) : aiError ? (
            <div className="p-4 border border-red-500/20 bg-red-500/5 text-red-700 font-mono text-xs uppercase tracking-wider text-center space-y-3">
              <p>Lỗi: {aiError}</p>
              <Button
                variant="outline"
                onClick={generateAiAnalysis}
                className="mx-auto rounded-none border-red-500/30 text-red-700 hover:bg-red-500/10 font-mono text-[10px]"
              >
                Thử lại
              </Button>
            </div>
          ) : aiAnalysis ? (
            <div className="prose prose-slate max-w-none text-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--line)]/10 pb-4 mb-6">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-500">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Báo cáo vừa được cập nhật tức thì
                </div>
                {filteredData.length !== data.length && (
                  <Badge variant="secondary" className="rounded-none font-mono text-[9px] uppercase">
                    Dựa trên bộ lọc hiện tại
                  </Badge>
                )}
              </div>
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-serif italic uppercase tracking-tight text-slate-950 mt-8 mb-4 border-b border-slate-300 pb-2 leading-tight">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-serif italic uppercase tracking-tight text-slate-900 mt-6 mb-3 leading-snug">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-mono uppercase tracking-wider text-slate-800 font-bold mt-5 mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-slate-800 inline-block" />
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm text-slate-700 leading-relaxed font-sans mb-4">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 text-sm text-slate-700 space-y-2 font-sans mb-4">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 text-sm text-slate-700 space-y-2 font-sans mb-4">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">
                      {children}
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-950">
                      {children}
                    </strong>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4 border border-slate-200">
                      <table className="w-full border-collapse text-xs font-mono bg-white/40">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-slate-100/70 border-b border-slate-200">
                      {children}
                    </thead>
                  ),
                  th: ({ children }) => (
                    <th className="border border-slate-200 p-2 text-left text-slate-900 font-bold uppercase tracking-wider">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-slate-200 p-2 text-slate-700">
                      {children}
                    </td>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-slate-400 pl-4 italic my-4 text-slate-600 bg-slate-50/50 py-2 pr-2">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {aiAnalysis}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-10 space-y-5">
              <Brain className="w-12 h-12 mx-auto text-slate-300 stroke-[1.2]" />
              <div className="space-y-2">
                <h3 className="text-sm font-mono uppercase tracking-wider text-slate-700 font-bold">Chưa có phân tích dữ liệu</h3>
                <p className="text-xs text-slate-500 font-sans max-w-md mx-auto leading-relaxed">
                  Bấm nút bên dưới để khởi chạy hệ thống phân tích AI. Mô hình sẽ đọc trực tiếp các số liệu thống kê hiện tại của giải chạy để tạo báo cáo chiến lược kinh doanh toàn diện.
                </p>
              </div>
              <Button
                onClick={generateAiAnalysis}
                className="mx-auto rounded-none bg-[var(--ink)] text-[var(--bg)] hover:bg-[var(--ink)]/80 font-mono text-xs uppercase py-3 px-6 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Khởi tạo báo cáo phân tích AI
              </Button>
            </div>
          )}
        </div>
      </DashboardSection>


      {/* Footer */}
      <footer className="pt-10 border-t border-[var(--line)] flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono uppercase tracking-widest opacity-40">
        <p>© 2026 VnExpress Marathon Analytics Dashboard</p>
        <div className="flex gap-6">
          <span>Source: Google Sheets TSV</span>
          <span>Auto-Sync: Active</span>
        </div>
      </footer>
    </div>
  );
}
