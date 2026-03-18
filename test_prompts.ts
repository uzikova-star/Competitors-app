import { getPrompt, getIndustryGuidance } from './services/prompts';

const testInputs = [
  { url: "https://www.lidl.sk", country: "Slovakia", industry: "Groecreis" },
  { url: "https://www.ikea.com", country: "Slovakia", industry: "Furniture" },
  { url: "https://www.uber.com", country: "Germany", industry: "Transport" }
];

testInputs.forEach(input => {
  console.log(`--- Testing: ${input.url} in ${input.country} ---`);
  const guidance = getIndustryGuidance(input.url, input.country, input.industry);
  console.log("Guidance Sample (PHASE 1):");
  console.log(guidance.split('\n').slice(0, 10).join('\n'));
  console.log("\n");
});
