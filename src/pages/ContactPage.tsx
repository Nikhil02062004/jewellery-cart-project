import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ContactPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('contact_inquiries').insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        subject: formData.subject,
        message: formData.message,
      });

      if (error) throw error;

      toast({
        title: "Message Sent!",
        description: "We'll get back to you as soon as possible.",
      });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[30vh] flex items-center justify-center bg-charcoal">
        <div className="relative z-10 text-center">
          <p className="font-body text-gold tracking-[0.3em] uppercase text-sm mb-4">Get in Touch</p>
          <h1 className="font-display text-5xl md:text-6xl text-primary-foreground">Contact Us</h1>
        </div>
      </section>

      {/* Contact Info + Form */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Info */}
            <div>
              <h2 className="font-display text-3xl mb-8">We'd Love to Hear From You</h2>
              <p className="font-accent text-muted-foreground mb-12">
                Have a question about our jewelry? Need help with an order? Or simply want to say hello? 
                Reach out to us and we'll get back to you as soon as possible.
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg mb-1">Visit Our Store</h3>
                    <p className="font-body text-muted-foreground text-sm">
                      Mahaveer Jewellers, Near Power House, Ganesh Mandir, Sardarshahar, Churu,Rajasthan - 331403
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg mb-1">Call Us</h3>
                    <a href="tel:+916377365363" className="font-body text-muted-foreground text-sm hover:text-gold transition-colors">
                      + 91 63773-65363
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg mb-1">Email Us</h3>
                    <a href="mailto:ndhalla78gmail.com" className="font-body text-muted-foreground text-sm hover:text-gold transition-colors">
                      ndhalla78gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg mb-1">Store Hours</h3>
                    <p className="font-body text-muted-foreground text-sm">
                      Mon - Sat: 10:00 AM - 8:00 PM<br />
                      Sunday: 11:00 AM - 6:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-card p-8 md:p-12 rounded-lg">
              <h2 className="font-display text-2xl mb-6">Send a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-2 block">Your Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-2 block">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-2 block">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="font-body text-sm text-muted-foreground mb-2 block">Subject</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-body text-sm text-muted-foreground mb-2 block">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={5}
                    className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body focus:outline-none focus:border-gold resize-none"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  <Send className="w-4 h-4" />
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="h-[400px] bg-muted">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.9663095919374!2d-74.00425878428697!3d40.74076794379132!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259bf5c1654f3%3A0xc80f9cfce5383d5d!2sGoogle!5e0!3m2!1sen!2sus!4v1645564756836!5m2!1sen!2sus"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>
    </Layout>
  );
};

export default ContactPage;
