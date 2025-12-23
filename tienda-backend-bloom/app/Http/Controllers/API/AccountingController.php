<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ProductCost;
use App\Models\Expense;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccountingController extends Controller
{
    // =========== PRODUCT COSTS ===========

    // Obtener costos de un producto
    public function getProductCosts($productId)
    {
        $costs = ProductCost::where('product_id', $productId)
            ->orderBy('effective_date', 'desc')
            ->get();

        return response()->json($costs);
    }

    // Crear o actualizar costo de producto
    public function storeProductCost(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'cost_price' => 'required|numeric|min:0',
            'sale_price' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'notes' => 'nullable|string'
        ]);

        $cost = ProductCost::create($validated);

        return response()->json($cost, 201);
    }

    // Actualizar costo existente
    public function updateProductCost(Request $request, ProductCost $productCost)
    {
        $validated = $request->validate([
            'cost_price' => 'sometimes|numeric|min:0',
            'sale_price' => 'sometimes|numeric|min:0',
            'effective_date' => 'sometimes|date',
            'notes' => 'nullable|string'
        ]);

        $productCost->update($validated);

        return response()->json($productCost);
    }

    // Eliminar costo
    public function deleteProductCost(ProductCost $productCost)
    {
        $productCost->delete();
        return response()->json(['message' => 'Costo eliminado correctamente']);
    }

    // =========== EXPENSES ===========

    // Obtener todos los gastos
    public function getExpenses(Request $request)
    {
        $query = Expense::with(['product', 'user']);

        // Filtrar por tipo si se proporciona
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Filtrar por rango de fechas
        if ($request->has('from_date')) {
            $query->where('expense_date', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->where('expense_date', '<=', $request->to_date);
        }

        // Filtrar por producto si se proporciona
        if ($request->has('product_id') && $request->product_id !== 'all') {
            $query->where('product_id', $request->product_id);
        }

        $expenses = $query->orderBy('expense_date', 'desc')->get();

        return response()->json($expenses);
    }

    // Crear gasto
    public function storeExpense(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:shipping,packaging,advertising,utilities,rent,salaries,other',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'required|date',
            'product_id' => 'nullable|exists:products,id',
            'notes' => 'nullable|string'
        ]);

        $validated['user_id'] = auth()->id();

        $expense = Expense::create($validated);

        return response()->json($expense->load(['product', 'user']), 201);
    }

    // Actualizar gasto
    public function updateExpense(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'type' => 'sometimes|in:shipping,packaging,advertising,utilities,rent,salaries,other',
            'description' => 'sometimes|string|max:255',
            'amount' => 'sometimes|numeric|min:0',
            'expense_date' => 'sometimes|date',
            'product_id' => 'nullable|exists:products,id',
            'notes' => 'nullable|string'
        ]);

        $expense->update($validated);

        return response()->json($expense->load(['product', 'user']));
    }

    // Eliminar gasto
    public function deleteExpense(Expense $expense)
    {
        $expense->delete();
        return response()->json(['message' => 'Gasto eliminado correctamente']);
    }

    // =========== DASHBOARD / METRICS ===========

    // Dashboard financiero con métricas clave
    public function dashboard(Request $request)
    {
        // Rango de fechas (por defecto, último mes)
        $fromDate = $request->from_date ?? now()->subMonth()->startOfDay();
        $toDate = $request->to_date ?? now()->endOfDay();

        // Total de gastos por tipo
        $expensesByType = Expense::whereBetween('expense_date', [$fromDate, $toDate])
            ->select('type', DB::raw('SUM(amount) as total'))
            ->groupBy('type')
            ->get()
            ->pluck('total', 'type');

        // Total de gastos general
        $totalExpenses = Expense::whereBetween('expense_date', [$fromDate, $toDate])
            ->sum('amount');

        // Ventas estimadas basadas en movimientos de stock (decrementos)
        $salesData = StockMovement::where('type', 'decrease')
            ->where('reason', 'sale')
            ->whereBetween('created_at', [$fromDate, $toDate])
            ->with('product')
            ->get();

        $totalSales = 0;
        $totalCost = 0;
        $productSales = [];

        foreach ($salesData as $sale) {
            if ($sale->product) {
                $quantity = $sale->quantity;
                $salePrice = $sale->product->price;

                // Obtener el costo del producto en esa fecha
                $cost = ProductCost::where('product_id', $sale->product_id)
                    ->where('effective_date', '<=', $sale->created_at)
                    ->orderBy('effective_date', 'desc')
                    ->first();

                $costPrice = $cost ? $cost->cost_price : 0;

                $saleTotal = $quantity * $salePrice;
                $costTotal = $quantity * $costPrice;

                $totalSales += $saleTotal;
                $totalCost += $costTotal;

                // Agrupar por producto
                if (!isset($productSales[$sale->product_id])) {
                    $productSales[$sale->product_id] = [
                        'product_name' => $sale->product->name,
                        'quantity_sold' => 0,
                        'sales_total' => 0,
                        'cost_total' => 0,
                        'profit' => 0
                    ];
                }

                $productSales[$sale->product_id]['quantity_sold'] += $quantity;
                $productSales[$sale->product_id]['sales_total'] += $saleTotal;
                $productSales[$sale->product_id]['cost_total'] += $costTotal;
                $productSales[$sale->product_id]['profit'] =
                    $productSales[$sale->product_id]['sales_total'] -
                    $productSales[$sale->product_id]['cost_total'];
            }
        }

        // Ganancia bruta (ventas - costo de productos)
        $grossProfit = $totalSales - $totalCost;

        // Ganancia neta (ganancia bruta - gastos operativos)
        $netProfit = $grossProfit - $totalExpenses;

        // Margen de ganancia neto
        $netProfitMargin = $totalSales > 0 ? ($netProfit / $totalSales) * 100 : 0;

        return response()->json([
            'period' => [
                'from' => $fromDate,
                'to' => $toDate
            ],
            'summary' => [
                'total_sales' => round($totalSales, 2),
                'total_cost' => round($totalCost, 2),
                'gross_profit' => round($grossProfit, 2),
                'total_expenses' => round($totalExpenses, 2),
                'net_profit' => round($netProfit, 2),
                'net_profit_margin' => round($netProfitMargin, 2)
            ],
            'expenses_by_type' => $expensesByType,
            'product_sales' => array_values($productSales)
        ]);
    }

    // Obtener productos sin costos registrados
    public function getProductsWithoutCosts()
    {
        $products = Product::whereDoesntHave('costs')->get();
        return response()->json($products);
    }
}
