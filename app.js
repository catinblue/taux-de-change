// ===========================================
// CONFIGURATION & CONSTANTS
// ===========================================

const PAIR_COLORS = [
    '#00f0ff', '#bd5fff', '#ff2d95', '#ffaa00', '#00ff88',
    '#4d9fff', '#ff6b35', '#00ddcc', '#ff44aa', '#88ff00'
];

const BANK_MODIFIERS = {
    'bnp': { base: 1.000, variance: 0.002 },
    'ca': { base: 0.998, variance: 0.0015 },
    'sg': { base: 1.001, variance: 0.0018 },
    'bpce': { base: 0.999, variance: 0.0020 },
    'cm': { base: 1.002, variance: 0.0022 },
    'icbc': { base: 0.997, variance: 0.0025 },
    'ccb': { base: 0.996, variance: 0.0023 },
    'abc': { base: 0.998, variance: 0.0021 },
    'boc': { base: 1.000, variance: 0.0019 },
    'bocom': { base: 0.999, variance: 0.0024 }
};

// Will be set by HTML page
let TEXTS = {};
let PERIOD_LABELS = {};

// ===========================================
// GLOBAL STATE
// ===========================================

let chart = null;
let activePairs = new Map();
let currentBank = 'bnp';
let currentPeriod = '1d';
let currentDays = 1;
let updateInterval = null;
let colorIndex = 0;
let exchangeRates = {};
let rateAlerts = JSON.parse(localStorage.getItem('rateAlerts') || '[]');

// ===========================================
// API & DATA FETCHING
// ===========================================

async function fetchExchangeRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();

        if (data && data.rates) {
            exchangeRates = data.rates;
            exchangeRates['USD'] = 1;
            console.log('✅ Exchange rates fetched successfully');
            return true;
        }
    } catch (error) {
        console.warn('⚠️ Error fetching rates. Using fallback rates.', error);
        exchangeRates = {
            'USD': 1, 'EUR': 0.92, 'GBP': 0.79, 'JPY': 149.50,
            'CHF': 0.88, 'CAD': 1.36, 'AUD': 1.52, 'CNY': 7.24,
            'HKD': 7.83, 'SGD': 1.34
        };
    }
    return false;
}

function getExchangeRate(base, target) {
    if (!exchangeRates[base] || !exchangeRates[target]) {
        return null;
    }
    return exchangeRates[target] / exchangeRates[base];
}

function applyBankModifier(rate, bank, timestamp) {
    const modifier = BANK_MODIFIERS[bank];
    const timeVariance = Math.sin(timestamp / 10000000) * 0.005;
    const randomVariance = (Math.random() - 0.5) * modifier.variance;
    return rate * modifier.base * (1 + timeVariance + randomVariance);
}

function generateHistoricalData(base, target, days) {
    const data = [];
    const now = Date.now();
    const interval = (days * 24 * 60 * 60 * 1000) / 100;
    const baseRate = getExchangeRate(base, target);

    if (!baseRate) return data;

    for (let i = 100; i >= 0; i--) {
        const timestamp = now - (i * interval);
        const variance = (Math.random() - 0.5) * 0.02;
        const trendVariance = Math.sin((100 - i) / 20) * 0.01;
        const rate = baseRate * (1 + variance + trendVariance);
        const modifiedRate = applyBankModifier(rate, currentBank, timestamp);

        data.push({ x: timestamp, y: modifiedRate });
    }

    return data;
}

// ===========================================
// PAIR MANAGEMENT
// ===========================================

function addCurrencyPair(base, target) {
    const pairKey = `${base}/${target}`;

    if (activePairs.has(pairKey)) {
        showNotification(TEXTS.pairExists, 'warning');
        return;
    }

    const reversePairKey = `${target}/${base}`;
    if (activePairs.has(reversePairKey)) {
        showNotification(TEXTS.reversePairExists, 'warning');
        return;
    }

    if (base === target) {
        showNotification(TEXTS.sameCurrency, 'error');
        return;
    }

    const color = PAIR_COLORS[colorIndex % PAIR_COLORS.length];
    colorIndex++;

    const data = generateHistoricalData(base, target, currentDays);

    if (data.length === 0) {
        showNotification(TEXTS.noData, 'error');
        return;
    }

    activePairs.set(pairKey, {
        base, target, color, data, visible: true
    });

    renderActivePairs();
    updateChart();
    updateStats();
    updateRateDetails();
    updateRecommendations();
    showNotification(`${pairKey} ${TEXTS.added}`, 'success');
}

function removeCurrencyPair(pairKey) {
    activePairs.delete(pairKey);
    renderActivePairs();
    updateChart();
    updateStats();
    updateRateDetails();
    updateRecommendations();
    showNotification(`${pairKey} ${TEXTS.removed}`, 'info');
}

function togglePairVisibility(pairKey) {
    const pair = activePairs.get(pairKey);
    if (pair) {
        pair.visible = !pair.visible;
        updateChart();
    }
}

function renderActivePairs() {
    const container = document.getElementById('active-pairs-container');
    container.innerHTML = '';

    activePairs.forEach((pair, pairKey) => {
        const chip = document.createElement('div');
        chip.className = 'pair-chip';
        chip.style.borderColor = pair.color;
        chip.style.boxShadow = `0 0 10px ${pair.color}40`;

        const label = document.createElement('span');
        label.className = 'pair-label';
        label.textContent = pairKey;

        const rate = document.createElement('span');
        rate.className = 'pair-rate';
        const currentRate = pair.data[pair.data.length - 1]?.y || 0;
        rate.textContent = currentRate.toFixed(4);
        rate.id = `rate-${pairKey}`;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '×';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeCurrencyPair(pairKey);
        };

        chip.appendChild(label);
        chip.appendChild(rate);
        chip.appendChild(removeBtn);
        chip.onclick = () => togglePairVisibility(pairKey);

        container.appendChild(chip);
    });
}

// ===========================================
// CHART MANAGEMENT
// ===========================================

function createChart() {
    const ctx = document.getElementById('rateChart').getContext('2d');

    chart = new Chart(ctx, {
        type: 'line',
        data: { datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    titleColor: '#0f172a',
                    bodyColor: '#475569',
                    borderColor: 'rgba(14, 165, 233, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y.toFixed(4);
                            return `${label}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: currentDays <= 1 ? 'hour' : currentDays <= 7 ? 'day' : currentDays <= 30 ? 'day' : 'month',
                        displayFormats: {
                            hour: 'HH:mm',
                            day: 'dd MMM',
                            month: 'MMM yyyy'
                        }
                    },
                    grid: {
                        color: 'rgba(15, 23, 42, 0.08)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: { family: 'JetBrains Mono', size: 11 }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(15, 23, 42, 0.08)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: { family: 'JetBrains Mono', size: 11 },
                        callback: function(value) {
                            return value.toFixed(4);
                        }
                    }
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function updateChart() {
    if (!chart) return;

    const datasets = [];
    activePairs.forEach((pair, pairKey) => {
        if (pair.visible) {
            datasets.push({
                label: pairKey,
                data: pair.data,
                borderColor: pair.color,
                backgroundColor: pair.color + '20',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: pair.color,
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 2
            });
        }
    });

    chart.data.datasets = datasets;
    chart.update('none');
}

// ===========================================
// RATE DETAILS & CONVERTER
// ===========================================

/**
 * Calculate different rate types (TT/Cash, Buy/Sell)
 */
function calculateRateTypes(baseRate) {
    // Spread percentages (typical bank margins)
    const ttSpread = 0.015; // 1.5% spread for TT
    const cashSpread = 0.03; // 3% spread for Cash

    return {
        ttBuy: baseRate * (1 - ttSpread / 2),      // Bank buys from you (lower)
        ttSell: baseRate * (1 + ttSpread / 2),     // Bank sells to you (higher)
        cashBuy: baseRate * (1 - cashSpread / 2),  // Bank buys cash from you (lowest)
        cashSell: baseRate * (1 + cashSpread / 2)  // Bank sells cash to you (highest)
    };
}

/**
 * Update rate details table - shows ALL possible forex pairs
 */
function updateRateDetails() {
    const tbody = document.getElementById('rate-table-body');
    if (!tbody) return;

    const currencies = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'HKD', 'SGD'];
    const pairs = [];

    // Generate all possible currency pairs
    for (let i = 0; i < currencies.length; i++) {
        for (let j = 0; j < currencies.length; j++) {
            if (i !== j) {
                pairs.push({ base: currencies[i], target: currencies[j] });
            }
        }
    }

    let tableHTML = '';

    pairs.forEach(({ base, target }) => {
        const pairKey = `${base}/${target}`;
        const baseRate = getExchangeRate(base, target);

        if (!baseRate) return;

        const modifiedRate = applyBankModifier(baseRate, currentBank, Date.now());
        const rates = calculateRateTypes(modifiedRate);

        tableHTML += `
            <tr>
                <td class="pair-name">${pairKey}</td>
                <td class="rate-value rate-buy">${rates.ttBuy.toFixed(4)}</td>
                <td class="rate-value rate-sell">${rates.ttSell.toFixed(4)}</td>
                <td class="rate-value rate-buy">${rates.cashBuy.toFixed(4)}</td>
                <td class="rate-value rate-sell">${rates.cashSell.toFixed(4)}</td>
            </tr>
        `;
    });

    tbody.innerHTML = tableHTML;
}

/**
 * Update currency converter with fees
 */
function updateConverter() {
    const fromCurrency = document.getElementById('convert-from').value;
    const toCurrency = document.getElementById('convert-to').value;
    const amount = parseFloat(document.getElementById('convert-amount').value) || 0;
    const rateType = document.getElementById('rate-type').value;
    const feePercent = parseFloat(document.getElementById('fee-percent').value) || 0;
    const feeFixed = parseFloat(document.getElementById('fee-fixed').value) || 0;

    if (amount <= 0 || fromCurrency === toCurrency) {
        const locale = TEXTS.locale || 'en-US';
        document.getElementById('result-value').textContent = '--';
        document.getElementById('result-details').innerHTML = `<p>${
            locale === 'zh-CN'
                ? '请输入有效金额并选择不同的货币'
                : 'Please enter a valid amount and select different currencies'
        }</p>`;
        return;
    }

    const baseRate = getExchangeRate(fromCurrency, toCurrency);
    if (!baseRate) {
        document.getElementById('result-value').textContent = '--';
        document.getElementById('result-details').innerHTML = '<p>Rate not available</p>';
        return;
    }

    const rates = calculateRateTypes(baseRate);
    let appliedRate;
    let rateLabel;
    const locale = TEXTS.locale || 'en-US';

    switch (rateType) {
        case 'tt-buy':
            appliedRate = rates.ttBuy;
            rateLabel = locale === 'zh-CN' ? '现汇买入' : 'TT Buy';
            break;
        case 'tt-sell':
            appliedRate = rates.ttSell;
            rateLabel = locale === 'zh-CN' ? '现汇卖出' : 'TT Sell';
            break;
        case 'cash-buy':
            appliedRate = rates.cashBuy;
            rateLabel = locale === 'zh-CN' ? '现钞买入' : 'Cash Buy';
            break;
        case 'cash-sell':
            appliedRate = rates.cashSell;
            rateLabel = locale === 'zh-CN' ? '现钞卖出' : 'Cash Sell';
            break;
        default:
            appliedRate = baseRate;
            rateLabel = 'Mid Rate';
    }

    // Apply bank modifier
    appliedRate = applyBankModifier(appliedRate, currentBank, Date.now());
    const grossResult = amount * appliedRate;

    // Calculate fees
    const percentageFee = grossResult * (feePercent / 100);
    const totalFees = percentageFee + feeFixed;
    const netResult = grossResult - totalFees;

    document.getElementById('result-value').textContent = `${netResult.toFixed(2)} ${toCurrency}`;

    const detailsHTML = `
        <div class="detail-item">
            <span class="detail-label">${locale === 'zh-CN' ? '汇率' : 'Rate'} (${rateLabel}):</span>
            <span class="detail-value">${appliedRate.toFixed(6)}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">${locale === 'zh-CN' ? '银行' : 'Bank'}:</span>
            <span class="detail-value">${currentBank.toUpperCase()}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">${locale === 'zh-CN' ? '手续费' : 'Fees'}:</span>
            <span class="detail-value">${totalFees.toFixed(2)} ${toCurrency}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">${locale === 'zh-CN' ? '实际到账' : 'Net Amount'}:</span>
            <span class="detail-value">${netResult.toFixed(2)} ${toCurrency}</span>
        </div>
    `;

    document.getElementById('result-details').innerHTML = detailsHTML;
}

// ===========================================
// UPDATE FUNCTIONS
// ===========================================

function updateAllPairData() {
    const now = Date.now();

    activePairs.forEach((pair, pairKey) => {
        const baseRate = getExchangeRate(pair.base, pair.target);
        if (!baseRate) return;

        const variance = (Math.random() - 0.5) * 0.001;
        const rate = baseRate * (1 + variance);
        const modifiedRate = applyBankModifier(rate, currentBank, now);

        pair.data.push({ x: now, y: modifiedRate });

        if (pair.data.length > 200) {
            pair.data.shift();
        }

        const rateElement = document.getElementById(`rate-${pairKey}`);
        if (rateElement) {
            rateElement.textContent = modifiedRate.toFixed(4);
        }
    });

    updateChart();
    updateStats();
    updateRateDetails();
    updateConverter();
    updateRecommendations();
    checkAlerts();
}

function updateStats() {
    const now = new Date();
    const locale = TEXTS.locale || 'en-US';
    document.getElementById('last-update').textContent = now.toLocaleTimeString(locale);

    let totalChange = 0;
    let count = 0;
    let highestRate = -Infinity;
    let lowestRate = Infinity;
    let hasData = false;

    activePairs.forEach((pair) => {
        if (pair.data.length >= 2) {
            const oldRate = pair.data[pair.data.length - 2].y;
            const newRate = pair.data[pair.data.length - 1].y;
            const change = ((newRate - oldRate) / oldRate) * 100;
            totalChange += change;
            count++;

            // Find highest and lowest rates across all active pairs
            pair.data.forEach(point => {
                if (point.y > highestRate) highestRate = point.y;
                if (point.y < lowestRate) lowestRate = point.y;
                hasData = true;
            });
        }
    });

    // Update average change
    const avgChange = count > 0 ? totalChange / count : 0;
    const avgChangeElement = document.getElementById('avg-change');
    avgChangeElement.textContent = `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`;
    avgChangeElement.style.color = avgChange >= 0 ? '#10b981' : '#ef4444';

    // Update highest rate
    const highestElement = document.getElementById('highest-rate');
    if (hasData && highestRate !== -Infinity) {
        highestElement.textContent = highestRate.toFixed(4);
        highestElement.style.color = '#10b981';
    } else {
        highestElement.textContent = '--';
        highestElement.style.color = '';
    }

    // Update lowest rate
    const lowestElement = document.getElementById('lowest-rate');
    if (hasData && lowestRate !== Infinity) {
        lowestElement.textContent = lowestRate.toFixed(4);
        lowestElement.style.color = '#ef4444';
    } else {
        lowestElement.textContent = '--';
        lowestElement.style.color = '';
    }
}

function changeTimePeriod(period, days) {
    currentPeriod = period;
    currentDays = days;

    activePairs.forEach((pair, pairKey) => {
        pair.data = generateHistoricalData(pair.base, pair.target, days);
    });

    if (chart) {
        const timeUnit = days <= 1 ? 'hour' : days <= 7 ? 'day' : days <= 30 ? 'day' : 'month';
        chart.options.scales.x.time.unit = timeUnit;
    }

    updateChart();
    updateStats();
}

function changeBank(bank) {
    currentBank = bank;

    activePairs.forEach((pair, pairKey) => {
        pair.data = generateHistoricalData(pair.base, pair.target, currentDays);
    });

    renderActivePairs();
    updateChart();
    updateStats();
    updateRateDetails();
    updateConverter();
    updateRecommendations();
}

// ===========================================
// UI HELPERS
// ===========================================

function showNotification(message, type) {
    console.log(`[${type.toUpperCase()}] ${message}`);

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    const colors = {
        success: { bg: '#10b981', shadow: 'rgba(16, 185, 129, 0.3)' },
        error: { bg: '#ef4444', shadow: 'rgba(239, 68, 68, 0.3)' },
        warning: { bg: '#f59e0b', shadow: 'rgba(245, 158, 11, 0.3)' },
        info: { bg: '#0ea5e9', shadow: 'rgba(14, 165, 233, 0.3)' }
    };

    const color = colors[type] || colors.info;

    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${color.bg};
        color: #ffffff;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.9rem;
        box-shadow: 0 4px 20px ${color.shadow};
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ===========================================
// EVENT LISTENERS
// ===========================================

function setupEventListeners() {
    document.getElementById('add-pair-btn').addEventListener('click', () => {
        const base = document.getElementById('base-currency').value;
        const target = document.getElementById('target-currency').value;
        addCurrencyPair(base, target);
    });

    document.getElementById('bank-select').addEventListener('change', (e) => {
        changeBank(e.target.value);
    });

    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const period = btn.dataset.period;
            const days = parseInt(btn.dataset.days);
            changeTimePeriod(period, days);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.target.id === 'base-currency' || e.target.id === 'target-currency')) {
            document.getElementById('add-pair-btn').click();
        }
    });

    // Converter event listeners
    document.getElementById('convert-from').addEventListener('change', updateConverter);
    document.getElementById('convert-to').addEventListener('change', updateConverter);
    document.getElementById('convert-amount').addEventListener('input', updateConverter);
    document.getElementById('rate-type').addEventListener('change', updateConverter);
    document.getElementById('fee-percent').addEventListener('input', updateConverter);
    document.getElementById('fee-fixed').addEventListener('input', updateConverter);

    // Alert event listeners
    document.getElementById('add-alert-btn').addEventListener('click', addAlert);
}

// ===========================================
// INITIALIZATION
// ===========================================

async function init() {
    console.log('🚀 Initializing application...');

    await fetchExchangeRates();
    setupEventListeners();
    createChart();

    addCurrencyPair('EUR', 'CNY');
    addCurrencyPair('EUR', 'USD');
    addCurrencyPair('USD', 'CNY');

    updateInterval = setInterval(updateAllPairData, 5000);
    updateStats();
    updateRateDetails();
    updateConverter();
    updateRecommendations();
    renderAlerts();

    console.log('✅ Application initialized successfully');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});

// ===========================================
// NEW FEATURES
// ===========================================

/**
 * Update best rates comparison across banks
 */
function updateBestRates() {
    const container = document.getElementById('best-rates-grid');
    if (!container) return;

    if (activePairs.size === 0) {
        const locale = TEXTS.locale || 'en-US';
        container.innerHTML = `<p class="placeholder-text">${
            locale === 'zh-CN'
                ? '选择货币对查看各银行对比...'
                : 'Select a currency pair to see bank comparison...'
        }</p>`;
        return;
    }

    const locale = TEXTS.locale || 'en-US';
    const banks = Object.keys(BANK_MODIFIERS);
    const firstPair = activePairs.values().next().value;

    if (!firstPair) return;

    const baseRate = getExchangeRate(firstPair.base, firstPair.target);
    if (!baseRate) return;

    // Calculate rates for all banks
    const bankRates = banks.map(bank => {
        const modifiedRate = applyBankModifier(baseRate, bank, Date.now());
        const rates = calculateRateTypes(modifiedRate);
        return {
            bank,
            rate: rates.ttSell,
            modifier: BANK_MODIFIERS[bank].base
        };
    });

    // Sort by best rate (lowest for selling to customer)
    bankRates.sort((a, b) => a.rate - b.rate);

    const amount = 10000;
    const bestRate = bankRates[0].rate;

    let html = '';
    bankRates.forEach((item, index) => {
        const savings = (item.rate - bestRate) * amount;
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        const isBest = index === 0;

        const bankNames = {
            'bnp': 'BNP Paribas',
            'ca': locale === 'zh-CN' ? '农业信贷' : 'Crédit Agricole',
            'sg': locale === 'zh-CN' ? '兴业银行' : 'Société Générale',
            'bpce': 'BPCE',
            'cm': locale === 'zh-CN' ? '互助信贷' : 'Crédit Mutuel',
            'icbc': locale === 'zh-CN' ? '工商银行' : 'ICBC',
            'ccb': locale === 'zh-CN' ? '建设银行' : 'CCB',
            'abc': locale === 'zh-CN' ? '农业银行' : 'ABC',
            'boc': locale === 'zh-CN' ? '中国银行' : 'BOC',
            'bocom': locale === 'zh-CN' ? '交通银行' : 'BoCom'
        };

        html += `
            <div class="bank-rate-card ${isBest ? 'best' : ''}">
                ${medal ? `<div class="medal">${medal}</div>` : ''}
                <h4>${bankNames[item.bank]}</h4>
                <div class="rate-big">${item.rate.toFixed(4)}</div>
                <div class="savings">
                    ${savings > 0
                        ? (locale === 'zh-CN'
                            ? `比最优贵 ${savings.toFixed(2)} ${firstPair.target}`
                            : `+${savings.toFixed(2)} ${firstPair.target} vs best`)
                        : (locale === 'zh-CN' ? '最优惠 ✓' : 'Best Rate ✓')
                    }
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * Add rate alert
 */
function addAlert() {
    const base = document.getElementById('alert-base').value;
    const target = document.getElementById('alert-target').value;
    const condition = document.getElementById('alert-condition').value;
    const value = parseFloat(document.getElementById('alert-value').value);

    if (!value || value <= 0) {
        showNotification(
            TEXTS.locale === 'zh-CN' ? '请输入有效的目标汇率' : 'Please enter a valid target rate',
            'warning'
        );
        return;
    }

    if (base === target) {
        showNotification(TEXTS.sameCurrency, 'error');
        return;
    }

    const alert = {
        id: Date.now(),
        base,
        target,
        condition,
        value,
        triggered: false
    };

    rateAlerts.push(alert);
    localStorage.setItem('rateAlerts', JSON.stringify(rateAlerts));

    renderAlerts();
    document.getElementById('alert-value').value = '';

    showNotification(
        TEXTS.locale === 'zh-CN' ? '提醒已添加' : 'Alert added',
        'success'
    );
}

/**
 * Remove rate alert
 */
function removeAlert(id) {
    rateAlerts = rateAlerts.filter(alert => alert.id !== id);
    localStorage.setItem('rateAlerts', JSON.stringify(rateAlerts));
    renderAlerts();
}

/**
 * Render active alerts
 */
function renderAlerts() {
    const container = document.getElementById('active-alerts');
    if (!container) return;

    if (rateAlerts.length === 0) {
        const locale = TEXTS.locale || 'en-US';
        container.innerHTML = `<p class="placeholder-text">${
            locale === 'zh-CN'
                ? '暂无提醒。添加提醒以获取通知！'
                : 'No alerts set. Add an alert to get notified!'
        }</p>`;
        return;
    }

    const locale = TEXTS.locale || 'en-US';
    let html = '';

    rateAlerts.forEach(alert => {
        const currentRate = getExchangeRate(alert.base, alert.target);
        const conditionText = alert.condition === 'above'
            ? (locale === 'zh-CN' ? '高于' : '≥')
            : (locale === 'zh-CN' ? '低于' : '≤');

        html += `
            <div class="alert-item ${alert.triggered ? 'triggered' : ''}">
                <div class="alert-info">
                    <span class="alert-badge">${alert.base}/${alert.target}</span>
                    <span class="alert-condition">${conditionText} ${alert.value.toFixed(4)}</span>
                    ${currentRate ? `<span class="alert-current">${locale === 'zh-CN' ? '当前' : 'Now'}: ${currentRate.toFixed(4)}</span>` : ''}
                </div>
                <button class="alert-remove" onclick="removeAlert(${alert.id})">×</button>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * Check if any alerts should be triggered
 */
function checkAlerts() {
    let hasTriggered = false;
    const locale = TEXTS.locale || 'en-US';

    rateAlerts.forEach(alert => {
        const currentRate = getExchangeRate(alert.base, alert.target);
        if (!currentRate) return;

        const shouldTrigger = alert.condition === 'above'
            ? currentRate >= alert.value
            : currentRate <= alert.value;

        if (shouldTrigger && !alert.triggered) {
            alert.triggered = true;
            hasTriggered = true;

            // Show notification
            const message = locale === 'zh-CN'
                ? `汇率提醒：${alert.base}/${alert.target} ${alert.condition === 'above' ? '已达到' : '已低于'} ${alert.value.toFixed(4)}！`
                : `Rate Alert: ${alert.base}/${alert.target} ${alert.condition === 'above' ? 'reached' : 'dropped to'} ${alert.value.toFixed(4)}!`;

            showNotification(message, 'success');

            // Browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('FX Monitor Alert', {
                    body: message,
                    icon: '/favicon.ico'
                });
            }
        }
    });

    if (hasTriggered) {
        localStorage.setItem('rateAlerts', JSON.stringify(rateAlerts));
        renderAlerts();
    }
}

/**
 * Update exchange timing recommendations
 */
function updateRecommendations() {
    const container = document.getElementById('recommendation-grid');
    if (!container) return;

    // Simple and direct language detection
    const isChinese = (TEXTS.locale === 'zh-CN');
    console.log('updateRecommendations - TEXTS.locale:', TEXTS.locale, 'isChinese:', isChinese);

    if (activePairs.size === 0) {
        container.innerHTML = `<p class="placeholder-text">${
            isChinese
                ? '添加货币对到图表以查看建议...'
                : 'Add currency pairs to the chart to see recommendations...'
        }</p>`;
        return;
    }
    let html = '';

    activePairs.forEach((pair, pairKey) => {
        if (pair.data.length < 10) return;

        const currentRate = pair.data[pair.data.length - 1].y;
        const rates = pair.data.map(d => d.y);

        // Calculate period-specific metrics
        const dataLength = rates.length;
        const period7 = Math.min(7, dataLength);
        const period30 = Math.min(30, dataLength);

        const recent7 = rates.slice(-period7);
        const recent30 = rates.slice(-period30);

        const avg7 = recent7.reduce((a, b) => a + b, 0) / period7;
        const avg30 = recent30.reduce((a, b) => a + b, 0) / period30;
        const max30 = Math.max(...recent30);
        const min30 = Math.min(...recent30);

        // Calculate volatility (standard deviation)
        const variance = recent30.reduce((sum, val) => sum + Math.pow(val - avg30, 2), 0) / period30;
        const volatility = Math.sqrt(variance);
        const volatilityPercent = (volatility / avg30) * 100;

        // Calculate trend (compare first half vs second half of period)
        const firstHalf = recent30.slice(0, Math.floor(period30 / 2));
        const secondHalf = recent30.slice(Math.floor(period30 / 2));
        const avgFirstHalf = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avgSecondHalf = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const trendPercent = ((avgSecondHalf - avgFirstHalf) / avgFirstHalf) * 100;

        const percentFromAvg7 = ((currentRate - avg7) / avg7) * 100;
        const percentFromAvg30 = ((currentRate - avg30) / avg30) * 100;
        const distanceFromMax = ((currentRate - max30) / max30) * 100;
        const distanceFromMin = ((currentRate - min30) / min30) * 100;

        // Price position in range (0-100%)
        const rangePosition = ((currentRate - min30) / (max30 - min30)) * 100;

        let action, actionClass, analysis, recommendation;

        // Decision logic with detailed reasoning
        if (percentFromAvg30 < -1 && distanceFromMin < 5) {
            // Price is low - good time to buy
            actionClass = 'buy';
            action = isChinese ? '建议买入' : 'BUY';

            if (isChinese) {
                const trendText = trendPercent > 0 ? `上涨趋势（+${trendPercent.toFixed(2)}%）` : `下跌趋势（${trendPercent.toFixed(2)}%）`;
                const volatilityText = volatilityPercent < 0.5 ? '低波动' : volatilityPercent < 1.5 ? '中等波动' : '高波动';

                analysis = `当前汇率：${currentRate.toFixed(4)}\n` +
                          `30天平均：${avg30.toFixed(4)}（当前低 ${Math.abs(percentFromAvg30).toFixed(2)}%）\n` +
                          `7天平均：${avg7.toFixed(4)}（当前低 ${Math.abs(percentFromAvg7).toFixed(2)}%）\n` +
                          `30天区间：${min30.toFixed(4)} - ${max30.toFixed(4)}\n` +
                          `区间位置：${rangePosition.toFixed(1)}%（接近底部）\n` +
                          `近期趋势：${trendText}\n` +
                          `波动程度：${volatilityText}（${volatilityPercent.toFixed(2)}%）`;

                recommendation = `当前汇率处于30天区间的底部位置（${rangePosition.toFixed(0)}%分位），` +
                               `比平均价格低${Math.abs(percentFromAvg30).toFixed(2)}%。` +
                               `这是一个相对安全的买入时机，因为价格已经接近最低点，下跌空间有限。` +
                               `${trendPercent > 0 ? '近期已显现回升迹象，' : ''}` +
                               `建议分批买入${pair.target}，降低成本。`;
            } else {
                const trendText = trendPercent > 0 ? `uptrend (+${trendPercent.toFixed(2)}%)` : `downtrend (${trendPercent.toFixed(2)}%)`;
                const volatilityText = volatilityPercent < 0.5 ? 'low volatility' : volatilityPercent < 1.5 ? 'moderate volatility' : 'high volatility';

                analysis = `Current rate: ${currentRate.toFixed(4)}\n` +
                          `30-day average: ${avg30.toFixed(4)} (current ${Math.abs(percentFromAvg30).toFixed(2)}% below)\n` +
                          `7-day average: ${avg7.toFixed(4)} (current ${Math.abs(percentFromAvg7).toFixed(2)}% below)\n` +
                          `30-day range: ${min30.toFixed(4)} - ${max30.toFixed(4)}\n` +
                          `Range position: ${rangePosition.toFixed(1)}% (near bottom)\n` +
                          `Recent trend: ${trendText}\n` +
                          `Volatility: ${volatilityText} (${volatilityPercent.toFixed(2)}%)`;

                recommendation = `Current rate is at the bottom of 30-day range (${rangePosition.toFixed(0)}th percentile), ` +
                               `${Math.abs(percentFromAvg30).toFixed(2)}% below average. ` +
                               `This is a relatively safe buying opportunity as price is near the low with limited downside. ` +
                               `${trendPercent > 0 ? 'Recent recovery signs detected. ' : ''}` +
                               `Consider buying ${pair.target} in batches to reduce cost.`;
            }
        } else if (percentFromAvg30 > 1 && distanceFromMax > -5) {
            // Price is high - consider selling
            actionClass = 'sell';
            action = isChinese ? '建议卖出' : 'SELL';

            if (isChinese) {
                const trendText = trendPercent > 0 ? `上涨趋势（+${trendPercent.toFixed(2)}%）` : `下跌趋势（${trendPercent.toFixed(2)}%）`;
                const volatilityText = volatilityPercent < 0.5 ? '低波动' : volatilityPercent < 1.5 ? '中等波动' : '高波动';

                analysis = `当前汇率：${currentRate.toFixed(4)}\n` +
                          `30天平均：${avg30.toFixed(4)}（当前高 ${percentFromAvg30.toFixed(2)}%）\n` +
                          `7天平均：${avg7.toFixed(4)}（当前高 ${percentFromAvg7.toFixed(2)}%）\n` +
                          `30天区间：${min30.toFixed(4)} - ${max30.toFixed(4)}\n` +
                          `区间位置：${rangePosition.toFixed(1)}%（接近顶部）\n` +
                          `近期趋势：${trendText}\n` +
                          `波动程度：${volatilityText}（${volatilityPercent.toFixed(2)}%）`;

                recommendation = `当前汇率处于30天区间的顶部位置（${rangePosition.toFixed(0)}%分位），` +
                               `比平均价格高${percentFromAvg30.toFixed(2)}%。` +
                               `这是一个理想的卖出时机，可以锁定收益。` +
                               `${trendPercent < 0 ? '近期已显现下跌迹象，' : ''}` +
                               `建议及时卖出${pair.target}，避免回调风险。`;
            } else {
                const trendText = trendPercent > 0 ? `uptrend (+${trendPercent.toFixed(2)}%)` : `downtrend (${trendPercent.toFixed(2)}%)`;
                const volatilityText = volatilityPercent < 0.5 ? 'low volatility' : volatilityPercent < 1.5 ? 'moderate volatility' : 'high volatility';

                analysis = `Current rate: ${currentRate.toFixed(4)}\n` +
                          `30-day average: ${avg30.toFixed(4)} (current ${percentFromAvg30.toFixed(2)}% above)\n` +
                          `7-day average: ${avg7.toFixed(4)} (current ${percentFromAvg7.toFixed(2)}% above)\n` +
                          `30-day range: ${min30.toFixed(4)} - ${max30.toFixed(4)}\n` +
                          `Range position: ${rangePosition.toFixed(1)}% (near top)\n` +
                          `Recent trend: ${trendText}\n` +
                          `Volatility: ${volatilityText} (${volatilityPercent.toFixed(2)}%)`;

                recommendation = `Current rate is at the top of 30-day range (${rangePosition.toFixed(0)}th percentile), ` +
                               `${percentFromAvg30.toFixed(2)}% above average. ` +
                               `This is an ideal time to sell and lock in profits. ` +
                               `${trendPercent < 0 ? 'Recent decline signs detected. ' : ''}` +
                               `Consider selling ${pair.target} to avoid pullback risk.`;
            }
        } else {
            // Price is neutral - hold and wait
            actionClass = 'hold';
            action = isChinese ? '观望等待' : 'HOLD';

            if (isChinese) {
                const trendText = trendPercent > 0 ? `上涨趋势（+${trendPercent.toFixed(2)}%）` : trendPercent < -0.5 ? `下跌趋势（${trendPercent.toFixed(2)}%）` : `横盘整理（${trendPercent.toFixed(2)}%）`;
                const volatilityText = volatilityPercent < 0.5 ? '低波动' : volatilityPercent < 1.5 ? '中等波动' : '高波动';

                analysis = `当前汇率：${currentRate.toFixed(4)}\n` +
                          `30天平均：${avg30.toFixed(4)}（当前${percentFromAvg30 >= 0 ? '高' : '低'} ${Math.abs(percentFromAvg30).toFixed(2)}%）\n` +
                          `7天平均：${avg7.toFixed(4)}（当前${percentFromAvg7 >= 0 ? '高' : '低'} ${Math.abs(percentFromAvg7).toFixed(2)}%）\n` +
                          `30天区间：${min30.toFixed(4)} - ${max30.toFixed(4)}\n` +
                          `区间位置：${rangePosition.toFixed(1)}%（中间区域）\n` +
                          `近期趋势：${trendText}\n` +
                          `波动程度：${volatilityText}（${volatilityPercent.toFixed(2)}%）`;

                recommendation = `当前汇率处于30天区间的中间位置（${rangePosition.toFixed(0)}%分位），` +
                               `距离平均价格${Math.abs(percentFromAvg30).toFixed(2)}%。` +
                               `既不接近高点也不接近低点，暂时没有明显的买入或卖出信号。` +
                               `建议继续观察汇率走势，` +
                               `${rangePosition < 40 ? '如果继续下跌到底部区域可考虑买入，' : rangePosition > 60 ? '如果继续上涨到顶部区域可考虑卖出，' : ''}` +
                               `等待更明确的交易机会。`;
            } else {
                const trendText = trendPercent > 0 ? `uptrend (+${trendPercent.toFixed(2)}%)` : trendPercent < -0.5 ? `downtrend (${trendPercent.toFixed(2)}%)` : `sideways (${trendPercent.toFixed(2)}%)`;
                const volatilityText = volatilityPercent < 0.5 ? 'low volatility' : volatilityPercent < 1.5 ? 'moderate volatility' : 'high volatility';

                analysis = `Current rate: ${currentRate.toFixed(4)}\n` +
                          `30-day average: ${avg30.toFixed(4)} (current ${Math.abs(percentFromAvg30).toFixed(2)}% ${percentFromAvg30 >= 0 ? 'above' : 'below'})\n` +
                          `7-day average: ${avg7.toFixed(4)} (current ${Math.abs(percentFromAvg7).toFixed(2)}% ${percentFromAvg7 >= 0 ? 'above' : 'below'})\n` +
                          `30-day range: ${min30.toFixed(4)} - ${max30.toFixed(4)}\n` +
                          `Range position: ${rangePosition.toFixed(1)}% (middle area)\n` +
                          `Recent trend: ${trendText}\n` +
                          `Volatility: ${volatilityText} (${volatilityPercent.toFixed(2)}%)`;

                recommendation = `Current rate is in the middle of 30-day range (${rangePosition.toFixed(0)}th percentile), ` +
                               `${Math.abs(percentFromAvg30).toFixed(2)}% ${percentFromAvg30 >= 0 ? 'above' : 'below'} average. ` +
                               `Neither near high nor low. No strong buy or sell signal. ` +
                               `Continue monitoring. ` +
                               `${rangePosition < 40 ? 'Consider buying if it drops to bottom area. ' : rangePosition > 60 ? 'Consider selling if it rises to top area. ' : ''}` +
                               `Wait for clearer trading opportunity.`;
            }
        }

        html += `
            <div class="recommendation-card ${actionClass}">
                <div class="recommendation-header">
                    <div class="recommendation-pair">${pairKey}</div>
                    <div class="recommendation-action ${actionClass}">${action}</div>
                </div>
                <div class="recommendation-stats">
                    <div class="recommendation-stat">
                        <div class="recommendation-stat-label">${isChinese ? '当前汇率' : 'Current Rate'}</div>
                        <div class="recommendation-stat-value">${currentRate.toFixed(4)}</div>
                    </div>
                    <div class="recommendation-stat">
                        <div class="recommendation-stat-label">${isChinese ? '30天最高' : '30-Day High'}</div>
                        <div class="recommendation-stat-value">${max30.toFixed(4)}</div>
                    </div>
                    <div class="recommendation-stat">
                        <div class="recommendation-stat-label">${isChinese ? '30天最低' : '30-Day Low'}</div>
                        <div class="recommendation-stat-value">${min30.toFixed(4)}</div>
                    </div>
                </div>
                <div class="recommendation-analysis">
                    <strong>${isChinese ? '📊 数据分析' : '📊 Analysis'}</strong>
                    <pre>${analysis}</pre>
                </div>
                <div class="recommendation-reason">
                    <strong>${isChinese ? '💡 操作建议' : '💡 Recommendation'}</strong>
                    <p>${recommendation}</p>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}
