import React from 'react';
import { ProductFlavor } from '../types';
import { Plus, Minus, Check } from 'lucide-react';

interface FlavorSelectorProps {
  flavors: ProductFlavor[];
  title?: string;
  selectedFlavors: { [flavorName: string]: number };
  onChange: (newFlavors: { [flavorName: string]: number }, totalCount: number) => void;
  toBnNum?: (n: number | string, padZero?: boolean) => string;
}

const defaultBnNum = (n: number | string): string => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(n)
    .split('')
    .map((char) => {
      const parsed = parseInt(char, 10);
      return isNaN(parsed) ? char : (bn[parsed] ?? char);
    })
    .join('');
};

export const FlavorSelector: React.FC<FlavorSelectorProps> = ({
  flavors,
  title = 'ফ্লেভার নির্বাচন করুন',
  selectedFlavors,
  onChange,
  toBnNum = defaultBnNum,
}) => {
  if (!flavors || flavors.length === 0) return null;

  const handleIncrement = (flavorName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current = selectedFlavors[flavorName] || 0;
    const updated = { ...selectedFlavors, [flavorName]: current + 1 };
    const total = Object.values(updated).reduce((sum, qty) => sum + qty, 0);
    onChange(updated, total);
  };

  const handleDecrement = (flavorName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current = selectedFlavors[flavorName] || 0;
    if (current <= 0) return;
    const updated = { ...selectedFlavors };
    if (current === 1) {
      delete updated[flavorName];
    } else {
      updated[flavorName] = current - 1;
    }
    const total = Object.values(updated).reduce((sum, qty) => sum + qty, 0);
    onChange(updated, Math.max(1, total));
  };

  const handleRowClick = (flavorName: string) => {
    const current = selectedFlavors[flavorName] || 0;
    if (current === 0) {
      handleIncrement(flavorName);
    }
  };

  const totalSelected = Object.values(selectedFlavors).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="space-y-2.5 select-none pt-1">
      {/* Title with Selected Summary */}
      <div className="flex items-center justify-between">
        <h4 className="font-extrabold text-[#1F241E] text-sm sm:text-base flex items-center gap-2">
          <span>{title}</span>
          {totalSelected > 0 && (
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              {toBnNum(totalSelected)} টি নির্বাচিত
            </span>
          )}
        </h4>
      </div>

      {/* Flavor List matching user demo UI */}
      <div className="space-y-2">
        {flavors.map((flavor) => {
          const qty = selectedFlavors[flavor.name] || 0;
          const isSelected = qty > 0;

          return (
            <div
              key={flavor.id || flavor.name}
              onClick={() => handleRowClick(flavor.name)}
              className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-[#F4F7FF] shadow-xs ring-1 ring-blue-400/40'
                  : 'border-[#E8E3D9] bg-white hover:border-gray-300 hover:bg-[#FAF8F5]'
              }`}
            >
              {/* Left: Icon Badge & Name */}
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg sm:text-xl shrink-0 shadow-2xs transition-transform"
                  style={{
                    backgroundColor: flavor.bgColor || '#F3E8FF',
                    color: flavor.textColor || '#1F241E',
                  }}
                >
                  {flavor.icon || '🌿'}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-sm sm:text-base text-[#1F241E] tracking-tight truncate">
                      {flavor.name}
                    </span>
                  </div>
                  {flavor.inStock === false && (
                    <span className="text-[10px] text-red-500 font-bold">স্টক শেষ</span>
                  )}
                </div>
              </div>

              {/* Right: Quantity Counter [- 0 +] */}
              <div
                className="flex items-center bg-white border border-[#D5CEBF] rounded-lg overflow-hidden shadow-2xs shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => handleDecrement(flavor.name, e)}
                  disabled={qty <= 0}
                  aria-label="Decrease count"
                  className={`w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center transition-colors ${
                    qty > 0
                      ? 'text-[#1F241E] hover:bg-gray-100 active:bg-gray-200 cursor-pointer'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <div className="w-7 sm:w-8 text-center text-xs sm:text-sm font-extrabold text-[#1F241E] select-none">
                  {toBnNum(qty)}
                </div>

                <button
                  type="button"
                  onClick={(e) => handleIncrement(flavor.name, e)}
                  disabled={flavor.inStock === false}
                  aria-label="Increase count"
                  className="w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center text-[#1F241E] hover:bg-gray-100 active:bg-gray-200 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
