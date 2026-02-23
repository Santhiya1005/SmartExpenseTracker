import { useEffect, useMemo, useState } from "react";
import Login from "./Login";
import { api } from "./api";

function App() {
  const token = localStorage.getItem("token");
  if (!token) return <Login />;

  const [activeTab, setActiveTab] = useState("history");

  const [balanceData, setBalanceData] = useState({
    total_income: 0,
    total_expense: 0,
    balance: 0,
  });

  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);

  const [expenseReason, setExpenseReason] = useState("");
  const [incomeReason, setIncomeReason] = useState("");

  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");

  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState("");

  const [statusMsg, setStatusMsg] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);

  const money = useMemo(
    () => (value) => Number(value || 0).toLocaleString("en-IN"),
    []
  );

  const formatDate = useMemo(
    () => (iso) => (iso ? new Date(iso).toLocaleDateString("en-IN") : ""),
    []
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  // ---------- FETCH FUNCTIONS ----------
  const fetchBalance = async () => {
    const res = await api.get("/balance");
    setBalanceData(res.data);
  };

  const fetchExpenses = async () => {
    const res = await api.get("/expenses");
    setExpenses(res.data?.data || []);
  };

  const fetchIncomes = async () => {
    const res = await api.get("/income");
    setIncomes(res.data?.data || []);
  };

  const refreshAll = async () => {
    try {
      await Promise.all([fetchBalance(), fetchExpenses(), fetchIncomes()]);
      setStatusMsg("");
    } catch (err) {
      setStatusMsg("Backend error / token missing");
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // ---------- ADD EXPENSE ----------
  const handleAddExpense = async (e) => {
  e.preventDefault();
  setStatusMsg("");

  try {
    if (!expenseAmount || !expenseDate || !expenseReason) {
      setStatusMsg("Please fill expense amount + date + reason");
      return;
    }

    const currentBalance = Number(balanceData.balance || 0);
    const exp = Number(expenseAmount);

    if (exp > currentBalance) {
      setStatusMsg("Insufficient balance. Add income first.");
      return;
    }

    await api.post("/expenses", {
      expense: exp,
      date: expenseDate,
      reason: expenseReason,
    });

    setExpenseAmount("");
    setExpenseDate("");
    setExpenseReason("");
    setStatusMsg("Expense added");
    setActiveTab("history");
    refreshAll();
  } catch {
    setStatusMsg("Failed to add expense");
  }
};

  // ---------- ADD INCOME ----------
  const handleAddIncome = async (e) => {
  e.preventDefault();
  setStatusMsg("");

  try {
    if (!incomeAmount || !incomeDate || !incomeReason) {
      setStatusMsg("Please fill income amount + date + reason");
      return;
    }

    await api.post("/income", {
      income: Number(incomeAmount),
      date: incomeDate,
      reason: incomeReason,
    });

    setIncomeAmount("");
    setIncomeDate("");
    setIncomeReason("");
    setStatusMsg("Income added");
    setActiveTab("history");
    refreshAll();
  } catch {
    setStatusMsg("Failed to add income");
  }
};
  // ---------- DELETE CONFIRM ----------
  const askDeleteExpense = (row) => {
    setConfirmItem({
      type: "expense",
      id: row.expense_id,
      amount: row.expense,
      date: row.date,
    });
    setConfirmOpen(true);
  };

  const askDeleteIncome = (row) => {
    setConfirmItem({
      type: "income",
      id: row.income_id,
      amount: row.income,
      date: row.date,
    });
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmItem(null);
  };

  const confirmDelete = async () => {
    if (!confirmItem) return;

    try {
      if (confirmItem.type === "expense") {
        await api.delete(`/expenses/${confirmItem.id}`);
      } else {
        await api.delete(`/income/${confirmItem.id}`);
      }

      setStatusMsg("Deleted");
      closeConfirm();
      refreshAll();
    } catch {
      setStatusMsg("Delete failed");
      closeConfirm();
    }
  };

  const tabBtnBase =
    "px-4 py-2 rounded-lg font-semibold border transition";
  const tabActiveBlue =
    "bg-blue-600 text-white border-blue-600";
  const tabInactive =
    "bg-white text-blue-700 border-blue-200 hover:border-blue-400 hover:bg-blue-50";

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-white text-blue-900">
      {/* TOP BANK NAV */}
      <div className="sticky top-0 z-10 border-b border-blue-100 bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-500">Secure Finance Dashboard</p>
            <h1 className="text-2xl font-extrabold tracking-tight">
              BlueBank Expense Tracker
            </h1>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
          >
            Logout
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* STATUS */}
        {statusMsg && (
          <div className="mb-6 border border-blue-200 bg-blue-50 text-blue-800 px-4 py-3 rounded-lg font-semibold">
            {statusMsg}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div className="border border-green-200 bg-white rounded-2xl p-5">
            <p className="text-sm font-bold text-green-700">TOTAL INCOME</p>
            <p className="mt-2 text-3xl font-extrabold text-green-700">
              ₹ {money(balanceData.total_income)}
            </p>
            <p className="mt-2 text-xs text-blue-600 font-semibold">
              Credits received into your account
            </p>
          </div>

          <div className="border border-red-200 bg-white rounded-2xl p-5">
            <p className="text-sm font-bold text-red-700">TOTAL EXPENSE</p>
            <p className="mt-2 text-3xl font-extrabold text-red-700">
              ₹ {money(balanceData.total_expense)}
            </p>
            <p className="mt-2 text-xs text-blue-600 font-semibold">
              Debits spent from your account
            </p>
          </div>

          <div className="border border-blue-200 bg-white rounded-2xl p-5">
            <p className="text-sm font-bold text-blue-700">AVAILABLE BALANCE</p>
            <p className="mt-2 text-3xl font-extrabold text-blue-700">
              ₹ {money(balanceData.balance)}
            </p>
            <p className="mt-2 text-xs text-blue-600 font-semibold">
              Income − Expense (auto calculated)
            </p>
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={() => setActiveTab("history")}
            className={`${tabBtnBase} ${
              activeTab === "history" ? tabActiveBlue : tabInactive
            }`}
          >
             History
          </button>

          <button
            onClick={() => setActiveTab("expense")}
            className={`${tabBtnBase} ${
              activeTab === "expense"
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-red-700 border-red-200 hover:border-red-400 hover:bg-red-50"
            }`}
          >
            + Add Expense
          </button>

          <button
            onClick={() => setActiveTab("income")}
            className={`${tabBtnBase} ${
              activeTab === "income"
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-green-700 border-green-200 hover:border-green-400 hover:bg-green-50"
            }`}
          >
            + Add Income
          </button>

          <button
            onClick={refreshAll}
            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
          >
             Refresh
          </button>
        </div>

        {/* HISTORY */}
        {activeTab === "history" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* EXPENSE */}
            <div className="border border-blue-100 rounded-2xl bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-extrabold text-blue-900">Expense History</h2>
                <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                  Debit
                </span>
              </div>

              {expenses.length === 0 ? (
                <p className="text-blue-600 font-semibold">No expenses yet.</p>
              ) : (
                <div className="space-y-3">
                  {expenses.map((x) => (
                    <div
                      key={x.expense_id}
                      className="flex items-center justify-between border border-blue-100 rounded-xl px-4 py-3"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-blue-900">
                          {formatDate(x.date)}
                        </span>
                        <span className="text-xs font-semibold text-blue-600">
                          Transaction ID: {x.expense_id}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-blue-600">
                        Reason: {x.reason}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-red-700">
                          ₹ {money(x.expense)}
                        </span>
                        <button
                          onClick={() => askDeleteExpense(x)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* INCOME */}
            <div className="border border-blue-100 rounded-2xl bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-extrabold text-blue-900">Income History</h2>
                <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                  Credit
                </span>
              </div>

              {incomes.length === 0 ? (
                <p className="text-blue-600 font-semibold">No incomes yet.</p>
              ) : (
                <div className="space-y-3">
                  {incomes.map((x) => (
                    <div
                      key={x.income_id}
                      className="flex items-center justify-between border border-blue-100 rounded-xl px-4 py-3"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-blue-900">
                          {formatDate(x.date)}
                        </span>
                        <span className="text-xs font-semibold text-blue-600">
                          Transaction ID: {x.income_id}
                        </span>
                      </div>
                        <span className="text-xs font-semibold text-blue-600">
                        Reason: {x.reason}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-green-700">
                          ₹ {money(x.income)}
                        </span>
                        <button
                          onClick={() => askDeleteIncome(x)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADD EXPENSE */}
        {activeTab === "expense" && (
          <form
            onSubmit={handleAddExpense}
            className="border border-red-200 bg-white rounded-2xl p-6 max-w-md"
          >
            <h2 className="text-xl font-extrabold text-red-700 mb-1">Add Expense</h2>
            <p className="text-sm font-semibold text-blue-600 mb-5">
              Record a debit transaction
            </p>

            <label className="text-sm font-bold text-blue-900">Amount</label>
            <input
              type="number"
              placeholder="e.g. 250"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              className="w-full mt-2 mb-4 p-3 rounded-xl border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <label className="text-sm font-bold text-blue-900">Reason</label>
            <input
              type="text"
              placeholder="e.g. Food / Travel / Rent"
              value={expenseReason}
              onChange={(e) => setExpenseReason(e.target.value)}
              className="w-full mt-2 mb-4 p-3 rounded-xl border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <label className="text-sm font-bold text-blue-900">Date</label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full mt-2 mb-5 p-3 rounded-xl border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-300"
            />

            <button className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-extrabold">
              Add Expense
            </button>
          </form>
        )}

        {/* ADD INCOME */}
        {activeTab === "income" && (
          <form
            onSubmit={handleAddIncome}
            className="border border-green-200 bg-white rounded-2xl p-6 max-w-md"
          >
            <h2 className="text-xl font-extrabold text-green-700 mb-1">Add Income</h2>
            <p className="text-sm font-semibold text-blue-600 mb-5">
              Record a credit transaction
            </p>

            <label className="text-sm font-bold text-blue-900">Amount</label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
              className="w-full mt-2 mb-4 p-3 rounded-xl border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-300"
            />
              <label className="text-sm font-bold text-blue-900">Reason</label>
              <input
                type="text"
                placeholder="e.g. Salary / Freelance / Bonus"
                value={incomeReason}
                onChange={(e) => setIncomeReason(e.target.value)}
                className="w-full mt-2 mb-4 p-3 rounded-xl border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            <label className="text-sm font-bold text-blue-900">Date</label>
            <input
              type="date"
              value={incomeDate}
              onChange={(e) => setIncomeDate(e.target.value)}
              className="w-full mt-2 mb-5 p-3 rounded-xl border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-300"
            />

            <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-extrabold">
              Add Income
            </button>
          </form>
        )}

        {/* DELETE CONFIRM MODAL */}
        {confirmOpen && confirmItem && (
          <div className="fixed inset-0 bg-blue-900/40 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md border border-blue-200">
              <h3 className="text-xl font-extrabold text-blue-900 mb-3">
                Confirm Delete
              </h3>

              <div className="border border-blue-100 rounded-xl p-4 mb-4 text-sm">
                <p className="mb-2">
                  <span className="text-blue-600 font-bold">Type:</span>{" "}
                  <span className="font-extrabold text-blue-900">
                    {confirmItem.type === "expense" ? "Expense (Debit)" : "Income (Credit)"}
                  </span>
                </p>
                <p className="mb-2">
                  <span className="text-blue-600 font-bold">Amount:</span>{" "}
                  <span
                    className={`font-extrabold ${
                      confirmItem.type === "expense" ? "text-red-700" : "text-green-700"
                    }`}
                  >
                    ₹ {money(confirmItem.amount)}
                  </span>
                </p>
                <p>
                  <span className="text-blue-600 font-bold">Date:</span>{" "}
                  <span className="font-extrabold text-blue-900">
                    {formatDate(confirmItem.date)}
                  </span>
                </p>
              </div>

              <p className="mb-5 font-semibold text-blue-900">
                Are you sure you want to delete this transaction?
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={closeConfirm}
                  className="px-4 py-2 rounded-lg border border-blue-200 text-blue-700 font-bold hover:bg-blue-50"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white font-extrabold hover:bg-red-700"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;