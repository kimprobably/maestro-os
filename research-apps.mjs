#!/usr/bin/env node
/**
 * Research alarm clock and task-based wake-up apps from App Store
 * Gathers real review data to inform product decisions
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Import Consumer Radar tooling
const appleSource = await import("./apps/generated-consumer-app-radar/src/sources/apple.js");

const targetApps = [
  // Direct competitors - alarm clocks with task/engagement
  { term: "alarmy alarm clock", category: "alarm-task" },
  { term: "alarmy", category: "alarm-task" },
  { term: "wake up lab", category: "alarm-task" },
  { term: "puzzle alarm clock", category: "alarm-task" },
  { term: "productive alarm clock", category: "alarm-task" },
  
  // Accountability/commitment apps
  { term: "stickk commitment", category: "accountability" },
  { term: "beeminder", category: "accountability" },
  
  // Habit/task engagement apps
  { term: "habitica", category: "gamified-task" },
  { term: "todoist", category: "task-management" },
  
  // Movement/physical engagement apps
  { term: "7 minute workout", category: "movement" },
  { term: "apple health steps", category: "movement" },
];

async function searchAndCollectReviews() {
  const results = [];
  
  for (const { term, category } of targetApps) {
    console.log(`\n🔍 Searching for: "${term}"`);
    
    try {
      const searchResults = await appleSource.searchAppleApps(term, "US");
      
      if (!searchResults.length) {
        console.log(`  ⚠️  No results found for "${term}"`);
        continue;
      }
      
      const app = searchResults[0];
      const appId = app.trackId;
      const appName = app.trackName;
      const bundleId = app.bundleId;
      const appUrl = app.trackViewUrl;
      const rating = app.averageUserRating;
      const ratingCount = app.userRatingCount;
      const description = app.description?.substring(0, 300) || "";
      const price = app.price || 0;
      
      console.log(`  ✓ Found: ${appName} (rating: ${rating}★ from ${ratingCount} reviews)`);
      console.log(`  Getting recent reviews...`);
      
      // Fetch reviews
      let reviews = [];
      try {
        reviews = await appleSource.fetchAppleReviews(appId, "us", 30);
      } catch (e) {
        console.log(`  ⚠️  Could not fetch reviews: ${e.message}`);
      }
      
      results.push({
        name: appName,
        bundleId,
        trackId: appId,
        appUrl,
        category,
        rating: parseFloat(rating) || 0,
        ratingCount: parseInt(ratingCount) || 0,
        price,
        shortDescription: description,
        reviewsCollected: reviews.length,
        recentReviews: reviews.slice(0, 10).map(r => ({
          title: r.title,
          body: r.body,
          rating: r.rating,
          date: r.updated
        })),
        allReviews: reviews
      });
      
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 800));
  }
  
  return results;
}

async function analyzeReviews(app) {
  const reviews = app.allReviews || [];
  
  const complaints = [];
  const featureRequests = [];
  const delights = [];
  
  const complaintPatterns = [
    { pattern: /snooze/i, category: "Snooze behavior" },
    { pattern: /hard.*dismiss|too easy/i, category: "Insufficient friction" },
    { pattern: /doesn't work|crash|bug/i, category: "Bugs/Crashes" },
    { pattern: /wake.*up|sleep/i, category: "Sleep/Wake issues" },
    { pattern: /alarm.*ring|sound/i, category: "Sound issues" },
    { pattern: /puzzle|math|task/i, category: "Task difficulty" },
    { pattern: /not.*engaging|boring/i, category: "Low engagement" },
    { pattern: /too.*many ads|ads|premium/i, category: "Monetization friction" },
    { pattern: /privacy|data|track/i, category: "Privacy concerns" },
  ];
  
  const delightPatterns = [
    { pattern: /love|great|excellent|amazing/i, category: "General delight" },
    { pattern: /actually.*work|really.*work/i, category: "Effectiveness" },
    { pattern: /fun|enjoy|engaging/i, category: "Engagement joy" },
    { pattern: /habit|helped.*wake/i, category: "Behavior change" },
    { pattern: /simple|easy|intuitive/i, category: "UX delight" },
  ];
  
  const featurePatterns = [
    { pattern: /wish|need|want|feature|could|should/i, category: "General feature request" },
    { pattern: /time zone|sync|calendar|integration/i, category: "Integration requests" },
    { pattern: /dark mode|theme|customiz/i, category: "UI/Customization" },
  ];
  
  for (const review of reviews) {
    const text = `${review.title} ${review.body}`.toLowerCase();
    
    // Score sentiment
    let sentiment = 0;
    for (const { pattern } of delightPatterns) {
      if (pattern.test(text)) sentiment += review.rating;
    }
    for (const { pattern } of complaintPatterns) {
      if (pattern.test(text)) sentiment -= (5 - review.rating);
    }
    
    // Categorize
    for (const { pattern, category } of complaintPatterns) {
      if (pattern.test(text) && review.rating <= 2) {
        complaints.push({ category, text: review.body.substring(0, 150), rating: review.rating });
      }
    }
    
    for (const { pattern, category } of featurePatterns) {
      if (pattern.test(text)) {
        featureRequests.push({ category, text: review.body.substring(0, 150) });
      }
    }
    
    for (const { pattern, category } of delightPatterns) {
      if (pattern.test(text) && review.rating >= 4) {
        delights.push({ category, text: review.body.substring(0, 150), rating: review.rating });
      }
    }
  }
  
  return {
    topComplaints: complaints.slice(0, 5),
    topFeatureRequests: featureRequests.slice(0, 5),
    topDelights: delights.slice(0, 5),
    totalComplaints: complaints.length,
    totalFeatureRequests: featureRequests.length,
    totalDelights: delights.length,
  };
}

async function main() {
  console.log("📱 App Store Research: Alarm Clock & Task-Based Wake-Up Apps\n");
  console.log("Searching US App Store for relevant applications...\n");
  
  const apps = await searchAndCollectReviews();
  
  console.log("\n\n📊 Analyzing reviews...\n");
  
  const analyzed = [];
  for (const app of apps) {
    const analysis = await analyzeReviews(app);
    analyzed.push({ ...app, analysis });
  }
  
  // Save raw data
  writeFileSync(".workflow/iphone-app-factory/research/raw-apps.json", JSON.stringify(analyzed, null, 2));
  console.log("✓ Raw data saved to .workflow/iphone-app-factory/research/raw-apps.json");
  
  return analyzed;
}

const analyzed = await main();
export { analyzed };
