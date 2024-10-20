// financeai-project/server/src/routes/finance.routes.js

const express = require("express");
const authMiddleware = require("../middleware/auth");
const financeController = require("../controllers/finance.controller");

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Helper function to check if the controller function exists
const checkControllerFunction = (functionName) => {
  if (typeof financeController[functionName] !== "function") {
    throw new Error(`Controller function ${functionName} is not defined`);
  }
  return financeController[functionName];
};

// Transaction routes
router.get("/transactions", checkControllerFunction("getTransactions"));
router.post("/transactions", checkControllerFunction("addTransaction"));

// Budget routes
router.get("/budgets", checkControllerFunction("getBudgets"));
router.post("/budgets", checkControllerFunction("createBudget"));

// Summary and analysis routes
router.get("/spending-summary", checkControllerFunction("getSpendingSummary"));
router.get(
  "/budget-comparison",
  checkControllerFunction("compareBudgetToActual")
);
router.get(
  "/financial-report",
  checkControllerFunction("generateFinancialReport")
);

// AI Financial Advice route
router.get("/ai-insights", checkControllerFunction("getAIFinancialAdvice"));
router.get("/detect-anomalies", financeController.detectFraudAndAnomalies);
router.get("/credit-score", financeController.getCreditScore);
router.get("/financial-goals", financeController.getFinancialGoals);
router.get(
  "/investment-recommendations",
  financeController.getInvestmentRecommendations
);


// Mock data generation route (for testing purposes)
router.post("/generate-mock-data", checkControllerFunction("generateMockData"));

module.exports = router;
