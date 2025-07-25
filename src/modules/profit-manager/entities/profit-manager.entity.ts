export class ProfitManager {}

export interface PriceData {
  world_name: string;
  buy_average_price: number;
  buy_highest_price: number;
  sell_lowest_price: number;
  sell_average_price: number;
  created_at: string;
}

export interface Prices {
  prices: PriceData[];
}
