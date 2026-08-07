export type TimeGrain = 'hour' | 'day' | 'week' | 'month';

export type Filter = {
  dim: string;
  values: (string | number)[]; // rows matching ANY value are kept
};

export type QuerySpec = {
  measures: string[]; // required — what to aggregate
  dimensions?: string[]; // what to group by
  timeGrain?: TimeGrain; // optional time bucket, becomes a 'time' column
  filters?: Filter[]; // dimension filters
  dateRange?: { start: string; end: string }; // half-open [start, end), UTC
  orderBy?: { key: string; dir: 'asc' | 'desc' }[];
  limit?: number;
};
