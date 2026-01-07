/* --- LIVE CURRENCY CONVERTER (VPN-Friendly Version) --- */

async function updateCurrency() {
    try {
        console.log("Creating currency request...");

        // 1. Get User Location Data (Using ipwhois.app which is more VPN friendly)
        const response = await fetch('https://ipwhois.app/json/');
        const data = await response.json();
        
        console.log("Detected Country:", data.country);
        console.log("Detected Currency:", data.currency);

        const userCurrency = data.currency; // e.g., "BDT", "EUR", "USD"

        // If something went wrong or user is in US, stop here.
        if (!userCurrency || userCurrency === 'USD') {
            console.log("User is in US or API failed. Keeping USD.");
            return;
        }

        // 2. Get LIVE Exchange Rates (Base: USD)
        const rateResponse = await fetch('https://open.er-api.com/v6/latest/USD');
        const rateData = await rateResponse.json();
        
        const liveRate = rateData.rates[userCurrency];
        console.log("Exchange Rate for " + userCurrency + ": " + liveRate);

        if (!liveRate) return;

        // 3. Define Symbols & Formatting
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

        const format = formattingConfig[userCurrency] || { symbol: userCurrency + ' ', position: 'before' };

        // 4. Update Prices
        document.querySelectorAll('.dynamic-price').forEach(el => {
            const usdAmount = parseFloat(el.getAttribute('data-usd'));
            
            // Round up for cleaner prices (e.g. 122.5 -> 123)
            const convertedAmount = Math.ceil(usdAmount * liveRate);
            const formattedNumber = convertedAmount.toLocaleString();

            if (format.position === 'before') {
                el.textContent = `${format.symbol}${formattedNumber}`;
            } else {
                el.textContent = `${formattedNumber}${format.symbol}`;
            }
        });
        
        console.log("Prices updated successfully.");

    } catch (error) {
        console.error("Currency converter error:", error);
    }
}

// Run immediately
updateCurrency();
