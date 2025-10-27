import React, { useEffect, useState, useRef } from 'react';
import { db, auth, serverTimestamp } from '../firebase/config';
import firebase from 'firebase/compat/app';
import { useTheme } from '../hooks/useTheme';

// NOTE: This voice implementation uses WebRTC for audio and Firestore as a transient
// signaling channel (offers/answers/ICE). No audio data is stored in Firestore — only
// small signaling messages. If you don't want any Firestore usage for signaling,
// we can implement a manual SDP copy flow instead.

function makeRoomId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

function makeTempId() {
  return 'anon-' + Math.random().toString(36).slice(2, 9);
}

export default function CollaborativeStudyRoom() {
  const { theme } = useTheme();

  const [roomId, setRoomId] = useState<string>('');
  const [joined, setJoined] = useState(false);
  const [notes, setNotes] = useState('');
  const [messages, setMessages] = useState<Array<any>>([]);
  const [messageText, setMessageText] = useState('');
  const notesRef = useRef<HTMLTextAreaElement | null>(null);
  const unsubscribers = useRef<Array<() => void>>([]);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [joinRequestId, setJoinRequestId] = useState<string | null>(null);
  const [joinRequestStatus, setJoinRequestStatus] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  // Voice chat state
  const [inVoice, setInVoice] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioElements = useRef<Map<string, HTMLAudioElement>>(new Map());
  const unsubSignaling = useRef<() => void | null>(null);
  const unsubParticipantsSignaling = useRef<() => void | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [localMuted, setLocalMuted] = useState(false);
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [speaking, setSpeaking] = useState<Record<string, boolean>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);
  const remoteAnalysers = useRef<Map<string, AnalyserNode>>(new Map());
  const remoteVADIntervals = useRef<Map<string, number>>(new Map());
  const [showParticipantsMobile, setShowParticipantsMobile] = useState(false);
  // Whiteboard state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const currentStroke = useRef<Array<{ x: number; y: number }>>([]);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(3);
  const [isAdmin, setIsAdmin] = useState(false);
  // Whiteboard helpers
  const renderStroke = (s: any, smooth = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = s.color || '#000';
    ctx.lineWidth = s.size || 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const pts: Array<{ x: number; y: number }> = Array.isArray(s.points) ? s.points : [];
    if (pts.length === 0) return;

    const W = canvas.width;
    const H = canvas.height;

    // If smoothing disabled or few points, draw simple polyline
    if (!smooth || pts.length < 3) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x * W, pts[0].y * H);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x * W, pts[i].y * H);
      }
      ctx.stroke();
      return;
    }

    // Quadratic smoothing: draw using quadraticCurveTo through midpoints
    ctx.beginPath();
    ctx.moveTo(pts[0].x * W, pts[0].y * H);
    for (let i = 1; i < pts.length - 1; i++) {
      const prev = pts[i - 1];
      const cur = pts[i];
      const next = pts[i + 1];
      // midpoint between current and next
      const cx = (cur.x + next.x) / 2 * W;
      const cy = (cur.y + next.y) / 2 * H;
      ctx.quadraticCurveTo(cur.x * W, cur.y * H, cx, cy);
    }
    // connect to last point
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x * W, last.y * H);
    ctx.stroke();
  };

  // batching queue for strokes to reduce realtime churn
  const strokeQueue = useRef<any[]>([]);
  const strokeFlushTimer = useRef<number | null>(null);

  const flushStrokes = async () => {
    if (!roomId) return;
    const items = strokeQueue.current.splice(0, strokeQueue.current.length);
    if (items.length === 0) return;
    if (strokeFlushTimer.current) {
      clearTimeout(strokeFlushTimer.current);
      strokeFlushTimer.current = null;
    }
    try {
      const col = db.collection('studyRooms').doc(roomId).collection('whiteboard').doc('strokes').collection('items');
      const batch = db.batch();
      items.forEach((s) => {
        const d = col.doc();
        batch.set(d, { ...s, createdAt: serverTimestamp() });
      });
      await batch.commit();
    } catch (err) {
      console.warn('failed to flush strokes', err);
      // on failure, requeue items for next attempt
      strokeQueue.current.unshift(...items);
      if (!strokeFlushTimer.current) strokeFlushTimer.current = window.setTimeout(flushStrokes, 100);
    }
  };

  const enqueueStroke = (stroke: any) => {
    strokeQueue.current.push(stroke);
    if (!strokeFlushTimer.current) {
      strokeFlushTimer.current = window.setTimeout(flushStrokes, 100);
    }
  };

  const clearWhiteboard = async () => {
    if (!roomId || !isAdmin) return alert('Only room creator can clear the whiteboard');
    try {
      // delete all stroke docs (note: batched deletes for large boards should be handled server-side)
      const col = db.collection('studyRooms').doc(roomId).collection('whiteboard').doc('strokes').collection('items');
      const snap = await col.get();
      const batch = db.batch();
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      // clear canvas locally
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    } catch (err) {
      console.error('clearWhiteboard failed', err);
    }
  };

  // Pointer/touch handlers
  const toCanvasCoords = (e: PointerEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ((e as TouchEvent).changedTouches) {
      const t = (e as TouchEvent).changedTouches[0];
      return { x: (t.clientX - rect.left) / rect.width, y: (t.clientY - rect.top) / rect.height };
    }
    const pe = e as PointerEvent;
    return { x: (pe.clientX - rect.left) / rect.width, y: (pe.clientY - rect.top) / rect.height };
  };

  const startDraw = (e: any) => {
    drawing.current = true;
    currentStroke.current = [];
    const p = toCanvasCoords(e.nativeEvent);
    currentStroke.current.push(p);
  };

  const moveDraw = (e: any) => {
    if (!drawing.current) return;
    const p = toCanvasCoords(e.nativeEvent);
    currentStroke.current.push(p);
    // render incremental
    renderStroke({ points: currentStroke.current, color, size }, false);
  };

  const endDraw = async () => {
    if (!drawing.current) return;
    drawing.current = false;
    const pts = currentStroke.current.slice();
    const stroke = { points: pts, color, size };
  // enqueue and flush in a batch shortly
  enqueueStroke(stroke);
    currentStroke.current = [];
  };

  useEffect(() => {
    return () => {
      // cleanup listeners on unmount
      unsubscribers.current.forEach((u) => u && u());
    };
  }, []);

  const createRoom = async () => {
    const id = makeRoomId();
    try {
      const user = auth.currentUser;
      await db.collection('studyRooms').doc(id).set({
        createdAt: serverTimestamp(),
        notes: '',
        createdBy: user ? user.uid : null,
        createdByName: user ? (user.displayName || user.email) : null,
      });
      setRoomId(id);
      joinRoom(id);
    } catch (err) {
      console.error('Failed to create room', err);
      alert('Could not create room. Check console.');
    }
  };

  const joinRoom = async (id?: string) => {
    const rid = id || roomId;
    if (!rid) return alert('Enter or create a room id first');
    setRoomId(rid);

    // unsubscribe any previous listeners
    unsubscribers.current.forEach((u) => u && u());
    unsubscribers.current = [];

    const docRef = db.collection('studyRooms').doc(rid);

  // Note: do not subscribe to room notes or messages until the user is an approved participant
  // Subscriptions will be created after participant doc exists (see below)

  // Subscribe to pending join requests (admin will see these)
  let unsubReqs: (() => void) | null = null;

    // check room creator/admin
  const roomSnap = await docRef.get();
  const roomData = roomSnap.exists ? roomSnap.data() : null;
    const user = auth.currentUser;
    const myId = user ? user.uid : null;

    const amIAdmin = roomData && roomData.createdBy && myId && roomData.createdBy === myId;
  setIsAdmin(Boolean(amIAdmin));

  if (amIAdmin) {
      unsubReqs = docRef.collection('joinRequests').where('status', '==', 'pending').onSnapshot((snap) => {
        const reqs: any[] = [];
        snap.forEach((d) => reqs.push({ id: d.id, ...d.data() }));
        setPendingRequests(reqs);
      }, (err) => console.error('joinRequests snapshot error', err));
    }

  if (unsubReqs) unsubscribers.current.push(unsubReqs);

    // If room has an admin and current user is not admin, require approval
  if (roomData && roomData.createdBy && roomData.createdBy !== myId) {
      // create a join request and wait for admin to approve (or deny)
      try {
        const reqRef = docRef.collection('joinRequests').doc(myId || makeTempId());
        await reqRef.set({
          requesterId: myId || reqRef.id,
          name: user ? (user.displayName || user.email || 'User') : 'Anonymous',
          requestedAt: serverTimestamp(),
          status: 'pending'
        });
        const ridLocal = reqRef.id;
        setJoinRequestId(ridLocal);

    // Listen for status changes
        const unsubReq = reqRef.onSnapshot((s) => {
          if (!s.exists) return;
          const data = s.data();
          setJoinRequestStatus(data?.status || null);
          if (data?.status === 'approved') {
            // admin should create participant doc; now wait for participant doc to appear
            const pid = myId || data.requesterId || ridLocal;
            const partRef = docRef.collection('participants').doc(pid);
            const unsubPart = partRef.onSnapshot((ps) => {
              if (ps.exists) {
                setParticipantId(pid);
                // start heartbeat
                const interval = setInterval(() => {
                  partRef.set({ lastActive: serverTimestamp() }, { merge: true }).catch(() => {});
                }, 30_000);
                unsubscribers.current.push(() => clearInterval(interval));

                // Now that participant exists, subscribe to room notes and messages
                const unsubDoc = docRef.onSnapshot((snap) => {
                  if (!snap.exists) return;
                  const data = snap.data();
                  if (data && typeof data.notes === 'string') setNotes(data.notes);
                }, (err) => console.error('notes snapshot error', err));

                const unsubMsgs = docRef.collection('messages').orderBy('createdAt', 'asc').onSnapshot((snap) => {
                  const arr: any[] = [];
                  snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
                  setMessages(arr);
                }, (err) => console.error('messages snapshot error', err));

                // subscribe to whiteboard strokes
                const unsubStrokes = docRef.collection('whiteboard').doc('strokes').collection('items').orderBy('createdAt', 'asc').onSnapshot((snap) => {
                  // clear canvas and redraw all strokes
                  const canvas = canvasRef.current;
                  const ctx = canvas?.getContext('2d');
                  if (ctx && canvas) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                  }
                  snap.forEach((d) => {
                    const s = d.data();
                    try { renderStroke(s, false); } catch {}
                  });
                }, (err) => console.error('whiteboard snapshot error', err));

                unsubscribers.current.push(unsubStrokes);

                // subscribe to participants list for UI controls
                const unsubParts = docRef.collection('participants').onSnapshot((snap) => {
                  const arr: any[] = [];
                  snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
                  setParticipants(arr);
                }, (err) => console.error('participants snapshot error', err));

                unsubscribers.current.push(unsubParts);

                unsubscribers.current.push(unsubDoc, unsubMsgs);

                setJoined(true);
                unsubPart();
              }
            });
            unsubscribers.current.push(unsubPart);
          }
        });
        unsubscribers.current.push(unsubReq);
      } catch (err) {
        console.warn('Failed to create join request', err);
      }
    } else {
      // no admin or I'm the admin: create participant immediately
      try {
        const pid = myId || makeTempId();
        setParticipantId(pid);
        const partRef = docRef.collection('participants').doc(pid);
        await partRef.set({
          id: pid,
          name: user ? (user.displayName || user.email || 'User') : 'Anonymous',
          joinedAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        });
        const interval = setInterval(() => {
          partRef.set({ lastActive: serverTimestamp() }, { merge: true }).catch((e) => console.warn('heartbeat failed', e));
        }, 30_000);
        unsubscribers.current.push(() => clearInterval(interval));

        // After creating participant (admin case), subscribe to room notes and messages
        const unsubDoc = docRef.onSnapshot((snap) => {
          if (!snap.exists) return;
          const data = snap.data();
          if (data && typeof data.notes === 'string') setNotes(data.notes);
        }, (err) => console.error('notes snapshot error', err));

        const unsubMsgs = docRef.collection('messages').orderBy('createdAt', 'asc').onSnapshot((snap) => {
          const arr: any[] = [];
          snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
          setMessages(arr);
        }, (err) => console.error('messages snapshot error', err));

        // subscribe to whiteboard strokes for admin-created participant path as well
        const unsubStrokesAdmin = docRef.collection('whiteboard').doc('strokes').collection('items').orderBy('createdAt', 'asc').onSnapshot((snap) => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
          snap.forEach((d) => {
            const s = d.data();
            try { renderStroke(s, false); } catch {}
          });
        }, (err) => console.error('whiteboard snapshot error', err));

        unsubscribers.current.push(unsubStrokesAdmin);

        // subscribe to participants list for UI controls (admin/creator case)
        const unsubPartsAdmin = docRef.collection('participants').onSnapshot((snap) => {
          const arr: any[] = [];
          snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
          setParticipants(arr);
        }, (err) => console.error('participants snapshot error', err));

        unsubscribers.current.push(unsubPartsAdmin);

        unsubscribers.current.push(unsubDoc, unsubMsgs);

        setJoined(true);
      } catch (err) {
        console.warn('Failed to add participant', err);
      }
    }
  };

  const leaveRoom = () => {
  // ensure voice is stopped and cleaned
  try { stopVoice(); } catch {}
  unsubscribers.current.forEach((u) => u && u());
    unsubscribers.current = [];
    setJoined(false);
    setMessages([]);
    setNotes('');
    // remove participant doc
    try {
      if (roomId && participantId) {
        db.collection('studyRooms').doc(roomId).collection('participants').doc(participantId).delete().catch(() => {});
      }
    } catch (err) {
      console.warn('Failed to remove participant on leave', err);
    }
    setParticipantId(null);
  // flush any pending strokes
  try { flushStrokes(); } catch {}
  };

  const cancelJoinRequest = async () => {
    try {
      if (!roomId || !joinRequestId) return;
      await db.collection('studyRooms').doc(roomId).collection('joinRequests').doc(joinRequestId).delete();
      setJoinRequestId(null);
      setJoinRequestStatus(null);
    } catch (err) {
      console.warn('Failed to cancel join request', err);
    }
  };

  // --- Voice chat helpers ---
  const startVoice = async () => {
  if (!roomId) return alert('Join a room first');
  if (joinRequestStatus === 'pending' || !joined) return alert('You must be approved and joined to start voice');
  if (!participantId) return alert('Participant record missing; please rejoin');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setInVoice(true);

      const user = auth.currentUser;
      const myId = user ? user.uid : makeTempId();

      // listen for incoming signaling messages targeted to me or to 'all'
      const q = db.collection('studyRooms').doc(roomId).collection('voice').where('to', 'in', [myId, 'all']);
      const snapUnsub = q.onSnapshot(async (snap) => {
        for (const d of snap.docChanges()) {
          const data = d.doc.data();
          const from = data.from;
          const type = data.type;
          if (d.type === 'added') {
            try {
              if (type === 'offer' && data.sdp) {
                // incoming offer -> create peer, set remote, add tracks, create answer
                const pc = createPeerConnection(from, myId);
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                if (localStreamRef.current) {
                  for (const t of localStreamRef.current.getTracks()) pc.addTrack(t, localStreamRef.current);
                }
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await db.collection('studyRooms').doc(roomId).collection('voice').add({
                  from: myId,
                  to: from,
                  type: 'answer',
                  sdp: pc.localDescription ? pc.localDescription.toJSON() : null,
                  createdAt: serverTimestamp()
                });
              } else if (type === 'answer' && data.sdp) {
                const pc = peerConnections.current.get(from);
                if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
              } else if (type === 'candidate' && data.candidate) {
                const pc = peerConnections.current.get(from);
                if (pc) await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
              }
            } catch (err) {
              console.warn('Signaling processing error', err);
            } finally {
              // remove the signaling doc to keep things transient
              try { await d.doc.ref.delete(); } catch {}
            }
          }
        }
      }, (err) => console.error('voice signaling snapshot error', err));

      unsubSignaling.current = () => snapUnsub();

      // Grab existing participants and create offers to each
      const partsSnap = await db.collection('studyRooms').doc(roomId).collection('participants').get();
      for (const p of partsSnap.docs) {
        const pid = p.id;
        if (pid === myId) continue;
        const pc = createPeerConnection(pid, myId);
        if (localStreamRef.current) for (const t of localStreamRef.current.getTracks()) pc.addTrack(t, localStreamRef.current);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await db.collection('studyRooms').doc(roomId).collection('voice').add({
          from: myId,
          to: pid,
          type: 'offer',
          sdp: pc.localDescription ? pc.localDescription.toJSON() : null,
          createdAt: serverTimestamp()
        });
      }

      // Listen for future participants joining while we're in voice and create offers to them
      const partsListener = db.collection('studyRooms').doc(roomId).collection('participants').onSnapshot((snap) => {
        snap.docChanges().forEach(async (change) => {
          if (change.type !== 'added') return;
          const pid = change.doc.id;
          if (pid === myId) return;
          if (peerConnections.current.has(pid)) return;
          try {
            const pc = createPeerConnection(pid, myId);
            if (localStreamRef.current) for (const t of localStreamRef.current.getTracks()) pc.addTrack(t, localStreamRef.current);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await db.collection('studyRooms').doc(roomId).collection('voice').add({
              from: myId,
              to: pid,
              type: 'offer',
              sdp: pc.localDescription ? pc.localDescription.toJSON() : null,
              createdAt: serverTimestamp()
            });
          } catch (err) {
            console.warn('failed to create offer for new participant', err);
          }
        });
      }, (err) => console.error('participants signaling snapshot error', err));

      unsubParticipantsSignaling.current = () => partsListener();
    } catch (err) {
      console.error('startVoice failed', err);
      setInVoice(false);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
    }
  };

  const stopVoice = async () => {
    setInVoice(false);
    try {
  if (unsubSignaling.current) unsubSignaling.current();
  if (unsubParticipantsSignaling.current) unsubParticipantsSignaling.current();
  // close peer connections
  peerConnections.current.forEach((pc) => { try { pc.close(); } catch {} });
  peerConnections.current.clear();
  // cleanup analysers and VAD intervals
  remoteAnalysers.current.forEach((an) => { try { an.disconnect(); } catch {} });
  remoteAnalysers.current.clear();
  remoteVADIntervals.current.forEach((id) => { try { clearInterval(id); } catch {} });
  remoteVADIntervals.current.clear();
  // remove audio elements
  remoteAudioElements.current.forEach((el) => { try { el.pause(); el.srcObject = null; el.remove(); } catch {} });
  remoteAudioElements.current.clear();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
    } catch (err) {
      console.warn('stopVoice error', err);
    }
  };

  function createPeerConnection(remoteId: string, myId: string) {
    const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const pc = new RTCPeerConnection(config);
    peerConnections.current.set(remoteId, pc);

    pc.onicecandidate = async (ev) => {
      if (ev.candidate) {
        try {
          await db.collection('studyRooms').doc(roomId).collection('voice').add({
            from: myId,
            to: remoteId,
            type: 'candidate',
            candidate: ev.candidate.toJSON(),
            createdAt: serverTimestamp()
          });
        } catch (err) {
          console.warn('failed to send candidate', err);
        }
      }
    };

    pc.ontrack = (ev) => {
      try {
        let el = remoteAudioElements.current.get(remoteId);
        if (!el) {
          el = document.createElement('audio');
          el.autoplay = true;
          remoteAudioElements.current.set(remoteId, el);
          // attach to body invisibly
          el.style.display = 'none';
          document.body.appendChild(el);
        }
        el.srcObject = ev.streams[0];
        // Ensure default volume value exists
        setVolumes((v) => ({ ...v, [remoteId]: v[remoteId] ?? 1 }));
        // Setup VAD analyser for this remote stream
        try {
          setupRemoteAnalyser(remoteId, ev.streams[0]);
        } catch (err) {
          console.warn('failed to setup analyser', err);
        }
      } catch (err) {
        console.warn('ontrack error', err);
      }
    };

    return pc;
  }

  function ensureAudioContext() {
    if (!audioCtxRef.current) {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AC();
    }
    return audioCtxRef.current;
  }

  function setupRemoteAnalyser(remoteId: string, stream: MediaStream) {
    const audioCtx = ensureAudioContext();
    // remove older analyser if present
    const existing = remoteAnalysers.current.get(remoteId);
    if (existing) {
      try { existing.disconnect(); } catch {}
      remoteAnalysers.current.delete(remoteId);
    }
    const src = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);
    remoteAnalysers.current.set(remoteId, analyser);

    const buf = new Float32Array(analyser.fftSize);
    const intervalId = window.setInterval(() => {
      try {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        const isSpeaking = rms > 0.02; // threshold
        setSpeaking((s) => {
          if (s[remoteId] === isSpeaking) return s;
          return { ...s, [remoteId]: isSpeaking };
        });
      } catch (err) {
        // ignore
      }
    }, 150);
    remoteVADIntervals.current.set(remoteId, intervalId);
  }

  const setRemoteVolume = (pid: string, value: number) => {
    const el = remoteAudioElements.current.get(pid);
    if (el) el.volume = value;
    setVolumes((v) => ({ ...v, [pid]: value }));
  };

  const toggleLocalMute = () => {
    if (!localStreamRef.current) return;
    const newMuted = !localMuted;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      try { t.enabled = !newMuted; } catch {}
    });
    setLocalMuted(newMuted);
  };

  const approveRequest = async (req: any) => {
    try {
      const docRef = db.collection('studyRooms').doc(roomId);
      // create participant doc for requester
      const pid = req.requesterId || req.id;
      await docRef.collection('participants').doc(pid).set({
        id: pid,
        name: req.name || 'User',
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      });
      // update request status
      await docRef.collection('joinRequests').doc(req.id).set({ status: 'approved', decidedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('approveRequest failed', err);
    }
  };

  const denyRequest = async (req: any) => {
    try {
      const docRef = db.collection('studyRooms').doc(roomId);
      await docRef.collection('joinRequests').doc(req.id).set({ status: 'denied', decidedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('denyRequest failed', err);
    }
  };

  const updateNotes = async (next: string) => {
    setNotes(next);
    if (!roomId) return;
    try {
  await db.collection('studyRooms').doc(roomId).set({ notes: next, lastUpdated: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to update notes', err);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !roomId) return;
    try {
      const user = auth.currentUser;
      const pid = participantId || (user ? user.uid : null) || makeTempId();
      await db.collection('studyRooms').doc(roomId).collection('messages').add({
        text: messageText.trim(),
        createdAt: serverTimestamp(),
        user: user ? (user.displayName || user.email || 'User') : 'Anonymous',
        userId: user ? user.uid : pid,
      });

      // update participant lastActive
      try {
        const partRef = db.collection('studyRooms').doc(roomId).collection('participants').doc(pid);
        await partRef.set({ lastActive: serverTimestamp() }, { merge: true });
      } catch (e) {
        // non-critical
      }
      setMessageText('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const copyLink = async () => {
    if (!roomId) return alert('No room id to copy');
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Room link copied to clipboard');
    } catch (err) {
      console.warn('Clipboard failed, showing link instead');
      prompt('Copy this link', url);
    }
  };

  // If ?room= is present in url, auto-join
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('room');
    if (r) {
      setRoomId(r);
      joinRoom(r);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ensure participant is removed when tab closes
  useEffect(() => {
    const handler = async () => {
      try {
        if (roomId && participantId) {
          await db.collection('studyRooms').doc(roomId).collection('participants').doc(participantId).delete();
        }
  // flush strokes before unload
  try { await flushStrokes(); } catch {}
      } catch {}
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, participantId]);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Collaborative Study Room</h2>
      <div className="flex flex-wrap gap-2 items-center">
        <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Room id (or create new)" className="border px-2 py-1 rounded w-full sm:w-60" />
        {!joined ? (
          <>
            <button onClick={() => joinRoom()} className="btn w-full sm:w-auto py-2 px-3">Join Room</button>
            <button onClick={createRoom} className="btn w-full sm:w-auto py-2 px-3">Create Room</button>
          </>
        ) : (
          <button onClick={leaveRoom} className="btn w-full sm:w-auto">Leave Room</button>
        )}
        <button onClick={copyLink} className="btn w-full sm:w-auto">Copy Link</button>
        {/* Mobile toggle to show participants/voice panel */}
        <button className="block sm:hidden btn ml-auto" onClick={() => setShowParticipantsMobile((s) => !s)}>{showParticipantsMobile ? 'Hide' : 'Participants'}</button>
      </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
          <h3 className="font-medium">Shared Notes</h3>
          <textarea
            ref={notesRef}
            value={notes}
            onChange={(e) => updateNotes(e.target.value)}
            placeholder="Type shared notes here. Everyone in the room sees updates in real time."
            className="w-full h-48 md:h-60 border rounded p-2 break-words"
            disabled={joinRequestStatus === 'pending' || !joined}
            style={joinRequestStatus === 'pending' || !joined ? { opacity: 0.6, pointerEvents: 'none' } : {}}
          />
        </div>

  <div>
          <h3 className="font-medium">Chat</h3>
          <div
            className="h-48 md:h-56 border rounded p-2 overflow-y-auto mb-2"
            style={{ backgroundColor: theme.colors.secondary, borderColor: theme.colors.primary }}
          >
            {/* Waiting banner for users with pending join request */}
            {joinRequestStatus === 'pending' && (
              <div className="mb-2 p-2 rounded" style={{ backgroundColor: theme.colors.primary, color: theme.colors.light }}>
                <div className="font-medium">Waiting for approval</div>
                <div className="text-sm">Your request to join this room is pending. The room creator must approve your request before you can participate.</div>
                <div className="mt-2">
                  <button onClick={cancelJoinRequest} className="btn">Cancel Request</button>
                </div>
              </div>
            )}
            {messages.length === 0 && (
              <div style={{ color: theme.colors.light }} className="text-sm">No messages yet.</div>
            )}
            {messages.map((m) => {
              const currentUser = auth.currentUser ? (auth.currentUser.displayName || auth.currentUser.email || 'User') : 'Anonymous';
              const isMine = m.user === currentUser;

              // Helpers to compute readable text color based on background
              const hexToRgb = (hex: string) => {
                const h = hex.replace('#', '');
                const bigint = parseInt(h, 16);
                return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
              };

              const luminance = (hex: string) => {
                try {
                  const [r, g, b] = hexToRgb(hex).map((v) => {
                    const s = v / 255;
                    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
                  });
                  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
                } catch {
                  return 1; // default to light
                }
              };

              const pickTextColor = (bgHex: string) => {
                const lum = luminance(bgHex);
                // WCAG relative luminance threshold around 0.179 yields good contrast
                return lum > 0.5 ? '#000000' : '#ffffff';
              };

              const bg = isMine ? theme.colors.accent : theme.colors.light;
              const textColor = pickTextColor(bg);
              const bubbleStyle: React.CSSProperties = { backgroundColor: bg, color: textColor };

              // user label should contrast with container background
              const containerBg = theme.colors.secondary;
              const userLabelColor = pickTextColor(containerBg) === '#ffffff' ? theme.colors.light : theme.colors.primary;

              return (
                <div key={m.id} className="mb-2">
                  <div className="text-sm mb-1" style={{ color: userLabelColor, fontWeight: 600 }}>{m.user}</div>
                  <div style={{ ...bubbleStyle, padding: '0.5rem', borderRadius: 8 }}>{m.text}</div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type a message" className="border px-2 py-2 rounded flex-1 w-full md:w-auto" disabled={joinRequestStatus === 'pending' || !joined} />
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={sendMessage}
                className="btn w-full md:w-auto"
                style={{ backgroundColor: theme.colors.accent, color: theme.colors.primary }}
                disabled={joinRequestStatus === 'pending' || !joined}
              >
                Send
              </button>
              {!inVoice ? (
                <button onClick={startVoice} className="btn w-full md:w-auto" disabled={joinRequestStatus === 'pending' || !joined}>Start Voice</button>
              ) : (
                <button onClick={stopVoice} className="btn w-full md:w-auto">Stop Voice</button>
              )}
            </div>
          </div>

          {/* Admin pending requests UI */}
          {pendingRequests.length > 0 && (
            <div className="mt-3 bg-secondary p-3 rounded">
              <h4 className="font-semibold text-light">Pending Join Requests</h4>
              {pendingRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between mt-2">
                  <div>
                    <div className="text-sm text-light">{r.name}</div>
                    <div className="text-xs text-slate-400">Requested: {new Date(r.requestedAt?.toDate?.() || Date.now()).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approveRequest(r)} className="btn">Approve</button>
                    <button onClick={() => denyRequest(r)} className="btn">Deny</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-medium">Whiteboard</h3>
        <div className="border rounded p-2">
          <div className="flex gap-2 items-center mb-2">
            <label className="text-sm">Color</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            <label className="text-sm">Size</label>
            <input type="range" min={1} max={20} value={size} onChange={(e) => setSize(Number(e.target.value))} />
            <button className="btn" onClick={clearWhiteboard} disabled={!isAdmin}>Clear</button>
          </div>
          <div className="w-full h-64 md:h-80">
            <canvas ref={canvasRef} width={800} height={400} style={{ width: '100%', height: '100%', touchAction: 'none' }}
              onPointerDown={startDraw} onPointerMove={moveDraw} onPointerUp={endDraw} onPointerCancel={endDraw}
            />
          </div>
        </div>
      </div>

  {/* Participants and voice controls: visible on md+ or toggleable on mobile */}
  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${showParticipantsMobile ? '' : 'hidden sm:grid'}`}>
  <div>
          <h4 className="font-medium">Participants</h4>
          <div className="border rounded p-2 h-40 overflow-y-auto">
            {participants.map((p) => (
              <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-2">
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: speaking[p.id] ? '#22c55e' : '#9ca3af' }} />
                  <div className="text-sm">{p.name || p.id}{p.id === participantId ? ' (You)' : ''}</div>
                </div>
                <div className="w-full sm:w-40">
                  <input className="w-full" type="range" min={0} max={1} step={0.01} value={volumes[p.id] ?? 1} onChange={(e) => setRemoteVolume(p.id, Number(e.target.value))} />
                </div>
              </div>
            ))}
          </div>
        </div>

  <div>
          <h4 className="font-medium">Voice Controls</h4>
          <div className="border rounded p-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
              <button onClick={toggleLocalMute} className="btn w-full sm:w-auto">{localMuted ? 'Unmute' : 'Mute'}</button>
              {!inVoice ? (
                <button onClick={startVoice} className="btn w-full sm:w-auto" disabled={joinRequestStatus === 'pending' || !joined}>Start Voice</button>
              ) : (
                <button onClick={stopVoice} className="btn w-full sm:w-auto">Stop Voice</button>
              )}
            </div>
            <div className="text-sm text-slate-500">Tip: Use volume sliders to adjust each participant's audio locally. Speaker dot lights when a participant is speaking.</div>
          </div>
        </div>
      </div>

      <div className="text-sm text-slate-500">Tip: Share the room link with classmates so they can join instantly. Uses Firestore for realtime syncing.</div>
    </div>
  );
}
