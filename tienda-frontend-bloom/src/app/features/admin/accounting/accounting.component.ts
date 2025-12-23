import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountingService, ProductCost, Expense, AccountingDashboard } from '../../../core/services/accounting.service';
import { ProductService, Product } from '../../../core/services/product.service';

@Component({
  selector: 'app-accounting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accounting.component.html',
  styleUrls: ['./accounting.component.scss']
})
export class AccountingComponent implements OnInit {
  // Tabs
  activeTab: 'dashboard' | 'costs' | 'expenses' = 'dashboard';

  // Dashboard
  dashboard: AccountingDashboard | null = null;
  dashboardLoading = false;
  fromDate: string = '';
  toDate: string = '';

  // Product Costs
  products: Product[] = [];
  selectedProduct: Product | null = null;
  productCosts: ProductCost[] = [];
  costsLoading = false;
  showCostForm = false;
  costForm: Partial<ProductCost> = {
    cost_price: 0,
    sale_price: 0,
    effective_date: new Date().toISOString().split('T')[0]
  };

  // Expenses
  expenses: Expense[] = [];
  expensesLoading = false;
  showExpenseForm = false;
  expenseForm: Partial<Expense> = {
    type: 'other',
    description: '',
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0]
  };

  expenseTypes = [
    { value: 'shipping', label: 'Envío' },
    { value: 'packaging', label: 'Embalaje' },
    { value: 'advertising', label: 'Publicidad' },
    { value: 'utilities', label: 'Servicios' },
    { value: 'rent', label: 'Alquiler' },
    { value: 'salaries', label: 'Salarios' },
    { value: 'other', label: 'Otro' }
  ];

  // Messages
  errorMessage = '';
  successMessage = '';

  // Make Object available to template
  Object = Object;

  constructor(
    private accountingService: AccountingService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    // Establecer fechas por defecto (último mes)
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    this.fromDate = lastMonth.toISOString().split('T')[0];
    this.toDate = today.toISOString().split('T')[0];

    this.loadDashboard();
    this.loadProducts();
  }

  // =========== DASHBOARD ===========

  loadDashboard(): void {
    this.dashboardLoading = true;
    this.accountingService.getDashboard(this.fromDate, this.toDate).subscribe({
      next: (data) => {
        this.dashboard = data;
        this.dashboardLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.errorMessage = 'Error al cargar el dashboard de contabilidad';
        this.dashboardLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  refreshDashboard(): void {
    this.loadDashboard();
  }

  getExpenseTypeLabel(type: string): string {
    const found = this.expenseTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  // =========== PRODUCT COSTS ===========

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.errorMessage = 'Error al cargar los productos';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  selectProduct(product: Product): void {
    this.selectedProduct = product;
    this.costForm.product_id = product.id;
    this.costForm.sale_price = product.price;
    this.loadProductCosts(product.id);
  }

  loadProductCosts(productId: number): void {
    this.costsLoading = true;
    this.accountingService.getProductCosts(productId).subscribe({
      next: (costs) => {
        this.productCosts = costs;
        this.costsLoading = false;
      },
      error: (error) => {
        console.error('Error loading product costs:', error);
        this.errorMessage = 'Error al cargar los costos del producto';
        this.costsLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  openCostForm(): void {
    this.showCostForm = true;
    this.costForm = {
      product_id: this.selectedProduct?.id,
      cost_price: 0,
      sale_price: this.selectedProduct?.price || 0,
      effective_date: new Date().toISOString().split('T')[0]
    };
  }

  saveCost(): void {
    if (!this.costForm.product_id || !this.costForm.cost_price || !this.costForm.sale_price) {
      this.errorMessage = 'Por favor completa todos los campos obligatorios';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.accountingService.createProductCost(this.costForm).subscribe({
      next: () => {
        this.successMessage = 'Costo guardado correctamente';
        this.showCostForm = false;
        if (this.selectedProduct) {
          this.loadProductCosts(this.selectedProduct.id);
        }
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error saving cost:', error);
        this.errorMessage = 'Error al guardar el costo';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  deleteCost(cost: ProductCost): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro de costo?')) {
      return;
    }

    this.accountingService.deleteProductCost(cost.id).subscribe({
      next: () => {
        this.successMessage = 'Costo eliminado correctamente';
        if (this.selectedProduct) {
          this.loadProductCosts(this.selectedProduct.id);
        }
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error deleting cost:', error);
        this.errorMessage = 'Error al eliminar el costo';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  // =========== EXPENSES ===========

  loadExpenses(): void {
    this.expensesLoading = true;
    this.accountingService.getExpenses({
      from_date: this.fromDate,
      to_date: this.toDate
    }).subscribe({
      next: (expenses) => {
        this.expenses = expenses;
        this.expensesLoading = false;
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
        this.errorMessage = 'Error al cargar los gastos';
        this.expensesLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  openExpenseForm(): void {
    this.showExpenseForm = true;
    this.expenseForm = {
      type: 'other',
      description: '',
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0]
    };
  }

  saveExpense(): void {
    if (!this.expenseForm.type || !this.expenseForm.description || !this.expenseForm.amount) {
      this.errorMessage = 'Por favor completa todos los campos obligatorios';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.accountingService.createExpense(this.expenseForm).subscribe({
      next: () => {
        this.successMessage = 'Gasto guardado correctamente';
        this.showExpenseForm = false;
        this.loadExpenses();
        this.loadDashboard();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error saving expense:', error);
        this.errorMessage = 'Error al guardar el gasto';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  deleteExpense(expense: Expense): void {
    if (!confirm(`¿Estás seguro de que deseas eliminar el gasto "${expense.description}"?`)) {
      return;
    }

    this.accountingService.deleteExpense(expense.id).subscribe({
      next: () => {
        this.successMessage = 'Gasto eliminado correctamente';
        this.loadExpenses();
        this.loadDashboard();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error deleting expense:', error);
        this.errorMessage = 'Error al eliminar el gasto';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  // Tab switching
  switchTab(tab: 'dashboard' | 'costs' | 'expenses'): void {
    this.activeTab = tab;

    if (tab === 'expenses' && this.expenses.length === 0) {
      this.loadExpenses();
    }
  }
}
