/* --- UNIVERSAL CURRENCY CONVERTER --- */
// 1. Accepts Manual Override (For Simulator)
// 2. PRIORITIZES VPN/IP DETECTION (Best for Testing)
// 3. Fallback to Timezone if API fails
// 4. Applies Strict Rounding Rules

async function updateCurrency(manualCountry = null) {
    console.log("--- Currency Script Started ---");

    let countryCode = manualCountry;

    // --- STEP 1: AUTO-DETECT (Only if no manual override provided) ---
    if (!countryCode) {
        
        // A. TRY API FIRST (This makes VPNs work)
        try {
            console.log("Attempting detection via IP...");
            const res = await fetch('https://api.country.is');
            const data = await res.json();
            countryCode = data.country; 
            console.log("Detected via IP:", countryCode);
        } catch (e) {
            console.log("IP Detection failed (AdBlocker?). Switching to Timezone.");
        }

        // B. TIMEZONE BACKUP (Only if API failed)
        if (!countryCode) {
            try {
                const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                
                if (timeZone === "Asia/Dhaka") countryCode = "BD";
                else if (timeZone === "Europe/London") countryCode = "GB";
                else if (timeZone.startsWith("Australia/")) countryCode = "AU";
                else if (timeZone.startsWith("Asia/Tokyo")) countryCode = "JP";
                else if (timeZone.startsWith("Asia/Seoul")) countryCode = "KR";
                else if (timeZone.startsWith("America/Mexico_City")) countryCode = "MX";
                else if (timeZone.startsWith("Asia/Shanghai")) countryCode = "CN";
                else if (timeZone.startsWith("Europe/")) countryCode = "DE"; 
            } catch (e) {
                console.log("Timezone check failed.");
            }
        }

        // C. FINAL FALLBACK
        if (!countryCode) countryCode = 'US';
    }

    console.log("Target Country:", countryCode);

    // --- STEP 2: HANDLE USD RESET ---
    // If country is US, we must reset the text back to plain Dollars
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
        // HUGE EUROPE LIST
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
