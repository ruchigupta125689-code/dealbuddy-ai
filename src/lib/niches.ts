export const NICHES = [
  { value: "fashion", label: "Fashion" },
  { value: "beauty", label: "Beauty & skincare" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "fitness", label: "Fitness & wellness" },
  { value: "food", label: "Food" },
  { value: "travel", label: "Travel" },
  { value: "finance", label: "Personal finance" },
  { value: "education", label: "Education & careers" },
  { value: "tech", label: "Tech & gadgets" },
  { value: "parenting", label: "Parenting & family" },
  { value: "gaming", label: "Gaming" },
  { value: "comedy", label: "Comedy & entertainment" },
  { value: "other", label: "Other" },
] as const;

export type Niche = (typeof NICHES)[number]["value"];
export const NICHE_VALUES = NICHES.map((n) => n.value) as [Niche, ...Niche[]];

export function nicheLabel(n: string | undefined): string {
  return NICHES.find((x) => x.value === n)?.label ?? n ?? "";
}
