import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

// Demo component to showcase the tabs functionality implemented for pH and Cyanuric Acid calculators
const TabsDemo = () => {
  const [phTab, setPhTab] = useState('increase');
  const [cyaTab, setCyaTab] = useState('increase');

  const increasePhProducts = [
    { value: 'carbonato_sodio', label: 'Carbonato de Sodio (Soda Ash)' }
  ];

  const decreasePhProducts = [
    { value: 'acido_muriatico', label: 'Ácido Muriático' },
    { value: 'bisulfato_sodio', label: 'Bisulfato de Sodio (pH Minus)' }
  ];

  const increaseCyaProducts = [
    { value: 'acido_cianurico', label: 'Ácido Cianúrico Granulado (Estabilizador)' }
  ];

  const decreaseCyaProducts = [
    { value: 'dilucion_agua', label: 'Dilución con Agua Nueva' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            🏊‍♂️ Pool Balance - Demostración de Tabs
          </h1>
          <p className="text-lg text-gray-600">
            Funcionalidad implementada: Separar acciones de subir y bajar parámetros con tabs
          </p>
        </div>

        {/* pH Calculator Demo */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            ⚖️ Calculadora de pH - CON TABS
          </h2>
          
          <Tabs value={phTab} onValueChange={setPhTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="increase">Subir pH</TabsTrigger>
              <TabsTrigger value="decrease">Bajar pH</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="increase">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Productos para Subir pH:</h3>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    {increasePhProducts.map(product => (
                      <option key={product.value} value={product.value}>{product.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-green-600 mt-2">
                    Para pH por debajo de 7.2
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="decrease">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">Productos para Bajar pH:</h3>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    {decreasePhProducts.map(product => (
                      <option key={product.value} value={product.value}>{product.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-red-600 mt-2">
                    Para pH por encima de 7.6
                  </p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Cyanuric Acid Calculator Demo */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            🛡️ Calculadora de Ácido Cianúrico - CON TABS
          </h2>
          
          <Tabs value={cyaTab} onValueChange={setCyaTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="increase">Aumentar CYA</TabsTrigger>
              <TabsTrigger value="decrease">Reducir CYA</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="increase">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Método para Aumentar CYA:</h3>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    {increaseCyaProducts.map(product => (
                      <option key={product.value} value={product.value}>{product.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-600 mt-2">
                    Para niveles por debajo de 30 ppm
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="decrease">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-800 mb-2">Método para Reducir CYA:</h3>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    {decreaseCyaProducts.map(product => (
                      <option key={product.value} value={product.value}>{product.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-orange-600 mt-2">
                    Para niveles por encima de 50 ppm
                  </p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Comparison - Before (Mixed in single selector) */}
        <div className="bg-gray-100 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            ❌ ANTES - Productos mezclados en un solo selector
          </h2>
          
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Producto a Utilizar (pH):</h3>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="carbonato_sodio">Carbonato de Sodio (Soda Ash) - Subir pH</option>
              <option value="acido_muriatico">Ácido Muriático - Bajar pH</option>
              <option value="bisulfato_sodio">Bisulfato de Sodio (pH Minus) - Bajar pH</option>
            </select>
            <p className="text-xs text-gray-600 mt-2">
              Todos los productos mezclados - confuso para el usuario
            </p>
          </div>
        </div>

        <div className="bg-green-100 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center">
            ✅ DESPUÉS - Separado con tabs por acción
          </h2>
          <ul className="text-green-700 space-y-2">
            <li>• <strong>Tab "Subir pH":</strong> Solo productos para aumentar pH</li>
            <li>• <strong>Tab "Bajar pH":</strong> Solo productos para disminuir pH</li>
            <li>• <strong>Tab "Aumentar CYA":</strong> Solo productos para aumentar ácido cianúrico</li>
            <li>• <strong>Tab "Reducir CYA":</strong> Solo dilución con agua</li>
            <li>• Interfaz más clara y fácil de usar</li>
            <li>• Evita confusión del usuario sobre qué productos usar</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TabsDemo;