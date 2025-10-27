
import React, { useState, useMemo, useEffect } from 'react';
import { AITool, ApprovalStatus, AppUser } from './types';
import Header from './components/Header';
import ToolList from './components/ToolList';
import SubmissionForm from './components/SubmissionForm';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import { auth, db, onAuthStateChanged, signOut } from './firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, updateDoc, getDoc, deleteDoc } from "firebase/firestore";



const App: React.FC = () => {
  const [tools, setTools] = useState<AITool[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [view, setView] = useState(window.location.hash);
  const [authLoading, setAuthLoading] = useState(true);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // isAdmin will be derived from the currentUser object (populated from Firestore users/{uid})
  const isAdmin = useMemo(() => !!currentUser?.isAdmin, [currentUser]);

  useEffect(() => {
    const handleHashChange = () => setView(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Try to read the user's profile/role from Firestore (users/{uid})
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);
          const userData = userSnap.exists() ? userSnap.data() : null;

          setCurrentUser({
            uid: user.uid,
            email: user.email,
            isAdmin: !!userData?.isAdmin,
          });
        } catch (err) {
          console.error('Failed to fetch user profile from Firestore:', err);
          // Fallback to a non-admin user if role can't be determined
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            isAdmin: false,
          });
        }

        if (window.location.hash === '#loginasadmin') {
          window.location.hash = '#';
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const toolsCollection = collection(db, 'tools');
    const q = query(toolsCollection, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const toolsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AITool[];
      setTools(toolsData);
      setToolsLoading(false);
      setError(null); // Clear error on successful fetch
    }, (err) => {
      console.error("Firestore connection error: ", err);
      setError("Could not connect to the tools database. Please check your internet connection and Firebase configuration. The app may not function correctly.");
      setToolsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleAddTool = async (newTool: Omit<AITool, 'id' | 'status' | 'submittedBy' | 'createdAt'>) => {
    try {
      // Check for duplicate link (case-insensitive)
      const existing = tools.find(t => t.link.trim().toLowerCase() === newTool.link.trim().toLowerCase());
      if (existing) {
        const err = new Error('This tool link has already been added.');
        // Attach a code so the form can identify duplicate errors if needed
        (err as any).code = 'DUPLICATE_URL';
        throw err;
      }
      await addDoc(collection(db, 'tools'), {
        ...newTool,
        status: isAdmin ? ApprovalStatus.Approved : ApprovalStatus.Pending,
        submittedBy: currentUser?.email || 'anonymous',
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding document: ", error);
      // Propagate error to the form component
      throw error;
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    try {
      await deleteDoc(doc(db, 'tools', toolId));
    } catch (err) {
      console.error('Failed to delete tool:', err);
      alert('Failed to delete the tool.');
    }
  };

  const handleStartEdit = (toolId: string) => {
    setEditingToolId(toolId);
    setShowSubmissionForm(true);
  };

  const handleUpdateTool = async (toolId: string, updated: Omit<AITool, 'id' | 'status' | 'submittedBy' | 'createdAt'>) => {
    try {
      // Check for duplicate link among other tools (case-insensitive)
      const duplicate = tools.find(t => t.id !== toolId && t.link.trim().toLowerCase() === updated.link.trim().toLowerCase());
      if (duplicate) {
        const err = new Error('Another tool with this link already exists.');
        (err as any).code = 'DUPLICATE_URL';
        throw err;
      }
      const toolRef = doc(db, 'tools', toolId);
      await updateDoc(toolRef, {
        ...updated,
      });
      setEditingToolId(null);
      setShowSubmissionForm(false);
    } catch (err) {
      console.error('Failed to update tool:', err);
      throw err;
    }
  };
  
  const handleUpdateToolStatus = async (toolId: string, status: ApprovalStatus) => {
    const toolDocRef = doc(db, 'tools', toolId);
    try {
      await updateDoc(toolDocRef, { status });
    } catch (error) {
      console.error("Error updating status: ", error);
      alert("Failed to update tool status.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.hash = '#';
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (authLoading || toolsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xl text-text-secondary">Loading Showcase...</p>
      </div>
    );
  }

  if (view === '#/showcase/loginasadmin' && !currentUser) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header
        user={currentUser}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onSubmitClick={() => setShowSubmissionForm(true)}
      />
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Connection Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {isAdmin && (
          <AdminDashboard
            tools={tools}
            onUpdateStatus={handleUpdateToolStatus}
          />
        )}
        
        {showSubmissionForm ? (
          <SubmissionForm 
            onSubmit={handleAddTool} 
            onCancel={() => { setShowSubmissionForm(false); setEditingToolId(null); }}
            isAdmin={isAdmin}
            initialTool={editingToolId ? tools.find(t => t.id === editingToolId) ?? null : null}
            onUpdate={handleUpdateTool}
          />
        ) : (
          <ToolList tools={tools} isAdmin={isAdmin} onDelete={handleDeleteTool} onEdit={handleStartEdit} />
        )}
      </main>
    </div>
  );
};

export default App;