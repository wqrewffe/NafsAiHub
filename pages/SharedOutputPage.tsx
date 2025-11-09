import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase/config';
import { DocumentMagnifyingGlassIcon } from '../tools/Icons';
import { tools } from '../tools';

const SharedOutputPage: React.FC = () => {
  const { id } = useParams();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const doc = await db.collection('sharedOutputs').doc(id).get();
        if (!mounted) return;
        if (!doc.exists) {
          setError('Shared output not found');
        } else {
          setData({ id: doc.id, ...doc.data() });
        }
      } catch (e: any) {
        console.error('Failed to load shared output', e);
        setError('Failed to load shared output');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;
  if (!data) return <div className="p-6">No data</div>;

  let parsedOutput: any = null;
  try {
    parsedOutput = typeof data.output === 'string' ? JSON.parse(data.output) : data.output;
  } catch (e) {
    parsedOutput = data.output;
  }

  const toolInfo = tools.find(t => t.id === data.toolId);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="text-center mb-6">
        <DocumentMagnifyingGlassIcon className="h-12 w-12 mx-auto text-accent mb-2" />
        <h1 className="text-2xl font-bold">Shared Result</h1>
        <p className="text-sm text-slate-400 mt-2">{data.toolName} — {data.category}</p>
      </div>

      {data.prompt && (
        <div className="mb-4 p-4 bg-primary rounded border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300">Prompt</h3>
          <pre className="whitespace-pre-wrap text-slate-300 mt-2">{data.prompt}</pre>
        </div>
      )}

      <div className="p-4 bg-primary rounded border border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Output</h3>
        {toolInfo && (toolInfo as any).renderOutput ? (
          // For MCQ shared pages we intentionally DO NOT pass the saved `options` back
          // into the renderer. Show the interactive quiz/result, but hide the original
          // options UI — instead surface a single "Generate New Quiz" action.
          <div className="text-slate-300">
            {(toolInfo as any).renderOutput(parsedOutput)}

            {toolInfo.id === 'mcq-generator' && (
              <div className="mt-4">
                <a
                  href={`${window.location.origin}/#/tool/${toolInfo.id}`}
                  className="inline-block py-2 px-4 bg-accent text-white rounded-md hover:opacity-90"
                >
                  Generate New Quiz
                </a>
              </div>
            )}
          </div>
        ) : (
          typeof parsedOutput === 'string' ? (
            <pre className="whitespace-pre-wrap text-slate-300">{parsedOutput}</pre>
          ) : (
            <pre className="whitespace-pre-wrap text-slate-300">{JSON.stringify(parsedOutput, null, 2)}</pre>
          )
        )}
      </div>

      <div className="mt-6 text-center">
        {toolInfo && (
          <a
            href={`${window.location.origin}/#/tool/${toolInfo.id}`}
            className="inline-block py-2 px-4 bg-sky-600 text-white rounded-md hover:opacity-95"
          >
            Use this tool
          </a>
        )}
      </div>
    </div>
  );
};

export default SharedOutputPage;
