import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  return (
    <Layout>
      <SEOHead
        title="Privacy Policy"
        description="TechPulse Privacy Policy. Learn how we collect, use, and protect your personal information when you visit our website."
        canonical="/privacy"
      />

      <div className="container py-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Privacy Policy</span>
        </nav>

        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 28, 2024</p>

          <div className="prose prose-lg prose-invert max-w-none space-y-8">
            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Introduction</h2>
              <p className="text-foreground/90">
                TechPulse ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website techpulse.com and use our services.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Information We Collect</h2>
              <h3 className="font-display text-xl font-semibold mb-2 text-foreground">Information You Provide</h3>
              <ul className="list-disc pl-6 text-foreground/90 space-y-2">
                <li>Contact information (name, email address) when you subscribe to our newsletter</li>
                <li>Account information when you create an account</li>
                <li>Comments and content you post on our articles</li>
                <li>Communications you send to us</li>
              </ul>
              
              <h3 className="font-display text-xl font-semibold mb-2 mt-4 text-foreground">Information Collected Automatically</h3>
              <ul className="list-disc pl-6 text-foreground/90 space-y-2">
                <li>Device information (browser type, operating system, device type)</li>
                <li>Log data (IP address, access times, pages viewed)</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Usage information (how you interact with our content)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-foreground/90 space-y-2">
                <li>To provide and maintain our services</li>
                <li>To send you newsletters and updates you've subscribed to</li>
                <li>To respond to your comments, questions, and requests</li>
                <li>To analyze usage patterns and improve our content</li>
                <li>To display personalized advertising</li>
                <li>To detect and prevent fraud and abuse</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Advertising</h2>
              <p className="text-foreground/90">
                We use third-party advertising companies, including Google AdSense, to serve ads when you visit our website. These companies may use cookies and similar technologies to collect information about your visits to this and other websites to provide relevant advertisements. You can opt out of personalized advertising by visiting Google's Ads Settings.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Cookies</h2>
              <p className="text-foreground/90">
                We use cookies and similar tracking technologies to collect and track information and to improve our services. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service. For more information, please see our <Link to="/cookies" className="text-primary hover:text-primary/80">Cookie Policy</Link>.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Data Sharing</h2>
              <p className="text-foreground/90 mb-4">We may share your information with:</p>
              <ul className="list-disc pl-6 text-foreground/90 space-y-2">
                <li>Service providers who assist in our operations</li>
                <li>Advertising partners for targeted advertising</li>
                <li>Analytics providers to help us understand usage</li>
                <li>Law enforcement when required by law</li>
              </ul>
              <p className="text-foreground/90 mt-4">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Your Rights</h2>
              <p className="text-foreground/90 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-foreground/90 space-y-2">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt out of marketing communications</li>
                <li>Object to processing of your information</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Data Security</h2>
              <p className="text-foreground/90">
                We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Children's Privacy</h2>
              <p className="text-foreground/90">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Changes to This Policy</h2>
              <p className="text-foreground/90">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Contact Us</h2>
              <p className="text-foreground/90">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-foreground/90 mt-2">
                Email: <a href="mailto:privacy@techpulse.com" className="text-primary hover:text-primary/80">privacy@techpulse.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
