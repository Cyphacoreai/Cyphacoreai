/* --- UNIVERSAL CURRENCY CONVERTER --- */
// 1. Accepts Manual Override (For Simulator)
// 2. Auto-Detects via Timezone/API (For Main Site)
// 3. Applies Strict Rounding

async function updateCurrency(manualCountry = null) {
    console.log("--- Currency Script Started ---");

    let countryCode = manualCountry;

    // --- STEP 1: AUTO-DETECT (Only if no manual override provided) ---
    if (!countryCode) {
        // A. Timezone Check
        try {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (timeZone === "Asia/Dhaka") countryCode = "BD";
            else if (timeZone === "Europe/London") countryCode = "GB";
            else if (timeZone.startsWith("Australia/")) countryCode = "AU";
            else if (timeZone.startsWith("Asia/Tokyo")) countryCode = "JP";
            else if (timeZone.startsWith("Asia/Seoul")) countryCode = "KR";
            else if (timeZone.startsWith("America/Mexico_City")) countryCode = "MX";
            else if (timeZone.startsWith("Asia/Shanghai")) countryCode = "CN";
            // Rough check for Europe
            else if (timeZone.startsWith("Europe/")) countryCode = "DE"; 
        } catch (e) {
            console.log("Timezone check failed.");
        }

        // B. API Backup
        if (!countryCode || countryCode === "DE") {
            try {
                const res = await fetch('https://api.country.is');
                const data = await res.json();
                countryCode = data.country; 
            } catch (e) {
                // Default to US if everything fails
                countryCode = 'US';
            }
        }
    }

    console.log("Target Country:", countryCode);

    // --- STEP 2: HANDLE USD RESET (Crucial for Simulator) ---
    // If country is US, we must reset the text back to dollars
    if (countryCode === 'US' || countryCode === 'USD') {
        document.querySelectorAll('.dynamic-price').forEach(el => {
            const usd = parseFloat(el.getAttribute('data-usd'));
            // Check for /mo suffix
            const suffix = el.innerHTML.includes('/mo') ? '<span style="font-size:1rem; color:#888;">/mo</span>' : '';
            el.innerHTML = `$${usd.toLocaleString()}${suffix}`;
        });
        return;
    }

    // --- STEP 3: CONFIGURE VIP COUNTRIES ---
    const allowedCountries = {
        'BD': 'BDT', 'GB': 'GBP', 'CA': 'CAD', 
        'JP': 'JPY', 'KR': 'KRW', 'CN': 'CNY', 
        'MX': 'MXN', 'AU': 'AUD', 
        // HUGE EUROPE LIST
        'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR', 
        'BE': 'EUR', 'AT': 'EUR', 'IE': 'EUR', 'PT': 'EUR', 'GR': 'EUR', 
        'FI': 'EUR', 'EE': 'EUR', 'LV': 'EUR', 'LT': 'EUR', 'SK': 'EUR', 
        'SI': 'EUR', 'MT': 'EUR', 'CY': 'EUR', 'LU': 'EUR'
    };

    const userCurrency = allowedCountries[countryCode];

    if (!userCurrency) {
        // If not in VIP list, treat as USD
        updateCurrency('US'); 
        return;
    }

    // --- STEP 4: GET RATES ---
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

        // --- STEP 5: STRICT ROUNDING LOGIC ---
        document.querySelectorAll('.dynamic-price').forEach(el => {
            const usd = parseFloat(el.getAttribute('data-usd'));
            const rawPrice = usd * liveRate;
            let finalPrice;

            if (rawPrice > 100000) {
                // e.g. BDT: 146,400 -> 145,000
                finalPrice = Math.round(rawPrice / 5000) * 5000;
            } 
            else if (rawPrice > 10000) {
                // e.g. INR/JPY: 12,450 -> 12,000
                finalPrice = Math.round(rawPrice / 1000) * 1000;
            } 
            else if (rawPrice > 1000) {
                // e.g. EUR/GBP SaaS: 1,120 -> 1,100 (Nearest 50)
                finalPrice = Math.round(rawPrice / 50) * 50;
            } 
            else if (rawPrice > 100) {
                // e.g. EUR Web: 233 -> 230 (Nearest 10)
                finalPrice = Math.round(rawPrice / 10) * 10;
            } 
            else if (rawPrice > 30) {
                // e.g. EUR Growth Plan: 46 -> 45 (Nearest 5)
                finalPrice = Math.round(rawPrice / 5) * 5;
            }
            else {
                // Tiny Subs: Keep precise
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

// Auto-run on load (Uses auto-detection because no argument is passed)
updateCurrency();
