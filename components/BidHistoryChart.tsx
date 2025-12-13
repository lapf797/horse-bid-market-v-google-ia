import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Bid } from '../types';

interface BidHistoryChartProps {
  bids: Bid[];
  startPrice: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-sm">
        <p className="text-sm font-bold text-equus-navy">
            {payload[0].value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
        <p className="text-xs text-gray-500">{new Date(label).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
      </div>
    );
  }
  return null;
};

const BidHistoryChart: React.FC<BidHistoryChartProps> = ({ bids, startPrice }) => {
  // Transform data for chart
  // Add an initial point for start price
  const data = [
      { timestamp: bids.length > 0 ? new Date(bids[0].timestamp.getTime() - 1000 * 60 * 60).toISOString() : new Date().toISOString(), amount: startPrice },
      ...bids.map(b => ({
    timestamp: b.timestamp.toISOString(),
    amount: b.amount,
  }))];

  return (
    <div className="w-full h-64 bg-white p-4 rounded-sm border border-gray-200">
      <h3 className="text-sm font-serif font-bold text-equus-navy mb-4 uppercase tracking-widest">Evolução de Preço</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="timestamp" 
            hide={true} 
          />
          <YAxis 
             domain={['dataMin', 'auto']}
             tickFormatter={(value) => `R$${value/1000}k`}
             stroke="#9ca3af"
             tick={{fontSize: 12}}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="amount" 
            stroke="#C5A059" 
            fill="#C5A059" 
            fillOpacity={0.1} 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BidHistoryChart;