import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createPurchaseRequest } from '../services/firebaseService';

const providers = ['bkash', 'rocket', 'nagad'] as const;

const BuyCheckoutPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [provider, setProvider] = useState<string>(providers[0]);
  const [name, setName] = useState<string>(currentUser?.displayName || '');
  const [phone, setPhone] = useState<string>('');
  const [txId, setTxId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [txTouched, setTxTouched] = useState(false);

  // pack param comes from route: /buy/:pack where pack is like '1000-100'
  const packParam = (params as any).pack || (params as any)['*'] || '';
  let points = 0, price = 0;
  if (typeof packParam === 'string' && packParam.length > 0) {
    const m = packParam.match(/^(\d+)-(\d+)$/);
    if (m) {
      points = Number(m[1]);
      price = Number(m[2]);
    }
  }

  const invalidPack = points <= 0 || price <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return navigate('/login');
    if (invalidPack) {
      alert('Invalid pack selected. Please go back and choose a valid pack.');
      return;
    }
    // final trimmed validation
    const phoneTrim = phone.trim();
    const txTrim = txId.trim();
    const phoneValid = /^01\d{9}$/.test(phoneTrim);
    if (!phoneValid) {
      setPhoneTouched(true);
      alert('Please enter a valid phone number (e.g. 017XXXXXXXX)');
      return;
    }
    if (!txTrim) {
      setTxTouched(true);
      alert('Please enter transaction id/reference after sending money.');
      return;
    }
    setSubmitting(true);
    try {
      await createPurchaseRequest({
        userId: currentUser.uid,
        name: name || currentUser.displayName || null,
        phone: phone.trim(),
        provider,
        transactionId: txId.trim(),
        points,
        price,
        status: 'pending',
      });

      alert('We received your request. Please allow up to 24 hours to credit points.');
      navigate('/referral');
    } catch (err) {
      console.error(err);
      alert('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Buy {points} points ({price} tk)</h2>
  <form onSubmit={handleSubmit} className="space-y-4 bg-secondary p-4 rounded">
        <div>
          <label className="block text-sm mb-1">Payment Provider</label>
          <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full p-2 rounded bg-gray-700">
            {providers.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Your Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 rounded bg-gray-700" />
        </div>
        <div>
          <label className="block text-sm mb-1">Phone Number (used to send money)</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setPhoneTouched(true)} className="w-full p-2 rounded bg-gray-700" />
          {phoneTouched && !/^01\d{9}$/.test(phone.trim()) && (
            <div className="text-xs text-amber-300 mt-1">Enter Bangladeshi mobile number starting with 01 and 11 digits total (e.g. 017XXXXXXXX)</div>
          )}
        </div>

        <div className="bg-gray-800 p-3 rounded">
          <p>Please send the amount to <strong>01724066076</strong> using your selected provider. After sending, enter the transaction id below and submit.</p>
        </div>

        <div>
          <label className="block text-sm mb-1">Transaction ID / Reference</label>
          <input value={txId} onChange={(e) => setTxId(e.target.value)} onBlur={() => setTxTouched(true)} className="w-full p-2 rounded bg-gray-700" />
          {txTouched && txId.trim().length === 0 && (
            <div className="text-xs text-amber-300 mt-1">Please enter the transaction id/reference you received after sending money.</div>
          )}
        </div>

        <div className="flex justify-end">
          <div className="flex items-center gap-3">
            {invalidPack && <div className="text-sm text-amber-300">Invalid pack selected. Choose a pack from the referral page.</div>}
            <button type="submit" disabled={submitting || invalidPack} className="px-4 py-2 rounded bg-primary text-white">{submitting ? 'Submitting...' : 'Submit'}</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BuyCheckoutPage;
