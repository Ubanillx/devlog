import siteConfigData from './siteConfig.json';

export interface TechStackItem {
  category: string;
  items: string[];
}

export interface ExperienceItem {
  role: string;
  company: string;
  period: string;
  desc: string;
}

export interface SiteConfig {
  site: {
    title: string;
    subtitle: string;
    description: string;
    keywords: string[];
  };
  author: {
    name: string;
    avatar: string;
    bio: string;
    email: string;
    location: string;
  };
  social: {
    github: string;
    twitter: string;
    linkedin: string;
    website: string;
  };
  footer: {
    copyright: string;
    showPoweredBy: boolean;
  };
  about: {
    headline: string;
    status: {
      availability: string;
      coffeeLevel: number;
      preferredShell: string;
    };
    techStack: TechStackItem[];
    experience: ExperienceItem[];
    contact: {
      title: string;
      description: string;
      buttonText: string;
    };
  };
}

export const siteConfig: SiteConfig = siteConfigData;

// 默认配置
export const defaultConfig: SiteConfig = {
  site: {
    title: "My DevLog",
    subtitle: "Personal Blog",
    description: "A developer's journey through code, design, and life.",
    keywords: ["blog", "developer", "coding", "tech"]
  },
  author: {
    name: "Developer",
    avatar: "",
    bio: "Full-stack developer passionate about building great products.",
    email: "",
    location: ""
  },
  social: {
    github: "",
    twitter: "",
    linkedin: "",
    website: ""
  },
  footer: {
    copyright: "© 2024 My DevLog. All rights reserved.",
    showPoweredBy: true
  },
  about: {
    headline: "I am a developer focused on building great web experiences.",
    status: {
      availability: "Open for Projects",
      coffeeLevel: 60,
      preferredShell: "zsh"
    },
    techStack: [
      { category: "Frontend", items: ["React", "TypeScript", "Tailwind CSS"] },
      { category: "Backend", items: ["Node.js", "PostgreSQL"] }
    ],
    experience: [
      {
        role: "Software Engineer",
        company: "Company",
        period: "2020 - Present",
        desc: "Building amazing products."
      }
    ],
    contact: {
      title: "Get in Touch",
      description: "Have a project in mind?",
      buttonText: "Contact Me"
    }
  }
};
