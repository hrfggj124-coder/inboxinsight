import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Cookies = () => {
  return (
    <Layout>
      <SEOHead
        title="Cookie Policy"
        description="TechPulse Cookie Policy. Learn about how we use cookies and similar technologies on our website."
        canonical="/cookies"
      />

      <div className="container py-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Cookie Policy</span>
        </nav>

        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 28, 2024</p>

          <div className="prose prose-lg prose-invert max-w-none space-y-8">
            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">What Are Cookies</h2>
              <p className="text-foreground/90">
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the owners of the site.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">How We Use Cookies</h2>
              <p className="text-foreground/90">TechPulse uses cookies for the following purposes:</p>
              <ul className="list-disc pl-6 text-foreground/90 space-y-2 mt-4">
                <li><strong>Essential Cookies:</strong> Required for the website to function properly, such as remembering your preferences and login status.</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website by collecting information anonymously.</li>
                <li><strong>Advertising Cookies:</strong> Used to deliver relevant advertisements and track the performance of ad campaigns.</li>
                <li><strong>Social Media Cookies:</strong> Enable sharing of content on social media platforms.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Types of Cookies We Use</h2>
              
              <h3 className="font-display text-xl font-semibold mb-2 text-foreground">Strictly Necessary Cookies</h3>
              <p className="text-foreground/90 mb-4">
                These cookies are essential for you to browse the website and use its features. Without these cookies, services you have asked for cannot be provided.
              </p>

              <h3 className="font-display text-xl font-semibold mb-2 text-foreground">Performance Cookies</h3>
              <p className="text-foreground/90 mb-4">
                These cookies collect information about how visitors use our website, such as which pages are visited most often. We use Google Analytics to analyze website traffic. The information collected is aggregated and anonymous.
              </p>

              <h3 className="font-display text-xl font-semibold mb-2 text-foreground">Functionality Cookies</h3>
              <p className="text-foreground/90 mb-4">
                These cookies allow the website to remember choices you make (such as your language preference) and provide enhanced, more personal features.
              </p>

              <h3 className="font-display text-xl font-semibold mb-2 text-foreground">Targeting/Advertising Cookies</h3>
              <p className="text-foreground/90">
                These cookies are used to deliver advertisements more relevant to you and your interests. They are also used to limit the number of times you see an advertisement and help measure the effectiveness of advertising campaigns.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Third-Party Cookies</h2>
              <p className="text-foreground/90 mb-4">We use the following third-party services that may set cookies:</p>
              <ul className="list-disc pl-6 text-foreground/90 space-y-2">
                <li><strong>Google Analytics:</strong> For website analytics and performance monitoring</li>
                <li><strong>Google AdSense:</strong> For displaying relevant advertisements</li>
                <li><strong>Social Media Platforms:</strong> Facebook, Twitter, LinkedIn for social sharing features</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Managing Cookies</h2>
              <p className="text-foreground/90 mb-4">
                You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed. However, if you do this, you may have to manually adjust some preferences every time you visit a site.
              </p>
              <p className="text-foreground/90">
                To manage cookies in your browser, please refer to your browser's help documentation:
              </p>
              <ul className="list-disc pl-6 text-foreground/90 space-y-2 mt-4">
                <li><a href="https://support.google.com/chrome/answer/95647" className="text-primary hover:text-primary/80">Google Chrome</a></li>
                <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" className="text-primary hover:text-primary/80">Mozilla Firefox</a></li>
                <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" className="text-primary hover:text-primary/80">Safari</a></li>
                <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-primary hover:text-primary/80">Microsoft Edge</a></li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Opt-Out of Interest-Based Advertising</h2>
              <p className="text-foreground/90">
                You can opt out of interest-based advertising by visiting:
              </p>
              <ul className="list-disc pl-6 text-foreground/90 space-y-2 mt-4">
                <li><a href="https://adssettings.google.com" className="text-primary hover:text-primary/80">Google Ads Settings</a></li>
                <li><a href="https://optout.networkadvertising.org" className="text-primary hover:text-primary/80">Network Advertising Initiative</a></li>
                <li><a href="https://www.aboutads.info/choices" className="text-primary hover:text-primary/80">Digital Advertising Alliance</a></li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Updates to This Policy</h2>
              <p className="text-foreground/90">
                We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new policy on this page with an updated "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">Contact Us</h2>
              <p className="text-foreground/90">
                If you have questions about our use of cookies, please contact us at:
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

export default Cookies;
