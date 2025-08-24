export interface Tip {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: TipCategory;
  isBookmarked?: boolean;
  externalUrl?: string;
}

export type TipCategory = 
  | 'battery' 
  | 'storage' 
  | 'network' 
  | 'performance' 
  | 'privacy' 
  | 'general';

export interface DidYouKnowInsight {
  id: string;
  title: string;
  content: string;
  icon: string;
  category: TipCategory;
}

export interface CategoryInfo {
  key: TipCategory;
  name: string;
  color: string;
  icon: string;
}