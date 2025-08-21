import React, { useState } from 'react';
import { ShieldCheckIcon, UserGroupIcon, LockClosedIcon, ExclamationTriangleIcon, DocumentTextIcon, ScaleIcon } from '../tools/Icons';

interface PolicySection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const PoliciesPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('terms');

  const policySections: PolicySection[] = [
    {
      id: 'terms',
      title: 'Terms of Service',
      icon: <DocumentTextIcon className="h-6 w-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">1. Acceptance of Terms</h3>
            <p className="text-light mb-3">
              By accessing and using Naf's AI Hub, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
            <p className="text-light mb-3">
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">2. Use License</h3>
            <p className="text-light mb-3">
              Permission is granted to temporarily download one copy of the materials (information or software) on Naf's AI Hub for personal, non-commercial transitory viewing only.
            </p>
            <p className="text-light mb-3">
              This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on Naf's AI Hub</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">3. User Responsibilities</h3>
            <p className="text-light mb-3">
              Users are responsible for:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Maintaining the confidentiality of their account information</li>
              <li>All activities that occur under their account</li>
              <li>Ensuring their use of the service complies with applicable laws</li>
              <li>Not sharing their account credentials with others</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">4. Prohibited Uses</h3>
            <p className="text-light mb-3">
              Users may not use the service to:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Generate harmful, illegal, or inappropriate content</li>
              <li>Violate intellectual property rights</li>
              <li>Harass, abuse, or harm others</li>
              <li>Attempt to gain unauthorized access to the system</li>
              <li>Use automated tools to abuse the service</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">5. Termination</h3>
            <p className="text-light mb-3">
              We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: <LockClosedIcon className="h-6 w-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">1. Information We Collect</h3>
            <p className="text-light mb-3">
              We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
            </p>
            <p className="text-light mb-3">
              This may include:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Account information (email, display name)</li>
              <li>Usage data and tool interactions</li>
              <li>Referral information and rewards</li>
              <li>Communication preferences</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">2. How We Use Your Information</h3>
            <p className="text-light mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze trends and usage</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">3. Information Sharing</h3>
            <p className="text-light mb-3">
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
            </p>
            <p className="text-light mb-3">
              We may share information in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who assist in our operations</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">4. Data Security</h3>
            <p className="text-light mb-3">
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
            <p className="text-light mb-3">
              However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">5. Your Rights</h3>
            <p className="text-light mb-3">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt out of certain communications</li>
              <li>Export your data</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'community',
      title: 'Community Guidelines',
      icon: <UserGroupIcon className="h-6 w-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">1. Be Respectful</h3>
            <p className="text-light mb-3">
              Treat all users with respect and dignity. We welcome diverse perspectives and encourage constructive dialogue.
            </p>
            <p className="text-light mb-3">
              Do not engage in:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Harassment or bullying</li>
              <li>Discriminatory language or behavior</li>
              <li>Personal attacks or threats</li>
              <li>Intentionally inflammatory content</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">2. Content Standards</h3>
            <p className="text-light mb-3">
              All content generated or shared must be:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Appropriate for all audiences</li>
              <li>Free from harmful or illegal content</li>
              <li>Respectful of intellectual property rights</li>
              <li>Accurate and truthful</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">3. AI Usage Guidelines</h3>
            <p className="text-light mb-3">
              When using AI tools:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Use AI responsibly and ethically</li>
              <li>Verify AI-generated content when accuracy is critical</li>
              <li>Do not use AI to generate harmful or misleading content</li>
              <li>Respect AI usage limits and fair use policies</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">4. Reporting Violations</h3>
            <p className="text-light mb-3">
              If you encounter content that violates these guidelines:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Use the report function when available</li>
              <li>Contact support with specific details</li>
              <li>Do not engage with or amplify problematic content</li>
              <li>Provide context and evidence when reporting</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">5. Consequences</h3>
            <p className="text-light mb-3">
              Violations of these guidelines may result in:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Content removal</li>
              <li>Temporary account suspension</li>
              <li>Permanent account termination</li>
              <li>Reporting to relevant authorities if necessary</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'ai-ethics',
      title: 'AI Ethics & Safety',
      icon: <ShieldCheckIcon className="h-6 w-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">1. Responsible AI Use</h3>
            <p className="text-light mb-3">
              We are committed to promoting responsible and ethical use of AI technology. Users must:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Use AI tools for constructive purposes</li>
              <li>Consider the potential impact of AI-generated content</li>
              <li>Not use AI to deceive or mislead others</li>
              <li>Respect intellectual property and copyright laws</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">2. Content Verification</h3>
            <p className="text-light mb-3">
              AI-generated content should be:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Fact-checked when accuracy is critical</li>
              <li>Clearly labeled as AI-generated when appropriate</li>
              <li>Used as a starting point, not a final product</li>
              <li>Reviewed for bias and fairness</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">3. Prohibited AI Uses</h3>
            <p className="text-light mb-3">
              AI tools may not be used to:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Generate harmful or dangerous content</li>
              <li>Create deepfakes or misleading media</li>
              <li>Automate spam or harassment</li>
              <li>Circumvent security measures</li>
              <li>Generate content that violates laws or regulations</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">4. Bias & Fairness</h3>
            <p className="text-light mb-3">
              We acknowledge that AI systems may contain biases. Users should:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Be aware of potential biases in AI outputs</li>
              <li>Question and verify AI-generated content</li>
              <li>Report instances of harmful bias</li>
              <li>Use AI as a tool, not a replacement for human judgment</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">5. Continuous Improvement</h3>
            <p className="text-light mb-3">
              We are committed to:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Regularly updating our AI safety measures</li>
              <li>Monitoring and addressing potential risks</li>
              <li>Gathering user feedback on AI safety concerns</li>
              <li>Collaborating with the AI safety community</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'referral',
      title: 'Referral Program Rules',
      icon: <ScaleIcon className="h-6 w-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">1. Program Eligibility</h3>
            <p className="text-light mb-3">
              To participate in our referral program:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>You must have a valid account in good standing</li>
              <li>You must be at least 13 years old</li>
              <li>You cannot refer yourself</li>
              <li>Referrals must be genuine and not automated</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">2. Reward Structure</h3>
            <p className="text-light mb-3">
              Current reward structure:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Referrer: 100 points per successful referral</li>
              <li>Referred user: 50 points upon signup</li>
              <li>Additional rewards for milestone achievements</li>
              <li>Points can be used for platform features and rewards</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">3. Prohibited Practices</h3>
            <p className="text-light mb-3">
              The following practices are strictly prohibited:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Creating fake accounts or using multiple accounts</li>
              <li>Using automated tools or bots</li>
              <li>Spamming or harassing potential referrals</li>
              <li>Offering incentives outside our platform</li>
              <li>Manipulating the referral system</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">4. Verification Process</h3>
            <p className="text-light mb-3">
              All referrals are subject to verification:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Referred users must complete account verification</li>
              <li>Accounts must show genuine activity</li>
              <li>We reserve the right to investigate suspicious activity</li>
              <li>Rewards may be withheld pending verification</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">5. Program Changes</h3>
            <p className="text-light mb-3">
              We reserve the right to:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Modify reward structures</li>
              <li>Suspend or terminate the program</li>
              <li>Disqualify users for violations</li>
              <li>Update terms with reasonable notice</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'disclaimer',
      title: 'Legal Disclaimers',
      icon: <ExclamationTriangleIcon className="h-6 w-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">1. Service Availability</h3>
            <p className="text-light mb-3">
              Naf's AI Hub is provided "as is" and "as available" without any warranties of any kind.
            </p>
            <p className="text-light mb-3">
              We do not guarantee:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Uninterrupted service availability</li>
              <li>Error-free operation</li>
              <li>Compatibility with all devices or browsers</li>
              <li>Specific functionality or features</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">2. AI Content Disclaimer</h3>
            <p className="text-light mb-3">
              AI-generated content is provided for informational and educational purposes only.
            </p>
            <p className="text-light mb-3">
              Users acknowledge that:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>AI content may contain inaccuracies or errors</li>
              <li>Content should be verified independently</li>
              <li>We are not responsible for AI-generated content</li>
              <li>Users are responsible for their use of AI content</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">3. Limitation of Liability</h3>
            <p className="text-light mb-3">
              In no event shall Naf's AI Hub be liable for any indirect, incidental, special, consequential, or punitive damages.
            </p>
            <p className="text-light mb-3">
              This includes but is not limited to:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Loss of data or profits</li>
              <li>Business interruption</li>
              <li>Personal injury or property damage</li>
              <li>Any damages resulting from use of our services</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">4. Third-Party Services</h3>
            <p className="text-light mb-3">
              Our service may integrate with or link to third-party services. We are not responsible for:
            </p>
            <ul className="list-disc list-inside text-light ml-4 space-y-1">
              <li>Third-party content or services</li>
              <li>Privacy practices of third parties</li>
              <li>Security of third-party platforms</li>
              <li>Any issues arising from third-party integrations</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-light mb-4">5. Governing Law</h3>
            <p className="text-light mb-3">
              These terms and conditions are governed by and construed in accordance with applicable laws.
            </p>
            <p className="text-light mb-3">
              Any disputes shall be resolved in the appropriate jurisdiction as determined by applicable law.
            </p>
          </div>
        </div>
      )
    }
  ];

  const activeContent = policySections.find(section => section.id === activeSection);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-light mb-4">Policies & Guidelines</h1>
        <p className="text-light text-lg opacity-90">
          Understanding our terms, policies, and community standards
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {policySections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-primary text-white'
                : 'bg-secondary/30 text-light hover:bg-secondary/50 hover:text-light'
            }`}
          >
            {section.icon}
            {section.title}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-secondary/20 rounded-lg p-6">
        {activeContent && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              {activeContent.icon}
              <h2 className="text-2xl font-bold text-light">{activeContent.title}</h2>
            </div>
            {activeContent.content}
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="text-center mt-8 p-4 bg-secondary/20 rounded-lg">
        <p className="text-light text-sm opacity-80">
          These policies are subject to change. Please check back regularly for updates. 
          For questions about these policies, please contact our support team.
        </p>
        <p className="text-light text-xs opacity-70 mt-2">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default PoliciesPage;
