export const onRequestGet: PagesFunction = async ({ params }) => {
  const ticker = (params.ticker as string).toUpperCase();

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    if (!res.ok) {
      return Response.json(
        { error: `Yahoo Finance returned ${res.status}` },
        { status: res.status }
      );
    }

    const json: Record<string, unknown> = await res.json();
    const result = (json.chart as Record<string, unknown[]>)?.result?.[0] as
      | Record<string, Record<string, number>>
      | undefined;
    const meta = result?.meta;

    if (!meta || !meta.regularMarketPrice) {
      return Response.json({ error: "No price data" }, { status: 404 });
    }

    const price = meta.regularMarketPrice;
    const prevClose =
      meta.chartPreviousClose || meta.previousClose || price;

    return Response.json(
      {
        price,
        change: price - prevClose,
        changePercent:
          prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0,
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300",
        },
      }
    );
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Fetch failed" },
      { status: 500 }
    );
  }
};
