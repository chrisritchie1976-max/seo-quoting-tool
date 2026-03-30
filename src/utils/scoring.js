// Formula 1A: Monthly revenue potential
export function calcMonthlyRevenue({ volume, convRate, closeRate, avgSaleValue }) {
  const leads = volume * (convRate / 100);
  const sales = leads * (closeRate / 100);
  const revenue = sales * avgSaleValue;
  return { leads, sales, revenue };
}

// Formula 1B: Traffic value (Ahrefs CPC is in USD cents)
export function calcTrafficValue({ volume, cpc }) {
  return (volume * cpc) / 100;
}

// Formula 2: Tier score (0-100)
export function calcTierScore({ keywords, suburbCount, isYMYL, areaTypes = {} }) {
  let score = 0;
  const totalVolume = keywords.reduce((s, k) => s + (k.volume || 0), 0);
  const avgVolume = keywords.length ? totalVolume / keywords.length : 0;
  const avgKD = keywords.length
    ? keywords.reduce((s, k) => s + (k.kd || 0), 0) / keywords.length
    : 0;
  const avgCPC = keywords.length
    ? keywords.reduce((s, k) => s + (k.cpc || 0), 0) / keywords.length
    : 0;

  // Volume score (0-30)
  if (avgVolume > 5000)      score += 30;
  else if (avgVolume > 2000) score += 24;
  else if (avgVolume > 1000) score += 18;
  else if (avgVolume > 500)  score += 12;
  else if (avgVolume > 200)  score += 7;
  else                       score += 3;

  // Difficulty score (0-25)
  if (avgKD > 60)      score += 25;
  else if (avgKD > 45) score += 20;
  else if (avgKD > 30) score += 15;
  else if (avgKD > 20) score += 10;
  else                 score += 5;

  // Suburbs score (0-20)
  if (suburbCount >= 10)     score += 20;
  else if (suburbCount >= 7) score += 15;
  else if (suburbCount >= 5) score += 12;
  else if (suburbCount >= 3) score += 8;
  else                       score += 4;

  // YMYL bonus (0-15)
  if (isYMYL) score += 15;

  // CPC score (0-10)
  const cpcUSD = avgCPC / 100;
  if (cpcUSD > 20)      score += 10;
  else if (cpcUSD > 10) score += 8;
  else if (cpcUSD > 5)  score += 6;
  else if (cpcUSD > 2)  score += 4;
  else                  score += 2;

  // Metro area bonus (0-10) — Metro suburbs are more competitive
  const areaValues = Object.values(areaTypes);
  const metroCount = areaValues.filter(v => v === 'Metro').length;
  const metroRatio = areaValues.length > 0 ? metroCount / areaValues.length : 0;
  if (metroRatio >= 1.0)       score += 10;
  else if (metroRatio >= 0.75) score += 7;
  else if (metroRatio >= 0.5)  score += 5;
  else if (metroRatio > 0)     score += 3;

  return { score: Math.min(score, 100), avgKD, avgVolume, totalVolume, avgCPC, metroRatio };
}

export function scoreToTier(score) {
  if (score >= 80) return 'Enterprise';
  if (score >= 65) return 'Pro';
  if (score >= 50) return 'Advanced';
  if (score >= 35) return 'Intermediate';
  return 'Basic';
}

export function calcROI({ monthlyRevenue, retainerMin, retainerMax }) {
  const avgRetainer = (retainerMin + retainerMax) / 2;
  const annualCost = avgRetainer * 12;
  const annualRevenue = monthlyRevenue * 12;
  const roi = annualCost > 0 ? ((annualRevenue - annualCost) / annualCost) * 100 : 0;
  return { avgRetainer, annualCost, annualRevenue, roi };
}
