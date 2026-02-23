import express from "express";
import cors from "cors";
import pool from "./db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();
const PORT = 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// ✅ Token create
function createToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// ✅ Auth middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization; // "Bearer <token>"

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Token format must be: Bearer <token>" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { user_id, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid/Expired token" });
  }
}

// ✅ Root test
app.get("/", (req, res) => {
  res.send("Server is running");
});

// ✅ DB test
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now");
    res.json({ dbTime: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================
   AUTH ROUTES
============================ */

// ✅ REGISTER
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password required" });
    }

    const existing = await pool.query("SELECT user_id FROM users WHERE email=$1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING user_id,name,email,created_at",
      [name, email, hashedPassword]
    );

    return res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ✅ LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password required" });
    }

    const result = await pool.query(
      "SELECT user_id,name,email,password FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email/password" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email/password" });
    }

    const token = createToken({ user_id: user.user_id, email: user.email });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: { user_id: user.user_id, name: user.name, email: user.email },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ✅ ME (token test)
app.get("/me", requireAuth, async (req, res) => {
  return res.status(200).json({
    message: "Token valid",
    user: req.user,
  });
});

/* ============================
   EXPENSE ROUTES (PROTECTED)
============================ */

// ✅ POST expense
// ✅ POST expense
app.post("/expenses", requireAuth, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { expense, date, reason } = req.body;

    if (expense === undefined || !date || !reason) {
      return res.status(400).json({ message: "Expense + date + reason required" });
    }

    const query = `
      INSERT INTO expense (user_id, expense, date, reason)
      VALUES ($1, $2, $3, $4)
      RETURNING expense_id, user_id, expense, date, reason
    `;

    const result = await pool.query(query, [user_id, expense, date, reason]);

    res.status(201).json({
      message: "Expense added successfully",
      data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET expenses (current user)
app.get("/expenses", requireAuth, async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const query = `
  SELECT expense_id, user_id, expense, date, reason
  FROM expense
  WHERE user_id=$1
  ORDER BY date DESC
`;

    const result = await pool.query(query, [user_id]);

    return res.status(200).json({
      message: "Expenses fetched successfully",
      data: result.rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ✅ PUT expense (only own record)
app.put("/expenses/:expense_id", requireAuth, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { expense_id } = req.params;
    const { expense, date, reason } = req.body;
if (expense === undefined || !date || !reason) {
  return res.status(400).json({ message: "expense + date + reason required" });
}

const query = `
  UPDATE expense
  SET expense=$1, date=$2, reason=$3
  WHERE expense_id=$4 AND user_id=$5
  RETURNING expense_id, user_id, expense, date, reason
`;

const result = await pool.query(query, [expense, date, reason, expense_id, user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }

    return res.status(200).json({
      message: "Expense updated successfully",
      data: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE expense (only own record)
app.delete("/expenses/:expense_id", requireAuth, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { expense_id } = req.params;

    const query = `
      DELETE FROM expense
      WHERE expense_id=$1 AND user_id=$2
      RETURNING expense_id, user_id, expense, date
    `;

    const result = await pool.query(query, [expense_id, user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }

    return res.status(200).json({
      message: "Expense deleted successfully",
      data: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ============================
   INCOME ROUTES (PROTECTED)
============================ */

// ✅ POST income
// ✅ POST income
app.post("/income", requireAuth, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { income, date, reason } = req.body;

    if (income === undefined || !date || !reason) {
      return res.status(400).json({ message: "Income + date + reason required" });
    }

    const query = `
      INSERT INTO income (user_id, income, date, reason)
      VALUES ($1, $2, $3, $4)
      RETURNING income_id, user_id, income, date, reason
    `;

    const result = await pool.query(query, [user_id, income, date, reason]);

    return res.status(201).json({
      message: "Income added successfully",
      data: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ✅ GET income
app.get("/income", requireAuth, async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const query = `
      SELECT income_id, user_id, income, date, reason
      FROM income
      WHERE user_id=$1
      ORDER BY date DESC
    `;

    const result = await pool.query(query, [user_id]);

    return res.status(200).json({
      message: "Income fetched successfully",
      data: result.rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ✅ PUT income
app.put("/income/:income_id", requireAuth, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { income_id } = req.params;
    const { income, date, reason } = req.body;

    if (income === undefined || !date || !reason) {
      return res.status(400).json({ message: "income + date + reason required" });
    }

    const query = `
      UPDATE income
      SET income=$1, date=$2, reason=$3
      WHERE income_id=$4 AND user_id=$5
      RETURNING income_id, user_id, income, date, reason
    `;

const result = await pool.query(query, [income, date, reason, income_id, user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Income not found" });
    }

    return res.status(200).json({
      message: "Income updated successfully",
      data: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE income
app.delete("/income/:income_id", requireAuth, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { income_id } = req.params;

    const query = `
      DELETE FROM income
      WHERE income_id=$1 AND user_id=$2
      RETURNING income_id, user_id, income, date
    `;

    const result = await pool.query(query, [income_id, user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Income not found" });
    }

    return res.status(200).json({
      message: "Income deleted successfully",
      data: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ============================
   BALANCE ROUTE (PROTECTED)
============================ */

app.get("/balance", requireAuth, async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const incomeResult = await pool.query(
      "SELECT COALESCE(SUM(income),0) AS total_income FROM income WHERE user_id=$1",
      [user_id]
    );

    const expenseResult = await pool.query(
      "SELECT COALESCE(SUM(expense),0) AS total_expense FROM expense WHERE user_id=$1",
      [user_id]
    );

    const totalIncome = incomeResult.rows[0].total_income;
    const totalExpense = expenseResult.rows[0].total_expense;
    const balance = Number(totalIncome) - Number(totalExpense);

    return res.status(200).json({
      user_id,
      total_income: totalIncome,
      total_expense: totalExpense,
      balance,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});