/* --- BULLETPROOF CURRENCY CONVERTER --- */
// 1. Checks Timezone (Fastest for locals)
// 2. Checks API (Backup for travelers)
// 3. Rounds numbers to look professional (e.g. 97,000 instead of 97,650)

async function updateCurrency() {
    console.log("--- Currency Script Started ---");

    let countryCode = null;

    // --- STEP 1: TIMEZONE CHECK (Instant Fix) ---
    try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log("Detected Timezone:", timeZone);

        if (timeZone === "Asia/Dhaka") countryCode = "BD";
        else if (timeZone === "Europe/London") countryCode = "GB"; // UK
        else if (timeZone.startsWith("Australia/")) countryCode = "AU";
        else if (timeZone.startsWith("Asia/Tokyo")) countryCode = "JP";
        else if (timeZone.startsWith("Asia/Seoul")) countryCode = "KR";
        else if (timeZone.startsWith("America/Mexico_City")) countryCode = "MX";
        else if (timeZone.startsWith("Asia/Shanghai")) countryCode = "CN";
    } catch (e) {
        console.log("Timezone check failed.");
    }

    // --- STEP 2: API BACKUP (If Timezone didn't work) ---
    if (!countryCode) {
        try {
            const res = await fetch('https://api.country.is');
            const data = await res.json();
            countryCode = data.country; 
        } catch (e) {
            console.log("API failed. Falling back to USD.");
            return; 
        }
    }

    // --- STEP 3: CONFIGURE SETTINGS ---
    const allowedCountries = {
        'BD': 'BDT', 
        'GB': 'GBP', // UK
        'CA': 'CAD', // Canada
        'JP': 'JPY', // Japan
        'KR': 'KRW', // Korea
        'CN': 'CNY', // China
        'MX': 'MXN', // Mexico
        'AU': 'AUD', // Australia
        // Eurozone
        'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 
        'NL': 'EUR', 'BE': 'EUR', 'AT': 'EUR', 'IE': 'EUR'
    };

    const userCurrency = allowedCountries[countryCode];

    if (!userCurrency) {
        console.log(`Country (${countryCode}) not in VIP list. Staying in USD.`);
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

        // --- STEP 5: PRETTY ROUNDING ---
        document.querySelectorAll('.dynamic-price').forEach(el => {
            const usd = parseFloat(el.getAttribute('data-usd'));
            const rawPrice = usd * liveRate;
            let finalPrice;

            // Rounding Logic
            if (rawPrice > 100000) {
                // e.g. 146,400 -> 145,000
                finalPrice = Math.round(rawPrice / 5000) * 5000;
            } else if (rawPrice > 10000) {
                // e.g. 73,200 -> 73,000
                finalPrice = Math.round(rawPrice / 1000) * 1000;
            } else if (rawPrice > 1000) {
                // e.g. 1,234 -> 1,200
                finalPrice = Math.round(rawPrice / 100) * 100;
            } else {
                // Small numbers (Monthly subs)
                finalPrice = Math.ceil(rawPrice);
            }

            const formatted = finalPrice.toLocaleString();

            if (conf.pos === 'before') {
                el.textContent = `${conf.s}${formatted}`;
            } else {
                el.textContent = `${formatted}${conf.s}`;
            }
        });

        console.log(`Prices converted to ${userCurrency}`);

    } catch (err) {
        console.error("Rate calculation failed:", err);
    }
}

updateCurrency();
