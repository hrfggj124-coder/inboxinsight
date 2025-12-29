export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  categorySlug: string;
  author: string;
  authorAvatar?: string;
  publishedAt: string;
  readTime: number;
  image: string;
  featured?: boolean;
  trending?: boolean;
  source?: string;
  sourceUrl?: string;
  tags: string[];
}

export interface Category {
  name: string;
  slug: string;
  description: string;
  color: string;
}

export const categories: Category[] = [
  { name: "Artificial Intelligence", slug: "ai", description: "Latest in AI, machine learning, and neural networks", color: "ai" },
  { name: "Software", slug: "software", description: "Development, programming, and software engineering", color: "software" },
  { name: "Startups", slug: "startups", description: "Funding rounds, acquisitions, and startup ecosystem", color: "startups" },
  { name: "Cybersecurity", slug: "security", description: "Security threats, privacy, and data protection", color: "security" },
  { name: "Cloud", slug: "cloud", description: "Cloud computing, infrastructure, and services", color: "cloud" },
  { name: "Web3 & Crypto", slug: "web3", description: "Blockchain, cryptocurrency, and decentralized tech", color: "web3" },
  { name: "Gadgets", slug: "gadgets", description: "Consumer electronics, devices, and hardware", color: "gadgets" },
  { name: "Fintech", slug: "fintech", description: "Financial technology and digital payments", color: "fintech" },
];

export const articles: Article[] = [
  {
    id: "1",
    title: "OpenAI Unveils GPT-5: A New Era of Multimodal AI Capabilities",
    slug: "openai-unveils-gpt-5-multimodal-ai",
    excerpt: "OpenAI's latest model demonstrates unprecedented reasoning abilities and native multimodal understanding, setting new benchmarks across every major AI evaluation.",
    content: `OpenAI has officially unveiled GPT-5, its most advanced artificial intelligence model to date, marking a significant leap forward in the field of large language models. The new system demonstrates remarkable improvements in reasoning, coding, and multimodal understanding.

According to OpenAI's announcement, GPT-5 showcases a 40% improvement in complex reasoning tasks compared to its predecessor. The model can now process and generate content across text, images, audio, and video with unprecedented coherence and accuracy.

"This represents years of research into making AI systems more helpful, harmless, and honest," said Sam Altman, CEO of OpenAI. "GPT-5 is designed to be a true thinking partner for professionals across every industry."

Industry analysts predict this release will accelerate AI adoption across enterprise applications, with particular impact in healthcare diagnostics, legal research, and scientific discovery. Major technology companies have already begun integrating the new model into their product ecosystems.`,
    category: "Artificial Intelligence",
    categorySlug: "ai",
    author: "Sarah Chen",
    publishedAt: "2024-12-28T14:00:00Z",
    readTime: 5,
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=630&fit=crop",
    featured: true,
    trending: true,
    tags: ["OpenAI", "GPT-5", "AI", "Machine Learning"],
    source: "TechPulse Staff"
  },
  {
    id: "2",
    title: "Apple's Vision Pro 2 Enters Mass Production Ahead of 2025 Launch",
    slug: "apple-vision-pro-2-mass-production",
    excerpt: "Apple's second-generation mixed reality headset features improved displays, lighter design, and a more accessible price point as the company pushes spatial computing mainstream.",
    content: `Apple has begun mass production of its second-generation Vision Pro headset, according to multiple supply chain sources. The device, expected to launch in early 2025, addresses many criticisms of the original model while introducing new capabilities.

The Vision Pro 2 reportedly features micro-OLED displays with 30% higher pixel density, reducing the screen-door effect that some users experienced. Perhaps more significantly, Apple has managed to reduce the device's weight by approximately 25% through new materials and battery optimizations.

Pricing remains a key focus, with reports suggesting a starting price of $2,499—a substantial reduction from the original's $3,499 entry point. Apple is also reportedly developing a more affordable "Vision" model targeting the $1,299-$1,499 range for 2026.

The spatial computing market has seen increased competition from Meta, Sony, and emerging Chinese manufacturers, making Apple's pricing and feature decisions particularly strategic.`,
    category: "Gadgets",
    categorySlug: "gadgets",
    author: "Michael Torres",
    publishedAt: "2024-12-28T11:30:00Z",
    readTime: 4,
    image: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=1200&h=630&fit=crop",
    featured: true,
    tags: ["Apple", "Vision Pro", "AR", "VR", "Mixed Reality"],
    source: "TechPulse Staff"
  },
  {
    id: "3",
    title: "Anthropic Raises $4 Billion in Series D, Valued at $60 Billion",
    slug: "anthropic-raises-4-billion-series-d",
    excerpt: "The AI safety-focused startup secures massive funding round led by Google and Spark Capital, intensifying the race for artificial general intelligence.",
    content: `Anthropic, the AI safety company behind the Claude assistant, has closed a $4 billion Series D funding round, pushing its valuation to approximately $60 billion. The round was led by existing investor Google, with participation from Spark Capital, Lightspeed Venture Partners, and several sovereign wealth funds.

The funding underscores investor confidence in Anthropic's "Constitutional AI" approach to building safe and beneficial AI systems. The company plans to use the capital to expand its research teams, increase computing infrastructure, and accelerate the development of its next-generation models.

"This investment allows us to pursue our mission of developing AI systems that are safe, beneficial, and understandable," said Dario Amodei, Anthropic's CEO. "We're focused on building AI that genuinely helps humanity while minimizing potential risks."

The funding comes as competition in the AI industry intensifies, with OpenAI, Google, and Meta all racing to develop more capable systems. Anthropic's emphasis on safety research has attracted both financial backing and top research talent from across the industry.`,
    category: "Startups",
    categorySlug: "startups",
    author: "Jennifer Walsh",
    publishedAt: "2024-12-28T09:00:00Z",
    readTime: 4,
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&h=630&fit=crop",
    trending: true,
    tags: ["Anthropic", "Funding", "AI", "Startup"],
    source: "TechPulse Staff"
  },
  {
    id: "4",
    title: "Critical Zero-Day Vulnerability Discovered in Major Cloud Platforms",
    slug: "critical-zero-day-cloud-platforms",
    excerpt: "Security researchers uncover a severe vulnerability affecting AWS, Azure, and GCP that could allow unauthorized access to customer data across shared infrastructure.",
    content: `A coalition of security researchers has disclosed a critical zero-day vulnerability affecting major cloud infrastructure providers, including Amazon Web Services, Microsoft Azure, and Google Cloud Platform. The vulnerability, tracked as CVE-2024-87234, could potentially allow attackers to escape containerized environments and access data belonging to other customers.

The flaw exists in the hypervisor layer common to all three platforms' virtualization systems. While cloud providers have implemented various mitigations, the fundamental architectural issue requires significant patches that are currently being deployed.

All three companies have acknowledged the vulnerability and are working together on a coordinated response. AWS stated that no customer data breaches have been detected, while Azure and GCP issued similar assurances.

Security experts recommend that organizations review their cloud security configurations and implement additional monitoring for unusual access patterns. The incident highlights ongoing challenges in securing multi-tenant cloud environments at scale.`,
    category: "Cybersecurity",
    categorySlug: "security",
    author: "Alex Rivera",
    publishedAt: "2024-12-27T16:45:00Z",
    readTime: 6,
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&h=630&fit=crop",
    trending: true,
    tags: ["Security", "Cloud", "Zero-Day", "Vulnerability"],
    source: "TechPulse Staff"
  },
  {
    id: "5",
    title: "GitHub Copilot Workspace Launches: AI-Powered Development Environment",
    slug: "github-copilot-workspace-launches",
    excerpt: "Microsoft's GitHub unveils a complete AI-native development environment that can plan, build, and test entire features from natural language descriptions.",
    content: `GitHub has launched Copilot Workspace, an ambitious new development environment that aims to transform how software is built. The tool allows developers to describe features in natural language and watch as the AI plans, implements, and tests the code automatically.

Unlike the original GitHub Copilot, which suggests code completions, Workspace operates at the project level. Developers can describe a bug fix or new feature, and the system will analyze the codebase, propose a multi-file implementation plan, generate the code, and even write corresponding tests.

"This is the beginning of truly AI-native software development," said Thomas Dohmke, CEO of GitHub. "We're not replacing developers—we're giving them superpowers to focus on the creative and architectural aspects of their work."

Early access users report significant productivity gains, particularly for routine tasks and boilerplate code. However, senior engineers note that human oversight remains essential for ensuring code quality and security in production environments.`,
    category: "Software",
    categorySlug: "software",
    author: "David Kim",
    publishedAt: "2024-12-27T14:00:00Z",
    readTime: 5,
    image: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=1200&h=630&fit=crop",
    tags: ["GitHub", "Copilot", "AI", "Development"],
    source: "TechPulse Staff"
  },
  {
    id: "6",
    title: "AWS Announces Graviton4: 50% Performance Boost for Cloud Workloads",
    slug: "aws-graviton4-announcement",
    excerpt: "Amazon's latest custom ARM processor promises dramatic improvements in performance per dollar, challenging Intel and AMD in the data center market.",
    content: `Amazon Web Services has unveiled Graviton4, the fourth generation of its custom ARM-based processors designed specifically for cloud workloads. The new chips deliver up to 50% better performance compared to Graviton3, while maintaining the platform's strong energy efficiency characteristics.

Graviton4 instances will be available across multiple AWS regions starting in Q1 2025, with initial offerings in compute-optimized and memory-optimized configurations. The processors feature up to 96 cores and support DDR5 memory, enabling significantly higher bandwidth for data-intensive applications.

"Graviton4 represents our continued investment in custom silicon that delivers the best price-performance for our customers," said Peter DeSantis, AWS Senior Vice President. "We're seeing tremendous adoption across workloads from web servers to machine learning inference."

The announcement intensifies competition in the data center processor market, where Intel and AMD have been working to match AWS's efficiency advantages. Both companies have announced new server chip generations for 2025 that specifically target ARM-based competition.`,
    category: "Cloud",
    categorySlug: "cloud",
    author: "Lisa Park",
    publishedAt: "2024-12-27T10:30:00Z",
    readTime: 4,
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=630&fit=crop",
    tags: ["AWS", "Cloud", "Processors", "Infrastructure"],
    source: "TechPulse Staff"
  },
  {
    id: "7",
    title: "Ethereum Completes Verkle Trees Upgrade, Reduces Node Storage by 90%",
    slug: "ethereum-verkle-trees-upgrade",
    excerpt: "Major protocol upgrade dramatically lowers the barrier to running full nodes, advancing Ethereum's decentralization goals ahead of schedule.",
    content: `The Ethereum network has successfully activated the long-anticipated Verkle Trees upgrade, a fundamental change to how the blockchain stores and verifies state data. The upgrade reduces full node storage requirements by approximately 90%, making it significantly easier for individuals to participate in network validation.

Prior to the upgrade, running a full Ethereum node required hundreds of gigabytes of storage. With Verkle Trees, this requirement drops to under 50GB, enabling node operation on standard consumer hardware and even some mobile devices.

"This is one of the most important technical upgrades in Ethereum's history," said Vitalik Buterin, Ethereum co-founder. "Lower barriers to running nodes directly translates to a more decentralized and censorship-resistant network."

The successful deployment follows extensive testing on Ethereum's Sepolia and Holesky test networks. Developers report the mainnet transition was smooth, with no significant issues detected in the first 24 hours.`,
    category: "Web3 & Crypto",
    categorySlug: "web3",
    author: "Marcus Johnson",
    publishedAt: "2024-12-26T18:00:00Z",
    readTime: 5,
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=630&fit=crop",
    tags: ["Ethereum", "Blockchain", "Crypto", "Web3"],
    source: "TechPulse Staff"
  },
  {
    id: "8",
    title: "Stripe Introduces AI-Powered Fraud Prevention, Blocks $3B in First Month",
    slug: "stripe-ai-fraud-prevention",
    excerpt: "The payments giant's new machine learning system demonstrates remarkable accuracy in detecting sophisticated fraud patterns across its global network.",
    content: `Stripe has announced that its new AI-powered fraud detection system, Stripe Radar AI, blocked over $3 billion in fraudulent transactions during its first month of full deployment. The system uses advanced machine learning trained on Stripe's vast transaction dataset spanning millions of businesses worldwide.

The new system achieves a 99.5% accuracy rate in identifying fraudulent transactions while maintaining a false positive rate of just 0.1%—a significant improvement over traditional rule-based systems. Merchants report substantial reductions in chargebacks and fraud-related losses.

"Our AI models see patterns that humans simply cannot detect," said Patrick Collison, Stripe CEO. "By analyzing billions of data points in real-time, we can identify sophisticated fraud rings before they cause damage."

The technology is now available to all Stripe merchants at no additional cost, representing a significant competitive advantage in the crowded payments market. Competitors PayPal and Adyen have announced accelerated AI fraud prevention initiatives in response.`,
    category: "Fintech",
    categorySlug: "fintech",
    author: "Rachel Green",
    publishedAt: "2024-12-26T14:30:00Z",
    readTime: 4,
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=630&fit=crop",
    trending: true,
    tags: ["Stripe", "Fintech", "AI", "Fraud Prevention"],
    source: "TechPulse Staff"
  },
  {
    id: "9",
    title: "Microsoft Teams Surpasses 400 Million Monthly Active Users",
    slug: "microsoft-teams-400-million-users",
    excerpt: "Enterprise communication platform reaches new milestone as remote and hybrid work patterns become permanent fixtures of the modern workplace.",
    content: `Microsoft has announced that Teams has surpassed 400 million monthly active users, cementing its position as the dominant enterprise communication and collaboration platform. The milestone represents a 30% increase from the previous year, driven by continued adoption of hybrid work models.

New features including Copilot integration, enhanced meeting intelligence, and improved mobile experiences have contributed to the growth. Microsoft reports that Teams is now used by 91% of Fortune 500 companies, with particularly strong adoption in healthcare, education, and financial services sectors.

"Teams has become the digital headquarters for the modern workplace," said Satya Nadella, Microsoft CEO. "AI is making every meeting more productive and every collaboration more seamless."

The company also announced expanded integration with third-party applications, with over 2,000 apps now available in the Teams marketplace. Competition with Slack, Zoom, and Google Workspace remains intense, with each platform investing heavily in AI-powered features.`,
    category: "Software",
    categorySlug: "software",
    author: "Kevin Zhang",
    publishedAt: "2024-12-26T11:00:00Z",
    readTime: 3,
    image: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1200&h=630&fit=crop",
    tags: ["Microsoft", "Teams", "Enterprise", "Collaboration"],
    source: "TechPulse Staff"
  },
  {
    id: "10",
    title: "Tesla Robotaxi Service Launches in Austin, Expands to Phoenix Next Month",
    slug: "tesla-robotaxi-austin-launch",
    excerpt: "Full self-driving vehicles begin commercial passenger service with no safety driver, marking a major milestone for autonomous transportation.",
    content: `Tesla has launched its long-awaited Robotaxi service in Austin, Texas, deploying a fleet of fully autonomous Model 3 vehicles for commercial passenger transport. The service operates without any human safety driver, marking a significant milestone in the autonomous vehicle industry.

The initial deployment includes 50 vehicles operating in a defined service area covering downtown Austin and surrounding neighborhoods. Rides are booked through the Tesla app, with pricing approximately 30% below comparable Uber and Lyft fares.

"This is the moment we've been working toward for over a decade," said Elon Musk during the launch event. "Autonomous transportation is not the future—it's happening right now."

Tesla has received regulatory approval to expand the service to Phoenix, Arizona, next month, with plans for Los Angeles and San Francisco pending. The company reports that its vehicles have completed over 1 million miles of autonomous operation during testing with zero at-fault incidents.`,
    category: "Artificial Intelligence",
    categorySlug: "ai",
    author: "Emma Williams",
    publishedAt: "2024-12-25T20:00:00Z",
    readTime: 5,
    image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&h=630&fit=crop",
    tags: ["Tesla", "Robotaxi", "Autonomous", "Transportation"],
    source: "TechPulse Staff"
  },
  {
    id: "11",
    title: "Google DeepMind's AlphaFold 3 Predicts All Molecular Structures",
    slug: "deepmind-alphafold-3-molecular-structures",
    excerpt: "Revolutionary AI system extends beyond proteins to predict structures of DNA, RNA, and small molecules, potentially transforming drug discovery.",
    content: `Google DeepMind has released AlphaFold 3, a groundbreaking advancement that extends the AI system's capabilities from protein structure prediction to virtually all molecular types including DNA, RNA, ligands, and chemical modifications.

The new model can predict how these different molecular types interact with each other—a capability that could dramatically accelerate drug discovery and materials science research. Early tests show AlphaFold 3 achieves over 80% accuracy in predicting complex molecular interactions, a task previously requiring expensive and time-consuming laboratory experiments.

"This is a fundamental breakthrough in our understanding of biology at the molecular level," said Demis Hassabis, CEO of DeepMind. "We're making this available to researchers worldwide because the potential benefits for humanity are enormous."

Major pharmaceutical companies including Pfizer, Novartis, and Moderna have already begun integrating AlphaFold 3 into their research pipelines, with several reporting significant reductions in early-stage drug development timelines.`,
    category: "Artificial Intelligence",
    categorySlug: "ai",
    author: "Dr. Andrew Chen",
    publishedAt: "2024-12-25T15:00:00Z",
    readTime: 6,
    image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&h=630&fit=crop",
    tags: ["DeepMind", "AlphaFold", "AI", "Drug Discovery"],
    source: "TechPulse Staff"
  },
  {
    id: "12",
    title: "Samsung Unveils 2nm Chip Manufacturing Process, Challenges TSMC",
    slug: "samsung-2nm-chip-manufacturing",
    excerpt: "Korean semiconductor giant demonstrates working 2nm GAA transistors, claiming power efficiency advantages over Taiwan rival's competing technology.",
    content: `Samsung has officially announced its 2nm semiconductor manufacturing process, featuring Gate-All-Around (GAA) transistor architecture that the company claims offers significant power and performance advantages over competing technologies. The announcement positions Samsung as a formidable challenger to TSMC's dominance in advanced chip manufacturing.

The new process delivers 25% better performance while consuming 45% less power compared to Samsung's current 3nm node. The company has begun sampling chips with key customers and plans high-volume production by late 2025.

Samsung's strategy includes aggressive pricing and capacity expansion, with a new $25 billion fab under construction in Taylor, Texas. The company is actively courting major customers including Nvidia, Qualcomm, and Apple—firms that have historically relied primarily on TSMC.

"Our 2nm process represents the culmination of decades of investment in semiconductor R&D," said Jong-Hee Han, Samsung Electronics CEO. "We're ready to provide a genuine alternative for customers seeking cutting-edge manufacturing capabilities."`,
    category: "Gadgets",
    categorySlug: "gadgets",
    author: "Chris Park",
    publishedAt: "2024-12-25T08:00:00Z",
    readTime: 4,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=630&fit=crop",
    tags: ["Samsung", "Semiconductors", "Manufacturing", "Chips"],
    source: "TechPulse Staff"
  },
  {
    id: "13",
    title: "Cloudflare Reports Largest DDoS Attack Ever Recorded: 7.1 Tbps",
    slug: "cloudflare-largest-ddos-attack",
    excerpt: "Internet infrastructure company successfully mitigates record-breaking distributed denial of service attack targeting major financial institutions.",
    content: `Cloudflare has disclosed details of the largest DDoS attack ever recorded, a massive 7.1 terabits-per-second assault that targeted multiple major financial institutions earlier this month. The company's systems successfully mitigated the attack with no disruption to customer services.

The attack originated from a botnet comprising over 30,000 compromised devices across 132 countries, with the majority of traffic coming from Asia and Eastern Europe. Cloudflare's automated defense systems detected and blocked the attack within 40 seconds of its initiation.

"Attacks of this scale would have taken down most organizations," said Matthew Prince, Cloudflare CEO. "Our investment in distributed defense infrastructure is specifically designed to handle threats that seemed impossible just a few years ago."

The incident highlights the escalating sophistication of cyber threats and the critical importance of robust DDoS protection for organizations of all sizes. Cloudflare has published detailed analysis of the attack patterns to help the broader security community improve defenses.`,
    category: "Cybersecurity",
    categorySlug: "security",
    author: "Hannah Stone",
    publishedAt: "2024-12-24T17:30:00Z",
    readTime: 5,
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=630&fit=crop",
    tags: ["Cloudflare", "DDoS", "Security", "Cyberattack"],
    source: "TechPulse Staff"
  },
  {
    id: "14",
    title: "Databricks Acquires MosaicML for $1.3 Billion to Boost AI Capabilities",
    slug: "databricks-acquires-mosaicml",
    excerpt: "Data analytics giant purchases AI training startup to offer enterprise customers more control over their machine learning infrastructure.",
    content: `Databricks has completed its acquisition of MosaicML, a startup specializing in efficient AI model training, for $1.3 billion. The deal represents one of the largest AI acquisitions of the year and signals Databricks' ambition to become a comprehensive platform for enterprise AI development.

MosaicML's technology enables organizations to train large language models more efficiently, reducing the computing costs and time required by up to 70%. The platform is particularly attractive to enterprises that want to develop custom AI models using their proprietary data while maintaining full control and privacy.

"This acquisition allows our customers to build world-class AI without depending on external AI providers," said Ali Ghodsi, CEO of Databricks. "Organizations can now train, fine-tune, and deploy models entirely within their own secure environment."

The combined company will offer an integrated solution spanning data engineering, analytics, and machine learning, positioning Databricks as a direct competitor to cloud giants' AI platforms.`,
    category: "Startups",
    categorySlug: "startups",
    author: "Brian Cooper",
    publishedAt: "2024-12-24T12:00:00Z",
    readTime: 4,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop",
    tags: ["Databricks", "MosaicML", "Acquisition", "AI"],
    source: "TechPulse Staff"
  },
  {
    id: "15",
    title: "Google Cloud Launches Quantum Computing Service for Enterprise",
    slug: "google-cloud-quantum-computing-enterprise",
    excerpt: "Tech giant makes quantum processors available through cloud API, enabling businesses to experiment with quantum algorithms without massive hardware investment.",
    content: `Google Cloud has launched Quantum Cloud, a new service that provides enterprise customers access to Google's latest quantum processors through a simple cloud API. The offering makes quantum computing accessible to organizations without requiring billion-dollar investments in quantum hardware.

The service provides access to Google's 72-qubit Willow processor, along with simulators, development tools, and pre-built quantum algorithms for common use cases in optimization, materials science, and financial modeling.

"Quantum computing is transitioning from research project to practical business tool," said Thomas Kurian, CEO of Google Cloud. "We're making it easy for enterprises to start exploring quantum advantage today."

Initial customers include financial services firms exploring portfolio optimization, pharmaceutical companies working on molecular simulation, and logistics companies testing route optimization algorithms. Google is offering free tier access for experimentation, with production pricing based on quantum processor time.`,
    category: "Cloud",
    categorySlug: "cloud",
    author: "Melissa Chang",
    publishedAt: "2024-12-24T09:00:00Z",
    readTime: 5,
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=630&fit=crop",
    tags: ["Google", "Quantum Computing", "Cloud", "Enterprise"],
    source: "TechPulse Staff"
  },
  {
    id: "16",
    title: "PayPal Launches AI-Powered Smart Receipts, Transforms Expense Tracking",
    slug: "paypal-ai-smart-receipts",
    excerpt: "New feature automatically categorizes purchases, extracts tax information, and integrates with accounting software for seamless financial management.",
    content: `PayPal has introduced Smart Receipts, an AI-powered feature that automatically processes and categorizes all purchases made through the platform. The system extracts detailed information including tax amounts, merchant categories, and payment methods, creating a comprehensive financial record for users.

The feature uses advanced computer vision and natural language processing to analyze receipt data, even when merchants provide minimal transaction details. Users can export categorized expense data directly to popular accounting software including QuickBooks, Xero, and FreshBooks.

"We're eliminating the tedious work of expense tracking," said Alex Chriss, PayPal CEO. "For small business owners and freelancers, this saves hours of administrative work every month."

Smart Receipts is available immediately to all PayPal users at no additional cost, with premium features including advanced reporting and team expense management available through PayPal Business accounts.`,
    category: "Fintech",
    categorySlug: "fintech",
    author: "Robert Lee",
    publishedAt: "2024-12-23T16:00:00Z",
    readTime: 4,
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=630&fit=crop",
    tags: ["PayPal", "Fintech", "AI", "Expense Management"],
    source: "TechPulse Staff"
  },
  {
    id: "17",
    title: "Rust Programming Language Adoption Doubles in Enterprise Applications",
    slug: "rust-programming-language-enterprise-adoption",
    excerpt: "Memory-safe language sees explosive growth as major tech companies migrate critical systems from C and C++ to improve security and reliability.",
    content: `Rust programming language adoption has doubled over the past year in enterprise environments, according to a new survey from the Linux Foundation. The language is increasingly being used to build critical infrastructure, with major companies including Microsoft, Google, and Amazon deploying Rust in production systems.

The growth is driven by Rust's memory safety guarantees, which eliminate entire categories of security vulnerabilities common in C and C++ codebases. Microsoft reports that Rust has helped reduce memory safety bugs by over 70% in newly developed components.

"Rust is no longer just for systems programming enthusiasts," said Shane Miller, chair of the Rust Foundation. "It's becoming the default choice for any performance-critical code that needs to be secure."

Major projects now written in or migrating to Rust include portions of the Linux kernel, Android's system components, and critical infrastructure at AWS and Cloudflare. The language's growing ecosystem and tooling have made it increasingly accessible to developers from other backgrounds.`,
    category: "Software",
    categorySlug: "software",
    author: "Jessica Kim",
    publishedAt: "2024-12-23T11:30:00Z",
    readTime: 5,
    image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1200&h=630&fit=crop",
    tags: ["Rust", "Programming", "Enterprise", "Security"],
    source: "TechPulse Staff"
  },
  {
    id: "18",
    title: "Solana Foundation Launches $100M Developer Ecosystem Fund",
    slug: "solana-foundation-developer-fund",
    excerpt: "Blockchain platform commits significant resources to attract developers and expand application ecosystem beyond DeFi into consumer applications.",
    content: `The Solana Foundation has announced a $100 million fund dedicated to supporting developers building on the Solana blockchain. The initiative aims to accelerate ecosystem growth and diversify applications beyond decentralized finance into areas including gaming, social media, and enterprise solutions.

The fund will provide grants ranging from $10,000 to $5 million, with funding available for early-stage projects, developer tooling, and infrastructure improvements. A dedicated accelerator program will offer mentorship and resources to promising teams.

"Solana's technical capabilities are proven—now we need to support the builders creating the next generation of applications," said Lily Liu, President of the Solana Foundation. "This fund removes financial barriers for talented developers worldwide."

Initial grants have been awarded to projects including a decentralized social network, a blockchain-based ticketing platform, and several gaming studios. The foundation reports receiving over 2,000 applications in the first week, indicating strong developer interest in the platform.`,
    category: "Web3 & Crypto",
    categorySlug: "web3",
    author: "Tyler Mason",
    publishedAt: "2024-12-23T08:00:00Z",
    readTime: 4,
    image: "https://images.unsplash.com/photo-1642751227050-feb02d648136?w=1200&h=630&fit=crop",
    tags: ["Solana", "Blockchain", "Crypto", "Developer"],
    source: "TechPulse Staff"
  },
  {
    id: "19",
    title: "Meta's Ray-Ban Smart Glasses Get AI Vision, Real-Time Translation",
    slug: "meta-ray-ban-smart-glasses-ai-vision",
    excerpt: "Software update transforms popular smart glasses with multimodal AI capabilities, enabling visual recognition and instant translation across 30 languages.",
    content: `Meta has rolled out a major software update to its Ray-Ban smart glasses, adding AI-powered visual recognition and real-time language translation capabilities. The update transforms the popular device from a simple camera-equipped accessory into a powerful AI assistant.

Users can now ask the glasses to identify objects, read text, describe scenes, and provide contextual information about their surroundings. The translation feature supports 30 languages and can translate both spoken conversation and written text in real-time.

"This is the kind of AI assistant we've always imagined—one that sees what you see and helps you understand the world around you," said Mark Zuckerberg, Meta CEO. "And it looks like a normal pair of glasses."

The glasses have seen strong sales since launch, with Meta reporting over 1 million units sold. The new AI capabilities are expected to drive continued adoption as the technology proves useful in everyday situations from travel to professional contexts.`,
    category: "Gadgets",
    categorySlug: "gadgets",
    author: "Nina Patel",
    publishedAt: "2024-12-22T19:00:00Z",
    readTime: 4,
    image: "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=1200&h=630&fit=crop",
    tags: ["Meta", "Ray-Ban", "Smart Glasses", "AI"],
    source: "TechPulse Staff"
  },
  {
    id: "20",
    title: "Notion AI Writes Full Documents, Connects to External Data Sources",
    slug: "notion-ai-full-documents-external-data",
    excerpt: "Productivity platform's AI assistant now generates complete documents and can pull information from connected apps like Salesforce and Google Drive.",
    content: `Notion has announced major enhancements to its AI capabilities, enabling the system to generate complete documents from brief prompts and connect to external data sources for context-aware content creation.

The updated Notion AI can produce comprehensive project proposals, marketing plans, technical documentation, and other long-form content by understanding organizational context from connected tools. Integrations with Salesforce, Google Drive, Slack, and other enterprise applications allow the AI to incorporate relevant data and insights automatically.

"We're moving beyond simple writing assistance to a true AI collaborator that understands your business," said Ivan Zhao, Notion CEO. "The AI knows your company's style, your data, and can create documents that would have taken hours in minutes."

Enterprise customers report significant productivity gains, with some teams reducing document creation time by 80%. The features are available in Notion's AI add-on, priced at $10 per user per month.`,
    category: "Software",
    categorySlug: "software",
    author: "Amy Foster",
    publishedAt: "2024-12-22T14:30:00Z",
    readTime: 4,
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200&h=630&fit=crop",
    tags: ["Notion", "AI", "Productivity", "SaaS"],
    source: "TechPulse Staff"
  },
];

export const getFeaturedArticles = () => articles.filter(a => a.featured);
export const getTrendingArticles = () => articles.filter(a => a.trending);
export const getArticlesByCategory = (slug: string) => articles.filter(a => a.categorySlug === slug);
export const getArticleBySlug = (slug: string) => articles.find(a => a.slug === slug);
export const getRelatedArticles = (article: Article, limit: number = 4) => 
  articles.filter(a => a.categorySlug === article.categorySlug && a.id !== article.id).slice(0, limit);
