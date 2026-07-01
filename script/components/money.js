const STORAGE_KEY = "myDashboard.transactions";

const form = document.querySelector("#transactionForm");
const incomeInput = document.querySelector("#uangMasuk");
const expenseInput = document.querySelector("#uangKeluar");
const dateInput = document.querySelector("#tanggal");
const totalIncomeEl = document.querySelector("#totalMasuk");
const totalExpenseEl = document.querySelector("#totalKeluar");
const balanceEl = document.querySelector("#saldo");
const tableBody = document.querySelector("#transactionBody");
const submitButton = document.querySelector("#submitTransaction");

let transactions = loadTransactions();
let editingId = null;

function loadTransactions() {
  const savedTransactions = localStorage.getItem(STORAGE_KEY);

  if (!savedTransactions) {
    return [];
  }

  try {
    return JSON.parse(savedTransactions);
  } catch {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function toNumber(value) {
  return Number(value) || 0;
}

function toPositiveNumber(value) {
  return Math.max(0, toNumber(value));
}

function toRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function getTransactionNote(income, expense) {
  if (income > 0 && expense > 0) {
    return "Pemasukan dan pengeluaran";
  }

  if (income > 0) {
    return "Pemasukan";
  }

  return "Pengeluaran";
}

function setTodayAsDefault() {
  if (!dateInput) {
    return;
  }

  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  dateInput.value = today.toISOString().slice(0, 10);
}

function renderSummary() {
  const totalIncome = transactions.reduce((total, transaction) => total + transaction.income, 0);
  const totalExpense = transactions.reduce((total, transaction) => total + transaction.expense, 0);
  const balance = totalIncome - totalExpense;

  totalIncomeEl.textContent = toRupiah(totalIncome);
  totalExpenseEl.textContent = toRupiah(totalExpense);
  balanceEl.textContent = toRupiah(balance);
}

function renderTable() {
  if (transactions.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td class="px-5 py-6 text-slate-500" colspan="5">Belum ada data transaksi.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = transactions
    .map((transaction) => {
      return `
        <tr class="border-t border-slate-100">
          <td class="px-5 py-4 text-slate-600">${formatDate(transaction.date)}</td>
          <td class="px-5 py-4 font-semibold text-emerald-600">${toRupiah(transaction.income)}</td>
          <td class="px-5 py-4 font-semibold text-rose-600">${toRupiah(transaction.expense)}</td>
          <td class="px-5 py-4 text-slate-600">${transaction.note}</td>
          <td class="px-5 py-4">
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                data-id="${transaction.id}"
                data-action="edit"
                class="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                Edit
              </button>

              <button
                type="button"
                data-id="${transaction.id}"
                data-action="delete"
                class="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
              >
                Hapus
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function updateSubmitButton() {
  submitButton.textContent = editingId === null ? "Simpan Transaksi" : "Update Transaksi";
}

function clearEditMode() {
  editingId = null;
  updateSubmitButton();
}

function deleteTransaction(id) {
  const isConfirmed = confirm("Hapus transaksi ini?");

  if (!isConfirmed) {
    return;
  }

  transactions = transactions.filter((transaction) => transaction.id !== id);
  saveTransactions();

  if (editingId === id) {
    form.reset();
    clearEditMode();
    setTodayAsDefault();
  }

  renderDashboard();
}

function editTransaction(id) {
  const trx = transactions.find((transaction) => transaction.id === id);

  if (!trx) return;

  incomeInput.value = trx.income || "";
  expenseInput.value = trx.expense || "";
  dateInput.value = trx.date;
  editingId = id;
  updateSubmitButton();
  form.scrollIntoView({ behavior: "smooth", block: "center" });
  incomeInput.focus();
}

function handleTableAction(event) {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const id = Number(button.dataset.id);
  const action = button.dataset.action;

  if (action === "delete") {
    deleteTransaction(id);
  }

  if (action === "edit") {
    editTransaction(id);
  }
}

function renderDashboard() {
  renderSummary();
  renderTable();
}

function handleSubmit(event) {
  event.preventDefault();

  const income = toPositiveNumber(incomeInput.value);
  const expense = toPositiveNumber(expenseInput.value);
  const date = dateInput.value;

  if (!date) {
    alert("Tanggal wajib diisi.");
    return;
  }

  if (income <= 0 && expense <= 0) {
    alert("Isi uang masuk atau uang keluar terlebih dahulu.");
    return;
  }

  const transactionData = {
    date,
    income,
    expense,
    note: getTransactionNote(income, expense),
  };

  if (editingId === null) {
    transactions.unshift({
      id: Date.now(),
      ...transactionData,
    });
  } else {
    transactions = transactions.map((transaction) => {
      if (transaction.id !== editingId) {
        return transaction;
      }

      return {
        ...transaction,
        ...transactionData,
      };
    });
  }

  saveTransactions();
  renderDashboard();
  form.reset();
  clearEditMode();
  setTodayAsDefault();
}

function handleReset() {
  setTimeout(() => {
    clearEditMode();
    setTodayAsDefault();
  }, 0);
}

if (
  form &&
  incomeInput &&
  expenseInput &&
  dateInput &&
  totalIncomeEl &&
  totalExpenseEl &&
  balanceEl &&
  tableBody &&
  submitButton
) {
  form.addEventListener("submit", handleSubmit);
  form.addEventListener("reset", handleReset);
  tableBody.addEventListener("click", handleTableAction);
  setTodayAsDefault();
  renderDashboard();
  updateSubmitButton();
}
