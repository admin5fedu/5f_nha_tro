const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

const DEFAULT_RANGE_DAYS = 30;

function parseDateRange(startDate, endDate) {
  const today = new Date();
  let start = startDate ? new Date(startDate) : null;
  let end = endDate ? new Date(endDate) : null;

  if (!end || Number.isNaN(end.getTime())) {
    end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  if (!start || Number.isNaN(start.getTime())) {
    const defaultStart = new Date(end);
    defaultStart.setDate(end.getDate() - DEFAULT_RANGE_DAYS + 1);
    start = defaultStart;
  }

  const normalizedStart = start.toISOString().split('T')[0];
  const normalizedEnd = end.toISOString().split('T')[0];

  return { start: normalizedStart, end: normalizedEnd };
}

router.get('/profit-loss', (req, res) => {
  const db = getDb();
  const { startDate, endDate } = req.query;
  const { start, end } = parseDateRange(startDate, endDate);

  const responseData = {
    range: { start, end },
    summary: { total_income: 0, total_expense: 0, net_profit: 0 },
    income_breakdown: [],
    expense_breakdown: [],
    timeline: []
  };

  db.all(
    `SELECT t.type,
            SUM(t.amount) as total
       FROM transactions t
       WHERE t.transaction_date BETWEEN ? AND ?
       GROUP BY t.type`,
    [start, end],
    (err, totals) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      totals?.forEach((row) => {
        if (row.type === 'income') responseData.summary.total_income = row.total || 0;
        if (row.type === 'expense') responseData.summary.total_expense = row.total || 0;
      });
      responseData.summary.net_profit = responseData.summary.total_income - responseData.summary.total_expense;

      db.all(
        `SELECT t.type,
                COALESCE(fc.name, 'Khác') as category_name,
                COALESCE(fc.code, 'OTHER') as category_code,
                SUM(t.amount) as total
         FROM transactions t
         LEFT JOIN financial_categories fc ON fc.id = t.category_id
         WHERE t.transaction_date BETWEEN ? AND ?
         GROUP BY t.type, category_code, category_name
         ORDER BY t.type, total DESC`,
        [start, end],
        (categoryErr, rows) => {
          if (categoryErr) {
            return res.status(500).json({ error: categoryErr.message });
          }

          rows?.forEach((row) => {
            const entry = {
              category_code: row.category_code,
              category_name: row.category_name,
              total: row.total || 0
            };
            if (row.type === 'income') responseData.income_breakdown.push(entry);
            if (row.type === 'expense') responseData.expense_breakdown.push(entry);
          });

          db.all(
            `SELECT t.transaction_date as date,
                    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income,
                    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expense
             FROM transactions t
             WHERE t.transaction_date BETWEEN ? AND ?
             GROUP BY t.transaction_date
             ORDER BY t.transaction_date`,
            [start, end],
            (timelineErr, timelineRows) => {
              if (timelineErr) {
                return res.status(500).json({ error: timelineErr.message });
              }
              responseData.timeline = timelineRows?.map((row) => ({
                date: row.date,
                income: row.income || 0,
                expense: row.expense || 0,
                net: (row.income || 0) - (row.expense || 0)
              })) || [];
              res.json(responseData);
            }
          );
        }
      );
    }
  );
});

router.get('/accounts-receivable', (req, res) => {
  const db = getDb();
  const { branchId, minOverdueDays = 1 } = req.query;
  const params = [];

  let query = `
    SELECT i.id, i.invoice_number, i.invoice_date, i.due_date, i.total_amount,
           i.paid_amount, i.remaining_amount, i.status,
           t.full_name as tenant_name, t.phone as tenant_phone,
           r.room_number, b.name as branch_name, b.id as branch_id,
           ROUND(julianday('now') - julianday(i.due_date)) as overdue_days
    FROM invoices i
    LEFT JOIN contracts c ON i.contract_id = c.id
    LEFT JOIN tenants t ON c.tenant_id = t.id
    LEFT JOIN rooms r ON c.room_id = r.id
    LEFT JOIN branches b ON r.branch_id = b.id
    WHERE i.status != 'paid'
      AND i.remaining_amount > 0
      AND DATE(i.due_date) < DATE('now')
  `;

  if (branchId) {
    query += ' AND b.id = ?';
    params.push(branchId);
  }

  query += ' ORDER BY i.due_date ASC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const filtered = (rows || []).filter((row) => (row.overdue_days || 0) >= Number(minOverdueDays));

    const summary = filtered.reduce(
      (acc, item) => {
        acc.total_invoices += 1;
        acc.total_amount += item.total_amount || 0;
        acc.total_outstanding += item.remaining_amount || 0;
        acc.max_overdue = Math.max(acc.max_overdue, item.overdue_days || 0);
        return acc;
      },
      { total_invoices: 0, total_amount: 0, total_outstanding: 0, max_overdue: 0 }
    );

    res.json({
      generated_at: new Date().toISOString(),
      summary,
      items: filtered.map((item) => ({
        ...item,
        overdue_days: item.overdue_days || 0
      }))
    });
  });
});

router.get('/revenue-analysis', (req, res) => {
  const db = getDb();
  const { startDate, endDate } = req.query;
  const { start, end } = parseDateRange(startDate, endDate);

  const responseData = {
    range: { start, end },
    total_revenue: 0,
    revenue_by_category: [],
    revenue_by_month: []
  };

  db.all(
    `SELECT COALESCE(fc.name, 'Khác') as category_name,
            COALESCE(fc.code, 'OTHER') as category_code,
            SUM(t.amount) as total
     FROM transactions t
     LEFT JOIN financial_categories fc ON fc.id = t.category_id
     WHERE t.type = 'income'
       AND t.transaction_date BETWEEN ? AND ?
     GROUP BY category_code, category_name
     ORDER BY total DESC`,
    [start, end],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      responseData.revenue_by_category = rows || [];
      responseData.total_revenue = rows?.reduce((sum, row) => sum + (row.total || 0), 0) || 0;

      db.all(
        `SELECT strftime('%Y-%m', t.transaction_date) as period,
                SUM(t.amount) as total
         FROM transactions t
         WHERE t.type = 'income'
           AND t.transaction_date BETWEEN ? AND ?
         GROUP BY period
         ORDER BY period`,
        [start, end],
        (timelineErr, timelineRows) => {
          if (timelineErr) {
            return res.status(500).json({ error: timelineErr.message });
          }
          responseData.revenue_by_month = timelineRows || [];
          res.json(responseData);
        }
      );
    }
  );
});

router.get('/cashflow-detail', (req, res) => {
  const db = getDb();
  const { startDate, endDate, type, categoryId } = req.query;
  const { start, end } = parseDateRange(startDate, endDate);

  let query = `
    SELECT t.*, COALESCE(fc.name, 'Khác') as category_name, COALESCE(fc.code, 'OTHER') as category_code,
           a.name as account_name, a.type as account_type
    FROM transactions t
    LEFT JOIN financial_categories fc ON fc.id = t.category_id
    LEFT JOIN accounts a ON a.id = t.account_id
    WHERE t.transaction_date BETWEEN ? AND ?
  `;

  const params = [start, end];

  if (type && ['income', 'expense'].includes(type)) {
    query += ' AND t.type = ?';
    params.push(type);
  }

  if (categoryId) {
    query += ' AND t.category_id = ?';
    params.push(categoryId);
  }

  query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const totals = rows?.reduce(
      (acc, item) => {
        if (item.type === 'income') {
          acc.total_income += item.amount || 0;
        } else if (item.type === 'expense') {
          acc.total_expense += item.amount || 0;
        }
        return acc;
      },
      { total_income: 0, total_expense: 0 }
    ) || { total_income: 0, total_expense: 0 };

    res.json({
      range: { start, end },
      totals: {
        ...totals,
        net_cashflow: totals.total_income - totals.total_expense
      },
      items: rows || []
    });
  });
});

module.exports = router;

