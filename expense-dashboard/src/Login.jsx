import { useState } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:5000";

function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register"

  const [name, setName] = useState(""); // only for register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      await axios.post(`${BASE_URL}/register`, {
        name,
        email,
        password,
      });

      setMsg("✅ Registered! Now login.");
      setMode("login");
    } catch (err) {
      setMsg(err?.response?.data?.message || "❌ Register failed");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await axios.post(`${BASE_URL}/login`, {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      setMsg("✅ Login success");

      window.location.reload();
    } catch (err) {
      setMsg(err?.response?.data?.message || "❌ Login failed");
    }
  };

  const tabBase =
    "flex-1 px-4 py-2 rounded-lg font-extrabold border transition";
  const tabActiveBlue = "bg-blue-600 text-white border-blue-600";
  const tabActiveGreen = "bg-green-600 text-white border-green-600";
  const tabInactive =
    "bg-white text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-400";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* BANK HEADER STRIP */}
        <div className="border border-blue-200 bg-blue-50 rounded-2xl p-5 mb-5">
          <p className="text-xs font-bold text-blue-600">Secure Sign-in</p>
          <h1 className="text-2xl font-extrabold text-blue-900 mt-1">
            BlueBank Expense Tracker
          </h1>
          <p className="text-sm font-semibold text-blue-700 mt-1">
            Manage credits & debits safely with our BlueBank
          </p>
        </div>

        {/* CARD */}
        <div className="border border-blue-200 bg-white rounded-2xl p-6">
          {/* TABS */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setMode("login")}
              className={`${tabBase} ${
                mode === "login" ? tabActiveBlue : tabInactive
              }`}
            >
              Login
            </button>

            <button
              onClick={() => setMode("register")}
              className={`${tabBase} ${
                mode === "register" ? tabActiveGreen : tabInactive
              }`}
            >
              Register
            </button>
          </div>

          {/* MESSAGE */}
          {msg && (
            <div className="mb-5 border border-blue-200 bg-blue-50 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-blue-800">{msg}</p>
            </div>
          )}

          {/* REGISTER */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-blue-900">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full mt-2 p-3 rounded-xl border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-blue-900">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  type="email"
                  className="w-full mt-2 p-3 rounded-xl border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-blue-900">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  type="password"
                  className="w-full mt-2 p-3 rounded-xl border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>

              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-extrabold">
                Create Account
              </button>

              <p className="text-xs font-semibold text-blue-700">
                By registering, your password is securely stored (hashed) and your data is protected.
              </p>
            </form>
          )}

          {/* LOGIN */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-blue-900">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  type="email"
                  className="w-full mt-2 p-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-blue-900">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  type="password"
                  className="w-full mt-2 p-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-extrabold">
                Login
              </button>

              <div className="border border-blue-100 bg-blue-50 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-700">Security Note</p>
                <p className="text-xs font-semibold text-blue-800 mt-1">
                  After login, please logout your session
                </p>
              </div>
            </form>
          )}
        </div>

        {/* FOOTER */}
        <p className="text-center text-xs font-semibold text-blue-700 mt-5">
          © {new Date().getFullYear()} Sureshkumar | bank of India
        </p>
      </div>
    </div>
  );
}

export default Login;