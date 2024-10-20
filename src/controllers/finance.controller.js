// financeai-project/server/src/controllers/finance.controller.js

const Transaction = require("../models/transaction.model");
const Budget = require("../models/budget.model");
const mongoose = require("mongoose");
const {
  transactionSchema,
  budgetSchema,
  dateRangeSchema,
} = require("../utils/validationSchemas");
const {
  generateFinancialInsights,
  detectAnomalies,
  generateCreditScore,
  generateFinancialGoals,
  generateInvestmentRecommendations,
} = require("../services/aiService");

exports.getInvestmentRecommendations = async (req, res, next) => {
  try {
    const userId = mongoose.Types.ObjectId(req.user);

    // Fetch user's financial data
    const [incomeData, expenseData, savingsData, creditScoreData] =
      await Promise.all([
        Transaction.aggregate([
          { $match: { user: userId, type: "income" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Transaction.aggregate([
          { $match: { user: userId, type: "expense" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Transaction.aggregate([
          { $match: { user: userId, category: "Savings" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        // Assuming you have a method to fetch or calculate credit score
        generateCreditScore({ user: userId }),
      ]);

    const income = incomeData[0]?.total || 0;
    const expenses = expenseData[0]?.total || 0;
    const savings = savingsData[0]?.total || 0;
    const creditScore = creditScoreData.score;

    // In a real application, you would fetch this data from user preferences or a separate investments table
    const mockInvestmentData = {
      riskTolerance: "Moderate",
      investmentHorizon: 10,
      investmentGoals: ["Retirement", "Wealth Accumulation"],
      currentInvestments: ["Stocks", "Bonds"],
    };

    const userData = {
      income,
      expenses,
      savings,
      debtToIncomeRatio: 0, // You may want to calculate this based on actual debt data
      creditScore,
      ...mockInvestmentData,
    };

    const investmentRecommendations = await generateInvestmentRecommendations(
      userData
    );

    res.json(investmentRecommendations);
  } catch (error) {
    console.error("Error in getInvestmentRecommendations:", error);
    res.status(500).json({
      error: "An error occurred while generating investment recommendations.",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};


exports.getFinancialGoals = async (req, res, next) => {
  try {
    const userId = mongoose.Types.ObjectId(req.user);

    // Fetch user's financial data
    const [incomeData, expenseData, savingsData, creditScoreData, topExpenses] =
      await Promise.all([
        Transaction.aggregate([
          { $match: { user: userId, type: "income" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Transaction.aggregate([
          { $match: { user: userId, type: "expense" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Transaction.aggregate([
          { $match: { user: userId, category: "Savings" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        // Assuming you have a method to fetch or calculate credit score
        generateCreditScore({ user: userId }),
        Transaction.aggregate([
          { $match: { user: userId, type: "expense" } },
          { $group: { _id: "$category", total: { $sum: "$amount" } } },
          { $sort: { total: -1 } },
          { $limit: 3 },
        ]),
      ]);

    const income = incomeData[0]?.total || 0;
    const expenses = expenseData[0]?.total || 0;
    const savings = savingsData[0]?.total || 0;
    const creditScore = creditScoreData.score;
    const topExpenseCategories = topExpenses.map((exp) => exp._id);

    const userData = {
      income,
      expenses,
      savings,
      debtToIncomeRatio: 0, // You may want to calculate this based on actual debt data
      creditScore,
      topExpenseCategories,
    };

    const financialGoals = await generateFinancialGoals(userData);

    res.json(financialGoals);
  } catch (error) {
    console.error("Error in getFinancialGoals:", error);
    res.status(500).json({
      error: "An error occurred while generating financial goals.",
      details: error.message,
    });
  }
};


exports.detectFraudAndAnomalies = async (req, res, next) => {
  try {
    const userId = mongoose.Types.ObjectId(req.user);
    const { lookbackDays = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);

    const transactions = await Transaction.find({
      user: userId,
      date: { $gte: startDate },
    }).sort({ date: -1 });

    if (transactions.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for the specified period." });
    }

    let anomalies;
    try {
      anomalies = await detectAnomalies(transactions);
    } catch (aiError) {
      console.error("AI Service Error:", aiError);
      return res.status(500).json({
        error: "An error occurred during anomaly detection.",
        details: aiError.message,
      });
    }

    if (!Array.isArray(anomalies)) {
      console.error("Unexpected anomalies format:", anomalies);
      return res.status(500).json({
        error: "Unexpected response format from anomaly detection.",
      });
    }

    res.json({
      anomalies,
      message: "Fraud and anomaly detection completed.",
    });
  } catch (error) {
    console.error("Error in detectFraudAndAnomalies:", error);
    res.status(500).json({
      error: "An error occurred during fraud and anomaly detection.",
      details: error.message,
    });
  }
};

exports.getCreditScore = async (req, res, next) => {
  try {
    const userId = mongoose.Types.ObjectId(req.user);

    // Fetch user's financial data
    const [incomeData, expenseData, debtData] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userId, type: "income" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: "expense" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { user: userId, category: "Debt Payment" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const income = incomeData[0]?.total || 0;
    const expenses = expenseData[0]?.total || 0;
    const debtPayments = debtData[0]?.total || 0;

    // Calculate some basic financial ratios
    const savings = income - expenses;
    const debtToIncomeRatio = debtPayments / income;

    // In a real application, you would fetch this data from a credit bureau or user's credit history
    const mockCreditData = {
      paymentHistory: "Good",
      creditUtilization: 30,
      creditHistoryLength: 5,
    };

    const userData = {
      income,
      expenses,
      savings,
      debtToIncomeRatio,
      ...mockCreditData,
    };

    const creditScore = await generateCreditScore(userData);

    res.json(creditScore);
  } catch (error) {
    console.error("Error in getCreditScore:", error);
    res.status(500).json({
      error: "An error occurred while generating the credit score.",
      details: error.message,
    });
  }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const { startDate, endDate, category, page = 1, limit = 10 } = req.query;

    let query = { user: req.user };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (category) {
      query.category = category;
    }

    const options = {
      sort: { date: -1 },
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    };

    const [transactions, total] = await Promise.all([
      Transaction.find(query, null, options),
      Transaction.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      transactions,
      currentPage: parseInt(page),
      totalPages,
      totalTransactions: total,
    });
  } catch (error) {
    next(error);
  }
};

exports.addTransaction = async (req, res, next) => {
  try {
    const { error } = transactionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { amount, type, category, description, date } = req.body;
    const newTransaction = new Transaction({
      user: req.user,
      amount,
      type,
      category,
      description,
      date: date || Date.now(),
    });
    await newTransaction.save();
    res.status(201).json(newTransaction);
  } catch (error) {
    next(error);
  }
};

exports.updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = transactionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: id, user: req.user },
      req.body,
      { new: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(updatedTransaction);
  } catch (error) {
    next(error);
  }
};

exports.deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedTransaction = await Transaction.findOneAndDelete({
      _id: id,
      user: req.user,
    });

    if (!deletedTransaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.getBudgets = async (req, res, next) => {
  try {
    const budgets = await Budget.find({ user: req.user });
    res.json(budgets);
  } catch (error) {
    next(error);
  }
};

exports.createBudget = async (req, res, next) => {
  try {
    const { error } = budgetSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { category, amount, period } = req.body;
    const newBudget = new Budget({
      user: req.user,
      category,
      amount,
      period,
    });
    await newBudget.save();
    res.status(201).json(newBudget);
  } catch (error) {
    next(error);
  }
};

exports.updateBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = budgetSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const updatedBudget = await Budget.findOneAndUpdate(
      { _id: id, user: req.user },
      req.body,
      { new: true }
    );

    if (!updatedBudget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    res.json(updatedBudget);
  } catch (error) {
    next(error);
  }
};

exports.deleteBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedBudget = await Budget.findOneAndDelete({
      _id: id,
      user: req.user,
    });

    if (!deletedBudget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    res.json({ message: "Budget deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.getSpendingSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = mongoose.Types.ObjectId(req.user);

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    const query = {
      user: userId,
      ...(Object.keys(dateQuery).length > 0 && { date: dateQuery }),
    };

    const summary = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: { category: "$category", type: "$type" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json(summary);
  } catch (error) {
    next(error);
  }
};

exports.compareBudgetToActual = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res
        .status(400)
        .json({ error: "Month and year are required query parameters" });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const budgets = await Budget.find({ user: req.user });
    const transactions = await Transaction.find({
      user: req.user,
      date: { $gte: startDate, $lte: endDate },
      type: "expense", // We only want to compare expenses to budgets
    });

    const comparison = budgets.map((budget) => {
      const actualSpending = transactions
        .filter((t) => t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        category: budget.category,
        budgeted: budget.amount,
        actual: actualSpending,
        difference: budget.amount - actualSpending,
      };
    });

    // Add categories that have transactions but no budget
    const budgetedCategories = budgets.map((b) => b.category);
    const transactionCategories = [
      ...new Set(transactions.map((t) => t.category)),
    ];

    transactionCategories.forEach((category) => {
      if (!budgetedCategories.includes(category)) {
        const actualSpending = transactions
          .filter((t) => t.category === category)
          .reduce((sum, t) => sum + t.amount, 0);

        comparison.push({
          category,
          budgeted: 0,
          actual: actualSpending,
          difference: -actualSpending,
        });
      }
    });

    res.json({
      period: { month: parseInt(month), year: parseInt(year) },
      comparison,
    });
  } catch (error) {
    next(error);
  }
};

exports.generateFinancialReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = mongoose.Types.ObjectId(req.user);

    const dateQuery = {
      $gte: new Date(startDate),
      $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
    };

    const query = { user: userId, date: dateQuery };

    const [incomeTotal, expenseTotal, categorySummary] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...query, type: "income" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { ...query, type: "expense" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: { category: "$category", type: "$type" },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.type": 1, total: -1 } },
      ]),
    ]);

    const report = {
      period: { startDate, endDate },
      income: incomeTotal[0]?.total || 0,
      expenses: expenseTotal[0]?.total || 0,
      netSavings: (incomeTotal[0]?.total || 0) - (expenseTotal[0]?.total || 0),
      categorySummary: categorySummary,
    };

    res.json(report);
  } catch (error) {
    next(error);
  }
};

exports.getAIFinancialAdvice = async (req, res, next) => {
  try {
    const userId = mongoose.Types.ObjectId(req.user);

    // Fetch user's financial data for the current month
    const currentDate = new Date();
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    const [incomeTotal, expenseTotal, topExpenses] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: "income",
            date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: "expense",
            date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: "expense",
            date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
          },
        },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
        { $limit: 3 },
      ]),
    ]);

    const userData = {
      income: incomeTotal[0]?.total || 0,
      expenses: expenseTotal[0]?.total || 0,
      savings: (incomeTotal[0]?.total || 0) - (expenseTotal[0]?.total || 0),
      topExpenseCategories: topExpenses.map((exp) => exp._id),
    };

    const aiInsights = await generateFinancialInsights(userData);

    res.json({
      financialSummary: userData,
      aiAdvice: aiInsights,
    });
  } catch (error) {
    next(error);
  }
};

exports.generateMockData = async (req, res, next) => {
  try {
    const userId = req.user;
    const categories = [
      "Food",
      "Transportation",
      "Entertainment",
      "Utilities",
      "Shopping",
    ];
    const transactionTypes = ["income", "expense"];

    // Generate transactions for the past year up to the current date
    const endDate = new Date();
    const startDate = new Date(
      endDate.getFullYear() - 1,
      endDate.getMonth(),
      endDate.getDate()
    );

    const mockTransactions = [];
    for (let i = 0; i < 200; i++) {
      mockTransactions.push({
        user: userId,
        amount: Math.floor(Math.random() * 1000) + 1,
        type: transactionTypes[
          Math.floor(Math.random() * transactionTypes.length)
        ],
        category: categories[Math.floor(Math.random() * categories.length)],
        description: `Mock transaction ${i + 1}`,
        date: new Date(
          startDate.getTime() +
            Math.random() * (endDate.getTime() - startDate.getTime())
        ),
      });
    }

    await Transaction.insertMany(mockTransactions);

    // Generate budgets for each category
    const mockBudgets = categories.map((category) => ({
      user: userId,
      category,
      amount: Math.floor(Math.random() * 1000) + 500,
      period: "monthly",
    }));

    await Budget.insertMany(mockBudgets);

    res.status(201).json({ message: "Mock data generated successfully" });
  } catch (error) {
    next(error);
  }
};
