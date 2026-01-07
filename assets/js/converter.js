/* --- LIVE CURRENCY CONVERTER --- */
// 1. Detects User Location
// 2. Fetches TODAY'S Exchange Rate from API
// 3. Converts & Formats the Price

async function updateCurrency() {
    try {
        // --- STEP 1: Get User's Currency Code (e.g., "BDT", "EUR") ---
        const ipResponse = await fetch('https://ipapi.co/json/');
        const ipData = await ipResponse.json();
        const userCurrency = ipData.currency;

        // If user is in US or API fails to get currency, stop (prices stay in USD)
        if (!userCurrency || userCurrency === 'USD') return;


        // --- STEP 2: Get LIVE Exchange Rates (Base: USD) ---
        // We use ExchangeRate-API (Free, No Key Required)
        const rateResponse = await fetch('https://open.er-api.com/v6/latest/USD');
        const rateData = await rateResponse.json();
        
        // Get the specific rate for the user (e.g., 122.5 for BDT)
        const liveRate = rateData.rates[userCurrency];

        // If the API doesn't support this currency, stop.
        if (!liveRate) return;


        // --- STEP 3: Define Symbols & Formatting ---
        // The API gives us the number (122), but we still need to tell it 
        // what symbol to use (€, ৳, £) and where to put it.
        const formattingConfig = {
            'EUR': { symbol: '€', position: 'before' },
            'GBP': { symbol: '£', position: 'before' },
            'BDT': { symbol: '৳', position: 'after' },   
            'INR': { symbol: '₹', position: 'before' },
            'CAD': { symbol: 'CA$', position: 'before' },
            'AUD': { symbol: 'AU$', position: 'before' },
            'JPY': { symbol: '¥', position: 'before' },
            'CNY': { symbol: '¥', position: 'before' },
            'RUB': { symbol: '₽', position: 'after' },
            'BRL': { symbol: 'R$', position: 'before' },
        };

        // If we have a custom symbol, use it. Otherwise, use the text code (e.g. "SGD 100")
        const format = formattingConfig[userCurrency] || { symbol: userCurrency + ' ', position: 'before' };


        // --- STEP 4: Update All Prices on Page ---
        document.querySelectorAll('.dynamic-price').forEach(el => {
            // Get the original USD price from the HTML
            const usdAmount = parseFloat(el.getAttribute('data-usd'));

            // Calculate using the LIVE rate
            // We use Math.ceil to round up to the nearest whole number for cleaner pricing
            const convertedAmount = Math.ceil(usdAmount * liveRate);

            // Apply formatting (add commas for thousands, e.g., 12,000)
            const formattedNumber = convertedAmount.toLocaleString();

            if (format.position === 'before') {
                el.textContent = `${format.symbol}${formattedNumber}`;
            } else {
                el.textContent = `${formattedNumber}${format.symbol}`;
            }
        });

    } catch (error) {
        console.error("Currency converter error:", error);
        // If anything breaks, the site simply stays in USD (default).
    }
}

// Run the function
updateCurrency();