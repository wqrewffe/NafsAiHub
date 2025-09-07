import React, { useState, useMemo } from 'react';
import { ToolContainer } from '../../common/ToolContainer';
import { ToolHeader } from '../../common/ToolHeader';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
// FIX: Import the Textarea component to resolve the 'Cannot find name' error.
import { Textarea } from '../../common/Textarea';

interface SignatureData {
    name: string;
    title: string;
    company: string;
    phone: string;
    email: string;
    website: string;
    color: string;
}

const generateSignatureHtml = (data: SignatureData) => {
    return `<table style="width: 400px; font-family: Arial, sans-serif; font-size: 12px; color: #333333;" cellpadding="0" cellspacing="0">
  <tr>
    <td style="border-right: 2px solid ${data.color}; padding-right: 10px; vertical-align: top;">
      <p style="margin: 0; font-size: 16px; font-weight: bold; color: #000000;">${data.name || 'Your Name'}</p>
      <p style="margin: 2px 0 0; color: #555555;">${data.title || 'Your Title'}</p>
      <p style="margin: 2px 0 0; font-weight: bold; color: #555555;">${data.company || 'Your Company'}</p>
    </td>
    <td style="padding-left: 10px; vertical-align: top;">
      ${data.phone ? `<p style="margin: 0 0 5px;"><strong>P:</strong> ${data.phone}</p>` : ''}
      ${data.email ? `<p style="margin: 0 0 5px;"><strong>E:</strong> <a href="mailto:${data.email}" style="color: #1a0dab; text-decoration: none;">${data.email}</a></p>` : ''}
      ${data.website ? `<p style="margin: 0;"><strong>W:</strong> <a href="${data.website}" style="color: #1a0dab; text-decoration: none;">${data.website}</a></p>` : ''}
    </td>
  </tr>
</table>`;
};

export const EmailSignatureGenerator: React.FC = () => {
    const [data, setData] = useState<SignatureData>({
        name: 'Alex Doe',
        title: 'Senior Frontend Engineer',
        company: 'Dev Toolbox Inc.',
        phone: '+1 234 567 8900',
        email: 'alex.doe@example.com',
        website: 'https://example.com',
        color: '#4f46e5'
    });
    const [isCopied, copy] = useCopyToClipboard();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const signatureHtml = useMemo(() => generateSignatureHtml(data), [data]);

    return (
        <ToolContainer>
            <ToolHeader
                title="Email Signature Generator"
                description="Create a professional HTML email signature with a live preview."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">Your Details</h3>
                    <Input name="name" placeholder="Name" value={data.name} onChange={handleInputChange} />
                    <Input name="title" placeholder="Title / Role" value={data.title} onChange={handleInputChange} />
                    <Input name="company" placeholder="Company" value={data.company} onChange={handleInputChange} />
                    <Input name="phone" placeholder="Phone Number" value={data.phone} onChange={handleInputChange} />
                    <Input name="email" type="email" placeholder="Email Address" value={data.email} onChange={handleInputChange} />
                    <Input name="website" type="url" placeholder="Website URL" value={data.website} onChange={handleInputChange} />
                    <div>
                        <label className="text-sm">Accent Color</label>
                        <Input name="color" type="color" value={data.color} onChange={handleInputChange} className="h-10 p-1"/>
                    </div>
                </Card>
                <div className="space-y-4">
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Live Preview</h3>
                        <div className="p-4 bg-white rounded-md">
                            <div dangerouslySetInnerHTML={{ __html: signatureHtml }} />
                        </div>
                    </Card>
                    <Card className="relative">
                        <h3 className="text-lg font-semibold text-white mb-2">HTML Code</h3>
                        <Textarea
                            readOnly
                            value={signatureHtml}
                            rows={6}
                            className="font-mono text-xs bg-slate-900"
                        />
                         <Button
                            onClick={() => copy(signatureHtml)}
                            className="absolute top-4 right-4 px-3 py-1 text-xs"
                            variant="secondary"
                        >
                            {isCopied ? 'Copied!' : 'Copy HTML'}
                        </Button>
                    </Card>
                </div>
            </div>
        </ToolContainer>
    );
};