#!/usr/bin/env node
/**
 * Direct App Store research using public RSS feeds
 * No authentication required - purely public review data
 */

import https from "node:https";
import { writeFileSync } from "node:fs";

async function fetchUrl(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: timeoutMs }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    });
    
    request.on("timeout", () => {
      request.destroy();
      reject(new Error("Request timeout"));
    });
    request.on("error", reject);
  });
}

async function fetchAppleReviews(appId, country = "us", limit = 30) {
  const url = `https://itunes.apple.com/${country}/rss/customerreviews/id=${appId}/sortBy=mostRecent/json`;
  
  try {
    const text = await fetchUrl(url);
    const data = JSON.parse(text);
    const entries = Array.isArray(data?.feed?.entry) ? data.feed.entry.slice(1) : [];
    
    return entries.slice(0, limit).map(entry => ({
      title: entry?.title?.label || "",
      body: entry?.content?.label || "",
      rating: Number(entry?.["im:rating"]?.label || 0),
      updated: entry?.updated?.label || null,
      author: entry?.author?.name?.label || "Anonymous"
    }));
  } catch (error) {
    console.error(`  ⚠️  Reviews fetch failed: ${error.message}`);
    return [];
  }
}

// Known app IDs for relevant apps (researched from public App Store)
const targetApps = [
  // Alarm apps with task/puzzle engagement
  { id: "1163786766", name: "Alarmy (Sleep If U Can)", category: "alarm-task", reason: "Task-based alarm with game mode" },
  { id: "1154714828", name: "Wake Alarm Clock", category: "alarm-basic", reason: "Popular basic alarm" },
  { id: "574409170", name: "Alarm Clock Pro", category: "alarm-basic", reason: "Long-established alarm app" },
  
  // Movement-based wake-up
  { id: "974676505", name: "Stand Up!", category: "movement", reason: "Break reminders with movement" },
  { id: "1124255981", name: "Moves", category: "movement", reason: "Activity tracking" },
  
  // Habit/accountability apps
  { id: "921856313", name: "Habitica", category: "gamified-task", reason: "Gamified habit tracking with social accountability" },
  { id: "1051373351", name: "Streaks", category: "habit", reason: "Daily habit tracking" },
  { id: "1230062106", name: "Done - A Day Planner", category: "habit", reason: "Minimal task with habit focus" },
  
  // Task management with commitment
  { id: "544007664", name: "Todoist", category: "task-management", reason: "Feature-rich task app" },
  { id: "949271866", name: "Things 3", category: "task-management", reason: "Premium task app" },
  
  // Focus/distraction apps
  { id: "1532875441", name: "One Sec", category: "focus", reason: "App usage blocker" },
  { id: "953494944", name: "Freedom", category: "focus", reason: "Distraction blocker" },
];

async function analyzeReviews(reviews) {
  const analysis = {
    totalReviews: reviews.length,
    avgRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    topComplaints: [],
    topDelights: [],
    topFeatureRequests: [],
    themes: new Map(),
  };
  
  if (reviews.length === 0) return analysis;
  
  let totalRating = 0;
  
  const complaintKeywords = [
    { pattern: /snooze|keep.*snooze/i, label: "Snooze behavior" },
    { pattern: /too easy|not.*hard|no friction/i, label: "Insufficient friction" },
    { pattern: /crash|bug|doesn't work/i, label: "Technical issues" },
    { pattern: /hard.*wake|still sleep/i, label: "Ineffective wake-up" },
    { pattern: /sound|notification|ring/i, label: "Audio issues" },
    { pattern: /boring|not engaging/i, label: "Low engagement" },
    { pattern: /ads|in-app purchase|paywall/i, label: "Monetization issues" },
    { pattern: /privacy|data|track.*location/i, label: "Privacy concerns" },
    { pattern: /task too.*hard|puzzle.*difficult/i, label: "Task difficulty" },
    { pattern: /password protect/i, label: "Requires authentication" },
  ];
  
  const delightKeywords = [
    { pattern: /love|great|amazing|excellent/i, label: "General satisfaction" },
    { pattern: /actually.*work|really.*wake/i, label: "Actually effective" },
    { pattern: /fun|enjoy|engaging/i, label: "Engagement enjoyment" },
    { pattern: /helped.*habit|track|motivation/i, label: "Behavior change" },
    { pattern: /simple|easy|intuitive/i, label: "UX quality" },
  ];
  
  const featureKeywords = [
    { pattern: /wish|need|want|feature|could|should add/i, label: "General request" },
    { pattern: /repeat|recurring|weekday/i, label: "Scheduling requests" },
    { pattern: /integrate|sync|calendar|import/i, label: "Integration requests" },
    { pattern: /dark mode|theme|custom/i, label: "UI customization" },
    { pattern: /friend|social|share|accountability/i, label: "Social features" },
  ];
  
  for (const review of reviews) {
    const text = `${review.title} ${review.body}`.toLowerCase();
    totalRating += review.rating;
    analysis.ratingDistribution[review.rating]++;
    
    for (const { pattern, label } of complaintKeywords) {
      if (pattern.test(text) && review.rating <= 2) {
        if (!analysis.themes.has(label)) analysis.themes.set(label, []);
        analysis.themes.get(label).push({
          type: "complaint",
          quote: review.body.substring(0, 120),
          rating: review.rating
        });
      }
    }
    
    for (const { pattern, label } of delightKeywords) {
      if (pattern.test(text) && review.rating >= 4) {
        if (!analysis.themes.has(label)) analysis.themes.set(label, []);
        analysis.themes.get(label).push({
          type: "delight",
          quote: review.body.substring(0, 120),
          rating: review.rating
        });
      }
    }
    
    for (const { pattern, label } of featureKeywords) {
      if (pattern.test(text)) {
        if (!analysis.themes.has(`Feature: ${label}`)) analysis.themes.set(`Feature: ${label}`, []);
        analysis.themes.get(`Feature: ${label}`).push({
          type: "feature_request",
          quote: review.body.substring(0, 120)
        });
      }
    }
  }
  
  analysis.avgRating = totalRating / reviews.length;
  
  // Extract top themes
  const sorted = Array.from(analysis.themes.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8);
  
  for (const [label, items] of sorted) {
    const complaints = items.filter(i => i.type === "complaint");
    const delights = items.filter(i => i.type === "delight");
    const features = items.filter(i => i.type === "feature_request");
    
    if (complaints.length) {
      analysis.topComplaints.push({
        theme: label,
        count: complaints.length,
        samples: complaints.slice(0, 2)
      });
    }
    if (delights.length) {
      analysis.topDelights.push({
        theme: label,
        count: delights.length,
        samples: delights.slice(0, 2)
      });
    }
    if (features.length) {
      analysis.topFeatureRequests.push({
        theme: label,
        count: features.length,
        samples: features.slice(0, 2)
      });
    }
  }
  
  return analysis;
}

async function main() {
  console.log("📱 Direct App Store Research\n");
  console.log("Fetching reviews for alarm, task, and accountability apps...\n");
  
  const results = [];
  
  for (const app of targetApps) {
    process.stdout.write(`${app.name.padEnd(30)} ... `);
    
    try {
      const reviews = await fetchAppleReviews(app.id, "us", 40);
      const analysis = await analyzeReviews(reviews);
      
      const result = {
        id: app.id,
        name: app.name,
        category: app.category,
        reason: app.reason,
        appUrl: `https://apps.apple.com/us/app/id${app.id}`,
        rating: analysis.avgRating.toFixed(1),
        reviewCount: analysis.totalReviews,
        ratingDistribution: analysis.ratingDistribution,
        topComplaints: analysis.topComplaints,
        topDelights: analysis.topDelights,
        topFeatureRequests: analysis.topFeatureRequests,
        sampleReviews: reviews.slice(0, 5)
      };
      
      results.push(result);
      console.log(`✓ (${analysis.avgRating.toFixed(1)}★ from ${reviews.length} reviews)`);
      
    } catch (error) {
      console.log(`✗ ${error.message}`);
    }
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  writeFileSync(".workflow/iphone-app-factory/research/raw-apps.json", JSON.stringify(results, null, 2));
  console.log(`\n✓ Analysis complete. ${results.length} apps researched.\n`);
  
  return results;
}

await main();
