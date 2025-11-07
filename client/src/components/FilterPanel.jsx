import { useState, useEffect, useMemo } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

const isEmptyValue = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

const FilterPanel = ({
  filters = [],
  onFilterChange,
  onReset,
  searchPlaceholder = 'Tìm kiếm trong tất cả cột...',
  initialFilters = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(initialFilters);

  useEffect(() => {
    setActiveFilters(initialFilters);
  }, [initialFilters]);

  const filterDictionary = useMemo(() => {
    const map = {
      search: { label: 'Từ khóa' }
    };
    filters.forEach((filter) => {
      map[filter.key] = filter;
      if (filter.type === 'range') {
        map[`${filter.key}_min`] = filter;
        map[`${filter.key}_max`] = filter;
      }
      if (filter.dateRange) {
        map[`${filter.key}_from`] = filter;
        map[`${filter.key}_to`] = filter;
      }
    });
    return map;
  }, [filters]);

  const getOptionLabel = (filter, value) => {
    if (!filter?.options) return value;
    const option = filter.options.find((opt) => String(opt.value) === String(value));
    return option?.label || value;
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...activeFilters };

    if (Array.isArray(value)) {
      if (value.length === 0) {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
    } else if (isEmptyValue(value)) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }

    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    setActiveFilters({});
    onFilterChange({});
    onReset?.();
  };

  const activeFilterCount = Object.entries(activeFilters).reduce((total, [key, value]) => {
    if (key === 'search' && isEmptyValue(value)) return total;
    if (Array.isArray(value)) return value.length > 0 ? total + 1 : total;
    return isEmptyValue(value) ? total : total + 1;
  }, 0);

  const activeChips = Object.entries(activeFilters)
    .filter(([key, value]) => {
      if (key === 'search') {
        return !isEmptyValue(value);
      }
      return !isEmptyValue(value);
    })
    .map(([key, value]) => {
      const meta = filterDictionary[key] || { label: key };
      let displayValue = value;

      if (Array.isArray(value)) {
        displayValue = value.map((item) => getOptionLabel(meta, item)).join(', ');
      } else if (meta.options) {
        displayValue = getOptionLabel(meta, value);
      } else if (key.endsWith('_min')) {
        displayValue = `≥ ${value}`;
      } else if (key.endsWith('_max')) {
        displayValue = `≤ ${value}`;
      } else if (key.endsWith('_from')) {
        displayValue = `Từ ${value}`;
      } else if (key.endsWith('_to')) {
        displayValue = `Đến ${value}`;
      }

      return {
        key,
        label: meta.label || key,
        value: displayValue
      };
    });

  const renderFilterField = (filter) => {
    const currentValue = activeFilters[filter.key];

    if (filter.type === 'select') {
      return (
        <select
          value={currentValue || ''}
          onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          <option value="">Tất cả</option>
          {filter.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (filter.type === 'multi-select') {
      const selected = Array.isArray(currentValue) ? currentValue : [];
      return (
        <div className="space-y-2">
          {filter.options?.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <label key={option.value} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    if (checked) {
                      handleFilterChange(filter.key, selected.filter((item) => item !== option.value));
                    } else {
                      handleFilterChange(filter.key, [...selected, option.value]);
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      );
    }

    if (filter.type === 'range' && !filter.dateRange) {
      return (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Từ"
            value={activeFilters[`${filter.key}_min`] || ''}
            onChange={(e) => handleFilterChange(`${filter.key}_min`, e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <input
            type="number"
            placeholder="Đến"
            value={activeFilters[`${filter.key}_max`] || ''}
            onChange={(e) => handleFilterChange(`${filter.key}_max`, e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      );
    }

    if (filter.type === 'date' || filter.dateRange) {
      if (filter.dateRange) {
        return (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              placeholder="Từ ngày"
              value={activeFilters[`${filter.key}_from`] || ''}
              onChange={(e) => handleFilterChange(`${filter.key}_from`, e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <input
              type="date"
              placeholder="Đến ngày"
              value={activeFilters[`${filter.key}_to`] || ''}
              onChange={(e) => handleFilterChange(`${filter.key}_to`, e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        );
      }

      return (
        <input
          type="date"
          value={currentValue || ''}
          onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      );
    }

    return (
      <input
        type="text"
        placeholder={filter.placeholder || 'Nhập giá trị...'}
        value={currentValue || ''}
        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      />
    );
  };

  return (
    <div className="relative space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={activeFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <Button
          type="button"
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
          <Filter size={16} />
          Bộ lọc
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-white text-blue-600 rounded-full px-1.5 py-0.5 text-xs font-semibold">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-gray-600 hover:text-red-600"
          >
            Xóa tất cả
          </Button>
        )}
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
            >
              <span className="uppercase tracking-wide text-[10px] text-blue-500">{chip.label}</span>
              <span>{chip.value}</span>
              <button
                type="button"
                onClick={() => handleFilterChange(chip.key, Array.isArray(activeFilters[chip.key]) ? [] : '')}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <Card className="absolute top-full left-0 mt-2 z-50 w-80 shadow-xl border border-blue-100">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Bộ lọc nâng cao</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-gray-800"
                  onClick={() => setIsOpen(false)}
                >
                  <X size={16} />
                </Button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {filters && filters.length > 0 ? (
                  filters.map((filter) => (
                    <div key={filter.key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {filter.label}
                      </label>
                      {renderFilterField(filter)}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4 text-sm">
                    Không có bộ lọc nào
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                  Xóa bộ lọc
                </Button>
                <Button type="button" size="sm" onClick={() => setIsOpen(false)}>
                  Áp dụng
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default FilterPanel;

