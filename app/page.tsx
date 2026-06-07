'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Briefcase, 
  Users, 
  UserCheck, 
  ArrowRight, 
  Loader2, 
  Sun, 
  Moon, 
  Brain, 
  Clock, 
  DollarSign, 
  Mail, 
  Key, 
  Info 
} from 'lucide-react';
import styles from './page.module.css';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@fwc.com'); // Default pre-filled
  const [password, setPassword] = useState('password123'); // Default pre-filled
  const [selectedRole, setSelectedRole] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Sync theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('hrms-theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      setTheme('dark'); // Default to premium dark mode
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('hrms-theme', nextTheme);
  };

  // Redirect to dashboard if session already active
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth');
        if (res.ok) {
          router.push('/dashboard');
        }
      } catch (err) {
        // Stay on page
      }
    }
    checkSession();
  }, [router]);

  // Autofill fields when dropdown role changes for testing convenience
  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    setError('');
    
    if (role === 'admin') {
      setEmail('admin@fwc.com');
      setPassword('password123');
    } else if (role === 'recruiter') {
      setEmail('recruiter.neha@fwc.com');
      setPassword('password123');
    } else if (role === 'manager') {
      setEmail('manager.eng@fwc.com');
      setPassword('password123');
    } else if (role === 'employee') {
      setEmail('meghna.kothari.1@fwc.com');
      setPassword('password123');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errData = await response.json();
        setError(errData.error || 'Invalid email or password.');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('A connection error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to render icon next to the selected role dropdown
  const getRoleIcon = () => {
    switch (selectedRole) {
      case 'admin':
        return <Shield size={18} className={styles.inputIcon} />;
      case 'manager':
        return <Users size={18} className={styles.inputIcon} />;
      case 'recruiter':
        return <UserCheck size={18} className={styles.inputIcon} />;
      case 'employee':
        return <Briefcase size={18} className={styles.inputIcon} />;
      default:
        return <Shield size={18} className={styles.inputIcon} />;
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. LEFT PANE: Welcome & Analytics Infographics */}
      <section className={styles.welcomeSection}>
        <div className={styles.welcomeHeader}>
          <Brain size={24} style={{ color: 'var(--accent-primary)' }} />
          <span className={styles.welcomeBrand}>AI-HR Pro Suite</span>
        </div>

        <div className={styles.welcomeContent}>
          <h1 className={styles.welcomeTitle}>
            Empowering Modern Enterprises with AI & Analytics
          </h1>
          <p className={styles.welcomeSubtitle}>
            Harness the power of machine learning, automated screening chatbots, and predictive telemetry to optimize your workforce operations.
          </p>

          {/* AI Workforce graphic */}
          <div className={styles.heroGraphicWrapper}>
            <img 
              src="/login_hero.png" 
              alt="AI HR Analytics Dashboard illustration" 
              className={styles.heroGraphic}
            />
          </div>

          {/* Core Analytics Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}><Users size={20} /></div>
              <div>
                <div className={styles.statTitle}>Workforce Scale</div>
                <div className={styles.statValue}>5,009 Employees</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}><Brain size={20} /></div>
              <div>
                <div className={styles.statTitle}>AI Match Accuracy</div>
                <div className={styles.statValue}>98.4% Accuracy</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}><Clock size={20} /></div>
              <div>
                <div className={styles.statTitle}>Daily Punch Sync</div>
                <div className={styles.statValue}>Real-Time Telemetry</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}><DollarSign size={20} /></div>
              <div>
                <div className={styles.statTitle}>Bi-annual Appraisal</div>
                <div className={styles.statValue}>Adaptive Goals</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.welcomeFooter}>
          AI-HR PRO &copy; 2026. THE FUTURE OF WORKFORCE MANAGEMENT.
        </div>
      </section>

      {/* 2. RIGHT PANE: Enterprise-Grade Login Form */}
      <section className={styles.formSection}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={toggleTheme}
          style={{
            position: 'absolute',
            right: '20px',
            top: '20px',
            padding: '8px',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <h1 className={styles.logoText}>AI-HR Pro</h1>
            <p className={styles.loginSubtitle}>Smart Workforce Management Powered by AI</p>
          </div>

          <form onSubmit={handleLogin} className={styles.formGroup}>
            {/* Dropdown Role Selector */}
            <div>
              <label htmlFor="role" className={styles.inputFieldLabel}>Choose Organizational Role</label>
              <div className={styles.inputFieldWrapper}>
                {getRoleIcon()}
                <select 
                  id="role" 
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  disabled={loading}
                >
                  <option value="admin">Management Admin</option>
                  <option value="recruiter">HR Recruiter</option>
                  <option value="manager">Senior Manager</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className={styles.inputFieldLabel}>Email Address</label>
              <div className={styles.inputFieldWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  id="email"
                  type="email"
                  placeholder="e.g. name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className={styles.inputFieldLabel}>Password</label>
              <div className={styles.inputFieldWrapper}>
                <Key size={18} className={styles.inputIcon} />
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className={styles.rememberForgot}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" className={styles.checkboxInput} defaultChecked />
                <span>Remember Me</span>
              </label>
              <a href="#forgot" className={styles.forgotLink} onClick={(e) => { e.preventDefault(); alert('Please contact system administrator (admin@fwc.com) to reset password. Default credentials: password123.'); }}>
                Forgot Password?
              </a>
            </div>

            {/* Sign In button */}
            <button type="submit" className={styles.signInBtn} disabled={loading}>
              {loading ? (
                <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Sign In <ArrowRight size={16} />
                </span>
              )}
            </button>

            {error && <div className={styles.errorMsg}>{error}</div>}

            <p className={styles.restrictNote}>
              <Info size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Access is restricted based on organizational roles.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
