import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Settings, BarChart3, ShoppingCart, Plug, Eye, MousePointerClick, Activity, Lock, Mail, KeyRound, Users, Package } from "lucide-react";
import DashboardTopBar from "@/components/admin/DashboardTopBar";
import KpiCards from "@/components/admin/KpiCards";
import SalesChart from "@/components/admin/SalesChart";
import SalesFunnel from "@/components/admin/SalesFunnel";
import OrdersTable from "@/components/admin/OrdersTable";
import VisitorsPanel from "@/components/admin/VisitorsPanel";
import GatewayIntegrations from "@/components/admin/GatewayIntegrations";
import SettingsPanel from "@/components/admin/SettingsPanel";
import AnalyticsPanel from "@/components/admin/AnalyticsPanel";
import CustomerInsights from "@/components/admin/CustomerInsights";
import ConversionTrends from "@/components/admin/ConversionTrends";
import RevenueBreakdown from "@/components/admin/RevenueBreakdown";
import DateRangePicker from "@/components/admin/DateRangePicker";
import ProductManager from "@/components/admin/ProductManager";

interface ActiveSession {
  id: string;
  session_id: string;
  page: string;
  last_seen_at: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_document: string;
  customer_phone: string | null;
  amount: number;
  quantity: number;
  status: string;
  transaction_id: string | null;
  created_at: string;
  customer_city?: string | null;
  customer_state?: string | null;
  customer_cep?: string | null;
}

type TabKey = "overview" | "orders" | "visitors" | "analytics" | "customers" | "product" | "integrations" | "settings";

const AdminDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [tikTokPixelId, setTikTokPixelId] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const now = new Date();
    return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate()), to: now };
  });
  const [activeGateway, setActiveGateway] = useState("");

  // Derive period from dateRange for backward compat
  const period = (() => {
    const diffDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / 86400000);
    if (diffDays <= 1) return "today" as const;
    if (diffDays <= 7) return "7days" as const;
    return "30days" as const;
  })();

  // Auth
  useEffect(() => {
    let isMounted = true;

    const checkRole = async (userId: string) => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin");
      return data && data.length > 0;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      if (session?.user) {
        setUser(session.user);
        setTimeout(async () => {
          if (!isMounted) return;
          const admin = await checkRole(session.user.id);
          if (isMounted) {
            setIsAdmin(!!admin);
            setLoading(false);
          }
        }, 0);
      } else {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const playAlert = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      setTimeout(() => {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2);
        g2.connect(ctx.destination);
        o2.frequency.value = 1000;
        g2.gain.value = 0.3;
        o2.start();
        o2.stop(ctx.currentTime + 0.3);
      }, 200);
    } catch { /* */ }
  }, []);

  // Fetch data
  useEffect(() => {
    if (!isAdmin) return;

    const fetchAll = async () => {
      const [sessRes, ordRes, pixRes, gwRes] = await Promise.all([
        supabase.from("active_sessions").select("*").order("last_seen_at", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(1000),
        supabase.from("site_settings").select("value").eq("key", "tiktok_pixel_id").single(),
        supabase.from("gateway_settings").select("gateway_name").eq("is_active", true).single(),
      ]);
      if (sessRes.data) setSessions(sessRes.data as ActiveSession[]);
      if (ordRes.data) setOrders(ordRes.data as Order[]);
      if (pixRes.data) setTikTokPixelId(pixRes.data.value);
      if (gwRes.data) setActiveGateway(gwRes.data.gateway_name);
    };

    fetchAll();

    const ordersChannel = supabase
      .channel("orders-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        setOrders(prev => [payload.new as Order, ...prev]);
        if (soundEnabled) playAlert();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        setOrders(prev => prev.map(o => o.id === (payload.new as Order).id ? payload.new as Order : o));
      })
      .subscribe();

    const sessChannel = supabase
      .channel("sess-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "active_sessions" }, async () => {
        const { data } = await supabase.from("active_sessions").select("*").order("last_seen_at", { ascending: false });
        if (data) setSessions(data as ActiveSession[]);
      })
      .subscribe();

    const interval = setInterval(async () => {
      const { data } = await supabase.from("active_sessions").select("*").order("last_seen_at", { ascending: false });
      if (data) setSessions(data as ActiveSession[]);
    }, 10000);

    const paymentInterval = setInterval(async () => {
      // Use functional update to get latest orders without stale closure
      let pendingOrders: Order[] = [];
      setOrders(prev => {
        pendingOrders = prev.filter(o => o.status === "pix_generated" && o.transaction_id);
        return prev;
      });
      for (const order of pendingOrders) {
        try {
          const { data, error } = await supabase.functions.invoke("check-payment", {
            body: { transaction_id: order.transaction_id },
          });
          console.log(`Payment check for ${order.transaction_id}:`, data, error);
          if (!error && data?.status === "paid") {
            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: "paid" } : o));
            if (soundEnabled) playAlert();
          }
        } catch (err) {
          console.error("Payment check error:", err);
        }
      }
    }, 10000);

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(sessChannel);
      clearInterval(interval);
      clearInterval(paymentInterval);
    };
  }, [isAdmin, soundEnabled, playAlert]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError("Email ou senha incorretos");
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  // Funnel data
  const funnelVisitors = sessions.length + orders.length * 3;
  const checkoutStarted = orders.length;
  const pixGenerated = orders.filter(o => o.status === "pix_generated" || o.status === "paid").length;
  const pixPaid = orders.filter(o => o.status === "paid").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(220,25%,5%)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(14,100%,55%)] to-[hsl(14,100%,40%)] flex items-center justify-center shadow-xl shadow-[hsl(14,100%,30%)]/30">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -inset-2 rounded-2xl border border-[hsl(14,100%,55%)]/20 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-t-transparent border-[hsl(14,100%,55%)] rounded-full" />
            <span className="text-xs text-[hsl(220,10%,40%)]">Carregando painel...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(220,25%,5%)] px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[hsl(14,100%,50%)]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-[hsl(210,100%,50%)]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-sm">
          <div className="bg-[hsl(220,20%,9%)] rounded-2xl shadow-2xl border border-[hsl(220,15%,14%)] overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[hsl(14,100%,55%)] via-[hsl(14,100%,50%)] to-[hsl(14,80%,40%)]" />
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[hsl(14,100%,55%)] to-[hsl(14,100%,38%)] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-[hsl(14,100%,30%)]/30 rotate-3 hover:rotate-0 transition-transform duration-300">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">Painel Administrativo</h1>
                <p className="text-[11px] text-[hsl(220,10%,40%)] mt-1.5">Faça login para acessar o dashboard</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-[10px] font-medium text-[hsl(220,10%,45%)] block mb-2 uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(220,10%,30%)]" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-[hsl(220,20%,6%)] border border-[hsl(220,15%,16%)] text-white text-sm outline-none focus:border-[hsl(14,100%,55%)] focus:ring-1 focus:ring-[hsl(14,100%,55%)]/20 transition-all" placeholder="admin@email.com" required />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-[hsl(220,10%,45%)] block mb-2 uppercase tracking-wider">Senha</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(220,10%,30%)]" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-[hsl(220,20%,6%)] border border-[hsl(220,15%,16%)] text-white text-sm outline-none focus:border-[hsl(14,100%,55%)] focus:ring-1 focus:ring-[hsl(14,100%,55%)]/20 transition-all" placeholder="••••••••" required />
                  </div>
                </div>

                {loginError && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[hsl(0,50%,8%)] border border-[hsl(0,50%,18%)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[hsl(0,84%,60%)]" />
                    <p className="text-[11px] text-[hsl(0,84%,60%)]">{loginError}</p>
                  </div>
                )}

                <button type="submit" disabled={loginLoading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[hsl(14,100%,55%)] to-[hsl(14,100%,42%)] text-white font-semibold text-sm hover:shadow-lg hover:shadow-[hsl(14,100%,30%)]/30 transition-all disabled:opacity-50 active:scale-[0.98]">
                  {loginLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-t-transparent border-white rounded-full" />
                      Autenticando...
                    </span>
                  ) : "Entrar"}
                </button>
              </form>
            </div>
          </div>
          <p className="text-center text-[9px] text-[hsl(220,10%,25%)] mt-4">Acesso restrito a administradores autorizados</p>
        </div>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: "overview", label: "Visão Geral", icon: BarChart3 },
    { key: "orders", label: "Pedidos", icon: ShoppingCart },
    { key: "customers", label: "Clientes", icon: Users },
    { key: "visitors", label: "Visitantes", icon: Eye },
    { key: "analytics", label: "Analytics", icon: MousePointerClick },
    { key: "product", label: "Produto", icon: Package },
    { key: "integrations", label: "Integrações", icon: Plug },
    { key: "settings", label: "Config", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[hsl(220,25%,5%)] text-white">
      <DashboardTopBar
        activeGateway={activeGateway}
        liveCount={sessions.length}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onLogout={handleLogout}
      />

      {/* Navigation bar */}
      <div className="border-b border-[hsl(220,15%,12%)] bg-[hsl(220,22%,7%)]">
        <div className="px-6 flex items-center justify-between">
          <div className="flex items-center -mb-px overflow-x-auto scrollbar-none">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-medium transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-[hsl(14,100%,55%)] text-white"
                    : "border-transparent text-[hsl(220,10%,40%)] hover:text-[hsl(220,10%,60%)] hover:border-[hsl(220,15%,20%)]"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {activeTab !== "integrations" && activeTab !== "settings" && activeTab !== "product" && (
            <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5 space-y-4">
        {activeTab === "overview" && (
          <>
            <KpiCards orders={orders} period={period} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <SalesChart orders={orders} period={period} />
              </div>
              <RevenueBreakdown orders={orders} dateRange={dateRange} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ConversionTrends orders={orders} dateRange={dateRange} />
              <SalesFunnel
                visitors={funnelVisitors}
                checkoutStarted={checkoutStarted}
                pixGenerated={pixGenerated}
                pixPaid={pixPaid}
              />
            </div>
            <OrdersTable orders={orders.slice(0, 10)} />
          </>
        )}

        {activeTab === "orders" && <OrdersTable orders={orders} />}
        {activeTab === "customers" && <CustomerInsights orders={orders} dateRange={dateRange} />}
        {activeTab === "visitors" && <VisitorsPanel sessions={sessions} />}
        {activeTab === "analytics" && <AnalyticsPanel period={period} />}
        {activeTab === "product" && <ProductManager />}
        {activeTab === "integrations" && <GatewayIntegrations onGatewayChange={setActiveGateway} />}
        {activeTab === "settings" && <SettingsPanel tikTokPixelId={tikTokPixelId} setTikTokPixelId={setTikTokPixelId} />}
      </div>
    </div>
  );
};

export default AdminDashboard;
