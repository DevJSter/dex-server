# Simple AMM (Automated Market Maker) Implementation

A Node.js implementation of an Automated Market Maker (AMM) with constant product formula, similar to Uniswap v1. This implementation demonstrates the core concepts of decentralized exchanges including liquidity pools, price impact, and automated price discovery.

## Features

- Constant Product AMM (x * y = k)
- Real-time price updates based on pool reserves
- Slippage calculation and price impact analysis
- 0.3% trading fee implementation
- Support for ETH/USDC trading pair
- Detailed pool statistics and pricing information

## Technical Details

### Initial Pool Configuration
- ETH Reserve: 500 ETH
- USDC Reserve: 1,000,000 USDC (1000 USDC accounting for 6 decimals)
- Initial K: ETH_reserve * USDC_reserve

### Price Calculation

The AMM uses the constant product formula:
```
x * y = k
```
where:
- x = ETH reserve
- y = USDC reserve
- k = constant product

Spot price is calculated as:
```javascript
price = USDC_reserve / ETH_reserve
```

Effective price including slippage for a trade is calculated using:
```javascript
effectivePrice = outputAmount / inputAmount
```

### Trading Fee
- 0.3% fee on all trades
- Fee is included in the constant product formula calculation

## API Endpoints

### 1. Get ETH Price
```
GET /price/eth
```
Returns:
- Current spot price
- Price impact for different trade sizes
- Pool statistics

Example Response:
```json
{
  "spotPrice": 2000,
  "tradeImpact": [
    {
      "tradeSize": 0.1,
      "effectivePrice": 1995.2,
      "priceImpact": "0.24%"
    },
    {
      "tradeSize": 1,
      "effectivePrice": 1960.5,
      "priceImpact": "1.97%"
    }
  ],
  "poolStats": {
    "ethReserve": 500,
    "usdcReserve": 1000,
    "k": 500000
  }
}
```

### 2. Swap ETH to USDC
```
POST /swap/eth-to-usdc
```
Body:
```json
{
  "ethAmount": 1.0
}
```

### 3. Swap USDC to ETH
```
POST /swap/usdc-to-eth
```
Body:
```json
{
  "usdcAmount": 1000.0
}
```

### 4. Get Pool Statistics
```
GET /pool/stats
```
Returns current pool reserves, constant k, and current ETH price.

## Installation and Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
node index.js
```

The server will start on `http://localhost:3000`

## Testing the API

Here are some curl commands to test the API:

```bash
# Check ETH price
curl http://localhost:3000/price/eth

# Swap 1 ETH for USDC
curl -X POST http://localhost:3000/swap/eth-to-usdc \
  -H "Content-Type: application/json" \
  -d '{"ethAmount": 1}'

# Swap 1000 USDC for ETH
curl -X POST http://localhost:3000/swap/usdc-to-eth \
  -H "Content-Type: application/json" \
  -d '{"usdcAmount": 1000}'
```

## Price Impact and Slippage

Price impact increases with trade size relative to pool reserves. For example:
- Small trades (< 0.1% of pool) : minimal impact
- Medium trades (0.1-1% of pool) : noticeable impact
- Large trades (>1% of pool) : significant impact

The formula for calculating output amount with fee is:
```javascript
amountOut = (amountIn * 0.997 * reserveOut) / (reserveIn + amountIn * 0.997)
```

## Dependencies

- Express.js
- Body-parser (included in Express)

## Safety Features

1. Constant K verification after each trade
2. Input validation for swap amounts
3. Decimal precision handling for USDC (6 decimals)
4. Error handling for invalid inputs and failed trades

## Limitations

1. Single trading pair (ETH/USDC)
2. No persistence (state is lost on server restart) || can be improved by making a db
3. No authentication/authorization
4. No support for limit orders
5. Simplified fee model

## Future Improvements

1. Add multiple trading pairs
2. Implement persistent storage
3. Add authentication and rate limiting
4. Support for limit orders
5. More sophisticated fee models
6. Price oracle integration
7. Multi-hop trades
8. Flash loan protection