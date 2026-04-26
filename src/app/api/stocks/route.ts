import { NextRequest, NextResponse } from "next/server";
import { getStocks, addStock } from "@/lib/db";

export async function GET() {
  try {
    const stocks = await getStocks();
    return NextResponse.json(stocks);
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { symbol, name } = await request.json();
    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      );
    }
    const result = await addStock(symbol, name || symbol);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
