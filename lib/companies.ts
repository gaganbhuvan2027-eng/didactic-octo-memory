// Companies data for company-specific interviews
export interface CompanySocials {
  linkedin?: string
  twitter?: string
  website?: string
  youtube?: string
}

export interface Company {
  id: string
  name: string
  logo: string // emoji or icon
  industry: string
  description: string
  interviewRounds: string[]
  popularRoles: string[]
  headOfficeAddress?: string
  socials?: CompanySocials
}

export interface Role {
  id: string
  name: string
  icon: string
  category: string
  description: string
  skills: string[]
  companies: string[] // company ids that hire for this role
  /** Interview rounds relevant to this role: warmup, coding, technical, behavioral, system-design */
  interviewRounds?: string[]
}

export const companies: Company[] = [
  // Tech Giants
  {
    id: "google",
    name: "Google",
    logo: "🔍",
    industry: "Technology",
    description: "Practice for Google's rigorous interview process covering coding, system design, and behavioral rounds",
    interviewRounds: ["Phone Screen", "Technical Round", "System Design", "Behavioral", "Googleyness & Leadership"],
    popularRoles: ["software-engineer", "product-manager", "data-scientist", "sre"],
    headOfficeAddress: "Mountain View, California, United States",
    socials: { linkedin: "https://linkedin.com/company/google", twitter: "https://x.com/Google", website: "https://google.com", youtube: "https://youtube.com/google" }
  },
  {
    id: "amazon",
    name: "Amazon",
    logo: "📦",
    industry: "Technology / E-commerce",
    description: "Prepare for Amazon's Leadership Principles-focused interviews with technical and behavioral components",
    interviewRounds: ["Online Assessment", "Phone Screen", "Loop Interview (4-5 rounds)", "Bar Raiser"],
    popularRoles: ["software-engineer", "product-manager", "data-engineer", "solutions-architect"],
    headOfficeAddress: "Seattle, Washington, United States",
    socials: { linkedin: "https://linkedin.com/company/amazon", twitter: "https://x.com/amazon", website: "https://amazon.com", youtube: "https://youtube.com/amazon" }
  },
  {
    id: "microsoft",
    name: "Microsoft",
    logo: "🪟",
    industry: "Technology",
    description: "Get ready for Microsoft's technical interviews focusing on problem-solving and system design",
    interviewRounds: ["Phone Screen", "Technical Round", "System Design", "Behavioral", "As Appropriate"],
    popularRoles: ["software-engineer", "product-manager", "data-scientist", "cloud-engineer"],
    headOfficeAddress: "Redmond, Washington, United States",
    socials: { linkedin: "https://linkedin.com/company/microsoft", twitter: "https://x.com/Microsoft", website: "https://microsoft.com", youtube: "https://youtube.com/microsoft" }
  },
  {
    id: "meta",
    name: "Meta",
    logo: "♾️",
    industry: "Technology / Social Media",
    description: "Practice for Meta's coding-heavy interviews with focus on data structures and algorithms",
    interviewRounds: ["Initial Screen", "Technical Phone Screen", "Onsite Coding", "System Design", "Behavioral"],
    popularRoles: ["software-engineer", "product-manager", "ml-engineer", "data-scientist"],
    headOfficeAddress: "Menlo Park, California, United States",
    socials: { linkedin: "https://linkedin.com/company/meta", twitter: "https://x.com/meta", website: "https://meta.com", youtube: "https://youtube.com/meta" }
  },
  {
    id: "apple",
    name: "Apple",
    logo: "🍎",
    industry: "Technology / Consumer Electronics",
    description: "Prepare for Apple's secretive but thorough interview process with technical depth",
    interviewRounds: ["Recruiter Call", "Technical Phone Screen", "Onsite (5-8 interviews)", "Team Matching"],
    popularRoles: ["software-engineer", "hardware-engineer", "product-manager", "ml-engineer"],
    headOfficeAddress: "Cupertino, California, United States",
    socials: { linkedin: "https://linkedin.com/company/apple", twitter: "https://x.com/Apple", website: "https://apple.com", youtube: "https://youtube.com/apple" }
  },
  {
    id: "netflix",
    name: "Netflix",
    logo: "🎬",
    industry: "Technology / Entertainment",
    description: "Get ready for Netflix's culture-focused interviews emphasizing freedom and responsibility",
    interviewRounds: ["Recruiter Screen", "Hiring Manager", "Technical Assessment", "Team Interviews", "VP Interview"],
    popularRoles: ["software-engineer", "data-engineer", "product-manager", "sre"],
    headOfficeAddress: "Los Gatos, California, United States",
    socials: { linkedin: "https://linkedin.com/company/netflix", twitter: "https://x.com/netflix", website: "https://netflix.com", youtube: "https://youtube.com/netflix" }
  },
  {
    id: "nvidia",
    name: "NVIDIA",
    logo: "🔷",
    industry: "Technology / AI / Graphics",
    description: "Prepare for NVIDIA's interviews focused on GPU computing, AI, and graphics technology",
    interviewRounds: ["Phone Screen", "Technical Interview", "System Design", "Behavioral"],
    popularRoles: ["software-engineer", "ml-engineer", "data-scientist", "hardware-engineer"],
    headOfficeAddress: "Santa Clara, California, United States",
    socials: { linkedin: "https://linkedin.com/company/nvidia", twitter: "https://x.com/NVIDIA", website: "https://nvidia.com", youtube: "https://youtube.com/nvidia" }
  },
  {
    id: "openai",
    name: "OpenAI",
    logo: "🤖",
    industry: "Technology / AI",
    description: "Prepare for OpenAI's interviews focused on AI/ML research, large-scale systems, and cutting-edge technology",
    interviewRounds: ["Phone Screen", "Technical Interview", "Research/Coding", "System Design", "Behavioral"],
    popularRoles: ["software-engineer", "ml-engineer", "data-scientist", "product-manager"],
    headOfficeAddress: "San Francisco, California, United States",
    socials: { linkedin: "https://linkedin.com/company/openai", twitter: "https://x.com/OpenAI", website: "https://openai.com", youtube: "https://youtube.com/openai" }
  },
  // Indian Tech Companies
  {
    id: "tcs",
    name: "TCS",
    logo: "💼",
    industry: "IT Services",
    description: "Prepare for Tata Consultancy Services interviews focusing on technical fundamentals and aptitude",
    interviewRounds: ["Online Test", "Technical Interview", "Managerial Round", "HR Round"],
    popularRoles: ["software-engineer", "business-analyst", "system-analyst", "consultant"],
    headOfficeAddress: "Mumbai, Maharashtra, India",
    socials: { linkedin: "https://linkedin.com/company/tcs", twitter: "https://x.com/TCS", website: "https://tcs.com", youtube: "https://youtube.com/tcs" }
  },
  {
    id: "infosys",
    name: "Infosys",
    logo: "🔷",
    industry: "IT Services",
    description: "Practice for Infosys interviews with focus on programming, logical reasoning, and communication",
    interviewRounds: ["Online Assessment", "Technical Round", "HR Interview"],
    popularRoles: ["software-engineer", "system-engineer", "consultant", "data-analyst"],
    headOfficeAddress: "Bengaluru, Karnataka, India",
    socials: { linkedin: "https://linkedin.com/company/infosys", twitter: "https://x.com/Infosys", website: "https://infosys.com", youtube: "https://youtube.com/infosys" }
  },
  {
    id: "wipro",
    name: "Wipro",
    logo: "🌸",
    industry: "IT Services",
    description: "Get ready for Wipro's interviews covering technical skills, aptitude, and cultural fit",
    interviewRounds: ["Written Test", "Technical Interview", "HR Round"],
    popularRoles: ["software-engineer", "project-engineer", "analyst", "consultant"],
    headOfficeAddress: "Bengaluru, Karnataka, India",
    socials: { linkedin: "https://linkedin.com/company/wipro", twitter: "https://x.com/Wipro", website: "https://wipro.com", youtube: "https://youtube.com/wipro" }
  },
  {
    id: "flipkart",
    name: "Flipkart",
    logo: "🛒",
    industry: "E-commerce",
    description: "Prepare for Flipkart's challenging technical interviews with focus on scalability",
    interviewRounds: ["Machine Coding", "Problem Solving", "System Design", "Hiring Manager"],
    popularRoles: ["software-engineer", "data-scientist", "product-manager", "sde"],
    headOfficeAddress: "Bengaluru, Karnataka, India",
    socials: { linkedin: "https://linkedin.com/company/flipkart", twitter: "https://x.com/Flipkart", website: "https://flipkart.com", youtube: "https://youtube.com/flipkart" }
  },
  {
    id: "swiggy",
    name: "Swiggy",
    logo: "🍔",
    industry: "Food Tech",
    description: "Practice for Swiggy's interviews focusing on problem-solving and system design",
    interviewRounds: ["Phone Screen", "DSA Round", "Machine Coding", "System Design", "Culture Fit"],
    popularRoles: ["software-engineer", "backend-engineer", "data-scientist", "product-manager"],
    headOfficeAddress: "Bengaluru, Karnataka, India",
    socials: { linkedin: "https://linkedin.com/company/swiggy", twitter: "https://x.com/swiggy_in", website: "https://swiggy.com", youtube: "https://youtube.com/swiggy" }
  },
  {
    id: "zomato",
    name: "Zomato",
    logo: "🍕",
    industry: "Food Tech",
    description: "Get ready for Zomato's technical interviews with focus on real-world problem solving",
    interviewRounds: ["Online Assessment", "Technical Round", "System Design", "HR Round"],
    popularRoles: ["software-engineer", "backend-engineer", "data-analyst", "product-manager"],
    headOfficeAddress: "Gurugram, Haryana, India",
    socials: { linkedin: "https://linkedin.com/company/zomato", twitter: "https://x.com/zomato", website: "https://zomato.com", youtube: "https://youtube.com/zomato" }
  },
  // Consulting
  {
    id: "mckinsey",
    name: "McKinsey",
    logo: "📊",
    industry: "Consulting",
    description: "Prepare for McKinsey's case interviews and problem-solving assessments",
    interviewRounds: ["Problem Solving Test", "Case Interview (2 rounds)", "Personal Experience Interview"],
    popularRoles: ["consultant", "business-analyst", "associate", "data-scientist"],
    headOfficeAddress: "New York, New York, United States",
    socials: { linkedin: "https://linkedin.com/company/mckinsey", twitter: "https://x.com/McKinsey", website: "https://mckinsey.com", youtube: "https://youtube.com/mckinsey" }
  },
  {
    id: "bcg",
    name: "BCG",
    logo: "📈",
    industry: "Consulting",
    description: "Practice BCG's case-style interviews with emphasis on structured thinking",
    interviewRounds: ["Online Assessment", "Case Interviews (3 rounds)", "Fit Interview"],
    popularRoles: ["consultant", "associate", "data-scientist", "digital-specialist"],
    headOfficeAddress: "Boston, Massachusetts, United States",
    socials: { linkedin: "https://linkedin.com/company/bcg", twitter: "https://x.com/BCG", website: "https://bcg.com", youtube: "https://youtube.com/bcg" }
  },
  {
    id: "deloitte",
    name: "Deloitte",
    logo: "🏢",
    industry: "Consulting / Audit",
    description: "Get ready for Deloitte's multi-round interviews covering technical and behavioral aspects",
    interviewRounds: ["Online Assessment", "Group Discussion", "Technical Interview", "Partner Interview"],
    popularRoles: ["consultant", "analyst", "auditor", "technology-consultant"],
    headOfficeAddress: "London, United Kingdom",
    socials: { linkedin: "https://linkedin.com/company/deloitte", twitter: "https://x.com/Deloitte", website: "https://deloitte.com", youtube: "https://youtube.com/deloitte" }
  },
  // Finance
  {
    id: "jpmorgan",
    name: "JP Morgan",
    logo: "🏦",
    industry: "Finance / Banking",
    description: "Prepare for JP Morgan's interviews with focus on finance, technology, and leadership",
    interviewRounds: ["Online Assessment", "Video Interview", "Super Day (3-4 interviews)"],
    popularRoles: ["software-engineer", "analyst", "investment-banker", "quant"],
    headOfficeAddress: "New York, New York, United States",
    socials: { linkedin: "https://linkedin.com/company/jpmorgan", twitter: "https://x.com/jpmorgan", website: "https://jpmorgan.com", youtube: "https://youtube.com/jpmorgan" }
  },
  {
    id: "goldman",
    name: "Goldman Sachs",
    logo: "💰",
    industry: "Finance / Investment Banking",
    description: "Practice for Goldman Sachs' rigorous interviews covering technical and behavioral aspects",
    interviewRounds: ["HireVue", "Super Day (4-5 interviews)", "Final Round"],
    popularRoles: ["software-engineer", "analyst", "investment-banker", "quant"],
    headOfficeAddress: "New York, New York, United States",
    socials: { linkedin: "https://linkedin.com/company/goldman-sachs", twitter: "https://x.com/GoldmanSachs", website: "https://goldmansachs.com", youtube: "https://youtube.com/goldmansachs" }
  },
]

export const roles: Role[] = [
  // Engineering Roles
  {
    id: "software-engineer",
    name: "Software Engineer",
    icon: "💻",
    category: "Engineering",
    description: "Full-stack or specialized software development with focus on coding and system design",
    skills: ["Data Structures", "Algorithms", "System Design", "Coding", "Problem Solving"],
    companies: ["google", "amazon", "microsoft", "meta", "apple", "netflix", "openai", "flipkart", "swiggy", "tcs", "infosys"],
    interviewRounds: ["warmup", "coding", "technical", "behavioral", "system-design"],
  },
  {
    id: "frontend-engineer",
    name: "Frontend Engineer",
    icon: "🎨",
    category: "Engineering",
    description: "UI/UX implementation with modern JavaScript frameworks and web technologies",
    skills: ["React/Vue/Angular", "JavaScript/TypeScript", "CSS", "Web Performance", "Accessibility"],
    companies: ["google", "meta", "amazon", "flipkart", "swiggy"],
    interviewRounds: ["warmup", "coding", "technical", "behavioral"],
  },
  {
    id: "backend-engineer",
    name: "Backend Engineer",
    icon: "⚙️",
    category: "Engineering",
    description: "Server-side development, APIs, databases, and infrastructure",
    skills: ["API Design", "Databases", "Distributed Systems", "Microservices", "Cloud"],
    companies: ["google", "amazon", "microsoft", "netflix", "openai", "flipkart", "swiggy"],
    interviewRounds: ["warmup", "coding", "technical", "behavioral", "system-design"],
  },
  {
    id: "data-engineer",
    name: "Data Engineer",
    icon: "🔧",
    category: "Engineering",
    description: "Build and maintain data pipelines, warehouses, and infrastructure",
    skills: ["SQL", "Python", "ETL", "Data Warehousing", "Big Data (Spark, Hadoop)", "Airflow"],
    companies: ["google", "amazon", "meta", "netflix", "openai", "flipkart"],
    interviewRounds: ["warmup", "coding", "technical", "behavioral", "system-design"],
  },
  {
    id: "ml-engineer",
    name: "ML Engineer",
    icon: "🤖",
    category: "Engineering",
    description: "Build and deploy machine learning models at scale",
    skills: ["Machine Learning", "Deep Learning", "Python", "TensorFlow/PyTorch", "MLOps"],
    companies: ["google", "meta", "apple", "amazon", "netflix", "openai"],
    interviewRounds: ["warmup", "coding", "technical", "behavioral", "system-design"],
  },
  {
    id: "devops-engineer",
    name: "DevOps Engineer",
    icon: "🚀",
    category: "Engineering",
    description: "CI/CD, infrastructure automation, and cloud operations",
    skills: ["CI/CD", "Docker", "Kubernetes", "Cloud (AWS/GCP/Azure)", "Terraform", "Monitoring"],
    companies: ["google", "amazon", "microsoft", "netflix"],
    interviewRounds: ["warmup", "technical", "behavioral", "system-design"],
  },
  {
    id: "sre",
    name: "Site Reliability Engineer",
    icon: "🛡️",
    category: "Engineering",
    description: "Ensure system reliability, scalability, and performance",
    skills: ["System Design", "Monitoring", "Incident Response", "Automation", "Linux", "Networking"],
    companies: ["google", "amazon", "netflix", "meta"],
    interviewRounds: ["warmup", "coding", "technical", "behavioral", "system-design"],
  },
  // Data Roles
  {
    id: "data-scientist",
    name: "Data Scientist",
    icon: "📊",
    category: "Data",
    description: "Extract insights from data using statistics and machine learning",
    skills: ["Statistics", "Machine Learning", "Python/R", "SQL", "Data Visualization", "A/B Testing"],
    companies: ["google", "meta", "amazon", "microsoft", "openai", "flipkart", "swiggy"],
    interviewRounds: ["warmup", "coding", "technical", "behavioral"],
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    icon: "📉",
    category: "Data",
    description: "Analyze data to drive business decisions and create reports",
    skills: ["SQL", "Excel", "Data Visualization", "Python/R", "Business Intelligence"],
    companies: ["google", "amazon", "flipkart", "zomato", "infosys"],
    interviewRounds: ["warmup", "coding", "technical", "behavioral"],
  },
  {
    id: "quant",
    name: "Quantitative Analyst",
    icon: "🔢",
    category: "Finance",
    description: "Apply mathematical models to financial markets and trading",
    skills: ["Mathematics", "Statistics", "Programming (Python/C++)", "Financial Modeling", "Probability"],
    companies: ["jpmorgan", "goldman"],
    interviewRounds: ["warmup", "coding", "technical", "behavioral"],
  },
  // Product & Business
  {
    id: "product-manager",
    name: "Product Manager",
    icon: "🎯",
    category: "Product",
    description: "Define product vision, strategy, and roadmap",
    skills: ["Product Strategy", "User Research", "Data Analysis", "Stakeholder Management", "Prioritization"],
    companies: ["google", "amazon", "meta", "microsoft", "openai", "flipkart", "swiggy"],
    interviewRounds: ["warmup", "technical", "behavioral", "system-design"],
  },
  {
    id: "business-analyst",
    name: "Business Analyst",
    icon: "📋",
    category: "Business",
    description: "Bridge gap between business needs and technical solutions",
    skills: ["Requirements Gathering", "Data Analysis", "Process Improvement", "Documentation", "SQL"],
    companies: ["tcs", "infosys", "wipro", "deloitte", "mckinsey"],
    interviewRounds: ["warmup", "technical", "behavioral"],
  },
  {
    id: "consultant",
    name: "Management Consultant",
    icon: "💡",
    category: "Consulting",
    description: "Advise organizations on strategy, operations, and transformation",
    skills: ["Case Studies", "Problem Solving", "Communication", "Data Analysis", "Strategy"],
    companies: ["mckinsey", "bcg", "deloitte"],
    interviewRounds: ["warmup", "behavioral", "system-design"],
  },
  // Finance Roles
  {
    id: "investment-banker",
    name: "Investment Banker",
    icon: "💵",
    category: "Finance",
    description: "Advise on M&A, IPOs, and capital raising",
    skills: ["Financial Modeling", "Valuation", "M&A", "Excel", "Accounting"],
    companies: ["jpmorgan", "goldman"],
    interviewRounds: ["warmup", "technical", "behavioral"],
  },
  {
    id: "analyst",
    name: "Financial Analyst",
    icon: "📑",
    category: "Finance",
    description: "Analyze financial data and provide investment recommendations",
    skills: ["Financial Analysis", "Excel", "Valuation", "Research", "Presentation"],
    companies: ["jpmorgan", "goldman", "deloitte"],
    interviewRounds: ["warmup", "technical", "behavioral"],
  },
]

// Industry categories for filtering
export const industries = [
  { id: "technology", name: "Technology", icon: "💻" },
  { id: "it-services", name: "IT Services", icon: "🖥️" },
  { id: "e-commerce", name: "E-commerce", icon: "🛒" },
  { id: "food-tech", name: "Food Tech", icon: "🍔" },
  { id: "consulting", name: "Consulting", icon: "📊" },
  { id: "finance", name: "Finance & Banking", icon: "🏦" },
]

// Role categories for filtering
export const roleCategories = [
  { id: "engineering", name: "Engineering", icon: "💻" },
  { id: "data", name: "Data & Analytics", icon: "📊" },
  { id: "product", name: "Product", icon: "🎯" },
  { id: "business", name: "Business", icon: "📋" },
  { id: "consulting", name: "Consulting", icon: "💡" },
  { id: "finance", name: "Finance", icon: "💰" },
]

// Interview details and tips per company (curated from public sources)
export const companyInterviewDetails: Record<string, string[]> = {
  google: [
    "Process typically spans 4–8 weeks; technical roles emphasize coding and system design.",
    "Phone screen: 45 min with 1–2 LeetCode medium questions; focus on approach and methodology.",
    "Coding rounds: Two 45-min interviews; assess correctness, complexity, edge cases, and communication.",
    "System design: For L5+ roles, 45–60 min on scalable systems; break down problems and justify trade-offs.",
    "Googleyness & Leadership: Assesses cultural fit and leadership potential.",
    "Tip: Practice 50–75 LeetCode problems; study arrays, trees, graphs, hash maps, heaps, and DP.",
    "Tip: Explain your logic aloud as you code; communication is heavily evaluated.",
  ],
  amazon: [
    "Process spans 4–8 weeks; includes resume screening, recruiter call, online assessment, and loop.",
    "Online assessment: Self-administered coding and situational assessment.",
    "Loop: Four one-on-one interviews covering coding, system design, and behavioral questions.",
    "Bar Raiser: Unique round to ensure candidates raise the team's overall standard.",
    "Leadership Principles: All answers should align with Amazon's 16 Leadership Principles.",
    "Tip: Use the STAR method for behavioral questions; prepare specific examples.",
    "Tip: Study algorithms, data structures, system design, and OOD.",
  ],
  microsoft: [
    "Process: Application → Initial screening → On-site interviews → Offer.",
    "Initial screening: Phone call covering resume, motivation, and basic technical questions.",
    "On-site: Multiple technical rounds testing coding, design, problem-solving, and testing.",
    "Interviews are entirely virtual; problem-solving ability is valued over memorization.",
    "Tip: Tailor resume with keywords (C++, Azure, data structures); referrals help.",
    "Tip: Prepare questions about team dynamics and role specifics.",
  ],
  meta: [
    "Stages: Application → Recruiter call → 4–8 interview rounds → Offer.",
    "Coding difficulty: Medium to hard (LeetCode-level); algorithms and system design.",
    "Core values evaluated: Build social value, move fast, focus on impact, be bold.",
    "Less than 1% of applicants receive offers; preparation is critical.",
    "Tip: Ensure resume reflects minimum qualifications; highlight relevant experience.",
    "Tip: Write clean, optimized code while explaining your thought process.",
  ],
  apple: [
    "Process is secretive but thorough; typically 5–8 onsite interviews.",
    "Technical depth is emphasized; expect system design and architecture discussions.",
    "Team matching occurs after technical rounds; culture fit is important.",
    "Tip: Research Apple's products and ecosystem; show genuine interest.",
    "Tip: Prepare for both technical depth and behavioral alignment.",
  ],
  netflix: [
    "Culture-focused: Freedom and responsibility; judgment, communication, impact.",
    "Rounds: Recruiter screen, hiring manager, technical assessment, team interviews, VP interview.",
    "Expect candid discussions about past projects and decision-making.",
    "Tip: Demonstrate ownership and ability to work with minimal structure.",
  ],
  nvidia: [
    "Focus on GPU computing, AI/ML, and graphics technology.",
    "Technical rounds cover algorithms, system design, and domain-specific knowledge.",
    "Expect questions on parallel computing, CUDA, and large-scale systems.",
    "Tip: Brush up on computer architecture and performance optimization.",
  ],
  openai: [
    "Interviews focus on AI/ML research, large-scale systems, and cutting-edge technology.",
    "Rounds: Phone screen, technical, research/coding, system design, behavioral.",
    "Expect deep technical discussions and research-oriented questions.",
    "Tip: Stay current on LLMs, ML research, and distributed systems.",
  ],
  mckinsey: [
    "Case interviews and problem-solving tests; structured thinking is key.",
    "Personal Experience Interview assesses leadership and fit.",
    "Tip: Practice case frameworks; use MECE and hypothesis-driven approach.",
    "Tip: Prepare 3–5 leadership stories using the STAR method.",
  ],
  goldman: [
    "HireVue video interview followed by Super Day (4–5 interviews).",
    "Technical and behavioral mix; finance knowledge for relevant roles.",
    "Tip: Research the division you're applying to; tailor your preparation.",
  ],
  jpmorgan: [
    "Stages: Online assessment, video interview, Super Day (3–4 interviews).",
    "Mix of technical, behavioral, and finance-specific questions.",
    "Tip: Prepare for both coding and business/finance scenarios.",
  ],
  tcs: [
    "Three rounds: Online assessment (aptitude, verbal, reasoning), technical interview, HR round.",
    "Technical round tests fundamentals, programming, and current tech trends.",
    "Tip: Focus on aptitude, basic programming, and communication skills.",
  ],
  infosys: [
    "Assessment: ~100 questions in 60 min (verbal, reasoning, math, pseudo code, puzzles).",
    "Technical and HR rounds follow; emphasis on logical reasoning.",
    "Tip: Practice aptitude and pseudo-code; time management is critical.",
  ],
  wipro: [
    "Rounds: Aptitude test, coding (2 questions, 60 min), essay, technical, HR.",
    "Technical covers OOP, DSA, DBMS; coding difficulty is moderate.",
    "Tip: Brush up on fundamentals; practice timed coding problems.",
  ],
  flipkart: [
    "Machine coding, problem solving, system design, and hiring manager rounds.",
    "Focus on scalability and real-world problem solving.",
    "Tip: Practice system design for e-commerce scale; know Flipkart's tech stack.",
  ],
  swiggy: [
    "Phone screen, DSA round, machine coding, system design, culture fit.",
    "Emphasis on problem-solving and system design for food-tech scale.",
    "Tip: Prepare for real-time system design; know Swiggy's architecture.",
  ],
  zomato: [
    "Online assessment, technical round, system design, HR round.",
    "Technical focus on real-world problem solving and scalability.",
    "Tip: Research Zomato's products; prepare for food-tech scenarios.",
  ],
  bcg: [
    "Online assessment, case interviews (3 rounds), fit interview.",
    "Structured thinking and hypothesis-driven approach are key.",
    "Tip: Practice case frameworks; use MECE; prepare leadership stories.",
  ],
  deloitte: [
    "Online assessment, group discussion, technical interview, partner interview.",
    "Mix of technical, behavioral, and consulting-style questions.",
    "Tip: Prepare for group discussions; demonstrate teamwork and communication.",
  ],
}

export default { companies, roles, industries, roleCategories }
