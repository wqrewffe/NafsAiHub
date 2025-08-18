import React, { useState, useCallback, useMemo } from 'react';
import { generateJson, GenAiType } from '../../services/geminiService';
import { useAuth } from '../../hooks/useAuth';
import { logToolUsage } from '../../services/firebaseService';
import Spinner from '../../components/Spinner';
import { BeakerIcon, FireIcon, ShieldCheckIcon } from '../Icons';

interface AnalysisReport {
    equation: string;
    productName: string;
    productState: 'Solid' | 'Liquid' | 'Gas' | 'Plasma' | 'No Reaction';
    reactionType: string;
    energyProfile: string;
    hazardLevel: 'None' | 'Low' | 'Medium' | 'High' | 'Critical';
    observersLog: string;
    scientificPrinciple: string;
}

const elements = [
    { name: 'Hydrogen', symbol: 'H' }, { name: 'Helium', symbol: 'He' },
    { name: 'Lithium', symbol: 'Li' }, { name: 'Beryllium', symbol: 'Be' },
    { name: 'Boron', symbol: 'B' }, { name: 'Carbon', symbol: 'C' },
    { name: 'Nitrogen', symbol: 'N' }, { name: 'Oxygen', symbol: 'O' },
    { name: 'Fluorine', symbol: 'F' }, { name: 'Neon', symbol: 'Ne' },
    { name: 'Sodium', symbol: 'Na' }, { name: 'Magnesium', symbol: 'Mg' },
    { name: 'Aluminum', symbol: 'Al' }, { name: 'Silicon', symbol: 'Si' },
    { name: 'Phosphorus', symbol: 'P' }, { name: 'Sulfur', symbol: 'S' },
    { name: 'Chlorine', symbol: 'Cl' }, { name: 'Argon', symbol: 'Ar' },
    { name: 'Potassium', symbol: 'K' }, { name: 'Calcium', symbol: 'Ca' },
    { name: 'Scandium', symbol: 'Sc' }, { name: 'Titanium', symbol: 'Ti' },
    { name: 'Vanadium', symbol: 'V' }, { name: 'Chromium', symbol: 'Cr' },
    { name: 'Manganese', symbol: 'Mn' }, { name: 'Iron', symbol: 'Fe' },
    { name: 'Cobalt', symbol: 'Co' }, { name: 'Nickel', symbol: 'Ni' },
    { name: 'Copper', symbol: 'Cu' }, { name: 'Zinc', symbol: 'Zn' },
    { name: 'Gallium', symbol: 'Ga' }, { name: 'Germanium', symbol: 'Ge' },
    { name: 'Arsenic', symbol: 'As' }, { name: 'Selenium', symbol: 'Se' },
    { name: 'Bromine', symbol: 'Br' }, { name: 'Krypton', symbol: 'Kr' },
    { name: 'Rubidium', symbol: 'Rb' }, { name: 'Strontium', symbol: 'Sr' },
    { name: 'Yttrium', symbol: 'Y' }, { name: 'Zirconium', symbol: 'Zr' },
    { name: 'Niobium', symbol: 'Nb' }, { name: 'Molybdenum', symbol: 'Mo' },
    { name: 'Technetium', symbol: 'Tc' }, { name: 'Ruthenium', symbol: 'Ru' },
    { name: 'Rhodium', symbol: 'Rh' }, { name: 'Palladium', symbol: 'Pd' },
    { name: 'Silver', symbol: 'Ag' }, { name: 'Cadmium', symbol: 'Cd' },
    { name: 'Indium', symbol: 'In' }, { name: 'Tin', symbol: 'Sn' },
    { name: 'Antimony', symbol: 'Sb' }, { name: 'Tellurium', symbol: 'Te' },
    { name: 'Iodine', symbol: 'I' }, { name: 'Xenon', symbol: 'Xe' },
    { name: 'Cesium', symbol: 'Cs' }, { name: 'Barium', symbol: 'Ba' },
    { name: 'Lanthanum', symbol: 'La' }, { name: 'Cerium', symbol: 'Ce' },
    { name: 'Praseodymium', symbol: 'Pr' }, { name: 'Neodymium', symbol: 'Nd' },
    { name: 'Promethium', symbol: 'Pm' }, { name: 'Samarium', symbol: 'Sm' },
    { name: 'Europium', symbol: 'Eu' }, { name: 'Gadolinium', symbol: 'Gd' },
    { name: 'Terbium', symbol: 'Tb' }, { name: 'Dysprosium', symbol: 'Dy' },
    { name: 'Holmium', symbol: 'Ho' }, { name: 'Erbium', symbol: 'Er' },
    { name: 'Thulium', symbol: 'Tm' }, { name: 'Ytterbium', symbol: 'Yb' },
    { name: 'Lutetium', symbol: 'Lu' }, { name: 'Hafnium', symbol: 'Hf' },
    { name: 'Tantalum', symbol: 'Ta' }, { name: 'Tungsten', symbol: 'W' },
    { name: 'Rhenium', symbol: 'Re' }, { name: 'Osmium', symbol: 'Os' },
    { name: 'Iridium', symbol: 'Ir' }, { name: 'Platinum', symbol: 'Pt' },
    { name: 'Gold', symbol: 'Au' }, { name: 'Mercury', symbol: 'Hg' },
    { name: 'Thallium', symbol: 'Tl' }, { name: 'Lead', symbol: 'Pb' },
    { name: 'Bismuth', symbol: 'Bi' }, { name: 'Polonium', symbol: 'Po' },
    { name: 'Astatine', symbol: 'At' }, { name: 'Radon', symbol: 'Rn' },
    { name: 'Francium', symbol: 'Fr' }, { name: 'Radium', symbol: 'Ra' },
    { name: 'Actinium', symbol: 'Ac' }, { name: 'Thorium', symbol: 'Th' },
    { name: 'Protactinium', symbol: 'Pa' }, { name: 'Uranium', symbol: 'U' },
    { name: 'Neptunium', symbol: 'Np' }, { name: 'Plutonium', symbol: 'Pu' },
    { name: 'Americium', symbol: 'Am' }, { name: 'Curium', symbol: 'Cm' },
    { name: 'Berkelium', symbol: 'Bk' }, { name: 'Californium', symbol: 'Cf' },
    { name: 'Einsteinium', symbol: 'Es' }, { name: 'Fermium', symbol: 'Fm' },
    { name: 'Mendelevium', symbol: 'Md' }, { name: 'Nobelium', symbol: 'No' },
    { name: 'Lawrencium', symbol: 'Lr' }, { name: 'Rutherfordium', symbol: 'Rf' },
    { name: 'Dubnium', symbol: 'Db' }, { name: 'Seaborgium', symbol: 'Sg' },
    { name: 'Bohrium', symbol: 'Bh' }, { name: 'Hassium', symbol: 'Hs' },
    { name: 'Meitnerium', symbol: 'Mt' }, { name: 'Darmstadtium', symbol: 'Ds' },
    { name: 'Roentgenium', symbol: 'Rg' }, { name: 'Copernicium', symbol: 'Cn' },
    { name: 'Nihonium', symbol: 'Nh' }, { name: 'Flerovium', symbol: 'Fl' },
    { name: 'Moscovium', symbol: 'Mc' }, { name: 'Livermorium', symbol: 'Lv' },
    { name: 'Tennessine', symbol: 'Ts' }, { name: 'Oganesson', symbol: 'Og' },
];

const temperatureLevels = ['Cryogenic (-100°C)', 'Room Temp (25°C)', 'Heated (300°C)', 'Incinerate (1000°C)'];
const pressureLevels = ['Vacuum (0 atm)', 'Atmospheric (1 atm)', 'High Pressure (100 atm)'];

const HazardDisplay: React.FC<{ level: AnalysisReport['hazardLevel'] }> = ({ level }) => {
    const levelInfo = useMemo(() => {
        switch (level) {
            case 'Critical': return { text: 'CRITICAL', color: 'bg-red-700 border-red-500 text-red-300', iconColor: 'text-red-400 animate-ping' };
            case 'High': return { text: 'HIGH', color: 'bg-red-500/50 border-red-500/70 text-red-400', iconColor: 'text-red-500 animate-pulse' };
            case 'Medium': return { text: 'MEDIUM', color: 'bg-yellow-500/50 border-yellow-500/70 text-yellow-400', iconColor: 'text-yellow-500' };
            case 'Low': return { text: 'LOW', color: 'bg-green-500/50 border-green-500/70 text-green-400', iconColor: 'text-green-500' };
            case 'None': return { text: 'NONE', color: 'bg-slate-700 border-slate-600 text-slate-300', iconColor: 'text-slate-400' };
            default: return { text: 'N/A', color: 'bg-slate-700', iconColor: 'text-slate-400' };
        }
    }, [level]);

    return (
        <div className={`p-2 rounded-md border text-center ${levelInfo.color}`}>
            <p className="font-bold text-sm">HAZARD LEVEL: {levelInfo.text}</p>
        </div>
    );
};


const AnalysisReportDisplay: React.FC<{ report: AnalysisReport | null, onReset: () => void, isHistory?: boolean }> = ({ report, onReset, isHistory = false }) => {
    if (!report) return null;

    return (
        <div className="bg-primary h-full p-4 rounded-lg border border-slate-700 space-y-3 animate-fade-in font-mono text-sm overflow-y-auto">
            <h3 className="text-lg font-bold text-accent text-center">[ ANALYSIS REPORT ]</h3>
            <HazardDisplay level={report.hazardLevel} />
            <div>
                <p className="text-sky-400 font-bold">&gt; EQUATION:</p>
                <p className="pl-4 bg-slate-900/50 rounded py-1">{report.equation}</p>
            </div>
            <div>
                <p className="text-sky-400 font-bold">&gt; PRODUCT:</p>
                <p className="pl-4">{report.productName} ({report.productState})</p>
            </div>
            <div>
                <p className="text-sky-400 font-bold">&gt; REACTION TYPE:</p>
                <p className="pl-4">{report.reactionType}</p>
            </div>
            <div>
                <p className="text-sky-400 font-bold">&gt; ENERGY PROFILE:</p>
                <p className="pl-4">{report.energyProfile}</p>
            </div>
            <div>
                <p className="text-sky-400 font-bold">&gt; OBSERVER'S LOG:</p>
                <p className="pl-4 italic">"{report.observersLog}"</p>
            </div>
            <div>
                <p className="text-sky-400 font-bold">&gt; SCIENTIFIC PRINCIPLE:</p>
                <p className="pl-4 text-xs whitespace-pre-wrap">{report.scientificPrinciple}</p>
            </div>
            {!isHistory && (
                 <button onClick={onReset} className="w-full mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent btn-animated">
                    Run New Simulation
                </button>
            )}
        </div>
    );
};

export const renderChemicalReactionSimulatorOutput = (output: AnalysisReport | string) => {
    let data: AnalysisReport;
    if (typeof output === 'string') {
        try {
            data = JSON.parse(output);
        } catch(e) {
            return <p className="text-red-400">Could not parse history data.</p>;
        }
    } else {
        data = output;
    }
    return <AnalysisReportDisplay report={data} onReset={() => {}} isHistory={true} />;
}

const ChemicalReactionSimulator: React.FC = () => {
    const [selected, setSelected] = useState<string[]>([]);
    const [result, setResult] = useState<AnalysisReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { currentUser } = useAuth();
    
    const [temperature, setTemperature] = useState(1); // 0-3 scale
    const [pressure, setPressure] = useState(1); // 0-2 scale

    const handleSelect = (elementName: string) => {
        if (result || selected.length >= 3) return;
        if (selected.includes(elementName)) {
            setSelected(prev => prev.filter(e => e !== elementName));
        } else {
            setSelected(prev => [...prev, elementName]);
        }
    };
    
    const handleReset = () => {
        setSelected([]);
        setResult(null);
        setError('');
        setTemperature(1);
        setPressure(1);
    };

    const handleCombine = useCallback(async () => {
        if (selected.length < 2) {
            setError('Please select 2 or 3 elements to combine.');
            return;
        }
        setError('');
        setLoading(true);

        const schema = {
            type: GenAiType.OBJECT,
            properties: {
                equation: { type: GenAiType.STRING },
                productName: { type: GenAiType.STRING },
                productState: { type: GenAiType.STRING, enum: ['Solid', 'Liquid', 'Gas', 'Plasma', 'No Reaction'] },
                reactionType: { type: GenAiType.STRING },
                energyProfile: { type: GenAiType.STRING },
                hazardLevel: { type: GenAiType.STRING, enum: ['None', 'Low', 'Medium', 'High', 'Critical'] },
                observersLog: { type: GenAiType.STRING },
                scientificPrinciple: { type: GenAiType.STRING }
            },
            required: ["equation", "productName", "productState", "reactionType", "energyProfile", "hazardLevel", "observersLog", "scientificPrinciple"]
        };

        const promptText = `Simulate a chemical reaction under specific conditions.
            Elements to combine: [${selected.join(', ')}]
            Temperature: ${temperatureLevels[temperature]}
            Pressure: ${pressureLevels[pressure]}
            Provide a detailed analysis. If no reaction occurs, state that clearly in all fields.
            The analysis must include:
            1. A balanced chemical equation. If no reaction, state "N/A".
            2. The primary product's common name. If multiple, list the main one. If no reaction, state "No reaction".
            3. The state of the product (Solid, Liquid, Gas, Plasma, or No Reaction).
            4. The type of reaction (e.g., Synthesis, Combustion, Redox).
            5. The energy profile (e.g., Highly Exothermic, Mildly Endothermic).
            6. A hazard level from None, Low, Medium, High, Critical.
            7. An "Observer's Log" describing the visual/sensory phenomena of the reaction.
            8. A "Scientific Principle" explaining the chemistry at play in simple terms.`;
        
        try {
            const reactionResult = await generateJson(promptText, schema);
            setResult(reactionResult);
            if (currentUser) {
                const historyPrompt = `Combine: ${selected.join(', ')} at ${temperatureLevels[temperature]} & ${pressureLevels[pressure]}`;
                const historyResponse = JSON.stringify(reactionResult, null, 2);
                await logToolUsage(
                    currentUser.uid,
                    { id: 'chemical-reaction-simulator', name: 'Chemical Reaction Simulator', category: 'Games & Entertainment' },
                    historyPrompt,
                    historyResponse
                );
            }
        } catch (err: any) {
            setError(err.message || 'Failed to get reaction data.');
        } finally {
            setLoading(false);
        }
    }, [selected, temperature, pressure, currentUser]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[60vh]">
            {/* Element Bank */}
            <div className="lg:col-span-2 bg-secondary p-4 rounded-lg">
                <h3 className="text-lg font-bold text-light mb-2">Element Bank</h3>
                 <p className="text-xs text-slate-400 mb-3">Select up to 3 elements.</p>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1">
                    {elements.map(el => (
                        <button key={el.name} onClick={() => handleSelect(el.name)}
                            disabled={!!result}
                            className={`p-1 rounded-md text-center transition-all duration-200 border-2 transform active:scale-95 hover:scale-105 ${selected.includes(el.name) ? 'bg-accent/80 border-accent text-primary' : 'bg-primary border-slate-700 hover:border-accent disabled:opacity-50'}`}
                        >
                            <p className="text-xl font-bold">{el.symbol}</p>
                            <p className="text-[0.6rem] truncate">{el.name}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Reaction Chamber */}
            <div className="lg:col-span-3 bg-secondary p-4 rounded-lg flex flex-col justify-between">
                <div>
                    <h3 className="text-lg font-bold text-light mb-2">Reaction Chamber</h3>
                    <div className="mt-4 p-4 min-h-[6rem] bg-primary border border-slate-700 rounded-lg flex items-center justify-center">
                        <BeakerIcon className="h-8 w-8 text-slate-500 mr-4" />
                        <p className="text-xl text-slate-300 font-mono">
                            {selected.join(' + ') || 'Select elements...'}
                        </p>
                    </div>

                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300">Temperature: <span className="text-accent font-bold">{temperatureLevels[temperature]}</span></label>
                            <input type="range" min="0" max="3" value={temperature} onChange={(e) => setTemperature(parseInt(e.target.value, 10))} disabled={!!result || loading} className="w-full h-2 bg-primary rounded-lg appearance-none cursor-pointer accent-accent" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-300">Pressure: <span className="text-accent font-bold">{pressureLevels[pressure]}</span></label>
                            <input type="range" min="0" max="2" value={pressure} onChange={(e) => setPressure(parseInt(e.target.value, 10))} disabled={!!result || loading} className="w-full h-2 bg-primary rounded-lg appearance-none cursor-pointer accent-accent" />
                        </div>
                    </div>
                     {error && <p className="mt-2 text-red-400 text-sm text-center">{error}</p>}
                </div>

                 <div className="mt-4 flex gap-3">
                    <button onClick={handleCombine} disabled={loading || !!result || selected.length < 2}
                        className="flex-1 flex justify-center items-center py-3 px-4 rounded-md text-md font-medium text-white bg-accent disabled:bg-slate-500 btn-animated"
                    >
                        {loading ? <Spinner /> : 'COMBINE'}
                    </button>
                     <button onClick={handleReset} disabled={loading}
                        className="py-3 px-4 rounded-md text-md font-medium bg-slate-600 hover:bg-slate-500 btn-animated"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Analysis Report */}
            <div className="lg:col-span-5 bg-secondary p-4 rounded-lg min-h-[300px]">
                 <h3 className="text-lg font-bold text-light mb-2">Analysis Report</h3>
                 <div className="h-full">
                    {loading && <div className="flex justify-center items-center h-full"><Spinner /></div>}
                    {!loading && result && <AnalysisReportDisplay report={result} onReset={handleReset} />}
                    {!loading && !result && (
                        <div className="bg-primary h-full p-4 rounded-lg border border-slate-700 flex items-center justify-center text-slate-500">
                           [ Awaiting Analysis... ]
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default ChemicalReactionSimulator;