import { NextRequest, NextResponse } from "next/server";
import { deleteStock } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const result = await deleteStock(symbol);
    if (result.length === 0) {
      return NextResponse.json(
        { error: "Stock not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
