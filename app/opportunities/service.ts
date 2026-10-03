import "server-only";

// Single server entry point for this service: collection -> filtering -> AI output.
import { analyzeOpportunity, recommendOpportunities } from "./_lib/ai";
import { searchOpportunities, type OpportunityCategory, type Profile, type SearchOptions } from "./_lib/catalog";
import { enrichOpportunityForAnalysis, getOpportunities } from "./_lib/feeds";

export async function listOpportunities(options: SearchOptions) {
  return searchOpportunities(await getOpportunities(), options);
}

export async function getOpportunityAnalysis(id: string) {
  const opportunity = (await getOpportunities()).find((item) => item.id === id);
  return opportunity ? analyzeOpportunity(await enrichOpportunityForAnalysis(opportunity)) : null;
}

export async function getRecommendations(profile: Profile, category: OpportunityCategory) {
  const items = await listOpportunities({ sort: "recent", category });
  return recommendOpportunities(items, profile);
}
