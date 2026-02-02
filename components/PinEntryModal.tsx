import React, { useState, useEffect } from 'react';
import { Delete, ArrowRight, X } from 'lucide-react';

interface PinEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expectedPin?: string;
  title?: string;
  subtitle?: string;
}

const PinEntryModal: React.FC<PinEntryModalProps> = ({ isOpen, onClose, onSuccess, expectedPin, title = "Introduce PIN", subtitle }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
    }
  }, [isOpen]);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (expectedPin && pin !== expectedPin) {
      setError('PIN Incorrecto');
      setPin('');
      return;
    }
    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm animate-in zoom-in duration-200 relative" onClick={e => e.stopPropagation()}>
        <button
           onClick={onClose}
           className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
        >
           <X size={24} />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-12 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all ${pin[i] ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 bg-gray-50'}`}>
              {pin[i] ? '•' : ''}
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 text-center mb-4 text-sm font-bold animate-pulse">{error}</p>}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num.toString())}
              className="h-12 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 font-bold text-lg text-gray-700 transition-colors"
            >
              {num}
            </button>
          ))}
          <div className="flex justify-center items-center"></div>
          <button
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 font-bold text-lg text-gray-700 transition-colors"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-red-50 hover:bg-red-100 active:bg-red-200 flex items-center justify-center text-red-500 transition-colors"
          >
            <Delete size={20} />
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={pin.length !== 4}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          Acceder <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default PinEntryModal;
