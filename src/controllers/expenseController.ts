import { Request, Response } from "express";
import pool from "../config/database";

export const createExpense = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Extract & validate input data
    const { datetime, quantity, name, price, totalprice } = req.body;

    // Ensure `quantity` and `totalprice` are numbers
    if (!quantity || isNaN(quantity)) {
      throw new Error("Quantity must be a valid number.");
    }

    if (!totalprice || isNaN(totalprice)) {
      throw new Error("Total price must be a valid number.");
    }

    // Query the most recent orderid to increment it
    const getLastOrderQuery =
      "SELECT orderid FROM expense ORDER BY orderid DESC LIMIT 1";
    const lastOrderResult = await client.query(getLastOrderQuery);
    let newOrderId = "1"; // Default to 1 if no previous records

    if (lastOrderResult.rows.length > 0) {
      const lastOrderId = parseInt(lastOrderResult.rows[0].orderid);
      newOrderId = (lastOrderId + 1).toString(); // Increment by 1
    }

    const insertExpenseQuery = `
      INSERT INTO expense (datetime, orderid, quantity, name, price, totalprice)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `;

    const expenseResult = await client.query(insertExpenseQuery, [
      datetime || new Date(),
      newOrderId, // Use the new incremented orderid
      parseInt(quantity), // Ensure it's an integer
      name,
      price ? parseFloat(price) : null, // Convert price if provided
      parseFloat(totalprice), // Ensure it's a float
    ]);

    const expenseId = expenseResult.rows[0].id;
    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Expense created successfully",
      id: expenseId,
      datetime,
      orderid: newOrderId, // Return the generated orderid
      quantity,
      name,
      price,
      totalprice,
    });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: (e as Error).message });
  } finally {
    client.release();
  }
};

export const getAllExpenses = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { page, day, month, year } = req.params;
    const pageNumber = parseInt(page, 10) || 1;

    const pageSize = 10;
    const offset = (pageNumber - 1) * pageSize;

    let countQuery = "SELECT COUNT(*) FROM expense";
    let countParams: any[] = [];

    let whereConditions: string[] = [];

    if (day) {
      whereConditions.push(`EXTRACT(DAY FROM datetime) = $1`);
      countParams.push(parseInt(day));
    }
    if (month) {
      whereConditions.push(
        `EXTRACT(MONTH FROM datetime) = $${countParams.length + 1}`
      );
      countParams.push(parseInt(month));
    }
    if (year) {
      whereConditions.push(
        `EXTRACT(YEAR FROM datetime) = $${countParams.length + 1}`
      );
      countParams.push(parseInt(year));
    }

    if (whereConditions.length > 0) {
      countQuery += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    const countResult = await client.query(countQuery, countParams);
    const totalRows = parseInt(countResult.rows[0].count, 10);

    let getExpensesQuery = `
      SELECT * FROM expense
      ORDER BY CAST(orderid AS INTEGER) DESC
      LIMIT $1 OFFSET $2
    `;
    let getExpensesParams: any[] = [pageSize, offset];

    if (whereConditions.length > 0) {
      getExpensesQuery = `
        SELECT * FROM expense
        WHERE ${whereConditions.join(" AND ")}
        ORDER BY CAST(orderid AS INTEGER) DESC
        LIMIT $${countParams.length + 1} OFFSET $${countParams.length + 2}
      `;
      getExpensesParams = [...countParams, pageSize, offset];
    }

    const expensesResult = await client.query(
      getExpensesQuery,
      getExpensesParams
    );

    const totalPages = Math.ceil(totalRows / pageSize);

    res.json({
      success: true,
      expenses: expensesResult.rows,
      totalRows,
      totalPages,
      currentPage: pageNumber,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  } finally {
    client.release();
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  const client = await pool.connect();
  const { id } = req.params;
  let { quantity, name, price, totalprice } = req.body;

  try {
    await client.query("BEGIN");

    const updateExpenseQuery = `
      UPDATE expense
      SET  quantity = $1, name = $2, price = $3, totalprice = $4
      WHERE id = $5
      RETURNING *;
    `;
    const expenseResult = await client.query(updateExpenseQuery, [
      quantity,
      name,
      price,
      totalprice,
      id,
    ]);

    if (expenseResult.rows.length === 0) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Expense updated successfully",
      expense: expenseResult.rows[0],
    });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: (e as Error).message });
  } finally {
    client.release();
  }
};

// Delete an expense
export const deleteExpense = async (req: Request, res: Response) => {
  const client = await pool.connect();
  const { id } = req.params; // Extract ID from URL

  try {
    await client.query("BEGIN");

    const deleteExpenseQuery = "DELETE FROM expense WHERE id = $1 RETURNING *";
    const expenseResult = await client.query(deleteExpenseQuery, [id]);

    if (expenseResult.rows.length === 0) {
      res.status(404).json({ error: "Expense not found" }); // Handle case where ID is invalid
      return;
    }

    await client.query("COMMIT");

    res.json({ success: true, message: "Expense deleted successfully" });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: (e as Error).message });
  } finally {
    client.release();
  }
};
