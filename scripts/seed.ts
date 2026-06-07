import { db, Employee, AttendanceLog, LeaveRequest, PayrollRecord, PerformanceGoal, Candidate } from '../lib/db';

const FIRST_NAMES = [
  'Aarav', 'Vihaan', 'Aditya', 'Arjun', 'Sai', 'Krishna', 'Rahul', 'Rohan', 'Amit', 'Sanjay',
  'Deepak', 'Sandeep', 'Vijay', 'Aniket', 'Manish', 'Pranav', 'Abhishek', 'Ravi', 'Alok', 'Ajay',
  'Aanya', 'Diya', 'Ananya', 'Priya', 'Neha', 'Kavya', 'Riya', 'Isha', 'Aditi', 'Pooja',
  'Shreya', 'Sneha', 'Swati', 'Divya', 'Meera', 'Anjali', 'Geeta', 'Jyoti', 'Aishwarya', 'Kiran',
  'Dev', 'Kabir', 'Ishaan', 'Reyansh', 'Shaurya', 'Atharv', 'Rudran', 'Karan', 'Nikhil', 'Yash',
  'Tanvi', 'Anika', 'Avani', 'Myra', 'Prisha', 'Riddhi', 'Sia', 'Kiara', 'Arya', 'Meghna'
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Gupta', 'Kumar', 'Singh', 'Mehta', 'Joshi', 'Malhotra', 'Verma', 'Nair',
  'Iyer', 'Reddy', 'Choudhury', 'Rao', 'Das', 'Sen', 'Bose', 'Mishra', 'Trivedi', 'Pillai',
  'Kothari', 'Deshmukh', 'Bhat', 'Dubey', 'Pandey', 'Sinha', 'Roy', 'Mukherjee', 'Chatterjee', 'Menon',
  'Giri', 'Saxena', 'Kapoor', 'Agrawal', 'Chawla', 'Jha', 'Prasad', 'Shetty', 'Bahl', 'Naidu'
];

const DEPARTMENTS = ['Engineering', 'AI/ML', 'HR', 'Finance', 'Sales'];

const DESIGNATIONS: Record<string, string[]> = {
  'Engineering': ['Software Engineer', 'Senior Software Engineer', 'DevOps Engineer', 'QA Engineer', 'Frontend Engineer', 'Backend Engineer'],
  'AI/ML': ['AI Engineer', 'Machine Learning Scientist', 'Data Scientist', 'NLP Engineer', 'Computer Vision Engineer', 'AI/ML Specialist'],
  'HR': ['HR Specialist', 'HR Associate', 'Talent Acquisition Partner', 'HR Business Partner', 'Employee Experience Coordinator'],
  'Finance': ['Financial Analyst', 'Senior Accountant', 'Finance Associate', 'Tax Specialist', 'Billing Specialist'],
  'Sales': ['Account Executive', 'Business Development Representative', 'Sales Manager', 'Customer Success Manager', 'Sales Operations Analyst']
};

const SKILLS_POOL: Record<string, string[]> = {
  'Engineering': ['React.js', 'Next.js', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'AWS', 'Docker', 'PostgreSQL', 'MongoDB', 'GraphQL', 'REST APIs', 'Git'],
  'AI/ML': ['Python', 'TensorFlow', 'PyTorch', 'Gemini API', 'OpenAI API', 'Hugging Face', 'scikit-learn', 'NLP', 'Computer Vision', 'LangChain', 'Pandas', 'NumPy'],
  'HR': ['Talent Acquisition', 'Employee Relations', 'HRIS', 'Onboarding', 'Conflict Resolution', 'Performance Management', 'Labor Law', 'Recruitment'],
  'Finance': ['Financial Modeling', 'Excel', 'Accounting', 'QuickBooks', 'Tax Compliance', 'Budgeting', 'Risk Assessment', 'Auditing', 'Invoicing'],
  'Sales': ['CRM (Salesforce)', 'Cold Calling', 'Negotiation', 'Lead Generation', 'Client Relations', 'Product Demo', 'Strategic Partnership', 'B2B Sales']
};

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray<T>(arr: T[], size: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function seed() {
  console.log('Starting Seeder...');

  const employees: Employee[] = [];
  const attendanceLogs: AttendanceLog[] = [];
  const leaveRequests: LeaveRequest[] = [];
  const payrollRecords: PayrollRecord[] = [];
  const performanceGoals: PerformanceGoal[] = [];
  const candidates: Candidate[] = [];

  // 1. Create System Admin
  const adminId = 'EMP-ADMIN01';
  const admin: Employee = {
    id: adminId,
    name: 'Shivani Chawla',
    email: 'admin@fwc.com',
    role: 'admin',
    department: 'HR',
    designation: 'VP of Human Resources',
    joiningDate: '2022-01-15',
    salary: 220000,
    performanceScore: 5,
    attendanceRate: 98.2,
    skills: ['HR Strategy', 'Executive Leadership', 'Organizational Design'],
    status: 'Active',
    managerId: null,
    burnoutRisk: 'Low',
    retentionAction: 'None'
  };
  employees.push(admin);

  // 2. Create Managers for each department
  const managers: Record<string, Employee> = {};
  const managerEmails = {
    'Engineering': 'manager.eng@fwc.com',
    'AI/ML': 'manager.ai@fwc.com',
    'HR': 'manager.hr@fwc.com',
    'Finance': 'manager.finance@fwc.com',
    'Sales': 'manager.sales@fwc.com'
  };
  const managerNames = {
    'Engineering': 'Rajesh Kumar',
    'AI/ML': 'Dr. Ramesh Gupta',
    'HR': 'Yogavati',
    'Finance': 'Anil Mehta',
    'Sales': 'Vikram Singh'
  };

  DEPARTMENTS.forEach(dept => {
    const mgrId = `EMP-MGR-${dept.substring(0, 3).toUpperCase()}`;
    const mgr: Employee = {
      id: mgrId,
      name: managerNames[dept as keyof typeof managerNames],
      email: managerEmails[dept as keyof typeof managerEmails],
      role: 'manager',
      department: dept,
      designation: `${dept} Director`,
      joiningDate: '2023-04-10',
      salary: getRandomNumber(140000, 180000),
      performanceScore: 5,
      attendanceRate: 95.8,
      skills: [...SKILLS_POOL[dept].slice(0, 3), 'Team Leadership', 'Project Management'],
      status: 'Active',
      managerId: adminId,
      burnoutRisk: 'Low',
      retentionAction: 'None'
    };
    employees.push(mgr);
    managers[dept] = mgr;
  });

  // 3. Create HR Recruiters
  const recruiters: Employee[] = [];
  const recruiterNames = ['Neha Joshi', 'Karan Malhotra', 'Amit Sharma'];
  recruiterNames.forEach((name, index) => {
    const recId = `EMP-REC-0${index + 1}`;
    const rec: Employee = {
      id: recId,
      name,
      email: `recruiter.${name.split(' ')[0].toLowerCase()}@fwc.com`,
      role: 'recruiter',
      department: 'HR',
      designation: 'Senior Talent Acquisition Specialist',
      joiningDate: '2024-02-01',
      salary: 85000,
      performanceScore: 4,
      attendanceRate: 94.5,
      skills: ['Talent Sourcing', 'Interviewing', 'Candidate Screening', 'Negotiation'],
      status: 'Active',
      managerId: managers['HR'].id,
      burnoutRisk: 'Low',
      retentionAction: 'None'
    };
    employees.push(rec);
    recruiters.push(rec);
  });

  // 4. Generate 5,000 Employees!
  console.log('Generating 5000 employee records...');
  
  // To simulate realistic department distributions:
  // Engineering: 40% (2000), AI/ML: 15% (750), Sales: 25% (1250), HR: 10% (500), Finance: 10% (500)
  const deptQuotas = {
    'Engineering': 2000,
    'AI/ML': 750,
    'Sales': 1250,
    'HR': 500,
    'Finance': 500
  };

  let empCounter = 1;
  
  for (const dept of DEPARTMENTS) {
    const quota = deptQuotas[dept as keyof typeof deptQuotas];
    const mgr = managers[dept];
    const designations = DESIGNATIONS[dept];
    const skillsPool = SKILLS_POOL[dept];

    for (let i = 0; i < quota; i++) {
      const id = `EMP-${empCounter.toString().padStart(5, '0')}`;
      const firstName = getRandomElement(FIRST_NAMES);
      const lastName = getRandomElement(LAST_NAMES);
      const name = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${empCounter}@fwc.com`;
      const designation = getRandomElement(designations);
      const salary = getRandomNumber(50000, 130000);
      const performanceScore = getRandomNumber(2, 5);
      const attendanceRate = parseFloat((getRandomNumber(820, 1000) / 10).toFixed(1));
      const skills = getRandomSubarray(skillsPool, getRandomNumber(3, 5));
      const status: 'Active' | 'On Leave' = getRandomNumber(1, 100) > 95 ? 'On Leave' : 'Active';
      
      // Burnout risks: 8% High, 18% Medium, 74% Low
      const roll = getRandomNumber(1, 100);
      let burnoutRisk: 'Low' | 'Medium' | 'High' = 'Low';
      let retentionAction = 'No action needed';

      if (roll <= 8) {
        burnoutRisk = 'High';
        retentionAction = getRandomElement([
          'Schedule immediate 1-on-1 feedback session',
          'Offer flexible WFH / mental health day',
          'Propose workload reduction and project handover',
          'Initiate compensation package review'
        ]);
      } else if (roll <= 26) {
        burnoutRisk = 'Medium';
        retentionAction = getRandomElement([
          'Recommend AI-certification and sponsor course expenses',
          'Reassign to a secondary project with lower urgency',
          'Encourage peer mentoring program participation'
        ]);
      }

      employees.push({
        id,
        name,
        email,
        role: 'employee',
        department: dept,
        designation,
        joiningDate: `2024-${getRandomNumber(1, 12).toString().padStart(2, '0')}-${getRandomNumber(1, 28).toString().padStart(2, '0')}`,
        salary,
        performanceScore,
        attendanceRate,
        skills,
        status,
        managerId: mgr.id,
        burnoutRisk,
        retentionAction
      });

      empCounter++;
    }
  }

  console.log(`Generated total of ${employees.length} employees (including admins/managers/recruiters).`);

  // 5. Generate Attendance Logs for the past 5 working days (Monday-Friday) for a subset of 150 employees
  // Generating logs for 5,000 employees * 5 days would produce 25,000 records, which is large. 
  // Seeding 150 employees * 5 days = 750 records provides plenty of mock attendance data for charts and logs
  console.log('Generating attendance logs...');
  const activeEmployeeSubset = employees.slice(0, 150);
  const dates = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05'];
  
  let attCounter = 1;
  dates.forEach(date => {
    activeEmployeeSubset.forEach(emp => {
      // 95% attendance rate in logs
      if (getRandomNumber(1, 100) > 5) {
        const hour = getRandomNumber(8, 10);
        const minute = getRandomNumber(0, 59);
        const second = getRandomNumber(0, 59);
        const clockIn = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
        
        // Late if after 09:30 AM
        const status = (hour > 9 || (hour === 9 && minute > 30)) ? 'Late' : 'Present';
        
        const outH = getRandomNumber(17, 19);
        const outM = getRandomNumber(0, 59);
        const outS = getRandomNumber(0, 59);
        const clockOut = `${outH.toString().padStart(2, '0')}:${outM.toString().padStart(2, '0')}:${outS.toString().padStart(2, '0')}`;
        
        const workHours = parseFloat(((outH + outM/60) - (hour + minute/60)).toFixed(2));

        attendanceLogs.push({
          id: `ATT-${attCounter.toString().padStart(6, '0')}`,
          employeeId: emp.id,
          date,
          clockIn,
          clockOut,
          status,
          workHours
        });
        attCounter++;
      } else {
        // Absent or Leave
        const status = getRandomNumber(1, 10) > 3 ? 'Absent' : 'On Leave';
        attendanceLogs.push({
          id: `ATT-${attCounter.toString().padStart(6, '0')}`,
          employeeId: emp.id,
          date,
          clockIn: '00:00:00',
          clockOut: null,
          status,
          workHours: 0
        });
        attCounter++;
      }
    });
  });

  // 6. Generate Leave Requests
  console.log('Generating leave requests...');
  const leaveSubset = employees.slice(10, 40);
  leaveSubset.forEach((emp, i) => {
    const statuses: ('Pending' | 'Approved' | 'Rejected')[] = ['Pending', 'Approved', 'Rejected'];
    const types: ('Sick' | 'Casual' | 'Annual')[] = ['Sick', 'Casual', 'Annual'];
    
    leaveRequests.push({
      id: `LV-${(i + 1).toString().padStart(4, '0')}`,
      employeeId: emp.id,
      employeeName: emp.name,
      startDate: `2026-06-${getRandomNumber(10, 15).toString().padStart(2, '0')}`,
      endDate: `2026-06-${getRandomNumber(16, 22).toString().padStart(2, '0')}`,
      type: getRandomElement(types),
      reason: getRandomElement([
        'Family health emergency',
        'Personal vacation plans',
        'Medical recovery from dental surgery',
        'Moving into a new apartment',
        'Sister\'s wedding ceremony'
      ]),
      status: statuses[i % 3],
      approvedBy: statuses[i % 3] !== 'Pending' ? managers[emp.department]?.name || admin.name : null
    });
  });

  // 7. Generate Performance Goals (OKRs)
  console.log('Generating performance goals...');
  const goalSubset = employees.slice(0, 30);
  goalSubset.forEach((emp, i) => {
    const progress = getRandomNumber(0, 100);
    let status: 'Not Started' | 'In Progress' | 'Completed' = 'In Progress';
    if (progress === 0) status = 'Not Started';
    else if (progress === 100) status = 'Completed';

    performanceGoals.push({
      id: `G-${(i + 1).toString().padStart(4, '0')}`,
      employeeId: emp.id,
      title: getRandomElement([
        'Optimize database search queries',
        'Achieve quarterly sales quota',
        'Conduct AI certification seminar',
        'Deploy production cluster containerization',
        'Onboard 5 new clients',
        'Complete security vulnerability audit'
      ]),
      description: 'Key outcome metric for evaluation this appraisal cycle.',
      type: i % 3 === 0 ? 'Company' : i % 3 === 1 ? 'Team' : 'Individual',
      dueDate: '2026-07-31',
      progress,
      status,
      weight: getRandomElement([10, 20, 30, 40])
    });
  });

  // 8. Generate Payroll Records for last month (May 2026) for active sub-list
  console.log('Generating payroll history...');
  const payrollSubset = employees.slice(0, 200);
  payrollSubset.forEach((emp, i) => {
    const base = Math.floor(emp.salary / 12);
    const allowances = Math.floor(base * 0.1);
    const deductions = Math.floor(base * 0.05);
    const tax = Math.floor((base + allowances - deductions) * 0.15);
    const netPay = base + allowances - deductions - tax;

    payrollRecords.push({
      id: `PAY-${(i + 1).toString().padStart(4, '0')}`,
      employeeId: emp.id,
      month: '2026-05',
      baseSalary: base,
      allowances,
      deductions,
      tax,
      netPay,
      status: 'Paid',
      paymentDate: '2026-05-31'
    });
  });

  // 9. Generate Candidates for recruitment
  console.log('Generating recruitment candidates...');
  const sampleCandidates = [
    {
      name: 'Aarav Sen',
      email: 'aarav.sen@gmail.com',
      resumeText: `AARAV SEN\nAI/ML ENGINEER & FULLSTACK DEVELOPER\n\nExperience:\n- 3+ years experience building machine learning models in Python.\n- Handled deployments of custom PyTorch LLMs on AWS EC2.\n- Developed responsive frontend apps using React.js and Next.js.\n\nSkills: Python, TensorFlow, PyTorch, React, Node.js, Git, SQL, Docker, AWS.`,
      fitmentScore: 88,
      evaluationText: 'Excellent candidate with balanced skills in both AI modeling (PyTorch) and Next.js frontend development. Solid fit for the Fullstack + AI role.',
      skillsMatched: ['Python', 'React.js', 'Next.js', 'Node.js', 'Docker', 'Git'],
      skillsMissing: ['Gemini API', 'PostgreSQL'],
      interviewTranscript: [
        { role: 'bot', text: 'Hi Aarav! Welcome to the candidate screening interview. Can you tell us about your experience with AI models and React?', timestamp: '2026-06-05T10:00:00Z' },
        { role: 'candidate', text: 'Hi! I have worked for 3 years building predictive models and fine-tuning BERT and PyTorch architectures. I also build clean dashboard layouts in React to display model predictions to business teams.', timestamp: '2026-06-05T10:01:30Z' },
        { role: 'bot', text: 'That sounds impressive. How do you handle database connections and scaling when dealing with real-time predictions?', timestamp: '2026-06-05T10:02:15Z' },
        { role: 'candidate', text: 'I write optimized PostgreSQL queries, implement indexes on search keys, and cache heavy AI model outputs using Redis to keep response times low.', timestamp: '2026-06-05T10:03:50Z' },
        { role: 'bot', text: 'Thank you Aarav, we will be in touch.', timestamp: '2026-06-05T10:04:10Z' }
      ],
      interviewStatus: 'Shortlisted',
      customQuestions: ['Can you elaborate on PyTorch scaling?', 'Describe a challenging Next.js component you built.']
    },
    {
      name: 'Priya Das',
      email: 'priya.das@yahoo.com',
      resumeText: `PRIYA DAS\nSENIOR TALENT ACQUISITION & HR COORDINATOR\n\nExperience:\n- Managed onboarding of 300+ staff members.\n- Handled conflict resolution, payroll processing, and HR compliance audits.\n- Recruiter for tech positions, specializing in software engineering positions.\n\nSkills: HRIS, Recruiting, Employment Law, Employee Engagement, Excel.`,
      fitmentScore: 35,
      evaluationText: 'Candidate is highly experienced in standard HR and Recruitment operations, but lacks any programming, AI/ML, or engineering background required for this technical role.',
      skillsMatched: ['Recruitment'],
      skillsMissing: ['React.js', 'Next.js', 'Node.js', 'TypeScript', 'Python', 'Gemini API'],
      interviewTranscript: [
        { role: 'bot', text: 'Hello Priya. Can you describe your experience in the AI/ML domain and Fullstack web development?', timestamp: '2026-06-06T14:00:00Z' },
        { role: 'candidate', text: 'Hello. I do not write code directly. However, I have recruited AI/ML developers, handled HR compliance, and managed team onboarding. I have a deep understanding of corporate culture.', timestamp: '2026-06-06T14:01:20Z' }
      ],
      interviewStatus: 'Rejected',
      customQuestions: []
    }
  ];

  sampleCandidates.forEach((cand, idx) => {
    candidates.push({
      id: `CAN-${(idx + 1).toString().padStart(4, '0')}`,
      name: cand.name,
      email: cand.email,
      resumeText: cand.resumeText,
      fitmentScore: cand.fitmentScore,
      evaluationText: cand.evaluationText,
      skillsMatched: cand.skillsMatched,
      skillsMissing: cand.skillsMissing,
      interviewTranscript: cand.interviewTranscript as Candidate['interviewTranscript'],
      interviewStatus: cand.interviewStatus as Candidate['interviewStatus'],
      customQuestions: cand.customQuestions
    });
  });

  // Save everything to the database
  db.clearAllAndSeed({
    employees,
    attendanceLogs,
    leaveRequests,
    payrollRecords,
    performanceGoals,
    candidates
  });

  console.log('Seeding Complete! Database updated successfully.');
}

// Check if run directly from CLI
if (require.main === module) {
  seed();
}
