// src/components/AlsoScanned.tsx

import React, { useEffect, useState } from 'react';
import { getAlsoScanned, AlsoScannedProduct } from '../services/swapService';

const ScoreChip = ({ score }: { score: number }) => {
  const color = score >= 70 ? '#2E7D4F' : score >= 40 ? '#E07B2A' : '#D94F3D';
  const bg = score >= 70 ? '#E6F4EC' : score >= 40 ? '#FFF0E0' : '#FDECEA';
  return (
    <span style={{ color, background: bg }}
      className="font-mono font-bold text-xs px-2 py-0.5 rounded-lg">
      {score}/100
    </span>
  );
};

export const AlsoScanned = ({
  currentProductId,
  category,
  subCategory,
  profileType,
  currentScore,
  onScanSuggested
}: {
  currentProductId: string;
  category: string;
  subCategory: string;
  profileType: string;
  currentScore: number;
  onScanSuggested: (productName: string) => void;
}) => {
  const [products, setProducts] = useState<AlsoScannedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlsoScanned(currentProductId, category, subCategory, profileType, currentScore)
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [currentProductId, category, subCategory, profileType, currentScore]);

  // Don't show if not enough data yet
  if (!loading && products.length === 0) return null;

  return (
    <div className="bg-white rounded-[28px] border border-[#E8DDD0] overflow-hidden">
      
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">👥</span>
          <h3 className="font-bold text-sm text-[#1B3D2F]">
            Others also scanned
          </h3>
        </div>
        <p className="text-[11px] text-[#8E9299]">
          Products in the same category scanned by ReadYourLabels users
          — these scored higher. Always scan to confirm.
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="px-5 pb-5 flex gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 h-20 bg-[#F5F5F5] rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Products */}
      {!loading && products.length > 0 && (
        <div className="px-5 pb-5 space-y-2">
          {products.map((p, i) => (
            <div key={i}
              className="flex items-center justify-between p-3.5 bg-[#FDF6EE] rounded-2xl">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-[#1B3D2F] truncate">
                  {p.product_name}
                </div>
                <div className="text-[10px] text-[#8E9299] mt-0.5">
                  {p.brand} · {p.scan_count} users scanned this
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                <ScoreChip score={p.overall_score} />
                <button
                  onClick={() => onScanSuggested(p.product_name)}
                  className="text-[10px] font-bold text-[#1B3D2F] bg-white border border-[#E8DDD0] px-2.5 py-1.5 rounded-xl active:scale-95 transition-all">
                  Scan →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legal-safe footer */}
      <div className="px-5 pb-4">
        <p className="text-[9px] text-[#8E9299] leading-relaxed">
          Scores based on label data at time of scan. Formulations change —
          always scan the product in your hand to get an accurate verdict.
          ReadYourLabels does not endorse any brand.
        </p>
      </div>
    </div>
  );
};
