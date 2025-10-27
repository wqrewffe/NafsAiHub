import React, { useState } from 'react';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, ClockIcon, ChatBubbleLeftRightIcon, ExclamationTriangleIcon } from '../tools/Icons';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
}

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'billing', label: 'Billing & Account' },
    { value: 'partnership', label: 'Partnership & Business' },
    { value: 'feedback', label: 'Feedback & Suggestions' },
    { value: 'bug-report', label: 'Bug Report' },
    { value: 'feature-request', label: 'Feature Request' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically send the form data to your backend
      console.log('Form submitted:', formData);
      
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'general'
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <EnvelopeIcon className="h-6 w-6" />,
      title: 'Email Support',
      details: ['support@nafsaihub.com', 'business@nafsaihub.com'],
      description: 'Get help with technical issues, account questions, or general inquiries.'
    },
    {
      icon: <PhoneIcon className="h-6 w-6" />,
      title: 'Phone Support',
      details: ['+1 (555) 123-4567', 'Mon-Fri: 9AM-6PM EST'],
      description: 'Speak directly with our support team during business hours.'
    },
    {
      icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />,
      title: 'Live Chat',
      details: ['Available 24/7', 'Instant response'],
      description: 'Chat with our AI-powered support system anytime, day or night.'
    },
    {
      icon: <MapPinIcon className="h-6 w-6" />,
      title: 'Office Location',
      details: ['123 AI Innovation Drive', 'Tech City, TC 12345'],
      description: 'Visit our headquarters for in-person meetings and support.'
    }
  ];

  const businessHours = [
    { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM EST' },
    { day: 'Saturday', hours: '10:00 AM - 4:00 PM EST' },
    { day: 'Sunday', hours: 'Closed' },
    { day: 'Holidays', hours: 'Closed (see calendar)' }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-light mb-4">Contact Us</h1>
        <p className="text-light text-lg opacity-90">
          Get in touch with our team. We're here to help and answer your questions.
        </p>
        <div className="mt-4">
          {/* <button
            onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-accent hover:bg-accent/80 text-light font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Send Message
          </button> */}
        </div>
      </div>

      <div className="mb-12">
        {/* Contact Form */}
        <div id="contact-form" className="bg-secondary/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-light mb-6">Send us a Message</h2>
          
          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-accent/20 border border-accent/50 rounded-lg">
              <p className="text-light text-center">
                Thank you! Your message has been sent successfully. We'll get back to you soon.
              </p>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-accent/20 border border-accent/50 rounded-lg">
              <div className="flex items-center gap-2 text-accent">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <p className="text-light">There was an error sending your message. Please try again or contact us directly.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-light mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-primary border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent text-slate-200"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-light mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-primary border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent text-slate-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-light mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-primary border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent text-slate-200"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-light mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-primary border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent text-slate-200"
                placeholder="Brief description of your inquiry"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-light mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={5}
                className="w-full px-3 py-2 bg-primary border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent text-slate-200"
                placeholder="Please provide details about your inquiry..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/80 disabled:bg-primary/50 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </button>
          </form>
        </div>

        {/* Contact Information removed per request */}
      </div>

      {/* Additional Contact Methods */}
      <div className="bg-secondary/20 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-light mb-6 text-center">Other Ways to Connect</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-light mb-2">Follow Us</h3>
            <p className="text-light text-sm mb-3 opacity-90">Stay updated with our latest news and announcements</p>
            <a 
              href="https://twitter.com/nafsaihub" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Follow on Twitter
            </a>
          </div>

          <div className="text-center">
            <div className="bg-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.047-1.852-3.047-1.853 0-2.136 1.445-2.136 2.939v5.677H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-light mb-2">Connect on LinkedIn</h3>
            <p className="text-light text-sm mb-3 opacity-90">Network with our team and community</p>
            <a 
              href="https://linkedin.com/company/nafsaihub" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Connect on LinkedIn
            </a>
          </div>

          <div className="text-center">
            <div className="bg-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-light mb-2">Join Our Discord</h3>
            <p className="text-light text-sm mb-3 opacity-90">Connect with our community and get real-time help</p>
            <a 
              href="https://discord.gg/nafsaihub" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Join Discord
            </a>
          </div>
        </div>
      </div>

      {/* Response Time Information */}
      <div className="text-center p-6 bg-secondary/20 rounded-lg">
        <h3 className="text-xl font-semibold text-light mb-3">Response Times</h3>
        <div className="grid md:grid-cols-3 gap-6 text-sm text-light opacity-90">
          <div>
            <p className="font-medium">General Inquiries</p>
            <p className="opacity-70">Within 24-48 hours</p>
          </div>
          <div>
            <p className="font-medium">Technical Support</p>
            <p className="opacity-70">Within 4-8 hours</p>
          </div>
          <div>
            <p className="font-medium">Urgent Issues</p>
            <p className="opacity-70">Immediate response</p>
          </div>
        </div>
        <p className="text-light text-xs opacity-70 mt-4">
          * Response times may vary during peak periods and holidays
        </p>
      </div>
    </div>
  );
};

export default ContactPage;
