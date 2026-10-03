import "server-only";

// Single server entry point for this service: collection -> filtering -> AI output.
import { analyzeOpportunity, recommendOpportunities } from "./_lib/ai";
import { searchOpportunities, type Profile, type SearchOptions } from "./_lib/catalog";
import { getOpportunities } from "./_lib/feeds";

export async function listOpportunities(options: SearchOptions) {
  return searchOpportunities(await getOpportunities(), options);
}

export async function getOpportunityAnalysis(id: string) {
  const opportunity = (await getOpportunities()).find((item) => item.id === id);
  return opportunity ? analyzeOpportunity(opportunity) : null;
}

export async function getRecommendations(profile: Profile) {
  const items = await listOpportunities({ sort: "recent" });
  return recommendOpportunities(items, profile);
}
