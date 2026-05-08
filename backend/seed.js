const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Opportunity = require('./models/Opportunity');
const Application = require('./models/Application');

const companiesData = [
  {
    name: "Google India",
    email: "careers@google.com",
    companyName: "Google India",
    companyWebsite: "https://google.com",
    bio: "Our mission is to organize the world’s information and make it universally accessible and useful. Join our engineering hubs in Bangalore and Hyderabad.",
    avatar: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100&auto=format&fit=crop&q=60"
  },
  {
    name: "Stripe",
    email: "hr@stripe.com",
    companyName: "Stripe",
    companyWebsite: "https://stripe.com",
    bio: "Stripe is a financial infrastructure platform for the internet. Millions of companies use Stripe to accept payments, grow revenue, and accelerate businesses.",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60"
  },
  {
    name: "Razorpay",
    email: "careers@razorpay.com",
    companyName: "Razorpay",
    companyWebsite: "https://razorpay.com",
    bio: "Razorpay is India's leading payments solution company, helping businesses accept, process, and disburse payments with its super-simple integration suite.",
    avatar: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=100&auto=format&fit=crop&q=60"
  },
  {
    name: "Swiggy",
    email: "talent@swiggy.com",
    companyName: "Swiggy",
    companyWebsite: "https://swiggy.com",
    bio: "Swiggy is India's leading on-demand delivery platform with a tech-first approach to logistics and food/grocery delivery.",
    avatar: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&auto=format&fit=crop&q=60"
  },
  {
    name: "Cred",
    email: "hr@cred.club",
    companyName: "CRED",
    companyWebsite: "https://cred.club",
    bio: "CRED is a members-only club that rewards individuals for paying their credit card bills on time, offering a premier product experience and high-trust community.",
    avatar: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=100&auto=format&fit=crop&q=60"
  },
  {
    name: "Microsoft India",
    email: "talent@microsoft.com",
    companyName: "Microsoft India",
    companyWebsite: "https://microsoft.com",
    bio: "Empowering every person and every organization on the planet to achieve more. Discover core engineering, cloud infrastructure, and AI roles.",
    avatar: "https://images.unsplash.com/photo-1625014020903-e329f58a4990?w=100&auto=format&fit=crop&q=60"
  },
  {
    name: "Atlassian",
    email: "hr@atlassian.com",
    companyName: "Atlassian",
    companyWebsite: "https://atlassian.com",
    bio: "Maker of Jira, Confluence, and Trello. We help teams everywhere collaborate and build spectacular products through robust developer tooling.",
    avatar: "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=100&auto=format&fit=crop&q=60"
  },
  {
    name: "Vercel",
    email: "careers@vercel.com",
    companyName: "Vercel",
    companyWebsite: "https://vercel.com",
    bio: "Vercel provides the developer experience and cloud infrastructure to build, deploy, and scale frontend applications globally and instantaneously.",
    avatar: "https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=100&auto=format&fit=crop&q=60"
  },
  {
    name: "Postman",
    email: "talent@postman.com",
    companyName: "Postman",
    companyWebsite: "https://postman.com",
    bio: "Postman is the world's leading API collaboration platform, simplifying each step of the API lifecycle and streamlining developer workflows.",
    avatar: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=100&auto=format&fit=crop&q=60"
  },
  {
    name: "Zomato",
    email: "careers@zomato.com",
    companyName: "Zomato",
    companyWebsite: "https://zomato.com",
    bio: "Better food for more people. Zomato is an Indian multinational restaurant aggregator and food delivery company focused on culinary excellence and tech.",
    avatar: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&auto=format&fit=crop&q=60"
  },
  {
    name: "Netflix India",
    email: "careers@netflix.com",
    companyName: "Netflix India",
    companyWebsite: "https://netflix.com",
    bio: "Entertaining the world. Netflix is the premier streaming entertainment service, pushing the boundaries of cloud engineering and content delivery.",
    avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&auto=format&fit=crop&q=60"
  },
  {
    name: "Adobe India",
    email: "hr@adobe.com",
    companyName: "Adobe India",
    companyWebsite: "https://adobe.com",
    bio: "Changing the world through digital experiences. Our creative, marketing, and document solutions empower everyone to bring digital creations to life.",
    avatar: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100&auto=format&fit=crop&q=60"
  },
  {
    name: "Coinbase",
    email: "hr@coinbase.com",
    companyName: "Coinbase",
    companyWebsite: "https://coinbase.com",
    bio: "Creating an open financial system for the world. We build products that make crypto accessible, safe, and easy to trade for millions of global users.",
    avatar: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=100&auto=format&fit=crop&q=60"
  },
  {
    name: "Groww",
    email: "careers@groww.in",
    companyName: "Groww",
    companyWebsite: "https://groww.in",
    bio: "Making investing simple and accessible to everyone. Groww is one of India's fastest-growing investment platforms for mutual funds, stocks, and direct gold.",
    avatar: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&auto=format&fit=crop&q=60"
  },
  {
    name: "Urban Company",
    email: "talent@urbancompany.com",
    companyName: "Urban Company",
    companyWebsite: "https://urbancompany.com",
    bio: "Empowering millions of service professionals worldwide to deliver services at home like never before, scaling operations globally with high tech standards.",
    avatar: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=60"
  }
];

const studentsData = [
  {
    name: "Aarav Sharma",
    email: "aarav@gmail.com",
    bio: "Passionate Full Stack Developer with hands-on experience in the MERN stack. Love solving algorithmic problems and contributing to open-source.",
    college: "Indian Institute of Technology (IIT), Bombay",
    branch: "Computer Science and Engineering",
    skills: ["React", "Node.js", "Express", "MongoDB", "JavaScript", "Python", "Data Structures", "Git", "C++", "Redux"],
    github: "https://github.com/aarav-sharma-dev",
    linkedin: "https://linkedin.com/in/aarav-sharma-profile",
    website: "https://aarav.dev"
  },
  {
    name: "Ananya Iyer",
    email: "ananya@gmail.com",
    bio: "Data Science enthusiast who enjoys turning messy datasets into beautiful, predictive stories. Experienced with Python, TensorFlow, and PyTorch.",
    college: "BITS Pilani",
    branch: "Computer Science and Mathematics",
    skills: ["Python", "TensorFlow", "Pandas", "SQL", "Machine Learning", "Data Analysis", "R", "Tableau", "Git", "NumPy"],
    github: "https://github.com/ananya-datascience",
    linkedin: "https://linkedin.com/in/ananya-iyer-ml",
  },
  {
    name: "Kabir Mehta",
    email: "kabir@gmail.com",
    bio: "Backend developer specializing in distributed systems and cloud architectures. Obsessed with API optimization, microservices, and Docker.",
    college: "Delhi Technological University (DTU)",
    branch: "Software Engineering",
    skills: ["Node.js", "Express", "MongoDB", "PostgreSQL", "Docker", "AWS", "Redis", "Nginx", "Git", "Kubernetes"],
    github: "https://github.com/kabir-backend",
    linkedin: "https://linkedin.com/in/kabir-mehta-dev",
  },
  {
    name: "Diya Roy",
    email: "diya@gmail.com",
    bio: "Frontend Engineer and UI Enthusiast. I craft delightful user interfaces and interactive components with high performance and accessibility in mind.",
    college: "Jadavpur University",
    branch: "Information Technology",
    skills: ["React", "Vue.js", "JavaScript", "HTML5", "CSS3", "Tailwind CSS", "Figma", "Sass", "Webpack", "Responsive Design"],
    github: "https://github.com/diya-ui-ux",
    linkedin: "https://linkedin.com/in/diya-roy-frontend",
  },
  {
    name: "Rohan Das",
    email: "rohan@gmail.com",
    bio: "Mobile App Developer focused on React Native and Flutter. Experienced in launching high-conversion consumer applications on the App Store and Google Play.",
    college: "Vellore Institute of Technology (VIT)",
    branch: "Computer Science",
    skills: ["React Native", "Flutter", "Dart", "JavaScript", "Redux", "Firebase", "App Store Deployment", "API Integration", "Java"],
    github: "https://github.com/rohan-mobile",
    linkedin: "https://linkedin.com/in/rohan-das-apps",
  },
  {
    name: "Meera Nair",
    email: "meera@gmail.com",
    bio: "Cybersecurity student interested in ethical hacking, penetration testing, and security auditing. Active CTF participant and secure code reviewer.",
    college: "Amrita Vishwa Vidyapeetham",
    branch: "Cyber Security",
    skills: ["Linux", "Python", "Ethical Hacking", "Metasploit", "Wireshark", "Network Security", "Cryptography", "OWASP Top 10", "Bash"],
    github: "https://github.com/meera-security",
    linkedin: "https://linkedin.com/in/meera-nair-infosec",
  },
  {
    name: "Aditya Verma",
    email: "aditya@gmail.com",
    bio: "DevOps Engineer passionately automating CI/CD workflows, infrastructure provisioning, and container orchestration pipelines to make production seamless.",
    college: "National Institute of Technology (NIT), Trichy",
    branch: "Electronics and Communication",
    skills: ["Docker", "Kubernetes", "Jenkins", "Terraform", "Ansible", "AWS", "Linux", "Bash", "Git", "CI/CD Pipelines"],
    github: "https://github.com/aditya-devops",
    linkedin: "https://linkedin.com/in/aditya-verma-cloud",
  },
  {
    name: "Isha Patel",
    email: "isha@gmail.com",
    bio: "Product Design & Frontend Engineer bridging the gap between design systems and code. Deeply committed to digital inclusion, wireframing, and interactive layouts.",
    college: "NID Ahmedabad",
    branch: "Interaction Design",
    skills: ["Figma", "HTML", "CSS", "JavaScript", "React", "User Research", "Wireframing", "Prototyping", "UI Design", "Adobe XD"],
    github: "https://github.com/isha-designs",
    linkedin: "https://linkedin.com/in/isha-patel-design",
  },
  {
    name: "Vikram Malhotra",
    email: "vikram@gmail.com",
    bio: "Blockchain developer exploring Web3 architectures, Solidity smart contracts, decentralized finance, and distributed consensus mechanisms.",
    college: "Manipal Institute of Technology",
    branch: "Computer Science",
    skills: ["Solidity", "Ethereum", "Web3.js", "JavaScript", "Hardhat", "Smart Contracts", "Node.js", "React", "Cryptography", "Git"],
    github: "https://github.com/vikram-web3",
    linkedin: "https://linkedin.com/in/vikram-malhotra-blockchain",
  },
  {
    name: "Sanya Gupta",
    email: "sanya@gmail.com",
    bio: "Cloud Architect and Backend Engineer. Certified AWS Solutions Associate. Enthusiastic about serverless computing, API Gateways, and databases.",
    college: "SRM University",
    branch: "Information Technology",
    skills: ["AWS", "Serverless", "Node.js", "Express", "MongoDB", "DynamoDB", "Python", "SQL", "Git", "RESTful APIs"],
    github: "https://github.com/sanya-cloud",
    linkedin: "https://linkedin.com/in/sanya-gupta-cloud",
  },
  {
    name: "Karan Johar",
    email: "karan@gmail.com",
    bio: "Embedded Systems and IoT researcher. Fascinated by microcontrollers, automation, sensor arrays, and low-latency programming interfaces.",
    college: "RV College of Engineering",
    branch: "Electronics & Telecommunication",
    skills: ["C", "C++", "Arduino", "Raspberry Pi", "IoT", "Embedded Systems", "Python", "Microcontrollers", "RTOS"],
    github: "https://github.com/karan-iot",
    linkedin: "https://linkedin.com/in/karan-johar-embedded",
  },
  {
    name: "Sneha Sen",
    email: "sneha@gmail.com",
    bio: "A natural problem solver with 500+ solved problems on LeetCode. Strong base in object-oriented system design and databases.",
    college: "Jadavpur University",
    branch: "Computer Science and Technology",
    skills: ["C++", "Java", "SQL", "Data Structures", "Algorithms", "Object Oriented Design", "System Design", "Git"],
    github: "https://github.com/sneha-codes",
    linkedin: "https://linkedin.com/in/sneha-sen-algs",
  },
  {
    name: "Arjun Reddy",
    email: "arjun@gmail.com",
    bio: "Machine Learning Researcher working on NLP projects. Proficient in web scraping, tokenizers, transformers, and large language model prompting.",
    college: "IIIT Hyderabad",
    branch: "Computer Science and AI",
    skills: ["Python", "PyTorch", "NLP", "Hugging Face", "Scikit-Learn", "Git", "FastAPI", "Pandas", "SQL"],
    github: "https://github.com/arjun-ml-nlp",
    linkedin: "https://linkedin.com/in/arjun-reddy-research",
  },
  {
    name: "Prisha Joshi",
    email: "prisha@gmail.com",
    bio: "Creative Developer passionate about 3D Web, WebGL, Three.js, and browser animation vectors. Let's make the web look spectacular!",
    college: "NIFT Delhi",
    branch: "Communication Design",
    skills: ["Three.js", "WebGL", "HTML", "CSS", "JavaScript", "React", "Sass", "Blender", "Figma", "GSAP"],
    github: "https://github.com/prisha-3d-web",
    linkedin: "https://linkedin.com/in/prisha-joshi-creative",
  },
  {
    name: "Rahul Bose",
    email: "rahul@gmail.com",
    bio: "Quality Assurance and Automation test engineer. Writing clean, reusable automated unit tests, integration tests, and Cypress scripts.",
    college: "Kiit University",
    branch: "Computer Science and Engineering",
    skills: ["JavaScript", "Cypress", "Selenium", "Jest", "Postman", "API Testing", "Git", "Manual Testing"],
    github: "https://github.com/rahul-qa",
    linkedin: "https://linkedin.com/in/rahul-bose-qa",
  }
];

const opportunitiesData = [
  {
    title: "Software Engineering Intern (Backend)",
    company: "Google India",
    description: "Work on optimizing latency profiles for Search and Cloud systems. Develop high-throughput internal microservices using Go and Java, cooperating with globally distributed teams.",
    requiredSkills: ["Go", "Java", "C++", "Data Structures", "Algorithms", "Git"],
    location: "Bangalore (Onsite)",
    type: "internship",
    stipend: "₹1,20,000 / month",
    duration: "6 Months",
  },
  {
    title: "Associate Software Engineer",
    company: "Stripe",
    description: "Help build core banking integrations and localized checkout experiences for global e-commerce merchants. High attention to secure programming practices is required.",
    requiredSkills: ["Ruby", "JavaScript", "Node.js", "REST APIs", "SQL", "Git"],
    location: "Remote (India)",
    type: "job",
    stipend: "₹18,00,000 / annum",
    duration: "Permanent",
  },
  {
    title: "Frontend React Developer",
    company: "Razorpay",
    description: "Enhance Razorpay payment gateway dashboards for 10M+ businesses. Build clean interfaces using React, Redux, and Tailwind CSS with 100% test coverage.",
    requiredSkills: ["React", "JavaScript", "Tailwind CSS", "Redux", "Jest", "HTML5"],
    location: "Bangalore (Hybrid)",
    type: "job",
    stipend: "₹12,50,000 / annum",
    duration: "Permanent",
  },
  {
    title: "Backend Engineering Intern",
    company: "Swiggy",
    description: "Contribute to Swiggy's micro-delivery logistics algorithms, routing logic, and live location-tracking socket services. Optimize database query times under immense scale.",
    requiredSkills: ["Node.js", "Express", "MongoDB", "Redis", "Docker", "REST APIs"],
    location: "Bangalore (Onsite)",
    type: "internship",
    stipend: "₹45,000 / month",
    duration: "6 Months",
  },
  {
    title: "Product Design Intern",
    company: "CRED",
    description: "Collaborate closely with product managers and developers to wireframe, prototype, and build premium gamified interactions. Heavy emphasis on visual micro-animations.",
    requiredSkills: ["Figma", "Prototyping", "UI Design", "User Research", "Adobe Creative Suite"],
    location: "Bangalore (Onsite)",
    type: "internship",
    stipend: "₹60,000 / month",
    duration: "3 Months",
  },
  {
    title: "DevOps & Cloud Intern",
    company: "Microsoft India",
    description: "Empower cloud teams to build automated deployment strategies on Azure. Maintain cloud security standards, CI/CD Jenkins triggers, and Terraform configurations.",
    requiredSkills: ["Azure", "Docker", "Kubernetes", "Terraform", "Jenkins", "Linux"],
    location: "Hyderabad (Onsite)",
    type: "internship",
    stipend: "₹80,000 / month",
    duration: "6 Months",
  },
  {
    title: "QA Automation Engineer",
    company: "Atlassian",
    description: "Write rigorous automation test suites for Confluence dashboards. Ensure robust integration, user-workflow correctness, and API response speed validations.",
    requiredSkills: ["JavaScript", "Cypress", "Selenium", "Jest", "Postman", "CI/CD Pipelines"],
    location: "Bangalore (Hybrid)",
    type: "job",
    stipend: "₹14,00,000 / annum",
    duration: "Permanent",
  },
  {
    title: "Junior Cloud Infrastructure Engineer",
    company: "Vercel",
    description: "Maintain edge networks, CDN caches, and routing middleware. Support modern SSR engines like Next.js in a fully distributed cloud deployment setup.",
    requiredSkills: ["Node.js", "Nginx", "Docker", "AWS", "Linux", "Git"],
    location: "Remote (India)",
    type: "job",
    stipend: "₹16,50,000 / annum",
    duration: "Permanent",
  },
  {
    title: "API Developer Intern",
    company: "Postman",
    description: "Develop new core features for Postman API clients and team collaboration tools. Collaborate with community developers to build automated collections utilities.",
    requiredSkills: ["Node.js", "Express", "JavaScript", "REST APIs", "SQL", "Git"],
    location: "Bangalore (Hybrid)",
    type: "internship",
    stipend: "₹50,000 / month",
    duration: "6 Months",
  },
  {
    title: "Fullstack Engineering Intern",
    company: "Zomato",
    description: "Work on both customer-facing applications and vendor dashboards. Build responsive interfaces, support high food-ordering volumes, and design scalable schemas.",
    requiredSkills: ["React", "Node.js", "MongoDB", "Express", "Tailwind CSS", "Redux"],
    location: "Gurugram (Onsite)",
    type: "internship",
    stipend: "₹40,000 / month",
    duration: "6 Months",
  },
  {
    title: "Streaming Infrastructure Intern",
    company: "Netflix India",
    description: "Optimize high-fidelity compression algorithms and CDN edge distributions. Participate in architecture standups regarding secure content access keys.",
    requiredSkills: ["C++", "Java", "Python", "Linux", "AWS", "Networking"],
    location: "Mumbai (Onsite)",
    type: "internship",
    stipend: "₹1,10,000 / month",
    duration: "6 Months",
  },
  {
    title: "Junior Software Developer",
    company: "Adobe India",
    description: "Bring high-performance features to creative suite cloud extensions. Work with digital vectors, compression, and seamless asset syncing workflows.",
    requiredSkills: ["C++", "JavaScript", "HTML", "CSS", "Git", "Object Oriented Design"],
    location: "Noida (Onsite)",
    type: "job",
    stipend: "₹11,00,000 / annum",
    duration: "Permanent",
  },
  {
    title: "Smart Contract Developer (Web3)",
    company: "Coinbase",
    description: "Design and implement decentralized finance tools, wallet features, and multi-signature security policies. Help scale highly secured transactional layers.",
    requiredSkills: ["Solidity", "Ethereum", "Web3.js", "Smart Contracts", "Cryptography", "Git"],
    location: "Remote (India)",
    type: "job",
    stipend: "₹22,00,000 / annum",
    duration: "Permanent",
  },
  {
    title: "Fullstack Software Engineer",
    company: "Groww",
    description: "Build robust systems to accept mutual fund requests, fetch stock values dynamically, and maintain ledger transactions. High emphasis on atomic operations and speed.",
    requiredSkills: ["Java", "Spring Boot", "React", "PostgreSQL", "Kafka", "REST APIs"],
    location: "Bangalore (Hybrid)",
    type: "job",
    stipend: "₹15,00,000 / annum",
    duration: "Permanent",
  },
  {
    title: "Service Delivery Tech Intern",
    company: "Urban Company",
    description: "Support algorithmic service professional routing, dynamic pricing systems, and real-time socket chats between service providers and customers.",
    requiredSkills: ["Node.js", "Express", "MongoDB", "Redis", "REST APIs", "Socket.io"],
    location: "Gurugram (Onsite)",
    type: "internship",
    stipend: "₹35,000 / month",
    duration: "3 Months",
  }
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("Error: MONGO_URI is missing from your environment variables.");
      process.exit(1);
    }

    console.log("Connecting to database...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully! Preparing to clear database...");

    // Clear existing collections
    await User.deleteMany({});
    await Opportunity.deleteMany({});
    await Application.deleteMany({});
    console.log("Cleared old database tables successfully.");

    // Hash uniform password
    const hashedPassword = await bcrypt.hash("password123", 10);

    // ── 1. SEED COMPANIES ──
    console.log("Seeding companies...");
    const companiesToInsert = companiesData.map(c => ({
      ...c,
      password: hashedPassword,
      role: 'company',
      isEmailVerified: true,
      profileScore: 90
    }));
    const insertedCompanies = await User.insertMany(companiesToInsert);
    console.log(`Seeded ${insertedCompanies.length} companies successfully.`);

    // ── 2. SEED OPPORTUNITIES ──
    console.log("Seeding opportunities...");
    const opportunitiesToInsert = opportunitiesData.map((op, idx) => {
      // Rotate company matching
      const companyRecord = insertedCompanies[idx % insertedCompanies.length];
      return {
        ...op,
        company: companyRecord.companyName,
        postedBy: companyRecord._id,
        applyDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };
    });
    const insertedOpportunities = await Opportunity.insertMany(opportunitiesToInsert);
    console.log(`Seeded ${insertedOpportunities.length} opportunities successfully.`);

    // ── 3. SEED STUDENTS ──
    console.log("Seeding students...");
    const studentsToInsert = studentsData.map(s => ({
      ...s,
      password: hashedPassword,
      role: 'student',
      isEmailVerified: true,
      profileScore: 85,
      resume: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    }));
    const insertedStudents = await User.insertMany(studentsToInsert);
    console.log(`Seeded ${insertedStudents.length} students successfully.`);

    // ── 4. SEED APPLICATIONS ──
    console.log("Seeding applications...");
    const statuses = ['applied', 'reviewed', 'shortlisted', 'accepted', 'rejected'];
    const notesPool = [
      "Excellent technical fit, skills perfectly aligned with role description.",
      "Good resume, scheduled for preliminary recruiter round next week.",
      "Profile score exceeds threshold, awaiting panel interview feedback.",
      "Technically eligible but lacks core experience with specific frameworks.",
      "Outstanding presentation and projects. Selected for formal offer rollout."
    ];

    const applicationsToInsert = [];
    // Generate exactly 15 applications matching students with opportunities
    for (let i = 0; i < 15; i++) {
      const student = insertedStudents[i % insertedStudents.length];
      const opportunity = insertedOpportunities[i % insertedOpportunities.length];
      const status = statuses[i % statuses.length];
      const notes = notesPool[i % notesPool.length];

      applicationsToInsert.push({
        studentId: student._id,
        opportunityId: opportunity._id,
        resume: student.resume,
        coverLetter: `Hello Team! I am incredibly excited about the ${opportunity.title} role. I am currently studying ${student.branch} at ${student.college}. I have strong experience with ${opportunity.requiredSkills.slice(0,3).join(', ')} and would love to contribute to your core missions!`,
        status: status,
        notes: notes
      });
    }

    const insertedApplications = await Application.insertMany(applicationsToInsert);
    console.log(`Seeded ${insertedApplications.length} mock applications successfully.`);

    console.log("\n⭐️ DATABASE SEEDING COMPLETED SUCCESSFULLY! ⭐️");
    console.log(`Total Companies Seeded: ${insertedCompanies.length}`);
    console.log(`Total Opportunities Seeded: ${insertedOpportunities.length}`);
    console.log(`Total Students Seeded: ${insertedStudents.length}`);
    console.log(`Total Applications Seeded: ${insertedApplications.length}`);
    console.log("\nPasswords for all accounts: password123");

    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Critical seeding failure:", err);
    process.exit(1);
  }
};

seedDB();
