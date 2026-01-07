/* --- ULTIMATE CURRENCY CONVERTER (Final Fix) --- */

async function updateCurrency() {
    console.log("--- Starting Currency Check ---");

    let countryCode = null;

    // 1. GET LOCATION (With 3 Backups)
    try {
        const res1 = await fetch('https://ipapi.co/json/');
        const data1 = await res1.json();
        countryCode = data1.country_code;
    } catch (e) {
        try {
            const res2 = await fetch('https://api.country.is');
            const data2 = await res2.json();
            countryCode = data2.country;
        } catch (e2) {
            try {
                const res3 = await fetch('https://ipwhois.app/json/');
                const data3 = await res3.json();
                countryCode = data3.country_code;
            } catch (e3) {
                console.error("All APIs failed. Staying in USD.");
                return;
            }
        }
    }

    // SAFETY FIX: Force uppercase (e.g. "bd" -> "BD")
    if (!countryCode) return;
    countryCode = countryCode.toUpperCase();
    
    console.log("Detected Country:", countryCode);

    // 2. MAP COUNTRY -> CURRENCY
    const countryToCurrency = {
        'BD': 'BDT', 'IN': 'INR', 'GB': 'GBP',
        'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR',
        'AU': 'AUD', 'CA': 'CAD', 'JP': 'JPY', 'CN': 'CNY', 'BR': 'BRL'
    };

    const userCurrency = countryToCurrency[countryCode] || 'USD';

    if (userCurrency === 'USD') return;

    // 3. GET RATE & CONVERT
    try {
        const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
        const rateData = await rateRes.json();
        const liveRate = rateData.rates[userCurrency];

        if (!liveRate) return;

        const formatting = {
            'EUR': { symbol: '€', pos: 'before' },
            'GBP': { symbol: '£', pos: 'before' },
            'BDT': { symbol: '৳', pos: 'after' },
            'INR': { symbol: '₹', pos: 'before' },
            'AUD': { symbol: 'AU$', pos: 'before' },
            'CAD': { symbol: 'CA$', pos: 'before' },
        };
        
        const format = formatting[userCurrency] || { symbol: userCurrency + ' ', pos: 'before' };

        document.querySelectorAll('.dynamic-price').forEach(el => {
            const usdAmount = parseFloat(el.getAttribute('data-usd'));
            const converted = Math.ceil(usdAmount * liveRate);
            const formattedNum = converted.toLocaleString();

            if (format.pos === 'before') {
                el.textContent = `${format.symbol}${formattedNum}`;
            } else {
                el.textContent = `${formattedNum}${format.symbol}`;
            }
        });

    } catch (err) {
        console.error("Rate API failed:", err);
    }
}

updateCurrency();
