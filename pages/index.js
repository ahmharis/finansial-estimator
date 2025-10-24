import React, { useState, useEffect } from 'react';
// import Head from 'next/head';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Home() {
  const [currentPage, setCurrentPage] = useState(1);
  const [financialData, setFinancialData] = useState({ location: {} });
  const [projectionResults, setProjectionResults] = useState({});
  const [message, setMessage] = useState(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [locLoaders, setLocLoaders] = useState({});
  const [locationInputs, setLocationInputs] = useState({ prov: '', kab: '', kec: '', kel: '' });

  const [coreBusinessIdea, setCoreBusinessIdea] = useState('');
  const [ctxJualan, setCtxJualan] = useState('');
  const [ctxPelanggan, setCtxPelanggan] = useState('');
  const [ctxOperasional, setCtxOperasional] = useState('');
  const [ctxRencana, setCtxRencana] = useState('');
  const [ctxFaktorLuar, setCtxFaktorLuar] = useState('');
  const [locationNotes, setLocationNotes] = useState('');

  const [pendapatanStr, setPendapatanStr] = useState('');
  const [biayaTetapStr, setBiayaTetapStr] = useState('');
  const [cashOnHandStr, setCashOnHandStr] = useState('');
  const [arpuStr, setArpuStr] = useState('');
  const [marketingCostStr, setMarketingCostStr] = useState('');
  const [biayaVariabel, setBiayaVariabel] = useState('');
  const [horizon, setHorizon] = useState('12');
  const [growthRate, setGrowthRate] = useState('');
  const [currency, setCurrency] = useState('IDR');
  
  const [analysisResult, setAnalysisResult] = useState('');

  const [accessCode, setAccessCode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const apiBaseUrl = "https://ibnux.github.io/data-indonesia/";

  const formatCurrency = (value, currency = "IDR") => {
    try {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    } catch (e) {
      return `${currency} ${Math.round(value).toLocaleString('id-ID')}`;
    }
  };

  const cleanCurrencyValue = (value) => {
    return value.replace(/\./g, '');
  };

  const handleCurrencyChange = (setter) => (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const formatted = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setter(formatted);
  };

  const formatMarkdown = (text) => {
    let html = text
      .replace(/^### (.*)$/gm, '<h3 class="text-xl font-semibold mt-6 mb-2 pb-1 border-b border-gray-200">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/^\s*---\s*$/gm, '<hr class="my-6 border-gray-200">');

    html = html.split('\n').map(line => {
      line = line.trim();
      if (line.match(/^[\*\-]\s+(.*)$/)) {
        return '<li>' + line.replace(/^[\*\-]\s+/, '') + '</li>';
      }
      return line;
    }).join('\n');

    html = html.replace(/(\<li\>.*?\<\/li\>)/gs, '<ul class="list-disc pl-6 space-y-1 my-2">$1</ul>')
               .replace(/<\/ul\>\n?\<ul class="list-disc pl-6 space-y-1 my-2"\>/g, '');

    html = html.replace(/<\/ul\>\n/g, '</ul>')
               .replace(/\n\<ul/g, '<ul')
               .replace(/<\/li\>\n/g, '</li>')
               .replace(/\n\<li\>/g, '<li>')
               .replace(/<\/h3\>\n/g, '</h3>')
               .replace(/\n\<h3\>/g, '<h3>')
               .replace(/<\/hr\>\n/g, '</hr>')
               .replace(/\n\<hr\>/g, '<hr>')
               .replace(/\n/g, '<br>');

    html = html.replace(/<br>\s*<h3>/g, '<h3>')
               .replace(/<br>\s*<ul/g, '<ul')
               .replace(/<br>\s*<hr/g, '<hr>')
               .replace(/<\/ul><br>/g, '</ul>')
               .replace(/<\/h3><br>/g, '</h3>')
               .replace(/<\/hr><br>/g, '</hr>');

    return html;
  };

  const showMessage = (msg) => {
    setMessage(msg);
  };

  const hideMessage = () => {
    setMessage(null);
  };

  const showPage = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  const nextPage = (pageNumber) => {
    if (pageNumber === 2) {
      const jualan = ctxJualan;
      const ide = coreBusinessIdea;
      const lokasi = financialData.location.provinsi;
      if (!jualan && !ide && !lokasi) {
        showMessage('Harap isi minimal "Ide Bisnis Inti", "Lokasi Usaha" (minimal provinsi), atau "Data Jualan" untuk melanjutkan.');
        return;
      }
      
      setFinancialData(prev => ({
          ...prev,
          core_business_idea: coreBusinessIdea,
          location: {
              ...prev.location,
              notes: locationNotes
          },
          ctx_jualan: ctxJualan,
          ctx_pelanggan: ctxPelanggan,
          ctx_operasional: ctxOperasional,
          ctx_rencana: ctxRencana,
          ctx_faktor_luar: ctxFaktorLuar
      }));

      showPage(2);
    }
  };

  useEffect(() => {
    const initLocationPicker = async () => {
      setLocLoaders(prev => ({ ...prev, prov: true }));
      try {
        const response = await fetch(`${apiBaseUrl}provinsi.json`);
        if (!response.ok) throw new Error('Gagal memuat data provinsi');
        const data = await response.json();
        setProvinces(data);
      } catch (error) {
        console.error(error);
        showMessage(error.message);
      } finally {
        setLocLoaders(prev => ({ ...prev, prov: false }));
      }
    };
    initLocationPicker();
  }, []);

  const fetchKabupaten = async (e) => {
    const provId = e.target.value;
    const provName = e.target.options[e.target.selectedIndex].text;
    setLocationInputs(prev => ({ ...prev, prov: provId, kab: '', kec: '', kel: '' }));
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    
    if (!provId) {
      setFinancialData(prev => ({ ...prev, location: {} }));
      return;
    }

    setFinancialData(prev => ({ ...prev, location: { provinsi: provName } }));
    setLocLoaders(prev => ({ ...prev, kab: true }));

    try {
      const response = await fetch(`${apiBaseUrl}kabupaten/${provId}.json`);
      if (!response.ok) throw new Error('Gagal memuat data kabupaten');
      const data = await response.json();
      setRegencies(data);
    } catch (error) {
      console.error(error);
      showMessage(error.message);
    } finally {
      setLocLoaders(prev => ({ ...prev, kab: false }));
    }
  };

  const fetchKecamatan = async (e) => {
    const kabId = e.target.value;
    const kabName = e.target.options[e.target.selectedIndex].text;
    setLocationInputs(prev => ({ ...prev, kab: kabId, kec: '', kel: '' }));
    setDistricts([]);
    setVillages([]);

    if (!kabId) {
       setFinancialData(prev => ({ ...prev, location: { provinsi: prev.location.provinsi } }));
      return;
    }

    setFinancialData(prev => ({ ...prev, location: { ...prev.location, kabupaten: kabName } }));
    setLocLoaders(prev => ({ ...prev, kec: true }));

    try {
      const response = await fetch(`${apiBaseUrl}kecamatan/${kabId}.json`);
      if (!response.ok) throw new Error('Gagal memuat data kecamatan');
      const data = await response.json();
      setDistricts(data);
    } catch (error) {
      console.error(error);
      showMessage(error.message);
    } finally {
      setLocLoaders(prev => ({ ...prev, kec: false }));
    }
  };

  const fetchKelurahan = async (e) => {
    const kecId = e.target.value;
    const kecName = e.target.options[e.target.selectedIndex].text;
    setLocationInputs(prev => ({ ...prev, kec: kecId, kel: '' }));
    setVillages([]);

    if (!kecId) {
      setFinancialData(prev => ({ ...prev, location: { ...prev.location, kabupaten: prev.location.kabupaten } }));
      return;
    }

    setFinancialData(prev => ({ ...prev, location: { ...prev.location, kecamatan: kecName } }));
    setLocLoaders(prev => ({ ...prev, kel: true }));

    try {
      const response = await fetch(`${apiBaseUrl}kelurahan/${kecId}.json`);
      if (!response.ok) throw new Error('Gagal memuat data kelurahan');
      const data = await response.json();
      setVillages(data);
    } catch (error) {
      console.error(error);
      showMessage(error.message);
    } finally {
      setLocLoaders(prev => ({ ...prev, kel: false }));
    }
  };

  const saveKelurahan = (e) => {
    const kelId = e.target.value;
    const kelName = e.target.options[e.target.selectedIndex].text;
    if (!kelId) return;
    setLocationInputs(prev => ({ ...prev, kel: kelId }));
    setFinancialData(prev => ({ ...prev, location: { ...prev.location, kelurahan: kelName } }));
  };

  const handleAccessSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/autentikasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
      } else {
        throw new Error(data.message || 'Kode akses tidak valid');
      }
    } catch (error) {
      console.error(error);
      showMessage(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const getContextAnalysis = async () => {
    const coreIdea = coreBusinessIdea;
    if (!coreIdea) {
      showMessage("Mohon isi ide bisnis inti Anda terlebih dahulu.");
      return;
    }

    setIsLoadingContext(true);
    const loc = financialData.location;
    const locationString = [loc.kelurahan, loc.kecamatan, loc.kabupaten, loc.provinsi, locationNotes].filter(Boolean).join(', ');

    try {
      const response = await fetch('/api/konteks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coreIdea, locationString }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal membuat draf');
      }
      
      setCtxJualan(data.jualan || '');
      setCtxPelanggan(data.pelanggan || '');
      setCtxOperasional(data.operasional || '');
      setCtxRencana(data.rencana || '');
      setCtxFaktorLuar(data.faktor_luar || '');

    } catch (error) {
      console.error("Error fetching context analysis:", error);
      showMessage(`Gagal membuat draf: ${error.message}`);
    } finally {
      setIsLoadingContext(false);
    }
  };

  const runScenario = (inputs, growthRate) => {
    let projectionData = [];
    let currentRevenue = inputs.pendapatan;
    let cumulativeProfit = 0;
    let currentCash = inputs.cashOnHand;
    let totalRevenue = 0;
    let totalNetProfit = 0;
    let bepMonth = null;
    let runwayMonths = null;

    for (let i = 1; i <= inputs.horizon; i++) {
      let revenue = (i === 1) ? currentRevenue : currentRevenue * (1 + growthRate);
      let variableCost = revenue * inputs.biayaVariabelPct;
      let fixedCost = inputs.biayaTetap + inputs.marketingCost;
      let totalCost = variableCost + fixedCost;
      let netProfit = revenue - totalCost;
      
      cumulativeProfit += netProfit;
      currentCash += netProfit;
      totalRevenue += revenue;
      totalNetProfit += netProfit;

      if (!bepMonth && cumulativeProfit > 0) {
        bepMonth = i;
      }

      projectionData.push({
        month: i,
        revenue: revenue,
        variableCost: variableCost,
        fixedCost: fixedCost,
        totalCost: totalCost,
        netProfit: netProfit,
        cumulativeProfit: cumulativeProfit,
        cashAtEnd: currentCash
      });

      currentRevenue = revenue;
    }

    if (totalNetProfit < 0) {
      let avgMonthlyLoss = Math.abs(totalNetProfit / inputs.horizon);
      if (avgMonthlyLoss > 0) {
        runwayMonths = inputs.cashOnHand / avgMonthlyLoss;
      }
    }

    return {
      data: projectionData,
      totalRevenue: totalRevenue,
      totalNetProfit: totalNetProfit,
      bepMonth: bepMonth,
      runwayMonths: runwayMonths,
      growthRate: growthRate,
      netProfitMargin: (totalRevenue > 0) ? (totalNetProfit / totalRevenue) : 0
    };
  };

  const calculateProjections = () => {
    const inputs = {
      pendapatan: parseFloat(cleanCurrencyValue(pendapatanStr)) || 0,
      biayaTetap: parseFloat(cleanCurrencyValue(biayaTetapStr)) || 0,
      cashOnHand: parseFloat(cleanCurrencyValue(cashOnHandStr)) || 0,
      currency: currency,
      arpu: parseFloat(cleanCurrencyValue(arpuStr)) || 0,
      marketingCost: parseFloat(cleanCurrencyValue(marketingCostStr)) || 0,
      biayaVariabelPct: parseFloat(biayaVariabel) / 100 || 0,
      horizon: parseInt(horizon) || 12,
      growthRatePct: parseFloat(growthRate) / 100 || 0,
    };

    if (inputs.pendapatan === 0 || inputs.biayaTetap === 0 || inputs.growthRatePct === 0) {
      showMessage('Mohon isi "Pendapatan Bulan Ini", "Biaya Tetap", dan "Target Pertumbuhan" untuk menghitung.');
      return;
    }

    setFinancialData(prev => ({...prev, inputs: inputs}));

    const growthRates = {
      pessimistic: inputs.growthRatePct / 2,
      baseCase: inputs.growthRatePct,
      optimistic: inputs.growthRatePct * 1.5
    };

    const baseCase = runScenario(inputs, growthRates.baseCase);
    const pessimistic = runScenario(inputs, growthRates.pessimistic);
    const optimistic = runScenario(inputs, growthRates.optimistic);

    setProjectionResults({ baseCase, pessimistic, optimistic });
    setAnalysisResult('');
    showPage(3);
  };
  
  const getProjectionAnalysis = async () => {
    setIsLoadingAnalysis(true);
    setAnalysisResult('');

    const loc = financialData.location;
    const locationString = [loc.kelurahan, loc.kecamatan, loc.kabupaten, loc.provinsi, financialData.location.notes].filter(Boolean).join(', ');

    const contextPayload = {
        ...financialData,
        locationString: locationString,
        location: undefined 
    };

    try {
      const response = await fetch('/api/analisis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            context: contextPayload,
            inputs: financialData.inputs,
            results: projectionResults.baseCase
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mendapatkan analisis');
      }

      setAnalysisResult(data.text || 'Gagal memuat hasil analisis.');

    } catch (error) {
      console.error("Error fetching projection analysis:", error);
      showMessage(`Gagal mendapatkan analisis: ${error.message}`);
      setAnalysisResult(`<p class="text-red-600">Gagal mendapatkan analisis: ${error.message}</p>`);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const startOver = () => {
    setCoreBusinessIdea('');
    setCtxJualan('');
    setCtxPelanggan('');
    setCtxOperasional('');
    setCtxRencana('');
    setCtxFaktorLuar('');
    setLocationNotes('');
    
    setPendapatanStr('');
    setBiayaTetapStr('');
    setCashOnHandStr('');
    setArpuStr('');
    setMarketingCostStr('');
    setBiayaVariabel('');
    setGrowthRate('');
    setHorizon('12');
    setCurrency('IDR');
    
    setFinancialData({ location: {} });
    setProjectionResults({});
    setAnalysisResult('');

    setLocationInputs({ prov: '', kab: '', kec: '', kel: '' });
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    
    showPage(1);
  };

  const renderStepper = () => {
    const steps = [
      { id: 1, label: 'Konteks Bisnis' },
      { id: 2, label: 'Data Finansial' },
      { id: 3, label: 'Hasil Proyeksi' },
    ];

    return (
      <nav className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center max-w-2xl mx-auto">
          {steps.map((step, index) => {
            const isActive = currentPage === step.id;
            const isComplete = currentPage > step.id;
            
            let circleClass = 'bg-gray-300 text-gray-600';
            let labelClass = 'text-gray-500';
            let itemClass = 'text-gray-500';
            let connectorClass = 'border-gray-300';

            if (isActive) {
              circleClass = 'bg-blue-600 text-white ring-4 ring-blue-100';
              labelClass = 'text-blue-600 font-semibold';
              itemClass = 'text-blue-600';
            } else if (isComplete) {
              circleClass = 'bg-green-600 text-white';
              labelClass = 'text-green-700 font-medium';
              itemClass = 'text-green-600';
              connectorClass = 'border-green-600';
            }
            
            return (
              <React.Fragment key={step.id}>
                <div 
                  className={`stepper-item flex items-center relative cursor-pointer ${itemClass}`}
                  onClick={() => {
                    if (step.id === 1) showPage(1);
                    if (step.id === 2 && (financialData.ctx_jualan || financialData.core_business_idea || financialData.location.provinsi)) showPage(2);
                    if (step.id === 3 && projectionResults.baseCase) showPage(3);
                  }}
                >
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold transition-all ${circleClass}`}>
                    {step.id}
                  </div>
                  <div className="ml-4">
                    <div className="font-medium text-gray-800">Langkah {step.id}</div>
                    <div className={`text-sm hidden sm:block ${labelClass} transition-all`}>{step.label}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`stepper-connector flex-auto border-t-2 ${connectorClass} mx-4 transition-all`}></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </nav>
    );
  };
  
  const Spinner = ({ small = false }) => (
    <div className={`spinner ${small ? 'spinner-sm' : ''}`}></div>
  );
  
  if (!isAuthenticated) {
    return (
      <div className="bg-gray-100 min-h-screen p-4 md:p-8 flex items-center justify-center">
        {/* <Head>
            <title>Kode Akses - Proyeksi Finansial</title>
        </Head> */}
        <form onSubmit={handleAccessSubmit} className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Proyeksi Finansial UMKM</h2>
          <p className="text-center text-gray-600 mb-6">Masukkan kode akses untuk melanjutkan.</p>
          <div className="mb-4">
            <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-1">Kode Akses</label>
            <input
              type="password"
              id="accessCode"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {authLoading && <Spinner small={true} />}
            <span className="ml-2">Masuk</span>
          </button>
          {message && (
            <p className="text-red-500 text-sm text-center mt-4">{message}</p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-8">
      {/* <Head>
        <title>Proyeksi Finansial UMKM</title>
        <link rel="icon" href="/favicon.ico" />
      </Head> */}
      
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
        <header className="p-8 bg-gradient-to-r from-blue-700 to-blue-500 text-white">
          <h1 className="text-4xl font-bold text-center">Proyeksi Estimasi Finansial UMKM</h1>
          <p className="text-center text-blue-100 mt-2">Bantu rencanakan masa depan bisnis Anda.</p>
        </header>

        {renderStepper()}

        <main className="p-6 md:p-12">
          {currentPage === 1 && (
            <section id="page-1">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Langkah 1: Konteks Bisnis</h2>
              <p className="text-gray-600 mb-6">Isi konteks bisnis Anda di bawah ini. Anda bisa mengisi manual, atau gunakan bantuan AI opsional di bawah untuk membuat draf awal.</p>
              
              <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <label htmlFor="core_business_idea" className="block text-lg font-semibold text-gray-800 mb-2">Bantuan AI (Opsional)</label>
                <p className="text-sm text-gray-600 mb-3">Masukkan ide bisnis inti Anda, lalu klik tombol untuk membuat draf konteks secara otomatis.</p>
                <div className="flex flex-col sm:flex-row sm:space-x-2">
                  <input 
                    type="text" 
                    id="core_business_idea"
                    value={coreBusinessIdea}
                    onChange={(e) => setCoreBusinessIdea(e.target.value)}
                    className="w-full sm:w-2/3 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none mb-2 sm:mb-0" 
                    placeholder="Contoh: Jasa Cuci Sepatu, Warung Kopi Susu, Keripik Pedas" 
                  />
                  <button 
                    id="getContextBtn" 
                    onClick={getContextAnalysis}
                    disabled={isLoadingContext}
                    className="w-full sm:w-1/3 bg-gradient-to-r from-blue-500 to-green-400 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:from-blue-600 hover:to-green-500 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <span>✨</span>
                    <span id="contextBtnText">{isLoadingContext ? 'Membuat Draf...' : 'Bantu Isi Konteks'}</span>
                  </button>
                </div>
                {isLoadingContext && (
                  <div id="contextLoader" className="mt-3 flex items-center space-x-2 text-gray-600">
                    <Spinner />
                    <span>Membuat draf konteks...</span>
                  </div>
                )}
              </div>

              <div className="border-b border-gray-200 my-8"></div>

              <div className="space-y-8">
                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-2">Lokasi Usaha</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="loc_provinsi" className="block text-sm font-medium text-gray-700">Provinsi
                        {locLoaders.prov && <Spinner small={true} />}
                      </label>
                      <select id="loc_provinsi" value={locationInputs.prov} onChange={fetchKabupaten} className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" disabled={locLoaders.prov}>
                        <option value="">{locLoaders.prov ? 'Memuat...' : 'Pilih Provinsi'}</option>
                        {provinces.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="loc_kabupaten" className="block text-sm font-medium text-gray-700">Kabupaten/Kota
                        {locLoaders.kab && <Spinner small={true} />}
                      </label>
                      <select id="loc_kabupaten" value={locationInputs.kab} onChange={fetchKecamatan} className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" disabled={!locationInputs.prov || locLoaders.kab}>
                        <option value="">{locLoaders.kab ? 'Memuat...' : 'Pilih Kabupaten/Kota'}</option>
                        {regencies.map(r => <option key={r.id} value={r.id}>{r.nama}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="loc_kecamatan" className="block text-sm font-medium text-gray-700">Kecamatan
                        {locLoaders.kec && <Spinner small={true} />}
                      </label>
                      <select id="loc_kecamatan" value={locationInputs.kec} onChange={fetchKelurahan} className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" disabled={!locationInputs.kab || locLoaders.kec}>
                        <option value="">{locLoaders.kec ? 'Memuat...' : 'Pilih Kecamatan'}</option>
                        {districts.map(d => <option key={d.id} value={d.id}>{d.nama}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="loc_kelurahan" className="block text-sm font-medium text-gray-700">Kelurahan/Desa
                        {locLoaders.kel && <Spinner small={true} />}
                      </label>
                      <select id="loc_kelurahan" value={locationInputs.kel} onChange={saveKelurahan} className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" disabled={!locationInputs.kec || locLoaders.kel}>
                        <option value="">{locLoaders.kel ? 'Memuat...' : 'Pilih Kelurahan/Desa'}</option>
                        {villages.map(v => <option key={v.id} value={v.id}>{v.nama}</option>)}
                      </select>
                    </div>
                  </div>
                  <input 
                    type="text" 
                    id="location_notes" 
                    value={locationNotes}
                    onChange={(e) => setLocationNotes(e.target.value)}
                    className="mt-4 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="Opsional: Tambahkan catatan lokasi (Misal: 'Online', 'Dekat Pasar', 'Instagram')"
                  />
                </div>

                <div>
                  <label htmlFor="ctx_jualan" className="block text-lg font-semibold text-gray-800 mb-2">1. Data Jualan dan Pasar (Lihat Kondisi Dagangan)</label>
                  <textarea 
                    id="ctx_jualan" 
                    rows="5" 
                    value={ctxJualan}
                    onChange={(e) => setCtxJualan(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="Contoh: Bulan lalu laku 100 pcs. Ramai pas gajian. Tren bisnis sejenis lagi naik. Diskon menaikkan penjualan 20%."
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="ctx_pelanggan" className="block text-lg font-semibold text-gray-800 mb-2">2. Data Pelanggan (Kenali Pembeli Anda)</label>
                  <textarea 
                    id="ctx_pelanggan" 
                    rows="5" 
                    value={ctxPelanggan}
                    onChange={(e) => setCtxPelanggan(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="Contoh: 30% pelanggan lama beli lagi. Dapat 20 pelanggan baru/bulan. Rating rata-rata 4.5/5."
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="ctx_operasional" className="block text-lg font-semibold text-gray-800 mb-2">3. Data Operasional (Lihat Dapur Usaha)</label>
                  <textarea 
                    id="ctx_operasional" 
                    rows="5" 
                    value={ctxOperasional}
                    onChange={(e) => setCtxOperasional(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="Contoh: Sanggup produksi 50 pcs/hari. Bahan baku lancar. Karyawan awet."
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="ctx_rencana" className="block text-lg font-semibold text-gray-800 mb-2">4. Data Rencana ke Depan</label>
                  <textarea 
                    id="ctx_rencana" 
                    rows="5" 
                    value={ctxRencana}
                    onChange={(e) => setCtxRencana(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="Contoh: Rencana tambah menu baru bulan depan."
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="ctx_faktor_luar" className="block text-lg font-semibold text-gray-800 mb-2">5. Faktor Luar (Kondisi Sekitar)</label>
                  <textarea 
                    id="ctx_faktor_luar" 
                    rows="5" 
                    value={ctxFaktorLuar}
                    onChange={(e) => setCtxFaktorLuar(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="Contoh: Harga bahan baku diperkirakan naik 5% tahun depan. Ada aturan pajak baru."
                  ></textarea>
                </div>
              </div>

              <div className="mt-10 text-right">
                <button onClick={() => nextPage(2)} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-all">
                  Selanjutnya &rarr;
                </button>
              </div>
            </section>
          )}

          {currentPage === 2 && (
            <section id="page-2">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Langkah 2: Data Finansial Inti</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Data Pokok</h3>
                  <div>
                    <label htmlFor="pendapatan" className="block text-sm font-medium text-gray-700">Pendapatan Bulan Ini</label>
                    <input type="text" id="pendapatan" value={pendapatanStr} onChange={handleCurrencyChange(setPendapatanStr)} placeholder="Contoh: 10.000.000" inputMode="numeric" className="currency-input mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label htmlFor="biaya_tetap" className="block text-sm font-medium text-gray-700">Biaya Tetap (Opex) / Bulan</label>
                    <input type="text" id="biaya_tetap" value={biayaTetapStr} onChange={handleCurrencyChange(setBiayaTetapStr)} placeholder="Contoh: 3.000.000" inputMode="numeric" className="currency-input mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label htmlFor="cash_on_hand" className="block text-sm font-medium text-gray-700">Uang Kas (Cash on Hand)</label>
                    <input type="text" id="cash_on_hand" value={cashOnHandStr} onChange={handleCurrencyChange(setCashOnHandStr)} placeholder="Contoh: 5.000.000" inputMode="numeric" className="currency-input mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label htmlFor="mata_uang" className="block text-sm font-medium text-gray-700">Mata Uang</label>
                    <select id="mata_uang" value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                      <option value="IDR">IDR (Rupiah)</option>
                      <option value="USD">USD (Dolar AS)</option>
                      <option value="SGD">SGD (Dolar Sing.)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Asumsi Biaya & Harga</h3>
                  <div>
                    <label htmlFor="arpu" className="block text-sm font-medium text-gray-700">Harga Rata-rata / ARPU</label>
                    <input type="text" id="arpu" value={arpuStr} onChange={handleCurrencyChange(setArpuStr)} placeholder="Contoh: 50.000" inputMode="numeric" className="currency-input mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label htmlFor="marketing_cost" className="block text-sm font-medium text-gray-700">Belanja Marketing / Bulan</label>
                    <input type="text" id="marketing_cost" value={marketingCostStr} onChange={handleCurrencyChange(setMarketingCostStr)} placeholder="Contoh: 1.000.000" inputMode="numeric" className="currency-input mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label htmlFor="biaya_variabel" className="block text-sm font-medium text-gray-700">Biaya Variabel (% dari Pendapatan)</label>
                    <input type="number" id="biaya_variabel" value={biayaVariabel} onChange={(e) => setBiayaVariabel(e.target.value)} placeholder="Contoh: 30" className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Asumsi Proyeksi</h3>
                  <div>
                    <label htmlFor="horizon" className="block text-sm font-medium text-gray-700">Horizon Proyeksi (Bulan)</label>
                    <input type="number" id="horizon" value={horizon} onChange={(e) => setHorizon(e.target.value)} className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label htmlFor="growth_rate" className="block text-sm font-medium text-gray-700">Target Pertumbuhan / Bulan (%)</label>
                    <input type="number" id="growth_rate" value={growthRate} onChange={(e) => setGrowthRate(e.target.value)} placeholder="Contoh: 10" className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-between">
                <button onClick={() => showPage(1)} className="bg-gray-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-gray-600 transition-all">
                  &larr; Kembali
                </button>
                <button onClick={calculateProjections} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-all">
                  Hitung & Lihat Hasil &rarr;
                </button>
              </div>
            </section>
          )}

          {currentPage === 3 && projectionResults.baseCase && (
            <section id="page-3">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Langkah 3: Hasil Proyeksi</h2>
                <button onClick={startOver} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-red-600 transition-all text-sm">
                  Ulangi Proyeksi
                </button>
              </div>

              <h3 className="text-xl font-semibold text-gray-700 mb-4">Ringkasan KPI (Skenario Dasar)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 transition-all hover:scale-105">
                  <h4 className="text-sm font-medium text-gray-500">Total Pendapatan</h4>
                  <p id="kpi_total_pendapatan" className="text-2xl font-bold text-gray-800">{formatCurrency(projectionResults.baseCase.totalRevenue, currency)}</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 transition-all hover:scale-105">
                  <h4 className="text-sm font-medium text-gray-500">Total Laba Bersih</h4>
                  <p id="kpi_total_laba" className="text-2xl font-bold text-gray-800">{formatCurrency(projectionResults.baseCase.totalNetProfit, currency)}</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 transition-all hover:scale-105">
                  <h4 className="text-sm font-medium text-gray-500">Perkiraan Titik Impas (BEP)</h4>
                  <p id="kpi_bep" className="text-2xl font-bold text-gray-800">
                    {projectionResults.baseCase.bepMonth ? `Bulan ke-${projectionResults.baseCase.bepMonth}` : (projectionResults.baseCase.totalNetProfit > 0 ? "Dalam Proyeksi" : "Tidak Tercapai")}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 transition-all hover:scale-105">
                  <h4 className="text-sm font-medium text-gray-500">Perkiraan Runway</h4>
                  <p id="kpi_runway" className="text-2xl font-bold text-gray-800">
                    {projectionResults.baseCase.runwayMonths ? `${projectionResults.baseCase.runwayMonths.toFixed(1)} Bulan` : (projectionResults.baseCase.totalNetProfit > 0 ? "Profit!" : "N/A")}
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-700 mb-4">Grafik Proyeksi (Skenario Dasar)</h3>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8 h-80 md:h-96">
                <Line 
                  data={{
                    labels: projectionResults.baseCase.data.map(row => `Bulan ${row.month}`),
                    datasets: [
                      {
                        label: 'Pendapatan',
                        data: projectionResults.baseCase.data.map(row => row.revenue),
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        fill: false,
                        tension: 0.1
                      },
                      {
                        label: 'Total Biaya',
                        data: projectionResults.baseCase.data.map(row => row.totalCost),
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        fill: false,
                        tension: 0.1
                      },
                      {
                        label: 'Laba Bersih',
                        data: projectionResults.baseCase.data.map(row => row.netProfit),
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        fill: false,
                        tension: 0.1
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        ticks: {
                          autoSkip: true,
                          maxTicksLimit: 7,
                          maxRotation: 0,
                          minRotation: 0
                        }
                      },
                      y: {
                        beginAtZero: false,
                        ticks: {
                          callback: function(value) {
                            if (value >= 1000000000) return (value / 1000000000) + ' M';
                            if (value >= 1000000) return (value / 1000000) + ' Jt';
                            if (value >= 1000) return (value / 1000) + ' Rb';
                            return value;
                          }
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { padding: 20 }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                              label += formatCurrency(context.parsed.y, currency);
                            }
                            return label;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>

              <h3 className="text-xl font-semibold text-gray-700 mb-4">Tabel Analisis Sensitivitas</h3>
              <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-100 mb-8">
                <table className="w-full text-left" id="sensitivityTable">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-4 font-semibold">Skenario</th>
                      <th className="p-4 font-semibold">Pertumbuhan/Bulan</th>
                      <th className="p-4 font-semibold">Total Pendapatan</th>
                      <th className="p-4 font-semibold">Total Laba Bersih</th>
                      <th className="p-4 font-semibold">Margin Laba</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[projectionResults.pessimistic, projectionResults.baseCase, projectionResults.optimistic].map((scenario, index) => {
                      const names = ['Pesimis', 'Dasar (Target)', 'Optimis'];
                      const netProfitMargin = (scenario.netProfitMargin * 100).toFixed(1);
                      const isLoss = scenario.totalNetProfit < 0;
                      return (
                        <tr key={names[index]} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors">
                          <td className="p-4 font-medium">{names[index]}</td>
                          <td className="p-4">{(scenario.growthRate * 100).toFixed(1)}%</td>
                          <td className="p-4">{formatCurrency(scenario.totalRevenue, currency)}</td>
                          <td className={`p-4 ${isLoss ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(scenario.totalNetProfit, currency)}</td>
                          <td className={`p-4 ${isLoss ? 'text-red-600' : 'text-green-600'}`}>{netProfitMargin}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-gray-700 mb-4">Tabel Proyeksi Detail (Skenario Dasar)</h3>
              <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-100 mb-8">
                <table className="w-full text-left" id="projectionTable">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-4 font-semibold">Bulan</th>
                      <th className="p-4 font-semibold">Pendapatan</th>
                      <th className="p-4 font-semibold">Biaya Variabel</th>
                      <th className="p-4 font-semibold">Biaya Tetap</th>
                      <th className="p-4 font-semibold">Total Biaya</th>
                      <th className="p-4 font-semibold">Laba/Rugi Bersih</th>
                      <th className="p-4 font-semibold">Laba Kumulatif</th>
                      <th className="p-4 font-semibold">Kas di Akhir Bulan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectionResults.baseCase.data.map(row => (
                      <tr key={row.month} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors">
                        <td className="p-4">{row.month}</td>
                        <td className="p-4">{formatCurrency(row.revenue, currency)}</td>
                        <td className="p-4">{formatCurrency(row.variableCost, currency)}</td>
                        <td className="p-4">{formatCurrency(row.fixedCost, currency)}</td>
                        <td className="p-4">{formatCurrency(row.totalCost, currency)}</td>
                        <td className={`p-4 ${row.netProfit < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(row.netProfit, currency)}</td>
                        <td className={`p-4 ${row.cumulativeProfit < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(row.cumulativeProfit, currency)}</td>
                        <td className={`p-4 ${row.cashAtEnd < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(row.cashAtEnd, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-gray-700 mb-4">Analisis & Rekomendasi AI</h3>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
                <button 
                  id="getAnalysisBtn" 
                  onClick={getProjectionAnalysis}
                  disabled={isLoadingAnalysis}
                  className="bg-gradient-to-r from-blue-500 to-green-400 text-white font-bold py-3 px-5 rounded-lg shadow-md hover:from-blue-600 hover:to-green-500 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <span>✨</span>
                  <span id="analysisBtnText">{isLoadingAnalysis ? 'Menganalisis...' : (analysisResult ? 'Dapatkan Analisis Ulang' : 'Berikan Analisis & Rekomendasi')}</span>
                </button>
                {isLoadingAnalysis && (
                  <div id="analysisLoader" className="mt-4 flex items-center space-x-2 text-gray-600">
                    <Spinner />
                    <span>Menganalisis proyeksi Anda...</span>
                  </div>
                )}
                <div 
                  id="analysisResult" 
                  className="mt-6 text-gray-700 leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: analysisResult ? formatMarkdown(analysisResult) : '' }}
                >
                </div>
              </div>

            </section>
          )}
        </main>
      </div>

      {message && (
        <div id="messageModal" className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Notifikasi</h4>
            <p id="messageText" className="text-gray-600 mb-6">{message}</p>
            <button onClick={hideMessage} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all">
              Mengerti
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-left-color: #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .spinner-sm {
          width: 16px;
          height: 16px;
          border-width: 2px;
          display: inline-block;
          margin-left: 8px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

