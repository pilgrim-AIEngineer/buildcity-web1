import React, { useState, useEffect } from "react";
import { useAdmin } from "../../context/AdminContext";

export default function WalletSettingsTab() {
  const {
    walletSettings,
    loadingWalletSettings,
    fetchWalletSettings,
    updateWalletSettings,
    walletUsers,
    fetchWalletUsers,
    adjustUserWallet,
  } = useAdmin();

  // Local form state initialized from context
  const [form, setForm] = useState({
    referralEnabled: true,
    cashbackEnabled: true,
    cashbackType: "PERCENTAGE",
    cashbackValue: 2.0,
    minOrderForCashback: 5000.0,
    maxCashbackCap: 500.0,
    referrerReward: 100.0,
    refereeReward: 50.0,
    walletRedeemEnabled: true,
    maxWalletUsagePercent: 10.0,
    maxWalletUsageFlat: 500.0,
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchPhone, setSearchPhone] = useState("");
  const [adjustModal, setAdjustModal] = useState({
    open: false,
    user: null,
    action: "CREDIT",
    amount: "",
    reason: "",
    submitting: false,
  });

  // Sync settings when loaded
  useEffect(() => {
    fetchWalletSettings();
    fetchWalletUsers("");
  }, []);

  useEffect(() => {
    if (walletSettings) {
      setForm({
        referralEnabled: walletSettings.referralEnabled ?? true,
        cashbackEnabled: walletSettings.cashbackEnabled ?? true,
        cashbackType: walletSettings.cashbackType || "PERCENTAGE",
        cashbackValue: Number(walletSettings.cashbackValue) || 2.0,
        minOrderForCashback: Number(walletSettings.minOrderForCashback) || 5000.0,
        maxCashbackCap: Number(walletSettings.maxCashbackCap) || 500.0,
        referrerReward: Number(walletSettings.referrerReward) || 100.0,
        refereeReward: Number(walletSettings.refereeReward) || 50.0,
        walletRedeemEnabled: walletSettings.walletRedeemEnabled ?? true,
        maxWalletUsagePercent: Number(walletSettings.maxWalletUsagePercent) || 10.0,
        maxWalletUsageFlat: Number(walletSettings.maxWalletUsageFlat) || 500.0,
      });
    }
  }, [walletSettings]);

  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateWalletSettings(form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      alert("Failed to save wallet settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchWalletUsers(searchPhone);
  };

  const handleOpenAdjust = (u) => {
    setAdjustModal({
      open: true,
      user: u,
      action: "CREDIT",
      amount: "",
      reason: "",
      submitting: false,
    });
  };

  const handleExecuteAdjust = async (e) => {
    e.preventDefault();
    if (!adjustModal.amount || Number(adjustModal.amount) <= 0) {
      alert("Please enter a valid positive amount");
      return;
    }
    setAdjustModal((prev) => ({ ...prev, submitting: true }));
    try {
      await adjustUserWallet({
        userId: adjustModal.user.id,
        amount: Number(adjustModal.amount),
        action: adjustModal.action,
        reason: adjustModal.reason || `Admin ${adjustModal.action.toLowerCase()}`,
      });
      alert(`Wallet updated successfully! New Balance: ₹${adjustModal.user.walletBalance + (adjustModal.action === "CREDIT" ? Number(adjustModal.amount) : -Number(adjustModal.amount))}`);
      setAdjustModal({ open: false, user: null, action: "CREDIT", amount: "", reason: "", submitting: false });
      fetchWalletUsers(searchPhone);
    } catch (err) {
      alert("Adjustment failed: " + err.message);
      setAdjustModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Preview calculations
  const previewOrderAmount = 10000;
  const calculatedCashback =
    form.cashbackType === "PERCENTAGE"
      ? Math.min(form.maxCashbackCap, (previewOrderAmount * form.cashbackValue) / 100)
      : form.cashbackValue;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-[#0A1A3A] rounded-2xl p-5 sm:p-6 text-white shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">💰</span>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
              Wallet, Referral & Cashback Control Hub
            </h2>
            <span
              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                form.referralEnabled || form.cashbackEnabled
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              }`}
            >
              {form.referralEnabled || form.cashbackEnabled ? "Active Program" : "System Paused"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-normal max-w-2xl leading-relaxed">
            Super Admin Control Center: Adjust cashback percentages, referral bonuses, and maximum redemption limits in real-time. Changes apply instantly across the storefront.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>💾</span>
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between text-xs sm:text-sm font-bold shadow-2xs">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Settings saved successfully! Storefront is now using the updated configuration.</span>
          </div>
          <button onClick={() => setSaveSuccess(false)} className="text-emerald-600 hover:text-emerald-900 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* 1. Master System Toggles (3 Bento Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Toggle 1: Referral Program */}
        <div
          className={`p-4.5 rounded-2xl border transition-all ${
            form.referralEnabled ? "bg-white border-emerald-200 shadow-2xs" : "bg-slate-50 border-slate-200 opacity-80"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">👥</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.referralEnabled}
                onChange={(e) => setForm({ ...form, referralEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
          <h3 className="text-sm font-black text-navy-950">Referral Program</h3>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Customers receive a unique code to invite peers. Bonuses unlock when friend's 1st order is delivered.
          </p>
          <div className="mt-3">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                form.referralEnabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
              }`}
            >
              {form.referralEnabled ? "ENABLED" : "PAUSED"}
            </span>
          </div>
        </div>

        {/* Toggle 2: Order Cashback */}
        <div
          className={`p-4.5 rounded-2xl border transition-all ${
            form.cashbackEnabled ? "bg-white border-blue-200 shadow-2xs" : "bg-slate-50 border-slate-200 opacity-80"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">⚡</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.cashbackEnabled}
                onChange={(e) => setForm({ ...form, cashbackEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <h3 className="text-sm font-black text-navy-950">Order Spend Cashback</h3>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Auto-credit wallet cashback on completed site deliveries exceeding minimum threshold amount.
          </p>
          <div className="mt-3">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                form.cashbackEnabled ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-600"
              }`}
            >
              {form.cashbackEnabled ? "ENABLED" : "PAUSED"}
            </span>
          </div>
        </div>

        {/* Toggle 3: Checkout Wallet Redemption */}
        <div
          className={`p-4.5 rounded-2xl border transition-all ${
            form.walletRedeemEnabled ? "bg-white border-amber-200 shadow-2xs" : "bg-slate-50 border-slate-200 opacity-80"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">🛒</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.walletRedeemEnabled}
                onChange={(e) => setForm({ ...form, walletRedeemEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
          <h3 className="text-sm font-black text-navy-950">Checkout Redemption</h3>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Allow customers to use their earned wallet cash to get direct discounts during checkout.
          </p>
          <div className="mt-3">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                form.walletRedeemEnabled ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-600"
              }`}
            >
              {form.walletRedeemEnabled ? "ENABLED" : "DISABLED"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Detailed Configuration Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Cashback Rate & Limits */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <h3 className="text-sm font-black text-navy-950">Order Cashback Configuration</h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Delivered Orders Only</span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Mode: Percentage vs Flat */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Cashback Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, cashbackType: "PERCENTAGE" })}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                    form.cashbackType === "PERCENTAGE"
                      ? "bg-navy-900 text-white border-navy-900 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Percentage (%) Mode
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, cashbackType: "FLAT" })}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                    form.cashbackType === "FLAT"
                      ? "bg-navy-900 text-white border-navy-900 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Flat Amount (₹) Mode
                </button>
              </div>
            </div>

            {/* Rate Value */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                {form.cashbackType === "PERCENTAGE" ? "Cashback Rate (%)" : "Flat Cashback Amount (₹)"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={form.cashbackType === "PERCENTAGE" ? "100" : "10000"}
                  value={form.cashbackValue}
                  onChange={(e) => setForm({ ...form, cashbackValue: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-navy-950 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                  {form.cashbackType === "PERCENTAGE" ? "%" : "₹"}
                </span>
              </div>
            </div>

            {/* Minimum Order Value */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Minimum Qualifying Order Value (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="500"
                  min="0"
                  value={form.minOrderForCashback}
                  onChange={(e) => setForm({ ...form, minOrderForCashback: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-navy-950 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">₹</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Orders below this amount will receive ₹0 cashback.</p>
            </div>

            {/* Maximum Cap per Order */}
            {form.cashbackType === "PERCENTAGE" && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Maximum Cashback Cap per Order (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="50"
                    min="0"
                    value={form.maxCashbackCap}
                    onChange={(e) => setForm({ ...form, maxCashbackCap: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-navy-950 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">₹</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Protects margin on bulk orders (e.g. ₹1,00,000 order gets capped at ₹{form.maxCashbackCap}).
                </p>
              </div>
            )}

            {/* Live Calculation Example */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 text-[11px] space-y-1">
              <span className="font-bold text-navy-950 block">💡 Live Calculator Example:</span>
              <p className="text-slate-600">
                Agar customer <strong className="text-navy-900">₹{previewOrderAmount.toLocaleString("en-IN")}</strong> ka order karta hai, toh uske wallet mein{" "}
                <strong className="text-emerald-700 font-black">₹{calculatedCashback}</strong> credit hoga.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Referral Rewards & Checkout Limits */}
        <div className="space-y-6">
          {/* Referral Reward Settings */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤝</span>
                <h3 className="text-sm font-black text-navy-950">Referral Reward Payouts</h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">Both Parties Benefit</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Referrer Reward (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="10"
                    min="0"
                    value={form.referrerReward}
                    onChange={(e) => setForm({ ...form, referrerReward: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-navy-950 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">₹</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Given to user who invited.</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Referee Bonus (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="10"
                    min="0"
                    value={form.refereeReward}
                    onChange={(e) => setForm({ ...form, refereeReward: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-navy-950 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">₹</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Given to new user who joined.</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-[10.5px] text-amber-900 leading-relaxed">
              🛡️ <strong>Safety Condition:</strong> Referral rewards are strictly credited when the referee's first order is marked <strong>DELIVERED</strong>.
            </div>
          </div>

          {/* Checkout Redemption Limits */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛡️</span>
                <h3 className="text-sm font-black text-navy-950">Checkout Redemption Limits</h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">Anti-Abuse Cap</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Max Wallet % of Cart
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    value={form.maxWalletUsagePercent}
                    onChange={(e) => setForm({ ...form, maxWalletUsagePercent: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-navy-950 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Max % of bill paid via wallet.</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Max Flat Deduction (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="50"
                    min="0"
                    value={form.maxWalletUsageFlat}
                    onChange={(e) => setForm({ ...form, maxWalletUsageFlat: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-navy-950 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">₹</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Ceiling per single order.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Customer Wallet Inspector & Manual Adjustment Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <h3 className="text-sm font-black text-navy-950">Customer Wallet Inspector</h3>
            </div>
            <p className="text-[11px] text-slate-500">
              Lookup customer wallet balances, view referral codes, or manually credit/debit for customer support.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search phone or name..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-navy-950 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none w-48 sm:w-56"
            />
            <button
              type="submit"
              className="bg-navy-900 text-white font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-navy-800 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Customer Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Phone</th>
                <th className="py-2.5 px-3">Referral Code</th>
                <th className="py-2.5 px-3">Referred By</th>
                <th className="py-2.5 px-3">Wallet Balance</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {walletUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                walletUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-navy-950">{u.name || "Customer"}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{u.phone}</td>
                    <td className="py-3 px-3 font-mono font-black text-brand-600">
                      {u.referralCode || "—"}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {u.referredBy ? "Linked" : "Direct"}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        ₹{Number(u.walletBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleOpenAdjust(u)}
                        className="bg-slate-100 hover:bg-slate-200 text-navy-950 font-bold text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 transition-colors active:scale-95"
                      >
                        ⚡ Adjust
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Wallet Adjustment Modal */}
      {adjustModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-navy-950">Manual Wallet Adjustment</h3>
                <p className="text-[11px] text-slate-500">
                  {adjustModal.user?.name} ({adjustModal.user?.phone})
                </p>
              </div>
              <button
                onClick={() => setAdjustModal({ ...adjustModal, open: false })}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteAdjust} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                  Action Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustModal({ ...adjustModal, action: "CREDIT" })}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      adjustModal.action === "CREDIT"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    + Credit Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustModal({ ...adjustModal, action: "DEBIT" })}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      adjustModal.action === "DEBIT"
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    - Deduct Cash
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 100"
                  value={adjustModal.amount}
                  onChange={(e) => setAdjustModal({ ...adjustModal, amount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-navy-950 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                  Reason / Audit Note
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Compensation for dispatch delay"
                  value={adjustModal.reason}
                  onChange={(e) => setAdjustModal({ ...adjustModal, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-navy-950 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustModal({ ...adjustModal, open: false })}
                  className="px-3 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustModal.submitting}
                  className="px-4 py-2 rounded-xl font-bold text-white bg-navy-950 hover:bg-navy-900 transition-colors shadow-xs disabled:opacity-50"
                >
                  {adjustModal.submitting ? "Processing..." : "Confirm Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
