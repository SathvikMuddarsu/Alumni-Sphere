/**
 * AlumniSphere - Comprehensive Bulk Demo Data Population Script
 * 
 * Safely populates 50 realistic user accounts (Students, Alumni, Admin),
 * 25+ Opportunities, Mentorship connections, Networking relationships,
 * 15+ real-time Message threads, and Notifications.
 * 
 * Features:
 * - Safe & Idempotent: Never drops collections or deletes existing records
 * - Preserves existing user accounts
 * - Works with local MongoDB and MongoDB Atlas
 * - Maintains valid ObjectId cross-references
 * - Outputs backend/demo-credentials.txt
 */

require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Opportunity = require('./models/Opportunity');
const MentorshipRequest = require('./models/MentorshipRequest');
const ConnectionRequest = require('./models/ConnectionRequest');
const Message = require('./models/Message');
const Notification = require('./models/Notification');

// Shared default demo password
const DEMO_PASSWORD = 'password123';

// High-quality avatars
const AVATARS = {
  // Female avatars
  f1: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  f2: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  f3: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
  f4: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
  f5: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
  f6: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=256&q=80',
  f7: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
  f8: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80',
  f9: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=256&q=80',
  f10: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=256&q=80',

  // Male avatars
  m1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  m2: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  m3: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
  m4: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
  m5: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80',
  m6: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80',
  m7: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=256&q=80',
  m8: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=256&q=80',
  m9: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?auto=format&fit=crop&w=256&q=80',
  m10: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
};

// 65 REALISTIC USERS DEFINITION (1 Admin + 34 Alumni + 30 Students)
const DEMO_USERS_RAW = [
  // --- ADMIN ---
  {
    name: 'Admin User',
    email: 'admin@alumnisphere.com',
    role: 'admin',
    headline: 'Chief Platform Administrator & Community Architect',
    bio: 'Overseeing platform operations, strategic partnerships, verified alumni accreditation, and student career ecosystems at AlumniSphere.',
    skills: ['Platform Governance', 'Community Architecture', 'Strategic Partnerships', 'Data Analytics', 'EdTech Systems'],
    industry: 'Technology',
    course: 'MBA in Information Technology',
    experience: 12,
    location: 'San Francisco, USA',
    company: 'AlumniSphere Core',
    graduationYear: 2012,
    avatar: AVATARS.m3,
    profileViews: 310,
  },

  // --- 24 ALUMNI LEADERS & MENTORS ---
  {
    name: 'Priya Sharma',
    email: 'priya@alumni.com',
    role: 'alumni',
    headline: 'Senior Software Engineer at Google | Cloud Infrastructure',
    bio: 'Alumni class of 2016. Passionate about distributed systems, large scale cloud architectures, and mentoring aspiring software engineers on DSA and system design.',
    skills: ['React', 'Node.js', 'Go', 'Distributed Systems', 'Kubernetes', 'GCP'],
    industry: 'Technology',
    course: 'B.Tech Computer Science (CSE)',
    experience: 8,
    location: 'Bangalore, India',
    company: 'Google',
    graduationYear: 2016,
    avatar: AVATARS.f1,
    profileViews: 245,
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha@alumni.com',
    role: 'alumni',
    headline: 'Senior Full Stack Engineer at Netflix',
    bio: 'Leading playback UI experiences and micro-frontend architectures. Big open-source contributor and frequent tech conference speaker.',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS', 'Performance Tuning'],
    industry: 'Technology',
    course: 'B.Tech Information Technology',
    experience: 5,
    location: 'Pune, India',
    company: 'Netflix',
    graduationYear: 2019,
    avatar: AVATARS.f2,
    profileViews: 198,
  },
  {
    name: 'Divya Gupta',
    email: 'divya@alumni.com',
    role: 'alumni',
    headline: 'Director of Engineering at Meta',
    bio: '12+ years building high-performing engineering teams across EMEA. Specializing in career acceleration, engineering management, and AI product integration.',
    skills: ['Engineering Management', 'System Design', 'Scalability', 'Executive Leadership', 'Mentoring'],
    industry: 'Technology',
    course: 'B.Tech Computer Science (CSE)',
    experience: 12,
    location: 'London, UK',
    company: 'Meta',
    graduationYear: 2012,
    avatar: AVATARS.f4,
    profileViews: 280,
  },
  {
    name: 'Rajesh Khanna',
    email: 'rajesh@alumni.com',
    role: 'alumni',
    headline: 'Principal Mechanical Systems Engineer at Tesla',
    bio: 'Pioneering structural battery enclosures and lightweight composites for next-gen electric vehicles at the Fremont Factory.',
    skills: ['SolidWorks', 'FEA Analysis', 'Thermodynamics', 'EV Battery Systems', 'Additive Manufacturing'],
    industry: 'Automotive',
    course: 'B.Tech Mechanical Engineering',
    experience: 9,
    location: 'Fremont, USA',
    company: 'Tesla',
    graduationYear: 2015,
    avatar: AVATARS.m1,
    profileViews: 165,
  },
  {
    name: 'Siddharth Rao',
    email: 'siddharth@alumni.com',
    role: 'alumni',
    headline: 'General Manager - Infrastructure Projects at L&T Construction',
    bio: 'Managing multi-crore smart city infrastructure and metro rail development projects across western India. Passionate about sustainable civil engineering.',
    skills: ['Project Management', 'Structural Engineering', 'BIM Modelling', 'Cost Optimization', 'Civil 3D'],
    industry: 'Construction',
    course: 'B.Tech Civil Engineering',
    experience: 11,
    location: 'Mumbai, India',
    company: 'L&T Construction',
    graduationYear: 2013,
    avatar: AVATARS.m4,
    profileViews: 142,
  },
  {
    name: 'Amit Kumar',
    email: 'amit@alumni.com',
    role: 'alumni',
    headline: 'Principal Silicon Architect at Intel Corporation',
    bio: 'Focusing on cutting-edge SoC architectures, low-power digital design, and RISC-V implementation. Eager to guide VLSI and electronics enthusiasts.',
    skills: ['VLSI Design', 'Verilog', 'SystemVerilog', 'SoC Architecture', 'FPGA Prototyping'],
    industry: 'Electronics',
    course: 'B.Tech Electronics & Comm. (ECE)',
    experience: 7,
    location: 'Santa Clara, USA',
    company: 'Intel',
    graduationYear: 2017,
    avatar: AVATARS.m2,
    profileViews: 190,
  },
  {
    name: 'Neha Singh',
    email: 'neha@alumni.com',
    role: 'alumni',
    headline: 'Lead 5G/6G Telecom Solutions Architect at Ericsson',
    bio: 'Researching open RAN protocols and millimeter-wave network optimization. Promoting women in STEM and core telecommunications.',
    skills: ['5G Core Networks', 'Wireless Communications', 'Signal Processing', 'Open RAN', 'IoT Protocols'],
    industry: 'Telecommunications',
    course: 'M.Tech Telecommunication Systems',
    experience: 8,
    location: 'Stockholm, Sweden',
    company: 'Ericsson',
    graduationYear: 2016,
    avatar: AVATARS.f3,
    profileViews: 172,
  },
  {
    name: 'Vikram Singh',
    email: 'vikram@alumni.com',
    role: 'alumni',
    headline: 'Principal Applied Scientist at Amazon AI',
    bio: 'Building recommendation systems and large language model fine-tuning pipelines powering Amazon Prime and AWS Bedrock.',
    skills: ['Python', 'PyTorch', 'Large Language Models', 'Deep Learning', 'MLOps', 'AWS SageMaker'],
    industry: 'Technology',
    course: 'M.Tech Data Science & AI',
    experience: 7,
    location: 'Delhi NCR, India',
    company: 'Amazon',
    graduationYear: 2017,
    avatar: AVATARS.m5,
    profileViews: 260,
  },
  {
    name: 'Rahul Verma',
    email: 'rahul@alumni.com',
    role: 'alumni',
    headline: 'Group Product Manager at Microsoft Azure',
    bio: 'Overseeing enterprise developer tools and cloud marketplace integrations. Helping engineering graduates transition smoothly into product management.',
    skills: ['Product Management', 'Go-to-Market Strategy', 'Agile Leadership', 'Cloud Computing', 'User Telemetry'],
    industry: 'Technology',
    course: 'MBA in Tech Management',
    experience: 6,
    location: 'Hyderabad, India',
    company: 'Microsoft',
    graduationYear: 2018,
    avatar: AVATARS.m6,
    profileViews: 215,
  },
  {
    name: 'Ananya Patel',
    email: 'ananya@alumni.com',
    role: 'alumni',
    headline: 'Senior Design Systems Lead at Apple',
    bio: 'Crafting spatial interface guidelines and multi-platform design tokens for iOS and visionOS. Mentor for aspiring UX and UI designers.',
    skills: ['Design Systems', 'Figma', 'Human Interface Guidelines', 'User Research', 'Prototyping'],
    industry: 'Design',
    course: 'B.Des User Experience Design',
    experience: 6,
    location: 'Sydney, Australia',
    company: 'Apple',
    graduationYear: 2018,
    avatar: AVATARS.f5,
    profileViews: 230,
  },
  {
    name: 'Gaurav Kapoor',
    email: 'gaurav.kapoor@alumni.com',
    role: 'alumni',
    headline: 'Senior AI Research Scientist at NVIDIA',
    bio: 'Pushing GPU accelerated generative models and CUDA kernel optimizations. Mentoring students on ML theory and high-performance computing.',
    skills: ['CUDA', 'C++', 'PyTorch', 'Generative AI', 'High Performance Computing', 'Computer Vision'],
    industry: 'Technology',
    course: 'M.Tech Computer Science (CSE)',
    experience: 8,
    location: 'Bangalore, India',
    company: 'NVIDIA',
    graduationYear: 2016,
    avatar: AVATARS.m7,
    profileViews: 210,
  },
  {
    name: 'Meenal Jain',
    email: 'meenal.jain@alumni.com',
    role: 'alumni',
    headline: 'Staff Backend Engineer at Uber Technologies',
    bio: 'Architecting high-throughput real-time dispatch and routing engines handling millions of concurrent trips worldwide.',
    skills: ['Go', 'Kafka', 'Microservices', 'System Design', 'Redis', 'Cassandra'],
    industry: 'Technology',
    course: 'B.Tech Computer Science (CSE)',
    experience: 7,
    location: 'Hyderabad, India',
    company: 'Uber',
    graduationYear: 2017,
    avatar: AVATARS.f6,
    profileViews: 185,
  },
  {
    name: 'Rohit Bansal',
    email: 'rohit.bansal@alumni.com',
    role: 'alumni',
    headline: 'VP - Quantitative Algorithmic Trading at Goldman Sachs',
    bio: 'Designing ultra-low latency quantitative execution strategies and risk models. Enthusiastic about fintech and math-heavy engineering.',
    skills: ['Quantitative Finance', 'Python', 'C++', 'Algorithmic Trading', 'Time Series Forecasting'],
    industry: 'Finance',
    course: 'B.Tech Mathematics & Computing',
    experience: 9,
    location: 'Mumbai, India',
    company: 'Goldman Sachs',
    graduationYear: 2015,
    avatar: AVATARS.m8,
    profileViews: 195,
  },
  {
    name: 'Swati Mishra',
    email: 'swati.mishra@alumni.com',
    role: 'alumni',
    headline: 'Principal Product Designer at Adobe Creative Cloud',
    bio: 'Designing AI-augmented creative tools like Firefly. Keen to guide students on portfolio reviews and design interview strategy.',
    skills: ['Product Design', 'Figma', 'UX Research', 'Interaction Design', 'Generative UI'],
    industry: 'Design',
    course: 'M.Des Interaction Design',
    experience: 8,
    location: 'Noida, India',
    company: 'Adobe',
    graduationYear: 2016,
    avatar: AVATARS.f7,
    profileViews: 175,
  },
  {
    name: 'Karthik Ramesh',
    email: 'karthik.ramesh@alumni.com',
    role: 'alumni',
    headline: 'Senior Cloud Solutions Architect at Salesforce',
    bio: 'Enterprise CRM integrations, multi-tenant cloud security, and resilient event architectures. Active student mentor since 2019.',
    skills: ['Salesforce Architecture', 'Enterprise Cloud', 'AWS', 'Security & Compliance', 'Apex'],
    industry: 'Technology',
    course: 'B.Tech Information Technology',
    experience: 10,
    location: 'Bangalore, India',
    company: 'Salesforce',
    graduationYear: 2014,
    avatar: AVATARS.m9,
    profileViews: 160,
  },
  {
    name: 'Deepika Rao',
    email: 'deepika.rao@alumni.com',
    role: 'alumni',
    headline: 'Lead Security Engineer at Stripe',
    bio: 'Protecting global financial infrastructure from modern threat vectors. Passionate about cryptography, app sec, and ethical hacking.',
    skills: ['Application Security', 'Penetration Testing', 'Cryptography', 'Cloud Sec', 'Threat Modeling'],
    industry: 'Finance',
    course: 'B.Tech Computer Science (CSE)',
    experience: 6,
    location: 'Singapore',
    company: 'Stripe',
    graduationYear: 2018,
    avatar: AVATARS.f8,
    profileViews: 205,
  },
  {
    name: 'Manish Tiwari',
    email: 'manish.tiwari@alumni.com',
    role: 'alumni',
    headline: 'Principal Systems Engineer at Cisco Systems',
    bio: 'Designing next-generation SDN routers and cloud-native network virtualization software. Mentoring networking and communications students.',
    skills: ['Software Defined Networking', 'Linux Kernel', 'C', 'BGP', 'Cloud Networking'],
    industry: 'Telecommunications',
    course: 'B.Tech Electronics & Comm. (ECE)',
    experience: 11,
    location: 'Bangalore, India',
    company: 'Cisco',
    graduationYear: 2013,
    avatar: AVATARS.m10,
    profileViews: 145,
  },
  {
    name: 'Bhavna Singh',
    email: 'bhavna.singh@alumni.com',
    role: 'alumni',
    headline: 'Senior Management Consultant at McKinsey & Company',
    bio: 'Advising Fortune 500 boards on digital transformation, AI adoption roadmaps, and tech investments.',
    skills: ['Management Consulting', 'Digital Strategy', 'Business Transformation', 'Financial Modeling'],
    industry: 'Consulting',
    course: 'MBA in General Management',
    experience: 7,
    location: 'Dubai, UAE',
    company: 'McKinsey & Company',
    graduationYear: 2017,
    avatar: AVATARS.f9,
    profileViews: 220,
  },
  {
    name: 'Tarun Khanna',
    email: 'tarun.khanna@alumni.com',
    role: 'alumni',
    headline: 'Lead Biomedical Hardware Engineer at Siemens Healthineers',
    bio: 'Developing precision MRI signal sensors and robotic surgical imaging systems. Mentoring students in biomedical and electrical engineering.',
    skills: ['Medical Imaging', 'Biomedical Instrumentation', 'Embedded C', 'Signal Conditioning', 'FDA Standards'],
    industry: 'Healthcare',
    course: 'M.Tech Biomedical Engineering',
    experience: 9,
    location: 'Erlangen, Germany',
    company: 'Siemens Healthineers',
    graduationYear: 2015,
    avatar: AVATARS.m1,
    profileViews: 155,
  },
  {
    name: 'Ritika Chopra',
    email: 'ritika.chopra@alumni.com',
    role: 'alumni',
    headline: 'Senior iOS Engineer at Spotify',
    bio: 'Building immersive audio playback experiences for 500M+ active listeners worldwide. Passionate about Swift, SwiftUI, and mobile architecture.',
    skills: ['Swift', 'SwiftUI', 'iOS Architecture', 'CoreAudio', 'App Performance'],
    industry: 'Technology',
    course: 'B.Tech Computer Science (CSE)',
    experience: 6,
    location: 'London, UK',
    company: 'Spotify',
    graduationYear: 2018,
    avatar: AVATARS.f10,
    profileViews: 190,
  },
  {
    name: 'Alok Ranjan',
    email: 'alok.ranjan@alumni.com',
    role: 'alumni',
    headline: 'Principal Database Architect at Oracle',
    bio: 'Autonomous database engines, high-availability replication, and query optimizer internals. Guiding students in database engineering.',
    skills: ['Database Architecture', 'C++', 'SQL Optimization', 'Distributed Storage', 'Cloud Infrastructure'],
    industry: 'Technology',
    course: 'B.Tech Information Technology',
    experience: 12,
    location: 'Bengaluru, India',
    company: 'Oracle',
    graduationYear: 2012,
    avatar: AVATARS.m2,
    profileViews: 140,
  },
  {
    name: 'Zoya Akhtar',
    email: 'zoya.akhtar@alumni.com',
    role: 'alumni',
    headline: 'Lead Design Technologist at Canva',
    bio: 'Bridging the gap between engineering and design. Building creative UI engines and generative graphics workflows.',
    skills: ['Design Engineering', 'WebGL', 'Three.js', 'React', 'Canvas API', 'UI Animation'],
    industry: 'Design',
    course: 'B.Des Multimedia Design',
    experience: 5,
    location: 'Sydney, Australia',
    company: 'Canva',
    graduationYear: 2019,
    avatar: AVATARS.f1,
    profileViews: 175,
  },
  {
    name: 'Sameer Sheikh',
    email: 'sameer.sheikh@alumni.com',
    role: 'alumni',
    headline: 'Staff 5G Modem Systems Engineer at Qualcomm',
    bio: 'Designing physical-layer signal processing algorithms and RF modem firmware for Snapdragon mobile platforms.',
    skills: ['Digital Signal Processing', 'MATLAB', '5G NR', 'Embedded Firmware', 'C++'],
    industry: 'Electronics',
    course: 'M.Tech Communications Engineering',
    experience: 8,
    location: 'San Diego, USA',
    company: 'Qualcomm',
    graduationYear: 2016,
    avatar: AVATARS.m3,
    profileViews: 180,
  },
  {
    name: 'Natasha Dutt',
    email: 'natasha.dutt@alumni.com',
    role: 'alumni',
    headline: 'Staff Solutions Architect at Databricks',
    bio: 'Empowering enterprises to build unified lakehouses, Apache Spark pipelines, and production generative AI applications.',
    skills: ['Databricks', 'Apache Spark', 'Python', 'Delta Lake', 'Data Engineering', 'AWS'],
    industry: 'Technology',
    course: 'B.Tech Computer Science (CSE)',
    experience: 7,
    location: 'Seattle, USA',
    company: 'Databricks',
    graduationYear: 2017,
    avatar: AVATARS.f2,
    profileViews: 200,
  },

  // --- 25 ENERGETIC STUDENTS ---
  {
    name: 'Arjun Kumar',
    email: 'arjun@student.com',
    role: 'student',
    headline: 'Computer Science Undergrad at IIT Madras | Full-Stack & ML',
    bio: 'Pre-final year CSE student building full-stack web applications and exploring distributed systems. Looking for mentorship in FAANG software engineering interview prep.',
    skills: ['React', 'Node.js', 'TypeScript', 'Python', 'Docker', 'PostgreSQL'],
    industry: 'Technology',
    course: 'B.Tech Computer Science (CSE)',
    experience: 0,
    location: 'Chennai, India',
    graduationYear: 2026,
    avatar: AVATARS.m4,
    profileViews: 110,
  },
  {
    name: 'Rohan Mehta',
    email: 'rohan@student.com',
    role: 'student',
    headline: 'Mechanical Engineering Undergrad | Robotics & EV Systems',
    bio: 'Lead engineer of the campus Formula Student Electric racing team. Interested in battery thermal management and CAD structural optimization.',
    skills: ['SolidWorks', 'ANSYS', 'Robotics', 'MATLAB', 'Thermal Analysis'],
    industry: 'Automotive',
    course: 'B.Tech Mechanical Engineering',
    experience: 0,
    location: 'Pune, India',
    graduationYear: 2025,
    avatar: AVATARS.m5,
    profileViews: 95,
  },
  {
    name: 'Kavya Nair',
    email: 'kavya@student.com',
    role: 'student',
    headline: 'ECE Undergrad | Embedded Systems & IoT Architectures',
    bio: 'Building low-power smart agriculture sensor mesh networks. Seeking guidance on VLSI chip design and microcontroller firmware development.',
    skills: ['Embedded C', 'IoT', 'Arduino', 'Verilog', 'PCB Design'],
    industry: 'Electronics',
    course: 'B.Tech Electronics & Comm. (ECE)',
    experience: 0,
    location: 'Tiruchirappalli, India',
    graduationYear: 2026,
    avatar: AVATARS.f3,
    profileViews: 88,
  },
  {
    name: 'Tariq Ali',
    email: 'tariq@student.com',
    role: 'student',
    headline: 'Civil Engineering Undergrad | Smart Infrastructure & BIM',
    bio: 'Exploring structural stability of high-rise buildings and modern earthquake-resistant concrete designs. Eager to connect with construction project managers.',
    skills: ['AutoCAD Civil 3D', 'STAAD.Pro', 'Structural Analysis', 'Project Estimation'],
    industry: 'Construction',
    course: 'B.Tech Civil Engineering',
    experience: 0,
    location: 'Hyderabad, India',
    graduationYear: 2026,
    avatar: AVATARS.m6,
    profileViews: 75,
  },
  {
    name: 'Meera Joshi',
    email: 'meera@student.com',
    role: 'student',
    headline: 'Data Science Master\'s Candidate | NLP & LLMs',
    bio: 'Researching multilingual sentiment classification and retrieval-augmented generation. Seeking guidance on landing machine learning engineer roles.',
    skills: ['Python', 'PyTorch', 'Natural Language Processing', 'SQL', 'Hugging Face'],
    industry: 'Technology',
    course: 'M.Tech Data Science & AI',
    experience: 0,
    location: 'Bengaluru, India',
    graduationYear: 2025,
    avatar: AVATARS.f4,
    profileViews: 130,
  },
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@student.edu',
    role: 'student',
    headline: 'B.Tech CSE Sophomore | Competitive Programmer & Web3',
    bio: 'Candidate Master on Codeforces. Keen on algorithmic problem solving, smart contracts, and high-performance backend systems.',
    skills: ['C++', 'Data Structures & Algorithms', 'Solidity', 'Go', 'Docker'],
    industry: 'Technology',
    course: 'B.Tech Computer Science (CSE)',
    experience: 0,
    location: 'Delhi NCR, India',
    graduationYear: 2027,
    avatar: AVATARS.m7,
    profileViews: 92,
  },
  {
    name: 'Ishita Verma',
    email: 'ishita.verma@student.edu',
    role: 'student',
    headline: 'UX/UI Design Undergrad | Design Systems & Accessibility',
    bio: 'Passionate about human-centered design, inclusive interfaces, and micro-interactions. Winner of national hackathon design track.',
    skills: ['Figma', 'User Research', 'Design Systems', 'Wireframing', 'HTML/CSS'],
    industry: 'Design',
    course: 'B.Des User Experience Design',
    experience: 0,
    location: 'Mumbai, India',
    graduationYear: 2026,
    avatar: AVATARS.f5,
    profileViews: 105,
  },
  {
    name: 'Aditya Patel',
    email: 'aditya.patel@student.edu',
    role: 'student',
    headline: 'B.Tech IT Junior | Cloud DevOps & Site Reliability',
    bio: 'AWS Certified Solutions Architect Associate. Automating infrastructure with Terraform and deploying microservices on Kubernetes.',
    skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD Pipelines', 'Linux', 'Docker'],
    industry: 'Technology',
    course: 'B.Tech Information Technology',
    experience: 0,
    location: 'Ahmedabad, India',
    graduationYear: 2026,
    avatar: AVATARS.m8,
    profileViews: 85,
  },
  {
    name: 'Riya Sen',
    email: 'riya.sen@student.edu',
    role: 'student',
    headline: 'MBA Candidate | Tech Product Management & Analytics',
    bio: 'Bridging engineering logic with business metrics. Experienced in user interviews, product requirement docs, and market growth analysis.',
    skills: ['Product Analytics', 'Agile/Scrum', 'Mixpanel', 'Market Research', 'SQL'],
    industry: 'Technology',
    course: 'MBA in Tech Management',
    experience: 1,
    location: 'Kolkata, India',
    graduationYear: 2025,
    avatar: AVATARS.f6,
    profileViews: 115,
  },
  {
    name: 'Karan Malhotra',
    email: 'karan.malhotra@student.edu',
    role: 'student',
    headline: 'B.Tech Mechanical Final Year | CAD & Manufacturing Automation',
    bio: 'Working on autonomous mobile robot chassis design and 3D printing slicing algorithms. Seeking EV powertrain mentorship.',
    skills: ['SolidWorks', 'MATLAB', 'CNC Programming', 'Robotics', 'Mechatronics'],
    industry: 'Automotive',
    course: 'B.Tech Mechanical Engineering',
    experience: 0,
    location: 'Chandigarh, India',
    graduationYear: 2025,
    avatar: AVATARS.m9,
    profileViews: 70,
  },
  {
    name: 'Ananya Deshmukh',
    email: 'ananya.deshmukh@student.edu',
    role: 'student',
    headline: 'ECE Junior | Signal Processing & Digital Communications',
    bio: 'Conducting research on software-defined radio communications and RF filter simulation. Eager to explore telecom careers.',
    skills: ['MATLAB', 'Python', 'Digital Signal Processing', 'Circuit Simulation', 'C'],
    industry: 'Electronics',
    course: 'B.Tech Electronics & Comm. (ECE)',
    experience: 0,
    location: 'Nagpur, India',
    graduationYear: 2026,
    avatar: AVATARS.f7,
    profileViews: 65,
  },
  {
    name: 'Nikhil Reddy',
    email: 'nikhil.reddy@student.edu',
    role: 'student',
    headline: 'B.Tech CSE Sophomore | Backend Development & Databases',
    bio: 'Building scalable REST APIs with Express and Go. Passionate about query optimization and distributed caching with Redis.',
    skills: ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Redis', 'Docker'],
    industry: 'Technology',
    course: 'B.Tech Computer Science (CSE)',
    experience: 0,
    location: 'Hyderabad, India',
    graduationYear: 2027,
    avatar: AVATARS.m10,
    profileViews: 82,
  },
  {
    name: 'Pooja Iyer',
    email: 'pooja.iyer@student.edu',
    role: 'student',
    headline: 'B.Tech Biotechnology Junior | Bioinformatics & Drug Discovery',
    bio: 'Applying machine learning algorithms to protein folding predictions and genomic sequence alignments.',
    skills: ['Python', 'Bioinformatics', 'R', 'Biopython', 'Data Analysis'],
    industry: 'Healthcare',
    course: 'B.Tech Biotechnology',
    experience: 0,
    location: 'Bengaluru, India',
    graduationYear: 2026,
    avatar: AVATARS.f8,
    profileViews: 90,
  },
  {
    name: 'Siddharth Nair',
    email: 'siddharth.nair@student.edu',
    role: 'student',
    headline: 'B.Tech CSE Senior | Cybersecurity & Ethical Hacking',
    bio: 'Active participant in Capture The Flag competitions. Passionate about web application vulnerability analysis and network security.',
    skills: ['Penetration Testing', 'Network Security', 'Linux', 'Python', 'Burp Suite'],
    industry: 'Technology',
    course: 'B.Tech Computer Science (CSE)',
    experience: 0,
    location: 'Kochi, India',
    graduationYear: 2025,
    avatar: AVATARS.m1,
    profileViews: 120,
  },
  {
    name: 'Tanvi Bhatia',
    email: 'tanvi.bhatia@student.edu',
    role: 'student',
    headline: 'B.Des UI/UX Final Year | Mobile Design & Microinteractions',
    bio: 'Creating user journey maps and interactive mobile prototypes. Passionate about fintech and consumer tech experience design.',
    skills: ['Figma', 'Prototyping', 'User Testing', 'Visual Design', 'Design Thinking'],
    industry: 'Design',
    course: 'B.Des User Experience Design',
    experience: 0,
    location: 'Jaipur, India',
    graduationYear: 2025,
    avatar: AVATARS.f9,
    profileViews: 98,
  },
  {
    name: 'Harsh Vardhan',
    email: 'harsh.vardhan@student.edu',
    role: 'student',
    headline: 'B.Tech Civil Senior | Transportation Planning & GIS',
    bio: 'Researching urban traffic decongestion models and GIS mapping for smart arterial highway development.',
    skills: ['GIS Mapping', 'AutoCAD', 'Traffic Simulation', 'Surveying'],
    industry: 'Construction',
    course: 'B.Tech Civil Engineering',
    experience: 0,
    location: 'Lucknow, India',
    graduationYear: 2025,
    avatar: AVATARS.m2,
    profileViews: 68,
  },
  {
    name: 'Divyansh Gupta',
    email: 'divyansh.gupta@student.edu',
    role: 'student',
    headline: 'M.Tech CSE Student | High Performance Computing & GPU Architecture',
    bio: 'Parallelizing numerical algorithms using CUDA and OpenMP. Eager to transition into silicon hardware accelerators and ML systems.',
    skills: ['CUDA', 'C++', 'Parallel Computing', 'Computer Architecture', 'Linux'],
    industry: 'Technology',
    course: 'M.Tech Computer Science (CSE)',
    experience: 1,
    location: 'Kanpur, India',
    graduationYear: 2025,
    avatar: AVATARS.m3,
    profileViews: 104,
  },
  {
    name: 'Sneha Menon',
    email: 'sneha.menon@student.edu',
    role: 'student',
    headline: 'B.Tech IT Final Year | Frontend Architectures & Mobile Apps',
    bio: 'Building cross-platform mobile apps with React Native. Passionate about fluid 60fps animations and offline-first mobile apps.',
    skills: ['React Native', 'React', 'JavaScript', 'Tailwind CSS', 'Redux Toolkit'],
    industry: 'Technology',
    course: 'B.Tech Information Technology',
    experience: 0,
    location: 'Thiruvananthapuram, India',
    graduationYear: 2025,
    avatar: AVATARS.f10,
    profileViews: 110,
  },
  {
    name: 'Ayush Saxena',
    email: 'ayush.saxena@student.edu',
    role: 'student',
    headline: 'B.Tech CSE Junior | Open Source Contributor & DevRel',
    bio: 'Organizing campus hackathons, writing technical blogs on web standards, and contributing to open-source developer tooling.',
    skills: ['JavaScript', 'Technical Writing', 'Git', 'Open Source', 'Node.js'],
    industry: 'Technology',
    course: 'B.Tech Computer Science (CSE)',
    experience: 0,
    location: 'Bhopal, India',
    graduationYear: 2026,
    avatar: AVATARS.m4,
    profileViews: 86,
  },
  {
    name: 'Krishna Chaitanya',
    email: 'krishna.chaitanya@student.edu',
    role: 'student',
    headline: 'ECE Senior | Embedded Linux & Automotive Telematics',
    bio: 'Developing CAN bus telemetry parsers for electric 2-wheelers. Seeking mentor insights on Tier 1 automotive software design.',
    skills: ['Embedded Linux', 'C', 'CAN Protocol', 'Microcontrollers', 'RTOS'],
    industry: 'Automotive',
    course: 'B.Tech Electronics & Comm. (ECE)',
    experience: 0,
    location: 'Vijayawada, India',
    graduationYear: 2025,
    avatar: AVATARS.m5,
    profileViews: 74,
  },
  {
    name: 'Shreya Ghoshal',
    email: 'shreya.g@student.edu',
    role: 'student',
    headline: 'B.Tech Biotechnology Senior | Computational Biology',
    bio: 'Leveraging R and statistical models to analyze RNA-seq single-cell datasets. Aiming for global PhD programs in biostatistics.',
    skills: ['R', 'Statistical Genetics', 'Python', 'Data Visualization', 'Genomics'],
    industry: 'Healthcare',
    course: 'B.Tech Biotechnology',
    experience: 0,
    location: 'Kolkata, India',
    graduationYear: 2025,
    avatar: AVATARS.f1,
    profileViews: 95,
  },
  {
    name: 'Varun Dhawan',
    email: 'varun.d@student.edu',
    role: 'student',
    headline: 'MBA in Finance Candidate | FinTech & Capital Markets',
    bio: 'Student portfolio manager at campus investment fund. Analyzing equity valuations and fintech disruption in emerging markets.',
    skills: ['Financial Valuation', 'Excel Modeling', 'Corporate Finance', 'Capital Markets', 'SQL'],
    industry: 'Finance',
    course: 'MBA in Finance',
    experience: 1,
    location: 'Mumbai, India',
    graduationYear: 2025,
    avatar: AVATARS.m6,
    profileViews: 102,
  },
  {
    name: 'Simran Kaur',
    email: 'simran.kaur@student.edu',
    role: 'student',
    headline: 'B.Tech CSE Sophomore | AI Ethics & Human-Centered Computing',
    bio: 'Investigating algorithmic bias in automated hiring pipelines. Passionate about responsible AI policy and explainable models.',
    skills: ['Python', 'Responsible AI', 'Machine Learning', 'Ethics in Tech', 'Data Analysis'],
    industry: 'Technology',
    course: 'B.Tech Computer Science (CSE)',
    experience: 0,
    location: 'Amritsar, India',
    graduationYear: 2027,
    avatar: AVATARS.f2,
    profileViews: 80,
  },
  {
    name: 'Pranav Kulkarni',
    email: 'pranav.kulkarni@student.edu',
    role: 'student',
    headline: 'Mechanical Engineering Junior | Thermal Modeling & CFD',
    bio: 'Simulating airflow dynamics and electronics cooling in server racks. Seeking mentorship on aerospace thermal engineering.',
    skills: ['CFD Simulation', 'ANSYS Fluent', 'Thermodynamics', 'Fluid Mechanics'],
    industry: 'Automotive',
    course: 'B.Tech Mechanical Engineering',
    experience: 0,
    location: 'Nashik, India',
    graduationYear: 2026,
    avatar: AVATARS.m7,
    profileViews: 62,
  },
  {
    name: 'Anushka Sen',
    email: 'anushka.sen@student.edu',
    role: 'student',
    headline: 'B.Tech IT Junior | Cloud Security & Compliance',
    bio: 'Setting up zero-trust access policies and exploring cloud compliance automation with Python and AWS IAM.',
    skills: ['Cloud Security', 'AWS IAM', 'Python', 'Zero Trust Architecture', 'Docker'],
    industry: 'Technology',
    course: 'B.Tech Information Technology',
    experience: 0,
    location: 'Indore, India',
    graduationYear: 2026,
    avatar: AVATARS.f3,
    profileViews: 84,
  },

  // --- 15 PRESTIGIOUS INSTITUTION ALUMNI, STUDENTS & SENIOR MENTORS ---
  // IIT Profiles
  {
    name: 'Rohit Kulkarni',
    email: 'rohit.iitb@alumni.com',
    role: 'alumni',
    headline: 'Principal ML Systems Engineer at OpenAI | IIT Bombay CSE Alum',
    bio: 'Alum of IIT Bombay CSE (2015). 9 years building distributed deep learning clusters and low-latency inference systems. Open for technical mentorship and career guidance.',
    skills: ['Machine Learning', 'Python', 'Distributed Systems', 'System Design', 'PyTorch'],
    industry: 'Technology',
    course: 'B.Tech Computer Science - IIT Bombay',
    experience: 9,
    location: 'San Francisco, USA',
    company: 'OpenAI',
    graduationYear: 2015,
    avatar: AVATARS.m1,
    profileViews: 280,
  },
  {
    name: 'Aditi Deshmukh',
    email: 'aditi.iitd@alumni.com',
    role: 'alumni',
    headline: 'VP of Product Engineering at Databricks | IIT Delhi Alum',
    bio: 'IIT Delhi Class of 2014. Scaled big data lakehouse platforms and analytics query engines. Passionate about helping women engineers grow into technical leadership roles.',
    skills: ['System Architecture', 'Product Management', 'Big Data', 'Distributed Systems', 'Agile'],
    industry: 'Technology',
    course: 'B.Tech Electrical Engineering - IIT Delhi',
    experience: 10,
    location: 'Seattle, USA',
    company: 'Databricks',
    graduationYear: 2014,
    avatar: AVATARS.f4,
    profileViews: 310,
  },
  {
    name: 'Varun Chandrasekhar',
    email: 'varun.iitm@student.edu',
    role: 'student',
    headline: 'Dual Degree CSE Senior at IIT Madras | Systems & Networking Researcher',
    bio: 'Undergraduate researcher at IIT Madras Systems Group. Working on eBPF packet processing and zero-copy networking. Seeking collaborations with alumni in cloud infra.',
    skills: ['C++', 'Linux Kernel', 'System Design', 'Go', 'Distributed Systems'],
    industry: 'Technology',
    course: 'Dual Degree B.Tech/M.Tech CSE - IIT Madras',
    experience: 0,
    location: 'Chennai, India',
    company: 'IIT Madras',
    graduationYear: 2025,
    avatar: AVATARS.m8,
    profileViews: 145,
  },
  {
    name: 'Shreya Banerjee',
    email: 'shreya.iitkgp@student.edu',
    role: 'student',
    headline: 'B.Tech Mechanical Senior at IIT Kharagpur | Autonomous Robotics & Control',
    bio: 'Leading Autonomous Vehicle Perception subgroup at IIT Kharagpur. Experienced with ROS2, sensor fusion, and SLAM algorithms.',
    skills: ['Robotics', 'Python', 'C++', 'Computer Vision', 'ROS2', 'SolidWorks'],
    industry: 'Automotive',
    course: 'B.Tech Mechanical Engineering - IIT Kharagpur',
    experience: 0,
    location: 'Kharagpur, India',
    company: 'IIT Kharagpur',
    graduationYear: 2025,
    avatar: AVATARS.f7,
    profileViews: 120,
  },
  {
    name: 'Tanmay Aggarwal',
    email: 'tanmay.iitk@student.edu',
    role: 'student',
    headline: 'B.Tech EE Junior at IIT Kanpur | VLSI & High-Speed FPGA Design',
    bio: 'Exploring hardware acceleration for deep neural networks on Xilinx FPGAs. Keen to connect with semiconductor industry alumni.',
    skills: ['VLSI Design', 'Verilog', 'SystemVerilog', 'Embedded Systems', 'C++'],
    industry: 'Technology',
    course: 'B.Tech Electrical Engineering - IIT Kanpur',
    experience: 0,
    location: 'Kanpur, India',
    company: 'IIT Kanpur',
    graduationYear: 2026,
    avatar: AVATARS.m9,
    profileViews: 110,
  },

  // NIT Profiles
  {
    name: 'Karthik Sundaram',
    email: 'karthik.nitt@alumni.com',
    role: 'alumni',
    headline: 'Staff Site Reliability Engineer at LinkedIn | NIT Trichy Alum',
    bio: 'NIT Trichy Class of 2017. Specializing in high-availability multi-cloud Kubernetes architectures, chaos engineering, and incident response.',
    skills: ['Kubernetes', 'AWS', 'Go', 'DevOps', 'System Design', 'Observability'],
    industry: 'Technology',
    course: 'B.Tech Instrumentation - NIT Trichy',
    experience: 7,
    location: 'Bangalore, India',
    company: 'LinkedIn',
    graduationYear: 2017,
    avatar: AVATARS.m6,
    profileViews: 215,
  },
  {
    name: 'Meghana Rao',
    email: 'meghana.nitw@student.edu',
    role: 'student',
    headline: 'B.Tech CSE Junior at NIT Warangal | Full Stack Developer & Open Source',
    bio: 'Building web applications with React, Node.js, and GraphQL. Active contributor to open source developer tools. Seeking software engineering internships.',
    skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Python'],
    industry: 'Technology',
    course: 'B.Tech Computer Science - NIT Warangal',
    experience: 0,
    location: 'Warangal, India',
    company: 'NIT Warangal',
    graduationYear: 2026,
    avatar: AVATARS.f8,
    profileViews: 95,
  },
  {
    name: 'Arvind Hegde',
    email: 'arvind.nitk@alumni.com',
    role: 'alumni',
    headline: 'Principal Semiconductor Architect at Qualcomm | NIT Surathkal Alum',
    bio: '11 years designing 5G modem DSP cores and high-throughput RF frontends at Qualcomm. Dedicated mentor for electronics and VLSI graduates.',
    skills: ['VLSI Design', 'DSP', 'System Architecture', 'C++', 'Semiconductors'],
    industry: 'Technology',
    course: 'B.Tech ECE - NIT Surathkal',
    experience: 11,
    location: 'San Diego, USA',
    company: 'Qualcomm',
    graduationYear: 2013,
    avatar: AVATARS.m4,
    profileViews: 275,
  },

  // SRM Institute of Science and Technology Profiles
  {
    name: 'Harish Narayanan',
    email: 'harish.srm@alumni.com',
    role: 'alumni',
    headline: 'Senior Cloud Security Architect at Cisco | SRM Alum',
    bio: 'Proud SRM Institute of Science and Technology alum (Class of 2018). Passionate about cloud threat detection, DevSecOps pipelines, and mentoring SRM students.',
    skills: ['Cybersecurity', 'AWS', 'Python', 'DevOps', 'Docker', 'Kubernetes'],
    industry: 'Technology',
    course: 'B.Tech Information Technology - SRM University',
    experience: 6,
    location: 'Chennai, India',
    company: 'Cisco Systems',
    graduationYear: 2018,
    avatar: AVATARS.m5,
    profileViews: 185,
  },
  {
    name: 'Pooja Krishnan',
    email: 'pooja.srm@student.edu',
    role: 'student',
    headline: 'B.Tech CSE Senior at SRM Institute of Science and Technology | Data Science',
    bio: 'Specializing in computer vision and natural language processing at SRM. Looking for graduate mentorship and full-time software engineering roles.',
    skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Data Analytics'],
    industry: 'Technology',
    course: 'B.Tech Computer Science - SRM Institute of Science and Technology',
    experience: 0,
    location: 'Chennai, India',
    company: 'SRM University',
    graduationYear: 2025,
    avatar: AVATARS.f9,
    profileViews: 105,
  },

  // Global Elite Profiles (MIT & Stanford)
  {
    name: 'Dr. Alexander Wright',
    email: 'alex.mit@alumni.com',
    role: 'alumni',
    headline: 'Principal AI Scientist at DeepMind | MIT CSAIL Alum',
    bio: 'PhD from MIT Computer Science & Artificial Intelligence Laboratory (CSAIL). Working on multi-agent reinforcement learning and neural code generation. Passionate about global mentorship.',
    skills: ['Machine Learning', 'Python', 'Reinforcement Learning', 'PyTorch', 'System Architecture'],
    industry: 'Technology',
    course: 'PhD Computer Science - MIT',
    experience: 9,
    location: 'London, UK',
    company: 'Google DeepMind',
    graduationYear: 2015,
    avatar: AVATARS.m2,
    profileViews: 340,
  },
  {
    name: 'Elena Rostova',
    email: 'elena.stanford@alumni.com',
    role: 'alumni',
    headline: 'Head of Autonomous Fleet Systems at Waymo | Stanford Alum',
    bio: 'MS in Robotics from Stanford University. Over 10 years designing fail-safe navigation and behavioral planning for commercial robotaxis.',
    skills: ['Robotics', 'C++', 'System Design', 'Autonomous Systems', 'Agile Leadership'],
    industry: 'Automotive',
    course: 'MS Robotics - Stanford University',
    experience: 10,
    location: 'Mountain View, USA',
    company: 'Waymo',
    graduationYear: 2014,
    avatar: AVATARS.f5,
    profileViews: 290,
  },

  // Senior Mentors & Industry Leaders
  {
    name: 'Sanjay Menon',
    email: 'sanjay.mentor@alumni.com',
    role: 'alumni',
    headline: 'Executive Coach & Former VP Engineering at Microsoft | Senior Mentor',
    bio: '15+ years in tech leadership. Guided over 200 engineers into principal roles and tech startups. Mentoring on engineering career acceleration, executive communication, and system design.',
    skills: ['Executive Leadership', 'System Architecture', 'Product Management', 'Mentoring', 'Agile'],
    industry: 'Technology',
    course: 'B.Tech Computer Science & MS Software Systems',
    experience: 16,
    location: 'Bangalore, India',
    company: 'TechMentor Advisory',
    graduationYear: 2008,
    avatar: AVATARS.m10,
    profileViews: 420,
  },
  {
    name: 'Nandini Iyer',
    email: 'nandini.mentor@alumni.com',
    role: 'alumni',
    headline: 'Chief People Officer & Talent Partner | Career Navigation Mentor',
    bio: 'Specializing in resume optimization, executive behavioral interviewing, and offer negotiation for tech and product roles globally.',
    skills: ['Product Management', 'Agile Leadership', 'System Design', 'Mentoring'],
    industry: 'Technology',
    course: 'MBA in Human Resources & Organizational Psychology',
    experience: 13,
    location: 'Singapore',
    company: 'Global Talent Partners',
    graduationYear: 2011,
    avatar: AVATARS.f6,
    profileViews: 360,
  },
  {
    name: 'Manoj Varma',
    email: 'manoj.mentor@alumni.com',
    role: 'alumni',
    headline: 'Distinguished Architect at Salesforce | Senior Technical Mentor',
    bio: '14 years building hyper-scale multi-tenant enterprise platforms. Avid tech speaker and mentor for students aiming for Tier-1 product companies.',
    skills: ['System Design', 'Cloud Architecture', 'Java', 'Distributed Systems', 'Mentoring'],
    industry: 'Technology',
    course: 'B.Tech CSE - NIT Trichy',
    experience: 14,
    location: 'San Francisco, USA',
    company: 'Salesforce',
    graduationYear: 2010,
    avatar: AVATARS.m3,
    profileViews: 395,
  },
];

// 26 REALISTIC OPPORTUNITIES
const DEMO_OPPORTUNITIES_TEMPLATE = [
  // 12 Jobs
  {
    title: 'Senior Full Stack Engineer (React & Node.js)',
    company: 'Google Cloud',
    description: 'Join the Google Cloud Developer Experience team. You will architect enterprise-scale microservices, design rich web UIs, and work on high-throughput backend APIs used by millions of global developers daily.',
    type: 'job',
    skills: ['React', 'Node.js', 'TypeScript', 'Kubernetes', 'GCP'],
    location: 'Bangalore, India',
    salary: '₹32 - 45 LPA',
    deadlineDays: 45,
  },
  {
    title: 'Distributed Systems & Infrastructure Engineer',
    company: 'Netflix',
    description: 'Work on Netflix\'s edge gateway routing billions of requests per second. Requires deep knowledge of Java or Go, high-concurrency protocols, and multi-region AWS infrastructure.',
    type: 'job',
    skills: ['Go', 'Java', 'Distributed Systems', 'AWS', 'Kafka'],
    location: 'Remote',
    salary: '₹35 - 50 LPA',
    deadlineDays: 60,
  },
  {
    title: 'Machine Learning Research Engineer',
    company: 'Amazon AI',
    description: 'Train and deploy deep learning models for multi-modal recommendations on AWS. Collaborate with principal scientists to publish research and deliver consumer-facing impact.',
    type: 'job',
    skills: ['Python', 'PyTorch', 'Large Language Models', 'MLOps', 'AWS SageMaker'],
    location: 'Delhi NCR, India',
    salary: '₹28 - 42 LPA',
    deadlineDays: 30,
  },
  {
    title: 'Electric Powertrain Simulation Engineer',
    company: 'Tesla Motors',
    description: 'Design and validate thermal models for structural battery packs and high-voltage drive units. SolidWorks and FEA modeling proficiency required.',
    type: 'job',
    skills: ['SolidWorks', 'Thermodynamics', 'FEA Analysis', 'EV Battery Systems'],
    location: 'Fremont, USA',
    salary: '$125,000 - $150,000/year',
    deadlineDays: 40,
  },
  {
    title: 'Principal Silicon VLSI Verification Engineer',
    company: 'Intel Corporation',
    description: 'Spearhead SystemVerilog and UVM testbench architectures for next-generation multi-core server processors.',
    type: 'job',
    skills: ['SystemVerilog', 'UVM', 'VLSI Design', 'SoC Architecture'],
    location: 'Santa Clara, USA',
    salary: '$135,000 - $165,000/year',
    deadlineDays: 50,
  },
  {
    title: 'Senior Infrastructure Project Engineer',
    company: 'L&T Construction',
    description: 'Oversee structural engineering and site execution for major metro rail and elevated expressway projects. Lead site teams and coordinate with municipal authorities.',
    type: 'job',
    skills: ['Project Management', 'Structural Engineering', 'AutoCAD Civil 3D'],
    location: 'Mumbai, India',
    salary: '₹14 - 20 LPA',
    deadlineDays: 35,
  },
  {
    title: 'Staff Product Manager - Cloud AI',
    company: 'Microsoft Azure',
    description: 'Define the roadmap for Azure Cognitive Services. Work directly with enterprise customers, research scientists, and developer advocacy teams to ship AI developer APIs.',
    type: 'job',
    skills: ['Product Management', 'Cloud Computing', 'Generative AI', 'Agile Leadership'],
    location: 'Hyderabad, India',
    salary: '₹35 - 55 LPA',
    deadlineDays: 45,
  },
  {
    title: 'Senior Design Systems Engineer',
    company: 'Apple',
    description: 'Bridge design and engineering by building pixel-perfect, accessible component libraries supporting macOS and iOS apps.',
    type: 'job',
    skills: ['Design Systems', 'SwiftUI', 'Figma', 'TypeScript', 'Web Accessibility'],
    location: 'Sydney, Australia',
    salary: '$130,000 - $155,000/year',
    deadlineDays: 60,
  },
  {
    title: 'Quantitative Trading Software Engineer',
    company: 'Goldman Sachs',
    description: 'Build low-latency order execution systems and algorithmic pricing engines. C++ and multi-threading expertise essential.',
    type: 'job',
    skills: ['C++', 'Quantitative Finance', 'Multi-threading', 'Linux', 'Python'],
    location: 'Mumbai, India',
    salary: '₹30 - 48 LPA',
    deadlineDays: 30,
  },
  {
    title: 'Platform Security Architect',
    company: 'Stripe Payments',
    description: 'Design threat models, review cryptographic protocols, and secure cloud payment gateways handling billions in transaction volume.',
    type: 'job',
    skills: ['Application Security', 'Cryptography', 'Cloud Sec', 'Threat Modeling'],
    location: 'Singapore',
    salary: 'S$140,000 - S$180,000/year',
    deadlineDays: 45,
  },
  {
    title: 'Senior Cloud Lakehouse Architect',
    company: 'Databricks',
    description: 'Guide enterprise clients on architecting petabyte-scale data lakes and streaming analytics with Apache Spark and Delta Lake.',
    type: 'job',
    skills: ['Databricks', 'Apache Spark', 'Python', 'Data Engineering', 'AWS'],
    location: 'Seattle, USA',
    salary: '$140,000 - $175,000/year',
    deadlineDays: 50,
  },
  {
    title: 'Senior iOS Application Engineer',
    company: 'Spotify',
    description: 'Craft high-performance audio streaming experiences and responsive playlist interfaces for iOS.',
    type: 'job',
    skills: ['Swift', 'SwiftUI', 'iOS Architecture', 'App Performance'],
    location: 'London, UK',
    salary: '£85,000 - £110,000/year',
    deadlineDays: 40,
  },

  // 7 Internships
  {
    title: 'Software Engineering Intern (Summer 2026)',
    company: 'Google',
    description: '12-week immersive software engineering internship. Work on real production features with dedicated mentorship from senior software engineers.',
    type: 'internship',
    skills: ['React', 'JavaScript', 'Data Structures & Algorithms', 'Python'],
    location: 'Bangalore, India',
    salary: '₹85,000/month',
    deadlineDays: 25,
  },
  {
    title: 'Machine Learning Research Intern',
    company: 'NVIDIA AI Labs',
    description: 'Conduct experiments in GPU acceleration and transformer inference optimization. Opportunity to co-author top-tier research papers.',
    type: 'internship',
    skills: ['PyTorch', 'Python', 'Deep Learning', 'CUDA'],
    location: 'Bangalore, India',
    salary: '₹75,000/month',
    deadlineDays: 20,
  },
  {
    title: 'Hardware & Silicon Engineering Intern',
    company: 'Intel Corporation',
    description: 'Hands-on digital circuit simulation, Verilog verification, and FPGA testbed validation under senior silicon architects.',
    type: 'internship',
    skills: ['Verilog', 'VLSI Design', 'Digital Electronics'],
    location: 'Bangalore, India',
    salary: '₹60,000/month',
    deadlineDays: 30,
  },
  {
    title: 'Product Design & UI/UX Intern',
    company: 'Adobe',
    description: 'Design user flows, wireframes, and interactive micro-interactions for creative cloud applications. Portfolio required.',
    type: 'internship',
    skills: ['Figma', 'User Research', 'Wireframing', 'Prototyping'],
    location: 'Noida, India',
    salary: '₹55,000/month',
    deadlineDays: 28,
  },
  {
    title: 'Cloud DevOps & Site Reliability Intern',
    company: 'Salesforce',
    description: 'Automate CI/CD pipelines, monitor microservice health with Prometheus, and write containerization scripts.',
    type: 'internship',
    skills: ['Docker', 'AWS', 'Linux', 'Kubernetes'],
    location: 'Hyderabad, India',
    salary: '₹65,000/month',
    deadlineDays: 35,
  },
  {
    title: 'Mechanical Design & Robotics Intern',
    company: 'Tesla',
    description: 'Design prototype brackets, sensor fixtures, and test automation rigs for vehicle assembly lines.',
    type: 'internship',
    skills: ['SolidWorks', 'CAD Modelling', '3D Printing'],
    location: 'Fremont, USA',
    salary: '$5,500/month',
    deadlineDays: 45,
  },
  {
    title: 'FinTech Quantitative Analyst Intern',
    company: 'Goldman Sachs',
    description: 'Analyze time-series financial datasets, write statistical backtests in Python, and learn risk management fundamentals.',
    type: 'internship',
    skills: ['Python', 'SQL', 'Financial Modeling', 'Statistics'],
    location: 'Mumbai, India',
    salary: '₹90,000/month',
    deadlineDays: 25,
  },

  // 4 Freelance/Contract Opportunities
  {
    title: 'Freelance React Native Mobile App Developer',
    company: 'FinFlow Technologies',
    description: 'Build a production-ready personal expense tracking app using React Native, TypeScript, and SQLite. Milestone-based payout.',
    type: 'freelance',
    skills: ['React Native', 'TypeScript', 'Mobile UI'],
    location: 'Remote',
    salary: '₹80,000 - ₹1,20,000 per milestone',
    deadlineDays: 30,
  },
  {
    title: 'Freelance 3D CAD Drone Model Drafter',
    company: 'AeroDynamics Lab',
    description: 'Produce high-precision SolidWorks CAD files for an agricultural payload delivery drone.',
    type: 'freelance',
    skills: ['SolidWorks', 'CAD', 'Aerospace Drafting'],
    location: 'Remote',
    salary: '₹45,000 per design package',
    deadlineDays: 20,
  },
  {
    title: 'Freelance Technical Content Writer (Cloud & DevOps)',
    company: 'CloudNative Weekly',
    description: 'Write 4 in-depth, code-rich tutorials on Docker, Kubernetes best practices, and Terraform modules.',
    type: 'freelance',
    skills: ['Technical Writing', 'Kubernetes', 'Docker', 'AWS'],
    location: 'Remote',
    salary: '₹12,000 per technical article',
    deadlineDays: 40,
  },
  {
    title: 'Freelance UI/UX Accessibility Auditor',
    company: 'EduAccess Global',
    description: 'Audit an educational web portal for WCAG 2.1 compliance and deliver prioritized Figma redesign recommendations.',
    type: 'freelance',
    skills: ['Figma', 'Web Accessibility', 'WCAG', 'User Audit'],
    location: 'Remote',
    salary: '₹35,000 per project',
    deadlineDays: 25,
  },

  // 3 Volunteer & Open Source Opportunities
  {
    title: 'Open Source Community Fellow - Web Accessibility',
    company: 'AlumniSphere Open Labs',
    description: 'Contribute to open-source student networking components, keyboard navigation improvements, and screen reader compatibility.',
    type: 'volunteer',
    skills: ['React', 'Accessibility', 'Open Source', 'Git'],
    location: 'Remote',
    salary: 'Certificate & Mentorship Support',
    deadlineDays: 60,
  },
  {
    title: 'Campus Ambassador & Tech Community Lead',
    company: 'AlumniSphere Student Chapter',
    description: 'Organize campus alumni AMAs, peer coding sessions, and hackathon prep workshops at your university.',
    type: 'volunteer',
    skills: ['Community Leadership', 'Public Speaking', 'Event Organizing'],
    location: 'Campus Specific / Hybrid',
    salary: 'Honorarium & Direct Alumni Mentorship',
    deadlineDays: 90,
  },
  {
    title: 'Green Tech Innovation Challenge Volunteer',
    company: 'Sustainable Campus Initiative',
    description: 'Help coordinate a multi-college sustainability hackathon focusing on IoT energy monitoring and renewable solutions.',
    type: 'volunteer',
    skills: ['Event Planning', 'IoT', 'Sustainability'],
    location: 'Remote',
    salary: 'Volunteer Recognition Award',
    deadlineDays: 50,
  },

  // 16 ADDITIONAL REALISTIC OPPORTUNITIES (Jobs, Internships, Referrals, Fellowships)
  // Jobs
  {
    title: 'Senior AI Alignment & Safety Engineer',
    company: 'OpenAI',
    description: 'Lead reinforcement learning from human feedback (RLHF) and red-teaming pipelines for next-generation foundation models.',
    type: 'job',
    skills: ['Machine Learning', 'Python', 'PyTorch', 'Distributed Systems'],
    location: 'San Francisco, USA',
    salary: '$180,000 - $240,000/year',
    deadlineDays: 45,
  },
  {
    title: 'Autonomous Driving Perception Lead',
    company: 'Waymo',
    description: 'Design and deploy multi-camera and LiDAR sensor fusion algorithms operating at 60 FPS on custom automotive compute platforms.',
    type: 'job',
    skills: ['Robotics', 'C++', 'Computer Vision', 'CUDA', 'Autonomous Systems'],
    location: 'Mountain View, USA',
    salary: '$165,000 - $210,000/year',
    deadlineDays: 50,
  },
  {
    title: 'High-Frequency Trading C++ Developer',
    company: 'Tower Research Capital',
    description: 'Design ultra-low latency order gateways and lock-free kernel-bypass network drivers in modern C++ (C++20).',
    type: 'job',
    skills: ['C++', 'Linux Kernel', 'System Design', 'Multi-threading'],
    location: 'Gurugram, India',
    salary: '₹45 - 75 LPA',
    deadlineDays: 30,
  },
  {
    title: 'Lead Cloud Infrastructure Engineer',
    company: 'LinkedIn',
    description: 'Manage massive multi-region Kubernetes clusters supporting 900M+ professionals. Champion infrastructure as code and zero-downtime migrations.',
    type: 'job',
    skills: ['Kubernetes', 'AWS', 'Go', 'DevOps', 'System Architecture'],
    location: 'Bangalore, India',
    salary: '₹38 - 55 LPA',
    deadlineDays: 40,
  },

  // Additional Internships
  {
    title: 'Deep Learning & LLM Research Intern',
    company: 'Google DeepMind',
    description: 'Work alongside world-class research scientists investigating reasoning in multi-modal foundation models and neural code synthesis.',
    type: 'internship',
    skills: ['PyTorch', 'Python', 'Machine Learning', 'Deep Learning'],
    location: 'London, UK / Hybrid',
    salary: '£4,500/month',
    deadlineDays: 20,
  },
  {
    title: 'VLSI & 5G Modem Architecture Intern',
    company: 'Qualcomm',
    description: 'Participate in architectural modeling and cycle-accurate performance simulation for Snapdragon 5G baseband silicon.',
    type: 'internship',
    skills: ['VLSI Design', 'SystemVerilog', 'Digital Electronics', 'C++'],
    location: 'Bangalore, India',
    salary: '₹65,000/month',
    deadlineDays: 35,
  },
  {
    title: 'Autonomous Vehicle Simulation Intern',
    company: 'Tesla Autopilot',
    description: 'Build photorealistic synthetic rendering pipelines and vehicle physics simulation environments for FSD testing.',
    type: 'internship',
    skills: ['C++', 'Python', 'SolidWorks', 'Robotics'],
    location: 'Palo Alto, USA',
    salary: '$6,000/month',
    deadlineDays: 45,
  },
  {
    title: 'FinTech Backend Engineering Intern',
    company: 'Stripe Payments',
    description: 'Build resilient payment ledger processing pipelines handling millions of real-time transactions with Ruby and Go.',
    type: 'internship',
    skills: ['Go', 'Node.js', 'SQL', 'Distributed Systems'],
    location: 'Singapore / Remote',
    salary: 'S$4,000/month',
    deadlineDays: 30,
  },
  {
    title: 'Cybersecurity Threat Intelligence Intern',
    company: 'Cisco Systems',
    description: 'Analyze real-time network attack telemetry, build automated IOC extraction scripts, and study emerging cloud zero-day vectors.',
    type: 'internship',
    skills: ['Cybersecurity', 'Python', 'Linux', 'Cloud Security'],
    location: 'Chennai, India',
    salary: '₹50,000/month',
    deadlineDays: 28,
  },

  // 5 Alumni Referral Opportunities (Fast-track internal recommendation)
  {
    title: '[Alumni Referral] Senior Backend Engineer (Distributed Systems)',
    company: 'Uber Technologies',
    description: 'Direct alumni referral opportunity for Uber Marketplace Dispatch engine. Candidates will receive internal sponsorship and interview prep.',
    type: 'job',
    skills: ['Go', 'Java', 'Distributed Systems', 'Kafka', 'System Design'],
    location: 'Hyderabad, India',
    salary: '₹36 - 52 LPA + Equity',
    deadlineDays: 30,
  },
  {
    title: '[Alumni Referral] Staff Software Engineer (Data Lakehouse)',
    company: 'Databricks',
    description: 'Internal referral for high-performance distributed query execution on Delta Lake. Connect directly with our alumni hiring team.',
    type: 'job',
    skills: ['Apache Spark', 'Scala', 'Distributed Systems', 'System Architecture'],
    location: 'Bangalore, India',
    salary: '₹45 - 65 LPA + Stock',
    deadlineDays: 40,
  },
  {
    title: '[Alumni Referral] Machine Learning Engineer (Creative Cloud)',
    company: 'Adobe',
    description: 'Alumni referral for Adobe Firefly generative media team. Work on diffusion models and real-time GPU image synthesis.',
    type: 'job',
    skills: ['Python', 'PyTorch', 'Machine Learning', 'Computer Vision'],
    location: 'Noida, India',
    salary: '₹28 - 42 LPA',
    deadlineDays: 25,
  },
  {
    title: '[Alumni Referral] Cloud Infrastructure Solutions Architect',
    company: 'Microsoft Azure',
    description: 'Direct referral opportunity supporting enterprise cloud migrations and AI developer infrastructure deployments.',
    type: 'job',
    skills: ['Cloud Computing', 'AWS', 'Kubernetes', 'Product Management'],
    location: 'Bangalore, India',
    salary: '₹32 - 46 LPA',
    deadlineDays: 35,
  },
  {
    title: '[Alumni Referral] Senior Silicon Verification Engineer',
    company: 'Apple Silicon',
    description: 'Direct alumni referral for M-series SoC verification team. Work with cutting-edge emulation and constrained-random testbenches.',
    type: 'job',
    skills: ['VLSI Design', 'SystemVerilog', 'UVM', 'SoC Architecture'],
    location: 'Hyderabad, India',
    salary: '₹34 - 50 LPA',
    deadlineDays: 45,
  },

  // Career & Mentorship Fellowships
  {
    title: 'Alumni 1-on-1 Career Mentorship Fellowship',
    company: 'AlumniSphere Advisory',
    description: 'Quarterly guided mentorship cohort pairing ambitious final-year students with alumni directors at Google, Meta, and Tesla.',
    type: 'volunteer',
    skills: ['Career Strategy', 'System Design', 'Interview Preparation', 'Executive Mentorship'],
    location: 'Remote',
    salary: 'Fully Funded Mentorship & Fast-Track Referrals',
    deadlineDays: 60,
  },
  {
    title: 'Open Source Distributed Database Contributor Fellow',
    company: 'Cloud Native Computing Foundation',
    description: 'Stipend-backed 3-month fellowship contributing features and benchmarks to cloud-native open source distributed databases.',
    type: 'freelance',
    skills: ['Go', 'Rust', 'Distributed Systems', 'Open Source'],
    location: 'Remote',
    salary: '₹1,50,000 Fellow Stipend',
    deadlineDays: 45,
  },
];

async function seedDemoData() {
  console.log('====================================================');
  console.log('🚀 ALUMNISPHERE COMPREHENSIVE DEMO DATA POPULATION');
  console.log('====================================================\n');

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ Error: MONGO_URI is not set in environment or backend/.env');
    process.exit(1);
  }

  const isAtlas = mongoUri.includes('mongodb.net');
  console.log(`📡 Connecting to MongoDB (${isAtlas ? 'MongoDB Atlas Cloud' : 'Local MongoDB'})...`);

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Successfully connected to MongoDB database.\n');

    const summary = {
      usersCreated: 0,
      usersExisting: 0,
      opportunitiesCreated: 0,
      opportunitiesExisting: 0,
      mentorshipsCreated: 0,
      mentorshipsExisting: 0,
      connectionsCreated: 0,
      connectionsExisting: 0,
      messagesCreated: 0,
      messagesExisting: 0,
      notificationsCreated: 0,
      notificationsExisting: 0,
    };

    // ----------------------------------------------------
    // 1. POPULATE USERS (Idempotent: findOne by email)
    // ----------------------------------------------------
    console.log(`👥 1. Populating ${DEMO_USERS_RAW.length} Realistic User Accounts...`);
    const userMap = new Map(); // email -> User document
    const demoCredentials = [];

    for (const userData of DEMO_USERS_RAW) {
      let existingUser = await User.findOne({ email: userData.email.toLowerCase() });

      if (existingUser) {
        // Update profile fields non-destructively to ensure rich demo data
        existingUser.headline = userData.headline;
        existingUser.bio = userData.bio;
        existingUser.skills = userData.skills;
        existingUser.industry = userData.industry;
        existingUser.course = userData.course;
        existingUser.experience = userData.experience;
        existingUser.location = userData.location;
        existingUser.company = userData.company;
        existingUser.graduationYear = userData.graduationYear;
        if (!existingUser.avatar || existingUser.avatar.trim() === '') {
          existingUser.avatar = userData.avatar;
        }
        await existingUser.save();
        userMap.set(userData.email.toLowerCase(), existingUser);
        summary.usersExisting++;
      } else {
        const newUser = await User.create({
          ...userData,
          email: userData.email.toLowerCase(),
          password: DEMO_PASSWORD, // Pre-save hook hashes with bcrypt automatically
        });
        userMap.set(userData.email.toLowerCase(), newUser);
        summary.usersCreated++;
      }

      demoCredentials.push({
        name: userData.name,
        email: userData.email.toLowerCase(),
        role: userData.role,
        headline: userData.headline,
        company: userData.company || 'Student / Academia',
        password: DEMO_PASSWORD,
      });
    }

    console.log(`   ✅ Users: ${summary.usersCreated} created, ${summary.usersExisting} existing/updated. (Total: ${userMap.size})`);

    // Group users by role for relationship mapping
    const alumniUsers = Array.from(userMap.values()).filter(u => u.role === 'alumni');
    const studentUsers = Array.from(userMap.values()).filter(u => u.role === 'student');
    const adminUser = Array.from(userMap.values()).find(u => u.role === 'admin') || alumniUsers[0];

    // ----------------------------------------------------
    // 2. POPULATE OPPORTUNITIES (At least 25)
    // ----------------------------------------------------
    console.log('\n💼 2. Populating 26 Career Opportunities...');
    const createdOpportunities = [];

    for (let i = 0; i < DEMO_OPPORTUNITIES_TEMPLATE.length; i++) {
      const template = DEMO_OPPORTUNITIES_TEMPLATE[i];
      // Assign poster from alumni matching company or round-robin
      const matchingAlumni = alumniUsers.find(a => 
        a.company && template.company.toLowerCase().includes(a.company.toLowerCase())
      ) || alumniUsers[i % alumniUsers.length];

      // Calculate future deadline
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + (template.deadlineDays || 30));

      // Check if opportunity with same title & company exists
      let existingOpp = await Opportunity.findOne({
        title: template.title,
        company: template.company,
      });

      if (existingOpp) {
        createdOpportunities.push(existingOpp);
        summary.opportunitiesExisting++;
      } else {
        // Pick 2-4 student applicants
        const applicantSlice = studentUsers
          .slice((i * 2) % studentUsers.length, ((i * 2) % studentUsers.length) + 3)
          .map(s => s._id);

        const savedSlice = studentUsers
          .slice((i + 3) % studentUsers.length, ((i + 3) % studentUsers.length) + 2)
          .map(s => s._id);

        const newOpp = await Opportunity.create({
          title: template.title,
          company: template.company,
          description: template.description,
          type: template.type,
          skills: template.skills,
          location: template.location,
          salary: template.salary,
          deadline: deadlineDate,
          postedBy: matchingAlumni._id,
          applicants: applicantSlice,
          savedBy: savedSlice,
          isActive: true,
        });

        // Add to students bookmarks
        for (const studentId of savedSlice) {
          await User.findByIdAndUpdate(studentId, { $addToSet: { bookmarks: newOpp._id } });
        }

        createdOpportunities.push(newOpp);
        summary.opportunitiesCreated++;
      }
    }

    console.log(`   ✅ Opportunities: ${summary.opportunitiesCreated} created, ${summary.opportunitiesExisting} existing.`);

    // ----------------------------------------------------
    // 3. POPULATE MENTORSHIP REQUESTS (Accepted, Pending, Rejected)
    // ----------------------------------------------------
    console.log('\n🤝 3. Populating Mentorship Relationships...');

    const MENTORSHIP_SEEDS = [
      // Accepted active mentorships
      { s: 'arjun@student.com', a: 'priya@alumni.com', status: 'accepted', msg: 'Hi Priya! I am an aspiring software engineer focusing on cloud computing. Would love your mentorship on backend system design.' },
      { s: 'rohan@student.com', a: 'rajesh@alumni.com', status: 'accepted', msg: 'Hello Rajesh! Deeply admire your work on Tesla EV battery enclosures. Could you guide me on structural FEA simulation?' },
      { s: 'kavya@student.com', a: 'amit@alumni.com', status: 'accepted', msg: 'Hi Amit, pursuing ECE and want to master low-power SoC and Verilog. Seeking your technical guidance!' },
      { s: 'meera@student.com', a: 'vikram@alumni.com', status: 'accepted', msg: 'Dear Vikram, doing my Master\'s in Data Science and looking for tips to transition into production NLP and LLMs.' },
      { s: 'ishita.verma@student.edu', a: 'ananya@alumni.com', status: 'accepted', msg: 'Hello Ananya! Big fan of your design systems work. Would appreciate your critique on my UX portfolio.' },
      { s: 'aditya.patel@student.edu', a: 'karthik.ramesh@alumni.com', status: 'accepted', msg: 'Hi Karthik! Keen on enterprise cloud integrations and multi-tenant architectures. Seeking your career advice.' },
      { s: 'divyansh.gupta@student.edu', a: 'gaurav.kapoor@alumni.com', status: 'accepted', msg: 'Hi Gaurav! Doing research in CUDA and parallel computing. Would love your guidance on NVIDIA roles.' },
      { s: 'sneha.menon@student.edu', a: 'sneha@alumni.com', status: 'accepted', msg: 'Hi Sneha! Fellow full-stack enthusiast building React Native apps. Would love your advice on micro-frontends.' },
      { s: 'tariq@student.com', a: 'siddharth@alumni.com', status: 'accepted', msg: 'Dear Siddharth, studying civil engineering and passionate about metro rail infrastructure. Seeking your mentorship!' },
      { s: 'nikhil.reddy@student.edu', a: 'meenal.jain@alumni.com', status: 'accepted', msg: 'Hi Meenal! Fascinated by high-throughput systems at Uber. Seeking guidance on distributed caching and Go.' },

      // Pending mentorship requests
      { s: 'aarav.sharma@student.edu', a: 'priya@alumni.com', status: 'pending', msg: 'Hello Priya, sophomore pursuing competitive programming and cloud systems. Would love your guidance!' },
      { s: 'riya.sen@student.edu', a: 'rahul@alumni.com', status: 'pending', msg: 'Hi Rahul! Transitioning from engineering to tech product management. Seeking your insights on PM interview preparation.' },
      { s: 'siddharth.nair@student.edu', a: 'deepika.rao@alumni.com', status: 'pending', msg: 'Hi Deepika! Passionate about application security and threat modeling. Seeking your career mentorship.' },
      { s: 'tanvi.bhatia@student.edu', a: 'swati.mishra@alumni.com', status: 'pending', msg: 'Hello Swati! Passionate about generative UI and design systems at Adobe. Would love your mentorship.' },
      { s: 'varun.d@student.edu', a: 'rohit.bansal@alumni.com', status: 'pending', msg: 'Dear Rohit, studying MBA Finance and algorithmic trading. Seeking guidance on quantitative careers.' },

      // Rejected / Completed mentorship requests
      { s: 'harsh.vardhan@student.edu', a: 'siddharth@alumni.com', status: 'rejected', msg: 'Seeking mentorship for geotechnical highway survey analysis.' },
      { s: 'krishna.chaitanya@student.edu', a: 'neha@alumni.com', status: 'rejected', msg: 'Looking for guidance on automotive telematics protocols.' },

      // Additional IIT, NIT, SRM & Mentor Mentorships
      { s: 'aarav.sharma@student.edu', a: 'rohit.iitb@alumni.com', status: 'accepted', msg: 'Hello Rohit! Fellow IITian here. Would love your guidance on high-throughput ML systems at OpenAI.' },
      { s: 'varun.iitm@student.edu', a: 'alex.mit@alumni.com', status: 'accepted', msg: 'Dear Dr. Wright, researching low-level Linux systems and would value your guidance on research grad school.' },
      { s: 'meghana.nitw@student.edu', a: 'karthik.nitt@alumni.com', status: 'accepted', msg: 'Hi Karthik! Aspiring SRE from NIT Warangal seeking your guidance on Kubernetes and cloud architectures.' },
      { s: 'pooja.srm@student.edu', a: 'harish.srm@alumni.com', status: 'accepted', msg: 'Hi Harish! Proud SRM student seeking your advice on cloud security and DevSecOps careers at Cisco.' },
      { s: 'shreya.iitkgp@student.edu', a: 'elena.stanford@alumni.com', status: 'accepted', msg: 'Hello Elena, leading autonomous vehicle robotics at IIT Kharagpur. Would love your guidance!' },
      { s: 'tanmay.iitk@student.edu', a: 'arvind.nitk@alumni.com', status: 'accepted', msg: 'Hi Arvind sir, pursuing hardware VLSI and FPGA acceleration. Seeking your technical mentorship.' },
      { s: 'arjun@student.com', a: 'sanjay.mentor@alumni.com', status: 'accepted', msg: 'Dear Sanjay sir, looking for career navigation and system design guidance from your executive cohort.' },
    ];

    for (const m of MENTORSHIP_SEEDS) {
      const student = userMap.get(m.s);
      const alumni = userMap.get(m.a);
      if (!student || !alumni) continue;

      const existingReq = await MentorshipRequest.findOne({ from: student._id, to: alumni._id });
      if (existingReq) {
        summary.mentorshipsExisting++;
      } else {
        await MentorshipRequest.create({
          from: student._id,
          to: alumni._id,
          status: m.status,
          message: m.msg,
        });
        summary.mentorshipsCreated++;
      }
    }

    console.log(`   ✅ Mentorships: ${summary.mentorshipsCreated} created, ${summary.mentorshipsExisting} existing.`);

    // ----------------------------------------------------
    // 4. POPULATE CONNECTION REQUESTS & MUTUAL CONNECTIONS
    // ----------------------------------------------------
    console.log('\n🔗 4. Populating Networking Connections...');

    const CONNECTION_PAIRS = [
      // Student to Alumni
      { u1: 'arjun@student.com', u2: 'priya@alumni.com', status: 'accepted' },
      { u1: 'arjun@student.com', u2: 'sneha@alumni.com', status: 'accepted' },
      { u1: 'arjun@student.com', u2: 'vikram@alumni.com', status: 'pending' },
      { u1: 'rohan@student.com', u2: 'rajesh@alumni.com', status: 'accepted' },
      { u1: 'kavya@student.com', u2: 'amit@alumni.com', status: 'accepted' },
      { u1: 'meera@student.com', u2: 'vikram@alumni.com', status: 'accepted' },
      { u1: 'tariq@student.com', u2: 'siddharth@alumni.com', status: 'accepted' },
      { u1: 'ishita.verma@student.edu', u2: 'ananya@alumni.com', status: 'accepted' },
      { u1: 'aditya.patel@student.edu', u2: 'karthik.ramesh@alumni.com', status: 'accepted' },
      { u1: 'divyansh.gupta@student.edu', u2: 'gaurav.kapoor@alumni.com', status: 'accepted' },
      { u1: 'sneha.menon@student.edu', u2: 'sneha@alumni.com', status: 'accepted' },
      { u1: 'nikhil.reddy@student.edu', u2: 'meenal.jain@alumni.com', status: 'accepted' },
      { u1: 'siddharth.nair@student.edu', u2: 'deepika.rao@alumni.com', status: 'pending' },
      { u1: 'tanvi.bhatia@student.edu', u2: 'swati.mishra@alumni.com', status: 'pending' },
      { u1: 'varun.d@student.edu', u2: 'rohit.bansal@alumni.com', status: 'accepted' },

      // Alumni to Alumni
      { u1: 'priya@alumni.com', u2: 'sneha@alumni.com', status: 'accepted' },
      { u1: 'priya@alumni.com', u2: 'divya@alumni.com', status: 'accepted' },
      { u1: 'priya@alumni.com', u2: 'gaurav.kapoor@alumni.com', status: 'accepted' },
      { u1: 'amit@alumni.com', u2: 'sameer.sheikh@alumni.com', status: 'accepted' },
      { u1: 'vikram@alumni.com', u2: 'natasha.dutt@alumni.com', status: 'accepted' },
      { u1: 'ananya@alumni.com', u2: 'zoya.akhtar@alumni.com', status: 'accepted' },
      { u1: 'rahul@alumni.com', u2: 'bhavna.singh@alumni.com', status: 'accepted' },
      { u1: 'rajesh@alumni.com', u2: 'siddharth@alumni.com', status: 'accepted' },

      // Student to Student
      { u1: 'arjun@student.com', u2: 'meera@student.com', status: 'accepted' },
      { u1: 'arjun@student.com', u2: 'aarav.sharma@student.edu', status: 'accepted' },
      { u1: 'kavya@student.com', u2: 'ananya.deshmukh@student.edu', status: 'accepted' },
      { u1: 'rohan@student.com', u2: 'karan.malhotra@student.edu', status: 'accepted' },

      // Admin Connections
      { u1: 'admin@alumnisphere.com', u2: 'priya@alumni.com', status: 'accepted' },
      { u1: 'admin@alumnisphere.com', u2: 'arjun@student.com', status: 'accepted' },
      { u1: 'admin@alumnisphere.com', u2: 'rohit.iitb@alumni.com', status: 'accepted' },
      { u1: 'admin@alumnisphere.com', u2: 'sanjay.mentor@alumni.com', status: 'accepted' },

      // Prestigious Institutional & Mentorship Connections
      { u1: 'aarav.sharma@student.edu', u2: 'rohit.iitb@alumni.com', status: 'accepted' },
      { u1: 'varun.iitm@student.edu', u2: 'aditi.iitd@alumni.com', status: 'accepted' },
      { u1: 'varun.iitm@student.edu', u2: 'alex.mit@alumni.com', status: 'accepted' },
      { u1: 'shreya.iitkgp@student.edu', u2: 'elena.stanford@alumni.com', status: 'accepted' },
      { u1: 'tanmay.iitk@student.edu', u2: 'arvind.nitk@alumni.com', status: 'accepted' },
      { u1: 'meghana.nitw@student.edu', u2: 'karthik.nitt@alumni.com', status: 'accepted' },
      { u1: 'karthik.nitt@alumni.com', u2: 'arvind.nitk@alumni.com', status: 'accepted' },
      { u1: 'pooja.srm@student.edu', u2: 'harish.srm@alumni.com', status: 'accepted' },
      { u1: 'harish.srm@alumni.com', u2: 'priya@alumni.com', status: 'accepted' },
      { u1: 'arjun@student.com', u2: 'sanjay.mentor@alumni.com', status: 'accepted' },
      { u1: 'priya@alumni.com', u2: 'sanjay.mentor@alumni.com', status: 'accepted' },
      { u1: 'divya@alumni.com', u2: 'nandini.mentor@alumni.com', status: 'accepted' },
      { u1: 'manoj.mentor@alumni.com', u2: 'karthik.nitt@alumni.com', status: 'accepted' },
    ];

    for (const c of CONNECTION_PAIRS) {
      const user1 = userMap.get(c.u1);
      const user2 = userMap.get(c.u2);
      if (!user1 || !user2) continue;

      const existingReq = await ConnectionRequest.findOne({
        $or: [
          { from: user1._id, to: user2._id },
          { from: user2._id, to: user1._id },
        ],
      });

      if (existingReq) {
        summary.connectionsExisting++;
      } else {
        await ConnectionRequest.create({
          from: user1._id,
          to: user2._id,
          status: c.status,
          message: 'I would love to connect with you on AlumniSphere and exchange professional insights!',
        });
        summary.connectionsCreated++;
      }

      // If accepted, add mutually to User.connections
      if (c.status === 'accepted') {
        await User.findByIdAndUpdate(user1._id, { $addToSet: { connections: user2._id } });
        await User.findByIdAndUpdate(user2._id, { $addToSet: { connections: user1._id } });
      }
    }

    console.log(`   ✅ Connections: ${summary.connectionsCreated} created, ${summary.connectionsExisting} existing.`);

    // ----------------------------------------------------
    // 5. POPULATE CONVERSATIONS & REAL-TIME MESSAGES (18 threads)
    // ----------------------------------------------------
    console.log('\n💬 5. Populating 18 Multi-Message Conversations...');

    const CONVERSATIONS_DATA = [
      {
        u1: 'arjun@student.com',
        u2: 'priya@alumni.com',
        messages: [
          { from: 'u1', text: 'Hello Priya ma\'am! I saw your profile and work at Google Cloud. Would love some guidance on distributed systems!' },
          { from: 'u2', text: 'Hi Arjun! Glad to connect. Distributed systems is an exciting field. Are you currently building any projects in that space?' },
          { from: 'u1', text: 'Yes, I am building an in-memory key-value store with Raft consensus replication in Go.' },
          { from: 'u2', text: 'That is impressive! Focus deeply on leader election edge-cases and log compaction. Here is our recommended roadmap architecture diagram.', attachment: { fileName: 'Distributed_Systems_Roadmap.pdf', fileType: 'application/pdf', fileSize: 1048576, url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr...' } },
          { from: 'u1', text: 'Thank you so much! I will review the roadmap and get back to you with my progress.' },
        ],
      },
      {
        u1: 'rohan@student.com',
        u2: 'rajesh@alumni.com',
        messages: [
          { from: 'u1', text: 'Hi Rajesh! I am the lead engineer of our college Formula Electric racing team.' },
          { from: 'u2', text: 'Hey Rohan! Great initiative. Formula Student was one of the best experiences of my college days. How is your chassis and battery pack design going?' },
          { from: 'u1', text: 'We are optimizing our cooling loops for high-rate discharge cycles during the endurance event.' },
          { from: 'u2', text: 'Make sure you perform rigorous transient thermal FEA under worst-case ambient heat.' },
        ],
      },
      {
        u1: 'kavya@student.com',
        u2: 'amit@alumni.com',
        messages: [
          { from: 'u1', text: 'Hi Amit sir! I am studying ECE and want to prepare for digital design roles at Intel.' },
          { from: 'u2', text: 'Hello Kavya! Master finite state machines, Verilog synthesis, and static timing analysis. Those are the cornerstones of hardware interviews.' },
          { from: 'u1', text: 'Understood. Should I also focus on SystemVerilog UVM for verification?' },
          { from: 'u2', text: 'Absolutely! Verification engineers with solid UVM fundamentals are in huge demand right now.' },
        ],
      },
      {
        u1: 'meera@student.com',
        u2: 'vikram@alumni.com',
        messages: [
          { from: 'u1', text: 'Hi Vikram! I am doing my Master\'s in Data Science and looking for tips to crack Amazon Applied Scientist roles.' },
          { from: 'u2', text: 'Hi Meera! Focus on end-to-end ML system design: data pipelines, feature stores, model latency, and offline vs online evaluation metrics.' },
          { from: 'u1', text: 'Here is my updated resume for your review when you have a moment.', attachment: { fileName: 'Meera_Joshi_ML_Resume.pdf', fileType: 'application/pdf', fileSize: 854000, url: 'data:application/pdf;base64,JVBERi0xLjQK...' } },
          { from: 'u2', text: 'Your publication on transformer fine-tuning looks great! Highlight the latency improvements prominently.' },
        ],
      },
      {
        u1: 'ishita.verma@student.edu',
        u2: 'ananya@alumni.com',
        messages: [
          { from: 'u1', text: 'Hi Ananya! I love your work on Apple design systems. Could you give feedback on my UX portfolio?' },
          { from: 'u2', text: 'Hey Ishita! Happy to take a look. Send over your portfolio link and your favorite case study.' },
          { from: 'u1', text: 'Here is my case study on inclusive navigation for public transit apps.', attachment: { fileName: 'UX_Case_Study_Transit.pdf', fileType: 'application/pdf', fileSize: 2097152, url: 'data:application/pdf;base64,JVBERi0xLjQK...' } },
          { from: 'u2', text: 'The user research depth is fantastic. Try simplifying the typography hierarchy on the final screens.' },
        ],
      },
      {
        u1: 'aditya.patel@student.edu',
        u2: 'karthik.ramesh@alumni.com',
        messages: [
          { from: 'u1', text: 'Hello Karthik sir! I am studying cloud infrastructure and DevOps. What certifications carry real weight in 2026?' },
          { from: 'u2', text: 'Hi Aditya! Hands-on GitHub projects with Terraform and Kubernetes beat multiple choice certs any day. Show, don\'t just tell!' },
          { from: 'u1', text: 'Got it! I will build an automated multi-region failover cluster on AWS and document it.' },
        ],
      },
      {
        u1: 'divyansh.gupta@student.edu',
        u2: 'gaurav.kapoor@alumni.com',
        messages: [
          { from: 'u1', text: 'Hi Gaurav! I am writing CUDA kernels for sparse matrix multiplications in my M.Tech project.' },
          { from: 'u2', text: 'Hey Divyansh! Great topic. Make sure you leverage shared memory bank-conflict avoidance and tensor cores.' },
          { from: 'u1', text: 'Thanks! I just achieved a 3.8x speedup over standard cuBLAS on our test benchmark.' },
          { from: 'u2', text: 'Impressive! Let\'s connect when our team opens our next batch of AI hardware internships.' },
        ],
      },
      {
        u1: 'sneha.menon@student.edu',
        u2: 'sneha@alumni.com',
        messages: [
          { from: 'u1', text: 'Hi Sneha! Loved your tech conference talk on React performance and micro-frontends!' },
          { from: 'u2', text: 'Thank you Sneha! It is always great to hear from enthusiastic students. Are you building with Next.js or Vite?' },
          { from: 'u1', text: 'Using Vite and Tailwind for our campus portal! Really enjoying the DX.' },
        ],
      },
      {
        u1: 'tariq@student.com',
        u2: 'siddharth@alumni.com',
        messages: [
          { from: 'u1', text: 'Dear Siddharth sir, how does L&T utilize BIM modeling in fast-track metro construction?' },
          { from: 'u2', text: 'Hi Tariq! BIM 360 and 4D scheduling allow us to detect structural clashes before a single pillar is poured. It saves months of site delays.' },
          { from: 'u1', text: 'That is fascinating. I am completing my Autodesk certification in Revit and Civil 3D right now.' },
        ],
      },
      {
        u1: 'nikhil.reddy@student.edu',
        u2: 'meenal.jain@alumni.com',
        messages: [
          { from: 'u1', text: 'Hi Meenal! How does Uber handle driver geolocation tracking at scale without database bottlenecks?' },
          { from: 'u2', text: 'Hey Nikhil! We use geospatial indexing algorithms like H3 combined with high-throughput Kafka streaming and in-memory caches.' },
          { from: 'u1', text: 'H3 hexagonal indexing! I read about that. Will build a small prototype simulation.' },
        ],
      },
      // Alumni to Alumni threads
      {
        u1: 'priya@alumni.com',
        u2: 'sneha@alumni.com',
        messages: [
          { from: 'u1', text: 'Hey Sneha! Are you attending the Alumni Tech Conclave next month in Bangalore?' },
          { from: 'u2', text: 'Hey Priya! Yes, I am on the panel for cloud-native frontend architectures. We should definitely catch up!' },
          { from: 'u1', text: 'Awesome! Let\'s organize a joint mock-interview workshop for the final-year students.' },
          { from: 'u2', text: 'Count me in. The students on AlumniSphere this year are exceptionally motivated.' },
        ],
      },
      {
        u1: 'priya@alumni.com',
        u2: 'gaurav.kapoor@alumni.com',
        messages: [
          { from: 'u1', text: 'Hi Gaurav! Google Cloud and NVIDIA just announced our expanded DGX Cloud partnership.' },
          { from: 'u2', text: 'Hey Priya! Yes, our engineering teams worked closely on optimizing the low-latency interconnects.' },
          { from: 'u1', text: 'Great work! Let\'s coordinate on referral candidates from our college.' },
        ],
      },
      {
        u1: 'vikram@alumni.com',
        u2: 'natasha.dutt@alumni.com',
        messages: [
          { from: 'u1', text: 'Hi Natasha! How is the Databricks lakehouse integration going for large language model data pipelines?' },
          { from: 'u2', text: 'Hey Vikram! The Delta Live Tables features have significantly streamlined feature store synchronization.' },
          { from: 'u1', text: 'Glad to hear. We should co-author a tech blog on ML data engineering best practices.' },
        ],
      },
      {
        u1: 'amit@alumni.com',
        u2: 'sameer.sheikh@alumni.com',
        messages: [
          { from: 'u1', text: 'Hi Sameer! Are you guys targeting 3nm or 2nm for the next generation Qualcomm RF modems?' },
          { from: 'u2', text: 'Hey Amit! We are pushing advanced node packaging to keep thermal dissipation manageable under heavy 5G mmWave loads.' },
          { from: 'u1', text: 'Thermal challenges in mobile silicon are relentless. Let\'s catch up over coffee this weekend.' },
        ],
      },
      {
        u1: 'ananya@alumni.com',
        u2: 'zoya.akhtar@alumni.com',
        messages: [
          { from: 'u1', text: 'Hey Zoya! Saw Canva\'s latest generative UI tools. The canvas rendering performance is super slick!' },
          { from: 'u2', text: 'Thanks Ananya! We rewrote the rendering engine in WebGL and WebAssembly to eliminate frame drops.' },
          { from: 'u1', text: 'Brilliant engineering. Inspiring to see alumni pushing the boundaries of web design tech.' },
        ],
      },
      // Student to Student threads
      {
        u1: 'arjun@student.com',
        u2: 'meera@student.com',
        messages: [
          { from: 'u1', text: 'Hey Meera! Are you submitting a project for the National College Hackathon this weekend?' },
          { from: 'u2', text: 'Hey Arjun! Yes, building an AI-assisted research paper summarizer. Need a full-stack developer on the team!' },
          { from: 'u1', text: 'I am in! I can build the React frontend and fast Express backend.' },
          { from: 'u2', text: 'Awesome! Let\'s team up and win this!' },
        ],
      },
      {
        u1: 'arjun@student.com',
        u2: 'aarav.sharma@student.edu',
        messages: [
          { from: 'u1', text: 'Hi Aarav! Saw your Codeforces rating jumped to Candidate Master. Congrats!' },
          { from: 'u2', text: 'Thanks Arjun! Practicing dynamic programming and graph algorithms daily paid off.' },
          { from: 'u1', text: 'Would love to practice mock coding interview rounds with you.' },
        ],
      },
      {
        u1: 'kavya@student.com',
        u2: 'ananya.deshmukh@student.edu',
        messages: [
          { from: 'u1', text: 'Hi Ananya! Do you have the lab manual for the digital signal processing experiments?' },
          { from: 'u2', text: 'Yes Kavya! Sent the PDF and MATLAB scripts to your email.' },
          { from: 'u1', text: 'You are a lifesaver, thanks a ton!' },
        ],
      },
      // Admin Threads (Ensures Admin Messages Page is Fully Populated)
      {
        u1: 'admin@alumnisphere.com',
        u2: 'priya@alumni.com',
        messages: [
          { from: 'u1', text: 'Hello Priya! Thank you for scheduling the Google Cloud architecture keynote for our students.' },
          { from: 'u2', text: 'Delighted to support! We have over 140 students signed up. Looking forward to demonstrating distributed systems best practices.' },
          { from: 'u1', text: 'Fantastic! Let our operations team know if you need any presentation assistance.' },
        ],
      },
      {
        u1: 'admin@alumnisphere.com',
        u2: 'arjun@student.com',
        messages: [
          { from: 'u1', text: 'Welcome to AlumniSphere Arjun! We saw your contributions to the student cloud computing interest group.' },
          { from: 'u2', text: 'Thank you so much! AlumniSphere has connected me with wonderful mentors like Priya from Google.' },
          { from: 'u1', text: 'That is wonderful to hear! Best of luck with your upcoming engineering internship applications.' },
        ],
      },
      {
        u1: 'admin@alumnisphere.com',
        u2: 'sanjay.mentor@alumni.com',
        messages: [
          { from: 'u2', text: 'Hello Admin, the executive mentorship cohort has kicked off with 25 student mentees across IIT, NIT, and SRM colleges.' },
          { from: 'u1', text: 'Incredible milestone Sanjay! Thank you for giving back to the next generation of engineers.' },
        ],
      },
      // Institutional Conversations (IIT, NIT, SRM, MIT)
      {
        u1: 'aarav.sharma@student.edu',
        u2: 'rohit.iitb@alumni.com',
        messages: [
          { from: 'u1', text: 'Hello Rohit! I am a student at IIT Bombay studying AI. Really admire your work on OpenAI inference clusters.' },
          { from: 'u2', text: 'Hey Aarav! Great to connect with a fellow IITian. How are your machine learning systems coursework and GPU projects coming along?' },
          { from: 'u1', text: 'Currently implementing distributed data-parallel training for LLMs in PyTorch!' },
          { from: 'u2', text: 'Excellent work! Focus deeply on NCCL ring-allreduce communication overhead and tensor parallelism.' },
        ],
      },
      {
        u1: 'meghana.nitw@student.edu',
        u2: 'karthik.nitt@alumni.com',
        messages: [
          { from: 'u1', text: 'Hi Karthik! I am studying CSE at NIT Warangal and love your posts on SRE and Kubernetes architectures.' },
          { from: 'u2', text: 'Hey Meghana! Welcome to the NIT alumni network. Building hands-on Kubernetes clusters is the best way to master reliability engineering.' },
          { from: 'u1', text: 'Thank you! I just deployed a self-healing microservice cluster on AWS.' },
        ],
      },
      {
        u1: 'pooja.srm@student.edu',
        u2: 'harish.srm@alumni.com',
        messages: [
          { from: 'u1', text: 'Hi Harish sir! Proud SRM student here. Seeking your guidance on breaking into cloud cybersecurity at Cisco.' },
          { from: 'u2', text: 'Hello Pooja! Fantastic to see SRM students targeting cybersecurity. Master network protocols, Linux internals, and cloud IAM policies.' },
          { from: 'u1', text: 'Thank you so much sir! I will prepare thoroughly for the upcoming Cisco recruitment drive.' },
        ],
      },
      {
        u1: 'varun.iitm@student.edu',
        u2: 'alex.mit@alumni.com',
        messages: [
          { from: 'u1', text: 'Dear Dr. Wright, I am researching kernel networking at IIT Madras and reading your papers on reinforcement learning systems.' },
          { from: 'u2', text: 'Hello Varun! The intersection of kernel networking and distributed RL training is very promising. Keep pushing the boundaries!' },
        ],
      },
    ];

    for (const conv of CONVERSATIONS_DATA) {
      const u1 = userMap.get(conv.u1);
      const u2 = userMap.get(conv.u2);
      if (!u1 || !u2) continue;

      const conversationId = [u1._id.toString(), u2._id.toString()].sort().join('_');

      for (let idx = 0; idx < conv.messages.length; idx++) {
        const m = conv.messages[idx];
        const sender = m.from === 'u1' ? u1 : u2;
        const receiver = m.from === 'u1' ? u2 : u1;

        // Spread message timestamps across recent hours
        const msgTime = new Date(Date.now() - (conv.messages.length - idx) * 3600 * 1000 * 4);

        const existingMsg = await Message.findOne({
          conversationId,
          sender: sender._id,
          receiver: receiver._id,
          content: m.text,
        });

        if (existingMsg) {
          summary.messagesExisting++;
        } else {
          await Message.create({
            sender: sender._id,
            receiver: receiver._id,
            conversationId,
            content: m.text,
            attachment: m.attachment || undefined,
            read: idx < conv.messages.length - 1, // latest message unread for realism
            delivered: true,
            createdAt: msgTime,
            updatedAt: msgTime,
          });
          summary.messagesCreated++;
        }
      }
    }

    console.log(`   ✅ Messages: ${summary.messagesCreated} created, ${summary.messagesExisting} existing.`);

    // ----------------------------------------------------
    // 6. POPULATE NOTIFICATIONS (25+ realistic notifications)
    // ----------------------------------------------------
    console.log('\n🔔 6. Populating Notifications...');

    const NOTIFICATION_SEEDS = [
      // For Arjun Kumar (Student)
      {
        user: 'arjun@student.com',
        type: 'connection',
        title: 'Connection Request Accepted',
        message: 'Priya Sharma (Senior Software Engineer at Google) accepted your connection request.',
        link: '/connections',
        fromUser: 'priya@alumni.com',
        read: false,
      },
      {
        user: 'arjun@student.com',
        type: 'mentorship',
        title: 'Mentorship Request Approved',
        message: 'Priya Sharma accepted your mentorship request in Cloud & Distributed Systems.',
        link: '/mentorship',
        fromUser: 'priya@alumni.com',
        read: false,
      },
      {
        user: 'arjun@student.com',
        type: 'message',
        title: 'New Message from Priya Sharma',
        message: '"Focus deeply on leader election edge-cases and log compaction..."',
        link: '/messages',
        fromUser: 'priya@alumni.com',
        read: false,
      },
      {
        user: 'arjun@student.com',
        type: 'opportunity',
        title: 'New Opportunity Matching Your Skills',
        message: 'Google posted "Software Engineering Intern (Summer 2026)" in Bangalore.',
        link: '/opportunities',
        fromUser: 'priya@alumni.com',
        read: true,
      },
      {
        user: 'arjun@student.com',
        type: 'system',
        title: 'Profile Completeness: 90%',
        message: 'Add your latest project repository to reach a 100% profile strength score.',
        link: '/profile',
        read: true,
      },

      // For Priya Sharma (Alumni)
      {
        user: 'priya@alumni.com',
        type: 'mentorship',
        title: 'New Mentorship Request',
        message: 'Aarav Sharma requested your mentorship in Competitive Programming & Cloud Systems.',
        link: '/mentorship',
        fromUser: 'aarav.sharma@student.edu',
        read: false,
      },
      {
        user: 'priya@alumni.com',
        type: 'connection',
        title: 'New Connection Request',
        message: 'Aarav Sharma wants to connect with you.',
        link: '/connections',
        fromUser: 'aarav.sharma@student.edu',
        read: false,
      },
      {
        user: 'priya@alumni.com',
        type: 'connection',
        title: 'Connection Request Accepted',
        message: 'Sneha Reddy (Netflix) connected with you.',
        link: '/connections',
        fromUser: 'sneha@alumni.com',
        read: true,
      },
      {
        user: 'priya@alumni.com',
        type: 'message',
        title: 'New Message from Sneha Reddy',
        message: '"Yes, I am on the panel for cloud-native frontend architectures..."',
        link: '/messages',
        fromUser: 'sneha@alumni.com',
        read: true,
      },

      // For Rohan Mehta (Student)
      {
        user: 'rohan@student.com',
        type: 'mentorship',
        title: 'Mentorship Request Approved',
        message: 'Rajesh Khanna (Tesla) accepted your mentorship request in EV battery systems.',
        link: '/mentorship',
        fromUser: 'rajesh@alumni.com',
        read: false,
      },
      {
        user: 'rohan@student.com',
        type: 'opportunity',
        title: 'Recommended Job for You',
        message: 'Tesla posted "Electric Powertrain Simulation Engineer" in Fremont.',
        link: '/opportunities',
        fromUser: 'rajesh@alumni.com',
        read: true,
      },

      // For Meera Joshi (Student)
      {
        user: 'meera@student.com',
        type: 'mentorship',
        title: 'Mentorship Request Approved',
        message: 'Vikram Singh (Amazon AI) accepted your mentorship request.',
        link: '/mentorship',
        fromUser: 'vikram@alumni.com',
        read: false,
      },
      {
        user: 'meera@student.com',
        type: 'message',
        title: 'New Message from Vikram Singh',
        message: '"Your publication on transformer fine-tuning looks great! Highlight latency..."',
        link: '/messages',
        fromUser: 'vikram@alumni.com',
        read: false,
      },

      // For Kavya Nair (Student)
      {
        user: 'kavya@student.com',
        type: 'mentorship',
        title: 'Mentorship Request Approved',
        message: 'Amit Kumar (Intel) accepted your mentorship request in VLSI design.',
        link: '/mentorship',
        fromUser: 'amit@alumni.com',
        read: false,
      },
      {
        user: 'kavya@student.com',
        type: 'opportunity',
        title: 'New Internship Matching Your Skills',
        message: 'Intel Corporation posted "Hardware & Silicon Engineering Intern".',
        link: '/opportunities',
        fromUser: 'amit@alumni.com',
        read: true,
      },

      // For Ishita Verma (Student)
      {
        user: 'ishita.verma@student.edu',
        type: 'mentorship',
        title: 'Mentorship Request Approved',
        message: 'Ananya Patel (Apple) accepted your design mentorship request.',
        link: '/mentorship',
        fromUser: 'ananya@alumni.com',
        read: false,
      },
      {
        user: 'ishita.verma@student.edu',
        type: 'opportunity',
        title: 'New Design Internship',
        message: 'Adobe posted "Product Design & UI/UX Intern" in Noida.',
        link: '/opportunities',
        fromUser: 'swati.mishra@alumni.com',
        read: true,
      },

      // For Admin User
      {
        user: 'admin@alumnisphere.com',
        type: 'system',
        title: 'Platform Ecosystem Report Ready',
        message: '65 verified active alumni, students, and mentors from IIT, NIT, and SRM on AlumniSphere.',
        link: '/admin',
        read: false,
      },
      {
        user: 'admin@alumnisphere.com',
        type: 'message',
        title: 'New Message from Priya Sharma',
        message: '"Delighted to support! We have over 140 students signed up for the keynote..."',
        link: '/messages',
        fromUser: 'priya@alumni.com',
        read: false,
      },
      {
        user: 'admin@alumnisphere.com',
        type: 'opportunity',
        title: 'Opportunity Moderation Update',
        message: '40+ active opportunities comply with platform standards.',
        link: '/opportunities',
        read: true,
      },

      // For Sneha Reddy (Alumni)
      {
        user: 'sneha@alumni.com',
        type: 'connection',
        title: 'New Connection Request',
        message: 'Sneha Menon (B.Tech IT Final Year) wants to connect with you.',
        link: '/connections',
        fromUser: 'sneha.menon@student.edu',
        read: false,
      },
      {
        user: 'sneha@alumni.com',
        type: 'mentorship',
        title: 'Mentorship Request Accepted',
        message: 'You are now mentoring Sneha Menon.',
        link: '/mentorship',
        fromUser: 'sneha.menon@student.edu',
        read: true,
      },

      // For Rajesh Khanna (Alumni)
      {
        user: 'rajesh@alumni.com',
        type: 'message',
        title: 'New Message from Rohan Mehta',
        message: '"We are optimizing our cooling loops for high-rate discharge cycles..."',
        link: '/messages',
        fromUser: 'rohan@student.com',
        read: false,
      },

      // For Gaurav Kapoor (Alumni)
      {
        user: 'gaurav.kapoor@alumni.com',
        type: 'mentorship',
        title: 'New Mentorship Request',
        message: 'Divyansh Gupta requested your guidance in CUDA kernel optimization.',
        link: '/mentorship',
        fromUser: 'divyansh.gupta@student.edu',
        read: false,
      },
    ];

    for (const notif of NOTIFICATION_SEEDS) {
      const targetUser = userMap.get(notif.user);
      const fromUserDoc = notif.fromUser ? userMap.get(notif.fromUser) : null;
      if (!targetUser) continue;

      const existingNotif = await Notification.findOne({
        user: targetUser._id,
        title: notif.title,
      });

      if (existingNotif) {
        summary.notificationsExisting++;
      } else {
        await Notification.create({
          user: targetUser._id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          link: notif.link,
          fromUser: fromUserDoc ? fromUserDoc._id : undefined,
          read: notif.read,
        });
        summary.notificationsCreated++;
      }
    }

    console.log(`   ✅ Notifications: ${summary.notificationsCreated} created, ${summary.notificationsExisting} existing.`);

    // ----------------------------------------------------
    // 7. WRITE DEMO CREDENTIALS FILE (Git-ignored)
    // ----------------------------------------------------
    console.log('\n📝 7. Generating demo-credentials.txt...');
    const credentialsPath = path.join(__dirname, 'demo-credentials.txt');

    let credsContent = `# ========================================================
# ALUMNISPHERE DEMO ACCOUNT CREDENTIALS
# Generated on: ${new Date().toISOString()}
# Default Password for ALL accounts: ${DEMO_PASSWORD}
# ========================================================

--- PLATFORM ADMINISTRATOR ---
Name: Admin User
Email: admin@alumnisphere.com
Password: ${DEMO_PASSWORD}
Role: admin
Headline: Chief Platform Administrator & Community Architect

--- FEATURED ALUMNI MENTORS (24 ACCOUNTS) ---
`;

    const alumniCreds = demoCredentials.filter(c => c.role === 'alumni');
    alumniCreds.forEach((c, idx) => {
      credsContent += `${idx + 1}. ${c.name} | ${c.company}\n   Email: ${c.email}\n   Password: ${c.password}\n   Headline: ${c.headline}\n\n`;
    });

    credsContent += `\n--- FEATURED STUDENTS (25 ACCOUNTS) ---\n`;
    const studentCreds = demoCredentials.filter(c => c.role === 'student');
    studentCreds.forEach((c, idx) => {
      credsContent += `${idx + 1}. ${c.name}\n   Email: ${c.email}\n   Password: ${c.password}\n   Headline: ${c.headline}\n\n`;
    });

    fs.writeFileSync(credentialsPath, credsContent, 'utf8');
    console.log(`   ✅ Successfully wrote ${demoCredentials.length} demo credentials to:`);
    console.log(`      ${credentialsPath}`);

    // Also write copy in workspace root for easy access if needed
    const rootCredsPath = path.join(__dirname, '..', 'demo-credentials.txt');
    try {
      fs.writeFileSync(rootCredsPath, credsContent, 'utf8');
    } catch (_) {}

    // ----------------------------------------------------
    // 8. FINAL SUMMARY & VERIFICATION
    // ----------------------------------------------------
    const totalUsersInDb = await User.countDocuments();
    const totalAlumniInDb = await User.countDocuments({ role: 'alumni' });
    const totalStudentsInDb = await User.countDocuments({ role: 'student' });
    const totalOpportunitiesInDb = await Opportunity.countDocuments();
    const totalMentorshipsInDb = await MentorshipRequest.countDocuments();
    const totalConnectionsInDb = await ConnectionRequest.countDocuments();
    const totalMessagesInDb = await Message.countDocuments();
    const totalNotificationsInDb = await Notification.countDocuments();

    console.log('\n====================================================');
    console.log('🎉 BULK DEMO DATA SEEDING COMPLETE & VERIFIED');
    console.log('====================================================');
    console.log(`📊 Current Database Record Totals:`);
    console.log(`   - Total Users:                ${totalUsersInDb} (Alumni: ${totalAlumniInDb}, Students: ${totalStudentsInDb})`);
    console.log(`   - Career Opportunities:       ${totalOpportunitiesInDb}`);
    console.log(`   - Mentorship Relationships:   ${totalMentorshipsInDb}`);
    console.log(`   - Connection Requests:        ${totalConnectionsInDb}`);
    console.log(`   - Real-Time Messages:         ${totalMessagesInDb}`);
    console.log(`   - Notifications:              ${totalNotificationsInDb}`);
    console.log('====================================================\n');

    await mongoose.disconnect();
    console.log('🔌 Disconnected cleanly from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed with error:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

// Execute script
seedDemoData();
