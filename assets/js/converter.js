/* --- SIMPLE CURRENCY CONVERTER --- */
// 1. Defaults to USD (No Auto-Detect)
// 2. Simulator still works (Manual Trigger)

async function updateCurrency(manualCountry = null) {
    // If no manual country is sent, DEFAULT TO 'US'
    let countryCode = manualCountry || 'US';

    console.log("Current Currency Mode:", countryCode);

    // --- CASE 1: USD (Default) ---
    // Resets everything to the hardcoded USD prices in your HTML
    if (countryCode === 'US' || countryCode === 'USD') {
        document.querySelectorAll('.dynamic-price').forEach(el => {
            const usd = parseFloat(el.getAttribute('data-usd'));
            // Check for /mo suffix
            const suffix = el.innerHTML.includes('/mo') ? '<span style="font-size:1rem; color:#888;">/mo</span>' : '';
            // Reset text
            el.innerHTML = `$${usd.toLocaleString()}${suffix}`;
        });
        return;
    }

    // --- CASE 2: FOREIGN CURRENCY (Only runs if manually triggered) ---
    
    // Configure VIP Countries
    const allowedCountries = {
        'BD': 'BDT', 'GB': 'GBP', 'CA': 'CAD', 
        'JP': 'JPY', 'KR': 'KRW', 'CN': 'CNY', 
        'MX': 'MXN', 'AU': 'AUD', 
        'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR', 
        'BE': 'EUR', 'AT': 'EUR', 'IE': 'EUR', 'PT': 'EUR', 'GR': 'EUR', 
        'FI': 'EUR', 'EE': 'EUR', 'LV': 'EUR', 'LT': 'EUR', 'SK': 'EUR'
    };

    const userCurrency = allowedCountries[countryCode];
    if (!userCurrency) return; // If unknown code, do nothing (stay USD)

    try {
        const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
        const rateData = await rateRes.json();
        const liveRate = rateData.rates[userCurrency];

        if (!liveRate) return;

        // Symbols
        const symbols = {
            'EUR': { s: '€', pos: 'before' },
            'GBP': { s: '£', pos: 'before' },
            'BDT': { s: '৳', pos: 'after' },
            'CAD': { s: 'CA$', pos: 'before' },
            'AUD': { s: 'AU$', pos: 'before' },
            'JPY': { s: '¥', pos: 'before' },
            'KRW': { s: '₩', pos: 'before' },
            'CNY': { s: '¥', pos: 'before' },
            'MXN': { s: 'MX$', pos: 'before' },
        };
        const conf = symbols[userCurrency] || { s: userCurrency, pos: 'before' };

        // Conversion & Rounding
        document.querySelectorAll('.dynamic-price').forEach(el => {
            const usd = parseFloat(el.getAttribute('data-usd'));
            const rawPrice = usd * liveRate;
            let finalPrice;

            if (rawPrice > 100000) finalPrice = Math.round(rawPrice / 5000) * 5000;
            else if (rawPrice > 10000) finalPrice = Math.round(rawPrice / 1000) * 1000;
            else if (rawPrice > 1000) finalPrice = Math.round(rawPrice / 50) * 50;
            else if (rawPrice > 100) finalPrice = Math.round(rawPrice / 10) * 10;
            else if (rawPrice > 30) finalPrice = Math.round(rawPrice / 5) * 5;
            else finalPrice = Math.ceil(rawPrice);

            const formatted = finalPrice.toLocaleString();
            const suffix = el.innerHTML.includes('/mo') ? '<span style="font-size:1rem; color:#888;">/mo</span>' : '';

            if (conf.pos === 'before') {
                el.innerHTML = `${conf.s}${formatted}${suffix}`;
            } else {
                el.innerHTML = `${formatted}${conf.s}${suffix}`;
            }
        });

    } catch (err) {
        console.error("Rate calculation failed:", err);
    }
}

// Run immediately (Defaults to US)
updateCurrency();
