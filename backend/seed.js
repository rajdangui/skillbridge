const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Opportunity = require('./models/Opportunity');
const Application = require('./models/Application');
const AcademicProfile = require('./models/AcademicProfile');
const Notification = require('./models/Notification');

const companiesData = [
  { name: "Google India", email: "careers@google.com", companyName: "Google India", companyWebsite: "https://google.com", bio: "Our mission is to organize the world’s information and make it universally accessible and useful.", avatar: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100&auto=format&fit=crop&q=60" },
  { name: "Stripe", email: "hr@stripe.com", companyName: "Stripe", companyWebsite: "https://stripe.com", bio: "Stripe is a financial infrastructure platform for the internet.", avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60" },
  { name: "Razorpay", email: "careers@razorpay.com", companyName: "Razorpay", companyWebsite: "https://razorpay.com", bio: "Razorpay is India's leading payments solution company, helping businesses accept, process, and disburse payments.", avatar: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=100&auto=format&fit=crop&q=60" },
  { name: "Swiggy", email: "talent@swiggy.com", companyName: "Swiggy", companyWebsite: "https://swiggy.com", bio: "Swiggy is India's leading on-demand delivery platform with a tech-first approach to logistics.", avatar: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&auto=format&fit=crop&q=60" },
  { name: "Cred", email: "hr@cred.club", companyName: "CRED", companyWebsite: "https://cred.club", bio: "CRED is a members-only club that rewards individuals for paying their credit card bills on time.", avatar: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=100&auto=format&fit=crop&q=60" },
  { name: "Microsoft India", email: "talent@microsoft.com", companyName: "Microsoft India", companyWebsite: "https://microsoft.com", bio: "Empowering every person and every organization on the planet to achieve more.", avatar: "https://images.unsplash.com/photo-1625014020903-e329f58a4990?w=100&auto=format&fit=crop&q=60" },
  { name: "Atlassian", email: "hr@atlassian.com", companyName: "Atlassian", companyWebsite: "https://atlassian.com", bio: "Maker of Jira, Confluence, and Trello. We help teams everywhere collaborate and build spectacular products.", avatar: "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=100&auto=format&fit=crop&q=60" },
  { name: "Vercel", email: "careers@vercel.com", companyName: "Vercel", companyWebsite: "https://vercel.com", bio: "Vercel provides the developer experience and cloud infrastructure to build, deploy, and scale frontend applications.", avatar: "https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=100&auto=format&fit=crop&q=60" },
  { name: "Postman", email: "talent@postman.com", companyName: "Postman", companyWebsite: "https://postman.com", bio: "Postman is the world's leading API collaboration platform, simplifying each step of the API lifecycle.", avatar: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=100&auto=format&fit=crop&q=60" },
  { name: "Zomato", email: "careers@zomato.com", companyName: "Zomato", companyWebsite: "https://zomato.com", bio: "Better food for more people. Zomato is focused on culinary excellence and tech logistics.", avatar: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&auto=format&fit=crop&q=60" },
  { name: "Netflix India", email: "careers@netflix.com", companyName: "Netflix India", companyWebsite: "https://netflix.com", bio: "Netflix is the premier streaming entertainment service, pushing the boundaries of cloud engineering.", avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&auto=format&fit=crop&q=60" },
  { name: "Adobe India", email: "hr@adobe.com", companyName: "Adobe India", companyWebsite: "https://adobe.com", bio: "Changing the world through digital experiences with creative and document solutions.", avatar: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100&auto=format&fit=crop&q=60" },
  { name: "Coinbase", email: "hr@coinbase.com", companyName: "Coinbase", companyWebsite: "https://coinbase.com", bio: "Creating an open financial system for the world through secure blockchain tools.", avatar: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=100&auto=format&fit=crop&q=60" },
  { name: "Groww", email: "careers@groww.in", companyName: "Groww", companyWebsite: "https://groww.in", bio: "Making investing simple, clean, and accessible to everyone in India.", avatar: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&auto=format&fit=crop&q=60" },
  { name: "Urban Company", email: "talent@urbancompany.com", companyName: "Urban Company", companyWebsite: "https://urbancompany.com", bio: "Empowering millions of service professionals worldwide to deliver premium home services.", avatar: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=60" },
  { name: "PhonePe", email: "talent@phonepe.com", companyName: "PhonePe", companyWebsite: "https://phonepe.com", bio: "PhonePe is India's leading digital payments platform, making transactions secure and simple.", avatar: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100&auto=format&fit=crop&q=60" },
  { name: "Flipkart", email: "hr@flipkart.com", companyName: "Flipkart", companyWebsite: "https://flipkart.com", bio: "Flipkart is India's leading e-commerce marketplace, scaling digital retail for billions.", avatar: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&auto=format&fit=crop&q=60" },
  { name: "Oyo Rooms", email: "careers@oyo.com", companyName: "OYO", companyWebsite: "https://oyorooms.com", bio: "OYO is a global platform empowering entrepreneurs and small businesses with hotels and homes.", avatar: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&auto=format&fit=crop&q=60" },
  { name: "Nykaa", email: "hr@nykaa.com", companyName: "Nykaa", companyWebsite: "https://nykaa.com", bio: "Nykaa is a premier lifestyle and beauty destination, leading the wellness and retail space.", avatar: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&auto=format&fit=crop&q=60" },
  { name: "Ola Cabs", email: "talent@olacabs.com", companyName: "Ola", companyWebsite: "https://olacabs.com", bio: "Ola is India's largest mobility platform and one of the world's largest ride-hailing companies.", avatar: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=100&auto=format&fit=crop&q=60" },
  { name: "Swell Co", email: "hr@swell.co", companyName: "Swell", companyWebsite: "https://swell.is", bio: "Swell is a customizable headless commerce platform for modern brands and developers.", avatar: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=100&auto=format&fit=crop&q=60" },
  { name: "Retool India", email: "careers@retool.com", companyName: "Retool", companyWebsite: "https://retool.com", bio: "Retool is the fast way to build internal software. Highly used by developer operations.", avatar: "https://images.unsplash.com/photo-1531535934027-667f6db87590?w=100&auto=format&fit=crop&q=60" },
  { name: "Airbnb India", email: "hr@airbnb.com", companyName: "Airbnb India", companyWebsite: "https://airbnb.com", bio: "Airbnb is a community-based two-sided marketplace for sharing unique accommodations.", avatar: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=100&auto=format&fit=crop&q=60" },
  { name: "Uber India", email: "talent@uber.com", companyName: "Uber India", companyWebsite: "https://uber.com", bio: "Uber is finding ways to help the world move cleaner, safer, and faster.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=60" },
  { name: "Paytm", email: "hr@paytm.com", companyName: "Paytm", companyWebsite: "https://paytm.com", bio: "Paytm is India's leading financial services company, offering payments and banking.", avatar: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=100&auto=format&fit=crop&q=60" },
  { name: "Zepto", email: "careers@zepto.com", companyName: "Zepto", companyWebsite: "https://zepto.com", bio: "Zepto is India's fastest-growing 10-minute grocery delivery platform.", avatar: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=100&auto=format&fit=crop&q=60" },
  { name: "Blinkit", email: "talent@blinkit.com", companyName: "Blinkit", companyWebsite: "https://blinkit.com", bio: "Blinkit is a quick commerce marketplace delivering daily needs in minutes.", avatar: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=60" },
  { name: "Meesho", email: "hr@meesho.com", companyName: "Meesho", companyWebsite: "https://meesho.com", bio: "Meesho is India's largest social commerce marketplace, empowering small entrepreneurs.", avatar: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&auto=format&fit=crop&q=60" },
  { name: "TCS", email: "talent@tcs.com", companyName: "TCS", companyWebsite: "https://tcs.com", bio: "Tata Consultancy Services is a global leader in IT services, consulting, and business solutions.", avatar: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=100&auto=format&fit=crop&q=60" },
  { name: "Infosys", email: "hr@infosys.com", companyName: "Infosys", companyWebsite: "https://infosys.com", bio: "Infosys is a global leader in next-generation digital services and consulting.", avatar: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=100&auto=format&fit=crop&q=60" },
  { name: "Wipro", email: "talent@wipro.com", companyName: "Wipro", companyWebsite: "https://wipro.com", bio: "Wipro is a leading technology services and consulting company focused on innovation.", avatar: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=100&auto=format&fit=crop&q=60" },
  { name: "Cognizant", email: "careers@cognizant.com", companyName: "Cognizant", companyWebsite: "https://cognizant.com", bio: "Cognizant engineers modern businesses to improve everyday lives.", avatar: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=100&auto=format&fit=crop&q=60" },
  { name: "HDFC Bank", email: "careers@hdfc.com", companyName: "HDFC Bank", companyWebsite: "https://hdfcbank.com", bio: "HDFC Bank is India's leading private sector bank, delivering banking services to millions.", avatar: "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=100&auto=format&fit=crop&q=60" },
  { name: "ICICI Bank", email: "careers@icici.com", companyName: "ICICI Bank", companyWebsite: "https://icici.com", bio: "ICICI Bank offers a wide range of banking products and financial services.", avatar: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100&auto=format&fit=crop&q=60" },
  { name: "Jio Platforms", email: "talent@jio.com", companyName: "Jio", companyWebsite: "https://jio.com", bio: "Jio is a world-class digital services company transforming the technological landscape of India.", avatar: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=100&auto=format&fit=crop&q=60" }
];

const studentsData = [
  { name: "Aarav Sharma", email: "aarav@gmail.com", bio: "Passionate Full Stack Developer with hands-on experience in the MERN stack. Love solving algorithmic problems.", college: "IIT Bombay", branch: "Computer Science", skills: ["React", "Node.js", "Express", "MongoDB", "JavaScript", "Python", "Data Structures", "Git"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Ananya Iyer", email: "ananya@gmail.com", bio: "Data Science enthusiast who enjoys turning messy datasets into beautiful, predictive stories.", college: "BITS Pilani", branch: "Computer Science", skills: ["Python", "TensorFlow", "Pandas", "SQL", "Machine Learning", "Data Analysis", "R"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Kabir Mehta", email: "kabir@gmail.com", bio: "Backend developer specializing in distributed systems and cloud architectures. Obsessed with API optimization.", college: "Delhi Technological University", branch: "Software Engineering", skills: ["Node.js", "Express", "MongoDB", "PostgreSQL", "Docker", "AWS", "Redis"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Diya Roy", email: "diya@gmail.com", bio: "Frontend Engineer and UI Enthusiast. I craft delightful user interfaces and interactive components.", college: "Jadavpur University", branch: "Information Technology", skills: ["React", "Vue.js", "JavaScript", "HTML5", "CSS3", "Tailwind CSS", "Figma"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Rohan Das", email: "rohan@gmail.com", bio: "Mobile App Developer focused on React Native and Flutter. Experienced in launching consumer apps.", college: "VIT Vellore", branch: "Computer Science", skills: ["React Native", "Flutter", "Dart", "JavaScript", "Firebase", "API Integration"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Meera Nair", email: "meera@gmail.com", bio: "Cybersecurity student interested in ethical hacking, penetration testing, and security auditing.", college: "Amrita Vishwa Vidyapeetham", branch: "Cyber Security", skills: ["Linux", "Python", "Ethical Hacking", "Metasploit", "Wireshark", "Network Security"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Aditya Verma", email: "aditya@gmail.com", bio: "DevOps Engineer passionately automating CI/CD workflows and infrastructure provisioning pipelines.", college: "NIT Trichy", branch: "Electronics and Communication", skills: ["Docker", "Kubernetes", "Jenkins", "Terraform", "Ansible", "AWS", "Linux"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Isha Patel", email: "isha@gmail.com", bio: "Product Design & Frontend Engineer bridging the gap between design systems and code.", college: "NID Ahmedabad", branch: "Interaction Design", skills: ["Figma", "HTML", "CSS", "JavaScript", "React", "User Research", "UI Design"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Vikram Malhotra", email: "vikram@gmail.com", bio: "Blockchain developer exploring Web3 architectures, Solidity smart contracts, and decentralized finance.", college: "Manipal Institute of Technology", branch: "Computer Science", skills: ["Solidity", "Ethereum", "Web3.js", "Smart Contracts", "Node.js", "React"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Sanya Gupta", email: "sanya@gmail.com", bio: "Cloud Architect and Backend Engineer. Certified AWS Solutions Associate. Enthusiastic about serverless.", college: "SRM University", branch: "Information Technology", skills: ["AWS", "Serverless", "Node.js", "Express", "MongoDB", "DynamoDB", "Python"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Karan Johar", email: "karan@gmail.com", bio: "Embedded Systems and IoT researcher. Fascinated by microcontrollers, automation, and low-latency program interfaces.", college: "RV College of Engineering", branch: "Electronics", skills: ["C", "C++", "Arduino", "Raspberry Pi", "IoT", "Embedded Systems"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Sneha Sen", email: "sneha@gmail.com", bio: "A natural problem solver with 500+ solved problems on LeetCode. Strong base in system design.", college: "Jadavpur University", branch: "Computer Science", skills: ["C++", "Java", "SQL", "Data Structures", "Algorithms", "Object Oriented Design"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Arjun Reddy", email: "arjun@gmail.com", bio: "Machine Learning Researcher working on NLP projects. Proficient in tokenizers and transformers.", college: "IIIT Hyderabad", branch: "Computer Science and AI", skills: ["Python", "PyTorch", "NLP", "Hugging Face", "Scikit-Learn", "FastAPI"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Prisha Joshi", email: "prisha@gmail.com", bio: "Creative Developer passionate about 3D Web, WebGL, Three.js, and browser animation vectors.", college: "NIFT Delhi", branch: "Communication Design", skills: ["Three.js", "WebGL", "HTML", "CSS", "JavaScript", "React", "Blender"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Rahul Bose", email: "rahul@gmail.com", bio: "Quality Assurance and Automation test engineer. Writing clean, reusable automated unit tests.", college: "KIIT University", branch: "Computer Science", skills: ["JavaScript", "Cypress", "Selenium", "Jest", "Postman", "API Testing"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Priya Sharma", email: "priya@gmail.com", bio: "React and Vue expert who loves creating responsive, pixel-perfect user dashboards.", college: "IIT Delhi", branch: "Computer Science", skills: ["React", "Vue", "JavaScript", "Sass", "Tailwind CSS", "Git"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Amit Patel", email: "amit@gmail.com", bio: "Systems programmer exploring kernel optimization, Rust, memory safety, and virtualization models.", college: "IIT Madras", branch: "Computer Science", skills: ["Rust", "C", "C++", "Linux", "Virtualization", "Algorithms"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Snehal Gupta", email: "snehal@gmail.com", bio: "Database designer specializing in complex query normalization, index profiling, and high concurrency.", college: "IIT Kanpur", branch: "Software Engineering", skills: ["PostgreSQL", "MongoDB", "SQL", "Redis", "Node.js", "Git"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Vivek Verma", email: "vivek@gmail.com", bio: "Product developer dedicated to building automated testing pipelines and security standard validators.", college: "DTU Delhi", branch: "Information Technology", skills: ["Python", "Selenium", "Cypress", "Docker", "REST APIs", "Git"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Neha Joshi", email: "neha@gmail.com", bio: "AI student training neural models for speech recognition and smart context-aware parsing interfaces.", college: "NSUT Delhi", branch: "Computer Science", skills: ["Python", "PyTorch", "NLP", "TensorFlow", "Pandas", "Scikit-Learn"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Harish Rao", email: "harish@gmail.com", bio: "Network security audit specialist with broad knowledge of encryption protocols and secure relays.", college: "NIT Warangal", branch: "Information Security", skills: ["Networking", "Cybersecurity", "Linux", "Cryptography", "Python", "Bash"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Shruti Deshmukh", email: "shruti@gmail.com", bio: "Full stack developer interested in microservice mesh grids and decentralized database syncing.", college: "COEP Pune", branch: "Computer Engineering", skills: ["Node.js", "React", "Docker", "MongoDB", "Kubernetes", "TypeScript"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Rajesh Kumar", email: "rajesh@gmail.com", bio: "Java enthusiast specializing in high-throughput enterprise systems and database transaction isolation.", college: "BIT Mesra", branch: "Computer Science", skills: ["Java", "Spring Boot", "Hibernate", "PostgreSQL", "Kafka", "Git"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Divya Kulkarni", email: "divya@gmail.com", bio: "Graphic communicator turned web engineer, designing gorgeous layout layouts and animations.", college: "Symbiosis Pune", branch: "Interaction Design", skills: ["Figma", "HTML", "CSS", "JavaScript", "React", "Photoshop", "UI Design"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Nikhil Nair", email: "nikhil@gmail.com", bio: "Site reliability expert working on failover simulations and network packet routing configurations.", college: "PESIT Bangalore", branch: "Computer Science", skills: ["AWS", "Docker", "Terraform", "Nginx", "Linux", "Bash", "SRE"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Pooja Hegde", email: "pooja@gmail.com", bio: "Data analyst who enjoys building real-time dashboards and cleaning dense datasets for reporting.", college: "RVCE Bangalore", branch: "Information Technology", skills: ["SQL", "Pandas", "Python", "Tableau", "Excel", "Data Visualization"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Manish Malhotra", email: "manish@gmail.com", bio: "Mobile programmer crafting consumer applications with clean offline-first local synchronization.", college: "IIT Roorkee", branch: "Electrical Engineering", skills: ["React Native", "JavaScript", "SQLite", "Redux", "Git", "Node.js"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Kavita Roy", email: "kavita@gmail.com", bio: "Machine intelligence engineer focused on machine learning classifications and deep convolutional vision models.", college: "IIT Kharagpur", branch: "Computer Science", skills: ["Python", "TensorFlow", "Keras", "NumPy", "Scikit-Learn", "Matplotlib"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Ajay Devgn", email: "ajay@gmail.com", bio: "Embedded design hobbyist, writing real-time operational operating systems for robotic hardware boards.", college: "IIIT Bangalore", branch: "Embedded Systems", skills: ["C", "C++", "RTOS", "Microcontrollers", "Raspberry Pi", "IoT"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Shalini Singh", email: "shalini@gmail.com", bio: "Cloud operations manager automating auto-scaling clusters and cloud access permission setups.", college: "IGDTUW Delhi", branch: "Computer Science", skills: ["AWS", "IAM", "Serverless", "Terraform", "Linux", "Node.js"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Tarun Tejpal", email: "tarun@gmail.com", bio: "Agile developer obsessed with perfect test coverage, unit mock tools, and continuous integration pipelines.", college: "TIET Patiala", branch: "Software Engineering", skills: ["JavaScript", "Jest", "Git", "Jenkins", "Node.js", "Express"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Ritu Phogat", email: "ritu@gmail.com", bio: "Information architect organizing database schemas, API specs, and technical developer manuals.", college: "VJTI Mumbai", branch: "Information Technology", skills: ["SQL", "Swagger", "Postman", "Express", "Node.js", "MongoDB"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Yashwant Sinha", email: "yashwant@gmail.com", bio: "Blockchain analyst drafting smart agreements and token contract models for decentralized commerce.", college: "IIT Guwahati", branch: "Computer Science", skills: ["Solidity", "Web3.js", "Hardhat", "Smart Contracts", "React", "Git"], github: "https://github.com", linkedin: "https://linkedin.com" },
  { name: "Gauri Shinde", email: "gauri@gmail.com", bio: "Creative multimedia programmer implementing responsive animations, SVGs, and interactive web canvases.", college: "NID Vijayawada", branch: "Communication Design", skills: ["HTML", "CSS", "JavaScript", "GSAP", "Figma", "Responsive Design"], github: "https://github.com/gauri", linkedin: "https://linkedin.com/in/gauri" },
  { name: "Varun Dhawan", email: "varun@gmail.com", bio: "Aspiring backend developer exploring scalable data streams, message brokers, and transactional databases.", college: "IIIT Delhi", branch: "Computer Science", skills: ["Node.js", "Express", "Redis", "Kafka", "PostgreSQL", "Git"], github: "https://github.com/varun", linkedin: "https://linkedin.com/in/varun" }
];

const opportunitiesData = [
  { title: "Software Engineering Intern (Backend)", company: "Google India", description: "Optimize backend endpoints and high-volume data aggregations.", requiredSkills: ["Go", "Java", "C++", "Data Structures"], location: "Bangalore (Onsite)", type: "internship", stipend: "120000", duration: "6 Months" },
  { title: "Associate Software Engineer", company: "Stripe", description: "Build scalable payments checkout pipelines and secure routing schemas.", requiredSkills: ["Ruby", "JavaScript", "SQL", "Git"], location: "Remote (India)", type: "job", stipend: "1800000", duration: "Permanent" },
  { title: "Frontend React Developer", company: "Razorpay", description: "Enhance consumer checkout dashboards using React and Redux.", requiredSkills: ["React", "JavaScript", "Tailwind CSS", "Redux"], location: "Bangalore (Hybrid)", type: "job", stipend: "1250000", duration: "Permanent" },
  { title: "Backend Engineering Intern", company: "Swiggy", description: "Optimize logistics routes and high-volume order queries.", requiredSkills: ["Node.js", "Express", "MongoDB", "Redis"], location: "Bangalore (Onsite)", type: "internship", stipend: "45000", duration: "6 Months" },
  { title: "Product Design Intern", company: "CRED", description: "Design gamified interactions and premium micro-animations.", requiredSkills: ["Figma", "Prototyping", "UI Design", "User Research"], location: "Bangalore (Onsite)", type: "internship", stipend: "60000", duration: "3 Months" },
  { title: "DevOps & Cloud Intern", company: "Microsoft India", description: "Automate azure cloud builds and container configurations.", requiredSkills: ["Azure", "Docker", "Kubernetes", "Terraform"], location: "Hyderabad (Onsite)", type: "internship", stipend: "80000", duration: "6 Months" },
  { title: "QA Automation Engineer", company: "Atlassian", description: "Write cypress automation frameworks for premium tracking software.", requiredSkills: ["JavaScript", "Cypress", "Jest", "Postman"], location: "Bangalore (Hybrid)", type: "job", stipend: "1400000", duration: "Permanent" },
  { title: "Junior Cloud Infrastructure Engineer", company: "Vercel", description: "Support global serverless middleware and static assets edge routers.", requiredSkills: ["Node.js", "Nginx", "Docker", "AWS"], location: "Remote (India)", type: "job", stipend: "1650000", duration: "Permanent" },
  { title: "API Developer Intern", company: "Postman", description: "Enhance next-generation developer API lifecycles and collections tools.", requiredSkills: ["Node.js", "Express", "REST APIs", "SQL"], location: "Bangalore (Hybrid)", type: "internship", stipend: "50000", duration: "6 Months" },
  { title: "Fullstack Engineering Intern", company: "Zomato", description: "Support restaurant analytics portal and active order pipelines.", requiredSkills: ["React", "Node.js", "MongoDB", "Express"], location: "Gurugram (Onsite)", type: "internship", stipend: "40000", duration: "6 Months" },
  { title: "Streaming Infrastructure Intern", company: "Netflix India", description: "Support video rendering, codec allocations, and localized CDN distributions.", requiredSkills: ["C++", "Java", "Python", "Linux"], location: "Mumbai (Onsite)", type: "internship", stipend: "110000", duration: "6 Months" },
  { title: "Junior Software Developer", company: "Adobe India", description: "Help build and optimize document synchronization models in modern cloud extensions.", requiredSkills: ["C++", "JavaScript", "HTML", "CSS"], location: "Noida (Onsite)", type: "job", stipend: "1100000", duration: "Permanent" },
  { title: "Smart Contract Developer (Web3)", company: "Coinbase", description: "Build secure Ethereum and Solidity protocols for international transfers.", requiredSkills: ["Solidity", "Ethereum", "Web3.js", "Cryptography"], location: "Remote (India)", type: "job", stipend: "2200000", duration: "Permanent" },
  { title: "Fullstack Software Engineer", company: "Groww", description: "Develop high-throughput stock calculation engines and direct ledger balances.", requiredSkills: ["Java", "Spring Boot", "React", "PostgreSQL"], location: "Bangalore (Hybrid)", type: "job", stipend: "1500000", duration: "Permanent" },
  { title: "Service Delivery Tech Intern", company: "Urban Company", description: "Build automated pricing and allocation tools for real-time service professionals.", requiredSkills: ["Node.js", "Express", "MongoDB", "Redis"], location: "Gurugram (Onsite)", type: "internship", stipend: "35000", duration: "3 Months" },
  { title: "React Native Developer", company: "PhonePe", description: "Maintain digital payments UI with seamless transaction workflows.", requiredSkills: ["React Native", "JavaScript", "Redux", "Firebase"], location: "Bangalore (Hybrid)", type: "job", stipend: "1300000", duration: "Permanent" },
  { title: "Senior Backend Developer (Node)", company: "Flipkart", description: "Scale core cart and checkout web endpoints during high traffic.", requiredSkills: ["Node.js", "Express", "MongoDB", "SQL"], location: "Bangalore (Onsite)", type: "job", stipend: "2200000", duration: "Permanent" },
  { title: "Mobile Systems Intern", company: "OYO", description: "Develop lightweight travel accommodation booking features for iOS/Android.", requiredSkills: ["Flutter", "Dart", "API Integration", "Git"], location: "Gurugram (Onsite)", type: "internship", stipend: "30000", duration: "6 Months" },
  { title: "UX Designer & Researcher", company: "Nykaa", description: "Conduct user experience audits and design brand interfaces for wellness.", requiredSkills: ["Figma", "UI Design", "User Research", "Adobe XD"], location: "Mumbai (Onsite)", type: "job", stipend: "950000", duration: "Permanent" },
  { title: "Android Mobile Engineer", company: "Ola", description: "Support map integrations, GPS tracking relays, and offline ride sync.", requiredSkills: ["Java", "Kotlin", "Git", "API Integration"], location: "Bangalore (Hybrid)", type: "job", stipend: "1400000", duration: "Permanent" },
  { title: "Headless E-commerce Intern", company: "Swell", description: "Develop custom storefront mockups and headless cart integration templates.", requiredSkills: ["JavaScript", "HTML", "CSS", "React"], location: "Remote (India)", type: "internship", stipend: "25000", duration: "3 Months" },
  { title: "Developer Tooling Intern", company: "Retool", description: "Support internal queries, schema generation widgets, and data templates.", requiredSkills: ["React", "JavaScript", "SQL", "Git"], location: "Remote (India)", type: "internship", stipend: "40000", duration: "6 Months" },
  { title: "Marketplace Web Developer", company: "Airbnb India", description: "Build interactive guest review and property search filtering forms.", requiredSkills: ["React", "JavaScript", "CSS", "HTML"], location: "Gurugram (Onsite)", type: "job", stipend: "1600000", duration: "Permanent" },
  { title: "Core Routing Systems Intern", company: "Uber India", description: "Optimize geographic routing calculations and driver dispatching algorithms.", requiredSkills: ["C++", "Python", "Algorithms", "Git"], location: "Bangalore (Onsite)", type: "internship", stipend: "90000", duration: "6 Months" },
  { title: "Payment Systems Engineer", company: "Paytm", description: "Maintain secure banking relays and multi-factor transaction authentications.", requiredSkills: ["Java", "Spring Boot", "SQL", "Git"], location: "Noida (Onsite)", type: "job", stipend: "1150000", duration: "Permanent" },
  { title: "Inventory Optimization Intern", company: "Zepto", description: "Optimize product quantities and real-time delivery tracking screens.", requiredSkills: ["Node.js", "Express", "MongoDB", "Redis"], location: "Mumbai (Onsite)", type: "internship", stipend: "40000", duration: "3 Months" },
  { title: "Fulfillment Tech Intern", company: "Blinkit", description: "Develop micro-warehouse picker tracking dashboards using socket.io.", requiredSkills: ["Node.js", "Express", "Socket.io", "MongoDB"], location: "Gurugram (Onsite)", type: "internship", stipend: "45000", duration: "6 Months" },
  { title: "Catalog Management Developer", company: "Meesho", description: "Create light merchant catalog bulk upload dashboards.", requiredSkills: ["React", "Node.js", "MongoDB", "Git"], location: "Bangalore (Hybrid)", type: "job", stipend: "1050000", duration: "Permanent" },
  { title: "Systems Engineer Trainee", company: "TCS", description: "Gain exposure to legacy database migration projects and client relays.", requiredSkills: ["Java", "SQL", "HTML", "CSS"], location: "Chennai (Onsite)", type: "job", stipend: "450000", duration: "Permanent" },
  { title: "Cloud Associate Consultant", company: "Infosys", description: "Support corporate clients with migration strategies to public cloud servers.", requiredSkills: ["AWS", "Linux", "SQL", "Git"], location: "Pune (Onsite)", type: "job", stipend: "500000", duration: "Permanent" },
  { title: "Full Stack Engineer", company: "Wipro", description: "Support e-government enterprise projects with reliable MERN stacks.", requiredSkills: ["React", "Node.js", "MongoDB", "Express"], location: "Kolkata (Onsite)", type: "job", stipend: "550000", duration: "Permanent" },
  { title: "Backend Web Developer", company: "Cognizant", description: "Develop REST endpoints and schedule automated report exports.", requiredSkills: ["Node.js", "Express", "PostgreSQL", "Git"], location: "Hyderabad (Onsite)", type: "job", stipend: "600000", duration: "Permanent" },
  { title: "Security Analyst Intern", company: "HDFC Bank", description: "Conduct local database encryption tests and log validation auditing.", requiredSkills: ["Cybersecurity", "Linux", "SQL", "Git"], location: "Mumbai (Onsite)", type: "internship", stipend: "30000", duration: "6 Months" },
  { title: "Database Administrator", company: "ICICI Bank", description: "Maintain transaction logs, backups, and SQL query optimizations.", requiredSkills: ["SQL", "Oracle DB", "Linux", "Git"], location: "Mumbai (Onsite)", type: "job", stipend: "900000", duration: "Permanent" },
  { title: "Data Stream Analyst", company: "Jio", description: "Optimize content distribution metrics and live user streaming statistics.", requiredSkills: ["Python", "SQL", "Kafka", "Data Analysis"], location: "Navi Mumbai (Onsite)", type: "job", stipend: "1000000", duration: "Permanent" }
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
    await AcademicProfile.deleteMany({});
    await Notification.deleteMany({});
    console.log("Cleared old database tables, notifications, and academic profiles successfully.");

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
    // Generate exactly 35 applications matching students with opportunities
    for (let i = 0; i < 35; i++) {
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
