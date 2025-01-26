const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());

// Initial liquidity pool state
let liquidityPool = {
  ETH: 500, // Initial ETH amount
  USDC: 1000000, // Initial USDC amount (1000 * 1000 because USDC has 6 decimals)
};

// Constant product
const K = liquidityPool.ETH * liquidityPool.USDC;

// Helper function to calculate token price based on current pool reserves
function getPrice(tokenAmountIn, reserveIn, reserveOut) {
  const numerator = reserveOut;
  const denominator = reserveIn + tokenAmountIn;
  return numerator / denominator;
}

// Helper function to calculate output amount based on constant product formula
function getOutputAmount(amountIn, reserveIn, reserveOut) {
  const amountInWithFee = amountIn * 997; // 0.3% fee
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 1000 + amountInWithFee;
  return numerator / denominator;
}

// Get current ETH price in USDC with detailed pricing info
app.get("/price/eth", (req, res) => {
  // Calculate spot price (price for infinitesimally small trade)
  const spotPrice = liquidityPool.USDC / liquidityPool.ETH / 1000000; // Convert to USDC decimals

  // Calculate effective prices for different trade sizes
  const tradeSizes = [0.1, 0.5, 1, 5, 10]; // ETH amounts
  const priceImpact = tradeSizes.map((size) => {
    const usdcOutput = getOutputAmount(
      size,
      liquidityPool.ETH,
      liquidityPool.USDC
    );
    const effectivePrice = usdcOutput / (size * 1000000); // Convert to USDC decimals
    const priceImpact = ((spotPrice - effectivePrice) / spotPrice) * 100;

    return {
      tradeSize: size,
      effectivePrice: effectivePrice,
      priceImpact: priceImpact.toFixed(2) + "%",
    };
  });

  res.json({
    spotPrice: spotPrice,
    tradeImpact: priceImpact,
    poolStats: {
      ethReserve: liquidityPool.ETH,
      usdcReserve: liquidityPool.USDC / 1000000,
      k: K,
    },
  });
});

// Swap ETH for USDC
app.post("/swap/eth-to-usdc", (req, res) => {
  const { ethAmount } = req.body;

  if (!ethAmount || ethAmount <= 0) {
    return res.status(400).json({ error: "Invalid ETH amount" });
  }

  // Calculate USDC output amount
  const usdcOutput = getOutputAmount(
    ethAmount,
    liquidityPool.ETH,
    liquidityPool.USDC
  );

  // Update liquidity pool
  liquidityPool.ETH += ethAmount;
  liquidityPool.USDC -= usdcOutput;

  // Verify K remains constant (accounting for small rounding errors)
  const newK = liquidityPool.ETH * liquidityPool.USDC;
  if (Math.abs(newK - K) / K > 0.0001) {
    return res.status(500).json({ error: "Invariant check failed" });
  }

  res.json({
    received: {
      token: "USDC",
      amount: usdcOutput / 1000000, // Convert to human-readable USDC
    },
    paid: {
      token: "ETH",
      amount: ethAmount,
    },
    newPoolStats: {
      ethReserve: liquidityPool.ETH,
      usdcReserve: liquidityPool.USDC / 1000000,
      k: newK,
    },
  });
});

// Swap USDC for ETH
app.post("/swap/usdc-to-eth", (req, res) => {
  const { usdcAmount } = req.body;

  if (!usdcAmount || usdcAmount <= 0) {
    return res.status(400).json({ error: "Invalid USDC amount" });
  }

  // Convert USDC amount to internal representation (6 decimals)
  const usdcAmountIn = usdcAmount * 1000000;

  // Calculate ETH output amount
  const ethOutput = getOutputAmount(
    usdcAmountIn,
    liquidityPool.USDC,
    liquidityPool.ETH
  );

  // Update liquidity pool
  liquidityPool.USDC += usdcAmountIn;
  liquidityPool.ETH -= ethOutput;

  // Verify K remains constant
  const newK = liquidityPool.ETH * liquidityPool.USDC;
  if (Math.abs(newK - K) / K > 0.0001) {
    return res.status(500).json({ error: "Invariant check failed" });
  }

  res.json({
    received: {
      token: "ETH",
      amount: ethOutput,
    },
    paid: {
      token: "USDC",
      amount: usdcAmount,
    },
    newPoolStats: {
      ethReserve: liquidityPool.ETH,
      usdcReserve: liquidityPool.USDC / 1000000,
      k: newK,
    },
  });
});

// Get current pool statistics
app.get("/pool/stats", (req, res) => {
  res.json({
    ethReserve: liquidityPool.ETH,
    usdcReserve: liquidityPool.USDC / 1000000,
    k: K,
    currentEthPrice: liquidityPool.USDC / liquidityPool.ETH / 1000000,
  });
});

app.listen(port, () => {
  console.log(`AMM service running at http://localhost:${port}`);
  console.log("Initial pool state:", {
    ETH: liquidityPool.ETH,
    USDC: liquidityPool.USDC / 1000000,
    K: K,
  });
});
