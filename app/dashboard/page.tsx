'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarCheck,
  DollarSign,
  Award,
  MessageSquareCode,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  Search,
  Plus,
  Check,
  AlertTriangle,
  Send,
  FileText,
  Brain,
  Clock,
  BookOpen,
  Sparkles,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Upload,
  User,
  HeartPulse,
  Loader2
} from 'lucide-react';
import styles from './dashboard.module.css';

// Define TS Interfaces locally for safety
interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'recruiter' | 'employee';
  department: string;
  designation: string;
  joiningDate: string;
  salary: number;
  performanceScore: number;
  attendanceRate: number;
  skills: string[];
  status: 'Active' | 'On Leave' | 'Terminated';
  managerId: string | null;
  burnoutRisk: 'Low' | 'Medium' | 'High';
  retentionAction: string;
  dutyStatus?: 'On Duty' | 'Off Duty';
  clockInTime?: string | null;
  clockOutTime?: string | null;
}

interface AttendanceLog {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  status: 'Present' | 'Absent' | 'On Leave' | 'Late';
  workHours: number | null;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy: string | null;
}

interface PayrollRecord {
  id: string;
  employeeId: string;
  month: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  tax: number;
  netPay: number;
  status: 'Paid' | 'Processing' | 'Held';
  paymentDate: string | null;
}

interface PerformanceGoal {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  type: 'Company' | 'Team' | 'Individual';
  dueDate: string;
  progress: number;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Deferred';
  weight: number;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  resumeText: string;
  fitmentScore: number | null;
  evaluationText: string | null;
  skillsMatched: string[];
  skillsMissing: string[];
  interviewTranscript: { role: 'bot' | 'candidate'; text: string; timestamp: string }[];
  interviewStatus: 'Not Screened' | 'Screening' | 'Shortlisted' | 'Rejected';
  customQuestions: string[];
}

const formatClockTime = (timeStr: string | null) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${hours}:${minutes} ${ampm}`;
};

export default function Dashboard() {
  const router = useRouter();

  // Core App States
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Directory View States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployeesCount, setTotalEmployeesCount] = useState(0);
  const [queryLatency, setQueryLatency] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedEmpAttendance, setSelectedEmpAttendance] = useState<AttendanceLog | null>(null);
  const [aiPredictLoading, setAiPredictLoading] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<any>(null);
  const [appraisalRating, setAppraisalRating] = useState(3);
  const [appraisalSubmitting, setAppraisalSubmitting] = useState(false);

  // Form Adding Employee State
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [newEmpForm, setNewEmpForm] = useState({
    name: '',
    email: '',
    role: 'employee' as Employee['role'],
    department: 'Engineering',
    designation: 'Software Engineer',
    salary: 75000,
    skills: ''
  });

  // Attendance Clocking states
  const [attendanceToday, setAttendanceToday] = useState<AttendanceLog | null>(null);
  const [clockLoading, setClockLoading] = useState(false);
  
  // Leaves Workflow States
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    type: 'Annual',
    reason: ''
  });
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  // Payroll Invoice States
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);
  const [disbursingPayroll, setDisbursingPayroll] = useState(false);

  // Performance OKRs states
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    type: 'Individual' as PerformanceGoal['type'],
    dueDate: '',
    weight: 10
  });

  // Policy chatbot States
  const [policyChatHistory, setPolicyChatHistory] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: 'Hello! I am your AI HR Policy Assistant. Ask me anything about work-from-home rules, leave entitlements, core working hours, or training reimbursements.' }
  ]);
  const [policyInput, setPolicyInput] = useState('');
  const [policyChatLoading, setPolicyChatLoading] = useState(false);
  const policyEndRef = useRef<HTMLDivElement>(null);

  // Recruitment States (AI Resume Screener & Chat Interview)
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobDescription, setJobDescription] = useState('Build a next-generation HRMS platform. Required Tech Stack: React, Next.js, Node.js, TypeScript, Python, Gemini API, Docker, PostgreSQL.');
  const [resumeText, setResumeText] = useState(`AARAV SEN\nAI ENGINEERING SPECIALIST\n\nProfile:\nExperienced engineer skilled in fullstack architectures and Generative AI pipelines. Over 4 years developing React dashboards and fine-tuning models.\n\nKey Skills:\n- Next.js, React, Node.js, TypeScript\n- Python, TensorFlow, PyTorch, Gemini API\n- AWS, Docker, PostgreSQL, REST APIs, Git\n\nExperience:\n- Built enterprise-grade analytics panels processing high throughput.\n- Set up serverless API functions fetching LLM responses.`);
  const [candidateNameInput, setCandidateNameInput] = useState('Aarav Sen');
  const [candidateEmailInput, setCandidateEmailInput] = useState('aarav.sen@gmail.com');
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [activeCandidateForChat, setActiveCandidateForChat] = useState<Candidate | null>(null);
  const [candidateChatInput, setCandidateChatInput] = useState('');
  const [candidateChatLoading, setCandidateChatLoading] = useState(false);
  const candChatEndRef = useRef<HTMLDivElement>(null);

  const loadDemoCandidate = (type: 'Aarav' | 'Karan' | 'Neha') => {
    if (type === 'Aarav') {
      setCandidateNameInput('Aarav Sen');
      setCandidateEmailInput('aarav.sen@gmail.com');
      setResumeText(`AARAV SEN\nAI/ML ENGINEER & FULLSTACK DEVELOPER\n\nExperience:\n- 3+ years experience building machine learning models in Python.\n- Handled deployments of custom PyTorch LLMs on AWS EC2.\n- Developed responsive frontend apps using React.js and Next.js.\n\nSkills: Python, TensorFlow, PyTorch, React.js, Next.js, Node.js, Git, SQL, Docker, AWS.`);
    } else if (type === 'Karan') {
      setCandidateNameInput('Karan Malhotra');
      setCandidateEmailInput('karan.malhotra@gmail.com');
      setResumeText(`KARAN MALHOTRA\nSENIOR BACKEND DEVELOPER\n\nExperience:\n- 4+ years experience setting up Express REST APIs and Java microservices.\n- Designed schema layouts for SQL and MongoDB.\n\nSkills: Node.js, Express, Java, Spring Boot, MySQL, MongoDB, REST APIs, Git.`);
    } else if (type === 'Neha') {
      setCandidateNameInput('Neha Sharma');
      setCandidateEmailInput('neha.sharma@gmail.com');
      setResumeText(`NEHA SHARMA\nHR SPECIALIST & TALENT ACQUISITION\n\nExperience:\n- Managed onboarding of 200+ staff members.\n- Recruiter for non-tech positions, specializing in finance and marketing.\n\nSkills: HRIS, Recruiting, Employment Law, Employee Engagement, Excel.`);
    }
  };

  // Fetch Current Session on mount
  useEffect(() => {
    async function getSession() {
      try {
        const res = await fetch('/api/auth');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          // Apply stored theme
          const savedTheme = localStorage.getItem('hrms-theme') as 'light' | 'dark';
          if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
          } else {
            document.documentElement.setAttribute('data-theme', 'dark');
          }
        } else {
          router.push('/');
        }
      } catch (err) {
        router.push('/');
      } finally {
        setLoadingSession(false);
      }
    }
    getSession();
  }, [router]);

  // Load contextual data based on active tab and role
  useEffect(() => {
    if (!currentUser) return;

    if (activeTab === 'directory') {
      fetchDirectory();
    } else if (activeTab === 'leaves') {
      fetchLeaves();
    } else if (activeTab === 'payroll') {
      fetchPayroll();
    } else if (activeTab === 'performance') {
      fetchPerformance();
    } else if (activeTab === 'recruitment') {
      fetchRecruitment();
    } else if (activeTab === 'overview') {
      fetchOverviewStats();
    }
  }, [currentUser, activeTab, currentPage, deptFilter, roleFilter, statusFilter, searchQuery]);

  // Scroll chats to bottom
  useEffect(() => {
    policyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [policyChatHistory]);

  useEffect(() => {
    candChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeCandidateForChat?.interviewTranscript]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('hrms-theme', nextTheme);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth', { method: 'DELETE' });
      if (res.ok) {
        router.push('/');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // --- API OPERATIONS ---

  // 1. Fetch employee directory with speed telemetries
  const fetchDirectory = async () => {
    try {
      let url = `/api/employees?page=${currentPage}&limit=8`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (deptFilter !== 'All') url += `&department=${encodeURIComponent(deptFilter)}`;
      if (roleFilter !== 'All') url += `&role=${roleFilter}`;
      if (statusFilter !== 'All') url += `&status=${statusFilter}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees);
        setTotalPages(data.totalPages);
        setTotalEmployeesCount(data.totalCount);
        setQueryLatency(data.queryTimeMs);
      }
    } catch (err) {
      console.error('Fetch directory error:', err);
    }
  };

  // 2. Fetch Leaves logs
  const fetchLeaves = async () => {
    try {
      const currentUserRole = currentUser?.role;
      // Admin and Managers fetch all leaves; employees get their scoped logs
      const url = currentUserRole === 'employee'
        ? `/api/attendance?leaves=true&employeeId=${currentUser?.id}`
        : `/api/attendance?leaves=true`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLeaveRequests(data.leaveRequests || []);
      }
    } catch (err) {
      console.error('Fetch leaves error:', err);
    }
  };

  // 3. Fetch Payroll payslips
  const fetchPayroll = async () => {
    try {
      const url = currentUser?.role === 'employee'
        ? `/api/payroll?employeeId=${currentUser?.id}`
        : `/api/payroll`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPayrollRecords(data.records || []);
      }
    } catch (err) {
      console.error('Fetch payroll error:', err);
    }
  };

  // 4. Fetch Performance OKRs
  const fetchPerformance = async () => {
    try {
      const url = currentUser?.role === 'employee'
        ? `/api/performance?employeeId=${currentUser?.id}`
        : `/api/performance`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setGoals(data.goals || []);
      }
    } catch (err) {
      console.error('Fetch performance error:', err);
    }
  };

  // 5. Fetch Candidates pipeline
  const fetchRecruitment = async () => {
    try {
      const res = await fetch('/api/ai/interview-chat');
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      }
    } catch (err) {
      console.error('Fetch recruitment error:', err);
    }
  };

  const fetchSelectedEmployeeAttendance = async (empId: string) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/attendance?employeeId=${empId}&date=${todayStr}`);
      if (res.ok) {
        const data = await res.json();
        if (data.logs && data.logs.length > 0) {
          setSelectedEmpAttendance(data.logs[0]);
        } else {
          setSelectedEmpAttendance(null);
        }
      } else {
        setSelectedEmpAttendance(null);
      }
    } catch (err) {
      console.error('Fetch selected employee attendance error:', err);
      setSelectedEmpAttendance(null);
    }
  };

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setAiPrediction(null);
    setAppraisalRating(emp.performanceScore);
    fetchSelectedEmployeeAttendance(emp.id);
  };

  // 6. Fetch Overview stats
  const fetchOverviewStats = async () => {
    try {
      // Fetch clock in status for today
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/attendance?employeeId=${currentUser?.id}&date=${todayStr}`);
      if (res.ok) {
        const data = await res.json();
        if (data.logs && data.logs.length > 0) {
          setAttendanceToday(data.logs[0]);
        } else {
          setAttendanceToday(null);
        }
      }
    } catch (err) {
      console.error('Fetch overview stats error:', err);
    }
  };

  // 7. Clock-In / Clock-Out Operations
  const handleClockAction = async (action: 'clockIn' | 'clockOut') => {
    setClockLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          employeeId: currentUser?.id,
          date: todayStr,
          time: timeStr
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAttendanceToday(data.log);
      }
    } catch (err) {
      console.error('Clock action failed:', err);
    } finally {
      setClockLoading(false);
    }
  };

  // 8. Submit Leave Request
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveSubmitting(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'requestLeave',
          employeeId: currentUser?.id,
          employeeName: currentUser?.name,
          startDate: leaveForm.startDate,
          endDate: leaveForm.endDate,
          type: leaveForm.type,
          reason: leaveForm.reason
        })
      });

      if (res.ok) {
        setShowLeaveModal(false);
        setLeaveForm({ startDate: '', endDate: '', type: 'Annual', reason: '' });
        fetchLeaves(); // Refresh
      }
    } catch (err) {
      console.error('Leave submission failed:', err);
    } finally {
      setLeaveSubmitting(false);
    }
  };

  // 9. Approve / Reject Leave Request
  const handleLeaveDecision = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveRequestId: id,
          status
        })
      });

      if (res.ok) {
        fetchLeaves(); // Refresh
      }
    } catch (err) {
      console.error('Leave decision update failed:', err);
    }
  };

  // 10. Admin: Disburse Payroll
  const handlePayrollDisburse = async () => {
    setDisbursingPayroll(true);
    try {
      // Create salary payment for a sample employee (e.g. EMP-00001) for this month
      const today = new Date();
      const monthStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: 'EMP-00001',
          month: monthStr,
          baseSalary: 6250, // approx
          allowances: 600,
          deductions: 300
        })
      });

      if (res.ok) {
        fetchPayroll(); // Refresh
      }
    } catch (err) {
      console.error('Disburse payroll error:', err);
    } finally {
      setDisbursingPayroll(false);
    }
  };

  // 11. Create Performance Goal
  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: currentUser?.id,
          title: goalForm.title,
          description: goalForm.description,
          type: goalForm.type,
          dueDate: goalForm.dueDate,
          weight: goalForm.weight
        })
      });

      if (res.ok) {
        setShowGoalModal(false);
        setGoalForm({ title: '', description: '', type: 'Individual', dueDate: '', weight: 10 });
        fetchPerformance();
      }
    } catch (err) {
      console.error('Goal creation failed:', err);
    }
  };

  // Update Goal Progress Slider
  const handleGoalProgressUpdate = async (id: string, progress: number) => {
    try {
      const status = progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started';
      const res = await fetch('/api/performance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, progress, status })
      });

      if (res.ok) {
        fetchPerformance();
      }
    } catch (err) {
      console.error('Goal update failed:', err);
    }
  };

  // 12. Policy virtual Chatbot
  const handlePolicyQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyInput.trim() || policyChatLoading) return;

    const query = policyInput;
    setPolicyChatHistory(prev => [...prev, { role: 'user', text: query }]);
    setPolicyInput('');
    setPolicyChatLoading(true);

    try {
      const res = await fetch('/api/ai/policy-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });

      if (res.ok) {
        const data = await res.json();
        setPolicyChatHistory(prev => [...prev, { role: 'bot', text: data.answer }]);
      } else {
        setPolicyChatHistory(prev => [...prev, { role: 'bot', text: 'Sorry, I failed to fetch the policy response.' }]);
      }
    } catch (err) {
      setPolicyChatHistory(prev => [...prev, { role: 'bot', text: 'A connection error occurred.' }]);
    } finally {
      setPolicyChatLoading(false);
    }
  };

  const submitPolicyPrompt = async (prompt: string) => {
    if (policyChatLoading) return;
    setPolicyChatHistory(prev => [...prev, { role: 'user', text: prompt }]);
    setPolicyChatLoading(true);

    try {
      const res = await fetch('/api/ai/policy-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });

      if (res.ok) {
        const data = await res.json();
        setPolicyChatHistory(prev => [...prev, { role: 'bot', text: data.answer }]);
      } else {
        setPolicyChatHistory(prev => [...prev, { role: 'bot', text: 'Sorry, I failed to fetch the policy response.' }]);
      }
    } catch (err) {
      setPolicyChatHistory(prev => [...prev, { role: 'bot', text: 'A connection error occurred.' }]);
    } finally {
      setPolicyChatLoading(false);
    }
  };

  // 13. AI Resume Screening Evaluation
  const handleResumeScreeningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (screeningLoading) return;
    setScreeningLoading(true);

    try {
      const res = await fetch('/api/ai/resume-screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: candidateNameInput,
          email: candidateEmailInput,
          resumeText,
          jobDescription
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Append result to pipeline list
        setCandidates(prev => [data.candidate, ...prev]);
        setActiveCandidateForChat(data.candidate); // Load this candidate for screening simulator!
      }
    } catch (err) {
      console.error('Screening failed:', err);
    } finally {
      setScreeningLoading(false);
    }
  };

  // 14. AI Chat Bot Candidate screening interaction simulator
  const handleCandidateChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateChatInput.trim() || candidateChatLoading || !activeCandidateForChat) return;

    const message = candidateChatInput;
    setCandidateChatInput('');
    setCandidateChatLoading(true);

    try {
      const res = await fetch('/api/ai/interview-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: activeCandidateForChat.id,
          message
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveCandidateForChat(data.candidate);
        // Refresh candidates list
        fetchRecruitment();
      }
    } catch (err) {
      console.error('Candidate chat message failed:', err);
    } finally {
      setCandidateChatLoading(false);
    }
  };

  // Start Screening chat simulation
  const startScreeningSimulation = async (candidate: Candidate) => {
    setActiveCandidateForChat(candidate);
    
    // If transcript is empty, initialize it by requesting a starting question from the bot
    if (!candidate.interviewTranscript || candidate.interviewTranscript.length === 0) {
      setCandidateChatLoading(true);
      try {
        const res = await fetch('/api/ai/interview-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateId: candidate.id,
            message: '' // Send empty to get initial bot reply
          })
        });

        if (res.ok) {
          const data = await res.json();
          setActiveCandidateForChat(data.candidate);
          fetchRecruitment();
        }
      } catch (err) {
        console.error('Init simulation error:', err);
      } finally {
        setCandidateChatLoading(false);
      }
    }
  };

  // 15. AI Attrition & Performance Predictor Diagnostics
  const runAiAttritionDiagnostic = async (employeeId: string) => {
    setAiPredictLoading(true);
    setAiPrediction(null);
    try {
      const res = await fetch('/api/ai/performance-predictor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });

      if (res.ok) {
        const data = await res.json();
        setAiPrediction(data.prediction);
        
        // Refresh selected employee details to update tags
        const empRes = await fetch(`/api/employees?search=${employeeId}`);
        if (empRes.ok) {
          const empData = await empRes.json();
          if (empData.employees && empData.employees.length > 0) {
            setSelectedEmployee(empData.employees[0]);
            // Also refresh overall directory list
            fetchDirectory();
          }
        }
      }
    } catch (err) {
      console.error('Attrition predictor failed:', err);
    } finally {
      setAiPredictLoading(false);
    }
  };

  // 16. Manage Appraisals Submit
  const handleAppraisalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setAppraisalSubmitting(true);

    try {
      const res = await fetch('/api/performance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          performanceScore: appraisalRating
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedEmployee(data.employee);
        fetchDirectory(); // Refresh
      }
    } catch (err) {
      console.error('Appraisal submission failed:', err);
    } finally {
      setAppraisalSubmitting(false);
    }
  };

  // Add Employee Form handler
  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEmpForm.name,
          email: newEmpForm.email,
          role: newEmpForm.role,
          department: newEmpForm.department,
          designation: newEmpForm.designation,
          salary: Number(newEmpForm.salary),
          skills: newEmpForm.skills.split(',').map(s => s.trim()).filter(s => s.length > 0)
        })
      });

      if (res.ok) {
        setShowAddEmpModal(false);
        setNewEmpForm({
          name: '',
          email: '',
          role: 'employee',
          department: 'Engineering',
          designation: 'Software Engineer',
          salary: 75000,
          skills: ''
        });
        fetchDirectory(); // Refresh
      }
    } catch (err) {
      console.error('Failed to create employee:', err);
    }
  };

  if (loadingSession) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#070a13', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={32} className="spinner" style={{ animation: 'spin 1s linear infinite', color: '#3b82f6', marginBottom: '15px' }} />
          <div>Verifying credentials...</div>
        </div>
      </div>
    );
  }

  const roleLabels = {
    admin: 'Management Admin',
    manager: 'Senior Manager',
    recruiter: 'HR Recruiter',
    employee: 'FWC Employee'
  };

  // Determine allowed sidebar menus
  const hasAccess = (menu: string) => {
    if (!currentUser) return false;
    const role = currentUser.role;

    if (menu === 'recruitment') {
      return role === 'admin' || role === 'recruiter';
    }
    if (menu === 'directory') {
      return role === 'admin' || role === 'manager' || role === 'recruiter';
    }
    return true; // All roles have Overview, Leaves, Payroll, Performance, Policy Q&A
  };

  return (
    <div className={styles.shell}>
      {/* Sidebar Navigation */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.avatar} style={{ width: '28px', height: '28px', fontSize: '10px' }}>AI</div>
          <span className={styles.logoText}>FWC HRMS</span>
        </div>

        <nav className={styles.sidebarMenu}>
          <button
            className={`${styles.menuItem} ${activeTab === 'overview' ? styles.activeMenuItem : ''}`}
            onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
          >
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </button>

          {hasAccess('directory') && (
            <button
              className={`${styles.menuItem} ${activeTab === 'directory' ? styles.activeMenuItem : ''}`}
              onClick={() => { setActiveTab('directory'); setSidebarOpen(false); }}
            >
              <Users size={18} />
              <span>Employees</span>
            </button>
          )}

          {hasAccess('recruitment') && (
            <button
              className={`${styles.menuItem} ${activeTab === 'recruitment' ? styles.activeMenuItem : ''}`}
              onClick={() => { setActiveTab('recruitment'); setSidebarOpen(false); }}
            >
              <UserCheck size={18} />
              <span>Recruitment</span>
            </button>
          )}

          <button
            className={`${styles.menuItem} ${activeTab === 'leaves' ? styles.activeMenuItem : ''}`}
            onClick={() => { setActiveTab('leaves'); setSidebarOpen(false); }}
          >
            <CalendarCheck size={18} />
            <span>Leaves</span>
          </button>

          <button
            className={`${styles.menuItem} ${activeTab === 'payroll' ? styles.activeMenuItem : ''}`}
            onClick={() => { setActiveTab('payroll'); setSidebarOpen(false); }}
          >
            <DollarSign size={18} />
            <span>Payroll</span>
          </button>

          <button
            className={`${styles.menuItem} ${activeTab === 'performance' ? styles.activeMenuItem : ''}`}
            onClick={() => { setActiveTab('performance'); setSidebarOpen(false); }}
          >
            <Award size={18} />
            <span>Performance</span>
          </button>

          <button
            className={`${styles.menuItem} ${activeTab === 'policy' ? styles.activeMenuItem : ''}`}
            onClick={() => { setActiveTab('policy'); setSidebarOpen(false); }}
          >
            <MessageSquareCode size={18} />
            <span>Policy Q&A</span>
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userProfile}>
            <div className={styles.avatar}>
              {currentUser?.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{currentUser?.name}</div>
              <div className={styles.userRole}>{roleLabels[currentUser?.role || 'employee']}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={toggleTheme} style={{ flex: 1, padding: '8px' }}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="btn btn-secondary" onClick={handleLogout} style={{ flex: 1, padding: '8px', color: 'var(--status-danger)' }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className={styles.mainContent}>
        <header className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className={styles.menuToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <span className={styles.headerTitle} style={{ textTransform: 'capitalize' }}>
              {activeTab} Workspace
            </span>
          </div>

          <div className={styles.headerActions}>
            <span className="badge badge-info">{roleLabels[currentUser?.role || 'employee']}</span>
            {currentUser?.role === 'employee' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {!attendanceToday ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleClockAction('clockIn')}
                    disabled={clockLoading}
                    style={{ padding: '8px 14px', fontSize: '12px' }}
                  >
                    Clock In
                  </button>
                ) : !attendanceToday.clockOut ? (
                  <button
                    className="btn btn-warning"
                    onClick={() => handleClockAction('clockOut')}
                    disabled={clockLoading}
                    style={{ padding: '8px 14px', fontSize: '12px', color: 'white' }}
                  >
                    Clock Out
                  </button>
                ) : (
                  <span className="badge badge-success">Clocked Out</span>
                )}
              </div>
            )}
          </div>
        </header>

        <main className={styles.body}>
          
          {/* TAB 1: OVERVIEW PANEL */}
          {activeTab === 'overview' && (
            <div className="animate-slide" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Top Banner */}
              <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h2>Welcome back, {currentUser?.name}!</h2>
                  <p>AI HRMS engine is running. All pipelines operational.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Gemini-powered NLP Fallback Active</span>
                </div>
              </div>

              {/* Admin metrics dashboard */}
              {currentUser?.role === 'admin' && (
                <>
                  <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}>
                      <div className={styles.metricHeader}>
                        <span>Total Workforce</span>
                        <Users size={16} className={styles.metricIcon} />
                      </div>
                      <div className={styles.metricValue}>5,009</div>
                      <div className={styles.metricSub}>96% active engagement</div>
                    </div>
                    <div className={styles.metricCard}>
                      <div className={styles.metricHeader}>
                        <span>Daily Attendance</span>
                        <Clock size={16} className={styles.metricIcon} />
                      </div>
                      <div className={styles.metricValue}>95.4%</div>
                      <div className={styles.metricSub}>Average clock-in: 09:18 AM</div>
                    </div>
                    <div className={styles.metricCard}>
                      <div className={styles.metricHeader}>
                        <span>Leaves Active</span>
                        <CalendarCheck size={16} className={styles.metricIcon} />
                      </div>
                      <div className={styles.metricValue}>12</div>
                      <div className={styles.metricSub}>8 casual, 4 sick requests</div>
                    </div>
                    <div className={styles.metricCard}>
                      <div className={styles.metricHeader}>
                        <span>Monthly Disbursements</span>
                        <DollarSign size={16} className={styles.metricIcon} />
                      </div>
                      <div className={styles.metricValue}>$424,500</div>
                      <div className={styles.metricSub}>Tax withheld: $63,675</div>
                    </div>
                  </div>

                  {/* Benchmark & Distribution panel */}
                  <div className={styles.telemetryGrid}>
                    <div className={styles.latencyPanel}>
                      <div className={styles.latencyTitle}>
                        <Brain size={16} style={{ color: '#00ff66' }} />
                        <span>SCALABILITY TELEMETRY MONITOR</span>
                      </div>
                      <div className={styles.latencyMetrics}>
                        <div className={styles.latencyStat}>
                          <span className={styles.latencyLabel}>Total Index Records</span>
                          <span className={styles.latencyNum}>5,009</span>
                        </div>
                        <div className={styles.latencyStat}>
                          <span className={styles.latencyLabel}>Average Search Latency</span>
                          <span className={styles.latencyNum}>0.098 ms</span>
                        </div>
                        <div className={styles.latencyStat}>
                          <span className={styles.latencyLabel}>Memory State</span>
                          <span className={styles.latencyNum}>Buffered</span>
                        </div>
                      </div>
                      <div className={styles.latencyTerm}>
                        <div>[2026-06-07 16:35:58] INFO: Loaded 5,009 employee objects in memory...</div>
                        <div>[2026-06-07 16:35:58] INFO: Primary B-Tree indices synchronized on fields: id, email, department.</div>
                        <div>[2026-06-07 16:36:01] TELEMETRY: Fuzzy search query "software engineer" returned 2,000 matches in 0.12ms.</div>
                        <div>[2026-06-07 16:36:04] TELEMETRY: Scoped aggregation metrics grouped by department in 0.08ms.</div>
                      </div>
                    </div>

                    {/* Custom SVG Chart */}
                    <div className={styles.svgChartCard}>
                      <h3>Department Breakdowns</h3>
                      <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                        <svg width="200" height="200" viewBox="0 0 200 200">
                          {/* Pie chart segments */}
                          <circle r="50" cx="100" cy="100" fill="transparent" stroke="var(--accent-primary)" strokeWidth="100" strokeDasharray="251 314" transform="rotate(-90 100 100)" /> {/* 40% Eng */}
                          <circle r="50" cx="100" cy="100" fill="transparent" stroke="var(--accent-secondary)" strokeWidth="100" strokeDasharray="157 314" transform="rotate(54 100 100)" />  {/* 25% Sales */}
                          <circle r="50" cx="100" cy="100" fill="transparent" stroke="var(--status-info)" strokeWidth="100" strokeDasharray="94 314" transform="rotate(144 100 100)" />    {/* 15% AI */}
                          <circle r="50" cx="100" cy="100" fill="transparent" stroke="var(--status-warning)" strokeWidth="100" strokeDasharray="63 314" transform="rotate(198 100 100)" /> {/* 10% HR */}
                          <circle r="50" cx="100" cy="100" fill="transparent" stroke="var(--status-success)" strokeWidth="100" strokeDasharray="63 314" transform="rotate(234 100 100)" /> {/* 10% Fin */}
                          <circle r="35" cx="100" cy="100" fill="var(--bg-secondary)" />
                        </svg>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: 'var(--accent-primary)', borderRadius: '50%' }}></div><span>Engineering (40%)</span></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: 'var(--accent-secondary)', borderRadius: '50%' }}></div><span>Sales (25%)</span></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: 'var(--status-info)', borderRadius: '50%' }}></div><span>AI/ML (15%)</span></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: 'var(--status-warning)', borderRadius: '50%' }}></div><span>HR (10%)</span></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: 'var(--status-success)', borderRadius: '50%' }}></div><span>Finance (10%)</span></div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Manager dashboard view */}
              {currentUser?.role === 'manager' && (
                <>
                  <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}>
                      <div className={styles.metricHeader}>
                        <span>My Department</span>
                        <Users size={16} className={styles.metricIcon} />
                      </div>
                      <div className={styles.metricValue}>
                        {currentUser.department === 'Engineering' ? '2,000' : currentUser.department === 'AI/ML' ? '750' : '500'}
                      </div>
                      <div className={styles.metricSub}>Employees managed</div>
                    </div>
                    <div className={styles.metricCard}>
                      <div className={styles.metricHeader}>
                        <span>Team OKRs Active</span>
                        <Award size={16} className={styles.metricIcon} />
                      </div>
                      <div className={styles.metricValue}>6</div>
                      <div className={styles.metricSub}>Average Completion: 64%</div>
                    </div>
                    <div className={styles.metricCard}>
                      <div className={styles.metricHeader}>
                        <span>Leaves Pending Approval</span>
                        <CalendarCheck size={16} className={styles.metricIcon} />
                      </div>
                      <div className={styles.metricValue}>2</div>
                      <div className={styles.metricSub}>Requires manager action</div>
                    </div>
                  </div>

                  {/* Team attrition risks */}
                  <div className="glass-card">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                      <HeartPulse style={{ color: 'var(--status-danger)' }} />
                      <span>AI Attrition & Burnout Dashboard</span>
                    </h3>
                    <p style={{ marginBottom: '15px' }}>AI algorithms automatically flag risk behaviors based on hours worked, attendance dips, and goal deferrals.</p>
                    
                    <div className={styles.tableWrapper}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Employee</th>
                            <th>Role</th>
                            <th>Attendance</th>
                            <th>Burnout Risk</th>
                            <th>Retention Actions Recommended</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><strong>Aniket Sharma</strong></td>
                            <td>Senior Engineer</td>
                            <td>84.5%</td>
                            <td><span className="badge badge-danger">High Risk</span></td>
                            <td>Schedule WFH day, initiate compensation package audit.</td>
                          </tr>
                          <tr>
                            <td><strong>Vihaan Joshi</strong></td>
                            <td>Associate</td>
                            <td>91.2%</td>
                            <td><span className="badge badge-warning">Medium Risk</span></td>
                            <td>Sponsor course certifications, arrange 1-on-1 career mapping.</td>
                          </tr>
                          <tr>
                            <td><strong>Aanya Reddy</strong></td>
                            <td>Lead Scientist</td>
                            <td>98.4%</td>
                            <td><span className="badge badge-success">Low Risk</span></td>
                            <td>Excellent engagement. No immediate action required.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* Employee Dashboard */}
              {currentUser?.role === 'employee' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '24px' }}>
                  
                  {/* Left Column info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className={styles.metricsGrid}>
                      <div className={styles.metricCard}>
                        <div className={styles.metricHeader}>
                          <span>Attendance Rate</span>
                          <TrendingUp size={16} className={styles.metricIcon} />
                        </div>
                        <div className={styles.metricValue}>{currentUser.attendanceRate}%</div>
                        <div className={styles.metricSub}>Year-to-date summary</div>
                      </div>
                      <div className={styles.metricCard}>
                        <div className={styles.metricHeader}>
                          <span>Annual leave balance</span>
                          <CalendarCheck size={16} className={styles.metricIcon} />
                        </div>
                        <div className={styles.metricValue}>16 days</div>
                        <div className={styles.metricSub}>4 days utilized</div>
                      </div>
                    </div>

                    {/* OKR goals subset */}
                    <div className="glass-card">
                      <h3>My Active Goals</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                        <div className={styles.goalItem}>
                          <div className={styles.goalHeader}>
                            <strong>Optimize database lookup times for HR tables</strong>
                            <span className="badge badge-info">Technical Goal</span>
                          </div>
                          <div className={styles.goalProgress}>
                            <div className={styles.progressTrack}>
                              <div className={styles.progressBar} style={{ width: '85%' }}></div>
                            </div>
                            <span>85%</span>
                          </div>
                        </div>
                        <div className={styles.goalItem}>
                          <div className={styles.goalHeader}>
                            <strong>Integrate pre-trained model APIs in demo client</strong>
                            <span className="badge badge-warning">Productivity Goal</span>
                          </div>
                          <div className={styles.goalProgress}>
                            <div className={styles.progressTrack}>
                              <div className={styles.progressBar} style={{ width: '40%' }}></div>
                            </div>
                            <span>40%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column clock widget */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-card" style={{ textAlign: 'center', padding: '30px' }}>
                      <Clock size={40} style={{ color: 'var(--accent-primary)', marginBottom: '15px' }} />
                      <h3>Virtual Punch Clock</h3>
                      <p style={{ margin: '8px 0 20px 0' }}>Punch standard workspace hours daily.</p>
                      
                      {attendanceToday ? (
                        <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Clock In:</span><strong>{attendanceToday.clockIn}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Clock Out:</span><strong>{attendanceToday.clockOut || '--:--:--'}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Status:</span><span className={`badge ${attendanceToday.status === 'Present' ? 'badge-success' : 'badge-warning'}`}>{attendanceToday.status}</span></div>
                        </div>
                      ) : (
                        <div style={{ padding: '16px', color: 'var(--text-tertiary)', marginBottom: '20px' }}>No clock-in logged today yet.</div>
                      )}

                      {!attendanceToday ? (
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleClockAction('clockIn')} disabled={clockLoading}>Clock In</button>
                      ) : !attendanceToday.clockOut ? (
                        <button className="btn btn-warning" style={{ width: '100%', color: 'white' }} onClick={() => handleClockAction('clockOut')} disabled={clockLoading}>Clock Out</button>
                      ) : (
                        <button className="btn btn-secondary" style={{ width: '100%' }} disabled>Duty Concluded</button>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: EMPLOYEE DIRECTORY */}
          {activeTab === 'directory' && hasAccess('directory') && (
            <div className="animate-slide">
              <div className="glass-card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2>Employee Directory</h2>
                    <p>Search and inspect active personnel contracts across FWC corporate structures.</p>
                  </div>
                  {currentUser?.role === 'admin' && (
                    <button className="btn btn-primary" onClick={() => setShowAddEmpModal(true)}>
                      <Plus size={16} /> Add Employee
                    </button>
                  )}
                </div>
              </div>

              {/* Query Filters */}
              <div className={styles.toolbar}>
                <div className={styles.searchBox} style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-tertiary)' }} />
                  <input
                    type="text"
                    placeholder="Search name, email, designation or ID..."
                    style={{ paddingLeft: '40px' }}
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  />
                </div>
                <select className={styles.filterSelect} value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="All">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Sales">Sales</option>
                </select>
                <select className={styles.filterSelect} value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="All">All Roles</option>
                  <option value="admin">Management Admin</option>
                  <option value="manager">Manager</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="employee">Employee</option>
                </select>
                <select className={styles.filterSelect} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>

              {/* Benchmarker Speed telemetry indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', fontFamily: 'monospace' }}>
                <Clock size={12} style={{ color: 'var(--status-success)' }} />
                <span>Database Index Query Speed:</span>
                <strong style={{ color: '#00ff66', background: '#070a13', padding: '2px 6px', borderRadius: '4px' }}>
                  {queryLatency} ms
                </strong>
                <span>(Matches: {totalEmployeesCount} records indexed)</span>
              </div>

              {/* Employees Table */}
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Risk Flag</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id} onClick={() => handleSelectEmployee(emp)}>
                        <td><strong>{emp.id}</strong></td>
                        <td>{emp.name}</td>
                        <td style={{ textTransform: 'capitalize' }}>{emp.role}</td>
                        <td>{emp.department}</td>
                        <td>{emp.designation}</td>
                        <td>
                          <span className={`badge ${emp.burnoutRisk === 'High' ? 'badge-danger' : emp.burnoutRisk === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                            {emp.burnoutRisk} Risk
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            <span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                              {emp.status}
                            </span>
                            {emp.dutyStatus === 'On Duty' ? (
                              <span className="badge badge-success" style={{ fontSize: '9px', padding: '2px 6px' }}>
                                On Duty
                              </span>
                            ) : (
                              <span className="badge badge-danger" style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(239, 68, 68, 0.08)' }}>
                                Off Duty
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {employees.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '30px' }}>
                          No matching records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className="btn btn-secondary"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    >
                      Previous
                    </button>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className="btn btn-secondary"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RECRUITMENT PIPELINE & AI SCREENING */}
          {activeTab === 'recruitment' && hasAccess('recruitment') && (
            <div className="animate-slide" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              
              {/* Left Column: AI Resume Screener */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-card">
                  <h2>AI Resume Screening & Evaluation</h2>
                  <p style={{ margin: '8px 0 20px 0' }}>Paste standard resume content and compare match ratings against custom Job Descriptions instantly.</p>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pre-fill Demo Candidate:</span>
                    <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => loadDemoCandidate('Aarav')}>Aarav (Strong AI/Fullstack)</button>
                    <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => loadDemoCandidate('Karan')}>Karan (Moderate Backend)</button>
                    <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => loadDemoCandidate('Neha')}>Neha (Low Non-Tech)</button>
                  </div>
                  
                  <form onSubmit={handleResumeScreeningSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label>Candidate Name</label>
                        <input type="text" value={candidateNameInput} onChange={(e) => setCandidateNameInput(e.target.value)} required />
                      </div>
                      <div>
                        <label>Candidate Email</label>
                        <input type="email" value={candidateEmailInput} onChange={(e) => setCandidateEmailInput(e.target.value)} required />
                      </div>
                    </div>
                    <div>
                      <label>Job Description Requirements</label>
                      <textarea rows={3} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} required />
                    </div>
                    <div>
                      <label>Resume Text Content</label>
                      <textarea rows={6} value={resumeText} onChange={(e) => setResumeText(e.target.value)} required />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={screeningLoading} style={{ alignSelf: 'flex-start' }}>
                      {screeningLoading ? (
                        <>
                          <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> Evaluating Resume...
                        </>
                      ) : (
                        <>
                          <Brain size={16} /> Screen Resume
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Candidate list pipelines */}
                <div className="glass-card">
                  <h3>Recruitment Screening Pipeline</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                    {candidates.map((cand) => (
                      <div
                        key={cand.id}
                        className={styles.goalItem}
                        style={{
                          borderLeft: activeCandidateForChat?.id === cand.id ? '4px solid var(--accent-primary)' : '1px solid var(--panel-glass-border)',
                          cursor: 'pointer'
                        }}
                        onClick={() => startScreeningSimulation(cand)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>{cand.name}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{cand.email}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {cand.fitmentScore !== null && (
                              <span style={{ fontWeight: 800, color: cand.fitmentScore >= 70 ? 'var(--status-success)' : 'var(--status-warning)' }}>
                                {cand.fitmentScore}% Match
                              </span>
                            )}
                            <span className={`badge ${cand.interviewStatus === 'Shortlisted' ? 'badge-success' : cand.interviewStatus === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
                              {cand.interviewStatus}
                            </span>
                          </div>
                        </div>
                        {cand.evaluationText && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '8px', borderRadius: '4px', marginTop: '6px' }}>
                            {cand.evaluationText}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={(e) => { e.stopPropagation(); startScreeningSimulation(cand); }}>
                            {cand.interviewTranscript && cand.interviewTranscript.length > 0 ? 'Resume Interview' : 'Start AI Interview'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: AI Chat interview Simulator */}
              <div>
                {activeCandidateForChat ? (
                  <div className={styles.chatContainer}>
                    <div className={styles.chatHeader}>
                      <div>
                        <h3>AI Interview Bot</h3>
                        <p style={{ fontSize: '11px' }}>Candidate Screen: <strong>{activeCandidateForChat.name}</strong></p>
                      </div>
                      <div className={styles.chatStatus}>
                        <div className={styles.chatDot}></div>
                        <span>Active Bot Simulation</span>
                      </div>
                    </div>

                    <div className={styles.chatMessages}>
                      {activeCandidateForChat.interviewTranscript && activeCandidateForChat.interviewTranscript.map((msg, index) => (
                        <div
                          key={index}
                          className={`${styles.chatMsg} ${msg.role === 'bot' ? styles.chatMsgBot : styles.chatMsgUser}`}
                        >
                          <div>{msg.text}</div>
                        </div>
                      ))}
                      {candidateChatLoading && (
                        <div className={`${styles.chatMsg} ${styles.chatMsgBot}`} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                          <span>AI Recruiter typing...</span>
                        </div>
                      )}
                      <div ref={candChatEndRef}></div>
                    </div>

                    {activeCandidateForChat.interviewStatus !== 'Shortlisted' && activeCandidateForChat.interviewStatus !== 'Rejected' ? (
                      <form onSubmit={handleCandidateChatSubmit} className={styles.chatInputArea}>
                        <input
                          type="text"
                          placeholder="Type candidate's answer here..."
                          value={candidateChatInput}
                          onChange={(e) => setCandidateChatInput(e.target.value)}
                          disabled={candidateChatLoading}
                          required
                        />
                        <button type="submit" className="btn btn-primary" disabled={candidateChatLoading}>
                          <Send size={16} />
                        </button>
                      </form>
                    ) : (
                      <div style={{ padding: '20px', background: 'var(--bg-tertiary)', textAlign: 'center', borderTop: '1px solid var(--panel-glass-border)' }}>
                        <Check size={24} style={{ color: 'var(--status-success)', marginBottom: '8px' }} />
                        <h4>Interview Concluded</h4>
                        <p style={{ fontSize: '12px' }}>Final Status: <strong style={{ color: activeCandidateForChat.interviewStatus === 'Shortlisted' ? 'var(--status-success)' : 'var(--status-danger)' }}>{activeCandidateForChat.interviewStatus}</strong></p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <Brain size={40} style={{ marginBottom: '15px' }} />
                    <h4>AI Interview Room</h4>
                    <p>Select a candidate or screen a new resume on the left to start the interactive AI screening chatbot simulator.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: LEAVES WORKFLOW */}
          {activeTab === 'leaves' && (
            <div className="animate-slide" style={{ display: 'grid', gridTemplateColumns: currentUser?.role === 'employee' ? '1.2fr 1fr' : '1fr', gap: '24px' }}>
              
              {/* Leaves log table */}
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3>Leave Applications Panel</h3>
                  {currentUser?.role === 'employee' && (
                    <button className="btn btn-primary" onClick={() => setShowLeaveModal(true)}>
                      Request Leave
                    </button>
                  )}
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Type</th>
                        <th>Starts</th>
                        <th>Ends</th>
                        <th>Reason</th>
                        <th>Status</th>
                        {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {leaveRequests.map((req) => (
                        <tr key={req.id}>
                          <td><strong>{req.employeeName}</strong></td>
                          <td>{req.type}</td>
                          <td>{req.startDate}</td>
                          <td>{req.endDate}</td>
                          <td style={{ fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.reason}</td>
                          <td>
                            <span className={`badge ${req.status === 'Approved' ? 'badge-success' : req.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
                              {req.status}
                            </span>
                          </td>
                          {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                            <td>
                              {req.status === 'Pending' ? (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '11px' }} onClick={() => handleLeaveDecision(req.id, 'Approved')}>Approve</button>
                                  <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '11px', color: 'var(--status-danger)' }} onClick={() => handleLeaveDecision(req.id, 'Rejected')}>Reject</button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>By: {req.approvedBy}</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                      {leaveRequests.length === 0 && (
                        <tr>
                          <td colSpan={(currentUser?.role === 'admin' || currentUser?.role === 'manager') ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '35px' }}>
                            No leave requests found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Employee leave balances stats summary (if employee role) */}
              {currentUser?.role === 'employee' && (
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3>Leave Allocations Overview</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}><span>Paid Annual Leaves</span><strong>16 / 20 Remaining</strong></div>
                      <div className={styles.progressTrack}><div className={styles.progressBar} style={{ width: '80%' }}></div></div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}><span>Sick Leaves</span><strong>10 / 10 Remaining</strong></div>
                      <div className={styles.progressTrack}><div className={styles.progressBar} style={{ width: '100%', background: 'var(--status-info)' }}></div></div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}><span>Casual Leaves</span><strong>5 / 5 Remaining</strong></div>
                      <div className={styles.progressTrack}><div className={styles.progressBar} style={{ width: '100%', background: 'var(--status-success)' }}></div></div>
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-tertiary)', background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px' }}>
                    <strong>Note:</strong> Leave balances reset annually on Jan 1st. Unused annual leaves roll over up to a maximum of 5 days.
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 5: PAYROLL INVOICES */}
          {activeTab === 'payroll' && (
            <div className="animate-slide">
              <div className="glass-card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3>Payroll Ledger</h3>
                    <p>Track allowances, tax withholdings, and monthly payslip invoice disbursements.</p>
                  </div>
                  {currentUser?.role === 'admin' && (
                    <button className="btn btn-primary" onClick={handlePayrollDisburse} disabled={disbursingPayroll}>
                      {disbursingPayroll ? 'Processing...' : 'Disburse Demo Salary ($6,250)'}
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Record ID</th>
                      <th>Month</th>
                      <th>Base Salary</th>
                      <th>Allowances</th>
                      <th>Deductions</th>
                      <th>Income Tax</th>
                      <th>Net Pay</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollRecords.map((pay) => (
                      <tr key={pay.id}>
                        <td><strong>{pay.id}</strong></td>
                        <td>{pay.month}</td>
                        <td>${pay.baseSalary}</td>
                        <td>+${pay.allowances}</td>
                        <td>-${pay.deductions}</td>
                        <td>-${pay.tax}</td>
                        <td><strong>${pay.netPay}</strong></td>
                        <td>
                          <span className={`badge ${pay.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                            {pay.status}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setSelectedPayslip(pay)}>
                            View Invoice
                          </button>
                        </td>
                      </tr>
                    ))}
                    {payrollRecords.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '30px' }}>
                          No payroll records matching search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: PERFORMANCE OKRs */}
          {activeTab === 'performance' && (
            <div className="animate-slide">
              <div className="glass-card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3>Performance Goals (OKRs)</h3>
                    <p>Assign targets, check-in progress, and update evaluation key outcomes.</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => setShowGoalModal(true)}>
                    <Plus size={16} /> New Goal
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {goals.map((goal) => (
                  <div key={goal.id} className={styles.goalItem} style={{ background: 'var(--bg-secondary)', padding: '20px' }}>
                    <div className={styles.goalHeader}>
                      <div>
                        <span className="badge badge-info" style={{ marginBottom: '8px' }}>{goal.type} Goal</span>
                        <h4 style={{ margin: 0 }}>{goal.title}</h4>
                      </div>
                      <span className={`badge ${goal.status === 'Completed' ? 'badge-success' : goal.status === 'In Progress' ? 'badge-warning' : 'badge-danger'}`}>
                        {goal.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', margin: '8px 0' }}>{goal.description}</p>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                      Due Date: <strong>{goal.dueDate}</strong> | Weight: <strong>{goal.weight}%</strong>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div className={styles.goalProgress}>
                        <div className={styles.progressTrack}>
                          <div className={styles.progressBar} style={{ width: `${goal.progress}%` }}></div>
                        </div>
                        <span>{goal.progress}%</span>
                      </div>
                      {currentUser?.id === goal.employeeId && (
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="10"
                          value={goal.progress}
                          onChange={(e) => handleGoalProgressUpdate(goal.id, Number(e.target.value))}
                          style={{ padding: 0, marginTop: '8px', cursor: 'pointer' }}
                        />
                      )}
                    </div>
                  </div>
                ))}
                {goals.length === 0 && (
                  <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    No performance goals registered yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: AI HR POLICY VIRTUAL ASSISTANT */}
          {activeTab === 'policy' && (
            <div className="animate-slide">
              <div className="glass-card" style={{ marginBottom: '20px' }}>
                <h2>Smart HR Policy Virtual Assistant</h2>
                <p>Chat with our AI bot to clear up questions about company guidelines, allowances, WFH boundaries, and office rules.</p>
              </div>

              <div className={styles.chatContainer} style={{ height: '540px' }}>
                <div className={styles.chatHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Brain size={20} style={{ color: 'var(--accent-primary)' }} />
                    <div>
                      <strong>Handbook Assistant Bot</strong>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Answers synced with Corporate Handbook</div>
                    </div>
                  </div>
                  <div className={styles.chatStatus}>
                    <div className={styles.chatDot}></div>
                    <span>Online</span>
                  </div>
                </div>

                <div className={styles.chatMessages} style={{ background: 'var(--bg-primary)' }}>
                  {policyChatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`${styles.chatMsg} ${msg.role === 'bot' ? styles.chatMsgBot : styles.chatMsgUser}`}
                      style={{ whiteSpace: 'pre-line' }}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {policyChatLoading && (
                    <div className={`${styles.chatMsg} ${styles.chatMsgBot}`} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Assistant searching guidelines...</span>
                    </div>
                  )}
                  <div ref={policyEndRef}></div>
                </div>

                {/* Clickable suggested questions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 16px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--panel-glass-border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suggested Handbook Questions:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {[
                      "How many paid leaves do I get?",
                      "What is the hybrid model schedule?",
                      "Will the company reimburse certification fees?",
                      "What are the core collaboration hours?",
                      "When are appraisals conducted?"
                    ].map((q, idx) => (
                      <button
                        key={idx}
                        className="badge badge-info"
                        onClick={() => submitPolicyPrompt(q)}
                        disabled={policyChatLoading}
                        style={{
                          border: '1px solid rgba(6, 182, 212, 0.2)',
                          cursor: 'pointer',
                          padding: '6px 12px',
                          background: 'rgba(6, 182, 212, 0.05)',
                          textTransform: 'none',
                          borderRadius: '16px',
                          color: 'var(--status-info)',
                          fontSize: '11px',
                          transition: 'all 0.2s ease',
                          userSelect: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(6, 182, 212, 0.15)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(6, 182, 212, 0.05)';
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handlePolicyQuerySubmit} className={styles.chatInputArea} style={{ background: 'var(--bg-secondary)' }}>
                  <input
                    type="text"
                    placeholder="Ask e.g. How many annual leaves do I get? or What is the policy for WFH?"
                    value={policyInput}
                    onChange={(e) => setPolicyInput(e.target.value)}
                    disabled={policyChatLoading}
                    required
                  />
                  <button type="submit" className="btn btn-primary" disabled={policyChatLoading}>
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* --- DRAWERS AND MODALS --- */}

      {/* 1. Employee Detail Slide Drawer */}
      {selectedEmployee && (
        <>
          <div className={styles.backdrop} onClick={() => setSelectedEmployee(null)}></div>
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div>
                <span className="badge badge-info">{selectedEmployee.id}</span>
                <h2>{selectedEmployee.name}</h2>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedEmployee(null)} style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.drawerContent}>
              <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '10px' }}>
                <h4 style={{ marginBottom: '12px' }}>Professional Profile</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div><span>Email:</span><div style={{ fontWeight: 600 }}>{selectedEmployee.email}</div></div>
                  <div><span>Role:</span><div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{selectedEmployee.role}</div></div>
                  <div><span>Department:</span><div style={{ fontWeight: 600 }}>{selectedEmployee.department}</div></div>
                  <div><span>Designation:</span><div style={{ fontWeight: 600 }}>{selectedEmployee.designation}</div></div>
                  <div><span>Salary:</span><div style={{ fontWeight: 600 }}>${selectedEmployee.salary.toLocaleString()}/yr</div></div>
                  <div><span>Joined:</span><div style={{ fontWeight: 600 }}>{selectedEmployee.joiningDate}</div></div>
                </div>
              </div>

              {/* Daily Duty Status Block */}
              <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ margin: 0 }}>Daily Duty Status</h4>
                <div>
                  {selectedEmpAttendance ? (
                    selectedEmpAttendance.clockOut ? (
                      <span className="badge badge-warning" style={{ gap: '6px', textTransform: 'none' }}>
                        <Clock size={12} /> Off Duty (Clocked Out at {formatClockTime(selectedEmpAttendance.clockOut)})
                      </span>
                    ) : (
                      <span className="badge badge-success" style={{ gap: '6px', textTransform: 'none' }}>
                        <Clock size={12} /> On Duty (Clocked In at {formatClockTime(selectedEmpAttendance.clockIn)})
                      </span>
                    )
                  ) : (
                    <span className="badge badge-danger" style={{ gap: '6px', textTransform: 'none', background: 'rgba(239, 68, 68, 0.08)' }}>
                      <Clock size={12} /> Off Duty (Not Clocked In)
                    </span>
                  )}
                </div>
              </div>

              {/* Skills Tags */}
              <div>
                <h4 style={{ marginBottom: '8px' }}>Technical Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedEmployee.skills && selectedEmployee.skills.map((skill, index) => (
                    <span key={index} className="badge badge-info" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', textTransform: 'none' }}>
                      {skill}
                    </span>
                  ))}
                  {(!selectedEmployee.skills || selectedEmployee.skills.length === 0) && (
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>No skills documented.</span>
                  )}
                </div>
              </div>

              {/* AI performance & attrition predictor widget */}
              <div className="glass-card" style={{ border: '1px solid rgba(139, 92, 246, 0.2)', background: 'rgba(139, 92, 246, 0.02)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain size={18} style={{ color: 'var(--accent-secondary)' }} />
                  <span>AI Predictive Analytics Diagnostics</span>
                </h3>
                <p style={{ fontSize: '12px', margin: '4px 0 16px 0' }}>Calculate attrition probability & future performance using predictive intelligence.</p>

                {aiPredictLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Loader2 size={24} className="spinner" style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-secondary)', marginBottom: '8px' }} />
                    <div style={{ fontSize: '12px' }}>Executing predictive model...</div>
                  </div>
                ) : aiPrediction ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Attrition Probability</span>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: aiPrediction.attritionProbability >= 70 ? 'var(--status-danger)' : aiPrediction.attritionProbability >= 35 ? 'var(--status-warning)' : 'var(--status-success)' }}>
                          {aiPrediction.attritionProbability}%
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Predicted Score</span>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-primary)' }}>
                          {aiPrediction.performanceScore} / 5
                        </div>
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>AI Retention Recommendation</div>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{aiPrediction.retentionRecommendation}</strong>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px', border: '1px solid var(--panel-glass-border)' }}>
                      {aiPrediction.justification}
                    </p>
                  </div>
                ) : (
                  <button className="btn btn-primary" style={{ background: 'var(--gradient-accent)', width: '100%' }} onClick={() => runAiAttritionDiagnostic(selectedEmployee.id)}>
                    <Sparkles size={14} /> Run Attrition Diagnostic
                  </button>
                )}
              </div>

              {/* Manager appraisal reviewer form */}
              {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '10px' }}>
                  <h4>Manager Appraisal Review</h4>
                  <form onSubmit={handleAppraisalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                    <div>
                      <label>Appraisal Rating Score (1-5 Stars)</label>
                      <select value={appraisalRating} onChange={(e) => setAppraisalRating(Number(e.target.value))}>
                        <option value={1}>1 Star - Unsatisfactory</option>
                        <option value={2}>2 Stars - Needs Improvement</option>
                        <option value={3}>3 Stars - Satisfactory</option>
                        <option value={4}>4 Stars - Exceeds Expectations</option>
                        <option value={5}>5 Stars - Outstanding</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={appraisalSubmitting}>
                      {appraisalSubmitting ? 'Submitting...' : 'Save Performance appraisal'}
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>
        </>
      )}

      {/* 2. Add Employee Modal */}
      {showAddEmpModal && (
        <div className={styles.backdrop} onClick={() => setShowAddEmpModal(false)}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', zIndex: 110, position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Add Corporate Record</h3>
              <button className="btn btn-secondary" onClick={() => setShowAddEmpModal(false)} style={{ padding: '4px' }}><X size={16} /></button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label>Full Name</label><input type="text" placeholder="Johnathan Doe" value={newEmpForm.name} onChange={(e) => setNewEmpForm({ ...newEmpForm, name: e.target.value })} required /></div>
              <div><label>Corporate Email</label><input type="email" placeholder="john.doe.1@fwc.com" value={newEmpForm.email} onChange={(e) => setNewEmpForm({ ...newEmpForm, email: e.target.value })} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label>Role</label>
                  <select value={newEmpForm.role} onChange={(e) => setNewEmpForm({ ...newEmpForm, role: e.target.value as Employee['role'] })}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label>Department</label>
                  <select value={newEmpForm.department} onChange={(e) => setNewEmpForm({ ...newEmpForm, department: e.target.value })}>
                    <option value="Engineering">Engineering</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label>Designation</label><input type="text" placeholder="Software Engineer" value={newEmpForm.designation} onChange={(e) => setNewEmpForm({ ...newEmpForm, designation: e.target.value })} required /></div>
                <div><label>Salary ($/yr)</label><input type="number" placeholder="75000" value={newEmpForm.salary} onChange={(e) => setNewEmpForm({ ...newEmpForm, salary: Number(e.target.value) })} required /></div>
              </div>
              <div><label>Skills (Comma-separated)</label><input type="text" placeholder="React, Node.js, Python" value={newEmpForm.skills} onChange={(e) => setNewEmpForm({ ...newEmpForm, skills: e.target.value })} /></div>

              <button type="submit" className="btn btn-primary">Create Employee</button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Leave Application Request Modal */}
      {showLeaveModal && (
        <div className={styles.backdrop} onClick={() => setShowLeaveModal(false)}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '450px', zIndex: 110, position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Apply for Leave</h3>
              <button className="btn btn-secondary" onClick={() => setShowLeaveModal(false)} style={{ padding: '4px' }}><X size={16} /></button>
            </div>

            <form onSubmit={handleLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label>Start Date</label><input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} required /></div>
                <div><label>End Date</label><input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} required /></div>
              </div>
              <div>
                <label>Leave Type</label>
                <select value={leaveForm.type} onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}>
                  <option value="Sick">Sick Leave</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Annual">Annual Paid Leave</option>
                  <option value="Maternity/Paternity">Maternity/Paternity Leave</option>
                </select>
              </div>
              <div><label>Reason</label><textarea rows={3} placeholder="Please provide leave context..." value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} required /></div>

              <button type="submit" className="btn btn-primary" disabled={leaveSubmitting}>
                {leaveSubmitting ? 'Submitting...' : 'Apply Leave'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Interactive Payslip Invoice Modal */}
      {selectedPayslip && (
        <div className={styles.backdrop} onClick={() => setSelectedPayslip(null)}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', zIndex: 110, position: 'relative', background: '#fff', color: '#0d1527', fontFamily: 'monospace' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0d1527', paddingBottom: '10px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ color: '#0d1527', margin: 0 }}>FWC IT SERVICES</h2>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Corporate HQ, Dubai/Singapore</div>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedPayslip(null)} style={{ padding: '4px', background: '#e2e8f0', color: '#0d1527' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '20px' }}>
              <div>
                <span>Payslip To:</span>
                <div style={{ fontWeight: 'bold' }}>Employee ID: {selectedPayslip.employeeId}</div>
                <div>Disbursal Month: {selectedPayslip.month}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>Payslip ID: {selectedPayslip.id}</div>
                <div>Status: <strong style={{ color: '#10b981' }}>{selectedPayslip.status}</strong></div>
                <div>Payment Date: {selectedPayslip.paymentDate}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', padding: '12px 0', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Base Salary</span><span>+${selectedPayslip.baseSalary.toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Allowances</span><span>+${selectedPayslip.allowances.toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Deductions (PF/Ins)</span><span>-${selectedPayslip.deductions.toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Withheld Income Tax</span><span>-${selectedPayslip.tax.toLocaleString()}</span></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', borderBottom: '2px solid #0d1527', paddingBottom: '10px', marginBottom: '30px' }}>
              <span>NET TAKE-HOME PAY</span>
              <span>${selectedPayslip.netPay.toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '10px', color: '#64748b' }}>
              <div>
                <div>Systems Authorized Payment.</div>
                <div>No physical signature required.</div>
              </div>
              <div style={{ textAlign: 'center', borderTop: '1px solid #64748b', width: '120px', paddingTop: '4px' }}>
                HR Auditor
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Create Goal Modal */}
      {showGoalModal && (
        <div className={styles.backdrop} onClick={() => setShowGoalModal(false)}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '450px', zIndex: 110, position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Create New Goal Target</h3>
              <button className="btn btn-secondary" onClick={() => setShowGoalModal(false)} style={{ padding: '4px' }}><X size={16} /></button>
            </div>

            <form onSubmit={handleGoalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label>Goal Title</label><input type="text" placeholder="e.g. Optimize website load speed" value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} required /></div>
              <div><label>Description</label><textarea rows={3} placeholder="Key outcomes expected..." value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label>Type</label>
                  <select value={goalForm.type} onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value as PerformanceGoal['type'] })}>
                    <option value="Individual">Individual</option>
                    <option value="Team">Team</option>
                    <option value="Company">Company</option>
                  </select>
                </div>
                <div><label>Weight (%)</label><input type="number" min="5" max="100" value={goalForm.weight} onChange={(e) => setGoalForm({ ...goalForm, weight: Number(e.target.value) })} required /></div>
              </div>
              <div><label>Due Date</label><input type="date" value={goalForm.dueDate} onChange={(e) => setGoalForm({ ...goalForm, dueDate: e.target.value })} required /></div>

              <button type="submit" className="btn btn-primary">Create Goal</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
