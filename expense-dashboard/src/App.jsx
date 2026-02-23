import { useEffect, useState } from "react";
import axios from "axios";

function App() {

  const [balanceData, setBalanceData] = useState({
    total_income: 0,
    total_expense: 0,
    balance: 0,
  });

  useEffect(() => {

    const fetchBalance = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/balance?user_id=1"
        );

        setBalanceData(res.data);

      } catch (err) {
        console.error("Error fetching balance:", err);
      }
    };

    fetchBalance();

  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">

      <h1 className="text-3xl font-bold mb-6">
        💰 Expense Tracker Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-6">

        <div className="bg-green-600 p-6 rounded-xl shadow-lg">
          <h2>Total Income</h2>
          <p className="text-2xl font-bold">
            ₹ {balanceData.total_income}
          </p>
        </div>

        <div className="bg-red-600 p-6 rounded-xl shadow-lg">
          <h2>Total Expense</h2>
          <p className="text-2xl font-bold">
            ₹ {balanceData.total_expense}
          </p>
        </div>

        <div className="bg-blue-600 p-6 rounded-xl shadow-lg">
          <h2>Balance</h2>
          <p className="text-2xl font-bold">
            ₹ {balanceData.balance}
          </p>
        </div>

      </div>

    </div>
  );
}

export default App;