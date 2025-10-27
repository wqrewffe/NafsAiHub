
import React, { useState } from 'react';
import { generateJson, GenAiType } from '../../services/geminiService';
import { useAuth } from '../../hooks/useAuth';
import { logToolUsage } from '../../services/firebaseService';
import Spinner from '../../components/Spinner';

interface BodyData {
    name: string;
    type: string;
    diameter: string;
    keyFeature: string;
    funFact: string;
}

const celestialBodies = [
    'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 
    'Saturn', 'Uranus', 'Neptune',
    'The Moon', 'Phobos', 'Europa', 'Titan', 'Triton', 'Pluto'
];

const DataCard: React.FC<{ data: BodyData }> = ({ data }) => (
    <div className="bg-primary p-4 rounded-lg border border-slate-700 space-y-3 animate-fade-in">
        <h3 className="text-3xl font-bold text-accent">{data.name}</h3>
        <p><strong className="text-slate-300">Type:</strong> {data.type}</p>
        <p><strong className="text-slate-300">Diameter:</strong> {data.diameter}</p>
        <p><strong className="text-slate-300">Key Feature:</strong> {data.keyFeature}</p>
        <div className="border-l-4 border-accent pl-3 mt-2">
            <p className="italic text-slate-300">"{data.funFact}"</p>
        </div>
    </div>
);

export const renderCosmicExplorerOutput = (output: BodyData | string) => {
    let data: BodyData;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch(e) {
            return <p className="text-red-400">Could not parse history data.</p>;
        }
    } else {
        data = output;
    }
    return <DataCard data={data} />;
}

const CosmicExplorer: React.FC = () => {
    const [selectedBody, setSelectedBody] = useState<BodyData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { currentUser } = useAuth();
    const [activeButton, setActiveButton] = useState<string | null>(null);

    const handleSelect = async (name: string) => {
        setLoading(true);
        setError('');
        setSelectedBody(null);
        setActiveButton(name);

        const schema = {
            type: GenAiType.OBJECT,
            properties: {
                name: { type: GenAiType.STRING },
                type: { type: GenAiType.STRING, description: "e.g., 'Rocky Planet', 'Gas Giant', 'Moon'" },
                diameter: { type: GenAiType.STRING, description: "Diameter in kilometers, e.g., '12,742 km'" },
                keyFeature: { type: GenAiType.STRING, description: "Most notable feature, e.g., 'Great Red Spot'" },
                funFact: { type: GenAiType.STRING }
            },
            required: ["name", "type", "diameter", "keyFeature", "funFact"]
        };
        const prompt = `Generate a data card for the celestial body: ${name}. Provide its name, type, diameter, a key feature, and a fun fact.`;

        try {
            const bodyData = await generateJson(prompt, schema);
            setSelectedBody(bodyData);
             if (currentUser) {
                const historyResponse = JSON.stringify(bodyData, null, 2);
                await logToolUsage(
                    currentUser.uid,
                    { id: 'cosmic-explorer', name: 'Cosmic Explorer', category: 'Games & Entertainment' },
                    name,
                    historyResponse
                );
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch celestial data.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                 <h3 className="text-lg font-bold text-light mb-2">Select a Destination</h3>
                 <div className="space-y-2">
                    {celestialBodies.map(name => (
                        <button key={name} onClick={() => handleSelect(name)}
                            className={`w-full text-left p-3 rounded-md transition-all duration-200 transform hover:scale-105 hover:bg-accent hover:text-primary ${activeButton === name ? 'bg-accent text-primary' : 'bg-secondary'}`}
                        >
                            {name}
                        </button>
                    ))}
                 </div>
            </div>
            <div className="md:col-span-2">
                <h3 className="text-lg font-bold text-light mb-2">Data Card</h3>
                <div className="h-full">
                    {loading && <div className="flex justify-center items-center h-full"><Spinner /></div>}
                    {error && <p className="text-red-400">{error}</p>}
                    {selectedBody && <DataCard data={selectedBody} />}
                    {!loading && !selectedBody && (
                        <div className="bg-primary h-full p-4 rounded-lg border border-slate-700 flex items-center justify-center text-slate-500">
                            Select a celestial body to explore.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CosmicExplorer;
