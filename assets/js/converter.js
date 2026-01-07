/* --- VPN-EXCLUSIVE CURRENCY CONVERTER --- */
// 1. Accepts Manual Override (For Simulator)
// 2. ONLY uses IP Address (Best for VPN Testing)
// 3. Applies Strict Rounding Rules

async function updateCurrency(manualCountry = null) {
    console.log("--- Currency Script Started ---");

    let countryCode = manualCountry;

    // --- STEP 1: AUTO-DETECT (IP ADDRESS ONLY) ---
    // We removed the Timezone check completely.
    if (!countryCode) {
        try {
            console.log("Detecting location via IP...");
            const res = await fetch('https://api.country.is');
            const data = await res.json();
            countryCode = data.country; 
            console.log("Detected IP Location:", countryCode);
        } catch (e) {
            console.log("IP Detection failed (AdBlocker?). Defaulting to US.");
            countryCode = 'US';
        }
    }

    console.log("Final Target Country:", countryCode);

    // --- STEP 2: HANDLE USD RESET ---
    // If country is US (or detection failed), reset text to dollars
    if (countryCode === 'US' || countryCode === 'USD') {
        document.querySelectorAll('.dynamic-price').forEach(el => {
            const usd = parseFloat(el.getAttribute('data-usd'));
            // Check for /mo suffix inside the HTML
            const suffix = el.innerHTML.includes('/mo') ? '<span style="font-size:1rem; color:#888;">/mo</span>' : '';
            // Reset text
            el.innerHTML = `$${usd.toLocaleString()}${suffix}`;
        });
        return;
    }

    // --- STEP 3: CONFIGURE VIP COUNTRIES ---
    const allowedCountries = {
        'BD': 'BDT', 'GB': 'GBP', 'CA': 'CAD', 
        'JP': 'JPY', 'KR': 'KRW', 'CN': 'CNY', 
        'MX': 'MXN', 'AU': 'AUD', 
        // EUROPE LIST
        'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR', 
        'BE': 'EUR', 'AT': 'EUR', 'IE': 'EUR', 'PT': 'EUR', 'GR': 'EUR', 
        'FI': 'EUR', 'EE': 'EUR', 'LV': 'EUR', 'LT': 'EUR', 'SK': 'EUR', 
        'SI': 'EUR', 'MT': 'EUR', 'CY': 'EUR', 'LU': 'EUR'
    };

    const userCurrency = allowedCountries[countryCode];

    if (!userCurrency) {
        // If detected country is not in our VIP list, treat as USD
        updateCurrency('US'); 
        return;
    }

    // --- STEP 4: GET LIVE RATES ---
    try {
        const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
        const rateData = await rateRes.json();
        const liveRate = rateData.rates[userCurrency];

        if (!liveRate) return;

        // Symbols Configuration
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

        // --- STEP 5: STRICT ROUNDING LOGIC ---
        document.querySelectorAll('.dynamic-price').forEach(el => {
            const usd = parseFloat(el.getAttribute('data-usd'));
            const rawPrice = usd * liveRate;
            let finalPrice;

            if (rawPrice > 100000) {
                // Massive numbers (e.g. BDT: 146,400 -> 145,000)
                finalPrice = Math.round(rawPrice / 5000) * 5000;
            } 
            else if (rawPrice > 10000) {
                // Large numbers (e.g. INR/JPY: 12,450 -> 12,000)
                finalPrice = Math.round(rawPrice / 1000) * 1000;
            } 
            else if (rawPrice > 1000) {
                // Mid-High numbers (e.g. EUR SaaS: 1,120 -> 1,100)
                finalPrice = Math.round(rawPrice / 50) * 50;
            } 
            else if (rawPrice > 100) {
                // Standard numbers (e.g. EUR Web: 233 -> 230)
                finalPrice = Math.round(rawPrice / 10) * 10;
            } 
            else if (rawPrice > 30) {
                // Subscription numbers (e.g. EUR Growth: 46 -> 45)
                finalPrice = Math.round(rawPrice / 5) * 5;
            }
            else {
                // Tiny numbers: Just remove decimals
                finalPrice = Math.ceil(rawPrice);
            }

            const formatted = finalPrice.toLocaleString();
            
            // Handle /mo suffix
            const suffix = el.innerHTML.includes('/mo') ? '<span style="font-size:1rem; color:#888;">/mo</span>' : '';

            if (conf.pos === 'before') {
                el.innerHTML = `${conf.s}${formatted}${suffix}`;
            } else {
                el.innerHTML = `${formatted}${conf.s}${suffix}`;
            }
        });

        console.log(`Prices converted to ${userCurrency}`);

    } catch (err) {
        console.error("Rate calculation failed:", err);
    }
}

// Auto-run on load
updateCurrency();
