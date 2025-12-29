import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  return (
    <Layout>
      <SEOHead
        title="Terms of Service"
        description="TechPulse Terms of Service. Read our terms and conditions for using the TechPulse website and services."
        canonical="/terms"
      />

      <div className="container py-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Terms of Service</span>
        </nav>

        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 28, 2024</p>

          <div className="prose prose-lg prose-invert max-w-none space-y-8">
            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Agreement to Terms</h2>
              <p className="text-foreground/90">
                By accessing or using TechPulse (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Use of Service</h2>
              <p className="text-foreground/90 mb-4">You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
              <ul className="list-disc pl-6 text-foreground/90 space-y-2">
                <li>Use the Service in any way that violates any applicable law or regulation</li>
                <li>Engage in any conduct that restricts or inhibits anyone's use of the Service</li>
                <li>Impersonate any person or entity</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Use any robot, spider, or other automatic device to access the Service</li>
                <li>Introduce any viruses, malware, or other harmful material</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">User Accounts</h2>
              <p className="text-foreground/90">
                When you create an account with us, you must provide accurate and complete information. You are responsible for safeguarding your account credentials and for any activities or actions under your account. You must notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">User Content</h2>
              <p className="text-foreground/90 mb-4">
                Our Service may allow you to post, submit, or transmit content such as comments. You retain ownership of your content, but by posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, and display such content.
              </p>
              <p className="text-foreground/90">
                You are solely responsible for your content and agree not to post content that is illegal, defamatory, obscene, harassing, or that infringes on intellectual property rights.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Intellectual Property</h2>
              <p className="text-foreground/90">
                The Service and its original content (excluding user content), features, and functionality are owned by TechPulse and are protected by international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works from any content on the Service without our prior written consent.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Third-Party Links</h2>
              <p className="text-foreground/90">
                Our Service may contain links to third-party websites or services. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Disclaimer</h2>
              <p className="text-foreground/90">
                The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind. We do not warrant that the Service will be uninterrupted, secure, or error-free. We make no warranties about the accuracy or reliability of any content on the Service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Limitation of Liability</h2>
              <p className="text-foreground/90">
                To the maximum extent permitted by law, TechPulse shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of your access to or use of the Service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Indemnification</h2>
              <p className="text-foreground/90">
                You agree to indemnify and hold harmless TechPulse and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising out of your use of the Service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Termination</h2>
              <p className="text-foreground/90">
                We may terminate or suspend your access to the Service immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Governing Law</h2>
              <p className="text-foreground/90">
                These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions. Any disputes shall be resolved in the courts of San Francisco, California.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Changes to Terms</h2>
              <p className="text-foreground/90">
                We reserve the right to modify these Terms at any time. We will provide notice of significant changes by posting the new Terms on this page. Your continued use of the Service after any changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Contact Us</h2>
              <p className="text-foreground/90">
                If you have questions about these Terms, please contact us at:
              </p>
              <p className="text-foreground/90 mt-2">
                Email: <a href="mailto:legal@techpulse.com" className="text-primary hover:text-primary/80">legal@techpulse.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Terms;
