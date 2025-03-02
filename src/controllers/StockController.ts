import { NextFunction, Request, Response } from "express";
import pool from "../config/database";

export const getAllStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await pool.query("SELECT * FROM stocks");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching stocks:", error);
    res.status(500).json({ error: "Failed to fetch stocks" });
  }
};

export const addStock = async (req: Request, res: Response): Promise<void> => {
  const { drug_id, amount, expired, unit_price } = req.body;

  // Validate required fields
  if (!drug_id || !amount || !expired || !unit_price) {
    res.status(400).json({
      error: "Missing required fields",
      required: { drug_id, amount, expired, unit_price },
    });
    return;
  }

  try {
    // First check if drug exists
    const drugCheck = await pool.query(
      "SELECT drug_id FROM drugs WHERE drug_id = $1",
      [drug_id]
    );

    if (drugCheck.rows.length === 0) {
      res.status(404).json({ error: "Drug not found" });
      return;
    }

    const result = await pool.query(
      "INSERT INTO stocks (drug_id, amount, expired, unit_price) VALUES ($1, $2, $3, $4) RETURNING *",
      [drug_id, amount, expired, unit_price]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("Stock creation error:", error);
    res.status(500).json({
      error: "Failed to create stock",
      details: error.message,
    });
  }
};

export const updateStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params; // Stock ID from URL
  const { amount, expired, unit_price } = req.body; // Fields to update

  try {
    const result = await pool.query(
      "UPDATE stocks SET amount = $1, expired = $2, unit_price = $3 WHERE id = $4 RETURNING *",
      [amount, expired, unit_price, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Stock not found" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error(error); // Debugging log
    res.status(500).json({ error: "Failed to update stock" });
  }
};

export const getStockByDrugId = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { drug_id } = req.params; // Drug ID from URL

  try {
    const result = await pool.query("SELECT * FROM stocks WHERE drug_id = $1", [
      drug_id,
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "No stocks found for this drug" });
    }

    res.json(result.rows);
  } catch (error) {
    console.error(error); // Debugging log
    res.status(500).json({ error: "Failed to fetch stocks by drug ID" });
  }
};

export const getStockByStockId = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { stock_id } = req.params; // Extract stock_id from request URL

  try {
    const result = await pool.query(
      `SELECT s.stock_id, s.unit_price, s.amount, s.expired, 
              d.name AS drug_name, d.drug_type, d.unit_type 
       FROM stocks s
       JOIN drugs d ON s.drug_id = d.drug_id
       WHERE s.stock_id = $1`,
      [stock_id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Stock not found" });
    }

    res.status(200).json(result.rows[0]); // Return stock info with drug name
  } catch (error) {
    console.error("Error fetching stock:", error);
    res.status(500).json({ error: "Failed to fetch stock details" });
  }
};

export const getTopSellingStocks = async (
  req: Request,
  res: Response
): Promise<void> => {
  const client = await pool.connect();

  try {
    const query = `
      SELECT
        s.stock_id,
        d.name AS drug_name,
        s.unit_price,
        SUM(bi.quantity) AS total_quantity_sold
      FROM
        bill_items bi
      JOIN stocks s ON bi.stock_id = s.stock_id
      JOIN drugs d ON s.drug_id = d.drug_id
      WHERE
        bi.status = 'confirmed'
      GROUP BY
        s.stock_id, d.name, s.unit_price
      ORDER BY
        total_quantity_sold DESC
      LIMIT 5;
    `;

    const result = await client.query(query);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "No top selling stocks found" });
      return;
    }

    // Return the top 5 selling stocks
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching top selling stocks:", error);
    res.status(500).json({ error: "Failed to fetch top selling stocks" });
  } finally {
    client.release();
  }
};

export const getTotalSoldDrugs = async (
  req: Request,
  res: Response
): Promise<void> => {
  const client = await pool.connect();

  try {
    const query = `
      SELECT 
        d.name AS drug_name,
        COALESCE(SUM(bi.quantity), 0) AS total_quantity_sold
      FROM drugs d
      LEFT JOIN stocks s ON d.drug_id = s.drug_id
      LEFT JOIN bill_items bi ON s.stock_id = bi.stock_id AND bi.status = 'confirmed'
      GROUP BY d.name
      ORDER BY total_quantity_sold DESC;
    `;

    const result = await client.query(query);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "No sold drugs found" });
      return;
    }

    res.status(200).json(result.rows); // Return the drugs with total quantity sold
  } catch (error) {
    console.error("Error fetching total sold drugs:", error);
    res.status(500).json({ error: "Failed to fetch total sold drugs" });
  } finally {
    client.release();
  }
};
