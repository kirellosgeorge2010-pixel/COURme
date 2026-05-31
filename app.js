/* ==========================================================================
   COURme Application Logic
   Handles data model seeding (Web Dev & Robotics), localStorage synchronization,
   portal credentials validation, session gating, chat messages, submissions review,
   and detailed security audit tracking.
   ========================================================================== */

// --- Default Real Seed Data (Web Development & Robotics) ---
const DEFAULT_HOMEWORK = [
  {
    id: "hw-web-1",
    title: "Responsive Flexbox Landing Page",
    subject: "Web Development",
    dueDate: "2026-06-03",
    description: "Build a responsive landing page using mobile-first design guidelines and CSS Flexbox grid structures. Validate that it works on all viewports.",
    assignedBy: "Dr. Sarah Jenkins"
  },
  {
    id: "hw-web-2",
    title: "Vanilla JS Async API Fetching",
    subject: "Web Development",
    dueDate: "2026-05-28",
    description: "Write an asynchronous script utilizing async/await to fetch user profiles from the mock API and render them inside glassmorphic cards.",
    assignedBy: "Dr. Sarah Jenkins"
  },
  {
    id: "hw-robot-1",
    title: "Arduino Servo Motor Sweep Control",
    subject: "Robotics",
    dueDate: "2026-06-05",
    description: "Write an Arduino sketch (.ino) that sweeps a servo motor back and forth between 0 and 180 degrees using potentiometer analog inputs.",
    assignedBy: "Prof. Arthur Pendelton"
  },
  {
    id: "hw-robot-2",
    title: "Ultrasonic Distance Sensor Mapping",
    subject: "Robotics",
    dueDate: "2026-05-30",
    description: "Calibrate the HC-SR04 ultrasonic sensor and document calculations translating pulse duration into centimeters.",
    assignedBy: "Prof. Arthur Pendelton"
  }
];

const DEFAULT_RESOURCES = [
  {
    id: "res-web-1",
    title: "Modern JS Promises & Fetch Cheat Sheet",
    type: "handouts",
    link: "https://javascript.info/promise-basics",
    postedBy: "Dr. Sarah Jenkins",
    date: "2026-05-27"
  },
  {
    id: "res-web-2",
    title: "Responsive Web Design Design tokens",
    type: "lectures",
    link: "https://web.dev/responsive-web-design-basics/",
    postedBy: "Dr. Sarah Jenkins",
    date: "2026-05-29"
  },
  {
    id: "res-robot-1",
    title: "Arduino IDE Board Library Setup Guide",
    type: "lectures",
    link: "https://www.arduino.cc/en/software",
    postedBy: "Prof. Arthur Pendelton",
    date: "2026-05-25"
  },
  {
    id: "res-robot-2",
    title: "SG90 Micro Servo Specifications PDF",
    type: "handouts",
    link: "https://www.towerpro.com.tw/product/sg90-7/",
    postedBy: "Prof. Arthur Pendelton",
    date: "2026-05-26"
  }
];

const DEFAULT_SUBMISSIONS = [
  {
    id: "sub-1",
    homeworkId: "hw-web-2",
    homeworkTitle: "Vanilla JS Async API Fetching",
    studentName: "Alex Rivera",
    content: "Solved using standard async/await fetch methods. Wrapped in try/catch bounds and logged response headers. Handled mapping onto columns correctly.",
    submittedAt: "2026-05-30T10:14:00Z",
    feedback: "Exceptional code quality and clean error boundary handling.",
    grade: "A+",
    gradedAt: "2026-05-31T07:05:00Z"
  },
  {
    id: "sub-2",
    homeworkId: "hw-robot-2",
    homeworkTitle: "Ultrasonic Distance Sensor Mapping",
    studentName: "Alex Rivera",
    content: "Used duration calculation: distance = duration * 0.034 / 2. Plotted test run readings inside the sheet.",
    submittedAt: "2026-05-30T12:40:00Z",
    feedback: "Formulas look correct. Potentiometer calculations match values.",
    grade: "A",
    gradedAt: "2026-05-31T07:12:00Z"
  }
];

const DEFAULT_CHAT = [
  {
    id: "msg-1",
    sender: "Dr. Sarah Jenkins",
    role: "teacher",
    text: "Welcome to the Web Development & Robotics course workspace! Post any queries regarding assignments here.",
    timestamp: "09:40 AM"
  },
  {
    id: "msg-2",
    sender: "Alex Rivera",
    role: "student",
    text: "Thanks Dr. Jenkins! I've uploaded the code for the sensor mapping exercise.",
    timestamp: "10:14 AM"
  },
  {
    id: "msg-3",
    sender: "Dr. Sarah Jenkins",
    role: "teacher",
    text: "Awesome Alex, I will review it shortly.",
    timestamp: "10:20 AM"
  }
];

const DEFAULT_LOGS = [
  {
    id: "log-1",
    timestamp: "2026-05-31T07:15:00Z",
    user: "Dr. Sarah Jenkins",
    role: "teacher",
    action: "assigned homework",
    type: "Responsive Flexbox Landing Page",
    severity: "SUCCESS",
    details: "Assigned Web Development task to year class."
  },
  {
    id: "log-2",
    timestamp: "2026-05-31T07:30:00Z",
    user: "Alex Rivera",
    role: "student",
    action: "submitted assignment",
    type: "Vanilla JS Async API Fetching",
    severity: "SUCCESS",
    details: "Student submitted solution description link (135 characters)."
  },
  {
    id: "log-3",
    timestamp: "2026-05-31T08:02:00Z",
    user: "Dr. Sarah Jenkins",
    role: "teacher",
    action: "submitted grade",
    type: "Vanilla JS Async API Fetching",
    severity: "SUCCESS",
    details: "Assigned Grade A+ and wrote feedback comments."
  }
];

// --- Platform State ---
let state = {
  homework: [],
  resources: [],
  submissions: [],
  chatMessages: [],
  activityLogs: [],
  filters: {
    studentHw: 'all',
    studentRes: 'all',
    studentHwSearch: '',
    studentResSearch: '',
    teacherTab: 'homework',
    auditSeverity: 'ALL'
  }
};

// --- Initialization Gate ---
function initApp() {
  loadDatabase();

  const currentPath = window.location.pathname;
  const isLoginPage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '';
  
  // Security Guards Check
  if (!isLoginPage) {
    const activeRole = sessionStorage.getItem('courme_role');
    let pageRole = '';
    if (currentPath.includes('student.html')) pageRole = 'student';
    if (currentPath.includes('teacher.html')) pageRole = 'teacher';
    if (currentPath.includes('manager.html')) pageRole = 'manager';

    if (activeRole !== pageRole) {
      reportSecurityViolation(currentPath.split('/').pop());
      sessionStorage.clear();
      window.location.href = 'index.html';
      return;
    }
  }

  if (isLoginPage) {
    initLoginPortal();
  } else {
    initDashboardPage(currentPath);
  }
}

// --- Dynamic Security Alerts ---
function reportSecurityViolation(pageName) {
  loadDatabase();
  const newLog = {
    id: `log-sec-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: "Client Host",
    role: "guest",
    action: "unauthorized page access blocked",
    type: pageName,
    severity: "SECURITY",
    details: `Direct URL access to '${pageName}' aborted due to missing authentication token.`
  };
  state.activityLogs.unshift(newLog);
  saveState();
}

// --- Data Synchronization ---
function loadDatabase() {
  if (localStorage.getItem('courme_homework')) {
    state.homework = JSON.parse(localStorage.getItem('courme_homework'));
    state.resources = JSON.parse(localStorage.getItem('courme_resources'));
    state.submissions = JSON.parse(localStorage.getItem('courme_submissions'));
    state.chatMessages = JSON.parse(localStorage.getItem('courme_chat'));
    state.activityLogs = JSON.parse(localStorage.getItem('courme_logs'));
  } else {
    resetStateToDefault();
  }
}

function saveState() {
  localStorage.setItem('courme_homework', JSON.stringify(state.homework));
  localStorage.setItem('courme_resources', JSON.stringify(state.resources));
  localStorage.setItem('courme_submissions', JSON.stringify(state.submissions));
  localStorage.setItem('courme_chat', JSON.stringify(state.chatMessages));
  localStorage.setItem('courme_logs', JSON.stringify(state.activityLogs));
}

function resetStateToDefault() {
  state.homework = [...DEFAULT_HOMEWORK];
  state.resources = [...DEFAULT_RESOURCES];
  state.submissions = [...DEFAULT_SUBMISSIONS];
  state.chatMessages = [...DEFAULT_CHAT];
  state.activityLogs = [...DEFAULT_LOGS];
  saveState();
}

// Add an audit log entry
function addAuditLog(user, role, action, type, severity = "SUCCESS", details = "") {
  const newLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user,
    role,
    action,
    type,
    severity,
    details
  };
  state.activityLogs.unshift(newLog);
  if (state.activityLogs.length > 50) state.activityLogs.pop();
  saveState();
}

// --- Login Panel Controller (index.html) ---
function initLoginPortal() {
  const tabs = document.querySelectorAll('.portal-tab');
  const userGroup = document.getElementById('input-group-username');
  const passGroup = document.getElementById('input-group-password');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  
  let selectedRole = 'student';

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      tabs.forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      selectedRole = e.currentTarget.getAttribute('data-role');
      
      if (selectedRole === 'student') {
        userGroup.classList.remove('d-none');
        passGroup.classList.add('d-none');
        document.getElementById('login-password').removeAttribute('required');
        document.getElementById('login-username').setAttribute('required', 'true');
      } else {
        userGroup.classList.add('d-none');
        passGroup.classList.remove('d-none');
        document.getElementById('login-username').removeAttribute('required');
        document.getElementById('login-password').setAttribute('required', 'true');
      }
      
      loginError.classList.add('d-none');
    });
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginError.classList.add('d-none');

    const username = document.getElementById('login-username').value.trim();
    const passcode = document.getElementById('login-password').value;

    if (selectedRole === 'student') {
      if (username.length > 0) {
        sessionStorage.setItem('courme_role', 'student');
        sessionStorage.setItem('courme_user', username);
        addAuditLog(username, "student", "signed in", "Student Portal", "SUCCESS", "Access authorized via student alias registration.");
        window.location.href = 'student.html';
      }
    } else if (selectedRole === 'teacher') {
      if (passcode === 'teacher123') {
        sessionStorage.setItem('courme_role', 'teacher');
        sessionStorage.setItem('courme_user', 'Dr. Sarah Jenkins');
        addAuditLog("Dr. Sarah Jenkins", "teacher", "signed in", "Teacher Console", "SUCCESS", "Teacher passcode validated successfully.");
        window.location.href = 'teacher.html';
      } else {
        addAuditLog("Unknown Client", "teacher", "sign in failed", "Teacher Console", "WARNING", "Incorrect credentials submitted.");
        loginError.classList.remove('d-none');
      }
    } else if (selectedRole === 'manager') {
      if (passcode === 'ceo999') {
        sessionStorage.setItem('courme_role', 'manager');
        sessionStorage.setItem('courme_user', 'Kirellos George');
        addAuditLog("Kirellos George", "manager", "signed in", "CEO Dashboard", "SUCCESS", "CEO/Manager key matched successfully.");
        window.location.href = 'manager.html';
      } else {
        addAuditLog("Unknown Client", "manager", "sign in failed", "CEO Dashboard", "WARNING", "Manager passcode challenge failed.");
        loginError.classList.remove('d-none');
      }
    }
  });

  lucide.createIcons();
}

// --- Protected Dashboard Bootstrap ---
function initDashboardPage(currentPath) {
  // Shared logout handler (desktop sidebar button)
  function doLogout() {
    const activeUser = sessionStorage.getItem('courme_user') || 'User';
    const activeRole = sessionStorage.getItem('courme_role') || 'guest';
    addAuditLog(activeUser, activeRole, "signed out", "System Session", "SUCCESS", "Session token invalidated.");
    sessionStorage.clear();
    window.location.href = 'index.html';
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', doLogout);

  // Mobile top bar logout
  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
  if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', doLogout);

  // Populate date pill
  const dateSpan = document.getElementById('current-date');
  if (dateSpan) {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const today = new Date();
    dateSpan.textContent = `${days[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()}`;
  }

  // Setup floating chat widget (FAB)
  setupFloatingChat();

  // Handle specific dashboard page logic
  if (currentPath.includes('student.html')) {
    setupStudentDashboard();
  } else if (currentPath.includes('teacher.html')) {
    setupTeacherDashboard();
  } else if (currentPath.includes('manager.html')) {
    setupManagerDashboard();
  }
}

// ==========================================================================
// Floating Chat Widget
// ==========================================================================
function setupFloatingChat() {
  const fab = document.getElementById('chat-fab');
  const panel = document.getElementById('chat-widget-panel');
  if (!fab || !panel) return;

  // FAB toggle
  fab.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('open');
    fab.classList.toggle('open', isOpen);
    if (isOpen) renderWidgetChat();
    lucide.createIcons();
  });

  // Send button (students & teachers only)
  const sendBtn = document.getElementById('chat-widget-send');
  const input = document.getElementById('chat-widget-input');

  if (sendBtn && input) {
    function sendFromWidget() {
      const text = input.value.trim();
      if (text) {
        sendChatMessage(text);
        input.value = '';
      }
    }
    sendBtn.addEventListener('click', sendFromWidget);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); sendFromWidget(); }
    });
  }

  // Initial render
  renderWidgetChat();
}

function renderWidgetChat() {
  loadDatabase();
  const container = document.getElementById('chat-widget-messages');
  const countEl = document.getElementById('chat-widget-count');
  if (!container) return;

  container.innerHTML = '';
  const currentUser = sessionStorage.getItem('courme_user');

  state.chatMessages.forEach(msg => {
    const bubble = document.createElement('div');
    const isMe = msg.sender === currentUser;
    const isTeacher = msg.role === 'teacher';

    bubble.className = `message-bubble ${isMe ? 'right' : 'left'} ${isTeacher ? 'teacher-msg' : ''}`;
    bubble.innerHTML = `
      <span class="message-sender">${escapeHTML(msg.sender)}</span>
      <span class="message-text">${escapeHTML(msg.text)}</span>
      <span class="message-time">${msg.timestamp}</span>
    `;
    container.appendChild(bubble);
  });

  container.scrollTop = container.scrollHeight;
  if (countEl) countEl.textContent = `${state.chatMessages.length} message${state.chatMessages.length !== 1 ? 's' : ''}`;
  lucide.createIcons();
}

function sendChatMessage(text) {
  loadDatabase();
  const user = sessionStorage.getItem('courme_user') || 'Anonymous';
  const role = sessionStorage.getItem('courme_role') || 'guest';
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  state.chatMessages.push({
    id: `msg-${Date.now()}`,
    sender: user, role, text,
    timestamp: timeStr
  });
  saveState();
  addAuditLog(user, role, "posted chat message", "Class Chatroom", "SUCCESS", `Message length: ${text.length} chars.`);
  renderWidgetChat();
}

// ==========================================================================
// Student Dashboard Logic
// ==========================================================================
function setupStudentDashboard() {
  const username = sessionStorage.getItem('courme_user') || 'Alex Rivera';
  
  document.getElementById('user-display-name').textContent = username;
  document.getElementById('page-title').textContent = `Welcome back, ${username}!`;
  
  const avatar = document.getElementById('user-avatar');
  if (avatar) {
    const initials = username.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
    avatar.textContent = initials;
    const mobileAvatar = document.getElementById('mobile-avatar-display');
    if (mobileAvatar) mobileAvatar.textContent = initials;
  }

  // Render elements
  renderStudentView();

  // Search input events
  document.getElementById('student-hw-search').addEventListener('input', (e) => {
    state.filters.studentHwSearch = e.target.value;
    renderStudentView();
  });
  document.getElementById('student-res-search').addEventListener('input', (e) => {
    state.filters.studentResSearch = e.target.value;
    renderStudentView();
  });

  // Homework filter buttons
  document.querySelectorAll('#student-hw-filters .pill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#student-hw-filters .pill').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      state.filters.studentHw = e.currentTarget.getAttribute('data-filter');
      renderStudentView();
    });
  });

  // Resources filter buttons
  document.querySelectorAll('#student-res-filters .pill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#student-res-filters .pill').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      state.filters.studentRes = e.currentTarget.getAttribute('data-filter');
      renderStudentView();
    });
  });

  // Sidebar link navigators
  document.getElementById('nav-btn-resources').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('student-res-search').scrollIntoView({ behavior: 'smooth' });
  });

  // Modal close action
  document.getElementById('close-modal-btn').addEventListener('click', () => {
    document.getElementById('submission-modal').classList.add('d-none');
  });

  // Submit Homework Form submit action
  document.getElementById('hw-submit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const hwId = document.getElementById('submit-hw-id').value;
    const notes = document.getElementById('submission-text').value.trim();

    if (hwId && notes) {
      loadDatabase();
      const student = sessionStorage.getItem('courme_user') || 'Alex Rivera';
      const hw = state.homework.find(h => h.id === hwId);
      
      if (hw) {
        // Create or update submission object
        const existingSub = state.submissions.find(s => s.homeworkId === hwId && s.studentName === student);
        
        if (existingSub) {
          existingSub.content = notes;
          existingSub.submittedAt = new Date().toISOString();
          existingSub.grade = null; // Reset grade on resubmit
          existingSub.feedback = null;
        } else {
          const newSub = {
            id: `sub-${Date.now()}`,
            homeworkId: hwId,
            homeworkTitle: hw.title,
            studentName: student,
            content: notes,
            submittedAt: new Date().toISOString(),
            feedback: null,
            grade: null
          };
          state.submissions.push(newSub);
        }

        saveState();
        addAuditLog(student, "student", "submitted homework", hw.title, "SUCCESS", `Solution: ${notes.slice(0, 40)}...`);
        
        document.getElementById('submission-modal').classList.add('d-none');
        document.getElementById('hw-submit-form').reset();
        
        renderStudentView();
        alert(`Success: Solution for "${hw.title}" submitted to teacher.`);
      }
    }
  });
}

function renderStudentView() {
  loadDatabase();
  const student = sessionStorage.getItem('courme_user') || 'Alex Rivera';
  
  // Calculate stats based on graded or submitted items
  const studentSubs = state.submissions.filter(s => s.studentName === student);
  const completedCount = studentSubs.filter(s => s.grade && s.grade !== 'Needs Revision').length;
  const total = state.homework.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  document.getElementById('student-completed-count').textContent = `${completedCount}/${total}`;
  document.getElementById('student-hw-progress').style.width = `${pct}%`;
  document.getElementById('student-resources-count').textContent = state.resources.length;

  // Render Homework Tasks
  const hwContainer = document.getElementById('student-hw-list');
  hwContainer.innerHTML = '';

  const filteredHw = state.homework.filter(hw => {
    const searchMatch = hw.title.toLowerCase().includes(state.filters.studentHwSearch.toLowerCase()) ||
                        hw.description.toLowerCase().includes(state.filters.studentHwSearch.toLowerCase());
    
    const sub = studentSubs.find(s => s.homeworkId === hw.id);
    const isCompleted = sub && sub.grade && sub.grade !== 'Needs Revision';

    if (state.filters.studentHw === 'all') return searchMatch;
    if (state.filters.studentHw === 'completed') return isCompleted && searchMatch;
    if (state.filters.studentHw === 'pending') return !isCompleted && searchMatch;
    return searchMatch;
  });

  if (filteredHw.length === 0) {
    hwContainer.innerHTML = `<div class="text-muted" style="padding: 20px; text-align: center;">No assignments matching criteria.</div>`;
  } else {
    filteredHw.forEach(hw => {
      const card = document.createElement('div');
      const sub = studentSubs.find(s => s.homeworkId === hw.id);
      
      let statusBadge = `<span class="badge badge-danger">Not Submitted</span>`;
      let actionBtn = `<button class="btn btn-primary btn-sm submit-trigger-btn" data-id="${hw.id}" data-title="${escapeHTML(hw.title)}"><i data-lucide="upload-cloud"></i> Submit Solution</button>`;
      let feedbackHTML = '';

      if (sub) {
        if (sub.grade) {
          const isPassed = sub.grade !== 'Needs Revision';
          statusBadge = `<span class="badge ${isPassed ? 'badge-success' : 'badge-danger'}">Graded: ${sub.grade}</span>`;
          if (isPassed) {
            actionBtn = `<span class="text-muted" style="font-size: 12px; font-weight:600;"><i data-lucide="check-circle" class="accent-emerald" style="display:inline-block; vertical-align:middle;"></i> Complete</span>`;
          } else {
            actionBtn = `<button class="btn btn-warning btn-sm submit-trigger-btn" data-id="${hw.id}" data-title="${escapeHTML(hw.title)}"><i data-lucide="rotate-ccw"></i> Resubmit</button>`;
          }
          
          feedbackHTML = `
            <div class="feedback-block" style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 6px; border-left: 2px solid var(--accent-purple);">
              <span style="font-size: 11px; font-weight:700; display:block; color: var(--accent-purple);">Teacher Feedback:</span>
              <p style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${escapeHTML(sub.feedback)}</p>
            </div>
          `;
        } else {
          statusBadge = `<span class="badge badge-warning">Awaiting Review</span>`;
          actionBtn = `<span class="text-muted" style="font-size: 12px;"><i data-lucide="clock" style="display:inline-block; vertical-align:middle; width:14px; height:14px;"></i> In Review</span>`;
        }
      }

      card.className = `todo-item ${sub && sub.grade && sub.grade !== 'Needs Revision' ? 'completed' : ''}`;
      card.innerHTML = `
        <div class="todo-details" style="width: 100%">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
            <h4 class="todo-title">${escapeHTML(hw.title)}</h4>
            ${statusBadge}
          </div>
          <p class="todo-description">${escapeHTML(hw.description)}</p>
          <div class="todo-meta">
            <span class="tag ${hw.subject.toLowerCase() === 'web development' ? 'chemistry' : 'physics'}">${hw.subject}</span>
            <span class="due-date"><i data-lucide="calendar"></i> Due ${formatDate(hw.dueDate)}</span>
            <span class="due-date" style="margin-left: 10px;"><i data-lucide="user"></i> ${escapeHTML(hw.assignedBy)}</span>
            <div style="margin-left: auto;">
              ${actionBtn}
            </div>
          </div>
          ${feedbackHTML}
        </div>
      `;

      // Modal opener trigger
      const trigger = card.querySelector('.submit-trigger-btn');
      if (trigger) {
        trigger.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          const title = e.currentTarget.getAttribute('data-title');
          document.getElementById('submit-hw-id').value = id;
          document.getElementById('modal-hw-title').textContent = `Submit: ${title}`;
          document.getElementById('submission-modal').classList.remove('d-none');
        });
      }

      hwContainer.appendChild(card);
    });
  }

  // Render Study Materials
  const resContainer = document.getElementById('student-res-list');
  resContainer.innerHTML = '';

  const filteredRes = state.resources.filter(res => {
    const searchMatch = res.title.toLowerCase().includes(state.filters.studentResSearch.toLowerCase());
    if (state.filters.studentRes === 'all') return searchMatch;
    return res.type === state.filters.studentRes && searchMatch;
  });

  if (filteredRes.length === 0) {
    resContainer.innerHTML = `<div class="text-muted" style="padding: 20px; text-align: center;">No resources found.</div>`;
  } else {
    filteredRes.forEach(res => {
      const card = document.createElement('div');
      card.className = 'resource-item';
      card.innerHTML = `
        <div class="resource-info">
          <div class="resource-icon ${res.type}"><i data-lucide="${getResourceIconName(res.type)}"></i></div>
          <div class="resource-texts">
            <h4 class="resource-title">${escapeHTML(res.title)}</h4>
            <span class="resource-type">${res.type} • Dr. Sarah Jenkins</span>
          </div>
        </div>
        <a href="${escapeHTML(res.link)}" target="_blank" class="btn btn-secondary btn-sm">
          <i data-lucide="external-link"></i> View
        </a>
      `;
      resContainer.appendChild(card);
    });
  }

  lucide.createIcons();
}

// ==========================================================================
// Teacher Console Logic
// ==========================================================================
function setupTeacherDashboard() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('hw-due').value = tomorrow.toISOString().split('T')[0];

  renderTeacherView();

  // Content tabs
  document.querySelectorAll('#teacher-content-tabs .pill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#teacher-content-tabs .pill').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const tab = e.currentTarget.getAttribute('data-tab');
      
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(`teacher-${tab}-tab-content`).classList.add('active');
    });
  });

  // Assign Homework
  document.getElementById('add-homework-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('hw-title').value.trim();
    const subject = document.getElementById('hw-subject').value;
    const due = document.getElementById('hw-due').value;
    const desc = document.getElementById('hw-desc').value.trim();

    if (title && due && desc) {
      loadDatabase();
      const newHw = {
        id: `hw-${Date.now()}`,
        title,
        subject,
        dueDate: due,
        description: desc,
        assignedBy: "Dr. Sarah Jenkins"
      };

      state.homework.unshift(newHw);
      saveState();
      addAuditLog("Dr. Sarah Jenkins", "teacher", "assigned homework", title, "SUCCESS", `Due Date: ${due}`);

      e.target.reset();
      document.getElementById('hw-due').value = tomorrow.toISOString().split('T')[0];
      
      renderTeacherView();
      alert(`Assigned: "${title}" published.`);
    }
  });

  // Add Resource
  document.getElementById('add-resource-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('res-title').value.trim();
    const type = document.getElementById('res-type').value;
    const link = document.getElementById('res-link').value.trim();

    if (title && link) {
      loadDatabase();
      const newRes = {
        id: `res-${Date.now()}`,
        title,
        type,
        link,
        postedBy: "Dr. Sarah Jenkins",
        date: new Date().toISOString().split('T')[0]
      };

      state.resources.unshift(newRes);
      saveState();
      addAuditLog("Dr. Sarah Jenkins", "teacher", "published resource", title, "SUCCESS", `Type: ${type}`);

      e.target.reset();
      renderTeacherView();
      alert(`Published: "${title}" available.`);
    }
  });

  // Modal Review closures
  document.getElementById('close-review-modal-btn').addEventListener('click', () => {
    document.getElementById('review-modal').classList.add('d-none');
  });

  // Grade Form submit action
  document.getElementById('submission-grade-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const subId = document.getElementById('review-sub-id').value;
    const grade = document.getElementById('review-grade').value;
    const feedback = document.getElementById('review-feedback').value.trim();

    if (subId && grade && feedback) {
      loadDatabase();
      const sub = state.submissions.find(s => s.id === subId);
      if (sub) {
        sub.grade = grade;
        sub.feedback = feedback;
        sub.gradedAt = new Date().toISOString();

        saveState();
        addAuditLog("Dr. Sarah Jenkins", "teacher", "graded submission", sub.homeworkTitle, "SUCCESS", `Grade: ${grade} for ${sub.studentName}`);

        document.getElementById('review-modal').classList.add('d-none');
        document.getElementById('submission-grade-form').reset();
        
        renderTeacherView();
        alert("Success: Submission graded.");
      }
    }
  });
}

function renderTeacherView() {
  loadDatabase();

  document.getElementById('teacher-assigned-count').textContent = state.homework.length;
  document.getElementById('teacher-shared-count').textContent = state.resources.length;

  const hwContainer = document.getElementById('teacher-homework-list');
  const resContainer = document.getElementById('teacher-resources-list');
  const subContainer = document.getElementById('teacher-submissions-list');
  
  hwContainer.innerHTML = '';
  resContainer.innerHTML = '';
  subContainer.innerHTML = '';

  // Render Homework Managed list
  if (state.homework.length === 0) {
    hwContainer.innerHTML = `<div class="text-muted" style="padding: 20px; text-align: center;">No assignments yet.</div>`;
  } else {
    state.homework.forEach(hw => {
      const row = document.createElement('div');
      row.className = 'managed-item';
      row.innerHTML = `
        <div class="managed-item-info">
          <span class="managed-item-title">${escapeHTML(hw.title)}</span>
          <div class="managed-item-meta">
            <span class="tag ${hw.subject.toLowerCase() === 'web development' ? 'chemistry' : 'physics'}">${hw.subject}</span>
            <span>Due: ${hw.dueDate}</span>
          </div>
        </div>
        <button class="btn btn-danger btn-icon btn-sm delete-hw-btn" data-id="${hw.id}"><i data-lucide="trash-2"></i></button>
      `;
      row.querySelector('.delete-hw-btn').addEventListener('click', () => {
        deleteHomeworkItem(hw.id);
      });
      hwContainer.appendChild(row);
    });
  }

  // Render Resources Managed list
  if (state.resources.length === 0) {
    resContainer.innerHTML = `<div class="text-muted" style="padding: 20px; text-align: center;">No resources posted.</div>`;
  } else {
    state.resources.forEach(res => {
      const row = document.createElement('div');
      row.className = 'managed-item';
      row.innerHTML = `
        <div class="managed-item-info">
          <span class="managed-item-title">${escapeHTML(res.title)}</span>
          <div class="managed-item-meta">
            <span class="resource-type">${res.type}</span>
            <span>• Date: ${res.date}</span>
          </div>
        </div>
        <button class="btn btn-danger btn-icon btn-sm delete-res-btn" data-id="${res.id}"><i data-lucide="trash-2"></i></button>
      `;
      row.querySelector('.delete-res-btn').addEventListener('click', () => {
        deleteResourceItem(res.id);
      });
      resContainer.appendChild(row);
    });
  }

  // Render Student Submissions Review list
  if (state.submissions.length === 0) {
    subContainer.innerHTML = `<div class="text-muted" style="padding: 20px; text-align: center;">No submissions received.</div>`;
  } else {
    state.submissions.forEach(sub => {
      const row = document.createElement('div');
      row.className = 'managed-item';
      
      let gradeBadge = `<span class="badge badge-warning">Awaiting Review</span>`;
      let reviewBtn = `<button class="btn btn-primary btn-sm review-trigger-btn" data-id="${sub.id}" data-student="${escapeHTML(sub.studentName)}" data-title="${escapeHTML(sub.homeworkTitle)}" data-content="${escapeHTML(sub.content)}"><i data-lucide="edit-3"></i> Grade</button>`;

      if (sub.grade) {
        gradeBadge = `<span class="badge badge-success">Graded: ${sub.grade}</span>`;
        reviewBtn = `<button class="btn btn-secondary btn-sm review-trigger-btn" data-id="${sub.id}" data-student="${escapeHTML(sub.studentName)}" data-title="${escapeHTML(sub.homeworkTitle)}" data-content="${escapeHTML(sub.content)}"><i data-lucide="rotate-ccw"></i> Regrade</button>`;
      }

      row.innerHTML = `
        <div class="managed-item-info">
          <span class="managed-item-title">${escapeHTML(sub.homeworkTitle)}</span>
          <div class="managed-item-meta">
            <span>By: <strong>${escapeHTML(sub.studentName)}</strong></span>
            <span>• Sub: ${sub.submittedAt.slice(0, 10)}</span>
            ${gradeBadge}
          </div>
        </div>
        <div>
          ${reviewBtn}
        </div>
      `;

      // Modal Review opener
      row.querySelector('.review-trigger-btn').addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const name = e.currentTarget.getAttribute('data-student');
        const hw = e.currentTarget.getAttribute('data-title');
        const solution = e.currentTarget.getAttribute('data-content');

        document.getElementById('review-sub-id').value = id;
        document.getElementById('review-student-name').textContent = name;
        document.getElementById('review-hw-title').textContent = hw;
        document.getElementById('review-solution-text').textContent = solution;
        document.getElementById('review-modal').classList.remove('d-none');
      });

      subContainer.appendChild(row);
    });
  }

  lucide.createIcons();
}

function deleteHomeworkItem(id) {
  if (confirm("Remove this homework?")) {
    loadDatabase();
    const idx = state.homework.findIndex(h => h.id === id);
    if (idx !== -1) {
      const title = state.homework[idx].title;
      state.homework.splice(idx, 1);
      // Clean corresponding student submissions
      state.submissions = state.submissions.filter(s => s.homeworkId !== id);
      saveState();
      addAuditLog("Dr. Sarah Jenkins", "teacher", "deleted homework", title, "SUCCESS", "Removed all student submission links too.");
      renderTeacherView();
    }
  }
}

function deleteResourceItem(id) {
  if (confirm("Remove this resource?")) {
    loadDatabase();
    const idx = state.resources.findIndex(r => r.id === id);
    if (idx !== -1) {
      const title = state.resources[idx].title;
      state.resources.splice(idx, 1);
      saveState();
      addAuditLog("Dr. Sarah Jenkins", "teacher", "deleted resource", title, "SUCCESS");
      renderTeacherView();
    }
  }
}

// ==========================================================================
// CEO / Manager Portal Logic
// ==========================================================================
function setupManagerDashboard() {
  // Render static data
  renderManagerView();

  // Watch for severity changes
  document.getElementById('audit-severity-filter').addEventListener('change', (e) => {
    state.filters.auditSeverity = e.target.value;
    renderManagerLogsOnly();
  });

  // Reset database
  document.getElementById('reset-db-btn').addEventListener('click', () => {
    if (confirm("Reset local database to Web Development & Robotics defaults?")) {
      resetStateToDefault();
      addAuditLog("Kirellos George", "manager", "reset database", "System Restore", "SUCCESS", "All tables seeded with default settings.");
      renderManagerView();
    }
  });

  // Purge logs
  document.getElementById('clear-logs-btn').addEventListener('click', () => {
    if (confirm("Purge system activity log?")) {
      state.activityLogs = [];
      saveState();
      addAuditLog("Kirellos George", "manager", "purged logs", "Activity History", "WARNING", "System log files were cleared by manager credentials.");
      renderManagerView();
    }
  });
}

function renderManagerView() {
  loadDatabase();

  const totalHw = state.homework.length;
  // Calculate average completion rate based on graded items
  const totalSubmissionsGraded = state.submissions.filter(s => s.grade && s.grade !== 'Needs Revision').length;
  const rate = totalHw > 0 ? Math.round((totalSubmissionsGraded / totalHw) * 100) : 0;

  document.getElementById('ceo-total-assignments').textContent = totalHw;
  document.getElementById('ceo-avg-completion').textContent = `${rate}%`;
  document.getElementById('ceo-completion-progress').style.width = `${rate}%`;
  document.getElementById('ceo-logs-count').textContent = state.activityLogs.length;

  // Render Charts comparison
  const subjects = ['Web Development', 'Robotics'];
  const chartBox = document.getElementById('ceo-subject-bar-chart');
  chartBox.innerHTML = '';

  subjects.forEach(subject => {
    const list = state.homework.filter(h => h.subject.toLowerCase() === subject.toLowerCase());
    const gradedForSubject = state.submissions.filter(s => {
      const hw = state.homework.find(h => h.id === s.homeworkId);
      return hw && hw.subject.toLowerCase() === subject.toLowerCase() && s.grade && s.grade !== 'Needs Revision';
    }).length;
    
    const subRate = list.length > 0 ? Math.round((gradedForSubject / list.length) * 100) : 0;

    const column = document.createElement('div');
    column.className = 'chart-bar-wrapper';
    column.style.width = '100px';
    column.innerHTML = `
      <div class="chart-bar-container" title="${gradedForSubject}/${list.length} Complete">
        <div class="chart-bar" style="height: ${subRate}%">
          <span class="chart-bar-value">${subRate}%</span>
        </div>
      </div>
      <span class="chart-bar-label" style="font-size: 9px;">${subject}</span>
    `;
    chartBox.appendChild(column);
  });

  // Render Submissions Monitor list
  const subsBox = document.getElementById('ceo-submissions-list');
  subsBox.innerHTML = '';

  if (state.submissions.length === 0) {
    subsBox.innerHTML = `<div class="text-muted" style="padding: 10px; text-align: center;">No submissions yet.</div>`;
  } else {
    state.submissions.forEach(sub => {
      const div = document.createElement('div');
      div.className = 'managed-item';
      div.style.padding = '8px 12px';
      
      const badge = sub.grade 
        ? `<span class="badge badge-success">${sub.grade}</span>`
        : `<span class="badge badge-warning">Awaiting Review</span>`;

      div.innerHTML = `
        <div style="font-size: 12px; display:flex; justify-content:space-between; width:100%; align-items:center;">
          <span><strong>${escapeHTML(sub.studentName)}</strong> submitted ${escapeHTML(sub.homeworkTitle.slice(0, 22))}...</span>
          ${badge}
        </div>
      `;
      subsBox.appendChild(div);
    });
  }

  // Render chat streams (Read Only)
  renderChatMessages();

  // Render logs
  renderManagerLogsOnly();
}

function renderManagerLogsOnly() {
  const container = document.getElementById('ceo-activity-logs');
  container.innerHTML = '';
  const filter = state.filters.auditSeverity;

  const list = state.activityLogs.filter(log => {
    if (filter === 'ALL') return true;
    return log.severity === filter;
  });

  if (list.length === 0) {
    container.innerHTML = `<div class="text-muted" style="padding: 20px; text-align: center;">No audit logs match.</div>`;
  } else {
    list.forEach(log => {
      const card = document.createElement('div');
      card.className = `activity-item severity-${log.severity}`;
      
      const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const letters = log.user.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

      card.innerHTML = `
        <div class="activity-avatar ${log.role === 'teacher' ? 'teacher' : (log.role === 'system' ? 'system' : 'student')}">${letters}</div>
        <div class="activity-details">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <p class="activity-message"><strong>${escapeHTML(log.user)}</strong> (${log.role}) ${log.action} <strong>"${escapeHTML(log.type)}"</strong></p>
            <span class="severity-pill ${log.severity}">${log.severity}</span>
          </div>
          <p style="font-size: 11px; color: var(--text-secondary); margin-top:4px;">${escapeHTML(log.details)}</p>
          <span class="activity-time">${timeStr} • ${new Date(log.timestamp).toLocaleDateString()}</span>
        </div>
      `;
      container.appendChild(card);
    });
  }

  lucide.createIcons();
}

// ==========================================================================
// General Utilities
// ==========================================================================
function getResourceIconName(type) {
  if (type === 'lectures') return 'book-open';
  if (type === 'handouts') return 'file-text';
  if (type === 'links') return 'link-2';
  return 'folder';
}

function formatDate(dateString) {
  const options = { month: 'short', day: 'numeric' };
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', options);
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Start app triggers
document.addEventListener('DOMContentLoaded', initApp);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initApp();
}
