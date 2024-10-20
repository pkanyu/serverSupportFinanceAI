// financeai-project/server/src/services/aiService.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Ensure you have set GEMINI_API_KEY in your environment variables
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in the environment variables");
}

const genAI = new GoogleGenerativeAI(API_KEY);

const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: "gemini-pro" });
};

const generateFinancialInsights = async (userData) => {
  const model = getGeminiModel();

  const prompt = `
    As an AI financial advisor, provide personalized advice based on the following financial data:
    
    Monthly Income: $${userData.income}
    Monthly Expenses: $${userData.expenses}
    Savings: $${userData.savings}
    Top Expense Categories: ${userData.topExpenseCategories.join(", ")}

    Please provide advice on:
    1. Budgeting strategies
    2. Saving opportunities
    3. Potential areas to reduce expenses
    4. Investment suggestions (if applicable)
    5. General financial health assessment

    Format the response in clear, concise bullet points.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating AI insights:", error);
    throw new Error("Failed to generate AI insights");
  }
};

const cleanAndRepairJSON = (text) => {
  // Remove any markdown formatting
  let cleanedText = text.replace(/```json\n?|\n?```/g, "");

  // Remove any trailing commas before closing braces or brackets
  cleanedText = cleanedText.replace(/,\s*([\]}])/g, "$1");


  // Replace single quotes with double quotes for string values
  cleanedText = cleanedText.replace(/'/g, '"');

  return cleanedText;
};

const parseAIResponse = (text) => {
  const cleanedText = cleanAndRepairJSON(text);

  try {
    return JSON.parse(cleanedText);
  } catch (parseError) {
    console.error("Error parsing AI response:", parseError);
    console.log("Cleaned text:", cleanedText);

    // If parsing fails, attempt to extract JSON from the response
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerParseError) {
        console.error("Error parsing extracted JSON:", innerParseError);
        throw new Error("Unable to parse AI response");
      }
    } else {
      throw new Error("Unable to parse AI response");
    }
  }
};

const detectAnomalies = async (transactions) => {
  const model = getGeminiModel();

  const transactionSummary = transactions
    .map(
      (t) => `${t.date.toISOString()}: ${t.type} $${t.amount} - ${t.category}`
    )
    .join("\n");

  const prompt = `
    Analyze the following transaction history for any unusual patterns or potential fraudulent activities:

    ${transactionSummary}

    Please identify any anomalies or suspicious transactions, considering factors such as:
    1. Unusually large transactions
    2. Frequent small transactions from the same category
    3. Transactions at odd hours
    4. Sudden changes in spending patterns
    5. Transactions from unusual locations (if location data is available)

    For each anomaly detected, provide:
    1. The date and details of the suspicious transaction
    2. An explanation of why it's considered anomalous
    3. A risk level (low, medium, high)
    4. A recommendation for the user

    Format the response as a JSON array of objects, each containing the fields: date, details, explanation, riskLevel, and recommendation.
    Ensure all JSON property names and string values are enclosed in double quotes. Do not use single quotes for strings.
    Do not include any markdown formatting or additional text outside of the JSON structure.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();

    let parsedResponse;
    try {
      parsedResponse = parseAIResponse(rawText);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.log("Attempted to parse:", rawText);
      throw new Error("Failed to parse AI response");
    }

    if (!Array.isArray(parsedResponse)) {
      console.error("Parsed response is not an array:", parsedResponse);
      throw new Error("AI response is not in the expected format");
    }

    return parsedResponse;
  } catch (error) {
    console.error("Error detecting anomalies:", error);
    throw new Error(`Failed to detect anomalies: ${error.message}`);
  }
};

const generateCreditScore = async (userData) => {
  const model = getGeminiModel();

  const prompt = `
    As an AI credit scoring system, analyze the following financial data and provide a credit score and assessment:

    Monthly Income: $${userData.income}
    Monthly Expenses: $${userData.expenses}
    Savings: $${userData.savings}
    Debt-to-Income Ratio: ${userData.debtToIncomeRatio}
    Payment History: ${userData.paymentHistory} (e.g., "Excellent", "Good", "Fair", "Poor")
    Credit Utilization: ${userData.creditUtilization}%
    Length of Credit History: ${userData.creditHistoryLength} years

    Please provide:
    1. A credit score between 300 and 850
    2. An assessment of the credit score (e.g., Excellent, Good, Fair, Poor)
    3. Key factors influencing the score
    4. Recommendations for improving the credit score

    Format the response as a JSON object with the fields: score, assessment, factors, and recommendations.
    Do not include any markdown formatting or additional text outside of the JSON structure.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseAIResponse(response.text());
  } catch (error) {
    console.error("Error generating credit score:", error);
    throw new Error("Failed to generate credit score");
  }
};

const generateFinancialGoals = async (userData) => {
  const model = getGeminiModel();

  const prompt = `
    As an AI financial advisor, analyze the following financial data and suggest personalized financial goals:

    Monthly Income: $${userData.income}
    Monthly Expenses: $${userData.expenses}
    Current Savings: $${userData.savings}
    Debt-to-Income Ratio: ${userData.debtToIncomeRatio}
    Credit Score: ${userData.creditScore}
    Top Expense Categories: ${userData.topExpenseCategories.join(", ")}

    Based on this information, please suggest:
    1. Short-term goals (achievable within 3-6 months)
    2. Medium-term goals (achievable within 1-2 years)
    3. Long-term goals (achievable in 3-5 years or more)

    For each goal, provide:
    1. A clear description of the goal
    2. The timeframe for achieving the goal
    3. Specific steps or strategies to reach the goal
    4. Potential challenges and how to overcome them

    Format the response as a JSON object with the fields: shortTermGoals, mediumTermGoals, and longTermGoals. Each of these should be an array of goal objects.
    Do not include any markdown formatting or additional text outside of the JSON structure.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseAIResponse(response.text());
  } catch (error) {
    console.error("Error generating financial goals:", error);
    throw new Error("Failed to generate financial goals");
  }
};

const generateInvestmentRecommendations = async (userData) => {
  const model = getGeminiModel();

  const prompt = `
    As an AI financial advisor, provide personalized investment recommendations based on the following user data:

    Monthly Income: $${userData.income}
    Monthly Expenses: $${userData.expenses}
    Current Savings: $${userData.savings}
    Debt-to-Income Ratio: ${userData.debtToIncomeRatio}
    Credit Score: ${userData.creditScore}
    Risk Tolerance: ${userData.riskTolerance}
    Investment Horizon: ${userData.investmentHorizon} years
    Investment Goals: ${userData.investmentGoals.join(", ")}
    Current Investments: ${userData.currentInvestments.join(", ")}

    Based on this information, please provide:
    1. Asset allocation recommendation (e.g., stocks, bonds, real estate, cash)
    2. Specific investment vehicles or products to consider
    3. Estimated returns and associated risks
    4. Diversification strategies
    5. Recommendations for rebalancing and monitoring the portfolio

    For each recommendation, include:
    1. A clear description of the investment strategy
    2. The rationale behind the recommendation
    3. Potential risks and how to mitigate them
    4. Any tax implications to consider

    Format the response as a JSON object with the fields: assetAllocation, recommendedInvestments, estimatedReturns, diversificationStrategy, and monitoringStrategy.
    Ensure all JSON property names and string values are enclosed in double quotes. Do not use single quotes for strings.
    Do not include any markdown formatting or additional text outside of the JSON structure.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseAIResponse(response.text());
  } catch (error) {
    console.error("Error generating investment recommendations:", error);
    throw new Error("Failed to generate investment recommendations");
  }
};

module.exports = {
  generateFinancialInsights,
  detectAnomalies,
  generateCreditScore,
  generateFinancialGoals,
  generateInvestmentRecommendations,
};
