import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getPendingPurchaseRequests, listenPendingPurchaseRequests, approvePurchaseRequest, rejectPurchaseRequest } from '../../services/firebaseService';

const PaymentVerificationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    // Use a real-time listener to keep the admin UI in sync and avoid duplication loops
    const unsubscribe = listenPendingPurchaseRequests((res) => {
      setRequests(res);
    }, (err) => {
      console.error('Failed to listen to pending purchase requests:', err);
    });

    // initial load fallback in case the listener doesn't fire immediately
    (async () => {
      try {
        const res = await getPendingPurchaseRequests();
        setRequests(res);
      } catch (e) {
        console.error('Initial load pending requests failed', e);
      }
    })();

    return () => {
      try { unsubscribe && unsubscribe(); } catch {}
    };
  }, []);

  if (!currentUser || currentUser.email !== 'nafisabdullah424@gmail.com') {
    return <div className="p-6">Access denied</div>;
  }

  const handleApprove = async (r: any) => {
    if (!currentUser) return;
    const ok = window.confirm(`Approve request for ${r.name} (${r.phone}) with Tx: ${r.transactionId}?`);
    if (!ok) return;
    try {
      await approvePurchaseRequest(r.id, currentUser.uid);
      // Optimistically remove the request locally. The listener will keep UI in sync.
      setRequests(prev => prev.filter(x => x.id !== r.id));
    } catch (err: any) {
      console.error('approve error', err);
      alert('Failed to approve request: ' + (err && err.message ? err.message : String(err)));
    }
  };

  const handleReject = async (r: any) => {
    if (!currentUser) return;
    const ok = window.confirm(`Reject request for ${r.name} (${r.phone}) with Tx: ${r.transactionId}?`);
    if (!ok) return;
    try {
      await rejectPurchaseRequest(r.id, currentUser.uid);
      setRequests(prev => prev.filter(x => x.id !== r.id));
    } catch (err: any) {
      console.error('reject error', err);
      alert('Failed to reject request: ' + (err && err.message ? err.message : String(err)));
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Pending Purchase Requests</h2>
      <div className="space-y-4">
        {requests.map(r => (
          <div key={r.id} className="p-4 bg-secondary rounded">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className="font-semibold">{r.name || '—'}</div>
                <div className="text-sm text-slate-400">{r.phone || '—'}</div>
                <div className="text-xs text-slate-400 mt-2">Tx: {r.transactionId || '—'}</div>
              </div>
              <div>
                <div className="text-sm">Provider: <span className="font-medium">{r.provider || '—'}</span></div>
                <div className="text-sm">Points: <span className="font-medium">{r.points ?? '—'}</span></div>
                <div className="text-sm">Amount: <span className="font-medium">{r.price ?? '—'} tk</span></div>
              </div>
              <div>
                <div className="text-sm">User Id: <span className="font-medium">{r.userId}</span></div>
                <div className="text-sm">Requested: <span className="font-medium">{(() => {
                  const ts = r.createdAt;
                  if (!ts) return '—';
                  if (ts.toDate) return ts.toDate().toLocaleString();
                  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
                  if (typeof ts === 'string') return new Date(ts).toLocaleString();
                  return String(ts);
                })()}</span></div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => handleApprove(r)} className="px-3 py-1 rounded bg-emerald-500 text-white">Approve</button>
              <button onClick={() => handleReject(r)} className="px-3 py-1 rounded bg-red-500 text-white">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentVerificationPage;
