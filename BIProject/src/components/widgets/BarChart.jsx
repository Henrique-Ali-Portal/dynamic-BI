import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function SimpleBarChart({ data, config }) {
  const processedData = useMemo(() => {
    if (!data || !config || !config.xAxisColumn || !config.yAxisColumn || !config.aggregation) {
      return [];
    }

    // 1. Group data by the X-axis column
    const groupedData = data.reduce((acc, row) => {
      const key = row[config.xAxisColumn];
      const value = parseFloat(row[config.yAxisColumn]);

      if (key && !isNaN(value)) {
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(value);
      }
      return acc;
    }, {});

    // 2. Apply the selected aggregation function to each group
    return Object.entries(groupedData).map(([name, values]) => {
      let aggregatedValue;
      switch (config.aggregation) {
        case 'Soma':
          aggregatedValue = values.reduce((sum, current) => sum + current, 0);
          break;
        case 'Média':
          aggregatedValue = values.reduce((sum, current) => sum + current, 0) / values.length;
          break;
        case 'Contagem':
          aggregatedValue = values.length;
          break;
        case 'Mínimo':
          aggregatedValue = Math.min(...values);
          break;
        case 'Máximo':
          aggregatedValue = Math.max(...values);
          break;
        default:
          aggregatedValue = 0;
      }

      return {
        name,
        [config.yAxisColumn]: aggregatedValue,
      };
    });
  }, [data, config]);

  if (!processedData.length) {
    return <div className="text-center text-gray-500">Dados insuficientes ou configuração incompleta para exibir o gráfico.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={processedData}
        margin={{
          top: 5,
          right: 20,
          left: -10,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => typeof value === 'number' ? value.toLocaleString('pt-BR') : value} />
        <Legend />
        <Bar dataKey={config.yAxisColumn} fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default SimpleBarChart;