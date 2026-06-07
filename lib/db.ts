import fs from 'fs';
import path from 'path';

// Define TS Interfaces for our database entities
export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'recruiter' | 'employee';
  department: string;
  designation: string;
  joiningDate: string;
  salary: number;
  performanceScore: number; // 1-5
  attendanceRate: number; // 0-100 %
  skills: string[];
  status: 'Active' | 'On Leave' | 'Terminated';
  managerId: string | null;
  burnoutRisk: 'Low' | 'Medium' | 'High';
  retentionAction: string;
}

export interface AttendanceLog {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // HH:MM:SS
  clockOut: string | null; // HH:MM:SS
  status: 'Present' | 'Absent' | 'On Leave' | 'Late';
  workHours: number | null;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: 'Sick' | 'Casual' | 'Annual' | 'Maternity/Paternity';
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy: string | null;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  month: string; // YYYY-MM
  baseSalary: number;
  allowances: number;
  deductions: number;
  tax: number;
  netPay: number;
  status: 'Paid' | 'Processing' | 'Held';
  paymentDate: string | null;
}

export interface PerformanceGoal {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  type: 'Company' | 'Team' | 'Individual';
  dueDate: string;
  progress: number; // 0-100
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Deferred';
  weight: number;
}

export interface Candidate {
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

interface DBStructure {
  employees: Employee[];
  attendanceLogs: AttendanceLog[];
  leaveRequests: LeaveRequest[];
  payrollRecords: PayrollRecord[];
  performanceGoals: PerformanceGoal[];
  candidates: Candidate[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'db.json');

class LocalDB {
  private data: DBStructure = {
    employees: [],
    attendanceLogs: [],
    leaveRequests: [],
    payrollRecords: [],
    performanceGoals: [],
    candidates: []
  };

  private indexes = {
    employeesById: new Map<string, Employee>(),
    employeesByEmail: new Map<string, Employee>(),
    employeesByDepartment: new Map<string, Employee[]>(),
  };

  private saveTimeout: NodeJS.Timeout | null = null;
  private isLoaded = false;

  constructor() {
    this.init();
  }

  // Synchronous check to load from disk
  private init() {
    if (this.isLoaded) return;

    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.data = JSON.parse(fileContent);
        this.rebuildIndexes();
        this.isLoaded = true;
      } catch (err) {
        console.error('Failed to parse database file, starting clean:', err);
        this.saveImmediately();
        this.isLoaded = true;
      }
    } else {
      this.saveImmediately();
      this.isLoaded = true;
    }
  }

  // Force rebuild of indexes in-memory
  private rebuildIndexes() {
    this.indexes.employeesById.clear();
    this.indexes.employeesByEmail.clear();
    this.indexes.employeesByDepartment.clear();

    for (const emp of this.data.employees) {
      this.indexes.employeesById.set(emp.id, emp);
      this.indexes.employeesByEmail.set(emp.email.toLowerCase(), emp);

      const deptList = this.indexes.employeesByDepartment.get(emp.department) || [];
      deptList.push(emp);
      this.indexes.employeesByDepartment.set(emp.department, deptList);
    }
  }

  // Asynchronous Debounced Save to disk to avoid write-blocking
  private queueSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveImmediately();
    }, 1000); // 1 second debounce
  }

  private saveImmediately() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing database to disk:', err);
    }
  }

  // --- QUERY METHODS ---

  public getEmployees(options?: {
    search?: string;
    department?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    this.init();
    let result = [...this.data.employees];

    // 1. Filter by Department (Uses O(1) Index Lookup if no search, otherwise filters list)
    if (options?.department && options.department !== 'All') {
      result = this.indexes.employeesByDepartment.get(options.department) || [];
    }

    // 2. Filter by Role
    if (options?.role && options.role !== 'All') {
      result = result.filter(emp => emp.role === options.role);
    }

    // 3. Filter by Status
    if (options?.status && options.status !== 'All') {
      result = result.filter(emp => emp.status === options.status);
    }

    // 4. Fuzzy Search (Case-insensitive)
    if (options?.search) {
      const query = options.search.toLowerCase();
      result = result.filter(
        emp =>
          emp.name.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query) ||
          emp.designation.toLowerCase().includes(query) ||
          emp.id.toLowerCase().includes(query)
      );
    }

    // 5. Pagination
    const totalCount = result.length;
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    return {
      employees: result.slice(startIndex, endIndex),
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      page,
      limit
    };
  }

  public getEmployeeById(id: string): Employee | null {
    this.init();
    return this.indexes.employeesById.get(id) || null;
  }

  public getEmployeeByEmail(email: string): Employee | null {
    this.init();
    return this.indexes.employeesByEmail.get(email.toLowerCase()) || null;
  }

  public createEmployee(empData: Omit<Employee, 'id'>): Employee {
    this.init();
    const id = `EMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newEmp: Employee = { ...empData, id };
    this.data.employees.push(newEmp);

    // Update indexes
    this.indexes.employeesById.set(id, newEmp);
    this.indexes.employeesByEmail.set(newEmp.email.toLowerCase(), newEmp);
    const deptList = this.indexes.employeesByDepartment.get(newEmp.department) || [];
    deptList.push(newEmp);
    this.indexes.employeesByDepartment.set(newEmp.department, deptList);

    this.queueSave();
    return newEmp;
  }

  public updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    this.init();
    const emp = this.indexes.employeesById.get(id);
    if (!emp) return null;

    const oldDept = emp.department;
    const oldEmail = emp.email.toLowerCase();

    // Apply updates
    Object.assign(emp, updates);

    // Re-index changes if email or department changed
    if (updates.email && updates.email.toLowerCase() !== oldEmail) {
      this.indexes.employeesByEmail.delete(oldEmail);
      this.indexes.employeesByEmail.set(updates.email.toLowerCase(), emp);
    }
    if (updates.department && updates.department !== oldDept) {
      const oldDeptList = this.indexes.employeesByDepartment.get(oldDept) || [];
      this.indexes.employeesByDepartment.set(
        oldDept,
        oldDeptList.filter(e => e.id !== id)
      );

      const newDeptList = this.indexes.employeesByDepartment.get(updates.department) || [];
      newDeptList.push(emp);
      this.indexes.employeesByDepartment.set(updates.department, newDeptList);
    }

    this.queueSave();
    return emp;
  }

  // --- ATTENDANCE METHODS ---

  public getAttendanceLogs(employeeId?: string, date?: string) {
    this.init();
    let logs = this.data.attendanceLogs;
    if (employeeId) {
      logs = logs.filter(log => log.employeeId === employeeId);
    }
    if (date) {
      logs = logs.filter(log => log.date === date);
    }
    return logs;
  }

  public clockIn(employeeId: string, date: string, time: string): AttendanceLog {
    this.init();
    // Check if already clocked in for the date
    const existing = this.data.attendanceLogs.find(
      log => log.employeeId === employeeId && log.date === date
    );

    if (existing) {
      return existing;
    }

    const isLate = time > '09:30:00';
    const log: AttendanceLog = {
      id: `ATT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      employeeId,
      date,
      clockIn: time,
      clockOut: null,
      status: isLate ? 'Late' : 'Present',
      workHours: null
    };

    this.data.attendanceLogs.push(log);
    this.queueSave();
    return log;
  }

  public clockOut(employeeId: string, date: string, time: string): AttendanceLog | null {
    this.init();
    const log = this.data.attendanceLogs.find(
      l => l.employeeId === employeeId && l.date === date
    );

    if (!log) return null;

    log.clockOut = time;
    
    // Calculate work hours
    const [inH, inM, inS] = log.clockIn.split(':').map(Number);
    const [outH, outM, outS] = time.split(':').map(Number);
    
    const inDate = new Date(2000, 0, 1, inH, inM, inS || 0);
    const outDate = new Date(2000, 0, 1, outH, outM, outS || 0);
    
    const diffMs = outDate.getTime() - inDate.getTime();
    log.workHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    this.queueSave();
    return log;
  }

  // --- LEAVE METHODS ---

  public getLeaveRequests(employeeId?: string) {
    this.init();
    if (employeeId) {
      return this.data.leaveRequests.filter(req => req.employeeId === employeeId);
    }
    return this.data.leaveRequests;
  }

  public createLeaveRequest(reqData: Omit<LeaveRequest, 'id' | 'status' | 'approvedBy'>): LeaveRequest {
    this.init();
    const id = `LV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newReq: LeaveRequest = { ...reqData, id, status: 'Pending', approvedBy: null };
    this.data.leaveRequests.push(newReq);
    this.queueSave();
    return newReq;
  }

  public updateLeaveStatus(id: string, status: 'Approved' | 'Rejected', approvedBy: string): LeaveRequest | null {
    this.init();
    const req = this.data.leaveRequests.find(r => r.id === id);
    if (!req) return null;

    req.status = status;
    req.approvedBy = approvedBy;

    // If approved, update employee status and attendance rate
    if (status === 'Approved') {
      const emp = this.getEmployeeById(req.employeeId);
      if (emp) {
        emp.status = 'On Leave';
        this.updateEmployee(emp.id, { status: 'On Leave' });
      }
    }

    this.queueSave();
    return req;
  }

  // --- PAYROLL METHODS ---

  public getPayrollRecords(employeeId?: string) {
    this.init();
    if (employeeId) {
      return this.data.payrollRecords.filter(p => p.employeeId === employeeId);
    }
    return this.data.payrollRecords;
  }

  public createPayrollRecord(record: Omit<PayrollRecord, 'id'>): PayrollRecord {
    this.init();
    const id = `PAY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newRecord = { ...record, id };
    this.data.payrollRecords.push(newRecord);
    this.queueSave();
    return newRecord;
  }

  public updatePayrollStatus(id: string, status: 'Paid' | 'Processing' | 'Held', date?: string): PayrollRecord | null {
    this.init();
    const record = this.data.payrollRecords.find(r => r.id === id);
    if (!record) return null;

    record.status = status;
    if (status === 'Paid') {
      record.paymentDate = date || new Date().toISOString().split('T')[0];
    }

    this.queueSave();
    return record;
  }

  // --- PERFORMANCE GOALS METHODS ---

  public getPerformanceGoals(employeeId?: string) {
    this.init();
    if (employeeId) {
      return this.data.performanceGoals.filter(g => g.employeeId === employeeId);
    }
    return this.data.performanceGoals;
  }

  public createPerformanceGoal(goal: Omit<PerformanceGoal, 'id'>): PerformanceGoal {
    this.init();
    const id = `G-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newGoal = { ...goal, id };
    this.data.performanceGoals.push(newGoal);
    this.queueSave();
    return newGoal;
  }

  public updatePerformanceGoal(id: string, updates: Partial<PerformanceGoal>): PerformanceGoal | null {
    this.init();
    const goal = this.data.performanceGoals.find(g => g.id === id);
    if (!goal) return null;

    Object.assign(goal, updates);
    this.queueSave();
    return goal;
  }

  // --- RECRUITMENT CANDIDATES METHODS ---

  public getCandidates() {
    this.init();
    return this.data.candidates;
  }

  public getCandidateById(id: string): Candidate | null {
    this.init();
    return this.data.candidates.find(c => c.id === id) || null;
  }

  public createCandidate(candData: Omit<Candidate, 'id' | 'fitmentScore' | 'evaluationText' | 'skillsMatched' | 'skillsMissing' | 'interviewTranscript' | 'interviewStatus' | 'customQuestions'>): Candidate {
    this.init();
    const id = `CAN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newCand: Candidate = {
      ...candData,
      id,
      fitmentScore: null,
      evaluationText: null,
      skillsMatched: [],
      skillsMissing: [],
      interviewTranscript: [],
      interviewStatus: 'Not Screened',
      customQuestions: []
    };
    this.data.candidates.push(newCand);
    this.queueSave();
    return newCand;
  }

  public updateCandidate(id: string, updates: Partial<Candidate>): Candidate | null {
    this.init();
    const cand = this.data.candidates.find(c => c.id === id);
    if (!cand) return null;

    Object.assign(cand, updates);
    this.queueSave();
    return cand;
  }

  // --- SEED SEEDER EXCLUSIVE METHOD (Clears existing data) ---
  public clearAllAndSeed(seedData: DBStructure) {
    this.data = seedData;
    this.rebuildIndexes();
    this.saveImmediately();
  }
}

// Export singleton instance
export const db = new LocalDB();
