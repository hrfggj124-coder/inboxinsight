import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, Globe, Award, Target } from "lucide-react";

const About = () => {
  return (
    <Layout>
      <SEOHead
        title="About TechPulse"
        description="TechPulse is your trusted source for the latest technology news, analysis, and insights. Learn about our mission, team, and commitment to quality tech journalism."
        canonical="/about"
      />

      <div className="container py-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <span>/</span>
          <span className="text-foreground">About</span>
        </nav>

        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">About TechPulse</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Your trusted source for breaking technology news, in-depth analysis, and expert insights from Silicon Valley and beyond.
          </p>

          <div className="prose prose-lg prose-invert max-w-none">
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Our Mission</h2>
            <p className="text-foreground/90 mb-8">
              At TechPulse, we believe that technology shapes the future of humanity. Our mission is to deliver accurate, insightful, and timely coverage of the tech industry, helping our readers stay informed about the innovations and developments that will impact their lives, businesses, and the world.
            </p>

            <div className="grid md:grid-cols-2 gap-6 my-12">
              <div className="p-6 bg-card rounded-xl border border-border">
                <Users className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-display font-bold text-lg mb-2">Expert Team</h3>
                <p className="text-muted-foreground text-sm">
                  Our journalists and analysts bring decades of combined experience covering technology, finance, and innovation.
                </p>
              </div>
              <div className="p-6 bg-card rounded-xl border border-border">
                <Globe className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-display font-bold text-lg mb-2">Global Reach</h3>
                <p className="text-muted-foreground text-sm">
                  We cover technology developments from Silicon Valley to Shanghai, bringing you a truly global perspective.
                </p>
              </div>
              <div className="p-6 bg-card rounded-xl border border-border">
                <Award className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-display font-bold text-lg mb-2">Editorial Excellence</h3>
                <p className="text-muted-foreground text-sm">
                  Every article meets our rigorous standards for accuracy, balance, and journalistic integrity.
                </p>
              </div>
              <div className="p-6 bg-card rounded-xl border border-border">
                <Target className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-display font-bold text-lg mb-2">Reader-Focused</h3>
                <p className="text-muted-foreground text-sm">
                  We prioritize content that matters to our readers, from breaking news to deep-dive analysis.
                </p>
              </div>
            </div>

            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">What We Cover</h2>
            <p className="text-foreground/90 mb-4">
              TechPulse provides comprehensive coverage across all major technology sectors:
            </p>
            <ul className="list-disc pl-6 text-foreground/90 mb-8 space-y-2">
              <li>Artificial Intelligence and Machine Learning</li>
              <li>Software Development and Programming</li>
              <li>Startups, Venture Capital, and Entrepreneurship</li>
              <li>Cybersecurity and Data Privacy</li>
              <li>Cloud Computing and Infrastructure</li>
              <li>Consumer Electronics and Gadgets</li>
              <li>Web3, Blockchain, and Cryptocurrency</li>
              <li>Fintech and Digital Finance</li>
              <li>Tech Policy and Regulation</li>
            </ul>

            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Our Commitment</h2>
            <p className="text-foreground/90 mb-8">
              We are committed to providing free, accessible technology news to readers worldwide. Our editorial team maintains complete independence, and we clearly distinguish between news content and sponsored material. We believe in transparency, accuracy, and serving the public interest.
            </p>

            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <h3 className="font-display font-bold text-xl mb-2">Join Our Community</h3>
              <p className="text-muted-foreground mb-4">
                Subscribe to our newsletter for daily tech news and insights delivered to your inbox.
              </p>
              <div className="flex max-w-md mx-auto gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-muted rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
