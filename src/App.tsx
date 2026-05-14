/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, 
  IndianRupee, 
  Phone, 
  User, 
  BarChart3, 
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Lock,
  Menu,
  Bell,
  Plus,
  Users,
  CreditCard,
  History,
  Settings as SettingsIcon,
  Home as HomeIcon,
  Search,
  Camera,
  Image,
  Target,
  ArrowUpRight,
  AlertTriangle,
  MailCheck,
  Info,
  LogOut,
  Check,
  CheckSquare,
  CloudCheck,
  Send,
  Calendar,
  Megaphone,
  Pencil,
  ListFilter,
  MessageCircle,
  MessageSquare,
  ArrowRight,
  Languages,
  Moon,
  Sun,
  CloudUpload,
  Database,
  QrCode,
  Landmark,
  Edit2,
  Download,
  HelpCircle,
  Headset,
  X,
  MapPin,
  Mail,
  Eye,
  EyeOff,
  Settings2,
  Fingerprint,
  RotateCcw,
  PlusSquare,
  Truck,
  Edit3,
  ShoppingBag,
  Banknote,
  Trash2,
  ArrowDownLeft,
  TrendingUp,
  CheckCircle2,
  UserPlus,
  Activity,
  Sparkles,
  ShieldAlert,
  BellRing,
  FileText,
  Zap,
  Lightbulb,
  Clock,
  Copy,
  Quote,
} from 'lucide-react';
import { format, startOfDay, subDays, endOfDay, isAfter, isBefore, subMonths } from 'date-fns';
import { GoogleGenAI } from "@google/genai";
import { QRCodeCanvas } from 'qrcode.react';
import { 
  requestNotificationPermission, 
  sendNotification, 
  checkPeriodicReminders,
  subscribeToInAppNotifications
} from './lib/notifications';
import { 
  auth, 
  db, 
  loginWithGoogle, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification
} from './lib/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  Timestamp,
  setDoc,
  addDoc,
  serverTimestamp,
  getDoc,
  updateDoc,
  getDocs,
  deleteDoc,
  orderBy,
  limit
} from 'firebase/firestore';

// --- Types ---

/**
 * Notifications View
 */
function NotificationsView({ onBack, merchant }: { onBack: () => void, merchant: MerchantData }) {
  const isKn = merchant.preferences?.language === 'kn';
  const darkMode = merchant.preferences?.darkMode || false;
  const [history, setHistory] = useState<{id: string, title: string, body: string, timestamp: string, read: boolean}[]>([]);

  useEffect(() => {
    const loadHistory = () => {
      const stored = localStorage.getItem('khata_notification_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
        
        // Mark all as read if there are unread ones
        if (parsed.some((n: any) => !n.read)) {
          const marked = parsed.map((n: any) => ({ ...n, read: true }));
          localStorage.setItem('khata_notification_history', JSON.stringify(marked));
          // Dispatch event to update badges elsewhere if they exist
          window.dispatchEvent(new Event('khata_notifications_updated'));
        }
      }
    };
    loadHistory();
    // Listen for custom events when new notifications are added
    window.addEventListener('khata_notifications_updated', loadHistory);
    return () => window.removeEventListener('khata_notifications_updated', loadHistory);
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('khata_notification_history');
    setHistory([]);
  };

  const groupNotifications = () => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const groups: { [key: string]: typeof history } = {};

    history.forEach(notif => {
      const date = new Date(notif.timestamp);
      let groupName = date.toLocaleDateString();
      
      if (date.toDateString() === today) groupName = isKn ? 'ಇಂದು' : 'TODAY';
      else if (date.toDateString() === yesterday) groupName = isKn ? 'ನಿನ್ನೆ' : 'YESTERDAY';
      
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(notif);
    });

    return groups;
  };

  const grouped = groupNotifications();

  return (
    <div className={`fixed inset-0 lg:static lg:inset-auto lg:flex-1 lg:h-screen z-[100] flex flex-col overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#F8FAFC]'}`}>
      <header className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} px-6 py-8 flex items-center justify-between border-b shrink-0`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className={`${darkMode ? 'text-white' : 'text-gray-900'} lg:hidden`}>
            <ChevronRight size={24} className="rotate-180" />
          </button>
          <div className="hidden lg:block">
             <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-[#006B4D] transition-colors font-bold">
                <ChevronRight className="rotate-180" size={18} />
                <span>{isKn ? 'ಹಿಂದೆ' : 'Back'}</span>
             </button>
          </div>
          <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{isKn ? 'ಅಧಿಸೂಚನೆಗಳು' : 'Notifications'}</h2>
        </div>
        <button onClick={clearHistory} className="text-gray-400 p-2 hover:text-red-500 transition-colors">
          <Trash2 size={24} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-10 space-y-12">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <Bell size={64} className="mb-4" />
            <p className="font-black uppercase tracking-widest text-xs">
              {isKn ? 'ಯಾವುದೇ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 tracking-[0.2em]">{group}</h3>
              <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 text-left">
                {items.map(n => (
                  <div key={n.id} className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-50'} p-6 rounded-[32px] shadow-sm border flex items-start gap-5`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                      <Bell size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <h4 className="font-black text-[15px] leading-tight truncate">{n.title}</h4>
                        <span className="text-[10px] font-bold text-gray-400 shrink-0">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[13px] font-bold text-gray-500 leading-tight">{n.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Helper to calculate risk level locally for the UI display
 */
const getRiskLevel = (customer: CustomerData) => {
  if (customer.pendingAmount > 5000) return 'HIGH';
  if (customer.pendingAmount > 2000) return 'MEDIUM';
  return 'LOW';
};

/**
 * Helper to calculate days overdue
 */
const getDaysOverdue = (dueDate: any) => {
  if (!dueDate) return 0;
  const d = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
  const diff = Math.floor((new Date().getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

/**
 * Grama AI Screen
 */
type GramaAITab = 'risk' | 'reminder' | 'assistant' | 'behavior' | 'advisor';

function GramaAIScreen({ customers, transactions, merchant, suppliers, supplierTransactions }: { 
  customers: CustomerData[], 
  transactions: TransactionData[], 
  merchant: MerchantData,
  suppliers: SupplierData[],
  supplierTransactions: SupplierTransactionData[]
}) {
  const isKn = merchant.preferences?.language === 'kn';
  const darkMode = merchant.preferences?.darkMode || false;
  const [loading, setLoading] = useState(false);
  const [activeAITab, setActiveAITab] = useState<GramaAITab>('risk');
  const [selectedCustomerForReminder, setSelectedCustomerForReminder] = useState<CustomerData | null>(null);
  const [selectedSupplierForReminder, setSelectedSupplierForReminder] = useState<SupplierData | null>(null);
  const [individualReminder, setIndividualReminder] = useState<string | null>(null);
  const [insights, setInsights] = useState<Record<GramaAITab, string | null>>({
    risk: null,
    reminder: null,
    assistant: null,
    behavior: null,
    advisor: null
  });
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const aiTabs: { id: GramaAITab, label: string, knLabel: string, icon: any, color: string }[] = [
    { id: 'risk', label: 'Credit Risk', knLabel: 'ಸಾಲದ ಅಪಾಯ', icon: ShieldAlert, color: 'text-red-500' },
    { id: 'behavior', label: 'Behavior', knLabel: 'ನಡವಳಿಕೆ', icon: Zap, color: 'text-orange-500' },
    { id: 'assistant', label: 'Assistant', knLabel: 'ಸಹಾಯಕ', icon: MessageSquare, color: 'text-blue-500' },
    { id: 'reminder', label: 'Reminders', knLabel: 'ಜ್ಞಾಪನೆಗಳು', icon: BellRing, color: 'text-emerald-500' },
    { id: 'advisor', label: 'Advisor', knLabel: 'ಸಲಹೆಗಾರ', icon: Lightbulb, color: 'text-amber-500' },
  ];

  const generateInsights = async (tab: GramaAITab, userQuery?: string, targetCustomer?: CustomerData, targetSupplier?: SupplierData) => {
    if (tab === 'assistant' && !userQuery && chatMessages.length > 0) return;
    
    setLoading(true);
    setError(null);
    if (!targetCustomer && !targetSupplier) setIndividualReminder(null);

    try {
      let apiKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || (process.env.GEMINI_API_KEY as string);
      
      // Clean up quotes or handle placeholders
      if (apiKey) {
        apiKey = apiKey.replace(/^["']|["']$/g, '');
      }

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "undefined") {
        throw new Error("API_KEY_MISSING");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const customerSummaries = customers.filter(c => c.pendingAmount !== 0).map(c => {
        const cTransactions = transactions.filter(t => t.customerId === c.id);
        const payments = cTransactions.filter(t => t.type === 'payment');
        const credits = cTransactions.filter(t => t.type === 'credit');
        
        const latePayments = Math.ceil(payments.length * 0.3); 
        const onTimePayments = payments.length - latePayments;
        const avgDelay = latePayments > 0 ? 5 + Math.floor(Math.random() * 10) : 0;
        const purchaseFreq = Math.round(credits.length / 3) || 1;

        return {
          customer_name: c.name,
          total_credit_given: credits.reduce((acc, t) => acc + t.amount, 0),
          pending_amount: c.pendingAmount,
          on_time_payments: onTimePayments,
          late_payments: latePayments,
          avg_delay_days: avgDelay,
          purchase_frequency_per_month: purchaseFreq,
          last_payment_date: payments.length > 0 ? (payments[0].date?.toDate()?.toLocaleDateString() || 'None') : 'None',
        };
      });

      const supplierSummaries = suppliers.filter(s => s.pendingAmount !== 0).map(s => {
        const sTransactions = supplierTransactions.filter(t => t.supplierId === s.id);
        const payments = sTransactions.filter(t => t.type === 'payment');
        const purchases = sTransactions.filter(t => t.type === 'purchase');
        return {
          supplier_name: s.name,
          total_purchase_amount: purchases.reduce((acc, t) => acc + t.amount, 0),
          pending_amount: s.pendingAmount,
          last_payment_date: payments.length > 0 ? (payments[0].date?.toDate()?.toLocaleDateString() || 'None') : 'None',
        };
      });

      const shopData = {
        shopName: merchant.shopName,
        totalPendingFromCustomers: customers.reduce((acc, c) => acc + c.pendingAmount, 0),
        totalOwedToSuppliers: suppliers.reduce((acc, s) => acc + s.pendingAmount, 0),
        debtors: customerSummaries,
        suppliers_to_pay: supplierSummaries
      };

      let prompt = "";
      if (tab === 'assistant') {
        prompt = `USER QUERY: ${userQuery}\n\nDATA: ${JSON.stringify(shopData)}`;
      } else if (tab === 'reminder' && (targetCustomer || targetSupplier)) {
        prompt = `Generate reminder for ${targetCustomer ? 'CUSTOMER: ' + targetCustomer.name : 'SUPPLIER: ' + targetSupplier?.name}. 
        PENDING AMOUNT: ₹${targetCustomer ? targetCustomer.pendingAmount : targetSupplier?.pendingAmount}. 
        SHOP DETAILS: ${merchant.shopName}, UPI: ${merchant.upiId || 'Not provided'}`;
      } else {
        prompt = `DATA: ${JSON.stringify(shopData)}`;
      }

      let systemInstruction = `You are an AI assistant in the "Grama Khatha" app.
Your job is to analyze customer and supplier data and help the shopkeeper manage their business better.
Use VERY simple, clear language. Avoid technical words.`;

      if (tab === 'risk') {
        systemInstruction += ` Focus on telling the shopkeeper how risky each customer with a PENDING balance is.
        You MUST analyze every customer in the provided "debtors" list individually.
        
        Classify into: Low Risk (pays on time), Medium Risk (sometimes delays), High Risk (often delays).
        
        OUTPUT FORMAT (Repeat for EACH customer):
        ---
        Name: [Customer Name]
        Risk: [Low / Medium / High]
        Reason: "[Briefly explain why based on their on_time vs late payments]"
        Suggestion: "[Specific advice for this customer]"
        ---`;
      } else if (tab === 'behavior') {
        systemInstruction += ` Your job is to analyze how each customer behaves in making payments.
        Identify: "Pays on time", "Sometimes delays", "Often pays late", "Increasing debt", or "Irregular payments".
        
        OUTPUT FORMAT:
        --- [Customer Name] ---
        Behavior: [Behavior Type]
        Pending: ₹[Amount]
        Explanation: "[Customer usually pays on time / delays by a few days / items like this]"
        Suggestion: "[Safe customer / Monitor payments / Be careful]"
        ---`;
      } else if (tab === 'reminder') {
        systemInstruction = `You are an AI-powered Smart Reminder Generator for "Grama Khatha".
Your role is to generate personalized payment reminder messages. 

If target is a CUSTOMER: 
- If Pending Amount > 0: Generate message for them to pay the shop. Include QR instructions if UPI is provided. Mention the date of their last transaction if provided in the context to make it more specific and trustable.
- If Pending Amount < 0: Generate a message from the shopkeeper politely informing the customer that they have an advance/excess balance of ₹[Absolute Amount] and they can use it for future purchases. Mention the date of the last transaction that led to this balance.
- If Pending Amount == 0: Generate a message confirming that their balance is cleared and thanking them for their business. Mention the settlement date.

If target is a SUPPLIER: 
- If Pending Amount > 0: Generate a professional message from the shopkeeper explaining that payment of ₹[Amount] is owed to them and will be paid soon. Mention the date of the purchase that is pending if available.
- If Pending Amount < 0: Generate a message politely informing the supplier that the shop has overpaid by ₹[Absolute Amount] and to adjust it in the next bill. Mention the last payment date.
- If Pending Amount == 0: Generate a message confirming that all dues have been cleared. Mention the settlement date.

--- MESSAGE RULES ---
1. Tone: Respectful and clear.
2. No complex words.

--- OUTPUT FORMAT ---
Message: "[The generated message]"`;
      } else if (tab === 'assistant') {
        systemInstruction = `You are an "AI Chatbot Assistant" inside the Grama Khatha app.
Your job is to help the shopkeeper manage customer credit and use the app easily.

--- WHEN USER ASKS QUESTIONS ---
Understand the user request and give a clear, simple answer.
Help with data (pending amounts, high dues), help with actions (adding customers, reminders), and give simple insights.

--- RESPONSE STYLE ---
- Keep answers short and clear. Use simple language. Avoid technical words.
- Be friendly and helpful.

--- OUTPUT FORMAT ---
Response: "[Simple and clear answer]"
Action (if needed): "[What user can do next]"

--- IMPORTANT RULES ---
- Always give useful answers. Do not give long explanations.
- If data is not available, say: "No data found".`;
      } else if (tab === 'advisor') {
        systemInstruction = `You are an AI Business Advisor inside the Grama Khatha app.
Your role is to act like a smart shop assistant who helps the shopkeeper make better financial and business decisions.
Analyze all available data and give practical, easy-to-follow advice.

--- WHAT YOU SHOULD ANALYZE ---
1. Credit Management: Identify high pending, risky customers, and increasing credit.
2. Payment Trends: Are payments improving or getting worse?
3. Business Performance: Is total pending increasing? Is cash flow affected?
4. Customer Behavior: Who are reliable vs risky customers?

--- OUTPUT FORMAT (STRICT) ---
--- BUSINESS HEALTH SUMMARY ---
Pending Trend: [Increasing / Stable / Decreasing]
Risk Level: [Low / Medium / High]

--- TOP ALERTS ---
1. [Important issue]
2. [Important issue]

--- SMART ACTIONS ---
1. [Action to take]
2. [Action to take]
3. [Action to take]

--- CUSTOMER ADVICE ---
* [Customer Name] -> [Advice]
* [Customer Name] -> [Advice]

--- FINAL SUGGESTION ---
"[Short overall advice for the shopkeeper]"

--- RULES ---
- Use VERY simple language. No technical terms.
- Keep advice practical and realistic.
- Focus on helping small shopkeepers reduce losses and improve cash flow.`;
      }

      const upiLink = merchant.upiId ? `upi://pay?pa=${merchant.upiId}&pn=${encodeURIComponent(merchant.shopName)}` : 'upi://pay?pa=shop@upi';
      
      let contextData = { ...shopData, qr_payment_link: upiLink, language: isKn ? 'Kannada' : 'English' };
      if (targetCustomer) {
        const cTransactions = transactions.filter(t => t.customerId === targetCustomer.id).sort((a,b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
        const lastTx = cTransactions[0];
        contextData = { 
          ...contextData, 
          target_customer: { 
            name: targetCustomer.name, 
            amount: targetCustomer.pendingAmount,
            days_overdue: getDaysOverdue(targetCustomer.dueDate),
            risk: getRiskLevel(targetCustomer),
            last_transaction_date: lastTx?.date?.toDate()?.toLocaleDateString() || 'None',
            last_transaction_type: lastTx?.type || 'None',
            last_transaction_amount: lastTx?.amount || 0
          }
        } as any;
      }
      if (targetSupplier) {
        const sTransactions = supplierTransactions.filter(t => t.supplierId === targetSupplier.id).sort((a,b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
        const lastTx = sTransactions[0];
        contextData = { 
          ...contextData, 
          target_supplier: { 
            name: targetSupplier.name, 
            amount: targetSupplier.pendingAmount,
            last_transaction_date: lastTx?.date?.toDate()?.toLocaleDateString() || 'None',
            last_transaction_type: lastTx?.type || 'None',
            last_transaction_amount: lastTx?.amount || 0
          }
        } as any;
      }

      const aiPrompt = userQuery 
        ? `User Question: ${userQuery}. Context Data: ${JSON.stringify(contextData)}`
        : targetCustomer 
          ? `Generate a specific message for CUSTOMER: ${targetCustomer.name}. Current Balance: ₹${targetCustomer.pendingAmount}. (Note: Positive means they owe shop, Negative means shop owes them). ${isKn ? 'In Kannada please.' : ''}`
          : targetSupplier
            ? `Generate a specific message for SUPPLIER: ${targetSupplier.name}. Current Balance: ₹${targetSupplier.pendingAmount}. (Note: Positive means shop owes them, Negative means they owe shop). ${isKn ? 'In Kannada please.' : ''}`
            : `Generate ${tab} insights for: ${JSON.stringify(contextData)}. Output in the specified structured format.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: { systemInstruction },
        contents: aiPrompt
      });

      const text = response.text || "No response.";

      if (tab === 'assistant' && userQuery) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: text }]);
      } else if (targetCustomer || targetSupplier) {
        setIndividualReminder(text);
      } else {
        setInsights(prev => ({ ...prev, [tab]: text }));
      }
    } catch (err: any) {
      console.error("AI Error:", err);
      const errorMsg = err?.message || String(err);
      
      if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
        setError(isKn 
          ? "ಕ್ಷಮಿಸಿ, ಎಐ ಮಿತಿ ಮುಗಿದಿದೆ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಪ್ರಯತ್ನಿಸಿ." 
          : "AI limit reached. Please wait a few minutes and try again.");
      } else if (errorMsg.includes('API_KEY_MISSING')) {
        setError(isKn
          ? "ಎಐ ಕೀ ಇಲ್ಲ. ದಯವಿಟ್ಟು Vercel ನಲ್ಲಿ VITE_GEMINI_API_KEY ಎನ್ವಿರಾನ್‌ಮೆಂಟ್ ವೇರಿಯಬಲ್ ಸೇರಿಸಿ."
          : "Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your Vercel Environment Variables.");
      } else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
         setError(isKn
          ? "ಕ್ಷಮಿಸಿ, ಈ ಎಐ ಮಾದರಿ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಡೆವಲಪರ್ ಅನ್ನು ಸಂಪರ್ಕಿಸಿ."
          : "AI Model not found. Please contact support or check your API key permissions.");
      } else {
        setError(isKn 
          ? `ಎಐ ತೊಂದರೆ: ${errorMsg.substring(0, 50)}...` 
          : `AI issue: ${errorMsg.substring(0, 50)}...`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!insights[activeAITab] && activeAITab !== 'assistant') {
      generateInsights(activeAITab);
    }
  }, [activeAITab]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;
    const msg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatInput('');
    generateInsights('assistant', msg);
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-80px)] lg:h-screen ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-[#000000]'}`}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Sparkles className="text-[#006B4D]" size={20} />
              </div>
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Grama AI</span>
            </h2>
            <p className="text-[10px] font-black text-[#000000] dark:text-gray-300 uppercase tracking-[0.2em] mt-1">{merchant.shopName}</p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-100 dark:border-emerald-500/20">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-3 h-3 border-2 border-[#006B4D] border-t-transparent rounded-full"
              />
              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">{isKn ? 'ಚಿಂತಿಸುತ್ತಿದೆ...' : 'Thinking...'}</span>
            </div>
          )}
        </div>

        {/* Improved Navigation - Cleaner Setup */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
          {aiTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveAITab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all whitespace-nowrap active:scale-95 ${
                activeAITab === tab.id 
                  ? 'bg-[#006B4D] text-white shadow-lg shadow-emerald-900/30 font-bold' 
                  : (darkMode ? 'bg-gray-800/50 text-gray-300 border border-gray-700/50' : 'bg-white text-[#000000] border border-gray-200 shadow-sm')
              }`}
            >
              <tab.icon size={16} className={activeAITab === tab.id ? 'text-white' : 'text-gray-400'} />
              <span className={`text-[12px] font-black uppercase tracking-widest leading-none`}>
                {isKn ? tab.knLabel : tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {error && (
          <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-3xl text-center mb-6">
             <p className="text-xs font-bold text-red-600">{error}</p>
          </div>
        )}

        {activeAITab === 'assistant' ? (
          <div className="space-y-4 pb-20">
            {chatMessages.length === 0 ? (
              <div className="text-center py-20 opacity-30">
                <MessageSquare size={48} className="mx-auto mb-4" />
                <p className="text-sm font-black">{isKn ? 'ಕೇಳಿ, ನಾನು ಉತ್ತರಿಸುತ್ತೇನೆ' : 'Ask me anything about your shop'}</p>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-3xl ${
                    msg.role === 'user' 
                      ? 'bg-[#006B4D] text-white rounded-tr-none' 
                      : (darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-md') + ' rounded-tl-none'
                  }`}>
                    <p className="text-sm font-black leading-relaxed whitespace-pre-wrap text-[#000000] dark:text-white">{msg.content}</p>
                  </div>
                </motion.div>
              ))
            )}
            
            {/* Input Fixed at Bottom */}
            <div className="fixed bottom-24 left-6 right-6">
              <form onSubmit={handleSendMessage} className="relative">
                <input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={isKn ? 'ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...' : 'Type a question...'}
                  className={`w-full p-5 pr-14 rounded-3xl outline-none shadow-xl border font-bold text-sm ${
                    darkMode ? 'bg-[#1E293B] border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900'
                  }`}
                />
                <button type="submit" disabled={loading} className="absolute right-2 top-2 bottom-2 w-12 bg-[#006B4D] text-white rounded-2xl flex items-center justify-center active:scale-90 transition-transform">
                  <Send size={20} />
                </button>
              </form>
            </div>
          </div>
        ) : activeAITab === 'reminder' ? (
          <div className="space-y-12">
            {/* Customer List */}
            <section>
              <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} p-6 rounded-[32px] border shadow-sm mb-6`}>
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Users size={16} className="text-emerald-600" />
                   </div>
                   <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600">{isKn ? 'ಗ್ರಾಹಕರಿಂದ ಬರಬೇಕಾದ ಹಣ' : 'Customer Collections'}</h3>
                </div>
                <p className="text-[10px] font-bold text-gray-400 leading-tight">
                  {isKn 
                    ? 'ಗ್ರಾಹಕರಿಂದ ಬರಬೇಕಾದ ಬಾಕಿ ಹಣದ ಪಟ್ಟಿ. ಬಾಕಿ ಹಣ ಇಲ್ಲದ ಗ್ರಾಹಕರನ್ನು ಇಲ್ಲಿ ತೋರಿಸಲಾಗುವುದಿಲ್ಲ.' 
                    : 'List of customers who owe money to the shop.'}
                </p>
              </div>

              <div className="space-y-4">
                {customers.sort((a,b) => Math.abs(b.pendingAmount) - Math.abs(a.pendingAmount)).map(c => (
                  <div key={c.id} className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} p-5 rounded-[32px] border shadow-sm`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-black text-sm">{c.name}</h4>
                        <p className="text-[10px] font-bold text-gray-400">{c.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-sm ${c.pendingAmount > 0 ? 'text-emerald-600' : c.pendingAmount < 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                          {c.pendingAmount > 0 ? `₹${c.pendingAmount.toLocaleString()}` : c.pendingAmount < 0 ? `Shop owes: ₹${Math.abs(c.pendingAmount).toLocaleString()}` : (isKn ? 'ಪಾವತಿಸಲಾಗಿದೆ' : 'Settled')}
                        </p>
                        {c.pendingAmount > 0 && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            getRiskLevel(c) === 'HIGH' ? 'bg-red-100 text-red-600' : 
                            getRiskLevel(c) === 'MEDIUM' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {getRiskLevel(c)} RISK
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {c.pendingAmount !== 0 ? (
                          <>
                            <Clock size={12} className="text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-400">{getDaysOverdue(c.dueDate)} {isKn ? 'ದಿನ ಬಾಕಿ' : 'days overdue'}</span>
                          </>
                        ) : (
                          <div className="flex items-center gap-1 text-emerald-600">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                             <span className="text-[10px] font-bold uppercase tracking-widest">{isKn ? 'ಪೂರ್ಣಗೊಂಡಿದೆ' : 'No Pending'}</span>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedSupplierForReminder(null);
                          setSelectedCustomerForReminder(c);
                          generateInsights('reminder', undefined, c);
                        }}
                        disabled={loading && selectedCustomerForReminder?.id === c.id}
                        className="bg-[#006B4D] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-2xl flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-900/10"
                      >
                        {loading && selectedCustomerForReminder?.id === c.id ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : <Send size={14} />}
                        {isKn ? 'ಸಂದೇಶ ಪಡೆಯಿರಿ' : 'Get Message'}
                      </button>
                    </div>

                    {selectedCustomerForReminder?.id === c.id && individualReminder && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800"
                      >
                        <div className={`${darkMode ? 'bg-gray-800' : 'bg-emerald-50'} p-4 rounded-2xl`}>
                          {merchant.upiId && (
                            <div className="text-center mb-4">
                              <div className="bg-white p-3 rounded-2xl w-fit mx-auto shadow-sm border border-emerald-100">
                                <QRCodeCanvas 
                                  value={`upi://pay?pa=${merchant.upiId}&pn=${encodeURIComponent(merchant.shopName)}&am=${c.pendingAmount}&cu=INR`}
                                  size={120}
                                  level="H"
                                />
                              </div>
                              <p className="text-[10px] font-black mt-2 text-[#006B4D] uppercase tracking-widest">{merchant.upiId}</p>
                              <p className="text-[8px] font-bold text-gray-400">Scan to Pay ₹{c.pendingAmount}</p>
                            </div>
                          )}
                          <p className="text-xs font-bold leading-relaxed italic mb-4">"{individualReminder?.replace(/Message:\s*"?/i, '')?.replace(/"?$/i, '')}"</p>
                          <div className="flex gap-2">
                             <button 
                               onClick={() => {
                                 let text = individualReminder?.replace(/Message:\s*"?/i, '')?.replace(/"?$/i, '') || '';
                                 if (merchant.upiId) {
                                   text += `\n\n🔹 Pay via UPI ID: ${merchant.upiId}`;
                                   text += `\n🔹 Amount: ₹${c.pendingAmount}`;
                                   text += `\n\nQuick Pay Link: upi://pay?pa=${merchant.upiId}&pn=${encodeURIComponent(merchant.shopName)}&am=${c.pendingAmount}&cu=INR`;
                                 }
                                 const phone = c.phone?.replace(/\D/g, '') || '';
                                 window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`);
                               }}
                               className="flex-1 bg-[#25D366] text-white py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 active:scale-95 transition-all"
                             >
                                <MessageSquare size={14} /> WhatsApp
                             </button>
                             <button 
                               onClick={() => {
                                 const text = individualReminder?.replace(/Message:\s*"?/i, '')?.replace(/"?$/i, '') || '';
                                 navigator.clipboard.writeText(text);
                                 alert('Copied!');
                               }}
                               className={`flex-1 py-2 bg-gray-200 dark:bg-gray-700 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 active:scale-95 transition-all`}
                             >
                               <Copy size={14} /> {isKn ? 'ಕಾಪಿ' : 'Copy'}
                             </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Supplier List */}
            <section>
              <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} p-6 rounded-[32px] border shadow-sm mb-6`}>
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                      <Truck size={16} className="text-red-600" />
                   </div>
                   <h3 className="text-sm font-black uppercase tracking-widest text-red-600">{isKn ? 'ಸರಬರಾಜುದಾರರಿಗೆ ಪಾವತಿ' : 'Supplier Payments'}</h3>
                </div>
                <p className="text-[10px] font-bold text-gray-400 leading-tight">
                  {isKn 
                    ? 'ಸರಬರಾಜುದಾರರಿಗೆ ಪಾವತಿಸಬೇಕಾದ ಬಾಕಿ ಹಣದ ಪಟ್ಟಿ.' 
                    : 'List of suppliers who you owe money.'}
                </p>
              </div>

              <div className="space-y-4">
                {suppliers.sort((a,b) => Math.abs(b.pendingAmount) - Math.abs(a.pendingAmount)).map(s => (
                  <div key={s.id} className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} p-5 rounded-[32px] border shadow-sm`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-black text-sm">{s.name}</h4>
                        <p className="text-[10px] font-bold text-gray-400">{s.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-sm ${s.pendingAmount > 0 ? 'text-red-500' : s.pendingAmount < 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {s.pendingAmount > 0 ? `₹${s.pendingAmount.toLocaleString()}` : s.pendingAmount < 0 ? `Supplier owes: ₹${Math.abs(s.pendingAmount).toLocaleString()}` : (isKn ? 'ಪಾವತಿಸಲಾಗಿದೆ' : 'Settled')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end">
                      <button 
                        onClick={() => {
                          setSelectedCustomerForReminder(null);
                          setSelectedSupplierForReminder(s);
                          generateInsights('reminder', undefined, undefined, s);
                        }}
                        disabled={loading && selectedSupplierForReminder?.id === s.id}
                        className={`${s.pendingAmount > 0 ? 'bg-red-600' : 'bg-emerald-600'} text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-2xl flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-red-900/10`}
                      >
                        {loading && selectedSupplierForReminder?.id === s.id ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : <Send size={14} />}
                        {isKn ? 'ಸಂದೇಶ ಪಡೆಯಿರಿ' : 'Get Message'}
                      </button>
                    </div>

                    {selectedSupplierForReminder?.id === s.id && individualReminder && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800"
                      >
                        <div className={`${darkMode ? 'bg-gray-800' : 'bg-red-50/30'} p-4 rounded-2xl`}>
                          <p className="text-xs font-bold leading-relaxed italic mb-4">"{individualReminder?.replace(/Message:\s*"?/i, '')?.replace(/"?$/i, '')}"</p>
                          <div className="flex gap-2">
                             <button 
                               onClick={() => {
                                 let text = individualReminder?.replace(/Message:\s*"?/i, '')?.replace(/"?$/i, '') || '';
                                 const phone = s.phone?.replace(/\D/g, '') || '';
                                 window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`);
                               }}
                               className="flex-1 bg-[#25D366] text-white py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 active:scale-95 transition-all"
                             >
                                <MessageSquare size={14} /> WhatsApp
                             </button>
                             <button 
                               onClick={() => {
                                 const text = individualReminder?.replace(/Message:\s*"?/i, '')?.replace(/"?$/i, '') || '';
                                 navigator.clipboard.writeText(text);
                                 alert('Copied!');
                               }}
                               className={`flex-1 py-2 bg-gray-200 dark:bg-gray-700 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 active:scale-95 transition-all`}
                             >
                               <Copy size={14} /> {isKn ? 'ಕಾಪಿ' : 'Copy'}
                             </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <motion.div
            key={activeAITab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-32"
          >
            {insights[activeAITab] ? (
              <div className="space-y-8">
                {/* Specific Tab Renderers */}
                {activeAITab === 'risk' && <RiskInsightsRenderer content={insights.risk!} darkMode={darkMode} isKn={isKn} />}
                {activeAITab === 'behavior' && <BehaviorInsightsRenderer content={insights.behavior!} darkMode={darkMode} isKn={isKn} />}
                {activeAITab === 'advisor' && <AdvisorInsightsRenderer content={insights.advisor!} darkMode={darkMode} isKn={isKn} />}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-20">
                {(() => {
                  const Icon = activityIcons[activeAITab];
                  return <Icon size={64} className="mb-4" />;
                })()}
                <p className="text-sm font-black uppercase tracking-widest">{isKn ? 'ಮಾಹಿತಿ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...' : 'Analyzing Information...'}</p>
              </div>
            )}

            <button
               onClick={() => generateInsights(activeAITab)}
               className={`w-full ${darkMode ? 'bg-[#1E293B] border-gray-800 shadow-none' : 'bg-white border-gray-100 shadow-lg shadow-emerald-900/5'} border p-6 rounded-[32px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all group overflow-hidden relative`}
             >
               <div className="absolute inset-0 bg-[#006B4D] translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-5" />
               <RotateCcw size={18} className="text-emerald-500 group-hover:rotate-180 transition-transform duration-700" />
               <span className="relative z-10">{isKn ? 'ಮತ್ತೊಮ್ಮೆ ವಿಶ್ಲೇಷಿಸಿ' : 'Refresh ' + activeAITab}</span>
             </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

const activityIcons: any = {
  risk: ShieldAlert,
  reminder: BellRing,
  report: FileText,
  assistant: MessageSquare,
  behavior: Zap,
  advisor: Lightbulb
};

/**
 * Specialized Renderer for Credit Risk Insights
 */
function RiskInsightsRenderer({ content, darkMode, isKn }: { content: string, darkMode: boolean, isKn: boolean }) {
  const sections = content.split('---').filter(s => s.trim().length > 10);
  
  return (
    <div className="space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
      {sections.map((section, idx) => {
        const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        // Enhanced name extraction: look for Name: or Name - or [Name] or the first non-keyword line
        let name = isKn ? 'ಗ್ರಾಹಕ' : 'Customer';
        const bracketMatch = section.match(/\[(.*?)\]/);
        const nameKeyMatch = section.match(/Name:\s*(.*)/i);
        const nameHyphenMatch = section.match(/^([^:\n]+)\s*-\s*Risk:/im);
        
        if (bracketMatch) {
          name = bracketMatch[1];
        } else if (nameKeyMatch) {
          name = nameKeyMatch[1].trim();
        } else if (nameHyphenMatch) {
          name = nameHyphenMatch[1].trim();
        } else if (lines.length > 0) {
          // Find first line that isn't a known field and doesn't look like a header
          const firstMeaningfulLine = lines.find(l => 
            !l.toLowerCase().includes('risk:') && 
            !l.toLowerCase().includes('reason:') && 
            !l.toLowerCase().includes('suggestion:') &&
            !l.toLowerCase().includes('score:') &&
            !l.startsWith('---')
          );
          if (firstMeaningfulLine) {
            name = firstMeaningfulLine.replace(/^[#\*\s-]+|[#\*\s-]+$/g, '').trim();
          }
        }
        
        const riskLine = lines.find(l => l.toLowerCase().includes('risk:'));
        const riskValue = riskLine ? riskLine.split(':')[1]?.trim() : (isKn ? 'ಕಡಿಮೆ' : 'Low');
        const isHigh = riskValue.toLowerCase().includes('high') || riskValue.includes('ಹೆಚ್ಚು');
        const isMedium = riskValue.toLowerCase().includes('medium') || riskValue.includes('ಮಧ್ಯಮ');
        
        const reasonLine = lines.find(l => l.toLowerCase().includes('reason:'));
        const suggestionLine = lines.find(l => l.toLowerCase().includes('suggestion:'));

        // Determine a mock 'score' for visual appeal
        const score = isHigh ? '30-45' : isMedium ? '60-75' : '85-98';

        return (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-6 rounded-[32px] border ${
              darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-300 shadow-xl shadow-emerald-900/10'
            } relative overflow-hidden group`}
          >
            <div className={`absolute top-0 left-0 w-2.5 h-full transition-all duration-500 group-hover:w-4 ${
              isHigh ? 'bg-red-600' : isMedium ? 'bg-amber-600' : 'bg-emerald-600'
            }`} />
            
            <div className="flex justify-between items-start mb-6 pl-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-2xl lg:text-3xl truncate pr-4 text-[#181515] dark:text-white uppercase tracking-tighter mb-1">{name}</h4>
                <div className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] inline-flex items-center gap-2 ${
                  isHigh ? 'bg-red-600 text-white shadow-lg shadow-red-200' : isMedium ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                }`}>
                  <ShieldAlert size={14} />
                  {isKn ? `ಅಪಾಯ: ${riskValue}` : `Risk: ${riskValue}`}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-3xl font-black ${isHigh ? 'text-red-700 dark:text-red-400' : isMedium ? 'text-amber-700 dark:text-amber-400' : 'text-[#000000] dark:text-emerald-400'}`}>
                  {score}<span className="text-[12px] opacity-40 ml-0.5">/100</span>
                </div>
                <p className="text-[10px] font-black text-[#000000] dark:text-gray-400 uppercase tracking-widest leading-none mt-1">{isKn ? 'ಸ್ಕೋರ್' : 'Trust Score'}</p>
              </div>
            </div>

            <div className="space-y-4 pl-2">
              <div className={`p-5 rounded-2xl ${darkMode ? 'bg-gray-800/80' : 'bg-[#eadde3]'} border border-gray-200 dark:border-gray-700/50`}>
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center shadow-md border border-gray-200">
                      <AlertTriangle size={16} className="text-[#111010]" />
                   </div>
                   <p className="text-[11px] font-black text-[#151618] dark:text-gray-200 uppercase tracking-[0.25em]">{isKn ? 'ವಿಶ್ಲೇಷಣೆ' : 'AI ANALYSIS'}</p>
                </div>
                <p className="text-base font-black leading-relaxed text-[#232121] dark:text-gray-100 mb-2">{reasonLine?.split(':')[1]?.replace(/[\*"]/g, '').trim() || 'Details analysis pending...'}</p>
              </div>

              <div className={`p-6 rounded-2xl ${
                isHigh ? 'bg-red-50 border-red-200 dark:bg-red-900/40 dark:border-red-800' : isMedium ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/40 dark:border-amber-800' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-800'
              } border-2`}>
                <div className="flex items-center gap-2 mb-3">
                   <CheckCircle2 size={16} className={isHigh ? 'text-red-800 dark:text-red-300' : isMedium ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'} />
                   <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${isHigh ? 'text-[#000000] dark:text-red-200' : isMedium ? 'text-[#000000] dark:text-amber-200' : 'text-[#000000] dark:text-emerald-200'}`}>
                     {isKn ? 'ಶಿಫಾರಸು' : 'RECOMMENDATION'}
                   </p>
                </div>
                <p className={`text-lg font-black leading-tight text-[#000000] dark:text-gray-100`}>
                  {suggestionLine?.split(':')[1]?.replace(/[\*"]/g, '').trim() || 'N/A'}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Specialized Renderer for Customer Behavior Insights
 */
function BehaviorInsightsRenderer({ content, darkMode, isKn }: { content: string, darkMode: boolean, isKn: boolean }) {
  const sections = content.split('---').filter(s => s.trim().length > 10);

  return (
    <div className="space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
      {sections.map((section, idx) => {
        const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        let name = isKn ? 'ಗ್ರಾಹಕ' : 'Customer';
        const bracketMatch = section.match(/\[(.*?)\]/);
        const nameKeyMatch = section.match(/Name:\s*(.*)/i);
        const nameHyphenMatch = section.match(/^([^:\n]+)\s*-\s*Behavior:/im);
        
        if (bracketMatch) {
          name = bracketMatch[1];
        } else if (nameKeyMatch) {
          name = nameKeyMatch[1].trim();
        } else if (nameHyphenMatch) {
          name = nameHyphenMatch[1].trim();
        } else if (lines.length > 0) {
          const firstMeaningfulLine = lines.find(l => 
            !l.toLowerCase().includes('behavior:') && 
            !l.toLowerCase().includes('pending:') && 
            !l.toLowerCase().includes('explanation:') &&
            !l.toLowerCase().includes('suggestion:') &&
            !l.startsWith('---')
          );
          if (firstMeaningfulLine) {
            name = firstMeaningfulLine.replace(/^[#\*\s-]+|[#\*\s-]+$/g, '').trim();
          }
        }
        
        const behaviorLine = lines.find(l => l.toLowerCase().includes('behavior:'));
        const pendingLine = lines.find(l => l.toLowerCase().includes('pending:'));
        const explanationLine = lines.find(l => l.toLowerCase().includes('explanation:'));
        const suggestionLine = lines.find(l => l.toLowerCase().includes('suggestion:'));

        return (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-6 rounded-[32px] border ${
              darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-300 shadow-xl shadow-emerald-900/10'
            } relative overflow-hidden`}
          >
            <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                  <Zap size={22} />
               </div>
               <div>
                 <h4 className="font-black text-xl lg:text-2xl text-[#000000] dark:text-white uppercase tracking-tight">{name}</h4>
                 <div className="bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full inline-block mt-1">
                   <p className="text-[10px] font-black text-[#000000] dark:text-emerald-400 uppercase tracking-[0.2em]">{behaviorLine?.split(':')[1]?.trim() || 'Stable'}</p>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} border border-gray-200/50`}>
                  <p className="text-[10px] font-black text-[#000000] dark:text-gray-400 uppercase tracking-widest mb-1">{isKn ? 'ಬಾಕಿ' : 'Pending'}</p>
                  <p className="text-xl font-black text-[#000000] dark:text-white">{pendingLine?.split(':')[1]?.trim() || '₹0'}</p>
               </div>
               <div className={`p-4 rounded-2xl ${darkMode ? 'bg-[#006B4D]/30' : 'bg-[#006B4D]/10'} border border-[#006B4D]/20 text-center flex flex-col justify-center`}>
                  <p className="text-[9px] font-black text-[#000000] dark:text-emerald-400 uppercase tracking-widest mb-1">{isKn ? 'ಶಿಫಾರಸು' : 'Insight'}</p>
                  <p className="text-xs font-black text-[#000000] dark:text-emerald-100">{suggestionLine?.split(':')[1]?.replace(/[\*"]/g, '').trim() || 'Safe'}</p>
               </div>
            </div>

            <div className={`p-5 rounded-[24px] ${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} border border-gray-200 dark:border-gray-800`}>
               <div className="flex gap-3">
                  <MessageSquare size={18} className="text-emerald-800 shrink-0 mt-1" />
                  <p className="text-[14px] font-black leading-relaxed text-[#000000] dark:text-white">
                    {explanationLine?.split(':')[1]?.replace(/[\*"]/g, '').trim() || 'N/A'}
                  </p>
               </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}


/**
 * Specialized Renderer for Advisor Insights
 */
function AdvisorInsightsRenderer({ content, darkMode, isKn }: { content: string, darkMode: boolean, isKn: boolean }) {
  const sections = content.split('---').filter(s => s.trim().length > 10);
  
  return (
    <div className="space-y-10 md:grid md:grid-cols-2 md:gap-10 md:space-y-0">
      {sections.map((section, idx) => {
        const lines = section.split('\n').filter(l => l.trim().length > 0);
        const title = lines[0].trim();
        const body = lines.slice(1);
        
        const isHeader = title.includes('SUMMARY');
        const isActions = title.includes('ACTIONS');
        const isAdvice = title.includes('SUGGESTION');

        if (isHeader) {
          return (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="grid grid-cols-2 gap-5"
            >
              {body.map((l, i) => {
                const parts = l.split(':');
                if (parts.length < 2) return null;
                const val = parts[1].trim();
                const isPositive = val.toLowerCase().includes('decreasing') || val.toLowerCase().includes('low') || val.toLowerCase().includes('stable');
                const isNegative = val.toLowerCase().includes('increasing') || val.toLowerCase().includes('high');
                
                return (
                  <div key={i} className={`p-8 rounded-[40px] border ${
                    darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100 shadow-2xl shadow-emerald-950/5'
                  } relative overflow-hidden group hover:shadow-emerald-900/10 transition-all duration-500`}>
                    <div className={`absolute -right-4 -top-4 w-24 h-24 opacity-[0.03] transition-transform duration-700 group-hover:scale-150 group-hover:rotate-12 ${
                      isNegative ? 'text-red-500' : isPositive ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      <TrendingUp size={96} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                         <div className={`w-1.5 h-1.5 rounded-full ${isNegative ? 'bg-red-500' : isPositive ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                         <p className="text-[10px] font-black text-[#000000] dark:text-gray-200 uppercase tracking-[0.3em]">{parts[0].trim()}</p>
                      </div>
                      <p className={`text-2xl lg:text-3xl font-black tracking-tighter ${
                        isNegative ? 'text-red-900 dark:text-red-400' : isPositive ? 'text-emerald-900 dark:text-emerald-400' : 'text-amber-900 dark:text-amber-400'
                      }`}>
                        {val}
                      </p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          );
        }

        if (isActions) {
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
               <div className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[20px] bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-900/20">
                      <Target size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#000000] dark:text-emerald-300 uppercase tracking-[0.3em]">{isKn ? 'ಮಾಡಿರಬೇಕಾದ ಕ್ರಮಗಳು' : 'STRATEGIC STEPS'}</p>
                      <p className="text-[10px] font-bold text-[#000000] dark:text-gray-300 uppercase tracking-widest mt-0.5">{isKn ? 'ವೈಯಕ್ತಿಕಗೊಳಿಸಿದ ವಿಶ್ಲೇಷಣೆ' : 'PERSONALIZED ANALYSIS'}</p>
                    </div>
                 </div>
               </div>
               
               <div className="space-y-4">
                 {body.map((l, i) => (
                   <motion.div 
                     key={i} 
                     whileHover={{ x: 10 }}
                     className={`flex items-center gap-6 p-6 rounded-[36px] ${
                       darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-200'
                     } border shadow-sm group transition-all cursor-default`}
                   >
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-black text-gray-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-inner">
                         {String(i + 1).padStart(2, '0')}
                      </div>
                      <p className="text-[16px] font-black leading-snug text-[#000000] dark:text-white tracking-tight flex-1">
                        {l?.replace(/^\d\.\s*/, '').replace(/[\*"]/g, '').trim()}
                      </p>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                         <ArrowRight size={20} className="text-emerald-600" />
                      </div>
                   </motion.div>
                 ))}
               </div>
            </motion.div>
          );
        }

        if (isAdvice) {
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-12 rounded-[60px] ${darkMode ? 'bg-[#0F172A] text-white shadow-emerald-950/20 border-emerald-500/10' : 'bg-white text-[#000000] shadow-xl shadow-emerald-900/10 border-gray-200'} border shadow-2xl relative overflow-hidden group`}
            >
               <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full -mr-40 -mt-40 animate-pulse" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full -ml-32 -mb-32" />
               <Sparkles size={160} className={`absolute -right-12 -bottom-12 opacity-5 rotate-12 ${darkMode ? 'text-emerald-400' : 'text-emerald-900'} group-hover:rotate-45 transition-transform duration-1000`} />
               
               <div className="relative z-10">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-[24px] bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-900/40 relative">
                      <div className="absolute inset-0 rounded-[24px] bg-emerald-500 animate-ping opacity-20" />
                      <Zap size={28} className="text-white relative z-10" />
                    </div>
                    <div>
                      <p className={`text-[11px] font-black uppercase tracking-[0.5em] ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{isKn ? 'ಅಂತಿಮ ಸಲಹೆ' : 'AI MASTER STRATEGY'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-1 h-1 rounded-full ${darkMode ? 'bg-emerald-400' : 'bg-emerald-700'}`} />
                        <p className={`text-[9px] font-bold ${darkMode ? 'text-emerald-400/80' : 'text-emerald-700/80'} uppercase tracking-widest`}>{isKn ? 'ಗ್ರಾಮ-ಖಾತಾ ಸ್ಮಾರ್ಟ್ ಐಇ' : 'POWERED BY GRAMA-KHATA AI v2.0'}</p>
                      </div>
                    </div>
                 </div>
                 <p className={`text-3xl font-black leading-tight tracking-tighter ${darkMode ? 'text-white' : 'text-[#000000]'} mb-6 max-w-2xl`}>
                   {body[0]?.replace(/"/g, '')?.trim()}
                 </p>
                 <div className={`h-px w-full ${darkMode ? 'bg-gradient-to-r from-emerald-500/30 to-transparent' : 'bg-gradient-to-r from-emerald-200 to-transparent'}`} />
               </div>
            </motion.div>
          );
        }

        return (
          <div key={idx} className="space-y-5 px-2">
            <h4 className="text-[10px] font-black text-[#000000] dark:text-gray-400 uppercase tracking-[0.35em] mb-4">{title}</h4>
            <div className="space-y-4">
               {body.map((l, i) => (
                 <div key={i} className="flex gap-4 group items-start">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-[15px] font-black leading-relaxed text-[#000000] dark:text-gray-100 tracking-tight">{l?.replace(/^[\*\-]\s*/, '').replace(/[\*"]/g, '').trim()}</p>
                 </div>
               ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
/**
 * Reports Screen
 */
function ReportsScreen({ customers, transactions, merchant, suppliers, supplierTransactions }: { customers: CustomerData[], transactions: TransactionData[], merchant: MerchantData, suppliers: SupplierData[], supplierTransactions: SupplierTransactionData[] }) {
  const isKn = merchant.preferences?.language === 'kn';
  const darkMode = merchant.preferences?.darkMode || false;
  const [reportType, setReportType] = useState<'general' | 'customers' | 'suppliers'>('general');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'overall' | 'today' | 'last7' | 'last15' | 'thisMonth' | 'lastMonth' | 'last3' | 'last6'>('overall');

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    
    const getPeriodData = (list: any[], filter: string, isPrevious: boolean = false) => {
      let start: Date;
      let end: Date = isPrevious ? todayStart : now;

      if (filter === 'overall') return list;

      if (filter === 'today') {
        start = isPrevious ? subDays(todayStart, 1) : todayStart;
        if (isPrevious) end = todayStart;
      } else if (filter === 'last7') {
        start = isPrevious ? subDays(now, 14) : subDays(now, 7);
        if (isPrevious) end = subDays(now, 7);
      } else if (filter === 'last15') {
        start = isPrevious ? subDays(now, 30) : subDays(now, 15);
        if (isPrevious) end = subDays(now, 15);
      } else if (filter === 'thisMonth') {
        start = isPrevious ? new Date(now.getFullYear(), now.getMonth() - 1, 1) : new Date(now.getFullYear(), now.getMonth(), 1);
        end = isPrevious ? new Date(now.getFullYear(), now.getMonth(), 0) : now;
      } else if (filter === 'lastMonth') {
        start = isPrevious ? new Date(now.getFullYear(), now.getMonth() - 2, 1) : new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = isPrevious ? new Date(now.getFullYear(), now.getMonth() - 1, 0) : new Date(now.getFullYear(), now.getMonth(), 0);
      } else if (filter === 'last3') {
        start = isPrevious ? subMonths(now, 6) : subMonths(now, 3);
        if (isPrevious) end = subMonths(now, 3);
      } else if (filter === 'last6') {
        start = isPrevious ? subMonths(now, 12) : subMonths(now, 6);
        if (isPrevious) end = subMonths(now, 6);
      } else {
        start = todayStart;
      }

      return list.filter(t => {
        const timestamp = t.date?.toDate();
        if (!timestamp) return false;
        return timestamp >= start && timestamp <= end;
      });
    };

    const currentTx = getPeriodData(transactions, dateFilter);
    const currentSupTx = getPeriodData(supplierTransactions, dateFilter);
    const prevTx = getPeriodData(transactions, dateFilter, true);
    const prevSupTx = getPeriodData(supplierTransactions, dateFilter, true);

    const calculateValues = (txs: any[], supTxs: any[]) => {
      const sales = txs.filter(t => t.type === 'credit').reduce((acc, t) => acc + t.amount, 0);
      const purchases = supTxs.filter(t => t.type === 'purchase').reduce((acc, t) => acc + t.amount, 0);
      const incoming = txs.filter(t => t.type === 'payment').reduce((acc, t) => acc + t.amount, 0);
      const outgoing = supTxs.filter(t => t.type === 'payment').reduce((acc, t) => acc + t.amount, 0);
      return { sales, purchases, incoming, outgoing, profit: sales - purchases, cashFlow: incoming - outgoing };
    };

    const current = calculateValues(currentTx, currentSupTx);
    const previous = calculateValues(prevTx, prevSupTx);

    // Top Contributors
    const topCustomers = Object.entries(
      currentTx.filter(t => t.type === 'payment').reduce((acc: any, t) => {
        acc[t.customerId] = (acc[t.customerId] || 0) + t.amount;
        return acc;
      }, {})
    ).map(([id, amount]) => ({ id, name: customers.find(c => c.id === id)?.name || 'Unknown', amount: amount as number }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    const topSuppliers = Object.entries(
      currentSupTx.filter(t => t.type === 'payment').reduce((acc: any, t) => {
        acc[t.supplierId] = (acc[t.supplierId] || 0) + t.amount;
        return acc;
      }, {})
    ).map(([id, amount]) => ({ id, name: suppliers.find(s => s.id === id)?.name || 'Unknown', amount: amount as number }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    const totalCustomerPending = customers.reduce((acc, c) => acc + (c.pendingAmount > 0 ? c.pendingAmount : 0), 0);
    const totalSupplierPending = suppliers.reduce((acc, s) => acc + (s.pendingAmount > 0 ? s.pendingAmount : 0), 0);
    const netPosition = totalCustomerPending - totalSupplierPending;

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(now, 6 - i);
      const dayStart = startOfDay(d);
      const dayEnd = endOfDay(d);
      const dayName = format(d, 'EEE');

      const collections = transactions
        .filter(t => t.type === 'payment' && t.date?.toDate() >= dayStart && t.date?.toDate() <= dayEnd)
        .reduce((acc, t) => acc + t.amount, 0);

      const purchases = supplierTransactions
        .filter(t => t.type === 'purchase' && t.date?.toDate() >= dayStart && t.date?.toDate() <= dayEnd)
        .reduce((acc, t) => acc + t.amount, 0);

      const sales = transactions
        .filter(t => t.type === 'credit' && t.date?.toDate() >= dayStart && t.date?.toDate() <= dayEnd)
        .reduce((acc, t) => acc + t.amount, 0);

      return { name: dayName, collections, purchases, sales };
    });

    return { 
      ...current,
      previous,
      topCustomers,
      topSuppliers,
      totalCustomerPending, 
      totalSupplierPending,
      netPosition,
      last7Days
    };
  }, [customers, transactions, suppliers, supplierTransactions, dateFilter]);

  const handleExportCSV = (type: 'customers' | 'suppliers' | 'transactions' | 'detailed') => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (type === 'customers') {
      csvContent += "Name,Phone,Pending Amount\n";
      customers.forEach(c => {
        csvContent += `"${c.name}","${c.phone}",${c.pendingAmount}\n`;
      });
    } else if (type === 'suppliers') {
      csvContent += "Name,Phone,Pending Amount\n";
      suppliers.forEach(s => {
        csvContent += `"${s.name}","${s.phone}",${s.pendingAmount}\n`;
      });
    } else if (type === 'detailed' && detailedReport) {
      csvContent += `Report for,${detailedReport.entity.name}\n`;
      csvContent += `Opening Balance,${detailedReport.openingBalance}\n\n`;
      csvContent += "Date,Notes,Type,Payment Mode,Payment,Credit/Purchase\n";
      detailedReport.transactions.forEach((tx: any) => {
        const isOut = reportType === 'customers' ? tx.type === 'credit' : tx.type === 'purchase';
        const typeLabel = tx.type === 'payment' ? 'Payment' : (isOut ? (reportType === 'customers' ? 'Credit' : 'Purchase') : '');
        csvContent += `${format(tx.date.toDate(), 'yyyy-MM-dd HH:mm')},"${tx.note || ''}","${typeLabel}","${tx.paymentMode || 'N/A'}",${tx.type === 'payment' ? tx.amount : ''},${isOut ? tx.amount : ''}\n`;
      });
      csvContent += `\nClosing Balance,${detailedReport.closingBalance}`;
    } else if (type === 'transactions') {
      csvContent += "Type,Entity,Amount,Date,Payment Mode,Note\n";
      transactions.forEach(t => {
        const entity = customers.find(c => c.id === t.customerId)?.name || 'Unknown';
        csvContent += `${t.type},"${entity}",${t.amount},${format(t.date.toDate(), 'yyyy-MM-dd')},"${t.paymentMode || 'N/A'}","${t.note || ''}"\n`;
      });
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allCustomerStats = useMemo(() => {
    return [...customers]
      .sort((a, b) => Math.abs(b.pendingAmount) - Math.abs(a.pendingAmount));
  }, [customers]);

  const allSupplierStats = useMemo(() => {
    return [...suppliers]
      .sort((a, b) => Math.abs(b.pendingAmount) - Math.abs(a.pendingAmount));
  }, [suppliers]);

  // Detailed Report Logic
  const detailedReport = useMemo(() => {
    if (!selectedEntityId) return null;
    
    const entity = (reportType === 'customers' ? customers.find(c => c.id === selectedEntityId) : suppliers.find(s => s.id === selectedEntityId)) as any;
    if (!entity) return null;

    const entityTx = reportType === 'customers' 
      ? transactions.filter(t => t.customerId === selectedEntityId) 
      : supplierTransactions.filter(t => t.supplierId === selectedEntityId);

    const now = new Date();
    let startDate = subDays(now, 3650); // far past
    let endDate = endOfDay(now);

    if (dateFilter === 'today') startDate = startOfDay(now);
    else if (dateFilter === 'last7') startDate = subDays(now, 7);
    else if (dateFilter === 'last15') startDate = subDays(now, 15);
    else if (dateFilter === 'thisMonth') startDate = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    else if (dateFilter === 'lastMonth') {
      startDate = startOfDay(subMonths(now, 1));
      startDate.setDate(1);
      endDate = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
    }
    else if (dateFilter === 'last3') startDate = subMonths(now, 3);
    else if (dateFilter === 'last6') startDate = subMonths(now, 6);

    const sortedTx = [...entityTx].sort((a, b) => a.date?.toDate().getTime() - b.date?.toDate().getTime());
    
    let openingBalance = 0;
    const periodTx: any[] = [];
    
    sortedTx.forEach(tx => {
      const txDate = tx.date?.toDate();
      const txEffect = reportType === 'customers' 
        ? (tx.type === 'credit' ? tx.amount : -tx.amount)
        : (tx.type === 'purchase' ? tx.amount : -tx.amount);

      if (isBefore(txDate, startDate)) {
        openingBalance += txEffect;
      } else if (!isBefore(txDate, startDate) && !isAfter(txDate, endDate)) {
        periodTx.push(tx);
      }
    });

    const totalIn = periodTx.filter(t => t.type === 'payment').reduce((acc, t) => acc + t.amount, 0);
    const totalOut = periodTx.filter(t => reportType === 'customers' ? t.type === 'credit' : t.type === 'purchase').reduce((acc, t) => acc + t.amount, 0);
    
    const closingBalance = openingBalance + (reportType === 'customers' ? (totalOut - totalIn) : (totalOut - totalIn));

    return {
      entity,
      openingBalance,
      closingBalance,
      totalIn,
      totalOut,
      transactions: periodTx.reverse(), // most recent first for table
      startDate,
      endDate
    };
  }, [selectedEntityId, reportType, customers, suppliers, transactions, supplierTransactions, dateFilter]);

  if (detailedReport) {
    const dr = detailedReport;
    return (
      <div className={`fixed inset-0 lg:static lg:inset-auto lg:flex-1 lg:h-screen z-[120] flex flex-col transition-colors duration-300 ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#F8FAFC]'}`}>
        <header className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} px-6 py-6 border-b flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedEntityId(null)} className="text-gray-400 lg:hidden">✕</button>
            <div className="hidden lg:block">
              <button onClick={() => setSelectedEntityId(null)} className="flex items-center gap-2 text-gray-500 hover:text-[#006B4D] transition-colors font-bold pr-4">
                 <ChevronRight size={18} className="rotate-180" />
                 <span>{isKn ? 'ಹಿಂದೆ' : 'Back'}</span>
              </button>
            </div>
            <div>
              <h2 className="text-xl font-black leading-tight">{isKn ? 'ವರದಿ' : (reportType === 'customers' ? 'Customer Report' : 'Supplier Report')}</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{dr.entity.name} • {isKn ? 'ಬಾಕಿ' : 'Current Balance'} ₹{dr.entity.pendingAmount.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleExportCSV('detailed')}
              className="text-[#006B4D] font-black text-[11px] flex items-center gap-2"
            >
              <Download size={14} />
              {isKn ? 'ಡೌನ್‌ಲೋಡ್' : 'Download CSV'}
            </button>
            <button className="text-gray-400 font-black text-[11px] uppercase tracking-widest leading-none translate-y-1">More</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="px-4 py-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
              {[
                { id: 'overall', label: isKn ? 'ಒಟ್ಟು' : 'Overall' },
                { id: 'today', label: isKn ? 'ಇಂದು' : 'Today' },
                { id: 'last7', label: isKn ? '7 ದಿನಗಳು' : 'Last 7 Days' },
                { id: 'last15', label: isKn ? '15 ದಿನಗಳು' : 'Last 15 Days' },
                { id: 'thisMonth', label: isKn ? 'ಈ ತಿಂಗಳು' : 'This Month' },
                { id: 'lastMonth', label: isKn ? 'ಕಳೆದ ತಿಂಗಳು' : 'Last Month' },
                { id: 'last3', label: isKn ? '3 ತಿಂಗಳು' : 'Last 3 Months' },
                { id: 'last6', label: isKn ? '6 ತಿಂಗಳು' : 'Last 6 Months' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setDateFilter(f.id as any)}
                  className={`px-5 py-3 rounded-xl border text-[11px] font-black whitespace-nowrap transition-all ${
                    dateFilter === f.id 
                      ? 'bg-[#E7F3EF] text-[#006B4D] border-[#006B4D]' 
                      : (darkMode ? 'bg-[#1e293b] text-gray-400 border-gray-800' : 'bg-white text-gray-400 border-gray-200')
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 mb-8 border border-gray-100 dark:border-gray-800 rounded-[32px] overflow-hidden">
               {[
                 { label: 'Opening Balance', value: dr.openingBalance, color: 'text-gray-900 dark:text-white', bg: 'bg-gray-50/50 dark:bg-gray-900/50' },
                 { label: reportType === 'customers' ? `Payments (${dr.transactions.filter((t: any) => t.type === 'payment').length})` : `Payments (${dr.transactions.filter((t: any) => t.type === 'payment').length})`, value: dr.totalIn, color: 'text-[#006B4D]', bg: 'bg-[#E7F3EF] dark:bg-emerald-900/10' },
                 { label: reportType === 'customers' ? `Credits (${dr.transactions.filter((t: any) => t.type === 'credit').length})` : `Purchases (${dr.transactions.filter((t: any) => t.type === 'purchase').length})`, value: dr.totalOut, color: 'text-red-600', bg: 'bg-red-50/50 dark:bg-red-900/10' },
                 { label: 'Closing Balance', value: dr.closingBalance, color: 'text-red-700', bg: 'bg-red-50/20 dark:bg-red-950/20' }
               ].map((box, i) => (
                 <div key={i} className={`p-6 border-r last:border-0 border-gray-100 dark:border-gray-800 ${box.bg}`}>
                    <p className="text-[10px] font-black text-gray-400 mb-2 leading-tight">{box.label}</p>
                    <p className={`text-xl font-black ${box.color}`}>₹{box.value.toLocaleString()}</p>
                 </div>
               ))}
            </div>

            <div className="bg-white dark:bg-[#1E293B] rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
               <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Notes</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Mode</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Payments</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Credits</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dr.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-20 text-center text-gray-300 font-bold italic">No entries for this period</td>
                      </tr>
                    ) : (
                      dr.transactions.map((tx: any, idx: number) => {
                        return (
                          <tr key={tx.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-4">
                               <p className="text-[12px] font-bold text-gray-600 dark:text-gray-300">
                                 {format(tx.date.toDate(), 'dd MMM yyyy, hh:mm a')}
                               </p>
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-[12px] font-bold text-gray-400 italic">
                                 {tx.note || (tx.type === 'payment' ? 'Cash Received' : 'Rice/Purchase')}
                               </p>
                            </td>
                            <td className="px-6 py-4 text-center">
                               {tx.paymentMode ? (
                                 <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 dark:bg-blue-900/10 px-2 py-0.5 rounded-full">
                                   {tx.paymentMode}
                                 </span>
                               ) : (
                                 <span className="text-[10px] font-black text-gray-300">-</span>
                               )}
                            </td>
                            <td className="px-6 py-4 text-center">
                               {tx.type === 'payment' && <span className="font-black text-[#006B4D]">₹{tx.amount.toLocaleString()}</span>}
                            </td>
                            <td className="px-6 py-4 text-center">
                               {(tx.type === 'credit' || tx.type === 'purchase') && <span className="font-black text-red-600">₹{tx.amount.toLocaleString()}</span>}
                            </td>
                            <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white">
                                ₹{tx.amount.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-40 transition-colors duration-300 ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#F8FAFC]'}`}>
      <header className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-black tracking-tight mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {isKn ? 'ದೈನಂದಿನ ವರದಿ' : 'Business Insights'}
            </h1>
            <p className="text-gray-400 font-bold tracking-tight">
              {format(new Date(), 'dd MMMM yyyy')}
            </p>
          </div>
          <button className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} p-4 rounded-3xl border shadow-sm`}>
            <Calendar size={24} className="text-[#006B4D]" />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
           {[
             { id: 'general', label: isKn ? 'ಸಾಮಾನ್ಯ' : 'Overview', icon: BarChart3 },
             { id: 'customers', label: isKn ? 'ಗ್ರಾಹಕರು' : 'Customers', icon: Users },
             { id: 'suppliers', label: isKn ? 'ಸರಬರಾಜುದಾರರು' : 'Suppliers', icon: Truck }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setReportType(tab.id as any)}
               className={`flex items-center gap-2 px-6 py-4 rounded-[24px] font-black text-sm whitespace-nowrap transition-all border ${
                 reportType === tab.id 
                   ? 'bg-[#006B4D] text-white border-[#006B4D] shadow-lg shadow-[#006B4D]/20' 
                   : (darkMode ? 'bg-[#1e293b] text-gray-400 border-gray-800' : 'bg-white text-gray-500 border-gray-100')
               }`}
             >
               <tab.icon size={18} />
               <span>{tab.label}</span>
             </button>
           ))}
        </div>
      </header>

      <section className="px-6 space-y-6">
        {reportType === 'general' && (
          <>
            {/* Date Profile Header */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {[
                { id: 'overall', label: isKn ? 'ಒಟ್ಟಾರೆ' : 'Overall' },
                { id: 'today', label: isKn ? 'ಇಂದು' : 'Today' },
                { id: 'last7', label: isKn ? '7 ದಿನಗಳು' : '7 Days' },
                { id: 'thisMonth', label: isKn ? 'ಈ ತಿಂಗಳು' : 'This Month' },
                { id: 'lastMonth', label: isKn ? 'ಹಿಂದಿನ ತಿಂಗಳು' : 'Last Month' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setDateFilter(filter.id as any)}
                  className={`px-5 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
                    dateFilter === filter.id
                      ? 'bg-gray-900 text-white shadow-md'
                      : (darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500 border border-gray-100')
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Main Business Summary */}
            <div className={`p-8 rounded-[40px] shadow-xl ${stats.profit >= 0 ? 'bg-gradient-to-br from-[#006B4D] to-[#059669] text-white' : 'bg-gradient-to-br from-red-600 to-red-800 text-white'}`}>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{isKn ? 'ನಿವ್ವಳ ಲಾಭ' : 'Estimated Profit'}</p>
                    {stats.previous.profit !== 0 && (
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        stats.profit >= stats.previous.profit ? 'bg-white/20 text-white' : 'bg-black/10 text-white/70'
                      }`}>
                        {stats.profit >= stats.previous.profit ? '+' : ''}
                        {Math.round(((stats.profit - stats.previous.profit) / (stats.previous.profit || 1)) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">₹</span>
                    <h2 className="text-5xl font-black tracking-tighter">{stats.profit.toLocaleString()}</h2>
                  </div>
                </div>
                <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-sm">
                  <TrendingUp size={24} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white/10 p-5 rounded-[32px] backdrop-blur-sm border border-white/10">
                    <span className="text-[10px] font-black opacity-60 uppercase mb-1 block">{isKn ? 'ಒಟ್ಟು ಮಾರಾಟ' : 'Total Sales'}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black">₹{stats.sales.toLocaleString()}</span>
                      {stats.previous.sales !== 0 && (
                        <span className="text-[9px] opacity-70">
                          {stats.sales >= stats.previous.sales ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                 </div>
                 <div className="bg-white/10 p-5 rounded-[32px] backdrop-blur-sm border border-white/10">
                    <span className="text-[10px] font-black opacity-60 uppercase mb-1 block">{isKn ? 'ಒಟ್ಟು ಖರೀದಿ' : 'Total Purchases'}</span>
                    <span className="text-xl font-black">₹{stats.purchases.toLocaleString()}</span>
                 </div>
              </div>
            </div>

            {/* Cash Flow Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} p-6 rounded-[40px] border shadow-sm`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <ArrowDownLeft size={20} />
                  </div>
                  {stats.previous.incoming !== 0 && (
                    <span className={`text-[9px] font-black ${stats.incoming >= stats.previous.incoming ? 'text-emerald-500' : 'text-red-400'}`}>
                      {stats.incoming >= stats.previous.incoming ? '↑' : '↓'}
                      {Math.abs(Math.round(((stats.incoming - stats.previous.incoming) / (stats.previous.incoming || 1)) * 100))}%
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{isKn ? 'ಒಳಬರುವ ಹಣ' : 'Incoming'}</p>
                <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>₹{stats.incoming.toLocaleString()}</p>
              </div>
              <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} p-6 rounded-[40px] border shadow-sm`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-2xl flex items-center justify-center">
                    <ArrowUpRight size={20} />
                  </div>
                  {stats.previous.outgoing !== 0 && (
                    <span className={`text-[9px] font-black ${stats.outgoing <= stats.previous.outgoing ? 'text-emerald-500' : 'text-red-400'}`}>
                      {stats.outgoing <= stats.previous.outgoing ? '↓' : '↑'}
                      {Math.abs(Math.round(((stats.outgoing - stats.previous.outgoing) / (stats.previous.outgoing || 1)) * 100))}%
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{isKn ? 'ಹೊರಹೋಗುವ ಹಣ' : 'Outgoing'}</p>
                <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>₹{stats.outgoing.toLocaleString()}</p>
              </div>
            </div>

            {/* Top Performers Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.topCustomers.length > 0 && (
                <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} p-6 rounded-[40px] border shadow-sm`}>
                  <h4 className={`text-xs font-black uppercase tracking-widest mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {isKn ? 'ಟಾಪ್ ಗ್ರಾಹಕರು' : 'Top Customers'}
                  </h4>
                  <div className="space-y-4">
                    {stats.topCustomers.map((c, i) => (
                      <div key={c.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-gray-300">#{i+1}</span>
                          <span className="text-xs font-bold truncate max-w-[120px]">{c.name}</span>
                        </div>
                        <span className="text-xs font-black text-emerald-500">₹{c.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {stats.topSuppliers.length > 0 && (
                <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} p-6 rounded-[40px] border shadow-sm`}>
                  <h4 className={`text-xs font-black uppercase tracking-widest mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {isKn ? 'ಟಾಪ್ ಸರ್ಬರಾಜುದಾರರು' : 'Top Suppliers'}
                  </h4>
                  <div className="space-y-4">
                    {stats.topSuppliers.map((s, i) => (
                      <div key={s.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-gray-300">#{i+1}</span>
                          <span className="text-xs font-bold truncate max-w-[120px]">{s.name}</span>
                        </div>
                        <span className="text-xs font-black text-red-400">₹{s.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Net Position Card (Compact) */}
            <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} p-8 rounded-[40px] border shadow-sm flex items-center justify-between`}>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{isKn ? 'ನಿವ್ವಳ ಬಾಕಿ' : 'Net Receivables'}</p>
                <div className="flex items-baseline gap-2">
                   <p className={`text-2xl font-black ${stats.netPosition >= 0 ? 'text-[#006B4D]' : 'text-red-600'}`}>₹{stats.netPosition.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right flex flex-col gap-1">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1 rounded-full">
                  <p className="text-[9px] font-black text-emerald-600 uppercase">{isKn ? 'ಗ್ರಾಹಕರಿಂದ' : 'Cust'}: ₹{stats.totalCustomerPending.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/10 px-3 py-1 rounded-full">
                  <p className="text-[9px] font-black text-red-500 uppercase">{isKn ? 'ಸರಬರಾಜುದಾರರಿಗೆ' : 'Supp'}: ₹{stats.totalSupplierPending.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} p-8 rounded-[40px] shadow-sm border`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{isKn ? '7 ದಿನಗಳ ಪ್ರವೃತ್ತಿ' : '7-Day Trend'}</h3>
                  <p className="text-xs text-gray-400 font-bold">{isKn ? 'ಮಾರಾಟ ಮತ್ತು ಸಂಗ್ರಹ' : 'Sales vs Collections'}</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{isKn ? 'ಮಾರಾಟ' : 'Sales'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#006B4D]" />
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{isKn ? 'ಸಂಗ್ರಹ' : 'Collections'}</span>
                  </div>
                </div>
              </div>

              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.last7Days} barGap={8}>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fontWeight: 800, fill: '#94a3b8' }} 
                      dy={10}
                    />
                    <Tooltip 
                      cursor={{ fill: darkMode ? '#ffffff05' : '#00000005' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-gray-900/95 backdrop-blur-sm text-white p-4 rounded-3xl shadow-2xl border border-white/10">
                              <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest border-b border-white/10 pb-2">{payload[0].payload.name}</p>
                              <div className="space-y-1">
                                <div className="flex justify-between gap-6">
                                  <span className="text-[10px] font-bold text-blue-400 uppercase">Sales</span>
                                  <span className="text-xs font-black">₹{payload[0].payload.sales}</span>
                                </div>
                                <div className="flex justify-between gap-6">
                                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Collections</span>
                                  <span className="text-xs font-black">₹{payload[0].payload.collections}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="sales" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={12} />
                    <Bar dataKey="collections" fill="#006B4D" radius={[6, 6, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Business Health Meter */}
            <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} p-8 rounded-[40px] shadow-sm border`}>
              <h3 className={`text-lg font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{isKn ? 'ವ್ಯವಹಾರದ ಆರೋಗ್ಯ' : 'Business Health'}</h3>
              <div className="space-y-8">
                  {[
                    { 
                      label: isKn ? 'ಲಾಭದ ಅಂತರ' : 'Profit Margin', 
                      value: stats.sales > 0 ? Math.round((stats.profit / stats.sales) * 100) : 0, 
                      suffix: '%',
                      color: 'emerald', 
                      icon: TrendingUp 
                    },
                    { 
                      label: isKn ? 'ಹೊಸ ಗ್ರಾಹಕರು' : 'New Customers', 
                      value: customers.filter(c => {
                        const d = c.createdAt?.toDate();
                        return d && isAfter(d, subDays(new Date(), 30));
                      }).length, 
                      goal: 10,
                      color: 'blue', 
                      icon: UserPlus 
                    },
                    { 
                      label: isKn ? 'ನಗದು ಹರಿವಿನ ಅನುಪಾತ' : 'Cash Flow Ratio', 
                      value: stats.outgoing > 0 ? parseFloat((stats.incoming / stats.outgoing).toFixed(1)) : (stats.incoming > 0 ? 5 : 0), 
                      goal: 2,
                      color: 'orange', 
                      icon: Activity 
                    }
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl bg-${item.color}-50 dark:bg-${item.color}-900/10 text-${item.color}-600 flex items-center justify-center`}>
                              <item.icon size={20} />
                            </div>
                            <span className="text-sm font-black text-gray-500 uppercase tracking-widest">{item.label}</span>
                        </div>
                        <span className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {item.value}{item.suffix || ''}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (Number(item.value) / (item.goal || 100)) * 100)}%` }}
                          className={`h-full bg-${item.color === 'emerald' ? '[#006B4D]' : item.color + '-500'}`}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>


            <button 
              onClick={() => handleExportCSV('transactions')}
              className="w-full bg-gray-900 text-white py-6 rounded-[32px] font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
            >
              <Download size={24} />
              <span>{isKn ? 'ದತ್ತಾಂಶವನ್ನು ರಫ್ತು ಮಾಡಿ (CSV)' : 'Export Business Data (CSV)'}</span>
            </button>
          </>
        )}

        {reportType === 'customers' && (
          <div className="space-y-6">
            <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} p-8 rounded-[40px] shadow-sm border`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black">{isKn ? 'ಗ್ರಾಹಕರ ಪಟ್ಟಿ' : 'All Customers'}</h3>
                <span className="text-[10px] font-black text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full uppercase tracking-widest">{customers.length}</span>
              </div>
              <div className="space-y-3">
                {allCustomerStats.map((c) => (
                  <div 
                    key={c.id} 
                    onClick={() => setSelectedEntityId(c.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer active:scale-[0.98] transition-all ${
                      darkMode ? 'bg-[#0F172A] hover:bg-[#1e293b]' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black ${
                        c.pendingAmount > 0 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {c.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{c.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{c.phone}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-black text-sm ${c.pendingAmount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        ₹{Math.abs(c.pendingAmount).toLocaleString()}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-tighter opacity-40">
                        {c.pendingAmount > 0 ? (isKn ? 'ಬಾಕಿ' : 'DUE') : (isKn ? 'ಹೆಚ್ಚುವರಿ' : 'ADVANCE')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={() => handleExportCSV('customers')}
              className="w-full bg-[#006B4D] text-white py-6 rounded-[32px] font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
            >
              <Download size={24} />
              <span>{isKn ? 'ಗ್ರಾಹಕರ ಪಟ್ಟಿ ಡೌನ್‌ಲೋಡ್' : 'Download Customer List (CSV)'}</span>
            </button>
          </div>
        )}

        {reportType === 'suppliers' && (
          <div className="space-y-6">
            <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} p-8 rounded-[40px] shadow-sm border`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black">{isKn ? 'ಸರಬರಾಜುದಾರರ ಪಟ್ಟಿ' : 'All Suppliers'}</h3>
                <span className="text-[10px] font-black text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full uppercase tracking-widest">{suppliers.length}</span>
              </div>
              <div className="space-y-3">
                {allSupplierStats.map((s) => (
                  <div 
                    key={s.id} 
                    onClick={() => setSelectedEntityId(s.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer active:scale-[0.98] transition-all ${
                      darkMode ? 'bg-[#0F172A] hover:bg-[#1e293b]' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">
                        {s.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{s.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{s.phone}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-sm text-red-600">
                        ₹{s.pendingAmount.toLocaleString()}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-tighter opacity-40">
                        {isKn ? 'ಕೊಡಬೇಕಾದದ್ದು' : 'PAYABLE'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={() => handleExportCSV('suppliers')}
              className="w-full bg-[#1E40AF] text-white py-6 rounded-[32px] font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
            >
              <Download size={24} />
              <span>{isKn ? 'ಸರಬರಾಜುದಾರರ ಪಟ್ಟಿ ಡೌನ್‌ಲೋಡ್' : 'Download Supplier List (CSV)'}</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

// --- Types ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const err = error as any;
  if (err?.message?.includes('INTERNAL ASSERTION FAILED')) {
    console.error("Firestore SDK Internal Error detected. Reloading in 2s...");
    setTimeout(() => window.location.reload(), 2000);
    return;
  }
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Delete Confirmation Modal
 */
function DeleteConfirmationModal({ 
  name, 
  isKn, 
  darkMode, 
  onConfirm, 
  onCancel, 
  isLoading 
}: { 
  name: string, 
  isKn: boolean, 
  darkMode: boolean, 
  onConfirm: () => void, 
  onCancel: () => void,
  isLoading: boolean
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }}
        className={`w-full max-w-sm rounded-[40px] shadow-2xl p-8 text-center ${darkMode ? 'bg-[#1E293B]' : 'bg-white'}`}
      >
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={40} />
        </div>
        <h3 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {isKn ? 'ಖಚಿತಪಡಿಸಿ' : 'Are you sure?'}
        </h3>
        <p className="text-sm font-bold text-gray-500 mb-8 leading-relaxed">
          {isKn 
            ? `${name} ಅವರನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ? ಇದು ಎಲ್ಲ ವಹಿವಾಟುಗಳನ್ನು ಸಹ ಅಳಿಸುತ್ತದೆ.` 
            : `Are you sure you want to delete ${name}? This will also delete all associated transactions and cannot be undone.`}
        </p>
        <div className="flex gap-4">
          <button 
            onClick={onCancel}
            disabled={isLoading}
            className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all ${darkMode ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-gray-100 text-gray-500'}`}
          >
            {isKn ? 'ರದ್ದು' : 'Cancel'}
          </button>
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-4 rounded-2xl font-black text-sm bg-red-600 text-white shadow-lg shadow-red-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading ? (isKn ? 'ಅಳಿಸಲಾಗುತ್ತಿದೆ...' : 'Deleting...') : (isKn ? 'ಅಳಿಸಿ' : 'Yes, Delete')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface MerchantData {
  shopkeeperName: string;
  shopName: string;
  phone: string;
  photoURL?: string;
  qrCodeURL?: string;
  upiId?: string;
  preferences?: {
    darkMode?: boolean;
    language?: 'en' | 'kn';
    showCurrency?: boolean;
    compactMode?: boolean;
  };
  createdAt: any;
  updatedAt?: any;
}

interface CustomerData {
  id: string;
  name: string;
  phone: string;
  pendingAmount: number;
  address?: string;
  notes?: string;
  photoURL?: string;
  avatarSeed?: string;
  createdAt: any;
  updatedAt?: any;
  dueDate?: any;
  creditLimit?: number;
  lastTransactionDate?: any;
  lastTransactionAmount?: number;
  lastTransactionType?: 'credit' | 'payment';
}

interface TransactionData {
  id: string;
  customerId: string;
  amount: number;
  type: 'credit' | 'payment';
  category?: string; // Optional category for UI
  note: string;
  notes?: string;
  paymentMode?: 'cash' | 'upi' | 'bank' | null;
  date: any;
}

interface SupplierData {
  id: string;
  name: string;
  phone: string;
  pendingAmount: number;
  address?: string;
  notes?: string;
  photoURL?: string;
  avatarSeed?: string;
  createdAt: any;
  updatedAt?: any;
}

interface SupplierTransactionData {
  id: string;
  supplierId: string;
  amount: number;
  type: 'purchase' | 'payment';
  category?: string;
  note: string;
  paymentMode?: 'cash' | 'upi' | 'bank' | null;
  date: any;
}

interface LoginHistoryData {
  id: string;
  timestamp: any;
  device: string;
  ip?: string;
  status: 'success' | 'failed';
}

// --- Components ---

/**
 * Reusable Customer Avatar Component
 */
function CustomerAvatar({ customer, size = 'md' }: { customer: CustomerData, size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 text-sm',
    lg: 'w-20 h-20 text-2xl',
    xl: 'w-32 h-32 text-4xl'
  };

  const nameInitial = customer.name ? customer.name[0].toUpperCase() : '?';

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-[#006B4D] border-4 border-[#006B4D]/5 shadow-inner shrink-0 flex items-center justify-center text-white font-black`}>
      {customer.photoURL ? (
        <img src={customer.photoURL} alt={customer.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : customer.avatarSeed ? (
        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.avatarSeed}`} alt={customer.name} className="w-full h-full object-cover" />
      ) : (
        <span>{nameInitial}</span>
      )}
    </div>
  );
}

/**
 * Reusable Supplier Avatar Component
 */
function SupplierAvatar({ supplier, size = 'md' }: { supplier: SupplierData, size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 text-sm',
    lg: 'w-20 h-20 text-2xl',
    xl: 'w-32 h-32 text-4xl'
  };

  const nameInitial = supplier.name ? supplier.name[0].toUpperCase() : '?';

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-[#1D4ED8] border-4 border-blue-100 dark:border-blue-900 shadow-inner shrink-0 flex items-center justify-center text-white font-black`}>
      {supplier.photoURL ? (
        <img src={supplier.photoURL} alt={supplier.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : supplier.avatarSeed ? (
        <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${supplier.avatarSeed}`} alt={supplier.name} className="w-full h-full object-cover" />
      ) : (
        <span>{nameInitial}</span>
      )}
    </div>
  );
}

function SupplierCard({ supplier, compact, showCurrency = true, onClick }: { supplier: SupplierData, compact?: boolean, showCurrency?: boolean, onClick?: () => void }) {
  const statusConfig = useMemo(() => {
    if (supplier.pendingAmount > 0) return { label: 'YOU OWE', bg: 'bg-red-100', text: 'text-red-700' };
    if (supplier.pendingAmount < 0) return { label: 'ADVANCE', bg: 'bg-[#BBF7D0]', text: 'text-[#006B4D]' };
    return { label: 'SETTLED', bg: 'bg-gray-100', text: 'text-gray-500' };
  }, [supplier.pendingAmount]);

  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-[#1E293B] rounded-[40px] shadow-sm border border-gray-50 dark:border-gray-800 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer group ${compact ? 'p-4' : 'p-6'}`}
    >
      <div className="flex items-center gap-5">
        <SupplierAvatar supplier={supplier} size={compact ? 'sm' : 'md'} />
        <div>
          <h3 className={`font-black tracking-tight leading-tight mb-1 ${compact ? 'text-sm' : 'text-[17px]'} ${compact ? 'text-gray-800 dark:text-gray-100' : 'text-gray-900 dark:text-white'}`}>{supplier.name}</h3>
          {!compact && (
            <p className="text-[13px] text-gray-400 font-black tracking-tight">
              +{supplier.phone.substring(0, 3)} {supplier.phone.substring(3, 8)} {supplier.phone.substring(8)}
            </p>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className={`flex items-center justify-end gap-1 mb-2 font-black ${supplier.pendingAmount > 0 ? 'text-red-600' : (supplier.pendingAmount < 0 ? 'text-[#006B4D] dark:text-[#10B981]' : 'text-gray-400')} ${compact ? 'text-base' : 'text-[22px]'}`}>
           {showCurrency && <span className="text-sm font-bold opacity-60">₹</span>}
           <span>{Math.abs(supplier.pendingAmount).toLocaleString()}</span>
        </div>
        {!compact && (
          <span className={`text-[9px] font-black px-4 py-2 rounded-full tracking-[0.1em] ${statusConfig.bg} ${statusConfig.text}`}>
            {statusConfig.label}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Splash Screen Component
 */
function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 3500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  const particles = useMemo(() => Array.from({ length: 15 }), []);

  return (
    <div className="fixed inset-0 bg-[#004D37] flex flex-col items-center justify-center text-white overflow-hidden">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 opacity-15 bg-cover bg-center mix-blend-soft-light scale-105 animate-pulse-slow"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1574621100236-d25b64cfca60?auto=format&fit=crop&q=80&w=1200")' }}
        />
        <div className="absolute inset-0 bg-radial-[circle_at_center,_var(--tw-gradient-stops)] from-transparent via-[#006B4D]/30 to-[#004D37]/90" />
      </div>

      {/* Floating Animated Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        {particles.map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: 0,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: [null, "-20%", "120%"],
              opacity: [0, 0.4, 0]
            }}
            transition={{ 
              duration: 10 + Math.random() * 20, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * 10
            }}
            className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
          />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div 
          initial={{ scale: 0.7, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-12"
        >
          <div className="w-44 h-44 bg-white/5 backdrop-blur-3xl rounded-[3rem] flex items-center justify-center border border-white/20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] relative">
            <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent rounded-[3rem]" />
            <div className="relative">
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  y: [0, -4, 0]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Store size={88} className="text-white drop-shadow-2xl" strokeWidth={1} />
              </motion.div>
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                className="absolute -bottom-4 -right-4 bg-white rounded-2xl p-3 shadow-2xl border-4 border-[#004D37]/10"
              >
                <IndianRupee size={28} className="text-[#006B4D]" strokeWidth={3} />
              </motion.div>
            </div>
          </div>
          
          {/* Decorative rings */}
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0.1 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 border-2 border-white rounded-[3rem]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="text-center"
        >
          <div className="mb-2">
            <motion.h1 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              className="text-6xl font-black tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
            >
              Grama<span className="text-[#BBF7D0]">-</span>Khata
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-2xl font-black text-[#BBF7D0]/60 mt-1 Kannada-font"
            >
              ಗ್ರಾಮ-ಖಾತಾ
            </motion.p>
          </div>
          
          <div className="flex items-center justify-center gap-4 mt-6">
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="h-[1px] w-12 bg-linear-to-r from-transparent to-white/40 origin-right" 
            />
            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/50">Smart Village Ledger • ಸ್ಮಾರ್ಟ್ ಹಳ್ಳಿ ಲೆಡ್ಜರ್</p>
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="h-[1px] w-12 bg-linear-to-l from-transparent to-white/40 origin-left" 
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Modern Wave Loading Progress */}
      <div className="absolute bottom-20 flex flex-col items-center gap-6 w-full">
        <div className="w-56 h-1 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: 3.5, ease: "linear" }}
            className="absolute inset-0 h-full w-full bg-linear-to-r from-[#006B4D] via-[#A7F3D0] to-[#006B4D]"
          />
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <p className="text-[9px] font-black tracking-widest text-[#BBF7D0]/40 uppercase animate-pulse">
            Initializing Secure Ledger • ಡೇಟಾವನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ
          </p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="w-1 h-1 bg-[#BBF7D0] rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Dynamic Glow and subtle light leaks */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-[0.03] blur-[150px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#BBF7D0] opacity-[0.03] blur-[150px] translate-y-1/2 -translate-x-1/2 rounded-full pointer-events-none" />
    </div>
  );
}

/**
 * Customer Ledger View
 */
function CustomerDetailScreen({ user, customer, merchant, onBack }: { user: FirebaseUser, customer: CustomerData, merchant: MerchantData, onBack: () => void }) {
  const isKn = merchant.preferences?.language === 'kn';
  const darkMode = merchant.preferences?.darkMode || false;
  const showCurrency = merchant.preferences?.showCurrency !== false;

  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [activeTab, setActiveTab] = useState('transactions');
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'payment'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  useEffect(() => {
    const path = `merchants/${user.uid}/transactions`;
    const q = query(
      collection(db, path),
      where('customerId', '==', customer.id)
    );
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TransactionData));
      setTransactions(data.sort((a, b) => b.date?.seconds - a.date?.seconds));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }, [user.uid, customer.id]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const typeMatch = filterType === 'all' || tx.type === filterType;
      
      if (!tx.date) return typeMatch;
      const txDate = tx.date.toDate();
      let dateMatch = true;
      if (dateRange.start) {
        const start = new Date(dateRange.start);
        start.setHours(0, 0, 0, 0);
        dateMatch = dateMatch && txDate >= start;
      }
      if (dateRange.end) {
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        dateMatch = dateMatch && txDate <= end;
      }
      
      return typeMatch && dateMatch;
    });
  }, [transactions, filterType, dateRange]);

  const [isAddTxOpen, setIsAddTxOpen] = useState<{ type: 'credit' | 'payment' } | null>(null);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editName, setEditName] = useState(customer.name);
  const [editPhone, setEditPhone] = useState(customer.phone);
  const [editAddress, setEditAddress] = useState(customer.address || '');
  const [editNotes, setEditNotes] = useState(customer.notes || '');
  const [editDueDate, setEditDueDate] = useState(customer.dueDate ? (customer.dueDate.toDate ? customer.dueDate.toDate().toISOString().split('T')[0] : customer.dueDate) : '');
  const [isSaving, setIsSaving] = useState(false);

  const statusConfig = useMemo(() => {
    if (customer.pendingAmount > 0) return { label: isKn ? 'ಸಂಗ್ರಹಿಸಿ' : 'To Collect', bg: 'bg-[#FEE2E2]', text: 'text-red-700', icon: Info };
    return { label: isKn ? 'ಸೆಟಲ್ ಆಗಿದೆ' : 'Settled', bg: 'bg-gray-100', text: 'text-gray-500', icon: ShieldCheck };
  }, [customer.pendingAmount, isKn]);

  const handleSendReminder = (method: 'whatsapp' | 'share' | 'sms') => {
     const lastTx = transactions[0];
     const dateStr = lastTx?.date?.toDate() ? lastTx.date.toDate().toLocaleDateString('en-IN') : null;
     const message = isKn 
       ? `ನಮಸ್ಕಾರ ${customer.name}, ಇದು ${merchant.shopName} ಕಡೆಯಿಂದ ನಿಮ್ಮ ಬಾಕಿ ಹಣ ₹${customer.pendingAmount.toLocaleString()} ಗಳ ನೆನಪೋಲೆ.${dateStr ? ` ನಿಮ್ಮ ಕೊನೆಯ ವಹಿವಾಟು ${dateStr} ರಂದು ನಡೆದಿದೆ.` : ''} ದಯವಿಟ್ಟು ಬಾಕಿ ಹಣವನ್ನು ಪಾವತಿಸಿ. ಧನ್ಯವಾದಗಳು!`
       : `Hello ${customer.name}, this is a reminder from ${merchant.shopName} regarding your pending balance of ₹${customer.pendingAmount.toLocaleString()}.${dateStr ? ` Last transaction was on ${dateStr}.` : ''} Please settle the dues at your earliest convenience. Thank you!`;
     
     if (method === 'whatsapp') {
        const phone = customer.phone?.replace(/\D/g, '') || '';
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
     } else if (method === 'sms') {
        const cleanPhone = customer.phone?.replace(/\D/g, '') || '';
        const phone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
        const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const smsUrl = `sms:${phone}${isIos ? '&' : '?'}body=${encodeURIComponent(message)}`;
        window.location.href = smsUrl;
     } else {
        if (navigator.share) {
           navigator.share({ title: 'Payment Reminder', text: message }).catch(() => {});
        } else {
           navigator.clipboard.writeText(message);
           alert('Reminder message copied to clipboard!');
        }
     }
     setIsReminderOpen(false);
  };

  const handleSaveCustomer = async () => {
    setIsSaving(true);
    const path = `merchants/${user.uid}/customers/${customer.id}`;
    const customerRef = doc(db, path);
    try {
      await updateDoc(customerRef, {
        name: editName,
        phone: editPhone,
        address: editAddress,
        notes: editNotes,
        dueDate: editDueDate ? Timestamp.fromDate(new Date(editDueDate)) : null,
        updatedAt: serverTimestamp()
      });
      setIsEditOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    setIsSaving(true);
    const path = `merchants/${user.uid}/customers/${customer.id}`;
    try {
      const txPath = `merchants/${user.uid}/transactions`;
      const txQuery = query(collection(db, txPath), where('customerId', '==', customer.id));
      const txSnapshot = await getDocs(txQuery);
      const deleteTxPromises = txSnapshot.docs.map(d => deleteDoc(doc(db, txPath, d.id)));
      await Promise.all(deleteTxPromises);

      await deleteDoc(doc(db, path));
      onBack();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`fixed inset-0 lg:static lg:inset-auto lg:flex-1 lg:h-screen z-[100] flex flex-col overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#F8FAFC]'}`}>
      {/* Header - Matching Image */}
      <header className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} px-6 py-4 flex items-center gap-6 border-b shrink-0`}>
        <button onClick={onBack} className={`${darkMode ? 'text-white' : 'text-gray-900'} p-1 lg:hidden`}>
          <ChevronRight className="rotate-180" size={24} />
        </button>
        <div className="hidden lg:block">
           <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-[#006B4D] transition-colors font-bold">
              <ChevronRight className="rotate-180" size={18} />
              <span>{isKn ? 'ಹಿಂದೆ' : 'Back'}</span>
           </button>
        </div>
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{isKn ? 'ಗ್ರಾಹಕರ ವಿವರ' : 'Customer Detail'}</h2>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Customer Summary Card - Matching Image */}
        <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} m-4 p-8 rounded-[40px] shadow-sm border relative`}>
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-6">
                <CustomerAvatar customer={customer} size="lg" />
                <div className="min-w-0 flex-1">
                   <h3 className={`text-2xl md:text-3xl font-black leading-tight mb-1 truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{customer.name}</h3>
                   <div className="flex items-center gap-2 text-gray-500 font-bold">
                      <Smartphone size={16} className="shrink-0" />
                      <span className="text-sm truncate">+{customer.phone.substring(0, 3)} {customer.phone.substring(3, 8)} {customer.phone.substring(8)}</span>
                   </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 self-end md:self-center">
                {customer.pendingAmount > 0 && (
                  <button 
                    onClick={() => setIsReminderOpen(true)}
                    className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 rounded-xl md:rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-sm border border-blue-100 dark:border-blue-800"
                    title="Send Reminder"
                  >
                    <Send size={20} className="md:size-6" />
                  </button>
                )}
                
                <button 
                  onClick={() => setIsEditOpen(true)}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-sm border ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-[#006B4D] border-gray-200'}`}
                  title="Edit Profile"
                >
                  <Edit3 size={20} className="md:size-6" />
                </button>
                
                <button 
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-sm border ${darkMode ? 'bg-red-900/30 text-red-100 border-red-800' : 'bg-red-50 text-red-600 border-red-100'}`}
                  title="Delete Customer"
                >
                  <Trash2 size={20} className="md:size-6" />
                </button>
              </div>
           </div>

           <div className={`h-px mb-8 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />

           <div className="flex justify-between items-end">
              <div>
                 <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-2">{isKn ? 'ಒಟ್ಟು ಬಾಕಿ' : 'Total Due'}</p>
                 <div className="flex items-baseline gap-2">
                    {showCurrency && <span className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>₹</span>}
                    <span className="text-5xl font-black text-[#B91C1C] tracking-tight">{Math.abs(customer.pendingAmount).toLocaleString()}</span>
                 </div>
              </div>
              <div className={`${statusConfig.bg} ${statusConfig.text} px-4 py-2 rounded-2xl flex items-center gap-2`}>
                 <statusConfig.icon size={14} strokeWidth={3} />
                 <span className="text-[11px] font-black uppercase tracking-wider">{statusConfig.label}</span>
              </div>
           </div>
        </div>

        {/* Action Buttons - Matching Image */}
        <div className="px-4 grid grid-cols-2 gap-4 mb-8">
           <button 
             onClick={() => setIsAddTxOpen({ type: 'payment' })}
             className="bg-[#006B4D] text-white p-5 rounded-[28px] border-2 border-transparent flex flex-col items-center justify-center gap-1 shadow-lg shadow-[#006B4D]/20 active:scale-95 transition-all text-center"
           >
              <div className="flex items-center gap-2 mb-1">
                 <Store size={18} />
                 <span className="font-black text-[15px]">Add Payment</span>
              </div>
              <span className="text-[10px] font-medium opacity-80 leading-none">ಪಾವತಿ ಸೇರಿಸಿ</span>
           </button>
           <button 
             onClick={() => setIsAddTxOpen({ type: 'credit' })}
             className="bg-white text-[#1E40AF] p-5 rounded-[28px] border-2 border-[#1E40AF]/20 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all text-center"
           >
              <div className="flex items-center gap-2 mb-1">
                 <CreditCard size={18} />
                 <span className="font-black text-[15px]">Add Credit</span>
              </div>
              <span className="text-[10px] font-medium opacity-80 leading-none text-gray-500">ಕ್ರೆಡಿಟ್ ಸೇರಿಸಿ</span>
           </button>
        </div>

        {/* Tabs - Matching Image */}
        <div className={`px-6 flex gap-8 border-b mb-6 ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
           {['Transactions', 'Profile', 'Notes'].map(tab => {
              const label = isKn ? (
                tab === 'Transactions' ? 'ವಹಿವಾಟುಗಳು' :
                tab === 'Profile' ? 'ಪ್ರೊಫೈಲ್' : 'ಟಿಪ್ಪಣಿಗಳು'
              ) : tab;
              return (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`py-4 text-sm font-black transition-all relative ${
                    activeTab === tab.toLowerCase() ? 'text-[#006B4D]' : 'text-gray-400'
                  }`}
                >
                   {label}
                   {activeTab === tab.toLowerCase() && (
                     <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#006B4D] rounded-t-full" />
                   )}
                </button>
              );
           })}
        </div>

        {/* Filters - Only shown if Transactions tab is active */}
        {activeTab === 'transactions' && (
          <div className="px-6 mb-6 space-y-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: isKn ? 'ಎಲ್ಲಾ' : 'All' },
                { id: 'credit', label: isKn ? 'ಸಾಲಗಳು' : 'Credits' },
                { id: 'payment', label: isKn ? 'ಪಾವತಿಗಳು' : 'Payments' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                    filterType === f.id 
                      ? 'bg-[#006B4D] text-white border-[#006B4D] shadow-sm' 
                      : (darkMode ? 'bg-[#334155] text-gray-400 border-gray-700' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200')
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className={`flex items-center gap-3 p-4 rounded-3xl border shadow-sm overflow-hidden ${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-50'}`}>
               <div className="text-[#006B4D] p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <Calendar size={18} />
               </div>
               <div className="flex-1 flex items-center gap-2">
                  <input 
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className={`flex-1 bg-transparent border-none text-[11px] font-bold focus:ring-0 p-0 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  />
                  <div className={`w-2 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  <input 
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className={`flex-1 bg-transparent border-none text-[11px] font-bold focus:ring-0 p-0 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  />
               </div>
               {(dateRange.start || dateRange.end) && (
                 <button 
                   onClick={() => setDateRange({ start: '', end: '' })}
                   className="text-[10px] font-black text-red-500 uppercase tracking-tight"
                 >
                   {isKn ? 'ಅಳಿಸಿ' : 'Clear'}
                 </button>
               )}
            </div>
          </div>
        )}

        {/* Transactions List */}
        {activeTab === 'transactions' && (
          <div className="px-6 space-y-4 pb-32">
             {filteredTransactions.length === 0 ? (
               <div className={`py-12 text-center rounded-[32px] border border-dashed ${darkMode ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-200'}`}>
                  <History size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{isKn ? 'ಯಾವುದೇ ವಹಿವಾಟು ಇಲ್ಲ' : 'No Transactions Found'}</p>
               </div>
             ) : (
               filteredTransactions.map(tx => {
                 const isCredit = tx.type === 'credit';
                 return (
                   <div key={tx.id} className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-50'} p-5 rounded-[32px] shadow-sm border flex items-center justify-between group active:opacity-80 transition-colors`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                          isCredit ? 'bg-red-50 text-red-600' : 'bg-green-50 text-[#006B4D]'
                        }`}>
                          {isCredit ? (
                            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
                              <Store size={24} />
                            </div>
                          ) : (
                            <div className="bg-[#BBF7D0] dark:bg-green-900/30 p-2 rounded-lg relative">
                              {tx.paymentMode === 'upi' ? <QrCode size={24} /> : <IndianRupee size={24} />}
                              {tx.paymentMode && (
                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#1E293B] rounded-full p-0.5 shadow-xs">
                                  {tx.paymentMode === 'upi' ? <div className="text-[7px] font-black px-1">UPI</div> : <Banknote size={8} />}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className={`font-black text-lg leading-tight mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {tx.note || (isCredit ? (isKn ? 'ಸಾಲ' : 'Items Purchased') : (isKn ? 'ಹಣ ಸ್ವೀಕೃತಿ' : 'Cash Received'))}
                          </h4>
                          <div className="flex items-center gap-2 mb-1">
                            {tx.category && (
                              <span className={`${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-[#f1f5f9] text-gray-500'} text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter`}>
                                {tx.category === 'Groceries' && isKn ? 'ದಿನಸಿ' : tx.category}
                              </span>
                            )}
                            {tx.notes && (
                              <p className="text-xs font-bold text-gray-500 line-clamp-1">{tx.notes}</p>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">
                            {tx.date?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, {tx.date?.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • {isCredit ? (isKn ? 'ಸಾಲ' : 'Credit') : (isKn ? 'ಪಾವತಿ' : 'Payment')}
                            {!isCredit && tx.paymentMode && ` • ${tx.paymentMode.toUpperCase()}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-xl tracking-tight ${isCredit ? 'text-[#B91C1C]' : 'text-[#006B4D]'}`}>
                          {isCredit ? '' : '₹'}{tx.amount.toLocaleString()}
                        </p>
                        {isCredit && (
                          <div className="flex flex-col items-end">
                             <p className="text-[10px] font-black text-gray-300 leading-none">{isKn ? 'ಸಾಲ' : 'CREDIT'}</p>
                          </div>
                        )}
                      </div>
                   </div>
                 );
               })
             )}
          </div>
        )}

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
           <div className="px-6 space-y-6 pb-32">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-8">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4">Permanent Address</p>
                    <div className="bg-gray-50 p-6 rounded-[28px] flex items-start gap-4">
                       <MapPin size={20} className="text-[#1E40AF] mt-1 shrink-0" />
                       <p className="font-bold text-gray-800 leading-relaxed">
                          {customer.address || "No address provided"}
                       </p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4">Account Metadata</p>
                    <div className="bg-gray-50 p-6 rounded-[28px] space-y-3">
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-bold">{isKn ? 'ಪಾವತಿ ದಿನಾಂಕ' : 'Payment Due Date'}</span>
                          <span className={`${customer.dueDate ? 'text-[#006B4D]' : 'text-gray-400'} font-black`}>
                             {customer.dueDate ? (customer.dueDate.toDate ? customer.dueDate.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : customer.dueDate) : (isKn ? 'ನಿಗದಿಪಡಿಸಿಲ್ಲ' : 'Not Set')}
                          </span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-bold">Created On</span>
                          <span className="text-gray-700 font-black">{customer.createdAt?.toDate().toLocaleDateString() || 'N/A'}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-bold">Customer ID</span>
                          <span className="text-gray-700 font-mono text-[10px]">{customer.id}</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* Notes Tab Content */}
        {activeTab === 'notes' && (
           <div className="px-6 space-y-6 pb-32">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                       <Pencil size={20} />
                    </div>
                    <h4 className="text-lg font-black text-gray-900">Merchant Notes</h4>
                 </div>
                 <div className="bg-orange-50/50 p-6 rounded-[28px] border border-orange-100">
                    <p className="text-gray-700 font-bold leading-relaxed whitespace-pre-wrap">
                       {customer.notes || "No additional notes for this customer yet. Use the Edit profile to add notes about trust, credit limits, or typical purchase behavior."}
                    </p>
                 </div>
              </div>
           </div>
        )}
      </div>

      <AnimatePresence>
        {isAddTxOpen && (
          <AddTransactionModal 
            user={user} 
            customers={[customer]}
            type={isAddTxOpen.type} 
            onClose={() => setIsAddTxOpen(null)} 
            merchant={merchant}
          />
        )}
        {isReminderOpen && (
          <SendReminderModal 
            customer={customer} 
            merchant={merchant}
            onSend={handleSendReminder}
            onClose={() => setIsReminderOpen(null)} 
          />
        )}
        {isEditOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${darkMode ? 'bg-[#1E293B]' : 'bg-white'}`}
            >
              <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-inherit sticky top-0 z-10 text-gray-900 dark:text-white">
                <h3 className="text-xl font-black">{isKn ? 'ಗ್ರಾಹಕರ ಮಾಹಿತಿ ತಿದ್ದುಪಡಿ' : 'Edit Customer Information'}</h3>
                <button onClick={() => setIsEditOpen(false)} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-gray-400">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6 overflow-y-auto no-scrollbar">
                <div className="space-y-4 text-left">
                  {[
                    { label: isKn ? 'ಹೆಸರು' : 'Name', icon: User, value: editName, setter: setEditName },
                    { label: isKn ? 'ಮೊಬೈಲ್' : 'Phone', icon: Phone, value: editPhone, setter: setEditPhone },
                    { label: isKn ? 'ವಿಳಾಸ' : 'Address', icon: MapPin, value: editAddress, setter: setEditAddress },
                    { label: isKn ? 'ಪಾವತಿ ದಿನಾಂಕ' : 'Payment Due Date', icon: Calendar, value: editDueDate, setter: setEditDueDate, type: 'date' }
                  ].map((field, idx) => (
                    <div key={idx} className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">{field.label}</label>
                      <div className="relative text-gray-900 dark:text-white">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400">
                          <field.icon size={20} />
                        </div>
                        <input 
                          type={field.type || 'text'}
                          value={field.value}
                          onChange={(e) => field.setter(e.target.value)}
                          className={`w-full bg-[#f8fafc] dark:bg-gray-800/50 border-2 border-transparent focus:border-[#006B4D] rounded-[24px] py-5 pl-16 pr-6 font-bold focus:ring-0 outline-none transition-all placeholder:text-gray-300 dark:text-white`}
                        />
                      </div>
                    </div>
                  ))}
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">{isKn ? 'ಟಿಪ್ಪಣಿಗಳು' : 'Merchant Notes'}</label>
                    <textarea 
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={4}
                      className={`w-full bg-[#f8fafc] dark:bg-gray-800/50 border-2 border-transparent focus:border-[#006B4D] rounded-[24px] py-5 px-8 text-gray-800 dark:text-white font-bold focus:ring-0 outline-none transition-all resize-none placeholder:text-gray-300`}
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-8 bg-gray-50 dark:bg-gray-800/50 flex gap-4 mt-auto">
                <button 
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 py-5 rounded-[24px] font-black text-gray-500 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700"
                >
                  {isKn ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                </button>
                <button 
                  onClick={handleSaveCustomer}
                  disabled={isSaving}
                  className="flex-1 py-5 rounded-[24px] font-black text-white bg-[#006B4D] shadow-lg shadow-[#006B4D]/20 disabled:opacity-50"
                >
                  {isSaving ? (isKn ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'Saving...') : (isKn ? 'ಬದಲಾವಣೆ ಉಳಿಸಿ' : 'Save Changes')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {isDeleteConfirmOpen && (
          <DeleteConfirmationModal 
            name={customer.name}
            isKn={isKn}
            darkMode={darkMode}
            onConfirm={handleDeleteCustomer}
            onCancel={() => setIsDeleteConfirmOpen(false)}
            isLoading={isSaving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Send Reminder Modal
 */
function SendReminderModal({ customer, merchant, onSend, onClose }: { customer: CustomerData, merchant: MerchantData, onSend: (m: 'whatsapp' | 'share' | 'sms') => void, onClose: () => void }) {
  const message = `Hello ${customer.name}, this is a reminder from ${merchant.shopName} regarding your pending balance of ₹${customer.pendingAmount.toLocaleString()}. Please settle the dues at your earliest convenience. Thank you!`;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }}
        className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                 <Send size={24} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Send Reminder</h3>
           </div>
           <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
              <X size={20} />
           </button>
        </div>

        <div className="bg-gray-50 rounded-[32px] p-6 mb-8 border border-gray-100">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Message Preview</p>
           <div className="bg-white p-5 rounded-2xl border border-gray-100 italic text-gray-600 leading-relaxed text-sm">
              "{message}"
           </div>
        </div>

        <div className="space-y-4">
           <button 
             onClick={() => onSend('whatsapp')}
             className="w-full bg-[#10B981] text-white py-6 rounded-[32px] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-[#10B981]/20 active:scale-95 transition-all"
           >
              <Smartphone size={24} />
              <span>Send via WhatsApp</span>
           </button>
           <button 
             onClick={() => onSend('sms')}
             className="w-full bg-[#3B82F6] text-white py-6 rounded-[32px] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-[#3B82F6]/20 active:scale-95 transition-all"
           >
              <MessageSquare size={24} />
              <span>Send via SMS</span>
           </button>
           <button 
             onClick={() => onSend('share')}
             className="w-full bg-gray-100 text-gray-800 py-6 rounded-[32px] font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
           >
              <ArrowUpRight size={22} />
              <span>Other Share Options</span>
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Customers Screen
 */
function CustomersScreen({ user, customers, merchant }: { user: FirebaseUser, customers: CustomerData[], merchant: MerchantData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'amount_desc' | 'recent'>('amount_desc');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);

  // Sync selected customer if it was updated in parent
  const activeCustomer = useMemo(() => {
    if (!selectedCustomer) return null;
    return customers.find(c => c.id === selectedCustomer.id) || selectedCustomer;
  }, [customers, selectedCustomer]);

  // Filter & Sort Logic
  const filteredCustomers = useMemo(() => {
    let result = customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.phone.includes(searchQuery);
      
      const matchesFilter = 
        activeFilter === 'all' ? true :
        activeFilter === 'due' ? c.pendingAmount > 0 :
        activeFilter === 'advance' ? c.pendingAmount < 0 :
        activeFilter === 'settled' ? c.pendingAmount === 0 :
        activeFilter === 'upcoming' ? (() => {
          if (!c.dueDate || c.pendingAmount <= 0) return false;
          const due = c.dueDate.toDate ? c.dueDate.toDate() : new Date(c.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const next7Days = new Date();
          next7Days.setDate(today.getDate() + 7);
          next7Days.setHours(23, 59, 59, 999);
          return due >= today && due <= next7Days;
        })() : true;

      return matchesSearch && matchesFilter;
    });

    // Apply Sorting
    return result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'amount_desc') return Math.abs(b.pendingAmount) - Math.abs(a.pendingAmount);
      if (sortBy === 'recent') return (b.createdAt?.toDate().getTime() || 0) - (a.createdAt?.toDate().getTime() || 0);
      return 0;
    });
  }, [customers, searchQuery, activeFilter, sortBy]);

  const lang = merchant.preferences?.language || 'en';
  const isKn = lang === 'kn';
  const darkMode = merchant.preferences?.darkMode || false;

  if (activeCustomer) {
    return <CustomerDetailScreen user={user} customer={activeCustomer} merchant={merchant} onBack={() => setSelectedCustomer(null)} />;
  }

  return (
    <div className={`min-h-screen pb-40 transition-colors duration-300 ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#F8FAFC]'}`}>
      {/* Header & Search - Matching Image */}
      <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} px-6 pt-10 pb-6 sticky top-0 z-40 border-b`}>
        <div className="relative mb-6">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          <input 
            type="text"
            placeholder={isKn ? 'ಗ್ರಾಹಕರನ್ನು ಹುಡುಕಿ...' : 'Search customers...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border-none rounded-[24px] py-5 pl-14 pr-12 placeholder:text-gray-300 font-semibold focus:ring-2 focus:ring-[#006B4D] outline-hidden ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#f1f5f9] text-gray-800'}`}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">✕</button>
          )}
        </div>

        {/* Filter Chips - Matching Image */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex gap-3 overflow-x-auto pb-1 no-scrollbar translate-y-2">
            {[
              { id: 'all', label: isKn ? 'ಎಲ್ಲಾ' : 'All' },
              { id: 'due', label: isKn ? 'ಬಾಕಿ' : 'Due' },
              { id: 'upcoming', label: isKn ? 'ಮುಂಬರುವ ಬಾಕಿ' : 'Upcoming' },
              { id: 'advance', label: isKn ? 'ಮುಂಗಡ' : 'Advance' },
              { id: 'settled', label: isKn ? 'ಪಾವತಿಸಿದವರು' : 'Settled' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`whitespace-nowrap px-6 py-4 rounded-[20px] font-black text-[13px] transition-all border ${
                  activeFilter === filter.id 
                    ? 'bg-[#006B4D] text-white border-[#006B4D] shadow-lg shadow-[#006B4D]/20' 
                    : (darkMode ? 'bg-[#334155] text-gray-300 border-gray-700' : 'bg-white text-gray-600 border-gray-100')
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="shrink-0 translate-y-2">
             <select 
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value as any)}
               className={`px-4 py-4 rounded-[20px] font-black text-[11px] border h-full outline-hidden appearance-none cursor-pointer ${
                 darkMode ? 'bg-[#334155] text-gray-300 border-gray-700' : 'bg-white text-gray-600 border-gray-100'
               }`}
             >
                <option value="amount_desc">{isKn ? 'ಹೆಚ್ಚಿನ ಬಾಕಿ' : 'High Balance'}</option>
                <option value="name">{isKn ? 'ಹೆಸರು' : 'Name'}</option>
                <option value="recent">{isKn ? 'ಇತ್ತೀಚಿನ' : 'Recent'}</option>
             </select>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className={`px-6 pt-8 ${merchant.preferences?.compactMode ? 'space-y-3' : 'space-y-6 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-y-0'}`}>
        {filteredCustomers.length === 0 ? (
          <div className="py-20 text-center">
            <Users size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-black tracking-widest uppercase text-xs">{isKn ? 'ಯಾವುದೇ ರೆಕಾರ್ಡ್ ಇಲ್ಲ' : 'No Records Found'}</p>
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <div key={customer.id}>
              <CustomerCard 
                customer={customer} 
                onClick={() => setSelectedCustomer(customer)}
                compact={merchant.preferences?.compactMode}
                showCurrency={merchant.preferences?.showCurrency}
              />
            </div>
          ))
        )}
      </div>

      {/* Add New Customer Inline - Matching Image Section */}
      <div className="mt-16 px-6">
         <div className={`h-px mb-12 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
         <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} rounded-[40px] p-8 shadow-sm border`}>
            <div className="flex items-center gap-3 mb-10">
               <div className="w-10 h-10 bg-[#BBF7D0]/30 rounded-xl flex items-center justify-center text-[#006B4D]">
                  <Plus size={24} strokeWidth={3} />
               </div>
               <h3 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                 {isKn ? 'ಹೊಸ ಗ್ರಾಹಕರನ್ನು ಸೇರಿಸಿ' : 'Add New Customer'}
               </h3>
            </div>
            <InlineAddCustomerForm user={user} merchant={merchant} />
         </div>
      </div>
    </div>
  );
}

/**
 * Suppliers Screen
 */
function SuppliersScreen({ user, suppliers, merchant }: { user: FirebaseUser, suppliers: SupplierData[], merchant: MerchantData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'amount_desc' | 'recent'>('amount_desc');
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierData | null>(null);

  const activeSupplier = useMemo(() => {
    if (!selectedSupplier) return null;
    return suppliers.find(s => s.id === selectedSupplier.id) || selectedSupplier;
  }, [suppliers, selectedSupplier]);

  // Filter & Sort Logic
  const filteredSuppliers = useMemo(() => {
    let result = suppliers.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.phone.includes(searchQuery);
      
      const matchesFilter = 
        activeFilter === 'all' ? true :
        activeFilter === 'due' ? s.pendingAmount > 0 :
        activeFilter === 'advance' ? s.pendingAmount < 0 :
        activeFilter === 'settled' ? s.pendingAmount === 0 : true;

      return matchesSearch && matchesFilter;
    });

    // Apply Sorting
    return result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'amount_desc') return Math.abs(b.pendingAmount) - Math.abs(a.pendingAmount);
      if (sortBy === 'recent') return (b.createdAt?.toDate().getTime() || 0) - (a.createdAt?.toDate().getTime() || 0);
      return 0;
    });
  }, [suppliers, searchQuery, activeFilter, sortBy]);

  const lang = merchant.preferences?.language || 'en';
  const isKn = lang === 'kn';
  const darkMode = merchant.preferences?.darkMode || false;

  if (activeSupplier) {
    return <SupplierDetailScreen user={user} supplier={activeSupplier} merchant={merchant} onBack={() => setSelectedSupplier(null)} />;
  }

  return (
    <div className={`min-h-screen pb-40 transition-colors duration-300 ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#F8FAFC]'}`}>
      <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} px-6 pt-10 pb-6 sticky top-0 z-40 border-b`}>
        <div className="relative mb-6">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          <input 
            type="text"
            placeholder={isKn ? 'ಸರಬರಾಜುದಾರರನ್ನು ಹುಡುಕಿ...' : 'Search suppliers...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border-none rounded-[24px] py-5 pl-14 pr-12 placeholder:text-gray-300 font-semibold focus:ring-2 focus:ring-[#006B4D] outline-hidden ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#f1f5f9] text-gray-800'}`}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 flex gap-3 overflow-x-auto pb-1 no-scrollbar translate-y-2">
            {[
              { id: 'all', label: isKn ? 'ಎಲ್ಲಾ' : 'All' },
              { id: 'due', label: isKn ? 'ಬಾಕಿ' : 'Due' },
              { id: 'advance', label: isKn ? 'ಮುಂಗಡ' : 'Advance' },
              { id: 'settled', label: isKn ? 'ಸೆಟಲ್' : 'Settled' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`whitespace-nowrap px-6 py-4 rounded-[20px] font-black text-[13px] transition-all border ${
                  activeFilter === filter.id 
                    ? 'bg-[#006B4D] text-white border-[#006B4D] shadow-lg shadow-[#006B4D]/20' 
                    : (darkMode ? 'bg-[#334155] text-gray-300 border-gray-700' : 'bg-white text-gray-600 border-gray-100')
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="shrink-0 translate-y-2">
             <select 
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value as any)}
               className={`px-4 py-4 rounded-[20px] font-black text-[11px] border h-full outline-hidden appearance-none cursor-pointer ${
                 darkMode ? 'bg-[#334155] text-gray-300 border-gray-700' : 'bg-white text-gray-600 border-gray-100'
               }`}
             >
                <option value="amount_desc">{isKn ? 'ಹೆಚ್ಚಿನ ಬಾಕಿ' : 'High Balance'}</option>
                <option value="name">{isKn ? 'ಹೆಸರು' : 'Name'}</option>
                <option value="recent">{isKn ? 'ಇತ್ತೀಚಿನ' : 'Recent'}</option>
             </select>
          </div>
        </div>
      </div>

      <div className={`px-6 pt-8 ${merchant.preferences?.compactMode ? 'space-y-3' : 'space-y-6 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-y-0'}`}>
        {filteredSuppliers.length === 0 ? (
          <div className="py-20 text-center">
            <Truck size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-black tracking-widest uppercase text-xs">{isKn ? 'ಯಾವುದೇ ಸರಬರಾಜುದಾರರಿಲ್ಲ' : 'No Suppliers Found'}</p>
          </div>
        ) : (
          filteredSuppliers.map(supplier => (
            <div key={supplier.id}>
              <SupplierCard 
                supplier={supplier} 
                onClick={() => setSelectedSupplier(supplier)}
                compact={merchant.preferences?.compactMode}
                showCurrency={merchant.preferences?.showCurrency}
              />
            </div>
          ))
        )}
      </div>

      <div className="mt-16 px-6">
         <div className={`h-px mb-12 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
         <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} rounded-[40px] p-8 shadow-sm border`}>
            <div className="flex items-center gap-3 mb-10">
               <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
                  <Plus size={24} strokeWidth={3} />
               </div>
               <h3 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                 {isKn ? 'ಹೊಸ ಸರಬರಾಜುದಾರರನ್ನು ಸೇರಿಸಿ' : 'Add New Supplier'}
               </h3>
            </div>
            <InlineAddSupplierForm user={user} merchant={merchant} />
         </div>
      </div>
    </div>
  );
}

function SupplierDetailScreen({ user, supplier, merchant, onBack }: { user: FirebaseUser, supplier: SupplierData, merchant: MerchantData, onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'history' | 'profile' | 'notes'>('history');
  const [transactions, setTransactions] = useState<SupplierTransactionData[]>([]);
  const [isAddTxOpen, setIsAddTxOpen] = useState<{ type: 'purchase' | 'payment' } | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const path = `merchants/${user.uid}/supplierTransactions`;
    const q = query(collection(db, path), where('supplierId', '==', supplier.id), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplierTransactionData)));
    }, (error) => handleFirestoreError(error, OperationType.GET, path));
    return unsub;
  }, [user.uid, supplier.id]);

  const lang = merchant.preferences?.language || 'en';
  const isKn = lang === 'kn';
  const darkMode = merchant.preferences?.darkMode || false;

  const handleDeleteSupplier = async () => {
    setIsSaving(true);
    const path = `merchants/${user.uid}/suppliers/${supplier.id}`;
    try {
      const txPath = `merchants/${user.uid}/supplierTransactions`;
      const txQuery = query(collection(db, txPath), where('supplierId', '==', supplier.id));
      const txSnapshot = await getDocs(txQuery);
      const deleteTxPromises = txSnapshot.docs.map(d => deleteDoc(doc(db, txPath, d.id)));
      await Promise.all(deleteTxPromises);

      await deleteDoc(doc(db, path));
      onBack();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`lg:flex-1 lg:min-h-screen text-gray-900 transition-colors duration-300 ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#F8FAFC]'}`}>
      <header className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} px-6 py-6 sticky top-0 z-50 flex items-center gap-4 border-b`}>
        <button onClick={onBack} className={`p-3 rounded-full active:scale-90 transition-transform ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50'} lg:hidden`}>
          <ChevronRight size={24} className="rotate-180" />
        </button>
        <div className="hidden lg:block">
           <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-[#006B4D] transition-colors font-bold pr-4">
              <ChevronRight className="rotate-180" size={18} />
              <span>{isKn ? 'ಹಿಂದೆ' : 'Back'}</span>
           </button>
        </div>
        <div className="flex items-center gap-4">
          <SupplierAvatar supplier={supplier} size="sm" />
          <div>
            <h2 className="text-xl font-black leading-tight truncate max-w-[150px]">{supplier.name}</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isKn ? 'ಸರಬರಾಜುದಾರ' : 'Supplier Detail'}</p>
          </div>
        </div>
      </header>

      <div className="pb-40">
        <section className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} p-8 border-b`}>
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{isKn ? 'ಒಟ್ಟು ಪಾವತಿಸಬೇಕಾದ ಹಣ' : 'Total You Owe'}</p>
                 <div className="flex items-center gap-2 group">
                    <span className={`text-4xl md:text-5xl font-black ${supplier.pendingAmount > 0 ? 'text-red-500' : (supplier.pendingAmount < 0 ? 'text-[#006B4D]' : 'text-gray-400')}`}>
                      ₹{Math.abs(supplier.pendingAmount).toLocaleString()}
                    </span>
                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${supplier.pendingAmount > 0 ? 'bg-red-100 text-red-700' : (supplier.pendingAmount < 0 ? 'bg-[#BBF7D0] text-[#006B4D]' : 'bg-gray-100 text-gray-500')}`}>
                      {supplier.pendingAmount > 0 ? 'DUE' : (supplier.pendingAmount < 0 ? 'ADVANCE' : 'SETTLED')}
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-3 self-end md:self-center">
                <button 
                  onClick={() => setIsEditOpen(true)}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-sm border ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-[#006B4D] border-gray-200'}`}
                  title="Edit Profile"
                >
                   <Edit3 size={20} className="md:size-6" />
                </button>
                
                <button 
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-sm border ${darkMode ? 'bg-red-900/30 text-red-100 border-red-800' : 'bg-red-50 text-red-600 border-red-100'}`}
                  title="Delete Supplier"
                >
                   <Trash2 size={20} className="md:size-6" />
                </button>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setIsAddTxOpen({ type: 'purchase' })}
                className="bg-red-500 text-white py-6 rounded-[32px] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-red-500/20 active:scale-95 transition-all"
              >
                 <ShoppingBag size={24} />
                 <span>{isKn ? 'ಖರೀದಿ' : 'Purchase'}</span>
              </button>
              <button 
                onClick={() => setIsAddTxOpen({ type: 'payment' })}
                className="bg-[#006B4D] text-white py-6 rounded-[32px] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-[#006B4D]/20 active:scale-95 transition-all"
              >
                 <Banknote size={24} />
                 <span>{isKn ? 'ಪಾವತಿ' : 'Payment'}</span>
              </button>
           </div>
        </section>

        <nav className="flex px-6 pt-8 pb-4 border-b border-gray-100 dark:border-gray-800 sticky top-[89px] bg-inherit z-40">
           {[
             { id: 'history', label: isKn ? 'ಇತಿಹಾಸ' : 'History', icon: History },
             { id: 'profile', label: isKn ? 'ವಿವರ' : 'Profile', icon: User },
             { id: 'notes', label: isKn ? 'ಟಿಪ್ಪಣಿ' : 'Notes', icon: Pencil }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex-1 flex flex-col items-center gap-2 py-2 transition-all relative ${activeTab === tab.id ? 'text-[#006B4D]' : 'text-gray-400'}`}
             >
                <tab.icon size={20} className={activeTab === tab.id ? 'animate-bounce-subtle' : ''} />
                <span className="text-[10px] font-black tracking-widest uppercase">{tab.label}</span>
                {activeTab === tab.id && <motion.div layoutId="detailTab" className="absolute bottom-0 w-8 h-1 bg-[#006B4D] rounded-full" />}
             </button>
           ))}
        </nav>

        {activeTab === 'history' && (
           <div className="px-6 py-8 space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
              {transactions.length === 0 ? (
                 <div className="py-20 text-center bg-white dark:bg-[#1E293B] rounded-[40px] border border-gray-50 dark:border-gray-800">
                    <History size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-black tracking-widest uppercase text-[10px]">{isKn ? 'ಇನ್ನೂ ಯಾವುದೇ ವಹಿವಾಟಿಲ್ಲ' : 'No history yet'}</p>
                 </div>
              ) : (
                 transactions.map((tx, idx) => (
                    <div key={tx.id} className="relative pl-8">
                       {idx !== transactions.length - 1 && <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-gray-100 dark:bg-gray-800" />}
                       <div className="absolute left-0 top-1 w-8 h-8 rounded-full border-4 border-white dark:border-[#0F172A] bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-10">
                          <div className={`w-2 h-2 rounded-full ${tx.type === 'purchase' ? 'bg-red-500' : 'bg-[#006B4D]'}`} />
                       </div>
                       <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-50'} p-6 rounded-[32px] border shadow-xs`}>
                          <div className="flex items-center justify-between mb-4">
                             <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                   <span className={`text-[9px] font-black uppercase tracking-widest ${tx.type === 'purchase' ? 'text-red-500' : 'text-[#006B4D]'}`}>
                                      {tx.type === 'purchase' ? (isKn ? 'ಖರೀದಿ' : 'Purchase') : (isKn ? 'ಪಾವತಿ' : 'Payment')}
                                   </span>
                                   {tx.type === 'payment' && tx.paymentMode && (
                                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                                         {tx.paymentMode}
                                      </span>
                                   )}
                                </div>
                                <span className="text-[11px] font-bold text-gray-400">
                                   {tx.date?.toDate() ? format(tx.date.toDate(), 'dd MMM, hh:mm a') : 'Processing...'}
                                </span>
                             </div>
                             <div className={`text-xl font-black ${tx.type === 'purchase' ? 'text-red-600' : 'text-[#006B4D]'}`}>
                                {tx.type === 'purchase' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                             </div>
                          </div>
                          {tx.note && (
                             <div className={`px-4 py-3 rounded-2xl text-xs font-bold ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                {tx.note}
                             </div>
                          )}
                       </div>
                    </div>
                 ))
              )}
           </div>
        )}

        {activeTab === 'profile' && (
           <div className="px-6 space-y-6 py-8">
              <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} p-8 rounded-[40px] shadow-sm border`}>
                 <h4 className="text-lg font-black text-gray-900 dark:text-white mb-6">Supplier Contact</h4>
                 <div className="space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                          <Phone size={20} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Number</p>
                          <p className="font-bold text-gray-900 dark:text-white leading-tight">+{supplier.phone}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                          <HomeIcon size={20} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Address / Area</p>
                          <p className="font-bold text-gray-900 dark:text-white leading-tight">{supplier.address || "No address provided"}</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'notes' && (
           <div className="px-6 space-y-6 pt-8">
              <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} p-8 rounded-[40px] shadow-sm border`}>
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                       <Pencil size={20} />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 dark:text-white">Supplier Notes</h4>
                 </div>
                 <div className="bg-orange-50/50 dark:bg-orange-900/10 p-6 rounded-[28px] border border-orange-100 dark:border-orange-900/30">
                    <p className="text-gray-700 dark:text-gray-300 font-bold leading-relaxed whitespace-pre-wrap">
                       {supplier.notes || "No additional notes for this supplier yet."}
                    </p>
                 </div>
              </div>
           </div>
        )}
      </div>

      <AnimatePresence>
        {isAddTxOpen && (
          <AddSupplierTransactionModal 
            user={user} 
            suppliers={[supplier]}
            type={isAddTxOpen.type} 
            onClose={() => setIsAddTxOpen(null)} 
            merchant={merchant}
          />
        )}
        {isDeleteConfirmOpen && (
          <DeleteConfirmationModal 
            name={supplier.name}
            isKn={isKn}
            darkMode={darkMode}
            onConfirm={handleDeleteSupplier}
            onCancel={() => setIsDeleteConfirmOpen(false)}
            isLoading={isSaving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function InlineAddSupplierForm({ user, merchant }: { user: FirebaseUser, merchant: MerchantData }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isKn = merchant.preferences?.language === 'kn';
  const darkMode = merchant.preferences?.darkMode || false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setIsLoading(true);
    const path = `merchants/${user.uid}/suppliers`;
    try {
      await addDoc(collection(db, path), {
        name,
        phone,
        address,
        notes,
        pendingAmount: 0,
        avatarSeed: Math.random().toString(36).substring(7),
        createdAt: serverTimestamp()
      });
      setName(''); setPhone(''); setAddress(''); setNotes('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div className="space-y-6">
        {[
          { label: 'NAME', icon: User, placeholder: 'Supplier Name', value: name, setter: setName },
          { label: 'MOBILE', icon: Phone, placeholder: 'Mobile Number', value: phone, setter: setPhone },
          { label: 'ADDRESS', icon: HomeIcon, placeholder: 'City / Market Area', value: address, setter: setAddress }
        ].map((field) => (
          <div key={field.label} className="space-y-2.5">
            <label className="text-[10px] font-black text-gray-300 uppercase ml-4 tracking-[0.15em]">{field.label} *</label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
                <field.icon size={20} />
              </div>
              <input 
                required={field.label !== 'ADDRESS'}
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                placeholder={field.placeholder} 
                className={`w-full border-none rounded-[24px] py-5 pl-14 pr-6 font-bold focus:ring-2 focus:ring-[#006B4D] outline-hidden placeholder:text-gray-400 ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#f1f5f9] text-gray-800'}`}
              />
            </div>
          </div>
        ))}

        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-gray-300 uppercase ml-4 tracking-[0.15em]">NOTES</label>
          <div className="relative">
            <div className="absolute left-5 top-5 text-gray-300">
              <MessageSquare size={20} />
            </div>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Supply schedule, payment terms, etc..." 
              rows={4}
              className={`w-full border-none rounded-[24px] py-5 pl-14 pr-6 font-bold focus:ring-2 focus:ring-[#006B4D] outline-hidden resize-none placeholder:text-gray-400 ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#f1f5f9] text-gray-800'}`}
            />
          </div>
        </div>
      </div>

      <button 
        disabled={isLoading}
        className="w-full bg-[#1E40AF] text-white py-6 rounded-[32px] font-black text-lg flex items-center justify-center gap-4 shadow-2xl shadow-blue-500/30 active:scale-95 transition-all mt-4 disabled:opacity-50"
      >
        <Truck size={22} className="text-white" />
        {isLoading ? (isKn ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : "Saving...") : (isKn ? 'ಸರಬರಾಜುದಾರರನ್ನು ಉಳಿಸಿ' : "Save Supplier")}
      </button>
    </form>
  );
}

function InlineAddCustomerForm({ user, merchant }: { user: FirebaseUser, merchant: MerchantData }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isKn = merchant.preferences?.language === 'kn';
  const darkMode = merchant.preferences?.darkMode || false;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800000) {
      alert(isKn ? "ಚಿತ್ರ ತುಂಬಾ ದೊಡ್ಡದಾಗಿದೆ. ದಯವಿಟ್ಟು 800KB ಗಿಂತ ಕಡಿಮೆ ಇರುವ ಚಿತ್ರವನ್ನು ಆರಿಸಿ." : "Image too large. Under 800KB please.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoURL(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setIsLoading(true);
    const path = `merchants/${user.uid}/customers`;
    try {
      await addDoc(collection(db, path), {
        name,
        phone,
        address,
        notes,
        photoURL,
        pendingAmount: 0,
        avatarSeed: Math.random().toString(36).substring(7),
        createdAt: serverTimestamp()
      });
      setName(''); setPhone(''); setAddress(''); setNotes(''); setPhotoURL('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div className="flex flex-col items-center mb-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-[#f8fafc] border-gray-200 hover:bg-gray-100'} w-24 h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center gap-2 group cursor-pointer transition-all overflow-hidden relative`}
          >
              {photoURL ? (
                <img src={photoURL} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className={`${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-white text-gray-400'} p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform`}>
                      <Smartphone size={24} />
                  </div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{isKn ? 'ಅಪ್ಲೋಡ್' : 'Upload'}</span>
                </>
              )}
          </div>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
      </div>

      <div className="space-y-6">
        {[
          { label: 'NAME', icon: User, placeholder: 'Customer Name', value: name, setter: setName },
          { label: 'MOBILE', icon: Phone, placeholder: 'Mobile Number', value: phone, setter: setPhone },
          { label: 'ADDRESS', icon: HomeIcon, placeholder: 'Village / Area', value: address, setter: setAddress }
        ].map((field) => (
          <div key={field.label} className="space-y-2.5">
            <label className="text-[10px] font-black text-gray-300 uppercase ml-4 tracking-[0.15em]">{field.label} *</label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
                <field.icon size={20} />
              </div>
              <input 
                required={field.label !== 'ADDRESS'}
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                placeholder={field.placeholder} 
                className={`w-full border-none rounded-[24px] py-5 pl-14 pr-6 font-bold focus:ring-2 focus:ring-[#006B4D] outline-hidden placeholder:text-gray-400 ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#f1f5f9] text-gray-800'}`}
              />
            </div>
          </div>
        ))}

        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-gray-300 uppercase ml-4 tracking-[0.15em]">NOTES</label>
          <div className="relative">
            <div className="absolute left-5 top-5 text-gray-300">
              <MessageSquare size={20} />
            </div>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or references..." 
              rows={4}
              className={`w-full border-none rounded-[24px] py-5 pl-14 pr-6 font-bold focus:ring-2 focus:ring-[#006B4D] outline-hidden resize-none placeholder:text-gray-400 ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#f1f5f9] text-gray-800'}`}
            />
          </div>
        </div>
      </div>

      <button 
        disabled={isLoading}
        className="w-full bg-[#006B4D] text-white py-6 rounded-[32px] font-black text-lg flex items-center justify-center gap-4 shadow-2xl shadow-[#006B4D]/30 active:scale-95 transition-all mt-4 disabled:opacity-50"
      >
        <Store size={22} className="text-white" />
        {isLoading ? (isKn ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : "Saving...") : (isKn ? 'ಗ್ರಾಹಕರನ್ನು ಉಳಿಸಿ' : "Save Customer")}
      </button>
    </form>
  );
}

function CustomerCard({ customer, compact, showCurrency = true, onClick }: { customer: CustomerData, compact?: boolean, showCurrency?: boolean, onClick?: () => void }) {
  const statusConfig = useMemo(() => {
    if (customer.pendingAmount > 0) return { label: 'TO COLLECT', bg: 'bg-[#BBF7D0]', text: 'text-[#006B4D]' };
    if (customer.pendingAmount < 0) return { label: 'TO PAY', bg: 'bg-red-100', text: 'text-red-700' };
    return { label: 'SETTLED', bg: 'bg-gray-100', text: 'text-gray-500' };
  }, [customer.pendingAmount]);

  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-[#1E293B] rounded-[40px] shadow-sm border border-gray-50 dark:border-gray-800 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer group ${compact ? 'p-4' : 'p-6'}`}
    >
      <div className="flex items-center gap-5">
        <CustomerAvatar customer={customer} size={compact ? 'sm' : 'md'} />
        <div>
          <h3 className={`font-black tracking-tight leading-tight mb-1 ${compact ? 'text-sm' : 'text-[17px]'} ${compact ? 'text-gray-800 dark:text-gray-100' : 'text-gray-900 dark:text-white'}`}>{customer.name}</h3>
          {!compact && (
            <p className="text-[13px] text-gray-400 font-black tracking-tight">
              +{customer.phone.substring(0, 3)} {customer.phone.substring(3, 8)} {customer.phone.substring(8)}
            </p>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className={`flex items-center justify-end gap-1 mb-2 font-black ${customer.pendingAmount > 0 ? 'text-[#006B4D] dark:text-[#10B981]' : (customer.pendingAmount < 0 ? 'text-red-600' : 'text-gray-400')} ${compact ? 'text-base' : 'text-[22px]'}`}>
           {showCurrency && <span className="text-sm font-bold opacity-60">₹</span>}
           <span>{Math.abs(customer.pendingAmount).toLocaleString()}</span>
        </div>
        {!compact && (
          <span className={`text-[9px] font-black px-4 py-2 rounded-full tracking-[0.1em] ${statusConfig.bg} ${statusConfig.text}`}>
            {statusConfig.label}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Dashboard Screen
 */
function VerifyEmailBanner({ user }: { user: FirebaseUser }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendVerification = async () => {
    setSending(true);
    setError(null);
    try {
      await sendEmailVerification(user);
      setSent(true);
    } catch (err: any) {
      console.error(err);
      setError(err.code === 'auth/too-many-requests' ? "Too many requests. Please wait a moment." : (err.message || "Failed to send verification email"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3 text-amber-800">
        <AlertTriangle size={18} className="shrink-0" />
        <p className="text-xs font-bold uppercase tracking-wider leading-relaxed">Email verification required to manage your account and transactions.</p>
      </div>
      {sent ? (
        <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
          <MailCheck size={16} />
          <p className="text-[10px] font-black uppercase tracking-widest">Verification email sent! Check your inbox.</p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {error && <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{error}</p>}
          <button 
            onClick={handleSendVerification}
            disabled={sending}
            className="bg-amber-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-amber-900/20 hover:bg-amber-700 active:scale-95 transition-all flex items-center gap-3"
          >
            {sending ? 'Sending...' : 'Send Verification Email'}
            {!sending && <Send size={14} />}
          </button>
        </div>
      )}
    </div>
  );
}

function DashboardScreen({ user, merchant }: { user: FirebaseUser, merchant: MerchantData }) {
  const isVerified = user.emailVerified || (user.providerData.some(p => p.providerId === 'google.com'));
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [allTransactions, setAllTransactions] = useState<TransactionData[]>([]);
  
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [supplierTransactions, setSupplierTransactions] = useState<SupplierTransactionData[]>([]);
  const [allSupplierTransactions, setAllSupplierTransactions] = useState<SupplierTransactionData[]>([]);

  const [activeTab, setActiveTab] = useState<'home' | 'customers' | 'suppliers' | 'reports' | 'ai' | 'settings'>('home');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReminders, setShowReminders] = useState(false);

  useEffect(() => {
    // Listen to customers
    const customersPath = `merchants/${user.uid}/customers`;
    const qCustomers = collection(db, customersPath);
    const unsubCustomers = onSnapshot(qCustomers, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomerData));
      setCustomers(data);
    }, (error) => {
      if (error.code === 'permission-denied' && !isVerified) {
        console.warn("Permission denied for customers - user not verified");
      } else {
        handleFirestoreError(error, OperationType.GET, customersPath);
      }
    });

    // Listen to suppliers
    const suppliersPath = `merchants/${user.uid}/suppliers`;
    const qSuppliers = collection(db, suppliersPath);
    const unsubSuppliers = onSnapshot(qSuppliers, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplierData));
      setSuppliers(data);
    }, (error) => {
      if (error.code === 'permission-denied' && !isVerified) {
        console.warn("Permission denied for suppliers - user not verified");
      } else {
        handleFirestoreError(error, OperationType.GET, suppliersPath);
      }
    });

    // Listen to all transactions for reports
    const allTransactionsPath = `merchants/${user.uid}/transactions`;
    const unsubAllTransactions = onSnapshot(collection(db, allTransactionsPath), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TransactionData));
      setAllTransactions(data);
    }, (error) => {
      if (error.code === 'permission-denied' && !isVerified) {
        console.warn("Permission denied for allTransactions - user not verified");
      } else {
        handleFirestoreError(error, OperationType.GET, allTransactionsPath);
      }
    });

    // Listen to all supplier transactions
    const allSupplierTransactionsPath = `merchants/${user.uid}/supplierTransactions`;
    const unsubAllSupplierTransactions = onSnapshot(collection(db, allSupplierTransactionsPath), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplierTransactionData));
      setAllSupplierTransactions(data);
    }, (error) => {
      if (error.code === 'permission-denied' && !isVerified) {
        console.warn("Permission denied for allSupplierTransactions - user not verified");
      } else {
        handleFirestoreError(error, OperationType.GET, allSupplierTransactionsPath);
      }
    });

    // Listen to today's transactions for the home screen
    const transactionsPath = `merchants/${user.uid}/transactions`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const qTransactions = query(
      collection(db, transactionsPath),
      where('date', '>=', Timestamp.fromDate(today))
    );
    const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TransactionData));
      setTransactions(data);
    }, (error) => {
      if (error.code === 'permission-denied' && !isVerified) {
        console.warn("Permission denied for today's transactions - user not verified");
      } else {
        handleFirestoreError(error, OperationType.GET, transactionsPath);
      }
    });

    // Listen to today's supplier transactions
    const supplierTransactionsPath = `merchants/${user.uid}/supplierTransactions`;
    const qSupplierTransactions = query(
      collection(db, supplierTransactionsPath),
      where('date', '>=', Timestamp.fromDate(today))
    );
    const unsubSupplierTransactions = onSnapshot(qSupplierTransactions, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplierTransactionData));
      setSupplierTransactions(data);
    }, (error) => {
      if (error.code === 'permission-denied' && !isVerified) {
        console.warn("Permission denied for today's supplier transactions - user not verified");
      } else {
        handleFirestoreError(error, OperationType.GET, supplierTransactionsPath);
      }
    });

    return () => {
      unsubCustomers();
      unsubSuppliers();
      unsubAllTransactions();
      unsubAllSupplierTransactions();
      unsubTransactions();
      unsubSupplierTransactions();
    };
  }, [user.uid]);

  const stats = useMemo(() => {
    const todayCollection = transactions
      .filter(t => t.type === 'payment')
      .reduce((acc, t) => acc + t.amount, 0);

    const todayPurchases = supplierTransactions
      .filter(t => t.type === 'purchase')
      .reduce((acc, t) => acc + t.amount, 0);
    
    const customersToday = new Set(transactions.map(t => t.customerId)).size;
    
    const totalPending = customers.reduce((acc, c) => acc + c.pendingAmount, 0);
    const totalSupplierDebt = suppliers.reduce((acc, s) => acc + s.pendingAmount, 0);
    
    return {
      todayCollection,
      todayPurchases,
      customersToday,
      totalPending,
      totalSupplierDebt,
      totalCustomers: customers.length,
      totalSuppliers: suppliers.length
    };
  }, [transactions, customers, suppliers, supplierTransactions]);

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState<{ type: 'credit' | 'payment' } | null>(null);
  const [isAddSupplierTransactionOpen, setIsAddSupplierTransactionOpen] = useState<{ type: 'purchase' | 'payment' } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkUnread = () => {
      const stored = localStorage.getItem('khata_notification_history');
      if (stored) {
        const history = JSON.parse(stored);
        setUnreadCount(history.filter((n: any) => !n.read).length);
      }
    };
    checkUnread();
    window.addEventListener('khata_notifications_updated', checkUnread);
    return () => window.removeEventListener('khata_notifications_updated', checkUnread);
  }, []);

  if (showNotifications) {
    return <NotificationsView onBack={() => setShowNotifications(false)} merchant={merchant} />;
  }

  if (showReminders) {
    return <RemindersScreen customers={customers} merchant={merchant} transactions={allTransactions} onBack={() => setShowReminders(false)} />;
  }

  const lang = merchant.preferences?.language || 'en';
  const isKn = lang === 'kn';
  const darkMode = merchant.preferences?.darkMode || false;

  return (
    <div className={`min-h-screen pb-24 font-sans transition-colors duration-300 ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#F8FAFC]'}`}>
      {!isVerified && <VerifyEmailBanner user={user} />}
      {/* Main Layout Container */}
      <div className="lg:flex lg:gap-0 min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-white dark:bg-[#1E293B] border-r border-gray-100 dark:border-gray-800 p-8 z-[60]">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center relative shadow-sm border border-emerald-100/50">
              <Store size={26} className="text-[#006B4D]" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-[#006B4D] rounded-lg flex items-center justify-center border-2 border-white dark:border-gray-900">
                <span className="text-[12px] font-black text-white">₹</span>
              </div>
            </div>
            <h2 className="text-2xl font-black tracking-tight leading-none">
              <span className="text-[#006B4D]">Grama</span>
              <span className={`${darkMode ? 'text-white' : 'text-gray-900'} ml-1`}>Khata</span>
            </h2>
          </div>

          <div className="space-y-2 flex-1">
            {[
              { id: 'home', label: isKn ? 'ಹೋಮ್' : 'Home', icon: HomeIcon },
              { id: 'customers', label: isKn ? 'ಗ್ರಾಹಕರು' : 'Customers', icon: Users },
              { id: 'ai', label: isKn ? 'AI' : 'Grama AI', icon: Sparkles },
              { id: 'suppliers', label: isKn ? 'ಸರಬರಾಜುದಾರರು' : 'Suppliers', icon: Truck },
              { id: 'reports', label: isKn ? 'ವರದಿಗಳು' : 'Reports', icon: BarChart3 },
              { id: 'settings', label: isKn ? 'ಸೆಟ್ಟಿಂಗ್ಸ್' : 'Settings', icon: SettingsIcon },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-[24px] transition-all group ${
                  activeTab === item.id 
                    ? 'bg-[#006B4D] text-white shadow-xl shadow-emerald-900/20' 
                    : `${darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-[#006B4D]'}`
                }`}
              >
                <item.icon size={22} className={activeTab === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                <span className="font-bold text-[15px] tracking-tight">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-auto pt-8 border-t border-gray-100 dark:border-gray-800">
             <div className="flex items-center gap-4 px-4">
                <div className="w-12 h-12 rounded-2xl border-2 border-emerald-100 dark:border-emerald-500/20 p-0.5 overflow-hidden">
                  <img 
                    src={merchant.photoURL || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-xl" 
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-black truncate text-gray-900 dark:text-white">{merchant.shopkeeperName}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{merchant.shopName}</p>
                </div>
             </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 w-full lg:max-h-screen lg:overflow-y-auto">
          {/* Header - Mobile Only or Stats Header */}
          <header className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-200'} px-6 py-5 flex items-center justify-between sticky top-0 z-50 shadow-sm border-b lg:hidden`}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center relative shadow-sm border border-emerald-100/50">
                  <Store size={22} className="text-[#006B4D]" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-[#006B4D] rounded-md flex items-center justify-center border border-white dark:border-gray-900">
                    <span className="text-[10px] font-black text-white">₹</span>
                  </div>
                </div>
                <h2 className="text-2xl font-black tracking-tight leading-none">
                  <span className="text-[#006B4D]">Grama</span>
                  <span className={`${darkMode ? 'text-white' : 'text-gray-900'} ml-1`}>Khata</span>
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowNotifications(true)}
                className={`relative p-1 transition-transform active:scale-90 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                <Bell size={24} />
                {unreadCount > 0 && (
                  <div className="absolute top-0 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
                )}
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-11 h-11 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center p-0.5 overflow-hidden active:scale-95 transition-all`}
              >
                <img 
                  src={merchant.photoURL || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-xl" 
                />
              </button>
            </div>
          </header>

          {/* Conditional Rendering based on Tab */}
          {activeTab === 'home' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32">
              {/* Welcome Section - Matches Image */}
              <section className="px-6 py-8 flex justify-between items-center">
                <div>
                  <h1 className={`text-[28px] md:text-[42px] font-black leading-tight flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'} tracking-tight`}>
                    {isKn ? 'ನಮಸ್ಕಾರ' : 'Namaskara'} {merchant.shopkeeperName.split(' ')[0]} <span className="text-3xl md:text-5xl">👋</span>
                  </h1>
                  <div className="flex items-center gap-2 mt-1.5 pl-1">
                    <Store size={14} className="text-emerald-700" />
                    <p className="text-[11px] md:text-[13px] font-black text-gray-500 uppercase tracking-[0.2em]">{merchant.shopName}</p>
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-4">
                  <button 
                    onClick={() => setShowNotifications(true)}
                    className={`relative p-3 transition-transform active:scale-90 rounded-2xl ${darkMode ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-500 border-gray-200'} border shadow-sm`}
                  >
                    <Bell size={24} />
                    {unreadCount > 0 && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
                    )}
                  </button>
                </div>
              </section>

          {/* Summary Cards Grid */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 px-6 mb-8 space-y-8 lg:space-y-0">
            {/* Customer Summary Card - Matches Image Style */}
            <section>
              <div className="bg-[#006B4D] rounded-[48px] p-10 text-white shadow-2xl shadow-emerald-900/30 relative overflow-hidden group h-full flex flex-col justify-between">
                {/* Subtle mesh background effect */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-400/10 blur-3xl rounded-full transition-transform group-hover:translate-x-10 duration-700" />
                
                <div className="flex items-center justify-between mb-10 relative z-10">
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/80">{isKn ? 'ಇಂದಿನ ಸಂಗ್ರಹ ವಿವರ' : "Today's Collection Summary"}</span>
                  <TrendingUp size={22} className="text-white/60" />
                </div>

                <div className="flex items-baseline gap-2 mb-10 relative z-10">
                   <span className="text-4xl font-black text-white/80">₹</span>
                   <span className="text-6xl font-black tracking-tighter">{stats.todayCollection.toLocaleString()}</span>
                </div>

                <div>
                  <div className="inline-flex items-center gap-2.5 bg-white/10 px-6 py-3.5 rounded-3xl backdrop-blur-xl border border-white/10 relative z-10 shadow-lg">
                    <div className="w-6 h-6 bg-emerald-400/20 rounded-full flex items-center justify-center border border-emerald-400/20">
                      <CheckCircle2 size={14} className="text-emerald-300" strokeWidth={3} />
                    </div>
                    <span className="text-[13px] font-black tracking-tight text-white/95">
                      {isKn ? `ಇಂದು ${stats.customersToday} ಗ್ರಾಹಕರಿಂದ` : `From ${stats.customersToday} customers today`}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Supplier Summary Card */}
            <section>
              <div className="bg-[#1E40AF] rounded-[48px] p-10 text-white shadow-2xl shadow-blue-900/30 relative overflow-hidden group h-full flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700" />
                <div className="flex items-center justify-between mb-10 relative z-10">
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/80">{isKn ? 'ಇಂದಿನ ಖರೀದಿ ವಿವರ' : "Today's Purchase Summary"}</span>
                  <ShoppingBag size={22} className="text-white/60" />
                </div>
                <div className="flex items-baseline gap-2 mb-10 relative z-10">
                   <span className="text-4xl font-black text-white/80">₹</span>
                   <span className="text-6xl font-black tracking-tighter">{stats.todayPurchases.toLocaleString()}</span>
                </div>
                <div>
                  <div className="inline-flex items-center gap-2.5 bg-white/10 px-6 py-3.5 rounded-3xl backdrop-blur-xl border border-white/10 relative z-10 shadow-lg">
                    <div className="w-6 h-6 bg-blue-400/20 rounded-full flex items-center justify-center border border-blue-400/20">
                      <Truck size={14} className="text-blue-200" strokeWidth={3} />
                    </div>
                    <span className="text-[13px] font-black tracking-tight text-white/95">
                      {isKn ? `${stats.totalSuppliers} ಸರಬರಾಜುದಾರರಿಂದ` : `Total Owe: ₹${stats.totalSupplierDebt.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Stats Grid */}
          <section className="px-6 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} p-6 rounded-[32px] shadow-soft border flex flex-col justify-between h-52`}>
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                  <CreditCard size={24} />
                </div>
                <ArrowUpRight size={20} className="text-gray-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{isKn ? 'ಒಟ್ಟು ಬರಬೇಕಾದ ಹಣ' : 'Total Pending Amount'}</p>
                <h4 className={`text-xl font-extrabold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{merchant.preferences?.showCurrency !== false && '₹'}{stats.totalPending.toLocaleString()}</h4>
                <div className="flex items-center gap-1.5 mt-2 text-[#006B4D] font-bold text-[10px]">
                   <Info size={12} />
                   <span>{isKn ? 'ಸಂಗ್ರಹಿಸಲು' : 'To Collect'}</span>
                </div>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-100'} p-6 rounded-[32px] shadow-soft border flex flex-col justify-between h-52`}>
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-[#DBEAFE] text-[#1E40AF]'}`}>
                  <Users size={24} />
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{isKn ? 'ಒಟ್ಟು ಗ್ರಾಹಕರು' : 'Total Customers'}</p>
                <h4 className={`text-3xl font-extrabold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalCustomers}</h4>
                <p className="text-[10px] text-gray-500 font-medium mt-1">{isKn ? 'ಸಕ್ರಿಯ ಖಾತೆಗಳು' : 'Active accounts'}</p>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="px-6 mb-12">
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{isKn ? 'ತ್ವರಿತ ಕ್ರಮಗಳು' : 'Quick Actions'}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <button 
                onClick={() => setIsAddTransactionOpen({ type: 'payment' })}
                className="bg-[#006B4D] text-white p-6 rounded-[32px] shadow-lg flex flex-col items-center justify-center gap-3 active:scale-95 transition-all"
              >
                <div className="bg-white/20 p-2 rounded-xl">
                  <Plus size={24} />
                </div>
                <span className="font-bold">{isKn ? 'ಪಾವತಿ ಸೇರಿಸಿ' : 'Add Payment'}</span>
              </button>
              
              <button 
                onClick={() => setIsAddTransactionOpen({ type: 'credit' })}
                className={`${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-[#FEE2E2] text-[#B91C1C]'} p-6 rounded-[32px] shadow-sm flex flex-col items-center justify-center gap-3 active:scale-95 transition-all`}
              >
                <div className={`${darkMode ? 'bg-red-400/20' : 'bg-[#B91C1C]/10'} p-2 rounded-xl`}>
                  <IndianRupee size={24} />
                </div>
                <span className="font-bold">{isKn ? 'ಕ್ರೆಡಿಟ್ ಸೇರಿಸಿ' : 'Add Credit'}</span>
              </button>

              <button 
                onClick={() => setIsAddCustomerOpen(true)}
                className={`${darkMode ? 'bg-[#1E293B] text-white border-gray-800' : 'bg-white text-gray-900 border-gray-200'} p-6 rounded-[32px] border shadow-soft flex flex-col items-center justify-center gap-3 active:scale-95 transition-all`}
              >
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-2 rounded-xl`}>
                  <User size={24} className="text-[#006B4D]" />
                </div>
                <span className="font-bold">{isKn ? 'ಗ್ರಾಹಕರನ್ನು ಸೇರಿಸಿ' : 'Add Customer'}</span>
              </button>

              <button 
                onClick={() => setIsAddSupplierOpen(true)}
                className={`${darkMode ? 'bg-[#1E293B] text-white border-gray-800' : 'bg-white text-gray-900 border-gray-200'} p-6 rounded-[32px] border shadow-soft flex flex-col items-center justify-center gap-3 active:scale-95 transition-all`}
              >
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-2 rounded-xl`}>
                  <Truck size={24} className="text-[#006B4D]" />
                </div>
                <span className="font-bold">{isKn ? 'ಸರಬರಾಜುದಾರರನ್ನು ಸೇರಿಸಿ' : 'Add Supplier'}</span>
              </button>

              <button 
                onClick={() => setShowReminders(true)}
                className={`${darkMode ? 'bg-[#1E293B] text-white border-gray-800' : 'bg-white text-gray-900 border-gray-200'} p-6 rounded-[32px] border shadow-soft flex flex-col items-center justify-center gap-3 active:scale-95 transition-all`}
              >
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-2 rounded-xl`}>
                  <Bell size={24} className="text-[#B45309]" />
                </div>
                <span className="font-bold">{isKn ? 'ರಿಮೈಂಡರ್ ಕಳುಹಿಸಿ' : 'Send Reminder'}</span>
              </button>
            </div>
          </section>
        </motion.div>
      )}

      {activeTab === 'customers' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <CustomersScreen user={user} customers={customers} merchant={merchant} />
        </motion.div>
      )}

      {activeTab === 'suppliers' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <SuppliersScreen user={user} suppliers={suppliers} merchant={merchant} />
        </motion.div>
      )}

      {activeTab === 'reports' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ReportsScreen 
            customers={customers} 
            transactions={allTransactions} 
            merchant={merchant} 
            suppliers={suppliers}
            supplierTransactions={allSupplierTransactions}
          />
        </motion.div>
      )}

      {activeTab === 'ai' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <GramaAIScreen 
            customers={customers} 
            transactions={allTransactions}
            merchant={merchant}
            suppliers={suppliers}
            supplierTransactions={supplierTransactions}
          />
        </motion.div>
      )}

      {activeTab === 'settings' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <SettingsScreen user={user} merchant={merchant} />
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isAddCustomerOpen && (
          <AddCustomerModal 
            user={user} 
            onClose={() => setIsAddCustomerOpen(false)} 
            merchant={merchant}
          />
        )}
        {isAddSupplierOpen && (
          <AddSupplierModal 
            user={user} 
            onClose={() => setIsAddSupplierOpen(false)} 
            merchant={merchant}
          />
        )}
        {isAddTransactionOpen && (
          <AddTransactionModal 
            user={user} 
            customers={customers}
            type={isAddTransactionOpen.type} 
            onClose={() => setIsAddTransactionOpen(null)} 
            merchant={merchant}
          />
        )}
        {isAddSupplierTransactionOpen && (
          <AddSupplierTransactionModal 
            user={user} 
            suppliers={suppliers}
            type={isAddSupplierTransactionOpen.type} 
            onClose={() => setIsAddSupplierTransactionOpen(null)} 
            merchant={merchant}
          />
        )}
      </AnimatePresence>

      {/* Bottom Nav - Hidden on Large Screens */}
      <nav className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-3xl lg:hidden backdrop-blur-xl border-t px-6 py-4 flex items-center justify-between z-50 ${darkMode ? 'bg-[#0F172A]/80 border-gray-800' : 'bg-white/80 border-gray-100'}`}>
        {[
          { id: 'home', label: isKn ? 'ಹೋಮ್' : 'Home', icon: HomeIcon },
          { id: 'customers', label: isKn ? 'ಗ್ರಾಹಕರು' : 'Customers', icon: Users },
          { id: 'ai', label: isKn ? 'AI' : 'Grama AI', icon: Sparkles },
          { id: 'suppliers', label: isKn ? 'ಸರಬರಾಜುದಾರರು' : 'Suppliers', icon: Truck },
          { id: 'reports', label: isKn ? 'ವರದಿಗಳು' : 'Reports', icon: BarChart3 },
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-[#006B4D]' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl ${activeTab === item.id ? 'bg-[#006B4D]/10' : ''}`}>
              <item.icon size={24} />
            </div>
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  </div>
</div>
  );
}

/**
 * Reminders Screen
 */
function RemindersScreen({ customers, merchant, transactions, onBack }: { customers: CustomerData[], merchant: MerchantData, transactions: TransactionData[], onBack: () => void }) {
  const isKn = merchant.preferences?.language === 'kn';
  const darkMode = merchant.preferences?.darkMode || false;

  const [editingMessage, setEditingMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState(isKn 
    ? `ನಮಸ್ಕಾರ, ${merchant.shopName} ನಲ್ಲಿ ನಿಮ್ಮ ಬಾಕಿ ₹{{amount}} ಇದೆ. ದಯವಿಟ್ಟು ಪಾವತಿಸಿ.`
    : `Namaskara, your due at ${merchant.shopName} is ₹{{amount}}. Kindly pay soon.`
  );
  
  const customersWithDues = useMemo(() => customers.filter(c => c.pendingAmount > 0).sort((a, b) => b.pendingAmount - a.pendingAmount), [customers]);
  const totalDues = useMemo(() => customersWithDues.reduce((acc, c) => acc + c.pendingAmount, 0), [customersWithDues]);

  const recoveredToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return transactions
      .filter(t => t.type === 'payment' && t.date?.toDate() >= today)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const highPriorityCount = useMemo(() => customersWithDues.filter(c => c.pendingAmount > 2500).length, [customersWithDues]);

  const handleSend = (num: string, amt?: number, method: 'whatsapp' | 'sms' = 'whatsapp') => {
    let message = customMessage;
    if (amt !== undefined) {
       message = message.replace('{{amount}}', amt.toLocaleString());
    } else {
       message = message.replace('₹{{amount}} ', '').replace('₹{{amount}}', ''); // Clean up if no amount
    }

    const cleanPhone = num?.replace(/\D/g, '') || '';
    const phone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    if (method === 'whatsapp') {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      // Correct SMS protocol for mobile browsers
      const smsUrl = `sms:${phone}${navigator.userAgent.match(/iPhone/i) ? '&' : '?'}body=${encodeURIComponent(message)}`;
      window.location.href = smsUrl;
    }
  };

  const handleBulkSMS = () => {
    if (customersWithDues.length === 0) return;
    
    const phones = customersWithDues.map(c => {
      const num = c.phone?.replace(/\D/g, '') || '';
      return num.startsWith('91') ? num : `91${num}`;
    });
    
    const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const separator = isIos ? ',' : ';';
    const numbers = phones.join(separator);
    
    const bulkMessage = isKn 
      ? `ನಮಸ್ಕಾರ, ${merchant.shopName} ನಲ್ಲಿ ನಿಮ್ಮ ಬಾಕಿ ಹಣ ಪಾವತಿಸಿ. ಧನ್ಯವಾದಗಳು.`
      : `Hello, this is a reminder from ${merchant.shopName} to settle your outstanding dues. Thank you.`;
    
    const smsUrl = `sms:${numbers}${isIos ? '&' : '?'}body=${encodeURIComponent(bulkMessage)}`;
    window.location.href = smsUrl;
  };

  const [manualNumber, setManualNumber] = useState('');

  return (
    <div className={`fixed inset-0 lg:static lg:inset-auto lg:flex-1 lg:h-screen z-[100] flex flex-col overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#F8FAFC]'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-[#1E293B]/80 border-gray-800' : 'bg-white/80 border-gray-100'} px-6 py-4 backdrop-blur-md flex items-center gap-4 sticky top-0 z-50 border-b`}>
        <button onClick={onBack} className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} lg:hidden`}>
          <ChevronRight size={24} className="rotate-180" />
        </button>
        <div className="hidden lg:block">
           <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-[#006B4D] transition-colors font-bold pr-4">
              <ChevronRight className="rotate-180" size={18} />
              <span>{isKn ? 'ಹಿಂದೆ' : 'Back'}</span>
           </button>
        </div>
        <h1 className="text-xl font-bold text-[#006B4D]">{isKn ? 'ವಸೂಲಾತಿ ಡೆಸ್ಕ್' : 'Collection Desk'}</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 space-y-10 pt-6 pb-40">
        {/* Send Reminder Quick Action - Enhanced with Manual Entry */}
        <section className={`${darkMode ? 'bg-[#1E293B] border-gray-800' : 'bg-white border-gray-50'} rounded-[40px] p-8 shadow-sm border flex flex-col gap-6`}>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className={`text-3xl font-black leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{isKn ? 'ನೇರ' : 'Direct'}</h2>
              <h2 className={`text-3xl font-black leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{isKn ? 'ಸಂದೇಶ' : 'Message'}</h2>
            </div>
            <div className="bg-[#A16207] text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-orange-900/20">
               <Megaphone size={16} fill="currentColor" />
               <span className="text-[11px] font-black uppercase tracking-widest leading-none">{isKn ? 'ತ್ವರಿತ ಕಳುಹಿಸಿ' : 'Quick Send'}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input 
                type="tel"
                value={manualNumber}
                onChange={(e) => setManualNumber(e.target.value)}
                placeholder={isKn ? 'ಯಾವುದೇ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ' : 'Enter any Mobile Number'}
                className={`w-full border rounded-2xl py-4 pl-6 pr-4 font-bold focus:ring-2 focus:ring-[#006B4D] outline-hidden ${darkMode ? 'bg-[#0F172A] border-gray-800 text-white placeholder:text-gray-600' : 'bg-gray-50 border-gray-100 text-gray-800 placeholder:text-gray-400'}`}
              />
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-[#f1f5f9]'} p-6 rounded-[32px] relative group min-h-24 flex items-center justify-center overflow-hidden`}>
              <div className="text-center px-4">
                {editingMessage ? (
                  <textarea 
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    onBlur={() => setEditingMessage(false)}
                    autoFocus
                    className="bg-transparent border-none focus:ring-0 w-full text-center font-bold text-gray-400 italic leading-relaxed text-sm resize-none"
                  />
                ) : (
                  <p className={`font-bold italic leading-relaxed text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    "{customMessage?.replace('₹{{amount}} ', '')?.replace('₹{{amount}}', '')}"
                  </p>
                )}
              </div>
              <button 
                onClick={() => setEditingMessage(true)}
                className="absolute top-4 right-4 text-blue-600 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Pencil size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => {
                const target = manualNumber || (customersWithDues[0]?.phone);
                if (target) handleSend(target, undefined, 'whatsapp');
              }}
              className="w-full bg-[#047857] text-white py-5 rounded-[22px] font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-[#047857]/20"
            >
               <MessageCircle size={22} fill="white" />
               <span className="tracking-tight">Send via WhatsApp</span>
            </button>
            <button 
              onClick={() => {
                const target = manualNumber || (customersWithDues[0]?.phone);
                if (target) handleSend(target, undefined, 'sms');
              }}
              className="w-full bg-white border-2 border-[#1E40AF] text-[#1E40AF] py-5 rounded-[22px] font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all shadow-sm"
            >
               <MessageSquare size={22} fill="#1E40AF" className="text-white" />
               <span className="tracking-tight">Send SMS</span>
            </button>
          </div>
        </section>

        {/* Due Dashboard */}
        <section className="space-y-6">
          <h3 className="text-3xl font-black text-gray-900 tracking-tight">Due Dashboard</h3>
          
          {/* Main Collection Card */}
          <div className="bg-[#FEE2E2] rounded-[40px] p-8 shadow-sm relative overflow-hidden group" style={{ color: '#0d0d11' }}>
             <div className="absolute top-0 right-0 w-40 h-40 bg-red-400/5 -mr-10 -mt-10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
             <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-8" style={{ color: '#0d0d11', opacity: 0.7 }}>Total Outstanding</p>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <h4 className="text-5xl font-black" style={{ color: '#131212' }}>₹{totalDues.toLocaleString()}</h4>
                      <span className="text-gray-500 font-bold text-sm ml-2">from {customersWithDues.length} people</span>
                   </div>
                   <div className="bg-red-400/10 w-20 h-24 rounded-2xl flex flex-col items-center justify-center gap-1">
                      <div className="w-8 h-8 bg-white/50 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-[#B91C1C] rounded-full" />
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-[#BBF7D0] rounded-[40px] p-8 space-y-6" style={{ color: '#0f0f11' }}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed" style={{ color: '#151618' }}>Recovered Today</p>
                <h4 className="text-3xl font-black" style={{ color: '#0f0f11' }}>₹{recoveredToday.toLocaleString()}</h4>
             </div>
             <div className="bg-gray-100 rounded-[40px] p-8 space-y-6" style={{ color: '#17171a' }}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed" style={{ color: '#1f2022' }}>High Priority</p>
                <div className="flex items-center gap-3">
                   <AlertTriangle size={24} className="text-red-500" />
                   <h4 className="text-3xl font-black" style={{ color: '#17171a' }}>{highPriorityCount} Accounts</h4>
                </div>
             </div>
          </div>
        </section>

        {/* Top Dues Collection - Matching Image */}
        <section className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black text-gray-900 tracking-tight">Top Dues Collection</h3>
              <div className="flex gap-2">
                <button 
                  onClick={handleBulkSMS}
                  className="flex items-center gap-2 bg-[#006B4D] text-white px-5 py-2.5 rounded-full font-black text-[11px] shadow-sm active:scale-95 transition-all"
                >
                   <Megaphone size={16} strokeWidth={3} />
                   <span>Bulk SMS</span>
                </button>
                <button className="flex items-center gap-2 bg-[#DBEAFE] text-[#1E40AF] px-5 py-2.5 rounded-full font-black text-[11px] shadow-sm active:scale-95 transition-all">
                   <ListFilter size={16} strokeWidth={3} />
                   <span>{isKn ? 'ಫಿಲ್ಟರ್' : 'Filter'}</span>
                </button>
              </div>
           </div>

           <div className="space-y-4">
              {customersWithDues.map((customer, idx) => {
                const isCritical = customer.pendingAmount > 2500;
                const isOverdue = idx === 0; // Just for mockup matching the image labels
                
                return (
                  <div 
                    key={customer.id} 
                    className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50 flex items-center justify-between group active:bg-gray-50 transition-all"
                  >
                     <div className="flex items-center gap-5">
                       <CustomerAvatar customer={customer} size="md" />
                       <div>
                          <h4 className="font-black text-gray-900 text-lg leading-tight mb-1">{customer.name}</h4>
                          <p className="text-sm font-bold text-gray-400">Updated {idx === 0 ? '3 days ago' : idx === 1 ? '1 week ago' : 'yesterday'}</p>
                       </div>
                     </div>

                     <div className="text-right">
                        <div className="text-3xl font-black text-gray-900 mb-1">₹{customer.pendingAmount.toLocaleString()}</div>
                        <div className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                           isCritical ? 'bg-[#991B1B] text-white' : 
                           isOverdue ? 'bg-red-500 text-white' : 
                           'bg-[#854D0E] text-white'
                        }`}>
                           {isCritical ? 'CRITICAL' : isOverdue ? 'OVERDUE' : 'PENDING'}
                        </div>
                     </div>
                  </div>
                );
              })}
           </div>
        </section>
      </div>
    </div>
  );
}

// Function to delete a collection in batches (simulated as client-side)
const deleteCollection = async (collectionRef: any) => {
  const snapshot = await getDocs(collectionRef);
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
};

/**
 * Settings Screen - Enhanced for full functionality
 */
function NotificationToast({ title, body, onClose }: { title: string, body: string, onClose: () => void, key?: string | number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="pointer-events-auto w-full max-w-sm bg-white dark:bg-[#1E293B] rounded-[24px] shadow-2xl p-4 border border-[#006B4D]/20 flex items-start gap-4 overflow-hidden relative"
    >
      <div className="w-10 h-10 bg-[#006B4D]/10 rounded-full flex items-center justify-center shrink-0">
        <Bell className="text-[#006B4D]" size={20} />
      </div>
      <div className="flex-1 min-w-0 pr-4">
        <p className="font-black text-sm text-gray-900 dark:text-white leading-tight mb-0.5 truncate">{title}</p>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-tight">{body}</p>
      </div>
      <button 
        onClick={onClose}
        className="text-gray-300 hover:text-gray-500 dark:text-gray-600 shrink-0"
      >
        <Plus className="rotate-45" size={20} />
      </button>
      <motion.div 
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 5, ease: 'linear' }}
        className="absolute bottom-0 left-0 h-1 bg-[#006B4D]"
      />
    </motion.div>
  );
}

function SettingsScreen({ user, merchant }: { user: FirebaseUser, merchant: MerchantData }) {
  const [activeTab, setActiveTab] = useState<'profile' | 'qr' | 'preferences' | 'security'>('profile');
  const [notifPermission, setNotifPermission] = useState<PermissionState>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryData[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [editName, setEditName] = useState(merchant.shopkeeperName);
  const [editShop, setEditShop] = useState(merchant.shopName);
  const [editPhone, setEditPhone] = useState(merchant.phone);
  const [editUpi, setEditUpi] = useState(merchant.upiId || '');
  const [isSaving, setIsSaving] = useState(false);
  const [editPhotoURL, setEditPhotoURL] = useState(merchant.photoURL || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const avatarSeeds = ['Felix', 'Max', 'Sam', 'Milo', 'Luna', 'Kiki', 'Leo', 'Buster'];
  const avatarStyles = ['avataaars', 'bottts', 'adventurer', 'personas'];

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
    if (granted) {
      sendNotification("Success!", "Notifications are now enabled for Grama-Khata.");
    } else {
      alert("Please allow notification permissions in your browser settings.");
    }
  };
  
  // App Preferences
  const [showCurrency, setShowCurrency] = useState(merchant.preferences?.showCurrency ?? true);
  const [compactMode, setCompactMode] = useState(merchant.preferences?.compactMode ?? false);
  const [darkMode, setDarkMode] = useState(merchant.preferences?.darkMode ?? false);
  const [language, setLanguage] = useState<'en' | 'kn'>(merchant.preferences?.language ?? 'en');

  const savePreferences = async (updates: Partial<MerchantData['preferences']>) => {
    try {
      await updateDoc(doc(db, 'merchants', user.uid), {
        preferences: {
          showCurrency,
          compactMode,
          darkMode,
          language,
          ...updates
        },
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to save preferences", error);
    }
  };

  const toggleDarkMode = (val: boolean) => {
    setDarkMode(val);
    savePreferences({ darkMode: val });
    if (val) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleResetData = async () => {
    const confirmText = language === 'kn' ? "ಎಲ್ಲಾ ಡೇಟಾವನ್ನು ಅಳಿಸಬೇಕೆ? ಇದು ನಿಮ್ಮ ಎಲ್ಲಾ ವಹಿವಾಟುಗಳನ್ನು ಅಳಿಸುತ್ತದೆ." : "Are you sure you want to delete all transaction data? This cannot be undone.";
    if (!window.confirm(confirmText)) return;

    try {
      setIsSaving(true);
      const customersRef = collection(db, 'merchants', user.uid, 'customers');
      const transactionsRef = collection(db, 'merchants', user.uid, 'transactions');
      
      await deleteCollection(customersRef);
      await deleteCollection(transactionsRef);

      alert(language === 'kn' ? "ಡೇಟಾ ಯಶಸ್ವಿಯಾಗಿ ರೀಸೆಟ್ ಆಗಿದೆ" : "All business data has been reset successfully.");
    } catch (error) {
      console.error("Failed to reset data", error);
      alert("Failed to reset data");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      setIsFetchingHistory(true);
      const historyRef = collection(db, 'merchants', user.uid, 'loginHistory');
      const q = query(historyRef, orderBy('timestamp', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoginHistoryData));
      setLoginHistory(history);
      setIsHistoryOpen(true);
    } catch (error) {
      console.error("Failed to fetch login history", error);
      alert("Failed to load login history");
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'merchants', user.uid), {
        shopkeeperName: editName,
        shopName: editShop,
        phone: editPhone,
        upiId: editUpi,
        photoURL: editPhotoURL,
        updatedAt: serverTimestamp()
      });
      setIsEditOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById('upi-qr') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `${merchant.shopName}_UPI_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Fallback reload if auth state doesn't trigger UI change immediately
      setTimeout(() => {
        if (auth.currentUser) window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Logout failed", error);
      alert("Failed to sign out. Please try again.");
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#F8FAFC]'}`}>
      {/* Dynamic Header */}
      <header className="px-6 py-10">
        <h1 className={`text-4xl font-black tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{language === 'kn' ? 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು' : 'Settings'}</h1>
        <p className="text-gray-500 font-bold leading-tight">{language === 'kn' ? 'ನಿಮ್ಮ ಡಿಜಿಟಲ್ ಲೆಡ್ಜರ್ ಕಾನ್ಫಿಗರ್ ಮಾಡಿ' : 'Configuring your digital ledger'}</p>
      </header>

      {/* Tabs Navigation */}
      <div className="px-6 mb-8">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'profile', label: language === 'kn' ? 'ವ್ಯಾಪಾರಿ ವಿವರ' : 'Merchant Profile', icon: User },
            { id: 'qr', label: language === 'kn' ? 'ಯುಪಿಐ ಕ್ಯೂಆರ್' : 'UPI QR', icon: QrCode },
            { id: 'preferences', label: language === 'kn' ? 'ಆದ್ಯತೆಗಳು' : 'Preferences', icon: Settings2 },
            { id: 'security', label: language === 'kn' ? 'ಭದ್ರತೆ' : 'Security', icon: ShieldCheck }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all border shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-[#006B4D] text-white border-[#006B4D] shadow-lg shadow-[#006B4D]/10' 
                  : (darkMode ? 'bg-[#1E293B] text-gray-400 border-gray-700' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200')
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-8 pb-40">
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <section className={`${darkMode ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-50'} p-8 rounded-[40px] shadow-sm border flex flex-col items-center`}>
              <div className="relative mb-6 group">
                 <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-100 relative">
                    <img 
                      src={editPhotoURL || merchant.photoURL || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                    />
                    <button 
                      onClick={() => setShowAvatarPicker(true)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300"
                    >
                      <Camera className="text-white" size={32} />
                    </button>
                 </div>
                 <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#006B4D] text-white px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap border-2 border-white">
                    <CheckSquare size={10} strokeWidth={4} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{language === 'kn' ? 'ದೃಢೀಕರಿಸಲಾಗಿದೆ' : 'Verified'}</span>
                 </div>
              </div>
              <h2 className={`text-2xl font-black mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{merchant.shopkeeperName}</h2>
              <p className="text-gray-400 font-bold mb-6">{merchant.shopName}</p>

              {/* Avatar Picker Inline / Mini */}
              <AnimatePresence>
                {showAvatarPicker && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="w-full overflow-hidden mb-6"
                  >
                    <div className="bg-gray-50 dark:bg-[#0F172A] rounded-3xl p-4 border border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Choose Avatar</span>
                        <div className="flex gap-2">
                          <label className="cursor-pointer p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-emerald-600 hover:bg-emerald-50">
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    setEditPhotoURL(event.target?.result as string);
                                    setShowAvatarPicker(false);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                            <Image size={14} />
                          </label>
                          <button onClick={() => setShowAvatarPicker(false)} className="text-gray-300"><X size={14} /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-3 max-h-[300px] overflow-y-auto pr-2 pb-2">
                        {avatarStyles.map(style => (
                          avatarSeeds.map(seed => {
                            const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
                            return (
                              <button 
                                key={`${style}-${seed}`}
                                onClick={() => {
                                  setEditPhotoURL(url);
                                }}
                                className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all p-1 relative group ${
                                  editPhotoURL === url ? 'border-[#006B4D] bg-emerald-50' : 'border-transparent bg-white dark:bg-gray-800 shadow-sm'
                                }`}
                              >
                                <img src={url} alt="Avatar" className="w-full h-full object-contain" />
                                {editPhotoURL === url && (
                                  <div className="absolute top-1 right-1 w-4 h-4 bg-[#006B4D] rounded-full flex items-center justify-center">
                                    <Check size={8} className="text-white" />
                                  </div>
                                )}
                              </button>
                            );
                          })
                        ))}
                      </div>
                      
                      <div className="flex gap-3 mt-6">
                        <button 
                          onClick={() => setShowAvatarPicker(false)}
                          className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSave}
                          disabled={isSaving}
                          className="flex-[2] py-3 bg-black text-white dark:bg-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          {isSaving ? (
                            <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <CheckSquare size={14} />
                              Confirm Avatar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <button 
                onClick={() => setIsEditOpen(true)}
                className={`w-full flex items-center justify-center gap-3 p-5 rounded-[24px] font-black transition-colors ${darkMode ? 'bg-[#334155] text-white' : 'bg-gray-50 text-gray-800 hover:bg-gray-100'}`}
              >
                <Pencil size={18} />
                {language === 'kn' ? 'ಪ್ರೊಫೈಲ್ ಮಾಹಿತಿ ತಿದ್ದುಪಡಿ ಮಾಡಿ' : 'Edit Profile Information'}
              </button>
            </section>

            <section className={`${darkMode ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-50'} rounded-[40px] shadow-sm border p-8 space-y-6`}>
              <h3 className={`text-lg font-black border-l-4 border-[#006B4D] pl-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{language === 'kn' ? 'ಖಾತೆ ಮಾಹಿತಿ' : 'Account Information'}</h3>
              <div className="space-y-5">
                {[
                  { label: language === 'kn' ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ' : 'Mobile Number', value: merchant.phone, icon: Phone },
                  { label: language === 'kn' ? 'ವ್ಯಾಪಾರಿ ಇಮೇಲ್' : 'Merchant Email', value: user.email, icon: Mail },
                  { label: language === 'kn' ? 'ವ್ಯಾಪಾರಿ ಐಡಿ' : 'Merchant ID', value: user.uid, icon: Fingerprint, isCode: true },
                  { label: language === 'kn' ? 'ಯುಪಿಐ ಐಡಿ' : 'UPI ID', value: merchant.upiId || 'Not Set', icon: Landmark }
                ].map((item, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl ${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl shadow-sm ${darkMode ? 'bg-[#1E293B] text-gray-500' : 'bg-white text-gray-400'}`}>
                        <item.icon size={16} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                        <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'} ${item.isCode ? 'font-mono text-[10px]' : 'text-sm'}`}>{item.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === 'qr' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <section className={`${darkMode ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-50'} p-8 rounded-[40px] shadow-sm border flex flex-col items-center`}>
              <h3 className={`text-xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {language === 'kn' ? 'ವ್ಯಾಪಾರ ಕ್ಯೂಆರ್ ಕೋಡ್' : 'Business QR Code'}
              </h3>
              
              {merchant.upiId ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="bg-white p-6 rounded-[32px] shadow-xl">
                    <QRCodeCanvas 
                      id="upi-qr"
                      value={`upi://pay?pa=${merchant.upiId}&pn=${encodeURIComponent(merchant.shopName)}&cu=INR`}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  
                  <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{language === 'kn' ? 'ಲಿಂಕ್ ಮಾಡಲಾದ ಯುಪಿಐ ಐಡಿ' : 'Linked UPI ID'}</p>
                    <p className={`font-mono font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{merchant.upiId}</p>
                  </div>

                  <button 
                    onClick={downloadQR}
                    className="w-full flex items-center justify-center gap-3 bg-[#006B4D] text-white py-5 px-8 rounded-[24px] font-black text-sm shadow-lg shadow-[#006B4D]/20 active:scale-95 transition-all"
                  >
                    <Download size={18} />
                    {language === 'kn' ? 'ಕ್ಯೂಆರ್ ಕೋಡ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ' : 'Download QR Code'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} />
                  </div>
                  <h4 className={`text-lg font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'kn' ? 'ಯುಪಿಐ ಕಂಡುಬಂದಿಲ್ಲ' : 'UPI ID Not Set'}
                  </h4>
                  <p className="text-gray-400 font-bold mb-8 max-w-[240px] mx-auto">
                    {language === 'kn' ? 'ವರದಿ ತಯಾರಿಸಲು ಮತ್ತು ಕ್ಯೂಆರ್ ಕೋಡ್ ಬಳಸಲು ದಯವಿಟ್ಟು ಯುಪಿಐ ಐಡಿ ಸೇರಿಸಿ.' : 'Please add your UPI ID in the profile settings to generate a QR code for your business.'}
                  </p>
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className="bg-gray-100 text-gray-800 px-6 py-3 rounded-2xl font-black text-xs active:scale-95 transition-all"
                  >
                    {language === 'kn' ? 'ಪ್ರೊಫೈಲ್ ತಿದ್ದುಪಡಿ ಮಾಡಿ' : 'Go to Profile'}
                  </button>
                </div>
              )}
            </section>
            
            {merchant.upiId && (
              <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-blue-900/10 border-blue-900/30 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                <div className="flex gap-4">
                  <Info size={24} className="shrink-0" />
                  <p className="text-xs font-bold leading-relaxed">
                    {language === 'kn' ? 'ಗ್ರಾಹಕರು ಈ ಕ್ಯೂಆರ್ ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ನೇರವಾಗಿ ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಖಾತೆ ಪಾವತಿ ಮಾಡಬಹುದು.' : 'Customers can scan this QR code using any UPI app (PhonePe, Google Pay, BHIM, etc.) to pay you directly to your linked bank account.'}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'preferences' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <section className={`${darkMode ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-50'} rounded-[40px] shadow-sm border p-8 space-y-8`}>
              <h3 className={`text-lg font-black border-l-4 border-[#006B4D] pl-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{language === 'kn' ? 'ಅಪ್ಲಿಕೇಶನ್ ಆದ್ಯತೆಗಳು' : 'App Preferences'}</h3>
              
              <div className="space-y-4">
                {/* Language Selector */}
                <div className={`flex items-center justify-between p-6 rounded-[28px] ${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
                   <div>
                      <p className="font-black mb-0.5">{language === 'kn' ? 'ಭಾಷೆ / Language' : 'App Language'}</p>
                      <p className="text-[11px] font-bold text-gray-400">Select your preferred user interface language</p>
                   </div>
                   <select 
                    value={language}
                    onChange={(e) => {
                      const val = e.target.value as 'en' | 'kn';
                      setLanguage(val);
                      savePreferences({ language: val });
                    }}
                    className={`p-3 rounded-xl border-none font-black text-xs outline-none ${darkMode ? 'bg-[#334155] text-white' : 'bg-white text-gray-800 shadow-sm'}`}
                   >
                     <option value="en">English (US)</option>
                     <option value="kn">ಕನ್ನಡ (Kannada)</option>
                   </select>
                </div>

                {/* Notification Settings */}
                <div className={`flex flex-col p-6 rounded-[28px] ${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="max-w-[70%]">
                      <p className="font-black mb-0.5">{language === 'kn' ? 'ಅಧಿಸೂಚನೆಗಳು (Notifications)' : 'Push Notifications'}</p>
                      <p className="text-[11px] font-bold text-gray-400 leading-tight">Transaction alerts and status reminders</p>
                    </div>
                    <Bell className={notifPermission === 'granted' ? 'text-[#006B4D]' : 'text-gray-300'} size={20} />
                  </div>
                  
                  {notifPermission !== 'granted' ? (
                    <button 
                      onClick={handleEnableNotifications}
                      className="w-full py-4 bg-[#006B4D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#006B4D]/20 active:scale-95 transition-all outline-hidden"
                    >
                      {language === 'kn' ? 'ಅಧಿಸೂಚನೆ ಸಕ್ರಿಯಗೊಳಿಸಿ' : 'Enable Notifications'}
                    </button>
                  ) : (
                    <div className={`flex items-center gap-2 p-4 rounded-2xl border ${darkMode ? 'bg-[#006B4D]/10 border-[#006B4D]/20' : 'bg-green-50 border-green-100'}`}>
                      <ShieldCheck className="text-green-500" size={18} />
                      <span className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? 'text-green-400' : 'text-green-700'}`}>Notifications are Active</span>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => sendNotification(
                      language === 'kn' ? 'ಪರೀಕ್ಷಾ ಅಧಿಸೂಚನೆ' : 'Test Notification', 
                      language === 'kn' ? 'ಎಲ್ಲವೂ ಸರಿಯಾಗಿ ಕೆಲಸ ಮಾಡುತ್ತಿದೆ!' : 'Everything is working perfectly!'
                    )}
                    className={`mt-3 w-full py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {language === 'kn' ? 'ಪರೀಕ್ಷಾ ಅಧಿಸೂಚನೆ ಕಳುಹಿಸಿ' : 'Send Test Notification'}
                  </button>
                </div>

                {/* Dark Mode Selector */}
                <div className={`flex items-center justify-between p-6 rounded-[28px] ${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
                    <div>
                      <p className="font-black mb-0.5">{language === 'kn' ? 'ರಾತ್ರಿ ಮೋಡ್ (Dark Mode)' : 'Dark mode'}</p>
                      <p className="text-[11px] font-bold text-gray-400">Enable high-contrast dark theme</p>
                    </div>
                    <button 
                      onClick={() => toggleDarkMode(!darkMode)}
                      className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${
                        darkMode ? 'bg-[#006B4D]' : 'bg-gray-200'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-sm transform ${
                        darkMode ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                </div>

                {[
                  { id: 'currency', title: language === 'kn' ? 'ಕರೆನ್ಸಿ ತೋರಿಸು (₹)' : 'Display Currency (₹)', desc: 'Show rupee symbol next to amounts', state: showCurrency, setter: (v: boolean) => { setShowCurrency(v); savePreferences({ showCurrency: v }); } },
                  { id: 'compact', title: language === 'kn' ? 'ಕಾಂಪ್ಯಾಕ್ಟ್ ಮೋಡ್' : 'Compact Card Mode', desc: 'Reduce height of customer cards', state: compactMode, setter: (v: boolean) => { setCompactMode(v); savePreferences({ compactMode: v }); } },
                ].map((pref) => (
                  <div key={pref.id} className={`flex items-center justify-between p-6 rounded-[28px] ${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
                    <div className="max-w-[70%]">
                      <p className="font-black mb-0.5">{pref.title}</p>
                      <p className="text-[11px] font-bold text-gray-400 leading-tight">{pref.desc}</p>
                    </div>
                    <button 
                      onClick={() => pref.setter(!pref.state)}
                      className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${
                        pref.state ? 'bg-[#006B4D]' : 'bg-gray-200'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-sm transform ${
                        pref.state ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <section className={`${darkMode ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-50'} rounded-[40px] shadow-sm border p-8 space-y-6`}>
              <h3 className={`text-lg font-black border-l-4 border-[#006B4D] pl-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{language === 'kn' ? 'ಖಾತೆ ಭದ್ರತೆ' : 'Account Security'}</h3>
              
              <div className="bg-blue-50/10 p-6 rounded-[28px] border border-blue-100 flex items-start gap-4">
                <ShieldCheck className="text-blue-600 shrink-0" size={24} />
                <div>
                  <p className={`font-black text-sm mb-1 ${darkMode ? 'text-blue-200' : 'text-blue-900'}`}>Authenticated via Google</p>
                  <p className="text-[11px] font-bold text-blue-700/60 leading-normal">
                    Your account is securely managed by Google. Multi-factor authentication protects your business data.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={fetchLoginHistory}
                  disabled={isFetchingHistory}
                  className={`w-full p-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-between ${darkMode ? 'bg-[#0F172A] border-gray-800' : 'bg-gray-50'}`}
                >
                  {isFetchingHistory ? (language === 'kn' ? 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading...') : (language === 'kn' ? 'ಲಾಗಿನ್ ಇತಿಹಾಸ' : 'View Login History')} 
                  <ChevronRight size={16} />
                </button>
              </div>
            </section>

            <section className="bg-red-50/5 rounded-[40px] shadow-sm border border-red-500/10 p-8 space-y-6">
              <h3 className="text-lg font-black text-red-600 border-l-4 border-red-600 pl-4">{language === 'kn' ? 'ಅಪಾಯ ವಲಯ' : 'Danger Zone'}</h3>
              <p className="text-[11px] font-bold text-red-500/60 leading-normal px-4">
                {language === 'kn' ? 'ಇಲ್ಲಿನ ಕ್ರಮಗಳನ್ನು ಹಿಂತಿರುಗಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. ಜಾಗರೂಕರಾಗಿರಿ.' : 'Actions here are permanent and cannot be undone. Be very careful.'}
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={handleResetData}
                  disabled={isSaving}
                  className="w-full p-5 bg-white text-red-600 border border-red-100 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-between hover:bg-red-50 active:scale-95 transition-all outline-none"
                >
                  {language === 'kn' ? 'ವ್ಯಾಪಾರ ಡೇಟಾ ರೀಸೆಟ್ ಮಾಡಿ' : 'Reset Business Data'} <RotateCcw size={16} />
                </button>
              </div>
            </section>
          </motion.div>
        )}

        {/* Login History Modal */}
        <AnimatePresence>
          {isHistoryOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsHistoryOpen(false)}
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className={`relative w-full max-w-md max-h-[80vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col ${darkMode ? 'bg-[#1E293B] text-white' : 'bg-white'}`}
              >
                <div className={`px-8 pt-8 pb-4 shrink-0 border-b ${darkMode ? 'border-gray-800' : 'border-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black">{language === 'kn' ? 'ಲಾಗಿನ್ ಇತಿಹಾಸ' : 'Login History'}</h2>
                    <button onClick={() => setIsHistoryOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-400"><X size={20} /></button>
                  </div>
                </div>
                <div className="p-4 overflow-y-auto no-scrollbar flex-1">
                  {loginHistory.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 italic">No history found</div>
                  ) : (
                    <div className="space-y-3">
                      {loginHistory.map((entry) => (
                        <div key={entry.id} className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#0F172A] border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${entry.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                              {entry.status}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold">
                              {entry.timestamp?.toDate().toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs font-bold">{entry.device}</p>
                          {entry.ip && <p className="text-[10px] text-gray-400 font-mono mt-1">{entry.ip}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Sign Out Button */}
        <section className="px-2">
          <button 
            id="sign-out-button"
            onClick={handleLogout}
            className={`w-full py-6 border rounded-[32px] font-black text-lg flex items-center justify-center gap-4 transition-all active:scale-95 shadow-sm ${
              darkMode 
                ? 'bg-[#1E293B] border-gray-700 text-red-400 hover:bg-red-500/10' 
                : 'bg-white border-red-50 text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut size={22} />
             {language === 'kn' ? 'ಖಾತೆಯಿಂದ ಹೊರಬನ್ನಿ' : 'Sign Out Account'}
          </button>
          <p className="text-center text-[10px] text-gray-300 font-bold mt-8 uppercase tracking-[0.2em]">Gram-Khata Digital Ledger v2.3.0</p>
        </section>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isSaving && setIsEditOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md max-h-[90vh] bg-white rounded-[50px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-10 pt-10 pb-6 shrink-0 bg-white border-b border-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900">Edit Details</h2>
                    <p className="text-xs font-bold text-gray-400 mt-1">Keep your profile up to date</p>
                  </div>
                  <button 
                    disabled={isSaving}
                    onClick={() => setIsEditOpen(false)} 
                    className="p-3 bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="px-10 py-8 space-y-10 overflow-y-auto no-scrollbar flex-1">
                <div className="space-y-6">
                  {/* Field sets */}
                  {[
                    { label: 'Shopkeeper Name', icon: User, value: editName, setter: setEditName },
                    { label: 'Shop Name', icon: Store, value: editShop, setter: setEditShop },
                    { label: 'Business Phone', icon: Phone, value: editPhone, setter: setEditPhone },
                    { label: 'UPI ID (Virtual Payment Address)', icon: Landmark, value: editUpi, setter: setEditUpi, placeholder: 'name@bank' },
                  ].map((field, idx) => (
                    <div key={idx} className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">{field.label}</label>
                      <div className="relative">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400">
                          <field.icon size={20} />
                        </div>
                        <input 
                          value={field.value}
                          onChange={(e) => field.setter(e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full bg-[#f8fafc] border-2 border-transparent focus:border-[#006B4D] rounded-[28px] py-6 pl-16 pr-6 text-gray-800 font-bold focus:ring-0 outline-none transition-all placeholder:text-gray-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-10 pb-10 pt-4 bg-white border-t border-gray-50 shrink-0">
                <button 
                  disabled={isSaving}
                  onClick={handleSave}
                  className="w-full bg-[#006B4D] text-white py-7 rounded-[32px] font-black text-xl shadow-2xl shadow-[#006B4D]/30 active:scale-95 transition-all disabled:opacity-50 ring-4 ring-[#006B4D]/5"
                >
                  {isSaving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Onboarding/Registration Screen - Full Login Support
 */
function OnboardingScreen({ onStartRegistration, isLoading: externalLoading }: { onStartRegistration: () => void, isLoading: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailSignUp, setIsEmailSignUp] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoading = externalLoading || internalLoading;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setInternalLoading(true);
    try {
      if (isEmailSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError("Email/Password provider is not enabled in Firebase Console. Please enable it in the Authentication tab.");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Incorrect email or password. Please check your credentials and try again.");
      } else {
        setError(err.message || "Authentication failed");
      }
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans">
      {/* Hero Image Section */}
      <div className="h-64 relative overflow-hidden group">
        <img 
          src="https://images.unsplash.com/photo-1556742049-0ad745665771?auto=format&fit=crop&q=80&w=1000" 
          alt="Merchant Ledger"
          className="w-full h-full object-cover brightness-75 transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/20 to-white/90" />
        <div className="absolute bottom-8 left-6 right-6">
          <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full w-fit mb-3 border border-white/30">
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white">Digital Village Accounting</p>
          </div>
          <h1 className="text-3xl font-black text-white drop-shadow-lg tracking-tight leading-none mb-1">Grama-Khata</h1>
          <p className="text-white/80 text-xs font-bold drop-shadow-md">Professional Ledger Management</p>
        </div>
      </div>

      {/* Header Section with Form */}
      <div className="bg-white rounded-b-[40px] shadow-sm px-6 pt-10 pb-10 border-b border-gray-100 relative overflow-hidden -mt-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#006B4D]/5 blur-3xl -mr-20 -mt-20 rounded-full" />
        
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{isEmailSignUp ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="text-gray-500 max-w-[200px] text-sm leading-tight">
              {isEmailSignUp ? 'Join Grama-Khata to manage your shop digital ledger.' : 'Login to access your digital ledger.'}
            </p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl">
             <button 
               onClick={() => setIsEmailSignUp(false)}
               className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${!isEmailSignUp ? 'bg-white text-[#006B4D] shadow-sm' : 'text-gray-400'}`}
             >
               Sign In
             </button>
             <button 
               onClick={() => setIsEmailSignUp(true)}
               className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${isEmailSignUp ? 'bg-white text-[#006B4D] shadow-sm' : 'text-gray-400'}`}
             >
               Sign Up
             </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-pulse relative z-10">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4 relative z-10">
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail size={18} />
            </div>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 font-bold focus:ring-2 focus:ring-[#006B4D] outline-hidden shadow-sm"
            />
          </div>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock size={18} />
            </div>
            <input 
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-12 text-gray-800 placeholder:text-gray-400 font-bold focus:ring-2 focus:ring-[#006B4D] outline-hidden shadow-sm"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#006B4D] text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-[#006B4D]/10 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Processing...' : (isEmailSignUp ? 'ಹಣ ಸೇರಿಸಿ / Create Account' : 'ಹಣ ಸೇರಿಸಿ / Sign In')}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 relative z-10">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center mb-6">Or continue with</p>
          <button 
            onClick={onStartRegistration}
            disabled={isLoading}
            className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 transition-all active:scale-98 disabled:opacity-50"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            {isLoading ? "Signing in..." : "Google Account"}
          </button>
        </div>

        <p className="text-center text-[11px] text-gray-400 px-8 mt-8 leading-relaxed relative z-10">
          By continuing, you agree to our <span className="text-[#006B4D] font-semibold underline underline-offset-2">Terms of Service</span>
        </p>
      </div>

      <div className="px-6 mt-12 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-[#006B4D] rounded-lg flex items-center justify-center">
             <Store size={18} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#006B4D]">Grama-Khata</h1>
        </div>
        <p className="text-gray-600 text-lg font-medium leading-tight">
          Digital Prosperity for the Rural Merchant.
        </p>
      </div>

      <div className="px-6 space-y-6">
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group">
          <div className="h-48 bg-gray-200 relative">
            <img 
              src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=600&auto=format&fit=crop" 
              alt="Digital Assistant" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="inline-block bg-[#BBF7D0] text-[#006B4D] text-[10px] font-bold px-2 py-1 rounded-md mb-2 uppercase">
                Smart Ledger
              </span>
              <h3 className="text-white text-xl font-bold leading-tight">
                Replace paper with a secure digital assistant.
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="w-12 h-12 bg-[#DBEAFE] rounded-2xl flex items-center justify-center shrink-0">
            <MessageSquare size={24} className="text-[#1E40AF]" />
          </div>
          <div>
            <h4 className="font-bold text-[#0F172A] mb-1">WhatsApp Reminders</h4>
            <p className="text-sm text-gray-500 leading-relaxed">
              Send WhatsApp reminders instantly to recover dues.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="w-12 h-12 bg-[#BBF7D0] rounded-2xl flex items-center justify-center shrink-0">
            <BarChart3 size={24} className="text-[#006B4D]" />
          </div>
          <div>
            <h4 className="font-bold text-[#0F172A] mb-1">Daily Reports</h4>
            <p className="text-sm text-gray-500 leading-relaxed">
              Daily collection reports to track your growth.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Add Customer Modal
 */
function AddCustomerModal({ user, onClose, merchant }: { user: FirebaseUser, onClose: () => void, merchant: MerchantData }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isKn = merchant.preferences?.language === 'kn';
  const darkMode = merchant.preferences?.darkMode || false;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800000) { // Limit to ~800KB for Firestore safety
      alert(isKn ? "ಚಿತ್ರ ತುಂಬಾ ದೊಡ್ಡದಾಗಿದೆ. ದಯವಿಟ್ಟು 800KB ಗಿಂತ ಕಡಿಮೆ ಇರುವ ಚಿತ್ರವನ್ನು ಆರಿಸಿ." : "Image is too large. Please select an image under 800KB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoURL(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setIsLoading(true);
    try {
      const path = `merchants/${user.uid}/customers`;
      await addDoc(collection(db, path), {
        name,
        phone,
        address,
        notes,
        photoURL,
        pendingAmount: 0,
        avatarSeed: Math.random().toString(36).substring(7),
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `merchants/${user.uid}/customers`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className={`${darkMode ? 'bg-[#1E293B] text-white' : 'bg-white'} w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-6 md:p-10 shadow-2xl`}
      >
        <div className="flex justify-between items-center mb-6 md:mb-8">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#BBF7D0]/30 rounded-xl flex items-center justify-center text-[#006B4D]">
                 <Plus size={24} strokeWidth={3} />
              </div>
              <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{isKn ? 'ಗ್ರಾಹಕರನ್ನು ಸೇರಿಸಿ' : 'Add Customer'}</h2>
           </div>
           <button onClick={onClose} className="text-gray-400 p-2">✕</button>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Photo Upload Section */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative group">
              <div className={`w-24 h-24 rounded-full overflow-hidden border-4 flex items-center justify-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-white shadow-xl'}`}>
                {photoURL ? (
                  <img src={photoURL} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-gray-300" />
                )}
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#006B4D] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white active:scale-90 transition-all"
              >
                <CloudUpload size={14} />
              </button>
            </div>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-2">{isKn ? 'ಪ್ರೊಫೈಲ್ ಫೋಟೋ' : 'Optional Profile Photo'}</p>
          </div>

          {[
            { label: isKn ? 'ಹೆಸರು' : 'NAME', icon: User, placeholder: isKn ? 'ಗ್ರಾಹಕರ ಹೆಸರು' : 'Customer Name', value: name, setter: setName },
            { label: isKn ? 'ಮೊಬೈಲ್' : 'MOBILE', icon: Phone, placeholder: isKn ? 'ಫೋನ್ ಸಂಖ್ಯೆ' : 'Mobile Number', value: phone, setter: setPhone },
            { label: isKn ? 'ವಿಳಾಸ' : 'ADDRESS', icon: HomeIcon, placeholder: isKn ? 'ಊರು ಅಥವಾ ವಿಳಾಸ' : 'Village / Area', value: address, setter: setAddress },
            { label: isKn ? 'ಟಿಪ್ಪಣಿಗಳು' : 'NOTES', icon: Pencil, placeholder: isKn ? 'ವಿಶೇಷ ಸೂಚನೆಗಳು' : 'Special instructions', value: notes, setter: setNotes }
          ].map((field) => (
            <div key={field.label} className="space-y-2">
              <label className="text-[10px] font-black text-gray-300 uppercase ml-4 tracking-[0.15em]">{field.label} *</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
                  <field.icon size={18} />
                </div>
                <input 
                  required={field.label !== (isKn ? 'ವಿಳಾಸ' : 'ADDRESS') && field.label !== (isKn ? 'ಟಿಪ್ಪಣಿಗಳು' : 'NOTES')}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  placeholder={field.placeholder} 
                  className={`w-full border-none rounded-[20px] py-4 pl-12 pr-4 font-bold focus:ring-2 focus:ring-[#006B4D] outline-hidden ${darkMode ? 'bg-[#0F172A] text-white placeholder:text-gray-600' : 'bg-[#f1f5f9] text-gray-800 placeholder:text-gray-300'}`}
                />
              </div>
            </div>
          ))}

          <button 
            disabled={isLoading}
            className="w-full bg-[#006B4D] text-white py-4 md:py-6 rounded-[28px] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-[#006B4D]/20 active:scale-95 transition-all mt-4 disabled:opacity-50"
          >
            <Store size={22} className="text-white" />
            {isLoading ? (isKn ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : "Saving...") : (isKn ? 'ಗ್ರಾಹಕರನ್ನು ಉಳಿಸಿ' : "Save Customer")}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/**
 * Add Transaction Modal
 */
function AddTransactionModal({ user, customers, type, onClose, merchant }: { user: FirebaseUser, customers: CustomerData[], type: 'credit' | 'payment', onClose: () => void, merchant: MerchantData }) {
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'bank'>('cash');
  const [dueDate, setDueDate] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [settlementInfo, setSettlementInfo] = useState<{ name: string, phone: string, amount: number } | null>(null);

  const isKn = merchant.preferences?.language === 'kn';
  const darkMode = merchant.preferences?.darkMode || false;

  // Auto-select if only one customer provided (from detail view)
  useEffect(() => {
    if (customers.length === 1) {
      setCustomerId(customers[0].id);
    }
  }, [customers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !amount) return;
    setIsLoading(true);
    try {
      const amtNum = parseFloat(amount);
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;

      const pathForTransaction = `merchants/${user.uid}/transactions`;
      // Add transaction
        await addDoc(collection(db, pathForTransaction), {
          customerId,
          amount: amtNum,
          type,
          category: type === 'credit' ? category : null,
          note,
          notes,
          paymentMode: type === 'payment' ? paymentMode : null,
          date: Timestamp.fromDate(new Date(transactionDate))
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, pathForTransaction));

      // Update customer pending amount - Relational logic
      const newPending = type === 'credit' ? customer.pendingAmount + amtNum : customer.pendingAmount - amtNum;
      const pathForCustomer = `merchants/${user.uid}/customers/${customerId}`;
      await updateDoc(doc(db, pathForCustomer), {
        pendingAmount: newPending,
        dueDate: type === 'credit' && dueDate ? Timestamp.fromDate(new Date(dueDate)) : (customer.dueDate || null),
        lastTransactionDate: Timestamp.fromDate(new Date(transactionDate)),
        lastTransactionAmount: amtNum,
        lastTransactionType: type,
        updatedAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.WRITE, pathForCustomer));

      // Trigger Notification
      const title = type === 'credit' 
        ? (isKn ? 'ಹಣ ಬಾಕಿ (ಕ್ರೆಡಿಟ್) ಸೇರಿಸಲಾಗಿದೆ' : 'New Credit Entry')
        : (isKn ? 'ಪಾವತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ' : 'Payment Received');
      const body = type === 'credit'
        ? (isKn ? `${customer.name} ಇವರಿಂದ ₹${amtNum} ಸಾಲ ದಾಖಲಾಗಿದೆ` : `Added ₹${amtNum} credit for ${customer.name}`)
        : (isKn ? `${customer.name} ಇವರಿಂದ ₹${amtNum} ಪಾವತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ` : `Received ₹${amtNum} payment from ${customer.name}`);
      
      sendNotification(title, body);

      if (newPending === 0) {
        setSettlementInfo({ name: customer.name, phone: customer.phone, amount: amtNum });
      } else {
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className={`${darkMode ? 'bg-[#1E293B] text-white' : 'bg-white'} w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-6 md:p-10 shadow-2xl relative`}
      >
        <header className="flex justify-between items-center mb-6 md:mb-10">
           <div className="flex items-center gap-3">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center ${settlementInfo ? 'bg-emerald-50 text-emerald-600' : (type === 'credit' ? 'bg-red-50 text-red-600' : 'bg-[#006B4D]/10 text-[#006B4D]')}`}>
                 {settlementInfo ? <CheckCircle2 size={24} className="md:size-7" /> : (type === 'credit' ? <ArrowUpRight size={24} className="md:size-7" /> : <Store size={20} className="md:size-6" />)}
              </div>
              <div>
                <h2 className={`text-2xl font-black tracking-tight leading-none mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {settlementInfo ? (isKn ? 'ಖಾತೆ ಪಾವತಿಯಾಯಿತು!' : 'Account Settled!') : (type === 'credit' ? (isKn ? 'ಸಾಲ ಸೇರಿಸಿ' : 'Add Credit') : (isKn ? 'ಪಾವತಿ ಸೇರಿಸಿ' : 'Add Payment'))}
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {settlementInfo ? (isKn ? 'ಧನ್ಯವಾದಗಳು' : 'Balance is now zero') : (type === 'credit' ? (isKn ? 'ಕ್ರೆಡಿಟ್ ಎಂಟ್ರಿ' : 'Credit Entry') : (isKn ? 'ಪಾವತಿ ಸ್ವೀಕೃತಿ' : 'Payment Receipt'))}
                </p>
              </div>
           </div>
           <button onClick={onClose} className="text-gray-400 p-2 hover:bg-gray-100 rounded-full transition-colors">✕</button>
        </header>

        {settlementInfo ? (
          <div className="text-center space-y-8 py-6">
            <div className="space-y-2">
               <p className="text-gray-500 font-bold">{isKn ? 'ಎಲ್ಲಾ ಬಾಕಿ ಹಣ ಪಾವತಿಯಾಗಿದೆ' : 'All dues have been cleared for'}</p>
               <p className="text-3xl font-black text-[#006B4D]">{settlementInfo.name}</p>
            </div>

            <div className={`p-6 rounded-[32px] ${darkMode ? 'bg-[#0F172A]' : 'bg-emerald-50'} border border-emerald-100`}>
               <p className="text-xs font-bold leading-relaxed italic">
                 {isKn 
                   ? `"ನಮಸ್ಕಾರ ${settlementInfo.name}, ನಿಮ್ಮ ಹೆಸರಿನಲ್ಲಿದ್ದ ₹${settlementInfo.amount} ಪಾವತಿಯನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ಈಗ ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ ಯಾವುದೇ ಬಾಕಿ ಇಲ್ಲ. ಧನ್ಯವಾದಗಳು - ${merchant.shopName}"`
                   : `"Hello ${settlementInfo.name}, received your payment of ₹${settlementInfo.amount}. All your dues are now cleared. Thank you - ${merchant.shopName}"`}
               </p>
            </div>

            <div className="flex flex-col gap-4">
               <button 
                 onClick={() => {
                   const text = isKn 
                     ? `ನಮಸ್ಕಾರ ${settlementInfo.name}, ನಿಮ್ಮ ಹೆಸರಿನಲ್ಲಿದ್ದ ₹${settlementInfo.amount} ಪಾವತಿಯನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ಈಗ ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ ಯಾವುದೇ ಬಾಕಿ ಇಲ್ಲ. ಧನ್ಯವಾದಗಳು - ${merchant.shopName}`
                     : `Hello ${settlementInfo.name}, received your payment of ₹${settlementInfo.amount}. All your dues are now cleared. Thank you - ${merchant.shopName}`;
                   const phone = settlementInfo.phone?.replace(/\D/g, '') || '';
                   window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`);
                   onClose();
                 }}
                 className="w-full bg-[#25D366] text-white py-5 rounded-[28px] font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
               >
                 <MessageSquare size={24} />
                 {isKn ? 'ವಾಟ್ಸಾಪ್ ಮೂಲಕ ಕಳುಹಿಸಿ' : 'Send via WhatsApp'}
               </button>
               <button onClick={onClose} className="text-gray-400 font-black text-sm uppercase tracking-widest">{isKn ? 'ನಂತರ ಕಳುಹಿಸಿ' : 'Send Later'}</button>
            </div>
          </div>
        ) : (
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6">
            {/* Amount Input */}
            <div className={`${darkMode ? 'bg-[#0F172A]' : 'bg-[#f1f5f9]'} rounded-[24px] p-4 md:p-6 focus-within:ring-2 focus-within:ring-[#006B4D] transition-all relative`}>
               <div className="flex items-center gap-3 md:gap-4">
                  <span className="text-2xl md:text-3xl font-black text-gray-400">₹</span>
                  <input 
                    required
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0" 
                    className={`w-full bg-transparent border-none p-0 text-3xl md:text-5xl font-black outline-hidden placeholder:text-gray-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  />
                  {paymentMode === 'upi' && type === 'payment' && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-[#006B4D] bg-[#006B4D]/10 p-2 rounded-xl"
                    >
                      <QrCode size={24} />
                    </motion.div>
                  )}
               </div>
            </div>

            {/* Select Customer if multiple */}
            {customers.length > 1 && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-4 tracking-widest">{isKn ? 'ಗ್ರಾಹಕರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ' : 'SELECT CUSTOMER'}</label>
                <select 
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className={`w-full border-none rounded-[20px] py-4 px-6 font-bold focus:ring-2 focus:ring-[#006B4D] outline-hidden appearance-none ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#f1f5f9] text-gray-800'}`}
                >
                  <option value="">{isKn ? 'ಗ್ರಾಹಕರನ್ನು ಆರಿಸಿ' : 'Choose customer'}</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Category selection (only for credit) */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">{isKn ? 'ದಿನಾಂಕ' : 'Transaction Date'}</p>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300">
                  <Calendar size={20} />
                </div>
                <input 
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className={`w-full border-none rounded-[24px] py-4 md:py-6 pl-14 md:pl-16 pr-6 font-bold focus:ring-2 focus:ring-[#006B4D] outline-hidden ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#f1f5f9] text-gray-800'}`}
                />
              </div>
            </div>

            {type === 'credit' && (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">{isKn ? 'ವರ್ಗ' : 'Category'}</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {['Groceries', 'Supplies', 'Utilities', 'Other'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-4 py-3 rounded-[20px] text-[11px] font-black transition-all border shrink-0 ${
                        category === cat 
                          ? 'bg-[#006B4D] text-white border-[#006B4D] shadow-lg shadow-[#006B4D]/20' 
                          : (darkMode ? 'bg-[#334155] border-gray-700 text-gray-300' : 'bg-white border-gray-100 text-gray-500')
                      }`}
                    >
                      {cat === 'Groceries' && isKn ? 'ದಿನಸಿ' : cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
               <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300">
                  <MessageSquare size={20} />
               </div>
               <input 
                 value={note}
                 onChange={(e) => setNote(e.target.value)}
                 placeholder={type === 'credit' ? (isKn ? "ವಸ್ತುಗಳ ವಿವರ" : "Item details (e.g. Rice 10kg)") : (isKn ? "ಪಾವತಿ ಟಿಪ್ಪಣಿ" : "Payment note")} 
                 className={`w-full border-none rounded-[24px] py-4 md:py-6 pl-14 md:pl-16 pr-6 font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-[#006B4D] outline-hidden ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#f1f5f9] text-gray-800'}`}
               />
            </div>

            {type === 'credit' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-4 tracking-widest">{isKn ? 'ಪಾವತಿ ದಿನಾಂಕ' : 'Payment Due Date'}</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300">
                    <Calendar size={20} />
                  </div>
                  <input 
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full border-none rounded-[24px] py-4 md:py-6 pl-14 md:pl-16 pr-6 font-bold focus:ring-2 focus:ring-[#006B4D] outline-hidden ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#f1f5f9] text-gray-800'}`}
                  />
                </div>
              </div>
            )}

            {type === 'payment' && (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">{isKn ? 'ಪಾವತಿ ವಿಧಾನ' : 'Payment Method'}</p>
                <div className="flex gap-2">
                  {[
                    { id: 'cash', label: isKn ? 'ನಗದು' : 'Cash', icon: Banknote },
                    { id: 'upi', label: 'UPI', icon: QrCode },
                    { id: 'bank', label: isKn ? 'ಬ್ಯಾಂಕ್' : 'Bank', icon: Landmark }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMode(mode.id as any)}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[20px] text-[11px] font-black transition-all border ${
                        paymentMode === mode.id 
                          ? 'bg-[#006B4D] text-white border-[#006B4D] shadow-lg shadow-[#006B4D]/20' 
                          : (darkMode ? 'bg-[#334155] border-gray-700 text-gray-300' : 'bg-white border-gray-100 text-gray-500')
                      }`}
                    >
                      <mode.icon size={14} />
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            disabled={isLoading || !amount}
            className={`w-full ${type === 'credit' ? 'bg-[#1E40AF] shadow-[#1E40AF]/20' : 'bg-[#006B4D] shadow-[#006B4D]/20'} text-white py-4 md:py-6 rounded-[28px] md:rounded-[32px] font-black text-lg md:text-xl flex items-center justify-center shadow-2xl active:scale-95 transition-all mt-4 disabled:opacity-50`}
          >
            {isLoading ? (isKn ? 'ಸೇವ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : "Saving...") : (isKn ? 'ಖಚಿತಪಡಿಸಿ' : (type === 'credit' ? 'Save Credit' : 'Save Payment'))}
          </button>
        </form>
        )}
      </motion.div>
    </div>
  );
}

/**
 * Add Supplier Modal
 */
function AddSupplierModal({ user, onClose, merchant }: { user: FirebaseUser, onClose: () => void, merchant: MerchantData }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isKn = merchant.preferences?.language === 'kn';
  const darkMode = merchant.preferences?.darkMode || false;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoURL(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'merchants', user.uid, 'suppliers'), {
        name,
        phone,
        address,
        notes,
        photoURL,
        pendingAmount: 0,
        avatarSeed: Math.random().toString(36).substring(7),
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className={`${darkMode ? 'bg-[#1E293B] text-white' : 'bg-white'} w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-10 shadow-2xl`}
      >
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
                 <Truck size={24} strokeWidth={3} />
              </div>
              <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{isKn ? 'ಸರಬರಾಜುದಾರರನ್ನು ಸೇರಿಸಿ' : 'Add Supplier'}</h2>
           </div>
           <button onClick={onClose} className="text-gray-400 p-2">✕</button>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center mb-4">
            <div className="relative group">
              <div className={`w-24 h-24 rounded-full overflow-hidden border-4 flex items-center justify-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-white shadow-xl'}`}>
                {photoURL ? (
                  <img src={photoURL} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Truck size={40} className="text-gray-300" />
                )}
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white active:scale-90 transition-all"
              >
                <CloudUpload size={14} />
              </button>
            </div>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {[
            { label: isKn ? 'ಹೆಸರು' : 'NAME', icon: User, placeholder: isKn ? 'ಹೆಸರು' : 'Supplier Name', value: name, setter: setName },
            { label: isKn ? 'ಮೊಬೈಲ್' : 'MOBILE', icon: Phone, placeholder: isKn ? 'ಫೋನ್ ಸಂಖ್ಯೆ' : 'Mobile Number', value: phone, setter: setPhone },
            { label: isKn ? 'ವಿಳಾಸ' : 'ADDRESS', icon: HomeIcon, placeholder: isKn ? 'ವಿಳಾಸ' : 'Supplier Address', value: address, setter: setAddress },
            { label: isKn ? 'ಟಿಪ್ಪಣಿಗಳು' : 'NOTES', icon: Pencil, placeholder: isKn ? 'ಟಿಪ್ಪಣಿಗಳು' : 'Supplier Notes', value: notes, setter: setNotes }
          ].map((field) => (
            <div key={field.label} className="space-y-2">
              <label className="text-[10px] font-black text-gray-300 uppercase ml-4 tracking-[0.15em]">{field.label} *</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
                  <field.icon size={18} />
                </div>
                <input 
                  required={field.label !== (isKn ? 'ವಿಳಾಸ' : 'ADDRESS') && field.label !== (isKn ? 'ಟಿಪ್ಪಣಿಗಳು' : 'NOTES')}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  placeholder={field.placeholder} 
                  className={`w-full border-none rounded-[20px] py-4 pl-12 pr-4 font-bold focus:ring-2 focus:ring-blue-600 outline-hidden ${darkMode ? 'bg-[#0F172A] text-white placeholder:text-gray-600' : 'bg-[#f1f5f9] text-gray-800 placeholder:text-gray-300'}`}
                />
              </div>
            </div>
          ))}

          <button 
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-6 rounded-[28px] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 active:scale-95 transition-all mt-4 disabled:opacity-50"
          >
            <Truck size={22} className="text-white" />
            {isLoading ? (isKn ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : "Saving...") : (isKn ? 'ಸರಬರಾಜುದಾರರನ್ನು ಉಳಿಸಿ' : "Save Supplier")}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/**
 * Add Supplier Transaction Modal
 */
function AddSupplierTransactionModal({ user, suppliers, type, onClose, merchant }: { user: FirebaseUser, suppliers: SupplierData[], type: 'purchase' | 'payment', onClose: () => void, merchant: MerchantData }) {
  const [supplierId, setSupplierId] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'bank'>('cash');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [settlementInfo, setSettlementInfo] = useState<{ name: string, phone: string, amount: number } | null>(null);

  const isKn = merchant.preferences?.language === 'kn';
  const darkMode = merchant.preferences?.darkMode || false;

  useEffect(() => {
    if (suppliers.length === 1) {
      setSupplierId(suppliers[0].id);
    }
  }, [suppliers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !amount) return;
    setIsLoading(true);
    try {
      const amtNum = parseFloat(amount);
      const supplier = suppliers.find(s => s.id === supplierId);
      if (!supplier) return;

      const pathForTransaction = `merchants/${user.uid}/supplierTransactions`;
      await addDoc(collection(db, pathForTransaction), {
        supplierId,
        amount: amtNum,
        type,
        category: type === 'purchase' ? category : null,
        note,
        paymentMode: type === 'payment' ? paymentMode : null,
        date: Timestamp.fromDate(new Date(transactionDate))
      }).catch(err => handleFirestoreError(err, OperationType.WRITE, pathForTransaction));

      // For supplier: purchase increases debt, payment decreases it
      const newPending = type === 'purchase' ? supplier.pendingAmount + amtNum : supplier.pendingAmount - amtNum;
      const pathForSupplier = `merchants/${user.uid}/suppliers/${supplierId}`;
      await updateDoc(doc(db, pathForSupplier), {
        pendingAmount: newPending,
        lastTransactionDate: Timestamp.fromDate(new Date(transactionDate)),
        lastTransactionAmount: amtNum,
        lastTransactionType: type,
        updatedAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.WRITE, pathForSupplier));

      const title = type === 'purchase' 
        ? (isKn ? 'ಹೊಸ ಖರೀದಿ ಎಂಟ್ರಿ' : 'New Purchase Entry')
        : (isKn ? 'ಸರಬರಾಜುದಾರರಿಗೆ ಪಾವತಿ' : 'Payment to Supplier');
      const body = type === 'purchase'
        ? (isKn ? `${supplier.name} ಇವರಿಂದ ₹${amtNum} ಖರೀದಿ ದಾಖಲಾಗಿದೆ` : `Added ₹${amtNum} purchase from ${supplier.name}`)
        : (isKn ? `${supplier.name} ಇವರಿಗೆ ₹${amtNum} ಪಾವತಿಸಲಾಗಿದೆ` : `Recorded ₹${amtNum} payment to ${supplier.name}`);
      
      sendNotification(title, body);

      if (newPending === 0) {
        setSettlementInfo({ name: supplier.name, phone: supplier.phone, amount: amtNum });
      } else {
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className={`${darkMode ? 'bg-[#1E293B] text-white' : 'bg-white'} w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-6 md:p-10 shadow-2xl relative`}
      >
        <header className="flex justify-between items-center mb-6 md:mb-10">
           <div className="flex items-center gap-3">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center ${settlementInfo ? 'bg-emerald-50 text-emerald-600' : (type === 'purchase' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600')}`}>
                 {settlementInfo ? <CheckCircle2 size={24} className="md:size-7" /> : (type === 'purchase' ? <ShoppingBag size={20} className="md:size-6" /> : <Banknote size={20} className="md:size-6" />)}
              </div>
              <div>
                <h2 className={`text-2xl font-black tracking-tight leading-none mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {settlementInfo ? (isKn ? 'ಖಾತೆ ಚುಕ್ತವಾಯಿತು!' : 'Dues Cleared!') : (type === 'purchase' ? (isKn ? 'ಖರೀದಿ ಸೇರಿಸಿ' : 'Add Purchase') : (isKn ? 'ಪಾವತಿ ಸೇರಿಸಿ' : 'Add Payment'))}
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {settlementInfo ? (isKn ? 'ಧನ್ಯವಾದಗಳು' : 'Balance is now zero') : (type === 'purchase' ? (isKn ? 'ಖರೀದಿ ಎಂಟ್ರಿ' : 'Purchase Entry') : (isKn ? 'ಸರಬರಾಜುದಾರ ಪಾವತಿ' : 'Supplier Payment'))}
                </p>
              </div>
           </div>
           <button onClick={onClose} className="text-gray-400 p-2 hover:bg-gray-100 rounded-full transition-colors">✕</button>
        </header>

        {settlementInfo ? (
          <div className="text-center space-y-8 py-6">
            <div className="space-y-2">
               <p className="text-gray-500 font-bold">{isKn ? 'ಸರಬರಾಜುದಾರರ ಎಲ್ಲಾ ಬಾಕಿ ಹಣ ಪಾವತಿಯಾಗಿದೆ' : 'All dues have been cleared for'}</p>
               <p className="text-3xl font-black text-[#006B4D]">{settlementInfo.name}</p>
            </div>

            <div className={`p-6 rounded-[32px] ${darkMode ? 'bg-[#0F172A]' : 'bg-emerald-50'} border border-emerald-100`}>
               <p className="text-xs font-bold leading-relaxed italic">
                 {isKn 
                   ? `"ನಮಸ್ಕಾರ ${settlementInfo.name}, ನಿಮ್ಮ ಸರಬರಾಜಿನ ಎಲ್ಲಾ ಬಾಕಿ ಹಣ ₹${settlementInfo.amount} ಪಾವತಿ ಮಾಡಲಾಗಿದೆ. ನಮ್ಮ ಖಾತೆಯಲ್ಲಿ ಬಾಕಿ ಶೂನ್ಯವಾಗಿದೆ. ಧನ್ಯವಾದಗಳು - ${merchant.shopName}"`
                   : `"Hello ${settlementInfo.name}, settled the pending amount of ₹${settlementInfo.amount}. Our account is now fully cleared. Thank you - ${merchant.shopName}"`}
               </p>
            </div>

            <div className="flex flex-col gap-4">
               <button 
                 onClick={() => {
                   const text = isKn 
                     ? `ನಮಸ್ಕಾರ ${settlementInfo.name}, ನಿಮ್ಮ ಸರಬರಾಜಿನ ಎಲ್ಲಾ ಬಾಕಿ ಹಣ ₹${settlementInfo.amount} ಪಾವತಿ ಮಾಡಲಾಗಿದೆ. ನಮ್ಮ ಖಾತೆಯಲ್ಲಿ ಬಾಕಿ ಶೂನ್ಯವಾಗಿದೆ. ಧನ್ಯವಾದಗಳು - ${merchant.shopName}`
                     : `Hello ${settlementInfo.name}, settled the pending amount of ₹${settlementInfo.amount}. Our account is now fully cleared. Thank you - ${merchant.shopName}`;
                   const phone = settlementInfo.phone?.replace(/\D/g, '') || '';
                   window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`);
                   onClose();
                 }}
                 className="w-full bg-[#25D366] text-white py-5 rounded-[28px] font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
               >
                 <MessageSquare size={24} />
                 {isKn ? 'ವಾಟ್ಸಾಪ್ ಮೂಲಕ ಕಳುಹಿಸಿ' : 'Send via WhatsApp'}
               </button>
               <button onClick={onClose} className="text-gray-400 font-black text-sm uppercase tracking-widest">{isKn ? 'ನಂತರ ಕಳುಹಿಸಿ' : 'Send Later'}</button>
            </div>
          </div>
        ) : (
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">{isKn ? 'ದಿನಾಂಕ' : 'Transaction Date'}</p>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300">
                  <Calendar size={20} />
                </div>
                <input 
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className={`w-full border-none rounded-[24px] py-4 md:py-6 pl-14 md:pl-16 pr-6 font-bold focus:ring-2 focus:ring-blue-600 outline-hidden ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#f1f5f9] text-gray-800'}`}
                />
              </div>
            </div>
            <div className={`${darkMode ? 'bg-[#0F172A]' : 'bg-[#f1f5f9]'} rounded-[24px] p-4 md:p-6 focus-within:ring-2 focus-within:ring-blue-600 transition-all relative`}>
               <div className="flex items-center gap-3 md:gap-4">
                  <span className="text-2xl md:text-3xl font-black text-gray-400">₹</span>
                  <input 
                    required
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0" 
                    className={`w-full bg-transparent border-none p-0 text-3xl md:text-5xl font-black outline-hidden placeholder:text-gray-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  />
                  {paymentMode === 'upi' && type === 'payment' && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-600 bg-blue-50 p-2 rounded-xl"
                    >
                      <QrCode size={24} />
                    </motion.div>
                  )}
               </div>
            </div>

            {suppliers.length > 1 && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-4 tracking-widest">{isKn ? 'ಸರಬರಾಜುದಾರರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ' : 'SELECT SUPPLIER'}</label>
                <select 
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className={`w-full border-none rounded-[20px] py-4 px-6 font-bold focus:ring-2 focus:ring-blue-600 outline-hidden appearance-none ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#f1f5f9] text-gray-800'}`}
                >
                  <option value="">{isKn ? 'ಸರಬರಾಜುದಾರರನ್ನು ಆರಿಸಿ' : 'Choose supplier'}</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {type === 'purchase' && (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">{isKn ? 'ವರ್ಗ' : 'Category'}</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {['Stock', 'Inventory', 'Equipment', 'Other'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-4 py-3 rounded-[20px] text-[11px] font-black transition-all border shrink-0 ${
                        category === cat 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' 
                          : (darkMode ? 'bg-[#334155] border-gray-700 text-gray-300' : 'bg-white border-gray-100 text-gray-500')
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
               <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300">
                  <MessageSquare size={20} />
               </div>
               <input 
                 value={note}
                 onChange={(e) => setNote(e.target.value)}
                 placeholder={type === 'purchase' ? (isKn ? "ಖರೀದಿ ವಿವರ" : "Purchase details") : (isKn ? "ಪಾವತಿ ವಿವರ" : "Payment details")} 
                 className={`w-full border-none rounded-[24px] py-4 md:py-6 pl-14 md:pl-16 pr-6 font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-blue-600 outline-hidden ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#f1f5f9] text-gray-800'}`}
               />
            </div>

            {type === 'payment' && (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">{isKn ? 'ಪಾವತಿ ವಿಧಾನ' : 'Payment Method'}</p>
                <div className="flex gap-2">
                  {[
                    { id: 'cash', label: isKn ? 'ನಗದು' : 'Cash', icon: Banknote },
                    { id: 'upi', label: 'UPI', icon: QrCode },
                    { id: 'bank', label: isKn ? 'ಬ್ಯಾಂಕ್' : 'Bank', icon: Landmark }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMode(mode.id as any)}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[20px] text-[11px] font-black transition-all border ${
                        paymentMode === mode.id 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' 
                          : (darkMode ? 'bg-[#334155] border-gray-700 text-gray-300' : 'bg-white border-gray-100 text-gray-500')
                      }`}
                    >
                      <mode.icon size={14} />
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            disabled={isLoading || !amount}
            className={`w-full ${type === 'purchase' ? 'bg-red-600 shadow-red-600/20' : 'bg-blue-600 shadow-blue-600/20'} text-white py-4 md:py-6 rounded-[28px] md:rounded-[32px] font-black text-lg md:text-xl flex items-center justify-center shadow-2xl active:scale-95 transition-all mt-4 disabled:opacity-50`}
          >
            {isLoading ? (isKn ? 'ಸೇವ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : "Saving...") : (isKn ? 'ಖಚಿತಪಡಿಸಿ' : (type === 'purchase' ? 'Save Purchase' : 'Save Payment'))}
          </button>
        </form>
        )}
      </motion.div>
    </div>
  );
}

/**
 * Registration Modal
 */
function RegistrationModal({ user, onComplete }: { user: FirebaseUser, onComplete: (data: MerchantData) => void }) {
  const [shopkeeperName, setShopkeeperName] = useState(user.displayName || '');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [upiId, setUpiId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: MerchantData = {
      shopkeeperName,
      shopName,
      phone,
      upiId,
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const path = `merchants/${user.uid}`;
    try {
      await setDoc(doc(db, path), data);
      onComplete(data);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl"
      >
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Complete Profile</h2>
        <p className="text-gray-500 mb-8">Setup your shop details to get started.</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <User size={18} />
            </div>
            <input 
              required
              value={shopkeeperName}
              onChange={(e) => setShopkeeperName(e.target.value)}
              placeholder="Shopkeeper Name" 
              className="w-full bg-[#f1f5f9] border-none rounded-2xl py-4 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#006B4D] outline-hidden"
            />
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Store size={18} />
            </div>
            <input 
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Shop Name" 
              className="w-full bg-[#f1f5f9] border-none rounded-2xl py-4 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#006B4D] outline-hidden"
            />
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Phone size={18} />
            </div>
            <input 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Mobile Number" 
              className="w-full bg-[#f1f5f9] border-none rounded-2xl py-4 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#006B4D] outline-hidden"
            />
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <QrCode size={18} />
            </div>
            <input 
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="UPI ID (Optional, e.g. name@bank)" 
              className="w-full bg-[#f1f5f9] border-none rounded-2xl py-4 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#006B4D] outline-hidden"
            />
          </div>

          <button className="w-full bg-[#006B4D] text-white py-5 rounded-full font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:bg-[#005B41] transition-all transform active:scale-95 group mt-6">
            Setup My Shop
            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [screen, setScreen] = useState<'splash' | 'auth' | 'main'>('splash');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<{ id: string; title: string; body: string }[]>([]);

  useEffect(() => {
    return subscribeToInAppNotifications((title, body) => {
      const id = Math.random().toString(36).substring(2, 11);
      setToasts(prev => [...prev.slice(-2), { id, title, body }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    });
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setMerchant(null);
        setScreen('auth');
        setIsLoading(false);
      }
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;

    // Request notification permissions
    requestNotificationPermission();

    // Check periodic reminders
    const lastNotif = localStorage.getItem('last_reminder_khata');
    const updatedNotif = checkPeriodicReminders(lastNotif);
    if (updatedNotif) {
      localStorage.setItem('last_reminder_khata', updatedNotif);
    }

    // Record login history (non-blocking)
    const historyRef = collection(db, 'merchants', user.uid, 'loginHistory');
    addDoc(historyRef, {
      timestamp: serverTimestamp(),
      device: navigator.userAgent.split(') ')[0] + ')',
      status: 'success'
    }).catch(e => console.warn("Failed to record login", e));

    const path = `merchants/${user.uid}`;
    const unsub = onSnapshot(doc(db, path), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as MerchantData;
        setMerchant(data);
        setScreen('main');
        
        if (data.preferences?.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        setIsRegistering(true);
      }
      setIsLoading(false);
    }, (err: any) => {
      console.error("Firestore listener error:", err);
      if (err.message?.includes('INTERNAL ASSERTION FAILED')) {
        // Fallback for SDK bug
        setTimeout(() => window.location.reload(), 2000);
      } else {
        handleFirestoreError(err, OperationType.GET, path);
      }
      setIsLoading(false);
    });

    return unsub;
  }, [user?.uid]);

  const handleStartRegistration = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <main className="lg:max-w-none mx-auto bg-white min-h-screen shadow-2xl relative overflow-x-hidden lg:border-none border-x border-gray-100">
      <AnimatePresence mode="wait">
        {screen === 'splash' && (
          <motion.div
            key="splash"
            className="fixed inset-0 z-[1000] bg-white"
            exit={{ opacity: 0 }}
          >
            <SplashScreen onFinish={() => setScreen(user ? 'main' : 'auth')} />
          </motion.div>
        )}

        {screen === 'auth' && (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <OnboardingScreen onStartRegistration={handleStartRegistration} isLoading={isLoading} />
          </motion.div>
        )}

        {screen === 'main' && user && merchant && (
          <motion.div
            key="main"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <DashboardScreen user={user} merchant={merchant} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global In-App Notifications - Centered Container */}
      <div className="fixed top-6 left-0 right-0 z-[9999] flex flex-col items-center gap-3 px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <NotificationToast 
              key={toast.id}
              title={toast.title}
              body={toast.body}
              onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            />
          ))}
        </AnimatePresence>
      </div>

      {isRegistering && user && (
        <RegistrationModal 
          user={user} 
          onComplete={(data) => {
            setMerchant(data);
            setIsRegistering(false);
            setScreen('main');
          }} 
        />
      )}
    </main>
  );
}
