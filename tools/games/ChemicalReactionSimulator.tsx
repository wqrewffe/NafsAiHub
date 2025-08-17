import React, { useState, useCallback, useMemo } from 'react';

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
    { name: 'Hydrogen', symbol: 'H', atomicNumber: 1 }, { name: 'Helium', symbol: 'He', atomicNumber: 2 },
    { name: 'Lithium', symbol: 'Li', atomicNumber: 3 }, { name: 'Beryllium', symbol: 'Be', atomicNumber: 4 },
    { name: 'Boron', symbol: 'B', atomicNumber: 5 }, { name: 'Carbon', symbol: 'C', atomicNumber: 6 },
    { name: 'Nitrogen', symbol: 'N', atomicNumber: 7 }, { name: 'Oxygen', symbol: 'O', atomicNumber: 8 },
    { name: 'Fluorine', symbol: 'F', atomicNumber: 9 }, { name: 'Neon', symbol: 'Ne', atomicNumber: 10 },
    { name: 'Sodium', symbol: 'Na', atomicNumber: 11 }, { name: 'Magnesium', symbol: 'Mg', atomicNumber: 12 },
    { name: 'Aluminum', symbol: 'Al', atomicNumber: 13 }, { name: 'Silicon', symbol: 'Si', atomicNumber: 14 },
    { name: 'Phosphorus', symbol: 'P', atomicNumber: 15 }, { name: 'Sulfur', symbol: 'S', atomicNumber: 16 },
    { name: 'Chlorine', symbol: 'Cl', atomicNumber: 17 }, { name: 'Argon', symbol: 'Ar', atomicNumber: 18 },
    { name: 'Potassium', symbol: 'K', atomicNumber: 19 }, { name: 'Calcium', symbol: 'Ca', atomicNumber: 20 },
    { name: 'Scandium', symbol: 'Sc', atomicNumber: 21 }, { name: 'Titanium', symbol: 'Ti', atomicNumber: 22 },
    { name: 'Vanadium', symbol: 'V', atomicNumber: 23 }, { name: 'Chromium', symbol: 'Cr', atomicNumber: 24 },
    { name: 'Manganese', symbol: 'Mn', atomicNumber: 25 }, { name: 'Iron', symbol: 'Fe', atomicNumber: 26 },
    { name: 'Cobalt', symbol: 'Co', atomicNumber: 27 }, { name: 'Nickel', symbol: 'Ni', atomicNumber: 28 },
    { name: 'Copper', symbol: 'Cu', atomicNumber: 29 }, { name: 'Zinc', symbol: 'Zn', atomicNumber: 30 },
    { name: 'Gallium', symbol: 'Ga', atomicNumber: 31 }, { name: 'Germanium', symbol: 'Ge', atomicNumber: 32 },
    { name: 'Arsenic', symbol: 'As', atomicNumber: 33 }, { name: 'Selenium', symbol: 'Se', atomicNumber: 34 },
    { name: 'Bromine', symbol: 'Br', atomicNumber: 35 }, { name: 'Krypton', symbol: 'Kr', atomicNumber: 36 },
    { name: 'Rubidium', symbol: 'Rb', atomicNumber: 37 }, { name: 'Strontium', symbol: 'Sr', atomicNumber: 38 },
    { name: 'Yttrium', symbol: 'Y', atomicNumber: 39 }, { name: 'Zirconium', symbol: 'Zr', atomicNumber: 40 },
    { name: 'Niobium', symbol: 'Nb', atomicNumber: 41 }, { name: 'Molybdenum', symbol: 'Mo', atomicNumber: 42 },
    { name: 'Technetium', symbol: 'Tc', atomicNumber: 43 }, { name: 'Ruthenium', symbol: 'Ru', atomicNumber: 44 },
    { name: 'Rhodium', symbol: 'Rh', atomicNumber: 45 }, { name: 'Palladium', symbol: 'Pd', atomicNumber: 46 },
    { name: 'Silver', symbol: 'Ag', atomicNumber: 47 }, { name: 'Cadmium', symbol: 'Cd', atomicNumber: 48 },
    { name: 'Indium', symbol: 'In', atomicNumber: 49 }, { name: 'Tin', symbol: 'Sn', atomicNumber: 50 },
    { name: 'Antimony', symbol: 'Sb', atomicNumber: 51 }, { name: 'Tellurium', symbol: 'Te', atomicNumber: 52 },
    { name: 'Iodine', symbol: 'I', atomicNumber: 53 }, { name: 'Xenon', symbol: 'Xe', atomicNumber: 54 },
    { name: 'Cesium', symbol: 'Cs', atomicNumber: 55 }, { name: 'Barium', symbol: 'Ba', atomicNumber: 56 },
    { name: 'Lanthanum', symbol: 'La', atomicNumber: 57 }, { name: 'Cerium', symbol: 'Ce', atomicNumber: 58 },
    { name: 'Praseodymium', symbol: 'Pr', atomicNumber: 59 }, { name: 'Neodymium', symbol: 'Nd', atomicNumber: 60 },
    { name: 'Promethium', symbol: 'Pm', atomicNumber: 61 }, { name: 'Samarium', symbol: 'Sm', atomicNumber: 62 },
    { name: 'Europium', symbol: 'Eu', atomicNumber: 63 }, { name: 'Gadolinium', symbol: 'Gd', atomicNumber: 64 },
    { name: 'Terbium', symbol: 'Tb', atomicNumber: 65 }, { name: 'Dysprosium', symbol: 'Dy', atomicNumber: 66 },
    { name: 'Holmium', symbol: 'Ho', atomicNumber: 67 }, { name: 'Erbium', symbol: 'Er', atomicNumber: 68 },
    { name: 'Thulium', symbol: 'Tm', atomicNumber: 69 }, { name: 'Ytterbium', symbol: 'Yb', atomicNumber: 70 },
    { name: 'Lutetium', symbol: 'Lu', atomicNumber: 71 }, { name: 'Hafnium', symbol: 'Hf', atomicNumber: 72 },
    { name: 'Tantalum', symbol: 'Ta', atomicNumber: 73 }, { name: 'Tungsten', symbol: 'W', atomicNumber: 74 },
    { name: 'Rhenium', symbol: 'Re', atomicNumber: 75 }, { name: 'Osmium', symbol: 'Os', atomicNumber: 76 },
    { name: 'Iridium', symbol: 'Ir', atomicNumber: 77 }, { name: 'Platinum', symbol: 'Pt', atomicNumber: 78 },
    { name: 'Gold', symbol: 'Au', atomicNumber: 79 }, { name: 'Mercury', symbol: 'Hg', atomicNumber: 80 },
    { name: 'Thallium', symbol: 'Tl', atomicNumber: 81 }, { name: 'Lead', symbol: 'Pb', atomicNumber: 82 },
    { name: 'Bismuth', symbol: 'Bi', atomicNumber: 83 }, { name: 'Polonium', symbol: 'Po', atomicNumber: 84 },
    { name: 'Astatine', symbol: 'At', atomicNumber: 85 }, { name: 'Radon', symbol: 'Rn', atomicNumber: 86 },
    { name: 'Francium', symbol: 'Fr', atomicNumber: 87 }, { name: 'Radium', symbol: 'Ra', atomicNumber: 88 },
    { name: 'Actinium', symbol: 'Ac', atomicNumber: 89 }, { name: 'Thorium', symbol: 'Th', atomicNumber: 90 },
    { name: 'Protactinium', symbol: 'Pa', atomicNumber: 91 }, { name: 'Uranium', symbol: 'U', atomicNumber: 92 },
    { name: 'Neptunium', symbol: 'Np', atomicNumber: 93 }, { name: 'Plutonium', symbol: 'Pu', atomicNumber: 94 },
    { name: 'Americium', symbol: 'Am', atomicNumber: 95 }, { name: 'Curium', symbol: 'Cm', atomicNumber: 96 },
    { name: 'Berkelium', symbol: 'Bk', atomicNumber: 97 }, { name: 'Californium', symbol: 'Cf', atomicNumber: 98 },
    { name: 'Einsteinium', symbol: 'Es', atomicNumber: 99 }, { name: 'Fermium', symbol: 'Fm', atomicNumber: 100 },
    { name: 'Mendelevium', symbol: 'Md', atomicNumber: 101 }, { name: 'Nobelium', symbol: 'No', atomicNumber: 102 },
    { name: 'Lawrencium', symbol: 'Lr', atomicNumber: 103 }, { name: 'Rutherfordium', symbol: 'Rf', atomicNumber: 104 },
    { name: 'Dubnium', symbol: 'Db', atomicNumber: 105 }, { name: 'Seaborgium', symbol: 'Sg', atomicNumber: 106 },
    { name: 'Bohrium', symbol: 'Bh', atomicNumber: 107 }, { name: 'Hassium', symbol: 'Hs', atomicNumber: 108 },
    { name: 'Meitnerium', symbol: 'Mt', atomicNumber: 109 }, { name: 'Darmstadtium', symbol: 'Ds', atomicNumber: 110 },
    { name: 'Roentgenium', symbol: 'Rg', atomicNumber: 111 }, { name: 'Copernicium', symbol: 'Cn', atomicNumber: 112 },
    { name: 'Nihonium', symbol: 'Nh', atomicNumber: 113 }, { name: 'Flerovium', symbol: 'Fl', atomicNumber: 114 },
    { name: 'Moscovium', symbol: 'Mc', atomicNumber: 115 }, { name: 'Livermorium', symbol: 'Lv', atomicNumber: 116 },
    { name: 'Tennessine', symbol: 'Ts', atomicNumber: 117 }, { name: 'Oganesson', symbol: 'Og', atomicNumber: 118 }
];

const temperatureLevels = ['Cryogenic (-100°C)', 'Room Temp (25°C)', 'Heated (300°C)', 'Incinerate (1000°C)'];
const pressureLevels = ['Vacuum (0 atm)', 'Atmospheric (1 atm)', 'High Pressure (100 atm)'];

const BeakerIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547A1.998 1.998 0 004 17.658V18a2 2 0 002 2h12a2 2 0 002-2v-.342a1.998 1.998 0 00-.244-1.016zM6 10a2 2 0 002-2V6a2 2 0 012-2h4a2 2 0 012 2v2a2 2 0 002 2M6 10a2 2 0 00-2 2v.341a7.9 7.9 0 002 0V10z" />
    </svg>
);

const Spinner = () => (
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
);

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

const AnalysisReportDisplay: React.FC<{ report: AnalysisReport | null, onReset: () => void }> = ({ report, onReset }) => {
    if (!report) return null;

    return (
        <div className="bg-slate-800 h-full p-4 rounded-lg border border-slate-700 space-y-3 animate-fade-in font-mono text-sm overflow-y-auto">
            <h3 className="text-lg font-bold text-cyan-400 text-center">[ ANALYSIS REPORT ]</h3>
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
            <button onClick={onReset} className="w-full mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 transition-colors">
                Run New Simulation
            </button>
        </div>
    );
};

const ChemicalReactionSimulator: React.FC = () => {
    const [selected, setSelected] = useState<string[]>([]);
    const [result, setResult] = useState<AnalysisReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [temperature, setTemperature] = useState(1);
    const [pressure, setPressure] = useState(1);

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

        // Simulate API call with mock data
        setTimeout(() => {
            const mockReaction: AnalysisReport = {
                equation: `${selected.join(' + ')} → Products`,
                productName: 'Simulated Compound',
                productState: 'Solid',
                reactionType: 'Synthesis Reaction',
                energyProfile: 'Mildly Exothermic (-50 kJ/mol)',
                hazardLevel: 'Low',
                observersLog: 'A gentle reaction occurred with slight warming and color change.',
                scientificPrinciple: 'The selected elements undergo a chemical combination forming new molecular bonds through electron sharing or transfer.'
            };
            setResult(mockReaction);
            setLoading(false);
        }, 2000);
    }, [selected, temperature, pressure]);

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
            <h1 className="text-3xl font-bold text-center mb-8 text-cyan-400">Chemical Reaction Simulator</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[70vh]">
                {/* Element Bank */}
                <div className="lg:col-span-2 bg-slate-800 p-6 rounded-lg border border-slate-700 h-[80vh] flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-4">Element Bank</h3>
                    <p className="text-sm text-slate-400 mb-4">Select up to 3 elements to combine</p>
                    
                    <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-cyan-600 scrollbar-track-slate-700 scrollbar-thumb-rounded-full">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
                            {elements.map(el => (
                                <button 
                                    key={el.name} 
                                    onClick={() => handleSelect(el.name)}
                                    disabled={!!result}
                                    className={`
                                        p-4 rounded-lg text-center transition-all duration-300 border-2 
                                        transform hover:scale-105 active:scale-95 min-h-[80px] flex flex-col justify-center
                                        ${selected.includes(el.name) 
                                            ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-500/20' 
                                            : 'bg-slate-700 border-slate-600 hover:border-cyan-400 hover:bg-slate-600 text-slate-200 disabled:opacity-50'
                                        }
                                    `}
                                >
                                    <div className="text-xs text-slate-400 mb-1">{el.atomicNumber}</div>
                                    <div className="text-2xl font-bold mb-1">{el.symbol}</div>
                                    <div className="text-xs truncate">{el.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Reaction Chamber */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                        <h3 className="text-xl font-bold text-white mb-4">Reaction Chamber</h3>
                        
                        <div className="mt-4 p-6 min-h-[8rem] bg-slate-900 border-2 border-slate-700 rounded-lg flex items-center justify-center">
                            <BeakerIcon className="h-12 w-12 text-slate-500 mr-4" />
                            <p className="text-2xl text-slate-300 font-mono">
                                {selected.join(' + ') || 'Select elements...'}
                            </p>
                        </div>

                        <div className="mt-6 space-y-6">
                            <div>
                                <label className="block text-base font-medium text-slate-300 mb-2">
                                    Temperature: <span className="text-cyan-400 font-bold">{temperatureLevels[temperature]}</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="3" 
                                    value={temperature} 
                                    onChange={(e) => setTemperature(parseInt(e.target.value, 10))} 
                                    disabled={!!result || loading} 
                                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" 
                                />
                            </div>
                            <div>
                                <label className="block text-base font-medium text-slate-300 mb-2">
                                    Pressure: <span className="text-cyan-400 font-bold">{pressureLevels[pressure]}</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="2" 
                                    value={pressure} 
                                    onChange={(e) => setPressure(parseInt(e.target.value, 10))} 
                                    disabled={!!result || loading} 
                                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" 
                                />
                            </div>
                        </div>
                        
                        {error && <p className="mt-4 text-red-400 text-sm text-center">{error}</p>}

                        <div className="mt-6 flex gap-4">
                            <button 
                                onClick={handleCombine} 
                                disabled={loading || !!result || selected.length < 2}
                                className="flex-1 flex justify-center items-center py-3 px-6 rounded-lg text-lg font-medium text-white bg-cyan-600 disabled:bg-slate-600 hover:bg-cyan-700 transition-colors min-h-[50px]"
                            >
                                {loading ? <Spinner /> : 'COMBINE ELEMENTS'}
                            </button>
                            <button 
                                onClick={handleReset} 
                                disabled={loading}
                                className="py-3 px-6 rounded-lg text-lg font-medium bg-slate-600 hover:bg-slate-500 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Analysis Report */}
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 min-h-[400px]">
                        <h3 className="text-xl font-bold text-white mb-4">Analysis Report</h3>
                        <div className="h-full">
                            {loading && (
                                <div className="flex justify-center items-center h-full">
                                    <div className="text-center">
                                        <Spinner />
                                        <p className="mt-4 text-slate-400">Analyzing reaction...</p>
                                    </div>
                                </div>
                            )}
                            {!loading && result && <AnalysisReportDisplay report={result} onReset={handleReset} />}
                            {!loading && !result && (
                                <div className="bg-slate-900 h-full p-6 rounded-lg border border-slate-700 flex items-center justify-center text-slate-500">
                                    <div className="text-center">
                                        <BeakerIcon className="h-16 w-16 mx-auto mb-4" />
                                        <p className="text-xl font-mono">[ Awaiting Analysis... ]</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Export function for history rendering
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
    return <AnalysisReportDisplay report={data} onReset={() => {}} />;
};

export default ChemicalReactionSimulator;