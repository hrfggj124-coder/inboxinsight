import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const Contact = () => {
  return (
    <Layout>
      <SEOHead
        title="Contact Us"
        description="Get in touch with the TechPulse team. Contact us for press inquiries, partnerships, advertising, or general questions."
        canonical="/contact"
      />

      <div className="container py-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Contact</span>
        </nav>

        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Have a question, tip, or feedback? We'd love to hear from you.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="p-6 bg-card rounded-xl border border-border text-center">
              <Mail className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-display font-bold mb-2">Email</h3>
              <a href="mailto:contact@techpulse.com" className="text-muted-foreground hover:text-primary transition-colors">
                contact@techpulse.com
              </a>
            </div>
            <div className="p-6 bg-card rounded-xl border border-border text-center">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-display font-bold mb-2">Location</h3>
              <p className="text-muted-foreground">
                San Francisco, CA
              </p>
            </div>
            <div className="p-6 bg-card rounded-xl border border-border text-center">
              <Phone className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-display font-bold mb-2">Phone</h3>
              <p className="text-muted-foreground">
                +1 (555) 123-4567
              </p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-8">
            <h2 className="font-display text-2xl font-bold mb-6">Send us a message</h2>
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    id="name"
                    className="w-full bg-muted rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="w-full bg-muted rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">Subject</label>
                <select
                  id="subject"
                  className="w-full bg-muted rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a topic</option>
                  <option value="general">General Inquiry</option>
                  <option value="press">Press & Media</option>
                  <option value="advertising">Advertising</option>
                  <option value="partnerships">Partnerships</option>
                  <option value="tip">Submit a News Tip</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  id="message"
                  rows={6}
                  className="w-full bg-muted rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Your message..."
                />
              </div>
              <Button className="w-full md:w-auto gap-2">
                <Send className="h-4 w-4" /> Send Message
              </Button>
            </form>
          </div>

          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-display font-bold text-lg mb-4">Press Inquiries</h3>
              <p className="text-muted-foreground text-sm mb-2">
                For press and media inquiries, please contact:
              </p>
              <a href="mailto:press@techpulse.com" className="text-primary hover:text-primary/80 transition-colors">
                press@techpulse.com
              </a>
            </div>
            <div>
              <h3 className="font-display font-bold text-lg mb-4">Advertising</h3>
              <p className="text-muted-foreground text-sm mb-2">
                For advertising and sponsorship opportunities:
              </p>
              <a href="mailto:ads@techpulse.com" className="text-primary hover:text-primary/80 transition-colors">
                ads@techpulse.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
