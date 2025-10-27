import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuestionMarkCircleIcon, EnvelopeIcon, ChatBubbleLeftRightIcon, BookOpenIcon, ExclamationTriangleIcon, LightBulbIcon } from '../tools/Icons';
import { useSettings } from '../hooks/useSettings';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const SupportPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const { authSettings } = useSettings();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const navigate = useNavigate();
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'support'; text: string }>>([
    { sender: 'support', text: 'Hi! How can we help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const faqData: FAQItem[] = [
    // General Questions
    {
      question: "What is Naf's AI Hub?",
      answer: "Naf's AI Hub is a comprehensive platform that provides access to various AI-powered tools and services. It offers tools for content creation, analysis, learning, and productivity, all powered by advanced artificial intelligence technology.",
      category: "general"
    },
    {
      question: "How do I create an account?",
      answer: "To create an account, click the 'Sign Up' button on the homepage. You'll need to provide your email address, create a password, and verify your email. Once verified, you can start using all the AI tools available on the platform.",
      category: "general"
    },
    {
      question: "Is Naf's AI Hub free to use?",
      answer: "Yes, Naf's AI Hub offers a free tier with access to basic AI tools. We also offer premium features and higher usage limits for users who need more advanced capabilities. Check our pricing page for detailed information.",
      category: "general"
    },
    {
      question: "What browsers are supported?",
      answer: "Naf's AI Hub works best with modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for the best experience.",
      category: "general"
    },

    // AI Tools
    {
      question: "How do AI tools work?",
      answer: "Our AI tools use advanced machine learning models to process your inputs and generate relevant outputs. Simply enter your request or question, and the AI will analyze it to provide helpful responses, creative content, or analytical insights.",
      category: "ai-tools"
    },
    {
      question: "Are AI-generated results accurate?",
      answer: "While our AI tools are highly advanced, they may occasionally produce inaccurate or incomplete information. We recommend verifying important information from multiple sources, especially for critical decisions or academic work.",
      category: "ai-tools"
    },
    {
      question: "Can I use AI-generated content commercially?",
      answer: "The commercial use of AI-generated content depends on the specific tool and your use case. Please review our Terms of Service and AI Ethics guidelines. We recommend adding human oversight and verification to any commercial content.",
      category: "ai-tools"
    },
    {
      question: "How do I get the best results from AI tools?",
      answer: "To get the best results, be specific and clear in your prompts, provide relevant context, and use the advanced settings when available. Experiment with different phrasings and review the results to refine your approach.",
      category: "ai-tools"
    },

    // Account & Billing
    {
      question: "How do I reset my password?",
      answer: "If you've forgotten your password, click the 'Forgot Password' link on the login page. Enter your email address, and we'll send you a link to reset your password. Make sure to check your spam folder if you don't see the email.",
      category: "account"
    },
    {
      question: "Can I change my email address?",
      answer: "Yes, you can change your email address in your account settings. You'll need to verify the new email address before the change takes effect. This helps us maintain the security of your account.",
      category: "account"
    },
    {
      question: "How do I delete my account?",
      answer: "To delete your account, go to your account settings and look for the 'Delete Account' option. Please note that this action is irreversible and will permanently remove all your data and content.",
      category: "account"
    },
    {
      question: "What happens to my data if I cancel my subscription?",
      answer: "If you cancel your subscription, you'll continue to have access to your account and data until the end of your current billing period. After that, you'll be moved to the free tier with limited access to features.",
      category: "account"
    },

    // Referral Program
    {
      question: "How does the referral program work?",
      answer: "Our referral program rewards you for bringing new users to the platform. When someone signs up using your referral link, both you and the new user receive points. You can earn additional rewards by reaching referral milestones.",
      category: "referral"
    },
    {
      question: "How many people can I refer?",
      answer: "There's no limit to the number of people you can refer! However, all referrals must be genuine users who create real accounts and engage with the platform. We monitor for fraudulent activity to maintain program integrity.",
      category: "referral"
    },
    {
      question: "When do I receive my referral rewards?",
      answer: "Referral rewards are typically credited within 24-48 hours after the referred user completes their account verification and shows genuine activity on the platform. This helps us ensure all referrals are legitimate.",
      category: "referral"
    },
    {
      question: "Can I refer family members?",
      answer: "Yes, you can refer family members as long as they are separate individuals with their own email addresses and devices. Each person should have their own legitimate account and usage patterns.",
      category: "referral"
    },

    // Technical Issues
    {
      question: "The page is loading slowly. What should I do?",
      answer: "Slow loading can be caused by several factors. Try refreshing the page, clearing your browser cache, or checking your internet connection. If the problem persists, it might be due to high server load - try again in a few minutes.",
      category: "technical"
    },
    {
      question: "I'm getting an error message. What does it mean?",
      answer: "Error messages help identify what went wrong. Common errors include network issues, invalid inputs, or service temporarily unavailable. Check the error details and try again. If the problem continues, contact our support team.",
      category: "technical"
    },
    {
      question: "Can I use Naf's AI Hub on mobile devices?",
      answer: "Yes! Naf's AI Hub is fully responsive and works on mobile devices. You can access all features through your mobile browser. For the best experience, we recommend using the latest version of your mobile browser.",
      category: "technical"
    },
    {
      question: "Do you have a mobile app?",
      answer: "Currently, we offer a web-based platform that works on all devices. We're working on developing native mobile apps for iOS and Android. In the meantime, you can add our website to your home screen for app-like access.",
      category: "technical"
    }
  ];

  const categories = [
    { id: 'general', name: 'General', icon: <QuestionMarkCircleIcon className="h-5 w-5" /> },
    { id: 'ai-tools', name: 'AI Tools', icon: <LightBulbIcon className="h-5 w-5" /> },
    { id: 'referral', name: 'Referral Program', icon: <ChatBubbleLeftRightIcon className="h-5 w-5" /> },
    { id: 'technical', name: 'Technical Issues', icon: <ExclamationTriangleIcon className="h-5 w-5" /> }
  ];

  const filteredFAQs = faqData.filter(faq => faq.category !== 'account' && faq.category === activeCategory);

  const toggleFAQ = (question: string) => {
    setExpandedFAQ(expandedFAQ === question ? null : question);
  };

  const handleSendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages(prev => [...prev, { sender: 'user', text }]);
    setChatInput('');
    // Demo auto-reply
    setTimeout(() => {
      setChatMessages(prev => [...prev, { sender: 'support', text: 'Thanks! A support specialist will be with you shortly.' }]);
    }, 600);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-light mb-4">Support & Help Center</h1>
        <p className="text-light text-lg opacity-90">
          Find answers to common questions and get the help you need
        </p>
      </div>

      {/* Quick Contact Section */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-secondary/30 p-6 rounded-lg text-center">
          <EnvelopeIcon className="h-12 w-12 text-accent mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-light mb-2">Email Support</h3>
          <p className="text-light mb-3 opacity-90">Get help via email</p>
          <a 
            href="mailto:nafsaihub@gmail.com" 
            className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Contact Us
          </a>
        </div>

        <div className="bg-secondary/30 p-6 rounded-lg text-center">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-accent mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-light mb-2">Live Chat</h3>
          <p className="text-light mb-3 opacity-90">Chat with our support team</p>
          <button
            onClick={() => navigate('/helpchat')}
            className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Start Chat
          </button>
        </div>

        <div className="bg-secondary/30 p-6 rounded-lg text-center">
          <BookOpenIcon className="h-12 w-12 text-accent mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-light mb-2">Documentation</h3>
          <p className="text-light mb-3 opacity-90">Browse our guides and tutorials</p>
          <a 
            href="#/policies" 
            className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
          >
            View Docs
          </a>
        </div>
      </div>

      {false && (
        <div className="bg-secondary/20 rounded-lg p-6 mb-8" />
      )}

      {/* FAQ Section */}
      <div className="bg-secondary/20 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-light mb-6 text-center">Frequently Asked Questions</h2>
        
        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeCategory === category.id
                  ? 'bg-primary text-white'
                  : 'bg-secondary/30 text-light hover:bg-secondary/50 hover:text-light'
              }`}
            >
              {category.icon}
              {category.name}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((faq, index) => (
            <div key={index} className="bg-secondary/30 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleFAQ(faq.question)}
                className="w-full text-left p-4 hover:bg-secondary/50 transition-colors flex justify-between items-center"
              >
                <span className="font-medium text-light">{faq.question}</span>
                <svg
                  className={`h-5 w-5 text-slate-400 transition-transform ${
                    expandedFAQ === faq.question ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedFAQ === faq.question && (
                <div className="px-4 pb-4">
                  <p className="text-light opacity-90">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Additional Help Resources */}
      {!authSettings.featureFlags?.hideSupportAdditionalResources && (
      <div className="bg-secondary/20 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-light mb-6 text-center">Additional Resources</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-3">Getting Started Guide</h3>
            <p className="text-light mb-4 opacity-90">
              New to Naf's AI Hub? Learn the basics and discover how to make the most of our AI tools.
            </p>
            <button className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors">
              Read Guide
            </button>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-3">Video Tutorials</h3>
            <p className="text-light mb-4 opacity-90">
              Watch step-by-step tutorials to learn how to use specific features and tools.
            </p>
            <button className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors">
              Watch Videos
            </button>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-3">Community Forum</h3>
            <p className="text-light mb-4 opacity-90">
              Connect with other users, share tips, and get help from the community.
            </p>
            <button className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors">
              Join Forum
            </button>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-3">Feature Requests</h3>
            <p className="text-light mb-4 opacity-90">
              Have an idea for a new feature? Submit your suggestions and vote on others.
            </p>
            <button className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors">
              Submit Request
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Contact Information */}
      <div className="text-center mt-8 p-6 bg-secondary/20 rounded-lg">
        <h3 className="text-xl font-semibold text-light mb-3">Still Need Help?</h3>
        <p className="text-light mb-4 opacity-90">
          Can't find what you're looking for? Our support team is here to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="mailto:nafsaihub@gmail.com"
            className="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <EnvelopeIcon className="h-5 w-5" />
            Email Support
          </a>
          <button
            onClick={() => navigate('/helpchat')}
            className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Start Chat
          </button>

          
        </div>
        <p className="text-light text-sm opacity-70 mt-4">
          Response time: Usually within 24 hours for email, immediate for live chat
        </p>
      </div>
    </div>
  );
};

export default SupportPage;
