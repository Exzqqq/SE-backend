import express, { Request, Response } from "express";
import {
  getAllStock,
  addStock,
  updateStock,
  getStockByDrugId,
  getStockByStockId,
  getTopSellingStocks,
  getTotalSoldDrugs,
} from "../controllers/StockController";

import {
  getAllDrugs,
  addDrug,
  getDrugById,
  updateDrug,
  deleteDrug,
} from "../controllers/DrugController";

import {
  createBill,
  listBills,
  removeBillItem,
  confirm,
  history,
  dashboard,
  getBillInfo,
} from "../controllers/BillController";

import {
  createExpense,
  getAllExpenses,
  updateExpense,
  deleteExpense,
} from "../controllers/expenseController";

import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.get("/stocks", getAllStock);
router.post("/stocks", addStock);
router.put("/stocks/:id", updateStock);
router.get("/stocks/drug/:drug_id", getStockByDrugId);
router.get("/stocks/drugs/:stock_id", getStockByStockId);
router.get("/stocks/top-selling", getTopSellingStocks);
router.get("/stocks/totalsell", getTotalSoldDrugs);

router.get("/drugs", getAllDrugs);
router.get("/drugs/:id", getDrugById);
router.post("/drugs", addDrug);
router.put("/drugs/:id", updateDrug);
router.delete("/drugs/:id", deleteDrug);
// router.get("/drugs/top", getTopDrugs);
// router.get("/drugs/search", searchDrugs);

// Bill routes
router.post("/bill/create", createBill);
router.get("/bill/list", listBills);
router.delete("/bill/remove/:id", removeBillItem);
router.post("/bill/confirm", confirm);
router.get("/bill/history", history);
router.get("/bill/dashboard/:year", dashboard);
router.get("/sell/info/:bill_id", getBillInfo);

//expense
// router.get("/expense/:page/:searchQuery?", getAllExpenses);
router.get("/expense/:page/:day?/:month?/:year?", getAllExpenses);
router.post("/expense/create", createExpense);
router.put("/expense/update/:id", updateExpense);
router.delete("/expense/remove/:id", deleteExpense);

router.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

export default router;
