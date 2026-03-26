export interface Internship {
  id: string;
  title: string;
  company: string;
  role: string;
  location: string;
  domain: string;
  type: "Remote" | "On-site" | "Hybrid";
  description: string;
  skills: string[];
  duration: string;
  stipend?: string;
}

export const internships: Internship[] = [
  // Web Development
  { id: "1", title: "Frontend Developer Intern", company: "TechNova", role: "Frontend Development", location: "San Francisco, CA", domain: "Web Development", type: "Remote", description: "Build modern web interfaces using React and TypeScript.", skills: ["React", "TypeScript", "CSS", "HTML"], duration: "3 months", stipend: "$2,000/month" },
  { id: "2a", title: "Full Stack Developer Intern", company: "WebForge Labs", role: "Full Stack Development", location: "Austin, TX", domain: "Web Development", type: "Hybrid", description: "Develop end-to-end web applications with modern frameworks.", skills: ["React", "Node.js", "MongoDB", "GraphQL"], duration: "6 months", stipend: "$2,800/month" },
  { id: "2b", title: "WordPress Developer Intern", company: "SiteCraft", role: "CMS Development", location: "Remote", domain: "Web Development", type: "Remote", description: "Build and customize WordPress themes and plugins for clients.", skills: ["PHP", "WordPress", "CSS", "JavaScript"], duration: "3 months", stipend: "$1,500/month" },

  // Artificial Intelligence
  { id: "2", title: "Machine Learning Intern", company: "DataMinds AI", role: "ML Engineering", location: "New York, NY", domain: "Artificial Intelligence", type: "Hybrid", description: "Work on NLP models and deploy ML pipelines.", skills: ["Python", "TensorFlow", "NLP", "Data Science"], duration: "6 months", stipend: "$3,000/month" },
  { id: "9", title: "Computer Vision Intern", company: "VisionAI Labs", role: "CV Engineering", location: "Boston, MA", domain: "Artificial Intelligence", type: "On-site", description: "Develop image recognition and object detection systems.", skills: ["Python", "OpenCV", "PyTorch", "Deep Learning"], duration: "6 months", stipend: "$3,200/month" },
  { id: "10", title: "NLP Research Intern", company: "LangTech", role: "NLP Research", location: "San Jose, CA", domain: "Artificial Intelligence", type: "Remote", description: "Research and develop conversational AI and language models.", skills: ["Python", "Transformers", "HuggingFace", "NLP"], duration: "4 months", stipend: "$3,500/month" },

  // Cloud Computing
  { id: "3", title: "Backend Developer Intern", company: "CloudStack Inc.", role: "Backend Development", location: "Austin, TX", domain: "Cloud Computing", type: "On-site", description: "Design and build scalable APIs and microservices.", skills: ["Node.js", "PostgreSQL", "Docker", "REST APIs"], duration: "4 months", stipend: "$2,500/month" },
  { id: "8", title: "DevOps Intern", company: "InfraCore", role: "DevOps Engineering", location: "Denver, CO", domain: "Cloud Computing", type: "Remote", description: "Automate CI/CD pipelines and manage cloud infrastructure.", skills: ["AWS", "Terraform", "Docker", "Kubernetes"], duration: "3 months", stipend: "$2,600/month" },
  { id: "11", title: "Cloud Solutions Intern", company: "SkyScale", role: "Cloud Architecture", location: "Seattle, WA", domain: "Cloud Computing", type: "Hybrid", description: "Help design and deploy multi-cloud solutions for enterprise clients.", skills: ["AWS", "Azure", "GCP", "Linux"], duration: "6 months", stipend: "$3,000/month" },

  // Design
  { id: "4", title: "UI/UX Design Intern", company: "PixelCraft", role: "Product Design", location: "Los Angeles, CA", domain: "Design", type: "Remote", description: "Create user-centered designs for mobile and web apps.", skills: ["Figma", "Adobe XD", "User Research", "Prototyping"], duration: "3 months", stipend: "$1,800/month" },
  { id: "12", title: "Graphic Design Intern", company: "CreativeEdge", role: "Visual Design", location: "Miami, FL", domain: "Design", type: "Remote", description: "Design marketing materials, social media assets, and brand identities.", skills: ["Photoshop", "Illustrator", "Canva", "Branding"], duration: "3 months", stipend: "$1,600/month" },
  { id: "13", title: "Motion Design Intern", company: "AniStudio", role: "Motion Graphics", location: "New York, NY", domain: "Design", type: "Hybrid", description: "Create animations and motion graphics for digital products.", skills: ["After Effects", "Premiere Pro", "Lottie", "Figma"], duration: "4 months", stipend: "$2,000/month" },

  // Data Science
  { id: "5", title: "Data Analytics Intern", company: "InsightFlow", role: "Data Analysis", location: "Chicago, IL", domain: "Data Science", type: "Remote", description: "Analyze datasets and build dashboards for business insights.", skills: ["Python", "SQL", "Tableau", "Excel"], duration: "3 months", stipend: "$2,200/month" },
  { id: "14", title: "Data Engineer Intern", company: "DataPipe Co.", role: "Data Engineering", location: "San Francisco, CA", domain: "Data Science", type: "On-site", description: "Build and optimize ETL pipelines and data warehouses.", skills: ["Python", "Spark", "Airflow", "SQL"], duration: "6 months", stipend: "$3,000/month" },
  { id: "15", title: "Business Intelligence Intern", company: "MetricsPro", role: "BI Analyst", location: "Dallas, TX", domain: "Data Science", type: "Remote", description: "Create BI reports and dashboards to drive business decisions.", skills: ["Power BI", "SQL", "Excel", "Tableau"], duration: "3 months", stipend: "$2,000/month" },

  // Cybersecurity
  { id: "6", title: "Cybersecurity Intern", company: "SecureNet", role: "Security Engineering", location: "Washington, DC", domain: "Cybersecurity", type: "On-site", description: "Assist with vulnerability assessments and security audits.", skills: ["Network Security", "Linux", "Python", "Penetration Testing"], duration: "6 months", stipend: "$2,800/month" },
  { id: "16", title: "SOC Analyst Intern", company: "CyberShield", role: "Security Operations", location: "Atlanta, GA", domain: "Cybersecurity", type: "Hybrid", description: "Monitor security events and respond to incidents in real-time.", skills: ["SIEM", "Incident Response", "Linux", "Networking"], duration: "4 months", stipend: "$2,500/month" },

  // Mobile Development
  { id: "7", title: "Mobile App Developer Intern", company: "AppVenture", role: "Mobile Development", location: "Seattle, WA", domain: "Mobile Development", type: "Hybrid", description: "Build cross-platform mobile apps with React Native.", skills: ["React Native", "JavaScript", "Firebase", "Git"], duration: "4 months", stipend: "$2,400/month" },
  { id: "17", title: "iOS Developer Intern", company: "SwiftApps", role: "iOS Development", location: "Cupertino, CA", domain: "Mobile Development", type: "On-site", description: "Develop native iOS applications using Swift and SwiftUI.", skills: ["Swift", "SwiftUI", "Xcode", "Core Data"], duration: "6 months", stipend: "$3,000/month" },
  { id: "18", title: "Flutter Developer Intern", company: "CrossMobile", role: "Cross-Platform Dev", location: "Remote", domain: "Mobile Development", type: "Remote", description: "Build beautiful cross-platform apps with Flutter and Dart.", skills: ["Flutter", "Dart", "Firebase", "REST APIs"], duration: "3 months", stipend: "$2,200/month" },

  // Blockchain
  { id: "19", title: "Blockchain Developer Intern", company: "ChainWorks", role: "Smart Contract Dev", location: "San Francisco, CA", domain: "Blockchain", type: "Remote", description: "Develop and audit smart contracts on Ethereum and Solana.", skills: ["Solidity", "Web3.js", "Ethereum", "Rust"], duration: "4 months", stipend: "$3,500/month" },
  { id: "20", title: "DeFi Research Intern", company: "CryptoLabs", role: "DeFi Analyst", location: "Miami, FL", domain: "Blockchain", type: "Remote", description: "Research and analyze DeFi protocols and tokenomics.", skills: ["DeFi", "Solidity", "Financial Analysis", "Python"], duration: "3 months", stipend: "$2,800/month" },

  // Marketing
  { id: "21", title: "Digital Marketing Intern", company: "GrowthHive", role: "Digital Marketing", location: "New York, NY", domain: "Marketing", type: "Remote", description: "Plan and execute digital marketing campaigns across channels.", skills: ["SEO", "Google Ads", "Social Media", "Analytics"], duration: "3 months", stipend: "$1,800/month" },
  { id: "22", title: "Content Marketing Intern", company: "ContentFlow", role: "Content Strategy", location: "Chicago, IL", domain: "Marketing", type: "Remote", description: "Create blog posts, whitepapers, and content strategies.", skills: ["Copywriting", "SEO", "WordPress", "Social Media"], duration: "3 months", stipend: "$1,500/month" },

  // Product Management
  { id: "23", title: "Product Management Intern", company: "ProductHQ", role: "Product Manager", location: "San Francisco, CA", domain: "Product Management", type: "Hybrid", description: "Work with cross-functional teams to ship product features.", skills: ["Jira", "User Stories", "Agile", "Data Analysis"], duration: "4 months", stipend: "$2,800/month" },
  { id: "24", title: "Technical Product Intern", company: "BuildStack", role: "Technical PM", location: "Seattle, WA", domain: "Product Management", type: "On-site", description: "Bridge engineering and business to define technical roadmaps.", skills: ["SQL", "APIs", "Agile", "Stakeholder Mgmt"], duration: "6 months", stipend: "$3,000/month" },

  // Game Development
  { id: "25", title: "Game Developer Intern", company: "PixelForge Games", role: "Game Programming", location: "Los Angeles, CA", domain: "Game Development", type: "Hybrid", description: "Develop game mechanics and systems using Unity engine.", skills: ["Unity", "C#", "3D Math", "Game Design"], duration: "4 months", stipend: "$2,200/month" },
  { id: "26", title: "Game Design Intern", company: "Dreamscape Studios", role: "Game Design", location: "Austin, TX", domain: "Game Development", type: "On-site", description: "Design game levels, narratives, and player experiences.", skills: ["Unreal Engine", "Level Design", "Storytelling", "Prototyping"], duration: "3 months", stipend: "$2,000/month" },

  // IoT & Embedded
  { id: "27", title: "IoT Developer Intern", company: "SmartThings Lab", role: "Embedded Systems", location: "Boston, MA", domain: "IoT & Embedded", type: "On-site", description: "Build IoT solutions using microcontrollers and cloud platforms.", skills: ["Arduino", "Raspberry Pi", "MQTT", "Python"], duration: "4 months", stipend: "$2,400/month" },

  // Finance & Fintech
  { id: "28", title: "Fintech Developer Intern", company: "PayFlow", role: "Fintech Engineering", location: "New York, NY", domain: "Finance & Fintech", type: "Hybrid", description: "Build payment processing features and financial dashboards.", skills: ["Python", "React", "Stripe API", "SQL"], duration: "6 months", stipend: "$3,200/month" },
  { id: "29", title: "Quantitative Analyst Intern", company: "AlphaQuant", role: "Quant Analysis", location: "Chicago, IL", domain: "Finance & Fintech", type: "On-site", description: "Develop quantitative models and algorithmic trading strategies.", skills: ["Python", "R", "Statistics", "Financial Modeling"], duration: "4 months", stipend: "$4,000/month" },

  // Healthcare Tech
  { id: "30", title: "Health Tech Intern", company: "MedAI Solutions", role: "Healthcare Engineering", location: "Boston, MA", domain: "Healthcare Tech", type: "Hybrid", description: "Build AI-powered tools for medical diagnostics and patient care.", skills: ["Python", "ML", "FHIR", "React"], duration: "6 months", stipend: "$3,000/month" },
];

export const domains = [...new Set(internships.map((i) => i.domain))];
export const locations = [...new Set(internships.map((i) => i.location))];
export const types: Internship["type"][] = ["Remote", "On-site", "Hybrid"];
