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
  {
    id: "1",
    title: "Frontend Developer Intern",
    company: "TechNova",
    role: "Frontend Development",
    location: "San Francisco, CA",
    domain: "Web Development",
    type: "Remote",
    description: "Build modern web interfaces using React and TypeScript.",
    skills: ["React", "TypeScript", "CSS", "HTML"],
    duration: "3 months",
    stipend: "$2,000/month",
  },
  {
    id: "2",
    title: "Machine Learning Intern",
    company: "DataMinds AI",
    role: "ML Engineering",
    location: "New York, NY",
    domain: "Artificial Intelligence",
    type: "Hybrid",
    description: "Work on NLP models and deploy ML pipelines.",
    skills: ["Python", "TensorFlow", "NLP", "Data Science"],
    duration: "6 months",
    stipend: "$3,000/month",
  },
  {
    id: "3",
    title: "Backend Developer Intern",
    company: "CloudStack Inc.",
    role: "Backend Development",
    location: "Austin, TX",
    domain: "Cloud Computing",
    type: "On-site",
    description: "Design and build scalable APIs and microservices.",
    skills: ["Node.js", "PostgreSQL", "Docker", "REST APIs"],
    duration: "4 months",
    stipend: "$2,500/month",
  },
  {
    id: "4",
    title: "UI/UX Design Intern",
    company: "PixelCraft",
    role: "Product Design",
    location: "Los Angeles, CA",
    domain: "Design",
    type: "Remote",
    description: "Create user-centered designs for mobile and web apps.",
    skills: ["Figma", "Adobe XD", "User Research", "Prototyping"],
    duration: "3 months",
    stipend: "$1,800/month",
  },
  {
    id: "5",
    title: "Data Analytics Intern",
    company: "InsightFlow",
    role: "Data Analysis",
    location: "Chicago, IL",
    domain: "Data Science",
    type: "Remote",
    description: "Analyze datasets and build dashboards for business insights.",
    skills: ["Python", "SQL", "Tableau", "Excel"],
    duration: "3 months",
    stipend: "$2,200/month",
  },
  {
    id: "6",
    title: "Cybersecurity Intern",
    company: "SecureNet",
    role: "Security Engineering",
    location: "Washington, DC",
    domain: "Cybersecurity",
    type: "On-site",
    description: "Assist with vulnerability assessments and security audits.",
    skills: ["Network Security", "Linux", "Python", "Penetration Testing"],
    duration: "6 months",
    stipend: "$2,800/month",
  },
  {
    id: "7",
    title: "Mobile App Developer Intern",
    company: "AppVenture",
    role: "Mobile Development",
    location: "Seattle, WA",
    domain: "Mobile Development",
    type: "Hybrid",
    description: "Build cross-platform mobile apps with React Native.",
    skills: ["React Native", "JavaScript", "Firebase", "Git"],
    duration: "4 months",
    stipend: "$2,400/month",
  },
  {
    id: "8",
    title: "DevOps Intern",
    company: "InfraCore",
    role: "DevOps Engineering",
    location: "Denver, CO",
    domain: "Cloud Computing",
    type: "Remote",
    description: "Automate CI/CD pipelines and manage cloud infrastructure.",
    skills: ["AWS", "Terraform", "Docker", "Kubernetes"],
    duration: "3 months",
    stipend: "$2,600/month",
  },
];

export const domains = [...new Set(internships.map((i) => i.domain))];
export const locations = [...new Set(internships.map((i) => i.location))];
export const types: Internship["type"][] = ["Remote", "On-site", "Hybrid"];
