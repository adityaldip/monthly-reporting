export type Language = 'id' | 'en';

export interface Translations {
  // Common
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    close: string;
    search: string;
    filter: string;
    all: string;
    yes: string;
    no: string;
    confirm: string;
    success: string;
    error: string;
    warning: string;
  };
  
  // Navigation
  nav: {
    dashboard: string;
    transactions: string;
    reports: string;
    goals: string;
    profile: string;
    settings: string;
    logout: string;
    login: string;
    register: string;
  };

  // Dashboard
  dashboard: {
    title: string;
    subtitle: string;
    totalIncome: string;
    totalOutcome: string;
    balance: string;
    quickActions: string;
    addIncome: string;
    addOutcome: string;
    recentTransactions: string;
    seeAll: string;
    displayIn: string;
    noTransactions: string;
    date: string;
    category: string;
    description: string;
    amount: string;
    amountOriginal: string;
    amountConverted: string;
    warningNoCurrency: string;
    warningNoCategory: string;
    warningNoCurrencyAndCategory: string;
    warningAddInSettings: string;
    warningToStartTransaction: string;
    thisMonthIncome: string;
    outcomeToday: string;
    outcomeThisWeek: string;
    outcomeThisMonth: string;
    today: string;
    additionalStats: string;
    accountBalances: string;
  };

  // Transactions
  transactions: {
    title: string;
    subtitle: string;
    addIncome: string;
    addOutcome: string;
    income: string;
    outcome: string;
    noTransactions: string;
    date: string;
    category: string;
    description: string;
    amount: string;
    amountOriginal: string;
    amountConverted: string;
    currency: string;
    search: string;
    searchPlaceholder: string;
    filter: string;
    sortBy: string;
    sortDate: string;
    sortAmount: string;
    sortCategory: string;
    sortAsc: string;
    sortDesc: string;
    dateRange: string;
    dateFrom: string;
    dateTo: string;
    amountRange: string;
    amountMin: string;
    amountMax: string;
    selectCategory: string;
    selectCurrency: string;
    actions: string;
    edit: string;
    delete: string;
    bulkDelete: string;
    selectAll: string;
    selected: string;
    confirmDelete: string;
    confirmBulkDelete: string;
    deleteSuccess: string;
    editTransaction: string;
    recurringTransactions: string;
    addRecurring: string;
    frequency: string;
    weekly: string;
    monthly: string;
    nextDate: string;
    endDate: string;
    active: string;
    inactive: string;
  };

  // Transaction Modal
  transactionModal: {
    addIncome: string;
    addOutcome: string;
    transactionType: string;
    income: string;
    outcome: string;
    category: string;
    categoryRequired: string;
    amount: string;
    amountRequired: string;
    currency: string;
    currencyRequired: string;
    date: string;
    dateRequired: string;
    description: string;
    descriptionOptional: string;
    descriptionPlaceholder: string;
    saving: string;
    save: string;
    cancel: string;
    mustLogin: string;
    success: string;
    error: string;
  };

  // Settings
  settings: {
    title: string;
    subtitle: string;
    currencies: string;
    categories: string;
    accounts: string;
    code: string;
    name: string;
    symbol: string;
    exchangeRate: string;
    isDefault: string;
    default: string;
    type: string;
    icon: string;
    color: string;
    actions: string;
    addCurrency: string;
    editCurrency: string;
    deleteCurrency: string;
    addCategory: string;
    editCategory: string;
    deleteCategory: string;
    addAccount: string;
    editAccount: string;
    deleteAccount: string;
    updateRates: string;
    updatingRates: string;
    confirmDelete: string;
    confirmDeleteCurrency: string;
    confirmDeleteCategory: string;
    confirmDeleteAccount: string;
    noCurrency: string;
    noCategory: string;
    noAccount: string;
    base: string;
    defaultCurrencyInfo: string;
    defaultCurrencyDescription: string;
    setAsDefault: string;
    setAsDefaultCategory: string;
    setAsDefaultAccount: string;
    codeCannotChange: string;
    selectOneOrMoreMonths: string;
    selectAll: string;
    removeAll: string;
    selectAtLeastOneMonth: string;
    accountType: string;
    accountNumber: string;
    accountDescription: string;
    accountTypeCash: string;
    accountTypeBank: string;
    accountTypeCreditCard: string;
    accountTypeInvestment: string;
    accountTypeOther: string;
    accountHasTransactions: string;
  };

  // Profile
  profile: {
    title: string;
    subtitle: string;
    personalInfo: string;
    email: string;
    fullName: string;
    phone: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    update: string;
    updateSuccess: string;
    updateError: string;
  };

  // Auth
  auth: {
    login: string;
    register: string;
    email: string;
    password: string;
    fullName: string;
    phone: string;
    loginSuccess: string;
    loginError: string;
    registerSuccess: string;
    registerError: string;
    logout: string;
  };

  // Reports
  reports: {
    title: string;
    subtitle: string;
    selectYear: string;
    selectMonth: string;
    allMonths: string;
    summary: string;
    monthlyTrends: string;
    categoryBreakdown: string;
    insights: string;
    totalIncome: string;
    totalOutcome: string;
    balance: string;
    totalTransactions: string;
    avgTransaction: string;
    topCategory: string;
    avgCategorySpending: string;
    incomeGrowth: string;
    outcomeGrowth: string;
    comparedToPrevious: string;
    noData: string;
    loading: string;
  };

  // Budget
  budget: {
    title: string;
    subtitle: string;
    addBudget: string;
    editBudget: string;
    deleteBudget: string;
    category: string;
    year: string;
    month: string;
    amount: string;
    currency: string;
    alertThreshold: string;
    alertThresholdDesc: string;
    spent: string;
    remaining: string;
    budget: string;
    actual: string;
    exceeded: string;
    nearLimit: string;
    noBudgets: string;
    selectCategory: string;
    selectYear: string;
    selectMonth: string;
    confirmDelete: string;
    confirmDeleteBudget: string;
    budgetVsActual: string;
    progress: string;
  };

  // Goals
  goals: {
    title: string;
    subtitle: string;
    addGoal: string;
    editGoal: string;
    deleteGoal: string;
    goalTitle: string;
    description: string;
    targetAmount: string;
    currentAmount: string;
    currency: string;
    deadline: string;
    status: string;
    progress: string;
    daysRemaining: string;
    daysOverdue: string;
    noDeadline: string;
    active: string;
    completed: string;
    cancelled: string;
    noGoals: string;
    filterAll: string;
    filterActive: string;
    filterCompleted: string;
    filterCancelled: string;
    confirmDelete: string;
    goalCreated: string;
    goalUpdated: string;
    goalDeleted: string;
    updateProgress: string;
    markCompleted: string;
    markCancelled: string;
    reactivate: string;
    overdue: string;
  };
}

export const translations: Record<Language, Translations> = {
  id: {
    common: {
      loading: 'Memuat...',
      save: 'Simpan',
      cancel: 'Batal',
      delete: 'Hapus',
      edit: 'Edit',
      add: 'Tambah',
      close: 'Tutup',
      search: 'Cari',
      filter: 'Filter',
      all: 'Semua',
      yes: 'Ya',
      no: 'Tidak',
      confirm: 'Konfirmasi',
      success: 'Berhasil',
      error: 'Error',
      warning: 'Peringatan',
    },
    nav: {
      dashboard: 'Dashboard',
      transactions: 'Transaksi',
      reports: 'Laporan',
      goals: 'Target Tabungan',
      profile: 'Profil',
      settings: 'Pengaturan',
      logout: 'Keluar',
      login: 'Masuk',
      register: 'Daftar',
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Ringkasan keuangan bulanan Anda',
      totalIncome: 'Total Pemasukan',
      totalOutcome: 'Total Pengeluaran',
      balance: 'Saldo',
      quickActions: 'Aksi Cepat',
      addIncome: 'Tambah Pemasukan',
      addOutcome: 'Tambah Pengeluaran',
      recentTransactions: 'Transaksi Terbaru',
      seeAll: 'Lihat Semua',
      displayIn: 'Tampilkan dalam',
      noTransactions: 'Belum ada transaksi. Mulai dengan menambahkan pemasukan atau pengeluaran.',
      date: 'Tanggal',
      category: 'Kategori',
      description: 'Deskripsi',
      warningNoCurrency: 'Anda belum memiliki currency.',
      warningNoCategory: 'Anda belum memiliki kategori.',
      warningNoCurrencyAndCategory: 'Anda belum memiliki currency dan kategori.',
      warningAddInSettings: 'Silakan tambahkan di',
      warningToStartTransaction: 'untuk mulai menambah transaksi.',
      amount: 'Jumlah',
      amountOriginal: 'Jumlah (Original)',
      amountConverted: 'Jumlah',
      thisMonthIncome: 'Pemasukan Bulan Ini',
      outcomeToday: 'Pengeluaran Hari Ini',
      outcomeThisWeek: 'Pengeluaran Minggu Ini',
      outcomeThisMonth: 'Pengeluaran Bulan Ini',
      today: 'Hari Ini',
      additionalStats: 'Statistik Tambahan',
      accountBalances: 'Saldo Akun',
    },
    transactions: {
      title: 'Transaksi',
      subtitle: 'Kelola pemasukan dan pengeluaran Anda',
      addIncome: '+ Pemasukan',
      addOutcome: '+ Pengeluaran',
      income: 'Pemasukan',
      outcome: 'Pengeluaran',
      noTransactions: 'Belum ada transaksi. Mulai dengan menambahkan pemasukan atau pengeluaran.',
      date: 'Tanggal',
      category: 'Kategori',
      description: 'Deskripsi',
      amount: 'Jumlah',
      amountOriginal: 'Jumlah (Original)',
      amountConverted: 'Jumlah',
      currency: 'Currency',
      search: 'Cari',
      searchPlaceholder: 'Cari transaksi...',
      filter: 'Filter',
      sortBy: 'Urutkan',
      sortDate: 'Tanggal',
      sortAmount: 'Jumlah',
      sortCategory: 'Kategori',
      sortAsc: 'Naik',
      sortDesc: 'Turun',
      dateRange: 'Rentang Tanggal',
      dateFrom: 'Dari',
      dateTo: 'Sampai',
      amountRange: 'Rentang Jumlah',
      amountMin: 'Min',
      amountMax: 'Max',
      selectCategory: 'Pilih Kategori',
      selectCurrency: 'Pilih Currency',
      actions: 'Aksi',
      edit: 'Edit',
      delete: 'Hapus',
      bulkDelete: 'Hapus Terpilih',
      selectAll: 'Pilih Semua',
      selected: 'terpilih',
      confirmDelete: 'Apakah Anda yakin ingin menghapus transaksi ini?',
      confirmBulkDelete: 'Apakah Anda yakin ingin menghapus {count} transaksi yang dipilih?',
      deleteSuccess: 'Transaksi berhasil dihapus',
      editTransaction: 'Edit Transaksi',
      recurringTransactions: 'Transaksi Berulang',
      addRecurring: 'Tambah Transaksi Berulang',
      frequency: 'Frekuensi',
      weekly: 'Mingguan',
      monthly: 'Bulanan',
      nextDate: 'Tanggal Berikutnya',
      endDate: 'Tanggal Berakhir',
      active: 'Aktif',
      inactive: 'Tidak Aktif',
    },
    transactionModal: {
      addIncome: 'Tambah Pemasukan',
      addOutcome: 'Tambah Pengeluaran',
      transactionType: 'Tipe Transaksi',
      income: 'Pemasukan',
      outcome: 'Pengeluaran',
      category: 'Kategori',
      categoryRequired: 'Kategori wajib diisi',
      amount: 'Jumlah',
      amountRequired: 'Jumlah wajib diisi',
      currency: 'Mata Uang',
      currencyRequired: 'Currency wajib diisi',
      date: 'Tanggal',
      dateRequired: 'Tanggal wajib diisi',
      description: 'Deskripsi',
      descriptionOptional: 'Deskripsi (Opsional)',
      descriptionPlaceholder: 'Tambahkan catatan atau deskripsi...',
      saving: 'Menyimpan...',
      save: 'Simpan',
      cancel: 'Batal',
      mustLogin: 'Anda harus login terlebih dahulu',
      success: 'Transaksi berhasil ditambahkan',
      error: 'Gagal menambahkan transaksi',
    },
    settings: {
      title: 'Pengaturan',
      subtitle: 'Kelola currency dan category Anda',
      currencies: 'Currencies',
      categories: 'Categories',
      accounts: 'Akun',
      code: 'Code',
      name: 'Name',
      symbol: 'Symbol',
      exchangeRate: 'Exchange Rate',
      isDefault: 'Default',
      default: 'Default',
      type: 'Type',
      icon: 'Icon',
      color: 'Color',
      actions: 'Actions',
      addCurrency: 'Tambah Currency',
      editCurrency: 'Edit Currency',
      deleteCurrency: 'Hapus',
      addCategory: 'Tambah Category',
      editCategory: 'Edit Category',
      deleteCategory: 'Hapus',
      addAccount: 'Tambah Akun',
      editAccount: 'Edit Akun',
      deleteAccount: 'Hapus',
      updateRates: '🔄 Update Exchange Rates',
      updatingRates: 'Memperbarui...',
      confirmDelete: 'Apakah Anda yakin ingin menghapus?',
      confirmDeleteCurrency: 'Apakah Anda yakin ingin menghapus currency ini?',
      confirmDeleteCategory: 'Apakah Anda yakin ingin menghapus category ini?',
      confirmDeleteAccount: 'Apakah Anda yakin ingin menghapus akun ini?',
      noCurrency: 'Belum ada currency. Tambahkan currency pertama Anda.',
      noCategory: 'Belum ada category. Tambahkan category pertama Anda.',
      noAccount: 'Belum ada akun. Tambahkan akun pertama Anda.',
      base: 'Base',
      defaultCurrencyInfo: 'Info: Default Currency',
      defaultCurrencyDescription: 'Anda harus mengatur satu currency sebagai default (base currency). Exchange rate untuk currency lain akan dikonversi relatif terhadap base currency ini. Base currency memiliki exchange rate 1.0.',
      setAsDefault: 'Set as default currency',
      setAsDefaultCategory: 'Set as default category',
      setAsDefaultAccount: 'Set sebagai akun default',
      codeCannotChange: 'Code tidak dapat diubah saat edit',
      selectOneOrMoreMonths: '(Pilih satu atau lebih bulan)',
      selectAll: 'Pilih Semua',
      removeAll: 'Hapus Semua',
      selectAtLeastOneMonth: 'Pilih minimal satu bulan',
      accountType: 'Tipe Akun',
      accountNumber: 'Nomor Akun',
      accountDescription: 'Deskripsi',
      accountTypeCash: 'Tunai',
      accountTypeBank: 'Bank',
      accountTypeCreditCard: 'Kartu Kredit',
      accountTypeInvestment: 'Investasi',
      accountTypeOther: 'Lainnya',
      accountHasTransactions: 'Account tidak dapat dihapus karena masih memiliki transaksi',
    },
    profile: {
      title: 'Profil',
      subtitle: 'Kelola informasi profil Anda',
      personalInfo: 'Informasi Pribadi',
      email: 'Email',
      fullName: 'Nama Lengkap',
      phone: 'Telepon',
      changePassword: 'Ubah Password',
      currentPassword: 'Password Saat Ini',
      newPassword: 'Password Baru',
      confirmPassword: 'Konfirmasi Password',
      update: 'Update',
      updateSuccess: 'Profil berhasil diupdate',
      updateError: 'Gagal mengupdate profil',
    },
    auth: {
      login: 'Masuk',
      register: 'Daftar',
      email: 'Email',
      password: 'Password',
      fullName: 'Nama Lengkap',
      phone: 'Telepon',
      loginSuccess: 'Login berhasil',
      loginError: 'Login gagal',
      registerSuccess: 'Registrasi berhasil',
      registerError: 'Registrasi gagal',
      logout: 'Keluar',
    },
    budget: {
      title: 'Budget',
      subtitle: 'Kelola budget per kategori',
      addBudget: 'Tambah Budget',
      editBudget: 'Edit Budget',
      deleteBudget: 'Hapus Budget',
      category: 'Kategori',
      year: 'Tahun',
      month: 'Bulan',
      amount: 'Jumlah',
      currency: 'Mata Uang',
      alertThreshold: 'Threshold Alert (%)',
      alertThresholdDesc: 'Notifikasi akan muncul saat pengeluaran mencapai threshold ini',
      spent: 'Terpakai',
      remaining: 'Tersisa',
      budget: 'Budget',
      actual: 'Aktual',
      exceeded: 'Melebihi Budget',
      nearLimit: 'Mendekati Limit',
      noBudgets: 'Belum ada budget. Tambahkan budget untuk kategori outcome.',
      selectCategory: 'Pilih Kategori',
      selectYear: 'Pilih Tahun',
      selectMonth: 'Pilih Bulan',
      confirmDelete: 'Apakah Anda yakin ingin menghapus budget ini?',
      confirmDeleteBudget: 'Apakah Anda yakin ingin menghapus budget ini?',
      budgetVsActual: 'Budget vs Aktual',
      progress: 'Progress',
    },
    goals: {
      title: 'Target Tabungan',
      subtitle: 'Kelola target tabungan dan lacak progres Anda',
      addGoal: 'Tambah Target',
      editGoal: 'Edit Target',
      deleteGoal: 'Hapus Target',
      goalTitle: 'Judul Target',
      description: 'Deskripsi',
      targetAmount: 'Jumlah Target',
      currentAmount: 'Jumlah Saat Ini',
      currency: 'Mata Uang',
      deadline: 'Deadline',
      status: 'Status',
      progress: 'Progres',
      daysRemaining: 'Hari Tersisa',
      daysOverdue: 'Hari Terlambat',
      noDeadline: 'Tidak ada deadline',
      active: 'Aktif',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
      noGoals: 'Belum ada target. Tambahkan target tabungan untuk mulai melacak progres Anda.',
      filterAll: 'Semua',
      filterActive: 'Aktif',
      filterCompleted: 'Selesai',
      filterCancelled: 'Dibatalkan',
      confirmDelete: 'Apakah Anda yakin ingin menghapus target ini?',
      goalCreated: 'Target berhasil dibuat',
      goalUpdated: 'Target berhasil diperbarui',
      goalDeleted: 'Target berhasil dihapus',
      updateProgress: 'Perbarui Progres',
      markCompleted: 'Tandai Selesai',
      markCancelled: 'Tandai Dibatalkan',
      reactivate: 'Aktifkan Kembali',
      overdue: 'Terlambat',
    },
    reports: {
      title: 'Laporan',
      subtitle: 'Analisis keuangan bulanan Anda',
      selectYear: 'Pilih Tahun',
      selectMonth: 'Pilih Bulan',
      allMonths: 'Semua Bulan',
      summary: 'Ringkasan',
      monthlyTrends: 'Tren Bulanan',
      categoryBreakdown: 'Pengeluaran per Kategori',
      insights: 'Insight',
      totalIncome: 'Total Pemasukan',
      totalOutcome: 'Total Pengeluaran',
      balance: 'Saldo',
      totalTransactions: 'Total Transaksi',
      avgTransaction: 'Rata-rata Transaksi',
      topCategory: 'Kategori Teratas',
      avgCategorySpending: 'Rata-rata per Kategori',
      incomeGrowth: 'Pertumbuhan Pemasukan',
      outcomeGrowth: 'Pertumbuhan Pengeluaran',
      comparedToPrevious: 'Dibandingkan periode sebelumnya',
      noData: 'Tidak ada data untuk periode ini',
      loading: 'Memuat data...',
    },
  },
  en: {
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      close: 'Close',
      search: 'Search',
      filter: 'Filter',
      all: 'All',
      yes: 'Yes',
      no: 'No',
      confirm: 'Confirm',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
    },
    nav: {
      dashboard: 'Dashboard',
      transactions: 'Transactions',
      reports: 'Reports',
      goals: 'Savings Goals',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Logout',
      login: 'Login',
      register: 'Register',
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Your monthly financial summary',
      totalIncome: 'Total Income',
      totalOutcome: 'Total Outcome',
      balance: 'Balance',
      quickActions: 'Quick Actions',
      addIncome: 'Add Income',
      addOutcome: 'Add Outcome',
      recentTransactions: 'Recent Transactions',
      seeAll: 'See All',
      displayIn: 'Display in',
      noTransactions: 'No transactions yet. Start by adding income or outcome.',
      date: 'Date',
      category: 'Category',
      warningNoCurrency: 'You don\'t have any currency yet.',
      warningNoCategory: 'You don\'t have any category yet.',
      warningNoCurrencyAndCategory: 'You don\'t have any currency and category yet.',
      warningAddInSettings: 'Please add them in',
      warningToStartTransaction: 'to start adding transactions.',
      description: 'Description',
      amount: 'Amount',
      amountOriginal: 'Amount (Original)',
      amountConverted: 'Amount',
      thisMonthIncome: 'This Month Income',
      outcomeToday: 'Outcome Today',
      outcomeThisWeek: 'Outcome This Week',
      outcomeThisMonth: 'Outcome This Month',
      today: 'Today',
      additionalStats: 'Additional Statistics',
      accountBalances: 'Account Balances',
    },
    transactions: {
      title: 'Transactions',
      subtitle: 'Manage your income and outcome',
      addIncome: '+ Income',
      addOutcome: '+ Outcome',
      income: 'Income',
      outcome: 'Outcome',
      noTransactions: 'No transactions yet. Start by adding income or outcome.',
      date: 'Date',
      category: 'Category',
      description: 'Description',
      amount: 'Amount',
      amountOriginal: 'Amount (Original)',
      amountConverted: 'Amount',
      currency: 'Currency',
      search: 'Search',
      searchPlaceholder: 'Search transactions...',
      filter: 'Filter',
      sortBy: 'Sort By',
      sortDate: 'Date',
      sortAmount: 'Amount',
      sortCategory: 'Category',
      sortAsc: 'Ascending',
      sortDesc: 'Descending',
      dateRange: 'Date Range',
      dateFrom: 'From',
      dateTo: 'To',
      amountRange: 'Amount Range',
      amountMin: 'Min',
      amountMax: 'Max',
      selectCategory: 'Select Category',
      selectCurrency: 'Select Currency',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      bulkDelete: 'Delete Selected',
      selectAll: 'Select All',
      selected: 'selected',
      confirmDelete: 'Are you sure you want to delete this transaction?',
      confirmBulkDelete: 'Are you sure you want to delete {count} selected transactions?',
      deleteSuccess: 'Transaction deleted successfully',
      editTransaction: 'Edit Transaction',
      recurringTransactions: 'Recurring Transactions',
      addRecurring: 'Add Recurring Transaction',
      frequency: 'Frequency',
      weekly: 'Weekly',
      monthly: 'Monthly',
      nextDate: 'Next Date',
      endDate: 'End Date',
      active: 'Active',
      inactive: 'Inactive',
    },
    transactionModal: {
      addIncome: 'Add Income',
      addOutcome: 'Add Outcome',
      transactionType: 'Transaction Type',
      income: 'Income',
      outcome: 'Outcome',
      category: 'Category',
      categoryRequired: 'Category is required',
      amount: 'Amount',
      amountRequired: 'Amount is required',
      currency: 'Currency',
      currencyRequired: 'Currency is required',
      date: 'Date',
      dateRequired: 'Date is required',
      description: 'Description',
      descriptionOptional: 'Description (Optional)',
      descriptionPlaceholder: 'Add a note or description...',
      saving: 'Saving...',
      save: 'Save',
      cancel: 'Cancel',
      mustLogin: 'You must login first',
      success: 'Transaction added successfully',
      error: 'Failed to add transaction',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Manage your currencies and categories',
      currencies: 'Currencies',
      categories: 'Categories',
      accounts: 'Accounts',
      code: 'Code',
      name: 'Name',
      symbol: 'Symbol',
      exchangeRate: 'Exchange Rate',
      isDefault: 'Default',
      default: 'Default',
      type: 'Type',
      icon: 'Icon',
      color: 'Color',
      actions: 'Actions',
      addCurrency: 'Add Currency',
      editCurrency: 'Edit Currency',
      deleteCurrency: 'Delete',
      addCategory: 'Add Category',
      editCategory: 'Edit Category',
      deleteCategory: 'Delete',
      addAccount: 'Add Account',
      editAccount: 'Edit Account',
      deleteAccount: 'Delete',
      updateRates: '🔄 Update Exchange Rates',
      updatingRates: 'Updating...',
      confirmDelete: 'Are you sure you want to delete?',
      confirmDeleteCurrency: 'Are you sure you want to delete this currency?',
      confirmDeleteCategory: 'Are you sure you want to delete this category?',
      confirmDeleteAccount: 'Are you sure you want to delete this account?',
      noCurrency: 'No currencies yet. Add your first currency.',
      noCategory: 'No categories yet. Add your first category.',
      noAccount: 'No accounts yet. Add your first account.',
      base: 'Base',
      defaultCurrencyInfo: 'Info: Default Currency',
      defaultCurrencyDescription: 'You must set one currency as default (base currency). Exchange rates for other currencies will be converted relative to this base currency. Base currency has an exchange rate of 1.0.',
      setAsDefault: 'Set as default currency',
      setAsDefaultCategory: 'Set as default category',
      setAsDefaultAccount: 'Set as default account',
      codeCannotChange: 'Code cannot be changed when editing',
      selectOneOrMoreMonths: '(Select one or more months)',
      selectAll: 'Select All',
      removeAll: 'Remove All',
      selectAtLeastOneMonth: 'Select at least one month',
      accountType: 'Account Type',
      accountNumber: 'Account Number',
      accountDescription: 'Description',
      accountTypeCash: 'Cash',
      accountTypeBank: 'Bank',
      accountTypeCreditCard: 'Credit Card',
      accountTypeInvestment: 'Investment',
      accountTypeOther: 'Other',
      accountHasTransactions: 'Account cannot be deleted because it still has transactions',
    },
    profile: {
      title: 'Profile',
      subtitle: 'Manage your profile information',
      personalInfo: 'Personal Information',
      email: 'Email',
      fullName: 'Full Name',
      phone: 'Phone',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      update: 'Update',
      updateSuccess: 'Profile updated successfully',
      updateError: 'Failed to update profile',
    },
    auth: {
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      fullName: 'Full Name',
      phone: 'Phone',
      loginSuccess: 'Login successful',
      loginError: 'Login failed',
      registerSuccess: 'Registration successful',
      registerError: 'Registration failed',
      logout: 'Logout',
    },
    reports: {
      title: 'Reports',
      subtitle: 'Your monthly financial analysis',
      selectYear: 'Select Year',
      selectMonth: 'Select Month',
      allMonths: 'All Months',
      summary: 'Summary',
      monthlyTrends: 'Monthly Trends',
      categoryBreakdown: 'Category Breakdown',
      insights: 'Insights',
      totalIncome: 'Total Income',
      totalOutcome: 'Total Outcome',
      balance: 'Balance',
      totalTransactions: 'Total Transactions',
      avgTransaction: 'Average Transaction',
      topCategory: 'Top Category',
      avgCategorySpending: 'Average per Category',
      incomeGrowth: 'Income Growth',
      outcomeGrowth: 'Outcome Growth',
      comparedToPrevious: 'Compared to previous period',
      noData: 'No data for this period',
      loading: 'Loading data...',
    },
    budget: {
      title: 'Budget',
      subtitle: 'Manage budget per category',
      addBudget: 'Add Budget',
      editBudget: 'Edit Budget',
      deleteBudget: 'Delete Budget',
      category: 'Category',
      year: 'Year',
      month: 'Month',
      amount: 'Amount',
      currency: 'Currency',
      alertThreshold: 'Alert Threshold (%)',
      alertThresholdDesc: 'Notification will appear when spending reaches this threshold',
      spent: 'Spent',
      remaining: 'Remaining',
      budget: 'Budget',
      actual: 'Actual',
      exceeded: 'Exceeded Budget',
      nearLimit: 'Near Limit',
      noBudgets: 'No budgets yet. Add budgets for outcome categories.',
      selectCategory: 'Select Category',
      selectYear: 'Select Year',
      selectMonth: 'Select Month',
      confirmDelete: 'Are you sure you want to delete this budget?',
      confirmDeleteBudget: 'Are you sure you want to delete this budget?',
      budgetVsActual: 'Budget vs Actual',
      progress: 'Progress',
    },
    goals: {
      title: 'Savings Goals',
      subtitle: 'Manage your savings goals and track your progress',
      addGoal: 'Add Goal',
      editGoal: 'Edit Goal',
      deleteGoal: 'Delete Goal',
      goalTitle: 'Goal Title',
      description: 'Description',
      targetAmount: 'Target Amount',
      currentAmount: 'Current Amount',
      currency: 'Currency',
      deadline: 'Deadline',
      status: 'Status',
      progress: 'Progress',
      daysRemaining: 'Days Remaining',
      daysOverdue: 'Days Overdue',
      noDeadline: 'No deadline',
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled',
      noGoals: 'No goals yet. Add savings goals to start tracking your progress.',
      filterAll: 'All',
      filterActive: 'Active',
      filterCompleted: 'Completed',
      filterCancelled: 'Cancelled',
      confirmDelete: 'Are you sure you want to delete this goal?',
      goalCreated: 'Goal created successfully',
      goalUpdated: 'Goal updated successfully',
      goalDeleted: 'Goal deleted successfully',
      updateProgress: 'Update Progress',
      markCompleted: 'Mark Completed',
      markCancelled: 'Mark Cancelled',
      reactivate: 'Reactivate',
      overdue: 'Overdue',
    },
  },
};

