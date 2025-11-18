import React, { useMemo } from 'react';

function SingleValue({ data, config }) {
  const processedValue = useMemo(() => {
    if (!data || !config || !config.column || !config.aggregation) {
      return 'N/A';
    }

    const values = data.map(row => parseFloat(row[config.column])).filter(value => !isNaN(value));

    if (values.length === 0) {
      return 'N/A';
    }

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
        aggregatedValue = 'N/A';
    }

    // Format the number for display
    return typeof aggregatedValue === 'number' ? aggregatedValue.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : aggregatedValue;
  }, [data, config]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h4 className="text-lg text-gray-500 mb-2">{config.aggregation} de {config.column}</h4>
      <p className="text-5xl font-bold text-gray-800">
        {processedValue}
      </p>
    </div>
  );
}

export default SingleValue;