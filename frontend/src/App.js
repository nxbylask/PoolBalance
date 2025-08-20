import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import TabsDemo from "./TabsDemo";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [pools, setPools] = useState([]);
  const [selectedPool, setSelectedPool] = useState(null);
  const [loading, setLoading] = useState(false);

  // Show demo if URL contains 'demo'
  if (window.location.search.includes('demo')) {
    return <TabsDemo />;
  }

  useEffect(() => {
    loadPools();
  }, []);

  const loadPools = async () => {
    try {
      const response = await axios.get(`${API}/pools`);
      setPools(response.data);
      if (response.data.length > 0 && !selectedPool) {
        setSelectedPool(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading pools:', error);
    }
  };

  const createPool = async (poolData) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/pools`, poolData);
      await loadPools();
      setSelectedPool(response.data);
      setCurrentView('home');
    } catch (error) {
      console.error('Error creating pool:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePool = async (poolId) => {
    // Confirmar antes de eliminar
    if (window.confirm('¿Estás seguro de que quieres eliminar esta piscina? Esta acción no se puede deshacer.')) {
      try {
        setLoading(true);
        await axios.delete(`${API}/pools/${poolId}`);
        await loadPools();
        
        // Si la piscina eliminada era la seleccionada, seleccionar otra o ninguna
        if (selectedPool && selectedPool.id === poolId) {
          const updatedPools = pools.filter(p => p.id !== poolId);
          setSelectedPool(updatedPools.length > 0 ? updatedPools[0] : null);
        }
        
        // Si no quedan piscinas, volver al home
        if (pools.filter(p => p.id !== poolId).length === 0) {
          setCurrentView('home');
        }
      } catch (error) {
        console.error('Error deleting pool:', error);
        alert('Error al eliminar la piscina. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    }
  };

  const calculateChemical = async (calculationData) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/calculate`, {
        ...calculationData,
        pool_id: selectedPool.id
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      <main className="container mx-auto px-4 py-8">
        {currentView === 'home' && (
          <HomeView
            pools={pools}
            selectedPool={selectedPool}
            setSelectedPool={setSelectedPool}
            setCurrentView={setCurrentView}
          />
        )}
        {currentView === 'add-pool' && (
          <AddPoolView onCreatePool={createPool} loading={loading} />
        )}
        {currentView === 'calculator' && selectedPool && (
          <CalculatorMenu setCurrentView={setCurrentView} />
        )}
        {currentView === 'chlorine' && selectedPool && (
          <ChlorineCalculator
            pool={selectedPool}
            onCalculate={calculateChemical}
            loading={loading}
          />
        )}
        {currentView === 'ph' && selectedPool && (
          <PHCalculator
            pool={selectedPool}
            onCalculate={calculateChemical}
            loading={loading}
          />
        )}
        {currentView === 'alkalinity' && selectedPool && (
          <AlkalinityCalculator
            pool={selectedPool}
            onCalculate={calculateChemical}
            loading={loading}
          />
        )}
        {currentView === 'cyanuric-acid' && selectedPool && (
          <CyanuricAcidCalculator
            pool={selectedPool}
            onCalculate={calculateChemical}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
}

const Header = ({ currentView, setCurrentView }) => {
  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <h1
            className="text-2xl font-bold cursor-pointer flex items-center"
            onClick={() => setCurrentView('home')}
          >
            🏊‍♂️ Pool Balance
          </h1>
          <nav className="flex space-x-4">
            <button
              onClick={() => setCurrentView('home')}
              className={`px-4 py-2 rounded-md transition-colors ${
                currentView === 'home' ? 'bg-blue-700' : 'hover:bg-blue-500'
              }`}
            >
              Inicio
            </button>
            <button
              onClick={() => setCurrentView('calculator')}
              className={`px-4 py-2 rounded-md transition-colors ${
                currentView.includes('calculator') || ['chlorine', 'ph', 'alkalinity', 'cyanuric-acid'].includes(currentView)
                  ? 'bg-blue-700' : 'hover:bg-blue-500'
              }`}
            >
              Calculadoras
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

const HomeView = ({ pools, selectedPool, setSelectedPool, setCurrentView }) => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Bienvenido a Pool Balance
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Calcula fácilmente las dosis correctas de químicos para mantener tu piscina en perfectas condiciones
        </p>
      </div>

      {pools.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            No tienes piscinas registradas
          </h3>
          <p className="text-gray-600 mb-6">
            Primero debes agregar una piscina para usar las calculadoras
          </p>
          <button
            onClick={() => setCurrentView('add-pool')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Agregar Mi Primera Piscina
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Mis Piscinas</h3>
            <div className="space-y-3">
              {pools.map((pool) => (
                <div
                  key={pool.id}
                  className={`p-4 rounded-md border-2 cursor-pointer transition-colors ${
                    selectedPool?.id === pool.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedPool(pool)}
                >
                  <h4 className="font-semibold">{pool.name}</h4>
                  <p className="text-sm text-gray-600">
                    {pool.volume_liters.toLocaleString()} L ({pool.volume_gallons.toLocaleString()} gal)
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setCurrentView('add-pool')}
              className="w-full mt-4 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              + Agregar Nueva Piscina
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Calculadoras Disponibles</h3>
            <div className="grid grid-cols-2 gap-4">
              <CalculatorCard
                title="Cloro"
                icon="🧪"
                description="Calcula la dosis de cloro necesaria"
                onClick={() => setCurrentView('chlorine')}
              />
              <CalculatorCard
                title="pH"
                icon="⚖️"
                description="Ajusta el nivel de pH"
                onClick={() => setCurrentView('ph')}
              />
              <CalculatorCard
                title="Alcalinidad"
                icon="🔬"
                description="Balancea la alcalinidad total"
                onClick={() => setCurrentView('alkalinity')}
              />
              <CalculatorCard
                title="Ácido Cianúrico"
                icon="🛡️"
                description="Estabilizador de cloro"
                onClick={() => setCurrentView('cyanuric-acid')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CalculatorCard = ({ title, icon, description, onClick }) => {
  return (
    <div
      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors hover:bg-blue-50"
      onClick={onClick}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="font-semibold text-gray-800">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
};

const AddPoolView = ({ onCreatePool, loading }) => {
  const [poolData, setPoolData] = useState({
    name: '',
    volume_liters: '',
    volume_gallons: '',
    default_units: 'metric'
  });

  const handleVolumeChange = (field, value) => {
    if (field === 'volume_liters') {
      const liters = parseFloat(value) || 0;
      const gallons = liters * 0.264172;
      setPoolData({
        ...poolData,
        volume_liters: liters,
        volume_gallons: Math.round(gallons * 100) / 100
      });
    } else if (field === 'volume_gallons') {
      const gallons = parseFloat(value) || 0;
      const liters = gallons * 3.78541;
      setPoolData({
        ...poolData,
        volume_gallons: gallons,
        volume_liters: Math.round(liters * 100) / 100
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (poolData.name && poolData.volume_liters > 0) {
      onCreatePool(poolData);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Agregar Nueva Piscina</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Piscina
            </label>
            <input
              type="text"
              value={poolData.name}
              onChange={(e) => setPoolData({ ...poolData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Piscina Principal"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volumen en Litros
            </label>
            <input
              type="number"
              value={poolData.volume_liters}
              onChange={(e) => handleVolumeChange('volume_liters', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 50000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volumen en Galones
            </label>
            <input
              type="number"
              value={poolData.volume_gallons}
              onChange={(e) => handleVolumeChange('volume_gallons', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Calculado automáticamente"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear Piscina'}
          </button>
        </form>
      </div>
    </div>
  );
};

const CalculatorMenu = ({ setCurrentView }) => {
  const calculators = [
    {
      id: 'chlorine',
      title: 'Calculadora de Cloro',
      icon: '🧪',
      description: 'Calcula la cantidad exacta de cloro necesaria para alcanzar el nivel deseado',
      ranges: 'Rango ideal: 1.0 - 3.0 ppm'
    },
    {
      id: 'ph',
      title: 'Calculadora de pH',
      icon: '⚖️',
      description: 'Ajusta el pH de tu piscina para mantener el agua balanceada',
      ranges: 'Rango ideal: 7.2 - 7.6'
    },
    {
      id: 'alkalinity',
      title: 'Calculadora de Alcalinidad',
      icon: '🔬',
      description: 'Controla la alcalinidad total para estabilizar el pH',
      ranges: 'Rango ideal: 80 - 120 ppm'
    },
    {
      id: 'cyanuric-acid',
      title: 'Calculadora de Ácido Cianúrico',
      icon: '🛡️',
      description: 'Estabiliza el cloro y protege contra los rayos UV',
      ranges: 'Rango ideal: 30 - 50 ppm'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Calculadoras Químicas</h2>
        <p className="text-lg text-gray-600">
          Selecciona el parámetro que deseas calcular
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {calculators.map((calc) => (
          <div
            key={calc.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-gray-200 hover:border-blue-300"
            onClick={() => setCurrentView(calc.id)}
          >
            <div className="text-4xl mb-4">{calc.icon}</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{calc.title}</h3>
            <p className="text-gray-600 mb-3">{calc.description}</p>
            <p className="text-sm text-blue-600 font-medium">{calc.ranges}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ChlorineCalculator = ({ pool, onCalculate, loading }) => {
  const [values, setValues] = useState({
    current_value: '',
    target_value: '2.0',
    product_type: 'hipoclorito_sodio',
    product_concentration: ''
  });
  const [result, setResult] = useState(null);

  const productTypes = [
    { value: 'hipoclorito_sodio', label: 'Hipoclorito de Sodio Líquido (Blanqueador)', defaultConcentration: 6 },
    { value: 'hipoclorito_calcio', label: 'Hipoclorito de Calcio Granulado (Cal-Hypo)', defaultConcentration: 70 },
    { value: 'dicloro_granulado', label: 'Dicloro Granulado (Dichlor)', defaultConcentration: 56 },
    { value: 'tricloro_granulado', label: 'Tricloro Granulado', defaultConcentration: 90 },
    { value: 'tricloro_pastillas', label: 'Pastillas de Tricloro (3 pulgadas)', defaultConcentration: 90 }
  ];

  const adjustValue = (field, increment) => {
    const currentVal = parseFloat(values[field]) || 0;
    const newVal = Math.max(0, currentVal + increment);
    setValues({ ...values, [field]: newVal.toFixed(1) });
  };

  const handleCalculate = async () => {
    try {
      const result = await onCalculate({
        calculation_type: 'chlorine',
        current_value: parseFloat(values.current_value),
        target_value: parseFloat(values.target_value),
        pool_volume_liters: pool.volume_liters,
        product_type: values.product_type,
        product_concentration: parseFloat(values.product_concentration) || undefined
      });
      setResult(result);
    } catch (error) {
      console.error('Error calculating chlorine:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          🧪 Calculadora de Cloro
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Información de la Piscina</h3>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p><strong>Piscina:</strong> {pool.name}</p>
              <p><strong>Volumen:</strong> {pool.volume_liters.toLocaleString()} L</p>
            </div>

            <div className="space-y-4">
              <ValueInput
                label="Nivel Actual de Cloro (ppm)"
                value={values.current_value}
                onChange={(val) => setValues({ ...values, current_value: val })}
                onAdjust={(inc) => adjustValue('current_value', inc)}
                step={0.1}
              />

              <ValueInput
                label="Nivel Deseado de Cloro (ppm)"
                value={values.target_value}
                onChange={(val) => setValues({ ...values, target_value: val })}
                onAdjust={(inc) => adjustValue('target_value', inc)}
                step={0.1}
                note="Rango recomendado: 1.0 - 3.0 ppm"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Producto
                </label>
                <select
                  value={values.product_type}
                  onChange={(e) => {
                    const selectedProduct = productTypes.find(p => p.value === e.target.value);
                    setValues({
                      ...values,
                      product_type: e.target.value,
                      product_concentration: selectedProduct?.defaultConcentration?.toString() || ''
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {productTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <ValueInput
                label="Concentración del Producto (%)"
                value={values.product_concentration}
                onChange={(val) => setValues({ ...values, product_concentration: val })}
                onAdjust={(inc) => adjustValue('product_concentration', inc)}
                step={1}
              />
            </div>

            <button
              onClick={handleCalculate}
              disabled={loading || !values.current_value || !values.target_value}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Calculando...' : 'Calcular Dosis'}
            </button>
          </div>

          {result && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Resultado</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-green-600">
                    {result.amount} {result.unit}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{result.notes}</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Instrucciones de Seguridad:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Agregue el químico con la bomba funcionando</li>
                    <li>• Nunca mezcle diferentes tipos de cloro</li>
                    <li>• Espere al menos 4 horas antes de usar la piscina</li>
                    <li>• Use equipo de protección personal</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PHCalculator = ({ pool, onCalculate, loading }) => {
  const [activeTab, setActiveTab] = useState('increase');
  const [values, setValues] = useState({
    current_value: '',
    target_value: '7.4',
    product_type: 'carbonato_sodio'
  });
  const [result, setResult] = useState(null);

  const increaseProducts = [
    { value: 'carbonato_sodio', label: 'Carbonato de Sodio (Soda Ash)' }
  ];

  const decreaseProducts = [
    { value: 'acido_muriatico', label: 'Ácido Muriático' },
    { value: 'bisulfato_sodio', label: 'Bisulfato de Sodio (pH Minus)' }
  ];

  const adjustValue = (field, increment) => {
    const currentVal = parseFloat(values[field]) || 0;
    const newVal = Math.max(0, Math.min(14, currentVal + increment));
    setValues({ ...values, [field]: newVal.toFixed(1) });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setResult(null);
    // Set default product for the selected tab
    if (tab === 'increase') {
      setValues({ ...values, product_type: 'carbonato_sodio' });
    } else {
      setValues({ ...values, product_type: 'acido_muriatico' });
    }
  };

  const handleCalculate = async () => {
    try {
      const result = await onCalculate({
        calculation_type: 'ph',
        current_value: parseFloat(values.current_value),
        target_value: parseFloat(values.target_value),
        pool_volume_liters: pool.volume_liters,
        product_type: values.product_type
      });
      setResult(result);
    } catch (error) {
      console.error('Error calculating pH:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          ⚖️ Calculadora de pH
        </h2>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="increase">Subir pH</TabsTrigger>
            <TabsTrigger value="decrease">Bajar pH</TabsTrigger>
          </TabsList>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Información de la Piscina</h3>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p><strong>Piscina:</strong> {pool.name}</p>
                <p><strong>Volumen:</strong> {pool.volume_liters.toLocaleString()} L</p>
              </div>

              <div className="space-y-4">
                <ValueInput
                  label="pH Actual"
                  value={values.current_value}
                  onChange={(val) => setValues({ ...values, current_value: val })}
                  onAdjust={(inc) => adjustValue('current_value', inc)}
                  step={0.1}
                  min={0}
                  max={14}
                />

                <ValueInput
                  label="pH Deseado"
                  value={values.target_value}
                  onChange={(val) => setValues({ ...values, target_value: val })}
                  onAdjust={(inc) => adjustValue('target_value', inc)}
                  step={0.1}
                  min={0}
                  max={14}
                  note="Rango recomendado: 7.2 - 7.6"
                />

                <TabsContent value="increase">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Producto para Subir pH
                    </label>
                    <select
                      value={values.product_type}
                      onChange={(e) => setValues({ ...values, product_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {increaseProducts.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-green-600 mt-1">
                      Para pH por debajo de 7.2
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="decrease">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Producto para Bajar pH
                    </label>
                    <select
                      value={values.product_type}
                      onChange={(e) => setValues({ ...values, product_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {decreaseProducts.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-red-600 mt-1">
                      Para pH por encima de 7.6
                    </p>
                  </div>
                </TabsContent>
              </div>

              <button
                onClick={handleCalculate}
                disabled={loading || !values.current_value || !values.target_value}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Calculando...' : 'Calcular Dosis'}
              </button>
            </div>

            {result && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Resultado</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-green-600">
                      {result.amount} {result.unit}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{result.notes}</p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Instrucciones importantes:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Agregue el producto gradualmente</li>
                      <li>• Espere 2-4 horas y vuelva a medir</li>
                      <li>• Ajuste la alcalinidad antes que el pH</li>
                      <li>• Mantenga la bomba funcionando</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

const AlkalinityCalculator = ({ pool, onCalculate, loading }) => {
  const [values, setValues] = useState({
    current_value: '',
    target_value: '100',
    product_type: 'bicarbonato_sodio'
  });
  const [result, setResult] = useState(null);

  const productTypes = [
    { value: 'bicarbonato_sodio', label: 'Bicarbonato de Sodio' },
    { value: 'aumentador_alcalinidad', label: 'Aumentador de Alcalinidad Comercial' }
  ];

  const adjustValue = (field, increment) => {
    const currentVal = parseFloat(values[field]) || 0;
    const newVal = Math.max(0, currentVal + increment);
    setValues({ ...values, [field]: newVal.toFixed(0) });
  };

  const handleCalculate = async () => {
    try {
      const result = await onCalculate({
        calculation_type: 'alkalinity',
        current_value: parseFloat(values.current_value),
        target_value: parseFloat(values.target_value),
        pool_volume_liters: pool.volume_liters,
        product_type: values.product_type
      });
      setResult(result);
    } catch (error) {
      console.error('Error calculating alkalinity:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          🔬 Calculadora de Alcalinidad Total
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Información de la Piscina</h3>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p><strong>Piscina:</strong> {pool.name}</p>
              <p><strong>Volumen:</strong> {pool.volume_liters.toLocaleString()} L</p>
            </div>

            <div className="space-y-4">
              <ValueInput
                label="Alcalinidad Actual (ppm)"
                value={values.current_value}
                onChange={(val) => setValues({ ...values, current_value: val })}
                onAdjust={(inc) => adjustValue('current_value', inc)}
                step={5}
              />

              <ValueInput
                label="Alcalinidad Deseada (ppm)"
                value={values.target_value}
                onChange={(val) => setValues({ ...values, target_value: val })}
                onAdjust={(inc) => adjustValue('target_value', inc)}
                step={5}
                note="Rango recomendado: 80 - 120 ppm"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Producto a Utilizar
                </label>
                <select
                  value={values.product_type}
                  onChange={(e) => setValues({ ...values, product_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {productTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={loading || !values.current_value || !values.target_value}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Calculando...' : 'Calcular Dosis'}
            </button>
          </div>

          {result && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Resultado</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-green-600">
                    {result.amount} {result.unit}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{result.notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CyanuricAcidCalculator = ({ pool, onCalculate, loading }) => {
  const [activeTab, setActiveTab] = useState('increase');
  const [values, setValues] = useState({
    current_value: '',
    target_value: '40',
    product_type: 'acido_cianurico'
  });
  const [result, setResult] = useState(null);

  const increaseProducts = [
    { value: 'acido_cianurico', label: 'Ácido Cianúrico Granulado (Estabilizador)' }
  ];

  const decreaseProducts = [
    { value: 'dilucion_agua', label: 'Dilución con Agua Nueva' }
  ];

  const adjustValue = (field, increment) => {
    const currentVal = parseFloat(values[field]) || 0;
    const newVal = Math.max(0, currentVal + increment);
    setValues({ ...values, [field]: newVal.toFixed(0) });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setResult(null);
    // Set default product for the selected tab
    if (tab === 'increase') {
      setValues({ ...values, product_type: 'acido_cianurico' });
    } else {
      setValues({ ...values, product_type: 'dilucion_agua' });
    }
  };

  const handleCalculate = async () => {
    try {
      const result = await onCalculate({
        calculation_type: 'cyanuric_acid',
        current_value: parseFloat(values.current_value),
        target_value: parseFloat(values.target_value),
        pool_volume_liters: pool.volume_liters,
        product_type: values.product_type
      });
      setResult(result);
    } catch (error) {
      console.error('Error calculating cyanuric acid:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          🛡️ Calculadora de Ácido Cianúrico
        </h2>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="increase">Aumentar CYA</TabsTrigger>
            <TabsTrigger value="decrease">Reducir CYA</TabsTrigger>
          </TabsList>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Información de la Piscina</h3>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p><strong>Piscina:</strong> {pool.name}</p>
                <p><strong>Volumen:</strong> {pool.volume_liters.toLocaleString()} L</p>
              </div>

              <div className="space-y-4">
                <ValueInput
                  label="Nivel Actual de Ác. Cianúrico (ppm)"
                  value={values.current_value}
                  onChange={(val) => setValues({ ...values, current_value: val })}
                  onAdjust={(inc) => adjustValue('current_value', inc)}
                  step={5}
                />

                <ValueInput
                  label="Nivel Deseado de Ác. Cianúrico (ppm)"
                  value={values.target_value}
                  onChange={(val) => setValues({ ...values, target_value: val })}
                  onAdjust={(inc) => adjustValue('target_value', inc)}
                  step={5}
                  note="Rango recomendado: 30 - 50 ppm"
                />

                <TabsContent value="increase">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método para Aumentar
                    </label>
                    <select
                      value={values.product_type}
                      onChange={(e) => setValues({ ...values, product_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {increaseProducts.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-green-600 mt-1">
                      Para niveles por debajo de 30 ppm
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="decrease">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método para Reducir
                    </label>
                    <select
                      value={values.product_type}
                      onChange={(e) => setValues({ ...values, product_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {decreaseProducts.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-red-600 mt-1">
                      Para niveles por encima de 50 ppm
                    </p>
                  </div>
                </TabsContent>
              </div>

              <button
                onClick={handleCalculate}
                disabled={loading || !values.current_value || !values.target_value}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Calculando...' : 'Calcular Dosis'}
              </button>
            </div>

            {result && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Resultado</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-green-600">
                      {result.amount} {result.unit}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{result.notes}</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
                    <h4 className="font-semibold text-blue-800 mb-2">💡 Información importante:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• El ácido cianúrico se disuelve lentamente</li>
                      <li>• Puede tardar 2-3 días en disolverse completamente</li>
                      <li>• Solo aumenta, nunca disminuye naturalmente</li>
                      <li>• Niveles altos requieren dilución del agua</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

const ValueInput = ({ label, value, onChange, onAdjust, step = 1, min, max, note }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => onAdjust(-step)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-3 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
          step={step}
          min={min}
          max={max}
        />
        <button
          type="button"
          onClick={() => onAdjust(step)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-3 rounded-r focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          +
        </button>
      </div>
      {note && <p className="text-xs text-blue-600 mt-1">{note}</p>}
    </div>
  );
};

export default App;
