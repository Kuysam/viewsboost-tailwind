export type TemplateCategory = {
  key: string;
  label: string;
  subcategories?: { key: string; label: string }[];
  defaultAspect?: '9/16' | '1/1' | '16/9';
};

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { key: 'Shorts', label: 'Shorts', defaultAspect: '9/16', subcategories: [
    { key: 'Reels', label: 'Reels' },
    { key: 'Stories', label: 'Stories' },
    { key: 'Shorts', label: 'Shorts' },
  ]},
  { key: 'Thumbnails', label: 'Thumbnails', defaultAspect: '16/9' },
  { key: 'Docs', label: 'Docs', defaultAspect: '1/1', subcategories: [
    { key: 'Resume', label: 'Resumes' },
    { key: 'Report', label: 'Reports' },
    { key: 'Proposal', label: 'Proposals' },
  ]},
  { key: 'Social', label: 'Social', defaultAspect: '1/1' },
  { key: 'Ads', label: 'Ads', defaultAspect: '16/9' },
  { key: 'Print', label: 'Print', defaultAspect: '1/1' },
  { key: 'Web', label: 'Web', defaultAspect: '16/9' },
  { key: 'Branding', label: 'Branding', defaultAspect: '1/1' },
  { key: 'Events', label: 'Events', defaultAspect: '1/1' },
  { key: 'Commerce', label: 'Commerce', defaultAspect: '1/1' },
];

export function getTopCategories(): TemplateCategory[] {
  return TEMPLATE_CATEGORIES;
}


